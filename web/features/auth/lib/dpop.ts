/**
 * DPoP (Demonstrating Proof of Possession) Implementation
 * 
 * Implements RFC 9449 compliant DPoP token binding for enhanced security.
 * Provides secure key generation, proof creation, and JKT calculation.
 * 
 * @author Choices Platform
 * @version 1.0.0
 * @since 2024-12-27
 */


import { logger } from '@/lib/utils/logger';

export type DPoPKeyPair = {
  publicKey: CryptoKey
  privateKey: CryptoKey
  jkt: string
}

export type DPoPProof = {
  jti: string
  htm: string
  htu: string
  iat: number
  jkt: string
  nonce?: string
  signature: string
}

/**
 * Generate a cryptographically secure DPoP key pair using Web Crypto API
 * Implements RFC 9449 requirements for ECDSA P-256 key generation
 */
export async function generateDPoPKeyPair(): Promise<DPoPKeyPair> {
  // Generate ECDSA P-256 key pair as required by RFC 9449
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    true, // extractable
    ['sign', 'verify']
  )

  // Export public key as JWK for JKT calculation
  const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey)
  
  // Calculate JKT (JSON Web Key Thumbprint)
  const jkt = await calculateJKT(publicKeyJwk)
  
  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    jkt
  }
}

/**
 * Calculate JKT (JSON Web Key Thumbprint) from JWK
 * Implements RFC 7638 JSON Web Key (JWK) Thumbprint
 */
export async function calculateJKT(jwk: JsonWebKey): Promise<string> {
  // Create canonical JWK structure (RFC 7638)
  const canonicalJwk = {
    crv: jwk.crv,
    kty: jwk.kty,
    x: jwk.x,
    y: jwk.y
  }
  
  // Canonicalize JSON (sorted keys, no whitespace)
  const canonicalJson = JSON.stringify(canonicalJwk, Object.keys(canonicalJwk).sort())
  
  // Calculate SHA-256 hash
  const encoder = new TextEncoder()
  const data = encoder.encode(canonicalJson)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  
  // Convert to base64url
  return arrayBufferToBase64URL(hashBuffer)
}

/**
 * Create a DPoP proof for a specific HTTP request
 * Implements RFC 9449 DPoP proof creation
 */
export async function createDPoPProof(
  privateKey: CryptoKey,
  jkt: string,
  htm: string,
  htu: string,
  nonce?: string
): Promise<DPoPProof> {
  // Generate unique JTI (JWT ID)
  const jti = arrayBufferToBase64URL(crypto.getRandomValues(new Uint8Array(16)).buffer)
  
  // Current timestamp
  const iat = Math.floor(Date.now() / 1000)
  
  // Create JWT header (RFC 9449)
  const header = {
    typ: 'dpop+jwt',
    alg: 'ES256',
    jkt
  }
  
  // Create JWT payload (RFC 9449)
  const payload = {
    jti,
    htm: htm.toUpperCase(),
    htu,
    iat,
    jkt,
    ...(nonce && { nonce })
  }
  
  // Create JWT
  const jwt = await createJWT(header, payload, privateKey)
  
  return {
    jti,
    htm: htm.toUpperCase(),
    htu,
    iat,
    jkt,
    ...(nonce && { nonce }),
    signature: jwt
  }
}

/**
 * Verify a DPoP proof
 */
export async function verifyDPoPProof(
  proof: DPoPProof,
  publicKey: CryptoKey
): Promise<boolean> {
  try {
    // Verify JWT signature
    const isValid = await verifyJWT(proof.signature, publicKey)
    
    if (!isValid) {
      return false
    }
    
    // Verify JKT matches
    const publicKeyJwk = await crypto.subtle.exportKey('jwk', publicKey)
    const expectedJkt = await calculateJKT(publicKeyJwk)
    
    return proof.jkt === expectedJkt
  } catch (error) {
    logger.error('DPoP proof verification failed:', error instanceof Error ? error : new Error(String(error)))
    return false
  }
}

/**
 * Create JWT with ECDSA signature
 */
async function createJWT(header: any, payload: any, privateKey: CryptoKey): Promise<string> {
  // Encode header and payload
  const headerB64 = base64URLEncode(JSON.stringify(header))
  const payloadB64 = base64URLEncode(JSON.stringify(payload))
  
  // Create signing input
  const signingInput = `${headerB64}.${payloadB64}`
  
  // Sign with ECDSA
  const encoder = new TextEncoder()
  const data = encoder.encode(signingInput)
  const signature = await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: 'SHA-256'
    },
    privateKey,
    data
  )
  
  // Encode signature
  const signatureB64 = arrayBufferToBase64URL(signature)
  
  // Return complete JWT
  return `${signingInput}.${signatureB64}`
}

/**
 * Verify JWT signature
 */
async function verifyJWT(jwt: string, publicKey: CryptoKey): Promise<boolean> {
  try {
    const parts = jwt.split('.')
    if (parts.length !== 3) {
      return false
    }
    
    const [headerB64, payloadB64, signatureB64] = parts
    const signingInput = `${headerB64}.${payloadB64}`
    
    // Decode signature
    const signature = base64URLDecode(signatureB64 || '')
    
    // Verify signature
    const encoder = new TextEncoder()
    const data = encoder.encode(signingInput)
    
    return await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: 'SHA-256'
      },
      publicKey,
      signature,
      data
    )
  } catch (error) {
    logger.error('JWT verification failed:', error instanceof Error ? error : new Error(String(error)))
    return false
  }
}

/**
 * Generate a secure nonce for DPoP challenges
 */
export function generateDPoPNonce(): string {
  return arrayBufferToBase64URL(crypto.getRandomValues(new Uint8Array(32)).buffer)
}

/**
 * Validate DPoP proof timestamp (within 5 minutes)
 */
export function validateDPoPTimestamp(iat: number): boolean {
  const now = Math.floor(Date.now() / 1000)
  const fiveMinutes = 5 * 60
  
  return Math.abs(now - iat) <= fiveMinutes
}

/**
 * Create a DPoP challenge for client authentication
 */
export async function createDPoPChallenge(
  htu: string,
  htm: string = 'POST'
): Promise<{ nonce: string; challenge: string }> {
  const nonce = generateDPoPNonce()
  const challengeData = `${nonce}:${htu}:${htm}`
  
  const encoder = new TextEncoder()
  const data = encoder.encode(challengeData)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const challenge = arrayBufferToBase64URL(hashBuffer)
  
  return { nonce, challenge }
}

/**
 * Utility function to convert ArrayBuffer to base64url
 */
function arrayBufferToBase64URL(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i] || 0)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Utility function to convert base64url to ArrayBuffer
 */
function base64URLDecode(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - base64.length % 4) % 4)
  const base64Padded = base64 + padding
  
  const binary = atob(base64Padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  
  return bytes.buffer
}

/**
 * Utility function to encode string to base64url
 */
function base64URLEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}
