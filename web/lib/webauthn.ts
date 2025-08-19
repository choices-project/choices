/**
 * WebAuthn Utility Functions
 * Comprehensive biometric authentication utilities for the Choices platform
 */

import { devLog } from './logger'

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
  return crypto.getRandomValues(new Uint8Array(WEBAUTHN_CONFIG.challengeLength))
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

// WebAuthn Registration
export async function registerBiometric(userId: string, username: string): Promise<{
  success: boolean
  credential?: PublicKeyCredential
  error?: string
}> {
  try {
    devLog('Starting biometric registration for user:', username)

    // Check WebAuthn support
    if (!isWebAuthnSupported()) {
      return { success: false, error: 'WebAuthn not supported' }
    }

    // Check biometric availability
    const biometricAvailable = await isBiometricAvailable()
    if (!biometricAvailable) {
      return { success: false, error: 'Biometric authentication not available' }
    }

    // Get registration challenge from server
    const challengeResponse = await fetch('/api/auth/webauthn/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, username })
    })

    if (!challengeResponse.ok) {
      const error = await challengeResponse.text()
      return { success: false, error: `Failed to get challenge: ${error}` }
    }

    const challengeData = await challengeResponse.json()

    // Create credentials
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: base64ToArrayBuffer(challengeData.challenge),
        rp: {
          name: WEBAUTHN_CONFIG.rpName,
          id: WEBAUTHN_CONFIG.rpId
        },
        user: {
          id: base64ToArrayBuffer(challengeData.userId),
          name: username,
          displayName: username
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },   // ES256
          { alg: -257, type: 'public-key' }, // RS256
          { alg: -37, type: 'public-key' },  // PS256
          { alg: -35, type: 'public-key' }   // ES384
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Built-in authenticator
          userVerification: 'required',
          requireResidentKey: false
        },
        attestation: 'direct',
        timeout: WEBAUTHN_CONFIG.timeout
      }
    }) as PublicKeyCredential

    if (!credential) {
      return { success: false, error: 'Failed to create credential' }
    }

    devLog('Credential created successfully:', {
      id: credential.id,
      type: credential.type,
      authenticatorAttachment: (credential as any).authenticatorAttachment
    })

    // Send credential to server
    const registrationResponse = await fetch('/api/auth/webauthn/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credential: {
          id: credential.id,
          type: credential.type,
          rawId: arrayBufferToBase64(credential.rawId),
          response: {
            attestationObject: arrayBufferToBase64((credential.response as AuthenticatorAttestationResponse).attestationObject),
            clientDataJSON: arrayBufferToBase64((credential.response as AuthenticatorAttestationResponse).clientDataJSON)
          }
        },
        challenge: challengeData
      })
    })

    if (!registrationResponse.ok) {
      const error = await registrationResponse.text()
      return { success: false, error: `Registration failed: ${error}` }
    }

    const result = await registrationResponse.json()
    
    if (result.success) {
      devLog('Biometric registration completed successfully')
      return { success: true, credential }
    } else {
      return { success: false, error: result.error || 'Registration failed' }
    }

  } catch (error) {
    devLog('Error during biometric registration:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during registration' 
    }
  }
}

