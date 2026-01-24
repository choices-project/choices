/**
 * Native WebAuthn Client Implementation
 *
 * Direct browser WebAuthn API implementation without external dependencies
 * Replaces @simplewebauthn/browser with native browser API
 */

import { startAuthentication, startRegistration } from '@simplewebauthn/browser';

import { logger } from '../../../../../lib/utils/logger';

import type {
  PublicKeyCredentialCreationOptions,
  PublicKeyCredentialRequestOptions,
  RegistrationResponse,
  AuthenticationResponse,
  WebAuthnError,
  WebAuthnErrorMessages,
  AuthenticatorAttachment,
  UserVerificationRequirement,
} from './types';

// Error message mapping
const errorMessages: WebAuthnErrorMessages = {
  'NotAllowedError': 'Cancelled—try again when you\'re ready.',
  'NotSupportedError': 'This device doesn\'t support passkeys. Try email link instead.',
  'SecurityError': 'Security check failed. Please try again.',
  'UnknownError': 'Something went wrong. Please try again or use email link.',
  'AbortError': 'Operation was cancelled. Please try again.',
  'InvalidStateError': 'Invalid state. Please refresh and try again.',
  'ConstraintError': 'Constraint not satisfied. Please try again.',
  'NotReadableError': 'Device not readable. Please try again.',
  'NetworkError': 'Network error. Please check your connection and try again.'
};

/**
 * Check if WebAuthn is supported in the current browser
 */
export function isWebAuthnSupported(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return !!(
    window.PublicKeyCredential &&
    window.navigator.credentials &&
    typeof window.navigator.credentials.create === 'function' &&
    typeof window.navigator.credentials.get === 'function'
  );
}

/**
 * Check if platform authenticator is available
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) {
    return false;
  }

  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch (error) {
    logger.error('Error checking platform authenticator availability', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

/**
 * Check if biometric authentication is available
 */
export async function isBiometricAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) {
    return false;
  }

  try {
    // Check if the device supports biometric authentication
    const available = await window.navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array(32),
        allowCredentials: [],
        timeout: 1000,
        userVerification: 'required'
      }
    }).catch(() => null);

    return available !== null;
  } catch (error) {
    logger.error('Error checking WebAuthn support', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

/**
 * Convert native client extension results to our custom types
 */
function convertClientExtensionResults(results: any): any {
  // Simple pass-through for now to avoid complex type conversions
  return results;
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
 * Generate secure challenge
 */
export function generateChallenge(): Uint8Array {
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  return challenge;
}

export type BeginRegisterOptions = {
  username?: string;
  displayName?: string;
  authenticatorAttachment?: AuthenticatorAttachment;
  userVerification?: UserVerificationRequirement;
};

export type BeginAuthenticateOptions = {
  authenticatorAttachment?: AuthenticatorAttachment;
  userVerification?: UserVerificationRequirement;
};

type WebAuthnResult<TData = Record<string, unknown>> = {
  success: boolean;
  error?: string;
  data?: TData;
};

type ApiEnvelope<T> =
  | { success: true; data: T; metadata?: Record<string, unknown> }
  | { success: false; error: string; code?: string; details?: unknown; metadata?: Record<string, unknown> };

const extractApiData = <T>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'success' in payload) {
    const envelope = payload as ApiEnvelope<T>;
    if (envelope.success) {
      return envelope.data;
    }
    throw new Error(envelope.error ?? 'Request failed');
  }
  return payload as T;
};

const extractApiResult = <T>(payload: unknown): { data?: T; error?: string } => {
  if (payload && typeof payload === 'object' && 'success' in payload) {
    const envelope = payload as ApiEnvelope<T>;
    if (envelope.success) {
      return { data: envelope.data };
    }
    return { error: envelope.error ?? 'Request failed' };
  }
  return { data: payload as T };
};

/**
 * Create public key credential for registration
 */
export async function createCredential(options: PublicKeyCredentialCreationOptions): Promise<RegistrationResponse> {
  try {
    if (!isWebAuthnSupported()) {
      throw new Error('WebAuthn not supported');
    }

    const credential = await window.navigator.credentials.create({
      publicKey: options
    }) as PublicKeyCredential;

    if (!credential) {
      throw new Error('Failed to create credential');
    }

    const response = credential.response as AuthenticatorAttestationResponse;

    return {
      id: credential.id,
      rawId: arrayBufferToBase64URL(credential.rawId),
      response: {
        attestationObject: response.attestationObject,
        clientDataJSON: response.clientDataJSON
      },
      type: 'public-key',
      clientExtensionResults: convertClientExtensionResults(credential.getClientExtensionResults())
    };

  } catch (error) {
    logger.error('Error creating credential', error instanceof Error ? error : new Error(String(error)));
    throw mapWebAuthnError(error);
  }
}

/**
 * Get public key credential for authentication
 */
export async function getCredential(options: PublicKeyCredentialRequestOptions): Promise<AuthenticationResponse> {
  try {
    if (!isWebAuthnSupported()) {
      throw new Error('WebAuthn not supported');
    }

    const credential = await window.navigator.credentials.get({
      publicKey: options
    }) as PublicKeyCredential;

    if (!credential) {
      throw new Error('Failed to get credential');
    }

    const response = credential.response as AuthenticatorAssertionResponse;

    return {
      id: credential.id,
      rawId: arrayBufferToBase64URL(credential.rawId),
      response: {
        authenticatorData: response.authenticatorData,
        clientDataJSON: response.clientDataJSON,
        signature: response.signature,
        userHandle: response.userHandle
      },
      type: 'public-key',
      clientExtensionResults: convertClientExtensionResults(credential.getClientExtensionResults())
    };

  } catch (error) {
    logger.error('Error getting credential', error instanceof Error ? error : new Error(String(error)));
    throw mapWebAuthnError(error);
  }
}

/**
 * Map WebAuthn errors to user-friendly messages
 */
function mapWebAuthnError(error: unknown): WebAuthnError {
  if (error && typeof error === 'object' && 'name' in error && typeof error.name === 'string') {
    const errorName = error.name as keyof WebAuthnErrorMessages;
    if (errorName in errorMessages) {
      return new Error(errorMessages[errorName]) as WebAuthnError;
    }
  }

  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return new Error(error.message) as WebAuthnError;
  }

  return new Error('Something went wrong. Please try again or use email link.') as WebAuthnError;
}

