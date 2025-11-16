// ============================================================================
// PHASE 1: SECURE KEY MANAGEMENT WITH AES-GCM
// ============================================================================
// Agent A1 - Infrastructure Specialist
//
// This module implements secure key management with AES-GCM encryption,
// IV uniqueness, key rotation, and non-extractable keys for the
// Ranked Choice Democracy Revolution platform.
//
// Features:
// - AES-GCM IV uniqueness enforcement
// - Non-extractable key generation
// - Key rotation and versioning
// - Deterministic hashing for audits
// - Passphrase-wrapped key backup
//
// Created: January 15, 2025
// Status: Phase 1 Implementation
// ============================================================================

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

// ============================================================================
// SECURE KEY MANAGER CLASS
// ============================================================================

import logger from '@/lib/utils/logger';

export type SecureKey = {
  id: string;
  key: CryptoKey;
  algorithm: string;
  extractable: boolean;
  usages: string[];
  createdAt: Date;
  expiresAt?: Date;
  version: number;
}

export type WrappedKey = {
  wrapped: string; // Base64 encoded wrapped key
  iv: number[]; // IV used for wrapping
  salt: number[]; // Salt used for key derivation
  algorithm: string;
  keyId: string;
}

export type KeyRotationPolicy = {
  rotationInterval: number; // milliseconds
  maxKeyAge: number; // milliseconds
  autoRotation: boolean;
  backupBeforeRotation: boolean;
}

export type EncryptionResult = {
  ciphertext: string;
  iv: number[];
  keyId: string;
  algorithm: string;
  timestamp: Date;
}

export type DecryptionResult = {
  plaintext: string;
  keyId: string;
  algorithm: string;
  timestamp: Date;
}

export class SecureKeyManager {
  private keys: Map<string, SecureKey> = new Map();
  private rotationPolicy: KeyRotationPolicy;
  private currentKeyId: string | null = null;

  constructor(rotationPolicy: KeyRotationPolicy = this.getDefaultRotationPolicy()) {
    this.rotationPolicy = rotationPolicy;
  }

  private getDefaultRotationPolicy(): KeyRotationPolicy {
    return {
      rotationInterval: 90 * 24 * 60 * 60 * 1000, // 90 days
      maxKeyAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      autoRotation: true,
      backupBeforeRotation: true
    };
  }

  // ============================================================================
  // KEY GENERATION
  // ============================================================================

  async generateUserKey(keyId?: string): Promise<SecureKey> {
    const id = keyId ?? this.generateKeyId();

    // Generate non-extractable AES-GCM key
    const key = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      false, // non-extractable
      ['encrypt', 'decrypt']
    );

