/**
 * DPoP (Demonstrating Proof of Possession) Implementation
 * RFC 9449: OAuth 2.0 Demonstrating Proof of Possession (DPoP)
 */

import { createClient } from '@supabase/supabase-js';

export interface DPoPKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  jkt: string;
}

export interface DPoPProof {
  jti: string;
  htm: string;
  htu: string;
  iat: number;
  jkt: string;
  nonce?: string;
  signature: string;
}

export async function generateDPoPKeyPair(): Promise<DPoPKeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );

  const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const jkt = await calculateJKT(publicKeyJwk);

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    jkt,
  };
}

export async function calculateJKT(jwk: JsonWebKey): Promise<string> {
  const canonicalJwk = {
    crv: jwk.crv,
    kty: jwk.kty,
    x: jwk.x,
    y: jwk.y,
  };

  const jsonString = JSON.stringify(canonicalJwk);
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  return arrayBufferToBase64URL(hashBuffer);
}

export async function createDPoPProof(
  privateKey: CryptoKey,
  jkt: string,
  method: string,
  url: string,
  nonce?: string
): Promise<DPoPProof> {
  const header = { typ: 'dpop+jwt', alg: 'ES256', jkt };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    jti: generateJTI(),
    htm: method.toUpperCase(),
    htu: url,
    iat: now,
    jkt,
    ...(nonce && { nonce }),
  };

  const jwt = await createJWT(header, payload, privateKey);

  return {
    jti: payload.jti,
    htm: payload.htm,
    htu: payload.htu,
    iat: payload.iat,
    jkt: payload.jkt,
    nonce: payload.nonce,
    signature: jwt,
  };
}

export async function addDPoPBinding(
  sessionId: string,
  jkt: string,
  nonce: string,
  challenge: string,
  signature: string
): Promise<boolean> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase.rpc('add_dpop_binding', {
      p_session_id: sessionId,
      p_dpop_jkt: jkt,
      p_dpop_nonce: nonce,
      p_dpop_challenge: challenge,
      p_dpop_signature: signature,
    });

    return !error;
  } catch (error) {
    console.error('DPoP binding error:', error);
    return false;
  }
}

export function generateDPoPNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return arrayBufferToBase64URL(array.buffer);
}

async function createJWT(header: any, payload: any, privateKey: CryptoKey): Promise<string> {
  const headerB64 = base64URLEncode(JSON.stringify(header));
  const payloadB64 = base64URLEncode(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;

  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const signatureBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    dataBuffer
  );

  const signatureB64 = arrayBufferToBase64URL(signatureBuffer);
  return `${data}.${signatureB64}`;
}

function generateJTI(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return arrayBufferToBase64URL(array.buffer);
}

function arrayBufferToBase64URL(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64URLEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
