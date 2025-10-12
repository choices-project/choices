/**
 * Auth Feature Types
 * 
 * Consolidated type definitions for the Auth feature.
 * This file combines all authentication-related types including WebAuthn, OAuth, and session management.
 * 
 * @author Choices Platform
 * @version 1.0.0
 * @since 2025-10-10
 */

// ============================================================================
// WebAuthn Core Types
// ============================================================================

export interface CredentialData {
  id: string
  type: 'public-key'
  rawId: ArrayBuffer
  response: AuthenticatorAttestationResponse | AuthenticatorAssertionResponse
}

export interface WebAuthnError {
  name: string
  message: string
  code: number
}

export interface SessionData {
  userId: string
  credentialId: string
  expiresAt: Date
}

// ============================================================================
// WebAuthn Credential Types
// ============================================================================

export interface PublicKeyCredentialCreationOptions {
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

export interface PublicKeyCredentialRequestOptions {
  challenge: ArrayBuffer
  timeout?: number
  rpId?: string
  allowCredentials?: PublicKeyCredentialDescriptor[]
  userVerification?: UserVerificationRequirement
  extensions?: AuthenticationExtensionsClientInputs
}

// ============================================================================
// WebAuthn Response Types
// ============================================================================

export interface AuthenticatorAttestationResponse {
  clientDataJSON: ArrayBuffer
  attestationObject: ArrayBuffer
}

export interface AuthenticatorAssertionResponse {
  clientDataJSON: ArrayBuffer
  authenticatorData: ArrayBuffer
  signature: ArrayBuffer
  userHandle?: ArrayBuffer | null
}

// ============================================================================
// WebAuthn Entity Types
// ============================================================================

export interface PublicKeyCredentialRpEntity {
  id?: string
  name: string
  icon?: string
}

export interface PublicKeyCredentialUserEntity {
  id: ArrayBuffer
  name: string
  displayName: string
  icon?: string
}

export interface PublicKeyCredentialParameters {
  type: 'public-key'
  alg: number
}

export interface PublicKeyCredentialDescriptor {
  type: 'public-key'
  id: ArrayBuffer
  transports?: AuthenticatorTransport[]
}

// ============================================================================
// WebAuthn Selection and Verification Types
// ============================================================================

export interface AuthenticatorSelectionCriteria {
  authenticatorAttachment?: AuthenticatorAttachment
  userVerification?: UserVerificationRequirement
  requireResidentKey?: boolean
}

export type AuthenticatorAttachment = 'platform' | 'cross-platform'
export type UserVerificationRequirement = 'required' | 'preferred' | 'discouraged'
export type AttestationConveyancePreference = 'none' | 'indirect' | 'direct'
export type AuthenticatorTransport = 'usb' | 'nfc' | 'ble' | 'internal'

// ============================================================================
// WebAuthn Database Types
// ============================================================================

export interface WebAuthnCredential {
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

export interface WebAuthnSession {
  id: string
  user_id: string
  credential_id: string
  expires_at: string
  created_at: string
}

// ============================================================================
// WebAuthn API Response Types
// ============================================================================

export interface WebAuthnRegistrationResponse {
  success: boolean
  credentialId?: string
  error?: string
}

export interface WebAuthnAuthenticationResponse {
  success: boolean
  userId?: string
  session?: SessionData
  error?: string
}

export interface WebAuthnErrorResponse {
  success: false
  error: string
  code?: string
  details?: Record<string, unknown>
}

// ============================================================================
// WebAuthn Configuration Types
// ============================================================================

export interface WebAuthnConfig {
  rpId: string
  rpName: string
  rpIcon?: string
  timeout?: number
  userVerification?: UserVerificationRequirement
  attestation?: AttestationConveyancePreference
}

export interface WebAuthnServerConfig {
  rpId: string
  rpName: string
  rpIcon?: string
  origin: string
  challengeSize: number
  timeout: number
  attestation: AttestationConveyancePreference
  userVerification: UserVerificationRequirement
  authenticatorSelection: AuthenticatorSelectionCriteria
}

// ============================================================================
// WebAuthn Utility Types
// ============================================================================

export type WebAuthnOperation = 'registration' | 'authentication'

export interface WebAuthnChallenge {
  challenge: string
  expiresAt: Date
  operation: WebAuthnOperation
  userId?: string
}

export interface WebAuthnSupportedFeatures {
  isSupported: boolean
  isUserVerifyingPlatformAuthenticatorAvailable: boolean
  isConditionalMediationAvailable: boolean
  isLargeBlobSupported: boolean
  isCredentialPropertiesSupported: boolean
}

// ============================================================================
// WebAuthn Component Types
// ============================================================================

export interface WebAuthnAuthProps {
  onSuccess: (credential: PublicKeyCredential) => void
  onError: (error: Error) => void
  mode: 'register' | 'authenticate'
  disabled?: boolean
  className?: string
}

export interface WebAuthnCredentialResponse {
  id: string
  type: string
  rawId: string // base64url encoded
  response: {
    clientDataJSON: string // base64url encoded
    attestationObject?: string // base64url encoded
    authenticatorData?: string // base64url encoded
    signature?: string // base64url encoded
    userHandle?: string // base64url encoded
  }
}

export interface WebAuthnRegistrationResult {
  success: boolean
  credentialId: string
  publicKey: string
  counter: number
  aaguid: string
  transports: string[]
  userAgent: string
  platform: string
  registeredAt: string
  error?: string
}

export interface WebAuthnAuthenticationResult {
  success: boolean
  userId: string
  credentialId: string
  counter: number
  userAgent: string
  platform: string
  authenticatedAt: string
  error?: string
}

export interface WebAuthnCredentialInfo {
  id: string
  publicKey: string
  counter: number
  aaguid: string
  transports: string[]
  userAgent: string
  platform: string
  createdAt: string
  lastUsedAt?: string
}

// ============================================================================
// OAuth and Social Auth Types
// ============================================================================

export type OAuthProvider = 
  | 'google' 
  | 'github' 
  | 'facebook' 
  | 'twitter' 
  | 'linkedin' 
  | 'discord' 
  | 'instagram' 
  | 'tiktok'

export interface SocialLoginOption {
  provider: OAuthProvider
  label: string
  description: string
  icon: string
  color: string
  bgColor: string
  borderColor: string
  textColor: string
  hoverBgColor: string
  hoverTextColor: string
}

// ============================================================================
// General Auth Types
// ============================================================================

export interface AuthError {
  code: string
  message: string
}

export interface AuthSession {
  user: {
    id: string
    email: string
    stableId: string
    verificationTier: string
    isActive: boolean
    createdAt: string
    updatedAt: string
  }
  accessToken: string
  refreshToken: string
  expiresAt: number
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

// ============================================================================
// Re-exports for backward compatibility
// ============================================================================

// Re-export commonly used types with shorter names
export type {
  CredentialData as WebAuthnCredentialData,
  WebAuthnCredential as WebAuthnCredentialRecord,
  WebAuthnSession as WebAuthnSessionRecord,
  WebAuthnConfig as WebAuthnConfiguration,
  WebAuthnServerConfig as WebAuthnServerConfiguration
}