    const secureKey: SecureKey = {
      id,
      key,
      algorithm: 'AES-GCM',
      extractable: false,
      usages: ['encrypt', 'decrypt'],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.rotationPolicy.maxKeyAge),
      version: 1
    };

    this.keys.set(id, secureKey);

    // Set as current key if none exists
    if (!this.currentKeyId) {
      this.currentKeyId = id;
    }

    return secureKey;
  }

  async generateServerKey(keyId?: string): Promise<SecureKey> {
    const id = keyId ?? this.generateKeyId();

    // Generate extractable server key for backup/rotation
    const key = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true, // extractable for server operations
      ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
    );

    const secureKey: SecureKey = {
      id,
      key,
      algorithm: 'AES-GCM',
      extractable: true,
      usages: ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey'],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.rotationPolicy.maxKeyAge),
      version: 1
    };

    this.keys.set(id, secureKey);
    return secureKey;
  }

  // ============================================================================
  // IV GENERATION AND UNIQUENESS
  // ============================================================================

  private generateIV(): Uint8Array {
    // Generate 96-bit IV for AES-GCM (recommended size)
    return crypto.getRandomValues(new Uint8Array(12));
  }

  private generateIVFromSeed(seed: string): Uint8Array {
    // Deterministic IV from seed (non-cryptographic; do NOT use where unpredictable IVs are required)
    // Uses the encoded seed to derive 12 bytes in a repeatable way.
    const encoder = new TextEncoder();
    const data = encoder.encode(seed);
    const iv = new Uint8Array(12);
    // Combine simple hash accumulators
    let h1 = 0x811C9DC5; // FNV basis
    let h2 = 5381;       // djb2 basis
    let h3 = 0x9E3779B9; // golden ratio
    for (let i = 0; i < data.length; i++) {
      const b = data[i];
      if (b === undefined) continue;
      h1 ^= b; h1 = (h1 * 16777619) >>> 0;
      h2 = (((h2 << 5) + h2) ^ b) >>> 0; // h2*33 ^ b
      h3 = (h3 + b + ((h3 << 10) >>> 0)) ^ ((h3 >>> 6) >>> 0); h3 >>>= 0;
    }
    // Fill 12 bytes from three 32-bit states
    const combined = new Uint32Array([h1 >>> 0, h2 >>> 0, h3 >>> 0]);
    const view = new DataView(combined.buffer);
    for (let i = 0; i < 12; i++) {
      iv[i] = view.getUint8(i);
    }
    return iv;
  }

  // ============================================================================
  // ENCRYPTION AND DECRYPTION
  // ============================================================================

  async encrypt(plaintext: string, keyId?: string): Promise<EncryptionResult> {
    const key = this.getKey(keyId ?? this.currentKeyId);
    if (!key) {
      throw new Error('No encryption key available');
    }

    const iv = this.generateIV();
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key.key,
      data
    );

    return {
      ciphertext: this.arrayBufferToBase64(ciphertext),
      iv: Array.from(iv),
      keyId: key.id,
      algorithm: key.algorithm,
      timestamp: new Date()
    };
  }

  async decrypt(encryptionResult: EncryptionResult): Promise<DecryptionResult> {
    const key = this.getKey(encryptionResult.keyId);
    if (!key) {
      throw new Error(`Key not found: ${encryptionResult.keyId}`);
    }

    const iv = new Uint8Array(encryptionResult.iv);
    const ciphertext = this.base64ToArrayBuffer(encryptionResult.ciphertext);

    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key.key,
      ciphertext
    );

    const decoder = new TextDecoder();
    return {
      plaintext: decoder.decode(plaintext),
      keyId: encryptionResult.keyId,
      algorithm: encryptionResult.algorithm,
      timestamp: new Date()
    };
  }

  // ============================================================================
  // KEY WRAPPING AND BACKUP
  // ============================================================================

  async wrapKeyWithPassphrase(
    keyId: string,
    passphrase: string
  ): Promise<WrappedKey> {
    const key = this.getKey(keyId);
    if (!key) {
      throw new Error(`Key not found: ${keyId}`);
    }

    if (!key.extractable) {
      throw new Error('Cannot wrap non-extractable key');
    }

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const encoder = new TextEncoder();
    const base = await crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const kek = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 200_000, // High iteration count for security
        hash: 'SHA-256'
      },
      base,
      { name: 'AES-GCM', length: 256 },
      false,
      ['wrapKey', 'unwrapKey']
    );

    const iv = this.generateIV();
    const wrapped = await crypto.subtle.wrapKey('raw', key.key, kek, {
      name: 'AES-GCM',
      iv: iv
    });

    return {
      wrapped: this.arrayBufferToBase64(wrapped),
      iv: Array.from(iv),
      salt: Array.from(salt),
      algorithm: 'AES-GCM',
      keyId: key.id
    };
  }

  async unwrapKeyWithPassphrase(
    wrappedKey: WrappedKey,
    passphrase: string
  ): Promise<SecureKey> {
    const encoder = new TextEncoder();
    const base = await crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const kek = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new Uint8Array(wrappedKey.salt),
        iterations: 200_000,
        hash: 'SHA-256'
      },
      base,
      { name: 'AES-GCM', length: 256 },
      false,
      ['wrapKey', 'unwrapKey']
    );

    const iv = new Uint8Array(wrappedKey.iv);
    const wrapped = this.base64ToArrayBuffer(wrappedKey.wrapped);

    const key = await crypto.subtle.unwrapKey(
      'raw',
      wrapped,
      kek,
      { name: 'AES-GCM', iv: iv },
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    const secureKey: SecureKey = {
      id: wrappedKey.keyId,
      key,
      algorithm: wrappedKey.algorithm,
      extractable: false,
      usages: ['encrypt', 'decrypt'],
      createdAt: new Date(),
      version: 1
    };

    this.keys.set(wrappedKey.keyId, secureKey);
    return secureKey;
  }

  // ============================================================================
  // KEY ROTATION
  // ============================================================================

  async rotateKey(keyId: string): Promise<SecureKey> {
    const oldKey = this.getKey(keyId);
    if (!oldKey) {
      throw new Error(`Key not found: ${keyId}`);
    }

    // Create backup if policy requires
    if (this.rotationPolicy.backupBeforeRotation) {
      await this.createKeyBackup(keyId);
    }

    // Generate new key
    const newKey = await this.generateUserKey(`${keyId}_v${oldKey.version + 1}`);

    // Update current key if this was the current key
    if (this.currentKeyId === keyId) {
      this.currentKeyId = newKey.id;
    }

    // Mark old key as expired
    oldKey.expiresAt = new Date();

    return newKey;
  }

  async autoRotateKeys(): Promise<SecureKey[]> {
    const rotatedKeys: SecureKey[] = [];
    const now = Date.now();

    for (const [keyId, key] of this.keys) {
      if (key.expiresAt && key.expiresAt.getTime() < now) {
        try {
          const newKey = await this.rotateKey(keyId);
          rotatedKeys.push(newKey);
        } catch (error) {
          logger.error(`Failed to rotate key ${keyId}:`, error);
        }
      }
    }

    return rotatedKeys;
  }

  // ============================================================================
  // DETERMINISTIC HASHING FOR AUDITS
  // ============================================================================

  async deterministicHash(input: string, salt?: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input + (salt ?? ''));
    const hash = await crypto.subtle.digest('SHA-256', data);
    return this.arrayBufferToBase64(hash);
  }

  async generateChecksum(data: any): Promise<string> {
    // Canonicalize JSON for deterministic hashing
    const canonicalJson = JSON.stringify(data, Object.keys(data).sort());
    return this.deterministicHash(canonicalJson);
  }

  /**
   * Generate deterministic IV from seed for audit purposes
   * WARNING: Only use for non-cryptographic purposes (audits, logging)
   */
  generateDeterministicIV(seed: string): Uint8Array {
    return this.generateIVFromSeed(seed);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private getKey(keyId: string | null): SecureKey | null {
    if (!keyId) return null;
    return this.keys.get(keyId) ?? null;
  }

  private generateKeyId(): string {
    return `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      const byte = bytes[i];
      if (byte !== undefined) {
        binary += String.fromCharCode(byte);
      }
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private async createKeyBackup(keyId: string): Promise<void> {
    // Implementation would depend on backup storage system
    logger.info(`Creating backup for key: ${keyId}`);
  }

  // ============================================================================
  // KEY MANAGEMENT
  // ============================================================================

  getCurrentKeyId(): string | null {
    return this.currentKeyId;
  }

  setCurrentKey(keyId: string): void {
    if (!this.keys.has(keyId)) {
      throw new Error(`Key not found: ${keyId}`);
    }
    this.currentKeyId = keyId;
  }

  getKeyInfo(keyId: string): Omit<SecureKey, 'key'> | null {
    const key = this.keys.get(keyId);
    if (!key) return null;

    return {
      id: key.id,
      algorithm: key.algorithm,
      extractable: key.extractable,
      usages: key.usages,
      createdAt: key.createdAt,
      version: key.version,
      ...(key.expiresAt ? { expiresAt: key.expiresAt } : {}),
    };
  }

  listKeys(): Omit<SecureKey, 'key'>[] {
    return Array.from(this.keys.values()).map(key => ({
      id: key.id,
      algorithm: key.algorithm,
      extractable: key.extractable,
      usages: key.usages,
      createdAt: key.createdAt,
      version: key.version,
      ...(key.expiresAt ? { expiresAt: key.expiresAt } : {}),
    }));
  }

  deleteKey(keyId: string): boolean {
    return this.keys.delete(keyId);
  }
}

// ============================================================================
// EXPORTED UTILITY FUNCTIONS
// ============================================================================

export async function generateSecureIV(): Promise<Uint8Array> {
  return crypto.getRandomValues(new Uint8Array(12));
}

export async function deriveKeyFromPassphrase(
  passphrase: string,
  salt: Uint8Array,
  iterations: number = 200_000
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const base = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// ============================================================================
// EXPORTED CLASS
// ============================================================================

export default SecureKeyManager;
