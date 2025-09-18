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
    console.error('Registration error:', error);
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
    console.error('Authentication error:', error);
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Map WebAuthn errors to user-friendly messages
 */
function getErrorMessage(error: any): string {
  if (error.name && error.name in errorMessages) {
    return errorMessages[error.name as keyof typeof errorMessages];
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'Something went wrong. Please try again or use email link.';
}

/**
 * Check if WebAuthn is supported
 */
export function isWebAuthnSupported(): boolean {
  return !!(
    window.PublicKeyCredential &&
    window.navigator.credentials &&
    window.navigator.credentials.create &&
    window.navigator.credentials.get
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
