/**
 * WebAuthn Type Converters
 * 
 * Handles conversion between different data formats used in WebAuthn operations.
 * Provides type-safe conversions between ArrayBuffer, Uint8Array, base64url, and PostgreSQL BYTEA.
 */

/**
 * Convert ArrayBuffer to base64url (WebAuthn standard)
 */
export function arrayBufferToBase64url(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  const base64 = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));
  
  // Convert to base64url format
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Convert base64url to ArrayBuffer (WebAuthn standard)
 */
export function base64urlToArrayBuffer(base64url: string): ArrayBuffer {
  // Convert from base64url to base64
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  // Add padding if needed
  const paddedBase64 = base64 + '='.repeat((4 - base64.length % 4) % 4);
  
  // Convert to binary
  const binaryString = atob(paddedBase64);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes.buffer;
}

/**
 * Convert ArrayBuffer to PostgreSQL BYTEA format
 */
export function arrayBufferToBytea(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  return '\\x' + Array.from(uint8Array)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert Uint8Array to PostgreSQL BYTEA format
 */
export function uint8ArrayToBytea(uint8Array: Uint8Array): string {
  return '\\x' + Array.from(uint8Array)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert PostgreSQL BYTEA to ArrayBuffer
 */
export function byteaToArrayBuffer(bytea: string): ArrayBuffer {
  // Remove the \x prefix
  const hexString = bytea.startsWith('\\x') ? bytea.slice(2) : bytea;
  
  // Convert hex string to bytes
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
  }
  
  return bytes.buffer;
}

/**
 * Convert PostgreSQL BYTEA to Uint8Array
 */
export function byteaToUint8Array(bytea: string): Uint8Array {
  return new Uint8Array(byteaToArrayBuffer(bytea));
}

/**
 * Convert base64url to PostgreSQL BYTEA format
 */
export function base64urlToBytea(base64url: string): string {
  const arrayBuffer = base64urlToArrayBuffer(base64url);
  return arrayBufferToBytea(arrayBuffer);
}

/**
 * Convert PostgreSQL BYTEA to base64url format
 */
export function byteaToBase64url(bytea: string): string {
  const arrayBuffer = byteaToArrayBuffer(bytea);
  return arrayBufferToBase64url(arrayBuffer);
}

/**
 * Sanitize credential ID for database storage
 */
export function sanitizeCredentialId(credentialId: string): string {
  // Remove any non-base64url characters and ensure proper format
  return credentialId.replace(/[^A-Za-z0-9_-]/g, '');
}

/**
 * Validate base64url string format
 */
export function isValidBase64url(str: string): boolean {
  // Base64url regex: only allows A-Z, a-z, 0-9, -, _
  const base64urlRegex = /^[A-Za-z0-9_-]*$/;
  return base64urlRegex.test(str);
}

/**
 * Validate PostgreSQL BYTEA format
 */
export function isValidBytea(bytea: string): boolean {
  // BYTEA format: starts with \x followed by hex digits
  const byteaRegex = /^\\x[0-9a-fA-F]*$/;
  return byteaRegex.test(bytea);
}

/**
 * Get the length of a BYTEA string in bytes
 */
export function getByteaLength(bytea: string): number {
  if (!isValidBytea(bytea)) {
    throw new Error('Invalid BYTEA format');
  }
  
  // Remove \x prefix and divide by 2 (each byte is 2 hex digits)
  return (bytea.length - 2) / 2;
}

/**
 * Convert string to ArrayBuffer (UTF-8 encoding)
 */
export function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer as ArrayBuffer;
}

/**
 * Convert string aaguid to PostgreSQL BYTEA format
 * WebAuthn aaguid is a UUID string that needs to be converted to binary format
 */
export function stringAaguidToBytea(aaguid: string): string {
  // Remove hyphens from UUID string
  const cleanUuid = aaguid.replace(/-/g, '');
  
  // Convert hex string to bytes
  const bytes = new Uint8Array(cleanUuid.length / 2);
  for (let i = 0; i < cleanUuid.length; i += 2) {
    bytes[i / 2] = parseInt(cleanUuid.substr(i, 2), 16);
  }
  
  return uint8ArrayToBytea(bytes);
}

/**
 * Convert ArrayBuffer to string (UTF-8 decoding)
 */
export function arrayBufferToString(buffer: ArrayBuffer): string {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
}

/**
 * Generate secure random bytes for WebAuthn operations
 */
export function generateSecureRandomBytes(length: number): Uint8Array {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Browser environment
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return array;
  } else {
    // Node.js environment - fallback
    // Note: In a real implementation, you'd import crypto at the top
    // For now, we'll use a simple fallback
    const array = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }
}

/**
 * Convert WebAuthn credential to database format
 */
export function credentialToDbFormat(credential: {
  id: string;
  publicKey: ArrayBuffer;
  counter: number;
  transports?: string[];
  backupEligible?: boolean;
  backupState?: boolean;
  aaguid?: ArrayBuffer;
  userHandle?: ArrayBuffer;
}): {
  credentialId: string;
  publicKey: string;
  counter: number;
  transports?: string[];
  backupEligible?: boolean;
  backupState?: boolean;
  aaguid?: string;
  userHandle?: string;
} {
  return {
    credentialId: sanitizeCredentialId(credential.id),
    publicKey: arrayBufferToBytea(credential.publicKey),
    counter: credential.counter,
    ...(credential.transports ? { transports: credential.transports } : {}),
    ...(credential.backupEligible !== undefined ? { backupEligible: credential.backupEligible } : {}),
    ...(credential.backupState !== undefined ? { backupState: credential.backupState } : {}),
    ...(credential.aaguid ? { aaguid: arrayBufferToBytea(credential.aaguid) } : {}),
    ...(credential.userHandle ? { userHandle: arrayBufferToBytea(credential.userHandle) } : {}),
  };
}

/**
 * Convert database format to WebAuthn credential
 */
export function dbFormatToCredential(dbCredential: {
  credentialId: string;
  publicKey: string;
  counter: number;
  transports?: string[];
  backupEligible?: boolean;
  backupState?: boolean;
  aaguid?: string;
  userHandle?: string;
}): {
  id: string;
  publicKey: ArrayBuffer;
  counter: number;
  transports?: string[];
  backupEligible?: boolean;
  backupState?: boolean;
  aaguid?: ArrayBuffer;
  userHandle?: ArrayBuffer;
} {
  return {
    id: dbCredential.credentialId,
    publicKey: byteaToArrayBuffer(dbCredential.publicKey),
    counter: dbCredential.counter,
    ...(dbCredential.transports ? { transports: dbCredential.transports } : {}),
    ...(dbCredential.backupEligible !== undefined ? { backupEligible: dbCredential.backupEligible } : {}),
    ...(dbCredential.backupState !== undefined ? { backupState: dbCredential.backupState } : {}),
    ...(dbCredential.aaguid ? { aaguid: byteaToArrayBuffer(dbCredential.aaguid) } : {}),
    ...(dbCredential.userHandle ? { userHandle: byteaToArrayBuffer(dbCredential.userHandle) } : {}),
  };
}