// WebAuthn Authentication
export async function authenticateBiometric(username: string): Promise<{
  success: boolean
  credential?: PublicKeyCredential
  error?: string
}> {
  try {
    devLog('Starting biometric authentication for user:', username)

    // Check WebAuthn support
    if (!isWebAuthnSupported()) {
      return { success: false, error: 'WebAuthn not supported' }
    }

    // Get authentication challenge from server
    const challengeResponse = await fetch('/api/auth/webauthn/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    })

    if (!challengeResponse.ok) {
      const error = await challengeResponse.text()
      return { success: false, error: `Failed to get challenge: ${error}` }
    }

    const challengeData = await challengeResponse.json()

    // Get credentials
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: base64ToArrayBuffer(challengeData.challenge),
        rpId: WEBAUTHN_CONFIG.rpId,
        userVerification: 'required',
        timeout: WEBAUTHN_CONFIG.timeout,
        allowCredentials: challengeData.allowCredentials?.map((cred: any) => ({
          id: base64ToArrayBuffer(cred.id),
          type: cred.type,
          transports: cred.transports
        })) || []
      }
    }) as PublicKeyCredential

    if (!credential) {
      return { success: false, error: 'Authentication cancelled or failed' }
    }

    devLog('Credential retrieved successfully:', {
      id: credential.id,
      type: credential.type
    })

    // Send credential to server for verification
    const authenticationResponse = await fetch('/api/auth/webauthn/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credential: {
          id: credential.id,
          type: credential.type,
          rawId: arrayBufferToBase64(credential.rawId),
          response: {
            authenticatorData: arrayBufferToBase64((credential.response as AuthenticatorAssertionResponse).authenticatorData),
            clientDataJSON: arrayBufferToBase64((credential.response as AuthenticatorAssertionResponse).clientDataJSON),
            signature: arrayBufferToBase64((credential.response as AuthenticatorAssertionResponse).signature)
          }
        },
        challenge: challengeData
      })
    })

    if (!authenticationResponse.ok) {
      const error = await authenticationResponse.text()
      return { success: false, error: `Authentication failed: ${error}` }
    }

    const result = await authenticationResponse.json()
    
    if (result.success) {
      devLog('Biometric authentication completed successfully')
      return { success: true, credential }
    } else {
      return { success: false, error: result.error || 'Authentication failed' }
    }

  } catch (error) {
    devLog('Error during biometric authentication:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during authentication' 
    }
  }
}

// Get user's biometric credentials
export async function getUserBiometricCredentials(): Promise<{
  success: boolean
  credentials?: any[]
  error?: string
}> {
  try {
    const response = await fetch('/api/auth/webauthn/credentials')
    
    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `Failed to get credentials: ${error}` }
    }

    const result = await response.json()
    return { success: true, credentials: result.credentials }

  } catch (error) {
    devLog('Error getting biometric credentials:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error getting credentials' 
    }
  }
}

// Delete biometric credential
export async function deleteBiometricCredential(credentialId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const response = await fetch('/api/auth/webauthn/credentials', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credentialId })
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `Failed to delete credential: ${error}` }
    }

    const result = await response.json()
    return { success: result.success }

  } catch (error) {
    devLog('Error deleting biometric credential:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error deleting credential' 
    }
  }
}

// Get biometric trust score
export async function getBiometricTrustScore(): Promise<{
  success: boolean
  trustScore?: number
  error?: string
}> {
  try {
    const response = await fetch('/api/auth/webauthn/trust-score')
    
    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `Failed to get trust score: ${error}` }
    }

    const result = await response.json()
    return { success: true, trustScore: result.trustScore }

  } catch (error) {
    devLog('Error getting biometric trust score:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error getting trust score' 
    }
  }
}

// Get biometric authentication logs
export async function getBiometricAuthLogs(limit: number = 10): Promise<{
  success: boolean
  logs?: any[]
  error?: string
}> {
  try {
    const response = await fetch(`/api/auth/webauthn/logs?limit=${limit}`)
    
    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `Failed to get logs: ${error}` }
    }

    const result = await response.json()
    return { success: true, logs: result.logs }

  } catch (error) {
    devLog('Error getting biometric auth logs:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error getting logs' 
    }
  }
}

// Check if user has biometric credentials
export async function hasBiometricCredentials(): Promise<boolean> {
  const result = await getUserBiometricCredentials()
  return result.success && (result.credentials?.length || 0) > 0
}

// Get device capabilities
export function getDeviceCapabilities(): {
  webauthnSupported: boolean
  biometricAvailable: boolean
  platformAuthenticator: boolean
  crossPlatformAuthenticator: boolean
} {
  const webauthnSupported = isWebAuthnSupported()
  
  return {
    webauthnSupported,
    biometricAvailable: false, // Will be set by async check
    platformAuthenticator: webauthnSupported,
    crossPlatformAuthenticator: webauthnSupported
  }
}

// Initialize biometric capabilities
export async function initializeBiometricCapabilities(): Promise<{
  webauthnSupported: boolean
  biometricAvailable: boolean
  platformAuthenticator: boolean
  crossPlatformAuthenticator: boolean
}> {
  const webauthnSupported = isWebAuthnSupported()
  const biometricAvailable = await isBiometricAvailable()
  
  return {
    webauthnSupported,
    biometricAvailable,
    platformAuthenticator: webauthnSupported,
    crossPlatformAuthenticator: webauthnSupported
  }
}
