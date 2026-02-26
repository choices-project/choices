// Native WebAuthn implementation to avoid decorator issues
import { logger } from '@/lib/utils/logger';

import { errorMessages } from './config';
import { 
  beginRegister as nativeBeginRegister,
  beginAuthenticate as nativeBeginAuthenticate,
  registerBiometric as nativeRegisterBiometric,
  isWebAuthnSupported as nativeIsWebAuthnSupported,
  isBiometricAvailable as nativeIsBiometricAvailable,
  getUserCredentials as nativeGetUserCredentials,
  getPrivacyStatus as nativeGetPrivacyStatus,
  type BeginRegisterOptions,
  type BeginAuthenticateOptions,
} from './native/client';


/**
 * WebAuthn Client Helpers
 * 
 * Minimal client-side functions for WebAuthn operations
 */

export async function beginRegister(
  options?: BeginRegisterOptions,
  fetcher = fetch
) {
  try {
    // Use native implementation
    const result = await nativeBeginRegister(fetcher, options);
    return result;
  } catch (error) {
    // Use proper logging instead of console.error
    logger.error('WebAuthn registration error', error instanceof Error ? error : new Error(String(error)));
    throw new Error(getErrorMessage(error));
  }
}

export async function beginAuthenticate(
  options?: BeginAuthenticateOptions,
  fetcher = fetch
) {
  try {
    // Use native implementation
    const result = await nativeBeginAuthenticate(fetcher, options);
    return result;
  } catch (error) {
    // Use proper logging instead of console.error
    logger.error('WebAuthn authentication error', error instanceof Error ? error : new Error(String(error)));
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Map WebAuthn errors to user-friendly messages
 */
function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'name' in error && typeof error.name === 'string' && error.name in errorMessages) {
    return errorMessages[error.name as keyof typeof errorMessages];
  }
  
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  
  return 'Something went wrong. Please try again or use email link.';
}

/**
 * Check if WebAuthn is supported
 */
export function isWebAuthnSupported(): boolean {
  return nativeIsWebAuthnSupported();
}

/**
 * Get privacy status
 */
export async function getPrivacyStatus(fetcher = fetch) {
  return nativeGetPrivacyStatus(fetcher);
}

/**
 * Register biometric authentication
 */
export async function registerBiometric(): Promise<{ success: boolean; error?: string }> {
  return nativeRegisterBiometric();
}

/**
 * Check if biometric authentication is available
 */
export async function isBiometricAvailable(): Promise<boolean> {
  return nativeIsBiometricAvailable();
}

/**
 * Get user credentials (fetches from API; requires session).
 * Returns [] when not authenticated or on error.
 */
export async function getUserCredentials(fetcher = fetch): Promise<Array<{ id: string }>> {
  return nativeGetUserCredentials(fetcher);
}
