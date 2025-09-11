/**
 * WebAuthn Utility Functions
 * Enhanced biometric authentication utilities for the Choices platform
 * 
 * Features:
 * - Comprehensive error handling and recovery
 * - Cross-device passkey support
 * - Multiple credential management
 * - Analytics and monitoring
 * 
 * @author Choices Platform
 * @version 2.0.0
 * @since 2024-12-27
 */

// Note: This file is archived and uses a simple console.log replacement
// In the future, when reintegrated, it should use: import { devLog } from '@/lib/logger'
const devLog = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[ARCHIVED-WEBAUTHN] ${message}`, ...args);
  }
};

// WebAuthn configuration
const WEBAUTHN_CONFIG = {
  rpName: 'Choices Platform',
  rpId: typeof window !== 'undefined' ? window.location.hostname : 'choices-platform.vercel.app',
  timeout: 60000, // 60 seconds
  challengeLength: 32,
  algorithms: [
    { name: 'ECDSA', namedCurve: 'P-256' },
    { name: 'ECDSA', namedCurve: 'P-384' },
    { name: 'ECDSA', namedCurve: 'P-521' },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-384' },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-512' }
  ]
}

// Error types for better handling
export enum WebAuthnErrorType {
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  USER_CANCELLED = 'USER_CANCELLED',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  SECURITY_ERROR = 'SECURITY_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

export interface WebAuthnError {
  type: WebAuthnErrorType;
  message: string;
  code?: string;
  recoverable: boolean;
  suggestedAction?: string;
}

export interface WebAuthnResult {
  success: boolean;
  credential?: PublicKeyCredential;
  error?: WebAuthnError;
  analytics?: {
    method: string;
    duration: number;
    deviceType: string;
    browser: string;
  };
}

// Convert ArrayBuffer to Base64
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// Convert Base64 to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

// Generate random challenge
export function generateChallenge(): ArrayBuffer {
  const challenge = crypto.getRandomValues(new Uint8Array(WEBAUTHN_CONFIG.challengeLength))
  return challenge.buffer
}

// Check if WebAuthn is supported
export function isWebAuthnSupported(): boolean {
  return typeof window !== 'undefined' && 
         'PublicKeyCredential' in window &&
         'credentials' in navigator
}

// Check if biometric authentication is available
export async function isBiometricAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) {
    return false
  }

  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    devLog('Biometric availability check:', available)
    return available
  } catch (error) {
    devLog('Error checking biometric availability:', error)
    return false
  }
}

// Get device and browser information
export function getDeviceInfo(): { deviceType: string; browser: string; platform: string } {
  const userAgent = navigator.userAgent;
  
  let deviceType = 'unknown';
  let browser = 'unknown';
  let platform = 'unknown';

  // Detect device type
  if (/iPhone|iPad|iPod/.test(userAgent)) {
    deviceType = 'ios';
  } else if (/Android/.test(userAgent)) {
    deviceType = 'android';
  } else if (/Windows/.test(userAgent)) {
    deviceType = 'windows';
  } else if (/Mac/.test(userAgent)) {
    deviceType = 'macos';
  } else if (/Linux/.test(userAgent)) {
    deviceType = 'linux';
  }

  // Detect browser
  if (/Chrome/.test(userAgent) && !/Edge/.test(userAgent)) {
    browser = 'chrome';
  } else if (/Firefox/.test(userAgent)) {
    browser = 'firefox';
  } else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
    browser = 'safari';
  } else if (/Edge/.test(userAgent)) {
    browser = 'edge';
  }

  // Detect platform
  if (/iPhone|iPad|iPod|Mac/.test(userAgent)) {
    platform = 'apple';
  } else if (/Android/.test(userAgent)) {
    platform = 'google';
  } else if (/Windows/.test(userAgent)) {
    platform = 'microsoft';
  }

  return { deviceType, browser, platform };
}

// Enhanced error handling
export function handleWebAuthnError(error: any): WebAuthnError {
  const errorMessage = error.message || error.name || 'Unknown error';
  
  // Handle specific error types
  if (error.name === 'NotAllowedError') {
    return {
      type: WebAuthnErrorType.USER_CANCELLED,
      message: 'Authentication was cancelled by the user',
      code: error.name,
      recoverable: true,
      suggestedAction: 'Try again or use an alternative authentication method'
    };
  }
  
  if (error.name === 'SecurityError') {
    return {
      type: WebAuthnErrorType.SECURITY_ERROR,
      message: 'Security error occurred during authentication',
      code: error.name,
      recoverable: false,
      suggestedAction: 'Please contact support if this persists'
    };
  }
  
  if (error.name === 'InvalidStateError') {
    return {
      type: WebAuthnErrorType.INVALID_RESPONSE,
      message: 'Invalid authentication state',
      code: error.name,
      recoverable: true,
      suggestedAction: 'Please try again'
    };
  }
  
  if (error.name === 'NotSupportedError') {
    return {
      type: WebAuthnErrorType.NOT_SUPPORTED,
      message: 'Biometric authentication is not supported on this device',
      code: error.name,
      recoverable: false,
      suggestedAction: 'Use password authentication instead'
    };
  }
  
  if (error.name === 'AbortError') {
    return {
      type: WebAuthnErrorType.TIMEOUT,
      message: 'Authentication timed out',
      code: error.name,
      recoverable: true,
      suggestedAction: 'Please try again'
    };
  }
  
  // Default error
  return {
    type: WebAuthnErrorType.UNKNOWN,
    message: errorMessage,
    code: error.name,
    recoverable: true,
    suggestedAction: 'Please try again or contact support'
  };
}

// Get authenticator type from credential
export function getAuthenticatorType(credential: PublicKeyCredential): string {
  if (!credential.authenticatorAttachment) {
    return 'unknown'
  }
  
  // Try to detect authenticator type based on available information
  if (credential.authenticatorAttachment === 'platform') {
    // Platform authenticators are usually biometric
    if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
      return 'face' // Face ID on iOS
    } else if (navigator.userAgent.includes('Android')) {
      return 'fingerprint' // Fingerprint on Android
    } else {
      return 'fingerprint' // Default to fingerprint
    }
  } else {
    return 'cross-platform'
  }
}

// Enhanced WebAuthn Registration
export async function registerBiometric(userId: string, username: string): Promise<WebAuthnResult> {
  const startTime = Date.now();
  const deviceInfo = getDeviceInfo();
  
  try {
    if (!isWebAuthnSupported()) {
      return {
        success: false,
        error: {
          type: WebAuthnErrorType.NOT_SUPPORTED,
          message: 'WebAuthn is not supported in this browser',
          recoverable: false,
          suggestedAction: 'Please use a modern browser that supports biometric authentication'
        },
        analytics: {
          method: 'registration',
          duration: Date.now() - startTime,
          deviceType: deviceInfo.deviceType,
          browser: deviceInfo.browser
        }
      };
    }

    // Check biometric availability
    const biometricAvailable = await isBiometricAvailable();
    if (!biometricAvailable) {
      return {
        success: false,
        error: {
          type: WebAuthnErrorType.NOT_AVAILABLE,
          message: 'Biometric authentication is not available on this device',
          recoverable: false,
          suggestedAction: 'Please use password authentication or try on a different device'
        },
        analytics: {
          method: 'registration',
          duration: Date.now() - startTime,
          deviceType: deviceInfo.deviceType,
          browser: deviceInfo.browser
        }
      };
    }

    // Get challenge from server
    const challengeResponse = await fetch('/api/auth/webauthn/challenge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        username,
        deviceInfo
      }),
    });

    if (!challengeResponse.ok) {
      throw new Error('Failed to get challenge from server');
    }

    const challengeData = await challengeResponse.json();
    const { challenge, rpId, user } = challengeData;

    // Convert challenge from base64 to ArrayBuffer
    const challengeBuffer = base64ToArrayBuffer(challenge);

    // Create credential options
    const publicKeyOptions: PublicKeyCredentialCreationOptions = {
      challenge: challengeBuffer,
      rp: {
        name: WEBAUTHN_CONFIG.rpName,
        id: rpId,
      },
      user: {
        id: base64ToArrayBuffer(user.id),
        name: user.name,
        displayName: user.displayName,
      },
      pubKeyCredParams: WEBAUTHN_CONFIG.algorithms.map(alg => ({
        type: 'public-key',
        alg: alg.name === 'ECDSA' ? -7 : -257, // ECDSA or RSA
      })),
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      attestation: 'none',
      timeout: WEBAUTHN_CONFIG.timeout,
    };

    // Create credential
    const credential = await navigator.credentials.create({
      publicKey: publicKeyOptions,
    }) as PublicKeyCredential;

    if (!credential) {
      throw new Error('Failed to create credential');
    }

    // Send credential to server
    const attestationResponse = credential.response as AuthenticatorAttestationResponse;
    const registrationData = {
      id: credential.id,
      rawId: arrayBufferToBase64(credential.rawId),
      type: credential.type,
      response: {
        attestationObject: arrayBufferToBase64(attestationResponse.attestationObject),
        clientDataJSON: arrayBufferToBase64(attestationResponse.clientDataJSON),
      },
      authenticatorType: getAuthenticatorType(credential),
      deviceInfo
    };

    const registrationResponse = await fetch('/api/auth/webauthn/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationData),
    });

    if (!registrationResponse.ok) {
      const errorData = await registrationResponse.json();
      throw new Error(errorData.message || 'Registration failed');
    }

    return {
      success: true,
      credential,
      analytics: {
        method: 'registration',
        duration: Date.now() - startTime,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser
      }
    };

  } catch (error) {
    const webAuthnError = handleWebAuthnError(error);
    
    return {
      success: false,
      error: webAuthnError,
      analytics: {
        method: 'registration',
        duration: Date.now() - startTime,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser
      }
    };
  }
}

// Enhanced WebAuthn Authentication
export async function authenticateBiometric(username: string): Promise<WebAuthnResult> {
  const startTime = Date.now();
  const deviceInfo = getDeviceInfo();
  
  try {
    if (!isWebAuthnSupported()) {
      return {
        success: false,
        error: {
          type: WebAuthnErrorType.NOT_SUPPORTED,
          message: 'WebAuthn is not supported in this browser',
          recoverable: false,
          suggestedAction: 'Please use a modern browser that supports biometric authentication'
        },
        analytics: {
          method: 'authentication',
          duration: Date.now() - startTime,
          deviceType: deviceInfo.deviceType,
          browser: deviceInfo.browser
        }
      };
    }

    // Get authentication options from server
    const optionsResponse = await fetch('/api/auth/webauthn/authenticate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        deviceInfo
      }),
    });

    if (!optionsResponse.ok) {
      throw new Error('Failed to get authentication options');
    }

    const optionsData = await optionsResponse.json();
    const { challenge, rpId, allowCredentials } = optionsData;

    // Convert challenge from base64 to ArrayBuffer
    const challengeBuffer = base64ToArrayBuffer(challenge);

    // Convert allowCredentials
    const allowCredentialsArray = allowCredentials.map((cred: any) => ({
      ...cred,
      id: base64ToArrayBuffer(cred.id),
    }));

    // Create assertion options
    const assertionOptions: PublicKeyCredentialRequestOptions = {
      challenge: challengeBuffer,
      rpId,
      allowCredentials: allowCredentialsArray,
      userVerification: 'required',
      timeout: WEBAUTHN_CONFIG.timeout,
    };

    // Get credential
    const credential = await navigator.credentials.get({
      publicKey: assertionOptions,
    }) as PublicKeyCredential;

    if (!credential) {
      throw new Error('Failed to get credential');
    }

    // Send assertion to server
    const assertionResponse = credential.response as AuthenticatorAssertionResponse;
    const assertionData = {
      id: credential.id,
      rawId: arrayBufferToBase64(credential.rawId),
      type: credential.type,
      response: {
        authenticatorData: arrayBufferToBase64(assertionResponse.authenticatorData),
        clientDataJSON: arrayBufferToBase64(assertionResponse.clientDataJSON),
        signature: arrayBufferToBase64(assertionResponse.signature),
        userHandle: assertionResponse.userHandle ? arrayBufferToBase64(assertionResponse.userHandle) : null,
      },
      deviceInfo
    };

    const verificationResponse = await fetch('/api/auth/webauthn/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assertionData),
    });

    if (!verificationResponse.ok) {
      const errorData = await verificationResponse.json();
      throw new Error(errorData.message || 'Authentication failed');
    }

    // Verify the response was successful
    await verificationResponse.json();

    return {
      success: true,
      credential,
      analytics: {
        method: 'authentication',
        duration: Date.now() - startTime,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser
      }
    };

  } catch (error) {
    const webAuthnError = handleWebAuthnError(error);
    
    return {
      success: false,
      error: webAuthnError,
      analytics: {
        method: 'authentication',
        duration: Date.now() - startTime,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser
      }
    };
  }
}

// Get user's registered credentials
export async function getUserCredentials(userId: string): Promise<{
  success: boolean;
  credentials?: any[];
  error?: string;
}> {
  try {
    const response = await fetch(`/api/auth/webauthn/credentials?userId=${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch credentials');
    }
    
    const data = await response.json();
    return {
      success: true,
      credentials: data.credentials
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Remove a credential
export async function removeCredential(credentialId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`/api/auth/webauthn/credentials/${credentialId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to remove credential');
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Generate QR code data for cross-device setup
export async function generateQRCodeData(userId: string): Promise<{
  success: boolean;
  qrData?: string;
  error?: string;
}> {
  try {
    const response = await fetch('/api/auth/webauthn/qr-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate QR code');
    }
    
    const data = await response.json();
    return {
      success: true,
      qrData: data.qrData
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
