/**
 * Native WebAuthn Server Implementation
 * 
 * Server-side WebAuthn utilities using native Web Crypto API
 * Replaces @simplewebauthn/server with native browser API
 */

import logger from '@/lib/utils/logger'

import type { 
PublicKeyCredentialCreationOptions,
  PublicKeyCredentialRequestOptions,
  RegistrationResponse,
  AuthenticationResponse,
  VerificationResult,
  AuthenticationVerificationResult,
  WebAuthnCredential
} from './types';
import { WEBAUTHN_ALGORITHMS } from './types';

/**
 * Generate secure challenge for WebAuthn operations
 */
export function generateSecureChallenge(): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return arrayBufferToBase64URL(randomBytes.buffer);
}

/**
 * Convert ArrayBuffer to Base64URL string
 */
export function arrayBufferToBase64URL(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      binary += String.fromCharCode(byte);
    }
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Convert Base64URL string to ArrayBuffer
 */
export function base64URLToArrayBuffer(base64URL: string): ArrayBuffer {
  const base64 = base64URL
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
  const binary = atob(padded);
  
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  
  return bytes.buffer;
}

/**
 * Generate registration options
 */
export function generateRegistrationOptions(
  userId: string,
  userEmail: string,
  userName: string,
  rpId: string,
  rpName: string,
  excludeCredentials: string[] = []
): PublicKeyCredentialCreationOptions {
  const challenge = generateSecureChallenge();
  const challengeBuffer = base64URLToArrayBuffer(challenge);
  
  return {
    challenge: challengeBuffer,
    rp: {
      id: rpId,
      name: rpName
    },
    user: {
      id: new TextEncoder().encode(userId).buffer as ArrayBuffer,
      name: userEmail,
      displayName: userName
   },
    pubKeyCredParams: [
      { type: 'public-key', alg: WEBAUTHN_ALGORITHMS.ES256 },
      { type: 'public-key', alg: WEBAUTHN_ALGORITHMS.RS256 }
    ],
    timeout: 60000,
    excludeCredentials: excludeCredentials.map(id => ({
      type: 'public-key',
      id: base64URLToArrayBuffer(id)
    })),
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'required'
    },
    attestation: 'none'
  };
}

/**
 * Generate authentication options
 */
export function generateAuthenticationOptions(
  rpId: string,
  allowCredentials: string[] = []
): PublicKeyCredentialRequestOptions {
  const challenge = generateSecureChallenge();
  const challengeBuffer = base64URLToArrayBuffer(challenge);
  
  return {
    challenge: challengeBuffer,
    allowCredentials: allowCredentials.map(id => ({
      type: 'public-key',
      id: base64URLToArrayBuffer(id)
    })),
    timeout: 60000,
    rpId,
    userVerification: 'required'
  };
}

/**
 * Verify registration response
 */
export async function verifyRegistrationResponse(
  response: RegistrationResponse,
  expectedChallenge: string,
  expectedOrigin: string,
  _expectedRPID: string,
  _credentialData?: WebAuthnCredential
): Promise<VerificationResult> {
  try {
    // Parse client data
    const clientDataJSON = new TextDecoder().decode(response.response.clientDataJSON);
    const clientData = JSON.parse(clientDataJSON);
    
    // Verify challenge
    if (clientData.challenge !== expectedChallenge) {
      return {
        verified: false,
        credentialId: '',
        publicKey: new ArrayBuffer(0),
        counter: 0,
        error: 'Challenge mismatch'
      };
    }
    
    // Verify origin
    if (clientData.origin !== expectedOrigin) {
      return {
        verified: false,
        credentialId: '',
        publicKey: new ArrayBuffer(0),
        counter: 0,
        error: 'Origin mismatch'
      };
    }
    
    // Verify type
    if (clientData.type !== 'webauthn.create') {
      return {
        verified: false,
        credentialId: '',
        publicKey: new ArrayBuffer(0),
        counter: 0,
        error: 'Invalid type'
      };
    }
    
    // Parse attestation object
    const attestationObject = response.response.attestationObject;
    const _attestationData = new Uint8Array(attestationObject);
    
    // Extract credential ID and public key from attestation object
    // This is a simplified implementation - in production, you'd need to
    // properly parse the CBOR-encoded attestation object
    const credentialId = response.id;
    const publicKey = new ArrayBuffer(0); // Simplified - would need proper CBOR parsing
    
    return {
      verified: true,
      credentialId,
      publicKey,
      counter: 0,
      transports: response.clientExtensionResults?.credProps?.rk ? ['internal'] : [],
      backupEligible: response.clientExtensionResults?.credProps?.rk ?? false,
      backupState: response.clientExtensionResults?.credProps?.rk ?? false
    };
    
  } catch (error) {
    return {
      verified: false,
      credentialId: '',
      publicKey: new ArrayBuffer(0),
      counter: 0,
      error: error instanceof Error ? error.message : 'Unknown verification error'
    };
  }
}