/**
 * Begin WebAuthn registration
 */
export async function beginRegister(
  fetcher = fetch,
  options?: BeginRegisterOptions
): Promise<WebAuthnResult> {
  try {
    const rawOptions = await fetcher('/api/v1/auth/webauthn/native/register/options', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        username: options?.username,
        displayName: options?.displayName,
      }),
    }).then(r => r.json());

    const opts = extractApiData<any>(rawOptions);
    const registrationOptions = {
      ...opts,
      authenticatorSelection: {
        ...opts.authenticatorSelection,
        authenticatorAttachment:
          options?.authenticatorAttachment ?? opts.authenticatorSelection?.authenticatorAttachment,
        userVerification: options?.userVerification ?? opts.authenticatorSelection?.userVerification,
      },
    };

    const credential = await startRegistration(registrationOptions);

    const verifyPayload = await fetcher('/api/v1/auth/webauthn/native/register/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(credential),
    }).then(r => r.json());

    const verifyResult = extractApiResult<any>(verifyPayload);

    if (verifyResult.error) {
      return { success: false, error: verifyResult.error };
    }

    return { success: true, data: verifyResult.data };

  } catch (error) {
    logger.error('WebAuthn registration error', error instanceof Error ? error : new Error(String(error)));

    // Provide more helpful error messages
    let errorMessage = 'Registration failed';
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Registration was cancelled. Please try again when ready.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'This device doesn\'t support passkeys. Please use email/password authentication.';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Security check failed. Please refresh the page and try again.';
      } else if (error.name === 'NetworkError') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        errorMessage = error.message || 'Registration failed. Please try again or use email/password authentication.';
      }
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Begin WebAuthn authentication
 */
export async function beginAuthenticate(
  fetcher = fetch,
  options?: BeginAuthenticateOptions
): Promise<WebAuthnResult> {
  try {
    const rawOptions = await fetcher('/api/v1/auth/webauthn/native/authenticate/options', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userVerification: options?.userVerification,
        authenticatorAttachment: options?.authenticatorAttachment,
      }),
    }).then(r => r.json());

    const payload = extractApiData<any>(rawOptions);
    const challengeId = payload?.challengeId;
    if (!challengeId) {
      throw new Error('Missing authentication challenge');
    }
    const opts = payload?.options ?? payload;
    const authOptions = {
      ...opts,
      userVerification: options?.userVerification ?? opts.userVerification,
    };

    const assertion = await startAuthentication(authOptions);

    const verifyPayload = await fetcher('/api/v1/auth/webauthn/native/authenticate/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...assertion, challengeId }),
    }).then(r => r.json());

    const verifyResult = extractApiResult<any>(verifyPayload);

    if (verifyResult.error) {
      return { success: false, error: verifyResult.error };
    }

    return { success: true, data: verifyResult.data };

  } catch (error) {
    logger.error('WebAuthn authentication error', error instanceof Error ? error : new Error(String(error)));

    // Provide more helpful error messages
    let errorMessage = 'Authentication failed';
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Authentication was cancelled. Please try again when ready.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'This device doesn\'t support passkeys. Please use email/password authentication.';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Security check failed. Please refresh the page and try again.';
      } else if (error.name === 'NetworkError') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message?.includes('No credentials')) {
        errorMessage = 'No passkey found. Please register a passkey first or use email/password authentication.';
      } else {
        errorMessage = error.message || 'Authentication failed. Please try again or use email/password authentication.';
      }
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Register biometric authentication
 */
export async function registerBiometric(): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isWebAuthnSupported()) {
      return { success: false, error: 'WebAuthn not supported in this browser' };
    }

    // Check if biometric authentication is available
    const available = await isBiometricAvailable();
    if (!available) {
      return { success: false, error: 'Biometric authentication not available' };
    }

    // Use the existing registration flow
    const result = await beginRegister();
    return result.error ? { success: false, error: result.error } : { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Biometric registration failed'
    };
  }
}

/**
 * Get user credentials (placeholder - credentials are managed by browser)
 */
export async function getUserCredentials(): Promise<Credential[]> {
  try {
    if (!isWebAuthnSupported()) {
      return [];
    }

    // This would typically fetch from a secure storage or API
    // For now, we'll return an empty array as credentials are managed by the browser
    return [];
  } catch (error) {
    logger.error('Error getting user credentials', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
}

/**
 * Get privacy status
 */
export async function getPrivacyStatus(fetcher = fetch) {
  try {
    const response = await fetcher('/api/status/privacy');
    return response.json();
  } catch (error) {
    logger.error('Privacy status error', error instanceof Error ? error : new Error(String(error)));
    return {
      status: 'inactive',
      badge: { color: 'red', label: 'Privacy protections: ERROR' }
    };
  }
}
