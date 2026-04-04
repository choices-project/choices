/**
 * Client-Side Encryption Utilities
 * 
 * This module provides user-controlled encryption for sensitive data.
 * All encryption keys are derived from user passwords and never stored server-side.
 * 
 * Originated September 9, 2025. Last reviewed (trust-layer documentation): April 4, 2026.
 */

export type EncryptionResult = {
  encryptedData: ArrayBuffer;
  salt: Uint8Array;
  iv: Uint8Array;
}

export type DecryptionResult = {
  decryptedData: unknown;
  success: boolean;
  error?: string;
}

export class UserEncryption {
  private userKey: CryptoKey | null = null;
  private salt: Uint8Array | null = null;

  /**
   * Derive an AES-GCM key from the user's password and salt (PBKDF2).
   *
   * @param password - User passphrase; never stored by this class.
   * @param salt - Random salt for key derivation; typically from {@link generateSalt}.
   * @returns The derived {@link CryptoKey} for AES-GCM encrypt/decrypt.
   */
  async generateUserKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    this.userKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new Uint8Array(salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    
    this.salt = salt;
    return this.userKey;
  }

  /**
   * Create a random 16-byte salt for PBKDF2.
   *
   * @returns New cryptographically random salt.
   */
  generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(16));
  }

  /**
   * Serialize `data` as JSON, encrypt with AES-GCM using the current user key.
   *
   * @param data - Any JSON-serializable value.
   * @returns Ciphertext, salt (from key setup), and IV — salt may be empty if key not derived with salt stored here.
   * @throws If `generateUserKey` was not called first.
   */
  async encryptData(data: unknown): Promise<EncryptionResult> {
    if (!this.userKey) {
      throw new Error('User key not initialized. Call generateUserKey first.');
    }

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(data));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      this.userKey,
      encoded
    );
    
    return {
      encryptedData: encrypted,
      salt: this.salt ?? new Uint8Array(),
      iv: iv
    };
  }

  /**
   * Decrypt AES-GCM ciphertext with the current user key.
   *
   * @param encryptedData - Raw ciphertext from {@link encryptData}.
   * @param _salt - Unused; kept for API symmetry with encryption (key already encodes salt).
   * @param iv - Initialization vector used for this ciphertext.
   * @returns Parsed JSON as `decryptedData` on success, or `success: false` with `error` message.
   */
  async decryptData(encryptedData: ArrayBuffer, _salt: Uint8Array, iv: Uint8Array): Promise<DecryptionResult> {
    try {
      if (!this.userKey) {
        throw new Error('User key not initialized. Call generateUserKey first.');
      }

      // Salt is not used here as the key is already derived from salt during key generation
      // The salt parameter is kept for API consistency with encryption methods

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(iv) },
        this.userKey,
        encryptedData
      );
      
      const decoded = new TextDecoder().decode(decrypted);
      const data = JSON.parse(decoded);
      
      return {
        decryptedData: data,
        success: true
      };
    } catch (error) {
      return {
        decryptedData: null,
        success: false,
        error: error instanceof Error ? error.message : 'Decryption failed'
      };
    }
  }

  /**
   * Fingerprint the current key setup (algorithm metadata + salt) for verification; not a key export.
   *
   * @returns Lowercase hex SHA-256 digest of a JSON payload describing salt and algorithm.
   * @throws If the user key or salt was not initialized.
   */
  async createKeyHash(): Promise<string> {
    if (!this.userKey || !this.salt) {
      throw new Error('User key not initialized');
    }

    // Create a hash based on the salt and key algorithm info
    const keyInfo = {
      algorithm: 'AES-GCM',
      length: 256,
      salt: Array.from(this.salt)
    };
    
    const keyInfoString = JSON.stringify(keyInfo);
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(keyInfoString));
    const hashArray = new Uint8Array(hashBuffer);
    return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Drop references to the derived key and salt from this instance.
   */
  clearKey(): void {
    this.userKey = null;
    this.salt = null;
  }
}

/**
 * Utility functions for working with encrypted data
 */
export class EncryptionUtils {
  /**
   * @param buffer - Raw binary data.
   * @returns Base64-encoded string suitable for JSON/DB storage.
   */
  static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i] ?? 0);
    }
    return btoa(binary);
  }

  /**
   * @param base64 - Standard base64 string.
   * @returns Decoded bytes as an `ArrayBuffer`.
   */
  static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * @param array - Byte array (e.g. salt or IV).
   * @returns Base64-encoded string.
   */
  static uint8ArrayToBase64(array: Uint8Array): string {
    return btoa(String.fromCharCode(...array));
  }

  /**
   * @param base64 - Standard base64 string.
   * @returns Decoded bytes as `Uint8Array`.
   */
  static base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    return new Uint8Array(binary.length).map((_, i) => binary.charCodeAt(i));
  }
}