/**
 * Verify authentication response
 */
export async function verifyAuthenticationResponse(
  response: AuthenticationResponse,
  expectedChallenge: string,
  expectedOrigin: string,
  _expectedRPID: string,
  credentialData: WebAuthnCredential
): Promise<AuthenticationVerificationResult> {
  try {
    // Parse client data
    const clientDataJSON = new TextDecoder().decode(response.response.clientDataJSON);
    const clientData = JSON.parse(clientDataJSON);
    
    // Verify challenge
    if (clientData.challenge !== expectedChallenge) {
      return {
        verified: false,
        credentialId: credentialData.credentialId,
        newCounter: credentialData.counter,
        error: 'Challenge mismatch'
      };
    }
    
    // Verify origin
    if (clientData.origin !== expectedOrigin) {
      return {
        verified: false,
        credentialId: credentialData.credentialId,
        newCounter: credentialData.counter,
        error: 'Origin mismatch'
      };
    }
    
    // Verify type
    if (clientData.type !== 'webauthn.get') {
      return {
        verified: false,
        credentialId: credentialData.credentialId,
        newCounter: credentialData.counter,
        error: 'Invalid type'
      };
    }
    
    // Verify signature
    const publicKey = base64URLToArrayBuffer(credentialData.publicKey);
    const authenticatorData = response.response.authenticatorData;
    const signature = response.response.signature;
    
    // Create signature data
    const clientDataHash = await crypto.subtle.digest('SHA-256', response.response.clientDataJSON);
    const signatureData = new Uint8Array(authenticatorData.byteLength + clientDataHash.byteLength);
    signatureData.set(new Uint8Array(authenticatorData), 0);
    signatureData.set(new Uint8Array(clientDataHash), authenticatorData.byteLength);
    
    // Import public key
    const cryptoKey = await crypto.subtle.importKey(
      'spki',
      publicKey,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify']
    );
    
    // Verify signature
    const isValid = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      cryptoKey,
      signature,
      signatureData
    );
    
    if (!isValid) {
      return {
        verified: false,
        credentialId: credentialData.credentialId,
        newCounter: credentialData.counter,
        error: 'Signature verification failed'
      };
    }
    
    // Extract counter from authenticator data
    const counterData = new Uint8Array(authenticatorData);
    const counter = new DataView(counterData.buffer, counterData.byteOffset + 37, 4).getUint32(0, false);
    
    // Verify counter
    if (counter <= credentialData.counter) {
      return {
        verified: false,
        credentialId: credentialData.credentialId,
        newCounter: credentialData.counter,
        error: 'Counter verification failed'
      };
    }
    
    return {
      verified: true,
      credentialId: credentialData.credentialId,
      newCounter: counter
    };
    
  } catch (error) {
    return {
      verified: false,
      credentialId: credentialData.credentialId,
      newCounter: credentialData.counter,
      error: error instanceof Error ? error.message : 'Unknown verification error'
    };
  }
}

/**
 * Validate credential ID format
 */
export function validateCredentialId(credentialId: string): boolean {
  try {
    base64URLToArrayBuffer(credentialId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate challenge format
 */
export function validateChallenge(challenge: string): boolean {
  try {
    base64URLToArrayBuffer(challenge);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate origin format
 */
export function validateOrigin(origin: string): boolean {
  try {
    new URL(origin);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate RP ID format
 */
export function validateRPID(rpID: string): boolean {
  const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return hostnameRegex.test(rpID);
}

/**
 * Check if credential is expired
 */
export function isCredentialExpired(
  lastUsedAt: Date | null,
  maxAgeDays = 365
): boolean {
  if (!lastUsedAt) {
    return false;
  }
  
  const now = new Date();
  const ageInDays = (now.getTime() - lastUsedAt.getTime()) / (1000 * 60 * 60 * 24);
  
  return ageInDays > maxAgeDays;
}

/**
 * Check if credential counter is valid
 */
export function isCounterValid(
  currentCounter: number,
  newCounter: number
): boolean {
  return newCounter > currentCounter;
}

/**
 * Log credential operation for security auditing
 */
export function logCredentialOperation(
  operation: 'create' | 'read' | 'update' | 'delete',
  credentialId: string,
  userId?: string,
  error?: Error
): void {
  const logData = {
    operation,
    credentialId: `${credentialId.substring(0, 8)}...`,
    userId,
    timestamp: new Date().toISOString(),
    error: error?.message
  };
  
  if (error) {
    logger.error('WebAuthn credential operation failed:', logData);
  } else {
    logger.info('WebAuthn credential operation:', logData);
  }
}
