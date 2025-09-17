/**
 * WebAuthn Type Definitions
 * 
 * Type definitions for WebAuthn authentication, including
 * credential creation, assertion, and related interfaces.
 */

export interface WebAuthnCredential {
  id: string;
  type: 'public-key';
  rawId: ArrayBuffer;
  response: AuthenticatorAttestationResponse | AuthenticatorAssertionResponse;
  clientExtensionResults: AuthenticationExtensionsClientOutputs;
}

export interface WebAuthnCredentialCreationOptions {
  challenge: ArrayBuffer;
  rp: PublicKeyCredentialRpEntity;
  user: PublicKeyCredentialUserEntity;
  pubKeyCredParams: PublicKeyCredentialParameters[];
  timeout?: number;
  excludeCredentials?: PublicKeyCredentialDescriptor[];
  authenticatorSelection?: AuthenticatorSelectionCriteria;
  attestation?: AttestationConveyancePreference;
  extensions?: AuthenticationExtensionsClientInputs;
}

export interface WebAuthnCredentialRequestOptions {
  challenge: ArrayBuffer;
  timeout?: number;
  rpId?: string;
  allowCredentials?: PublicKeyCredentialDescriptor[];
  userVerification?: UserVerificationRequirement;
  extensions?: AuthenticationExtensionsClientInputs;
}

export interface WebAuthnRegistrationData {
  credential: WebAuthnCredential;
  userAgent: string;
  platform: string;
  createdAt: string;
}

export interface WebAuthnAuthenticationData {
  credentialId: string;
  authenticatorData: ArrayBuffer;
  clientDataJSON: ArrayBuffer;
  signature: ArrayBuffer;
  userHandle?: ArrayBuffer;
  userAgent: string;
  platform: string;
  authenticatedAt: string;
}

export interface WebAuthnUser {
  id: string;
  name: string;
  displayName: string;
  icon?: string;
}

export interface WebAuthnRelyingParty {
  id: string;
  name: string;
  icon?: string;
}

export interface WebAuthnCredentialDescriptor {
  type: 'public-key';
  id: ArrayBuffer;
  transports?: AuthenticatorTransport[];
}

export interface WebAuthnAuthenticatorSelection {
  authenticatorAttachment?: AuthenticatorAttachment;
  userVerification?: UserVerificationRequirement;
  requireResidentKey?: boolean;
}

export interface WebAuthnExtensions {
  appid?: string;
  appidExclude?: string;
  uvm?: boolean;
  credProps?: boolean;
  largeBlob?: {
    support?: 'required' | 'preferred';
    read?: boolean;
    write?: ArrayBuffer;
  };
}

export interface WebAuthnError extends Error {
  code: string;
  name: string;
  message: string;
}

export interface WebAuthnSupportedFeatures {
  isSupported: boolean;
  isUserVerifyingPlatformAuthenticatorAvailable: boolean;
  isConditionalMediationAvailable: boolean;
  isLargeBlobSupported: boolean;
  isCredentialPropertiesSupported: boolean;
}

export interface WebAuthnRegistrationResult {
  success: boolean;
  credentialId: string;
  publicKey: string;
  counter: number;
  aaguid: string;
  transports: string[];
  userAgent: string;
  platform: string;
  registeredAt: string;
}

export interface WebAuthnAuthenticationResult {
  success: boolean;
  userId: string;
  credentialId: string;
  counter: number;
  userAgent: string;
  platform: string;
  authenticatedAt: string;
}

export interface WebAuthnCredentialInfo {
  id: string;
  publicKey: string;
  counter: number;
  aaguid: string;
  transports: string[];
  userAgent: string;
  platform: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface WebAuthnServerConfig {
  rpId: string;
  rpName: string;
  rpIcon?: string;
  origin: string;
  challengeSize: number;
  timeout: number;
  attestation: AttestationConveyancePreference;
  userVerification: UserVerificationRequirement;
  authenticatorSelection: WebAuthnAuthenticatorSelection;
}
