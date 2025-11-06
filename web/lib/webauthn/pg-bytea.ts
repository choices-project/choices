/**
 * PostgreSQL BYTEA Utilities for WebAuthn
 * 
 * Handles binary data storage and retrieval for WebAuthn credentials.
 * Converts between ArrayBuffer/Uint8Array and PostgreSQL BYTEA format.
 * 
 * Note: This file now re-exports functions from type-converters.ts to maintain
 * backward compatibility while avoiding code duplication.
 */

import { devLog } from '@/lib/utils/logger';
import { withOptional } from '@/lib/util/objects';

import {
  arrayBufferToBytea,
  uint8ArrayToBytea,
  byteaToArrayBuffer,
  byteaToUint8Array,
  arrayBufferToBase64url,
  base64urlToArrayBuffer,
  sanitizeCredentialId,
  generateSecureRandomBytes,
  stringAaguidToBytea
} from './type-converters';

// Re-export type converter functions for backward compatibility
export {
  arrayBufferToBytea,
  uint8ArrayToBytea,
  byteaToArrayBuffer,
  byteaToUint8Array,
  arrayBufferToBase64url,
  base64urlToArrayBuffer,
  sanitizeCredentialId,
  generateSecureRandomBytes,
  stringAaguidToBytea
};

/**
 * Convert base64 string to PostgreSQL BYTEA format
 */
export function base64ToBytea(base64: string): string {
  // Remove data URL prefix if present
  const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, '');
  
  // Convert base64 to binary
  const binaryString = atob(cleanBase64);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return uint8ArrayToBytea(bytes);
}

/**
 * Convert PostgreSQL BYTEA format to base64 string
 */
export function byteaToBase64(bytea: string): string {
  const uint8Array = byteaToUint8Array(bytea);
  const binaryString = Array.from(uint8Array)
    .map(byte => String.fromCharCode(byte))
    .join('');
  
  return btoa(binaryString);
}



/**
 * Validate credential ID format
 */
export function isValidCredentialId(credentialId: string): boolean {
  // WebAuthn credential IDs should be base64url encoded
  return /^[A-Za-z0-9_-]+$/.test(credentialId) && credentialId.length > 0;
}

/**
 * Log credential operations for debugging
 */
export function logCredentialOperation(
  operation: 'create' | 'read' | 'update' | 'delete',
  credentialId: string,
  userId?: string,
  error?: Error
): void {
  const logData = {
    operation,
    credentialId: credentialId.substring(0, 8) + '...', // Truncate for privacy
    userId,
    timestamp: new Date().toISOString(),
  };

  if (error) {
    devLog('WebAuthn credential operation failed:', withOptional(logData, { error: error.message }));
  } else {
    devLog('WebAuthn credential operation:', logData);
  }
}

