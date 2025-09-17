/**
 * WebAuthn Credential Verification
 * 
 * Handles credential verification logic for WebAuthn operations.
 * Provides utilities for verifying registration and authentication responses.
 */

import { 
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
  type VerifyRegistrationResponseOpts,
  type VerifyAuthenticationResponseOpts,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture
} from '@simplewebauthn/server';
import { 
  arrayBufferToBase64url,
  base64urlToArrayBuffer,
  byteaToArrayBuffer
} from './type-converters';
import { devLog } from '@/lib/logger';

/**
 * WebAuthn credential data from database
 */
export interface WebAuthnCredentialData {
  credentialId: string;
  publicKey: string; // BYTEA format
  counter: number;
  transports?: AuthenticatorTransportFuture[];
  backupEligible?: boolean;
  backupState?: boolean;
  aaguid?: string; // BYTEA format
  userHandle?: string; // BYTEA format
  createdAt: Date;
  lastUsedAt?: Date;
}

/**
 * Verification result for registration
 */
export interface RegistrationVerificationResult {
  verified: boolean;
  credentialId: string;
  publicKey: ArrayBuffer;
  counter: number;
  transports?: AuthenticatorTransportFuture[];
  backupEligible?: boolean;
  backupState?: boolean;
  aaguid?: string; // WebAuthn aaguid is a string in @simplewebauthn/server v13.2.0
  userHandle?: ArrayBuffer | null; // Can be null if not available
  error?: string;
}

/**
 * Verification result for authentication
 */
export interface AuthenticationVerificationResult {
  verified: boolean;
  credentialId: string;
  newCounter: number;
  error?: string;
}

/**
 * Verify WebAuthn registration response
 */
export async function verifyCredentialRegistration(
  response: RegistrationResponseJSON,
  expectedChallenge: string,
  expectedOrigin: string,
  expectedRPID: string,
  credentialData?: WebAuthnCredentialData
): Promise<RegistrationVerificationResult> {
  try {
    // Prepare verification options
    const verificationOptions: VerifyRegistrationResponseOpts = {
      response,
      expectedChallenge,
      expectedOrigin,
      expectedRPID,
      requireUserVerification: true,
    };

    // If credentialData is provided, use it to set expected backup state
    if (credentialData) {
      // Note: expectedCredentialBackupState and expectedCredentialDeviceType are not supported
      // in @simplewebauthn/server v13.2.0, but we can log the expected state for auditing
      console.log('Expected credential backup state:', credentialData.backupEligible);
    }

    // Verify the registration response
    const verification = await verifyRegistrationResponse(verificationOptions);

    if (!verification.verified) {
      return {
        verified: false,
        credentialId: '',
        publicKey: new ArrayBuffer(0),
        counter: 0,
        error: 'Registration verification failed'
      };
    }

    // Extract credential information
    const credential = verification.registrationInfo;
    
    return {
      verified: true,
      credentialId: credential.credential.id,
      publicKey: credential.credential.publicKey.buffer,
      counter: credential.credential.counter,
      transports: response.response.transports || [],
      backupEligible: credential.credentialBackedUp,
      backupState: credential.credentialBackedUp,
      aaguid: credential.aaguid,
      userHandle: null, // userHandle is not available in registrationInfo
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
 * Verify WebAuthn authentication response
 */
export async function verifyCredentialAuthentication(
  response: AuthenticationResponseJSON,
  expectedChallenge: string,
  expectedOrigin: string,
  expectedRPID: string,
  credentialData: WebAuthnCredentialData
): Promise<AuthenticationVerificationResult> {
  try {
    // Convert database format to ArrayBuffer
    const publicKey = byteaToArrayBuffer(credentialData.publicKey);
    const credentialID = base64urlToArrayBuffer(credentialData.credentialId);

    // Prepare verification options
    const verificationOptions: VerifyAuthenticationResponseOpts = {
      response,
      expectedChallenge,
      expectedOrigin,
      expectedRPID,
      credential: {
        id: credentialData.credentialId,
        publicKey: new Uint8Array(publicKey),
        counter: credentialData.counter,
        transports: credentialData.transports || []
      },
      requireUserVerification: true,
    };

    // Log credential ID for debugging (using the converted ArrayBuffer)
    devLog('Verifying credential', {
      credentialId: credentialData.credentialId.substring(0, 8) + '...',
      credentialIdLength: credentialID.byteLength
    });

    // Verify the authentication response
    const verification = await verifyAuthenticationResponse(verificationOptions);

    if (!verification.verified) {
      return {
        verified: false,
        credentialId: credentialData.credentialId,
        newCounter: credentialData.counter,
        error: 'Authentication verification failed'
      };
    }

    return {
      verified: true,
      credentialId: credentialData.credentialId,
      newCounter: verification.authenticationInfo.newCounter,
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
    // Try to convert to ArrayBuffer to validate format
    base64urlToArrayBuffer(credentialId);
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
    // Try to convert to ArrayBuffer to validate format
    base64urlToArrayBuffer(challenge);
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
  // RP ID should be a valid hostname
  const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return hostnameRegex.test(rpID);
}

/**
 * Check if credential is expired (based on last used date)
 */
export function isCredentialExpired(
  lastUsedAt: Date | null,
  maxAgeDays: number = 365
): boolean {
  if (!lastUsedAt) {
    return false; // Never used, not expired
  }

  const now = new Date();
  const ageInDays = (now.getTime() - lastUsedAt.getTime()) / (1000 * 60 * 60 * 24);
  
  return ageInDays > maxAgeDays;
}

/**
 * Check if credential counter is valid (prevents replay attacks)
 */
export function isCounterValid(
  currentCounter: number,
  newCounter: number
): boolean {
  // New counter must be greater than current counter
  return newCounter > currentCounter;
}

/**
 * Generate secure challenge for WebAuthn operations
 */
export function generateSecureChallenge(): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return arrayBufferToBase64url(randomBytes.buffer);
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
    credentialId: credentialId.substring(0, 8) + '...', // Truncate for security
    userId,
    timestamp: new Date().toISOString(),
    error: error?.message
  };

  if (error) {
    console.error('WebAuthn credential operation failed:', logData);
  } else {
    console.log('WebAuthn credential operation:', logData);
  }
}
