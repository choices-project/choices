// WebAuthn Types for Choices Platform
// Created: 2025-01-16
// Purpose: Type definitions for WebAuthn authentication

/**
 * Use built-in DOM types where possible
 */
export type AttestationResponse = AuthenticatorAttestationResponse;
export type AssertionResponse = AuthenticatorAssertionResponse;
export type PublicKeyCred = PublicKeyCredential;

/**
 * WebAuthn authentication component props
 */
export type WebAuthnAuthProps = {
  onSuccess: (credential: PublicKeyCredential) => void;
  onError: (error: Error) => void;
  mode: 'register' | 'authenticate';
  disabled?: boolean;
  className?: string;
}

/**
 * WebAuthn credential response for API serialization
 * Note: ArrayBuffers are converted to base64url at the edge, not in types
 */
export type WebAuthnCredentialResponse = {
  id: string;
  type: string;
  rawId: string; // base64url encoded
  response: {
    clientDataJSON: string; // base64url encoded
    attestationObject?: string; // base64url encoded
    authenticatorData?: string; // base64url encoded
    signature?: string; // base64url encoded
    userHandle?: string; // base64url encoded
  };
}

/**
 * WebAuthn registration result
 */
export type WebAuthnRegistrationResult = {
  success: boolean;
  credentialId: string;
  publicKey: string;
  error?: string;
}

/**
 * WebAuthn authentication result
 */
export type WebAuthnAuthenticationResult = {
  success: boolean;
  credentialId: string;
  signature: string;
  error?: string;
}


