// ============================================================================
// PHASE 1: PROOF-OF-PERSONHOOD WITH WEBAUTHN
// ============================================================================
// Agent A1 - Infrastructure Specialist
// 
// This module implements proof-of-personhood using WebAuthn passkeys for
// the Ranked Choice Democracy Revolution platform.
// 
// Features:
// - WebAuthn passkey registration and authentication
// - Device presence verification
// - Reputation score calculation
// - Constituent status verification
// - Blind-signed anonymous credentials
// 
// Created: January 15, 2025
// Status: Phase 1 Implementation
// ============================================================================

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface WebAuthnCredential {
  id: string;
  type: 'public-key';
  rawId: ArrayBuffer;
  response: AuthenticatorAttestationResponse | AuthenticatorAssertionResponse;
  clientExtensionResults: AuthenticationExtensionsClientOutputs;
}

export interface UserProfile {
  id: string;
  accountAge: number; // milliseconds since account creation
  responseEntropy: number; // measure of response diversity
  totalVotes: number;
  consistencyScore: number; // measure of voting consistency
  deviceCount: number;
  lastActiveAt: Date;
  trustTier: 'T0' | 'T1' | 'T2' | 'T3';
}

export interface ProofOfPersonhoodResult {
  verified: boolean;
  confidence: number; // 0-1 scale
  reputationScore: number; // 0-1 scale
  devicePresence: boolean;
  constituentStatus: boolean;
  metadata: {
    verificationMethod: string;
    timestamp: Date;
    riskFactors: string[];
  };
}

export interface ConstituentStatus {
  verified: boolean;
  jurisdiction: string;
  credential: string; // blind-signed credential
  expiresAt: Date;
  verificationMethod: 'address' | 'voter-registration' | 'government-id';
}

export interface ReputationMetrics {
  ageScore: number;
  consistencyScore: number;
  activityScore: number;
  deviceScore: number;
  overallScore: number;
}

// ============================================================================
// PROOF-OF-PERSONHOOD MANAGER
// ============================================================================

export class ProofOfPersonhoodManager {
  private rpId: string;
  private rpName: string;
  private origin: string;

  constructor(rpId = 'choices-platform.com', rpName = 'Choices Platform') {
    this.rpId = rpId;
    this.rpName = rpName;
    this.origin = typeof window !== 'undefined' ? window.location.origin : 'https://choices-platform.com';
  }

  // ============================================================================
  // WEBAUTHN REGISTRATION
  // ============================================================================

