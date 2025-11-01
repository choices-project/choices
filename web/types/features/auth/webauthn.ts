/**
 * WebAuthn Types
 * 
 * Type definitions for WebAuthn functionality
 */

export type WebAuthnCredential = {
  id: string;
  type: 'public-key';
  transports: string[];
}

export type WebAuthnUser = {
  id: string;
  name: string;
  displayName: string;
}

export type WebAuthnOptions = {
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

export type WebAuthnAttestation = {
  id: string;
  rawId: string;
  response: {
    attestationObject: string;
    clientDataJSON: string;
  };
  type: string;
}
