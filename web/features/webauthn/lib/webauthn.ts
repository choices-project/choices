/**
 * WebAuthn Module
 * 
 * Basic WebAuthn functionality for biometric authentication.
 * This is a stub implementation to resolve import errors.
 */

export interface WebAuthnCredential {
  id: string;
  type: 'public-key';
  transports?: string[];
}

// Fix credential typing
interface AuthenticatorAttestationResponse extends AuthenticatorResponse {
  attestationObject: ArrayBuffer;
  clientDataJSON: ArrayBuffer;
}

interface AuthenticatorAssertionResponse extends AuthenticatorResponse {
  authenticatorData: ArrayBuffer;
  clientDataJSON: ArrayBuffer;
  signature: ArrayBuffer;
  userHandle: ArrayBuffer | null;
}

export interface WebAuthnOptions {
  challenge: string;
  timeout?: number;
  userVerification?: 'required' | 'preferred' | 'discouraged';
  rpId?: string;
}

export class WebAuthnManager {
  private static instance: WebAuthnManager;

  private constructor() {}

  static getInstance(): WebAuthnManager {
    if (!WebAuthnManager.instance) {
      WebAuthnManager.instance = new WebAuthnManager();
    }
    return WebAuthnManager.instance;
  }

  /**
   * Check if WebAuthn is supported in the current browser
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 
           'navigator' in window && 
           'credentials' in navigator &&
           'create' in navigator.credentials &&
           'get' in navigator.credentials;
  }

  /**
   * Create a new WebAuthn credential
   */
  async createCredential(options: WebAuthnOptions): Promise<WebAuthnCredential | null> {
    if (!this.isSupported()) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new TextEncoder().encode(options.challenge),
          rp: {
            name: 'Choices Platform',
            id: options.rpId || window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode('user-id'),
            name: 'user@example.com',
            displayName: 'User',
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 }, // ES256
            { type: 'public-key', alg: -257 }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: options.userVerification || 'preferred',
          },
          timeout: options.timeout || 60000,
        },
      });

      if (credential && 'rawId' in credential) {
        // Update credential type assertions
        const publicKeyCredential = credential as PublicKeyCredential & {
          response: AuthenticatorAttestationResponse;
        };
        
        return {
          id: credential.id,
          type: 'public-key' as const,
          ...(publicKeyCredential.response && 'getTransports' in publicKeyCredential.response 
            ? { transports: (publicKeyCredential.response.getTransports as () => string[])() }
            : {}),
        };
      }

      return null;
    } catch (error) {
      console.error('WebAuthn credential creation failed:', error);
      return null;
    }
  }

  /**
   * Get a WebAuthn credential
   */
  async getCredential(options: WebAuthnOptions): Promise<WebAuthnCredential | null> {
    if (!this.isSupported()) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    try {
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new TextEncoder().encode(options.challenge),
          timeout: options.timeout || 60000,
          userVerification: options.userVerification || 'preferred',
          rpId: options.rpId || window.location.hostname,
        },
      });

      if (credential && 'rawId' in credential) {
        // Update credential type assertions
        const publicKeyCredential = credential as PublicKeyCredential & {
          response: AuthenticatorAssertionResponse;
        };
        
        return {
          id: credential.id,
          type: 'public-key' as const,
        };
      }

      return null;
    } catch (error) {
      console.error('WebAuthn credential retrieval failed:', error);
      return null;
    }
  }
}

export const webauthnManager = WebAuthnManager.getInstance();

// Additional exports for compatibility
export async function registerBiometric(username: string, email: string): Promise<{ success: boolean; error?: { message: string } }> {
  try {
    const credential = await webauthnManager.createCredential({
      challenge: 'registration-challenge',
      userVerification: 'required'
    });
    
    if (credential) {
      return { success: true };
    } else {
      return { success: false, error: { message: 'Failed to create credential' } };
    }
  } catch (error) {
    return { 
      success: false, 
      error: { 
        message: error instanceof Error ? error.message : 'Unknown error' 
      } 
    };
  }
}

export function isWebAuthnSupported(): boolean {
  return webauthnManager.isSupported();
}

export function isBiometricAvailable(): boolean {
  return webauthnManager.isSupported();
}
