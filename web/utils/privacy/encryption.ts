/**
 * Client-Side Encryption Utilities
 * 
 * This module provides user-controlled encryption for sensitive data.
 * All encryption keys are derived from user passwords and never stored server-side.
 * 
 * @created September 9, 2025
 */

export interface EncryptionResult {
  encryptedData: ArrayBuffer;
  salt: Uint8Array;
  iv: Uint8Array;
}

export interface DecryptionResult {
  decryptedData: unknown;
  success: boolean;
  error?: string;
}

export class UserEncryption {
  private userKey: CryptoKey | null = null;
  private salt: Uint8Array | null = null;

  /**
   * Generate a user encryption key from password and salt
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
   * Generate a random salt for key derivation
   */
  generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(16));
  }

  /**
   * Encrypt data using the user's key
   */
  async encryptData(data: unknown): Promise<EncryptionResult> {
    if (!this.userKey) {
      throw new Error('User key not initialized. Call generateUserKey first.');
    }

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(data));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.userKey,
      encoded
    );
    
    if (!this.salt) {
      throw new Error('Salt not initialized');
    }
    
    return {
      encryptedData: encrypted,
      salt: this.salt,
      iv
    };
  }

  /**
   * Decrypt data using the user's key
   */
  async decryptData(encryptedData: ArrayBuffer, salt: Uint8Array, iv: Uint8Array): Promise<DecryptionResult> {
    try {
      if (!this.userKey) {
        throw new Error('User key not initialized. Call generateUserKey first.');
      }

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(iv) },
        this.userKey,
        encryptedData
      );
      
      const decoded = new TextDecoder().decode(decrypted);
      const data = JSON.parse(decoded) as Record<string, unknown>;
      
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
   * Create a hash of the user's encryption key for verification
   * Since we can't export the derived key, we'll create a hash based on the salt and key properties
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
   * Clear the user key from memory
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
   * Convert ArrayBuffer to base64 string for storage
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
   * Convert base64 string back to ArrayBuffer
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
   * Convert Uint8Array to base64 string
   */
  static uint8ArrayToBase64(array: Uint8Array): string {
    return btoa(String.fromCharCode(...array));
  }

  /**
   * Convert base64 string to Uint8Array
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
   * Create demographic buckets to protect individual privacy
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
   * Create regional buckets to protect location privacy
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
   * Create education buckets
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
   * Anonymize user data for analytics
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
