/**
 * WebAuthn Type Definitions
 * 
 * Type definitions for WebAuthn authentication, including
 * credential creation, assertion, and related interfaces.
 */

export type WebAuthnCredential = {
  id: string;
  type: 'public-key';
  rawId: ArrayBuffer;
  response: AuthenticatorAttestationResponse | AuthenticatorAssertionResponse;
  clientExtensionResults: AuthenticationExtensionsClientOutputs;
}

export type WebAuthnCredentialCreationOptions = {
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

export type WebAuthnCredentialRequestOptions = {
  challenge: ArrayBuffer;
  timeout?: number;
  rpId?: string;
  allowCredentials?: PublicKeyCredentialDescriptor[];
  userVerification?: UserVerificationRequirement;
  extensions?: AuthenticationExtensionsClientInputs;
}

export type WebAuthnRegistrationData = {
  credential: WebAuthnCredential;
  userAgent: string;
  platform: string;
  createdAt: string;
}

export type WebAuthnAuthenticationData = {
  credentialId: string;
  authenticatorData: ArrayBuffer;
  clientDataJSON: ArrayBuffer;
  signature: ArrayBuffer;
  userHandle?: ArrayBuffer;
  userAgent: string;
  platform: string;
  authenticatedAt: string;
}

export type WebAuthnUser = {
  id: string;
  name: string;
  displayName: string;
  icon?: string;
}

export type WebAuthnRelyingParty = {
  id: string;
  name: string;
  icon?: string;
}

export type WebAuthnCredentialDescriptor = {
  type: 'public-key';
  id: ArrayBuffer;
  transports?: AuthenticatorTransport[];
}

export type WebAuthnAuthenticatorSelection = {
  authenticatorAttachment?: AuthenticatorAttachment;
  userVerification?: UserVerificationRequirement;
  requireResidentKey?: boolean;
}

export type WebAuthnExtensions = {
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

export type WebAuthnError = {
  code: string;
  name: string;
  message: string;
} & Error

export type WebAuthnSupportedFeatures = {
  isSupported: boolean;
  isUserVerifyingPlatformAuthenticatorAvailable: boolean;
  isConditionalMediationAvailable: boolean;
  isLargeBlobSupported: boolean;
  isCredentialPropertiesSupported: boolean;
}

export type WebAuthnRegistrationResult = {
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

export type WebAuthnAuthenticationResult = {
  success: boolean;
  userId: string;
  credentialId: string;
  counter: number;
  userAgent: string;
  platform: string;
  authenticatedAt: string;
}

export type WebAuthnCredentialInfo = {
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

export type WebAuthnServerConfig = {
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
