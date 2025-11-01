/**
 * Native WebAuthn API Types
 * 
 * TypeScript interfaces for native WebAuthn API implementation
 * Replaces @simplewebauthn/server types with native browser API types
 */

// Native WebAuthn API Types
export type PublicKeyCredentialCreationOptions = {
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

export type PublicKeyCredentialRequestOptions = {
  challenge: ArrayBuffer;
  allowCredentials?: PublicKeyCredentialDescriptor[];
  timeout?: number;
  rpId?: string;
  userVerification?: UserVerificationRequirement;
  extensions?: AuthenticationExtensionsClientInputs;
}

export type PublicKeyCredentialDescriptor = {
  type: PublicKeyCredentialType;
  id: ArrayBuffer;
  transports?: AuthenticatorTransport[];
}

export type PublicKeyCredentialParameters = {
  type: PublicKeyCredentialType;
  alg: number;
}

export type PublicKeyCredentialRpEntity = {
  id?: string;
  name: string;
}

export type PublicKeyCredentialUserEntity = {
  id: ArrayBuffer;
  name: string;
  displayName: string;
}

export type AuthenticatorSelectionCriteria = {
  authenticatorAttachment?: AuthenticatorAttachment;
  userVerification?: UserVerificationRequirement;
  residentKey?: ResidentKeyRequirement;
}

export type AuthenticatorAttestationResponse = {
  attestationObject: ArrayBuffer;
} & AuthenticatorResponse

export type AuthenticatorAssertionResponse = {
  authenticatorData: ArrayBuffer;
  signature: ArrayBuffer;
  userHandle: ArrayBuffer | null;
} & AuthenticatorResponse

export type AuthenticatorResponse = {
  clientDataJSON: ArrayBuffer;
}

// WebAuthn Algorithm Identifiers
export const WEBAUTHN_ALGORITHMS = {
  ES256: -7,
  RS256: -257,
  PS256: -37,
  ES384: -35,
  ES512: -36,
  RS384: -258,
  RS512: -259,
  PS384: -38,
  PS512: -39,
  EDDSA: -8,
} as const;

// WebAuthn Error Types
export type WebAuthnError = {
  name: 'NotAllowedError' | 'NotSupportedError' | 'SecurityError' | 'UnknownError';
  code?: number;
} & Error

// Registration Response Types
export type RegistrationResponse = {
  id: string;
  rawId: string;
  response: AuthenticatorAttestationResponse;
  type: 'public-key';
  clientExtensionResults: AuthenticationExtensionsClientOutputs;
}

export type AuthenticationResponse = {
  id: string;
  rawId: string;
  response: AuthenticatorAssertionResponse;
  type: 'public-key';
  clientExtensionResults: AuthenticationExtensionsClientOutputs;
}

// Server-side Verification Types
export type VerificationResult = {
  verified: boolean;
  credentialId: string;
  publicKey: ArrayBuffer;
  counter: number;
  transports?: AuthenticatorTransport[];
  backupEligible?: boolean;
  backupState?: boolean;
  aaguid?: string;
  userHandle?: ArrayBuffer | null;
  error?: string;
}

export type AuthenticationVerificationResult = {
  verified: boolean;
  credentialId: string;
  newCounter: number;
  error?: string;
}

// Database Types
export type WebAuthnCredential = {
  id: string;
  userId: string;
  rpId: string;
  credentialId: string;
  publicKey: string; // Base64 encoded
  counter: number;
  transports?: AuthenticatorTransport[];
  backupEligible?: boolean;
  backupState?: boolean;
  aaguid?: string;
  userHandle?: string;
  createdAt: Date;
  lastUsedAt?: Date;
}

export type WebAuthnChallenge = {
  id: string;
  userId: string;
  rpId: string;
  kind: 'registration' | 'authentication';
  challenge: string; // Base64 encoded
  expiresAt: Date;
  usedAt?: Date;
}

// Configuration Types
export type WebAuthnConfig = {
  rpId: string;
  rpName: string;
  allowedOrigins: string[];
  challengeTtl: number; // in seconds
  timeout: number; // in milliseconds
  attestation: AttestationConveyancePreference;
  userVerification: UserVerificationRequirement;
  residentKey: ResidentKeyRequirement;
  authenticatorAttachment?: AuthenticatorAttachment;
}

// Error Message Types
export type WebAuthnErrorMessages = {
  'NotAllowedError': string;
  'NotSupportedError': string;
  'SecurityError': string;
  'UnknownError': string;
  'AbortError': string;
  'InvalidStateError': string;
  'ConstraintError': string;
  'NotReadableError': string;
  'NetworkError': string;
}

// Utility Types
export type Base64URLString = string;
export type BufferSource = ArrayBuffer | ArrayBufferView;
export type AuthenticatorTransport = 'usb' | 'nfc' | 'ble' | 'internal' | 'hybrid';
export type AuthenticatorAttachment = 'platform' | 'cross-platform';
export type UserVerificationRequirement = 'required' | 'preferred' | 'discouraged';
export type ResidentKeyRequirement = 'required' | 'preferred' | 'discouraged';
export type AttestationConveyancePreference = 'none' | 'indirect' | 'direct';

// Client Extension Results
export type AuthenticationExtensionsClientOutputs = {
  appid?: boolean;
  credProps?: {
    rk?: boolean;
  };
  hmacCreateSecret?: boolean;
  largeBlob?: {
    supported?: boolean;
  };
  minPinLength?: number;
  prf?: {
    enabled?: boolean;
    results?: {
      first: ArrayBuffer;
      second?: ArrayBuffer;
    };
  };
  uvm?: number[][];
}

// Server Extension Results
export type AuthenticationExtensionsServerOutputs = {
  appid?: boolean;
  credProps?: {
    rk?: boolean;
  };
  hmacCreateSecret?: boolean;
  largeBlob?: {
    supported?: boolean;
  };
  minPinLength?: number;
  prf?: {
    enabled?: boolean;
    results?: {
      first: ArrayBuffer;
      second?: ArrayBuffer;
    };
  };
  uvm?: number[][];
}