  async registerPasskey(userId: string, userName: string): Promise<WebAuthnCredential> {
    try {
      const challenge = this.generateChallenge();
      const userIdBuffer = new TextEncoder().encode(userId);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: challenge as BufferSource,
          rp: {
            id: this.rpId,
            name: this.rpName
          },
          user: {
            id: userIdBuffer,
            name: userName,
            displayName: userName
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 }, // ES256
            { type: 'public-key', alg: -257 } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform', // Prefer platform authenticators
            userVerification: 'required',
            residentKey: 'preferred'
          },
          timeout: 60000,
          attestation: 'direct'
        }
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create WebAuthn credential');
      }

      return {
        id: credential.id,
        type: credential.type as 'public-key',
        rawId: credential.rawId,
        response: credential.response as AuthenticatorAttestationResponse,
        clientExtensionResults: credential.getClientExtensionResults()
      };
    } catch (error) {
      console.error('WebAuthn registration failed:', error);
      throw new Error(`Passkey registration failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ============================================================================
  // WEBAUTHN AUTHENTICATION
  // ============================================================================

  async authenticatePasskey(credentialId: string): Promise<WebAuthnCredential> {
    try {
      const challenge = this.generateChallenge();
      const credentialIdBuffer = this.base64ToArrayBuffer(credentialId);

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: challenge as BufferSource,
          allowCredentials: [{
            type: 'public-key',
            id: credentialIdBuffer
          }],
          userVerification: 'required',
          timeout: 60000
        }
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to authenticate with WebAuthn');
      }

      return {
        id: credential.id,
        type: credential.type as 'public-key',
        rawId: credential.rawId,
        response: credential.response as AuthenticatorAssertionResponse,
        clientExtensionResults: credential.getClientExtensionResults()
      };
    } catch (error) {
      console.error('WebAuthn authentication failed:', error);
      throw new Error(`Passkey authentication failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ============================================================================
  // DEVICE PRESENCE VERIFICATION
  // ============================================================================

  async verifyDevicePresence(): Promise<boolean> {
    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        return false;
      }

      // Check if platform authenticator is available
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        return false;
      }

      // Attempt a simple authentication to verify device presence
      const challenge = this.generateChallenge();
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: challenge as BufferSource,
          rp: { name: this.rpName },
          user: {
            id: new TextEncoder().encode('presence-check'),
            name: 'presence-check',
            displayName: 'Presence Check'
          },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
          authenticatorSelection: {
            userVerification: 'required'
          },
          timeout: 30000
        }
      });

      return !!credential;
    } catch (error) {
      console.error('Device presence verification failed:', error);
      return false;
    }
  }

  // ============================================================================
  // REPUTATION SCORE CALCULATION
  // ============================================================================

  calculateReputationScore(userProfile: UserProfile): ReputationMetrics {
    // Age score (0-1): Higher for older accounts
    const ageScore = Math.min(userProfile.accountAge / (365 * 24 * 60 * 60 * 1000), 2) / 2;
    
    // Consistency score (0-1): Higher for consistent voting patterns
    const consistencyScore = Math.min(userProfile.consistencyScore, 1);
    
    // Activity score (0-1): Higher for active users
    const activityScore = Math.min(userProfile.totalVotes / 100, 1);
    
    // Device score (0-1): Higher for users with multiple verified devices
    const deviceScore = Math.min(userProfile.deviceCount / 3, 1);
    
    // Overall score (weighted average)
    const overallScore = (
      ageScore * 0.3 +
      consistencyScore * 0.3 +
      activityScore * 0.2 +
      deviceScore * 0.2
    );

    return {
      ageScore,
      consistencyScore,
      activityScore,
      deviceScore,
      overallScore
    };
  }

  // ============================================================================
  // CONSTITUENT STATUS VERIFICATION
  // ============================================================================

  async verifyConstituentStatus(address: string): Promise<ConstituentStatus> {
    try {
      // On-device jurisdiction determination
      const jurisdiction = await this.determineJurisdiction(address);
      
      if (!jurisdiction) {
        return {
          verified: false,
          jurisdiction: '',
          credential: '',
          expiresAt: new Date(),
          verificationMethod: 'address'
        };
      }

      // Generate blind-signed credential
      const credential = await this.generateBlindSignedCredential(jurisdiction);
      
      return {
        verified: true,
        jurisdiction,
        credential,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        verificationMethod: 'address'
      };
    } catch (error) {
      console.error('Constituent status verification failed:', error);
      return {
        verified: false,
        jurisdiction: '',
        credential: '',
        expiresAt: new Date(),
        verificationMethod: 'address'
      };
    }
  }

  // ============================================================================
  // COMPREHENSIVE PROOF-OF-PERSONHOOD
  // ============================================================================

  async verifyProofOfPersonhood(
    userId: string, 
    userProfile: UserProfile,
    address?: string
  ): Promise<ProofOfPersonhoodResult> {
    const riskFactors: string[] = [];
    let confidence = 0;
    let devicePresence = false;
    let constituentStatus = false;

    try {
      // Verify device presence
      devicePresence = await this.verifyDevicePresence();
      if (devicePresence) {
        confidence += 0.4;
      } else {
        riskFactors.push('no-device-presence');
      }

      // Calculate reputation score
      const reputationMetrics = this.calculateReputationScore(userProfile);
      const reputationScore = reputationMetrics.overallScore;
      
      if (reputationScore > 0.7) {
        confidence += 0.3;
      } else if (reputationScore < 0.3) {
        riskFactors.push('low-reputation-score');
      }

      // Verify constituent status if address provided
      if (address) {
        const constituent = await this.verifyConstituentStatus(address);
        constituentStatus = constituent.verified;
        
        if (constituentStatus) {
          confidence += 0.3;
        } else {
          riskFactors.push('constituent-status-unverified');
        }
      }

      // Check for risk factors
      if (userProfile.accountAge < 24 * 60 * 60 * 1000) { // Less than 1 day
        riskFactors.push('new-account');
        confidence -= 0.1;
      }

      if (userProfile.deviceCount === 1) {
        riskFactors.push('single-device');
        confidence -= 0.05;
      }

      // Ensure confidence is between 0 and 1
      confidence = Math.max(0, Math.min(1, confidence));

      return {
        verified: confidence > 0.6,
        confidence,
        reputationScore,
        devicePresence,
        constituentStatus,
        metadata: {
          verificationMethod: 'webauthn-passkey',
          timestamp: new Date(),
          riskFactors
        }
      };
    } catch (error) {
      console.error('Proof-of-personhood verification failed:', error);
      return {
        verified: false,
        confidence: 0,
        reputationScore: 0,
        devicePresence: false,
        constituentStatus: false,
        metadata: {
          verificationMethod: 'webauthn-passkey',
          timestamp: new Date(),
          riskFactors: ['verification-error']
        }
      };
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private generateChallenge(): Uint8Array {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    return challenge;
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      const byte = bytes[i] ?? 0;
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  }

  private async determineJurisdiction(address: string): Promise<string | null> {
    // This would typically use a geocoding service or address validation API
    // For now, return a mock jurisdiction
    try {
      // Mock implementation - in production, use real geocoding
      const mockJurisdictions = ['CA-12', 'NY-14', 'TX-28', 'FL-27'];
      const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(address));
      const hashArray = new Uint8Array(hash);
      const firstByte = hashArray[0];
      if (firstByte !== undefined) {
        const index = firstByte % mockJurisdictions.length;
        return mockJurisdictions[index] ?? null;
      }
      return mockJurisdictions[0] ?? null;
    } catch (error) {
      console.error('Jurisdiction determination failed:', error);
      return null;
    }
  }

  private async generateBlindSignedCredential(jurisdiction: string): Promise<string> {
    // This would typically use a blind signature scheme
    // For now, return a mock credential
    const credentialData = {
      jurisdiction,
      issuedAt: Date.now(),
      expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000,
      issuer: 'choices-platform'
    };

    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(credentialData)));
    return this.arrayBufferToBase64(hash);
  }
}

// ============================================================================
// EXPORTED UTILITY FUNCTIONS
// ============================================================================

export async function checkWebAuthnSupport(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  return !!(
    window.PublicKeyCredential &&
    window.navigator.credentials &&
    typeof window.navigator.credentials.create === 'function' &&
    typeof window.navigator.credentials.get === 'function'
  );
}

export async function checkPlatformAuthenticator(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function calculateUserEntropy(votingHistory: any[]): number {
  // Calculate entropy based on voting patterns
  if (votingHistory.length === 0) return 0;
  
  const patterns = new Map();
  votingHistory.forEach(vote => {
    const pattern = JSON.stringify(vote.choices);
    patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
  });
  
  let entropy = 0;
  const total = votingHistory.length;
  
  patterns.forEach(count => {
    const probability = count / total;
    entropy -= probability * Math.log2(probability);
  });
  
  return entropy;
}

// ============================================================================
// EXPORTED CLASS
// ============================================================================

export default ProofOfPersonhoodManager;
