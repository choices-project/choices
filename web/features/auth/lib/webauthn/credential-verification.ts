/**
 * WebAuthn Credential Verification
 * 
 * Handles credential verification logic for WebAuthn operations.
 * Provides utilities for verifying registration and authentication responses.
 */

// Import native WebAuthn implementation
import { devLog } from '@/lib/utils/logger';

import { 
  verifyRegistrationResponse,
  verifyAuthenticationResponse
} from './native/server';
import type { 
  RegistrationResponse,
  AuthenticationResponse,
  WebAuthnCredential
} from './native/types';
import { 
  arrayBufferToBase64url,
  base64urlToArrayBuffer
} from './type-converters';

/**
 * WebAuthn credential data from database
 */
export type WebAuthnCredentialData = {
  credentialId: string;
  publicKey: string; // BYTEA format
  counter: number;
  transports?: string[];
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
export type RegistrationVerificationResult = {
  verified: boolean;
  credentialId: string;
  publicKey: ArrayBuffer;
  counter: number;
  transports?: string[];
  backupEligible?: boolean;
  backupState?: boolean;
  aaguid?: string;
  userHandle?: ArrayBuffer | null;
  error?: string;
}

/**
 * Verification result for authentication
 */
export type AuthenticationVerificationResult = {
  verified: boolean;
  credentialId: string;
  newCounter: number;
  error?: string;
}

/**
 * Verify WebAuthn registration response
 */
export async function verifyCredentialRegistration(
  response: RegistrationResponse,
  expectedChallenge: string,
  expectedOrigin: string,
  expectedRPID: string,
  credentialData?: WebAuthnCredentialData
): Promise<RegistrationVerificationResult> {
  try {
    // If credentialData is provided, log the expected state for auditing
    if (credentialData) {
      devLog('Expected credential backup state:', { backupEligible: credentialData.backupEligible });
    }

    // Use native WebAuthn verification
    const verification = await verifyRegistrationResponse(
      response,
      expectedChallenge,
      expectedOrigin,
      expectedRPID
    );

    if (!verification.verified) {
      return {
        verified: false,
        credentialId: '',
        publicKey: new ArrayBuffer(0),
        counter: 0,
        error: 'Registration verification failed'
      };
    }

    // Extract credential information from native response
    return {
      verified: true,
      credentialId: verification.credentialId,
      publicKey: verification.publicKey,
      counter: verification.counter,
      transports: verification.transports,
      backupEligible: verification.backupEligible,
      backupState: verification.backupState,
      aaguid: verification.aaguid,
      userHandle: verification.userHandle,
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
  response: AuthenticationResponse,
  expectedChallenge: string,
  expectedOrigin: string,
  expectedRPID: string,
  credentialData: WebAuthnCredentialData
): Promise<AuthenticationVerificationResult> {
  try {
    // Convert database format to WebAuthnCredential
    const credential: WebAuthnCredential = {
      id: credentialData.credentialId,
      userId: '', // Not needed for verification
      rpId: expectedRPID,
      credentialId: credentialData.credentialId,
      publicKey: credentialData.publicKey,
      counter: credentialData.counter,
      transports: credentialData.transports as any,
      backupEligible: credentialData.backupEligible,
      backupState: credentialData.backupState,
      aaguid: credentialData.aaguid,
      userHandle: credentialData.userHandle,
      createdAt: credentialData.createdAt,
      lastUsedAt: credentialData.lastUsedAt
    };

    // Log credential ID for debugging
    devLog('Verifying credential', {
      credentialId: `${credentialData.credentialId.substring(0, 8)}...`,
      credentialIdLength: credentialData.credentialId.length
    });

    // Use native WebAuthn verification
    const verification = await verifyAuthenticationResponse(
      response,
      expectedChallenge,
      expectedOrigin,
      expectedRPID,
      credential
    );

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
      newCounter: verification.newCounter,
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
  maxAgeDays = 365
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
    credentialId: `${credentialId.substring(0, 8)  }...`, // Truncate for security
    userId,
    timestamp: new Date().toISOString(),
    error: error?.message
  };

  if (error) {
    devLog('WebAuthn credential operation failed:', logData);
  } else {
    devLog('WebAuthn credential operation:', logData);
  }
}
