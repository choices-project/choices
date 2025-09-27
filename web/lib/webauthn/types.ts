/**
 * WebAuthn Types
 * 
 * Comprehensive type definitions for WebAuthn authentication and credential management.
 * This file provides proper TypeScript types to replace `any` usage in WebAuthn modules.
 * 
 * @author Choices Platform
 * @version 1.0.0
 * @since 2025-01-16
 */

// ============================================================================
// WebAuthn Core Types
// ============================================================================

export type CredentialData = {
  id: string
  type: 'public-key'
  rawId: ArrayBuffer
  response: AuthenticatorAttestationResponse | AuthenticatorAssertionResponse
}

export type WebAuthnError = {
  name: string
  message: string
  code: number
}

export type SessionData = {
  userId: string
  credentialId: string
  expiresAt: Date
}

// ============================================================================
// Credential Types
// ============================================================================

export type PublicKeyCredentialCreationOptions = {
  challenge: ArrayBuffer
  rp: PublicKeyCredentialRpEntity
  user: PublicKeyCredentialUserEntity
  pubKeyCredParams: PublicKeyCredentialParameters[]
  timeout?: number
  excludeCredentials?: PublicKeyCredentialDescriptor[]
  authenticatorSelection?: AuthenticatorSelectionCriteria
  attestation?: AttestationConveyancePreference
  extensions?: AuthenticationExtensionsClientInputs
}

export type PublicKeyCredentialRequestOptions = {
  challenge: ArrayBuffer
  timeout?: number
  rpId?: string
  allowCredentials?: PublicKeyCredentialDescriptor[]
  userVerification?: UserVerificationRequirement
  extensions?: AuthenticationExtensionsClientInputs
}

// ============================================================================
// Response Types
// ============================================================================

export type AuthenticatorAttestationResponse = {
  clientDataJSON: ArrayBuffer
  attestationObject: ArrayBuffer
}

export type AuthenticatorAssertionResponse = {
  clientDataJSON: ArrayBuffer
  authenticatorData: ArrayBuffer
  signature: ArrayBuffer
  userHandle?: ArrayBuffer | null
}

// ============================================================================
// Entity Types
// ============================================================================

export type PublicKeyCredentialRpEntity = {
  id?: string
  name: string
  icon?: string
}

export type PublicKeyCredentialUserEntity = {
  id: ArrayBuffer
  name: string
  displayName: string
  icon?: string
}

export type PublicKeyCredentialParameters = {
  type: 'public-key'
  alg: number
}

export type PublicKeyCredentialDescriptor = {
  type: 'public-key'
  id: ArrayBuffer
  transports?: AuthenticatorTransport[]
}

// ============================================================================
// Selection and Verification Types
// ============================================================================

export type AuthenticatorSelectionCriteria = {
  authenticatorAttachment?: AuthenticatorAttachment
  userVerification?: UserVerificationRequirement
  requireResidentKey?: boolean
}

export type AuthenticatorAttachment = 'platform' | 'cross-platform'
export type UserVerificationRequirement = 'required' | 'preferred' | 'discouraged'
export type AttestationConveyancePreference = 'none' | 'indirect' | 'direct'
export type AuthenticatorTransport = 'usb' | 'nfc' | 'ble' | 'internal'

// ============================================================================
// Database Types
// ============================================================================

export type WebAuthnCredential = {
  id: string
  user_id: string
  credential_id: string
  public_key: string
  counter: number
  transports?: string[]
  created_at: string
  updated_at: string
  last_used_at?: string
}

export type WebAuthnSession = {
  id: string
  user_id: string
  credential_id: string
  expires_at: string
  created_at: string
}

// ============================================================================
// API Response Types
// ============================================================================

export type WebAuthnRegistrationResponse = {
  success: boolean
  credentialId?: string
  error?: string
}

export type WebAuthnAuthenticationResponse = {
  success: boolean
  userId?: string
  session?: SessionData
  error?: string
}

// ============================================================================
// Error Types
// ============================================================================

export type WebAuthnErrorResponse = {
  success: false
  error: string
  code?: string
  details?: Record<string, unknown>
}

// ============================================================================
// Configuration Types
// ============================================================================

export type WebAuthnConfig = {
  rpId: string
  rpName: string
  rpIcon?: string
  timeout?: number
  userVerification?: UserVerificationRequirement
  attestation?: AttestationConveyancePreference
}

// ============================================================================
// Utility Types
// ============================================================================

export type WebAuthnOperation = 'registration' | 'authentication'

export type WebAuthnChallenge = {
  challenge: string
  expiresAt: Date
  operation: WebAuthnOperation
  userId?: string
}

// ============================================================================
// Type Guards
// ============================================================================

export function isWebAuthnError(value: unknown): value is WebAuthnError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'message' in value &&
    'code' in value &&
    typeof (value as WebAuthnError).name === 'string' &&
    typeof (value as WebAuthnError).message === 'string' &&
    typeof (value as WebAuthnError).code === 'number'
  )
}

export function isCredentialData(value: unknown): value is CredentialData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'type' in value &&
    'rawId' in value &&
    'response' in value &&
    typeof (value as CredentialData).id === 'string' &&
    (value as CredentialData).type === 'public-key'
  )
}

export function isWebAuthnCredential(value: unknown): value is WebAuthnCredential {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'user_id' in value &&
    'credential_id' in value &&
    'public_key' in value &&
    'counter' in value &&
    typeof (value as WebAuthnCredential).id === 'string' &&
    typeof (value as WebAuthnCredential).user_id === 'string' &&
    typeof (value as WebAuthnCredential).credential_id === 'string' &&
    typeof (value as WebAuthnCredential).public_key === 'string' &&
    typeof (value as WebAuthnCredential).counter === 'number'
  )
}