/**
 * Privacy-preserving data processing utilities
 */
export class PrivacyUtils {
  /**
   * Map a numeric age to a coarse bucket label for analytics.
   *
   * @param age - Age in years.
   * @returns Bucket id string (e.g. `age_25_34`).
   */
  static createAgeBucket(age: number): string {
    if (age < 18) return 'under_18';
    if (age <= 24) return 'age_18_24';
    if (age <= 34) return 'age_25_34';
    if (age <= 44) return 'age_35_44';
    if (age <= 54) return 'age_45_54';
    if (age <= 64) return 'age_55_64';
    return 'age_65_plus';
  }

  /**
   * Map free-text location hints to a coarse U.S.-oriented region bucket.
   *
   * @param location - User-provided location string; may be partial.
   * @returns Region bucket id or `region_other`.
   */
  static createRegionBucket(location: string): string {
    // Handle null/undefined values
    if (!location || typeof location !== 'string') {
      return 'region_other';
    }
    
    // Simple regional bucketing - can be made more sophisticated
    const region = location.toLowerCase();
    
    // Northeast states
    if (region.includes('new york') || region.includes('massachusetts') || 
        region.includes('connecticut') || region.includes('rhode island') ||
        region.includes('vermont') || region.includes('new hampshire') ||
        region.includes('maine') || region.includes('north') || 
        region.includes('northeast')) return 'region_northeast';
    
    // Southeast states  
    if (region.includes('florida') || region.includes('georgia') ||
        region.includes('south carolina') || region.includes('north carolina') ||
        region.includes('virginia') || region.includes('west virginia') ||
        region.includes('kentucky') || region.includes('tennessee') ||
        region.includes('alabama') || region.includes('mississippi') ||
        region.includes('louisiana') || region.includes('arkansas') ||
        region.includes('south') || region.includes('southeast')) return 'region_southeast';
    
    // Southwest states
    if (region.includes('california') || region.includes('texas') ||
        region.includes('arizona') || region.includes('new mexico') ||
        region.includes('nevada') || region.includes('utah') ||
        region.includes('colorado') || region.includes('west') || 
        region.includes('southwest')) return 'region_southwest';
    
    // Midwest states
    if (region.includes('illinois') || region.includes('ohio') ||
        region.includes('michigan') || region.includes('indiana') ||
        region.includes('wisconsin') || region.includes('minnesota') ||
        region.includes('iowa') || region.includes('missouri') ||
        region.includes('kansas') || region.includes('nebraska') ||
        region.includes('north dakota') || region.includes('south dakota') ||
        region.includes('midwest') || region.includes('central')) return 'region_midwest';
    
    return 'region_other';
  }

  /**
   * Normalize education description to a coarse bucket.
   *
   * @param education - Free-text education level.
   * @returns Education bucket id or `education_other`.
   */
  static createEducationBucket(education: string): string {
    // Handle null/undefined values
    if (!education || typeof education !== 'string') {
      return 'education_other';
    }
    
    const edu = education.toLowerCase();
    if (edu.includes('high school') || edu.includes('secondary')) return 'education_high_school';
    if (edu.includes('associate') || edu.includes('2-year')) return 'education_associate';
    if (edu.includes('bachelor') || edu.includes('4-year')) return 'education_bachelor';
    if (edu.includes('master') || edu.includes('graduate')) return 'education_master';
    if (edu.includes('doctorate') || edu.includes('phd')) return 'education_doctorate';
    return 'education_other';
  }

  /**
   * Strip direct identifiers and replace granular fields with buckets.
   *
   * @param userData - Raw profile-like object with optional `age`, `location`, `education`.
   * @returns Object safe for aggregate analytics (buckets only; ids nulled out).
   */
  static anonymizeForAnalytics(userData: Record<string, unknown>): Record<string, unknown> {
    const age = typeof userData.age === 'number' ? userData.age : 0;
    const location = typeof userData.location === 'string' ? userData.location : '';
    const education = typeof userData.education === 'string' ? userData.education : '';
    
    return {
      age_bucket: this.createAgeBucket(age),
      region_bucket: this.createRegionBucket(location),
      education_bucket: this.createEducationBucket(education),
      // Remove all identifying information
      user_id: undefined,
      email: undefined,
      name: undefined,
      exact_location: undefined,
      exact_age: undefined
    };
  }
}
