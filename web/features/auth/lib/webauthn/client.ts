import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { errorMessages } from './config';

/**
 * WebAuthn Client Helpers
 * 
 * Minimal client-side functions for WebAuthn operations
 */

export async function beginRegister(fetcher = fetch) {
  try {
    const opts = await fetcher('/api/v1/auth/webauthn/register/options', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(r => r.json());

    if (opts.error) {
      throw new Error(opts.error);
    }

    const attResp = await startRegistration(opts);
    
    return fetcher('/api/v1/auth/webauthn/register/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(attResp),
    }).then(r => r.json());

  } catch (error) {
    // Use proper logging instead of console.error
    if (process.env.NODE_ENV === 'development') {
      console.error('Registration error:', error);
    }
    throw new Error(getErrorMessage(error));
  }
}

export async function beginAuthenticate(fetcher = fetch) {
  try {
    const opts = await fetcher('/api/v1/auth/webauthn/authenticate/options', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(r => r.json());

    if (opts.error) {
      throw new Error(opts.error);
    }

    const assertion = await startAuthentication(opts);
    
    return fetcher('/api/v1/auth/webauthn/authenticate/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assertion),
    }).then(r => r.json());

  } catch (error) {
    // Use proper logging instead of console.error
    if (process.env.NODE_ENV === 'development') {
      console.error('Authentication error:', error);
    }
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
  // Check if we're in a browser environment
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
 * Get privacy status
 */
export async function getPrivacyStatus(fetcher = fetch) {
  try {
    const response = await fetcher('/api/status/privacy');
    return response.json();
  } catch (error) {
    console.error('Privacy status error:', error);
    return {
      status: 'inactive',
      badge: { color: 'red', label: 'Privacy protections: ERROR' }
    };
  }
}

// MVP stub functions for backward compatibility
export async function registerBiometric(): Promise<{ success: boolean; error?: string }> {
  if (process.env.NODE_ENV === 'development') {
    console.warn('registerBiometric: Using MVP stub - implement for full functionality');
  }
  return { success: false, error: 'Not implemented in MVP' };
}

export async function isBiometricAvailable(): Promise<boolean> {
  if (process.env.NODE_ENV === 'development') {
    console.warn('isBiometricAvailable: Using MVP stub - implement for full functionality');
  }
  return false;
}

export async function getUserCredentials(): Promise<unknown[]> {
  if (process.env.NODE_ENV === 'development') {
    console.warn('getUserCredentials: Using MVP stub - implement for full functionality');
  }
  return [];
}
