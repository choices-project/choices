/**
 * WebAuthn Types
 * 
 * Type definitions for WebAuthn functionality
 */

export interface WebAuthnCredential {
  id: string;
  type: 'public-key';
  transports: string[];
}

export interface WebAuthnUser {
  id: string;
  name: string;
  displayName: string;
}

export interface WebAuthnOptions {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: WebAuthnUser;
  pubKeyCredParams: Array<{
    type: string;
    alg: number;
  }>;
  timeout: number;
  attestation: string;
}

export interface WebAuthnAttestation {
  id: string;
  rawId: string;
  response: {
    attestationObject: string;
    clientDataJSON: string;
  };
  type: string;
}
