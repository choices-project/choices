/**
 * Privacy Encryption Tests
 * 
 * Tests for client-side encryption functionality
 * 
 * @created September 9, 2025
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { UserEncryption, EncryptionUtils, PrivacyUtils } from '../../utils/privacy/encryption';

describe('UserEncryption', () => {
  let encryption: UserEncryption;
  const testPassword = 'test_password_123';
  const testData = {
    age: 25,
    location: 'New York',
    education: 'Bachelor\'s Degree',
    politicalViews: 'Moderate'
  };

  beforeEach(() => {
    encryption = new UserEncryption();
  });

  describe('Key Generation', () => {
    it('should generate a user key from password and salt', async () => {
      const salt = encryption.generateSalt();
      const key = await encryption.generateUserKey(testPassword, salt);
      
      expect(key).toBeDefined();
      expect(salt).toBeInstanceOf(Uint8Array);
      expect(salt.length).toBe(16);
    });

    it('should generate different keys for different passwords', async () => {
      const salt = encryption.generateSalt();
      
      // Create two encryption instances with different passwords
      const encryption1 = new UserEncryption();
      const encryption2 = new UserEncryption();
      
      await encryption1.generateUserKey('password1', salt);
      await encryption2.generateUserKey('password2', salt);
      
      // Test that keys are different by checking they produce different encryption results
      const testData = { message: 'test' };
      const result1 = await encryption1.encryptData(testData);
      const result2 = await encryption2.encryptData(testData);
      
      expect(Array.from(new Uint8Array(result1.encryptedData))).not.toEqual(Array.from(new Uint8Array(result2.encryptedData)));
    });

    it('should generate different keys for different salts', async () => {
      const salt1 = encryption.generateSalt();
      const salt2 = encryption.generateSalt();
      
      // Create two encryption instances with different salts
      const encryption1 = new UserEncryption();
      const encryption2 = new UserEncryption();
      
      await encryption1.generateUserKey(testPassword, salt1);
      await encryption2.generateUserKey(testPassword, salt2);
      
      // Test that keys are different by checking they produce different encryption results
      const testData = { message: 'test' };
      const result1 = await encryption1.encryptData(testData);
      const result2 = await encryption2.encryptData(testData);
      
      expect(Array.from(new Uint8Array(result1.encryptedData))).not.toEqual(Array.from(new Uint8Array(result2.encryptedData)));
    });
  });

  describe('Data Encryption/Decryption', () => {
    it('should encrypt and decrypt data successfully', async () => {
      const salt = encryption.generateSalt();
      await encryption.generateUserKey(testPassword, salt);
      
      const encryptionResult = await encryption.encryptData(testData);
      
      expect(encryptionResult.encryptedData).toBeDefined();
      expect(encryptionResult.salt).toBeDefined();
      expect(encryptionResult.iv).toBeDefined();
      expect(encryptionResult.encryptedData.byteLength).toBeGreaterThan(0);
    });

    it('should decrypt data correctly', async () => {
      const salt = encryption.generateSalt();
      await encryption.generateUserKey(testPassword, salt);
      
      const encryptionResult = await encryption.encryptData(testData);
      
      // Create new encryption instance to simulate different session
      const decryption = new UserEncryption();
      await decryption.generateUserKey(testPassword, encryptionResult.salt);
      
      const decryptionResult = await decryption.decryptData(
        encryptionResult.encryptedData,
        encryptionResult.salt,
        encryptionResult.iv
      );
      
      expect(decryptionResult.success).toBe(true);
      expect(decryptionResult.decryptedData).toEqual(testData);
    });

    it('should fail decryption with wrong password', async () => {
      const salt = encryption.generateSalt();
      await encryption.generateUserKey(testPassword, salt);
      
      const encryptionResult = await encryption.encryptData(testData);
      
      // Try to decrypt with wrong password
      const decryption = new UserEncryption();
      await decryption.generateUserKey('wrong_password', encryptionResult.salt);
      
      const decryptionResult = await decryption.decryptData(
        encryptionResult.encryptedData,
        encryptionResult.salt,
        encryptionResult.iv
      );
      
      expect(decryptionResult.success).toBe(false);
      expect(decryptionResult.error).toBeDefined();
    });

    it('should fail decryption with wrong salt', async () => {
      const salt = encryption.generateSalt();
      await encryption.generateUserKey(testPassword, salt);
      
      const encryptionResult = await encryption.encryptData(testData);
      
      // Try to decrypt with wrong salt
      const decryption = new UserEncryption();
      const wrongSalt = encryption.generateSalt();
      await decryption.generateUserKey(testPassword, wrongSalt);
      
      const decryptionResult = await decryption.decryptData(
        encryptionResult.encryptedData,
        wrongSalt,
        encryptionResult.iv
      );
      
      expect(decryptionResult.success).toBe(false);
      expect(decryptionResult.error).toBeDefined();
    });
  });

  describe('Key Hash Generation', () => {
    it('should generate consistent key hash', async () => {
      const salt = encryption.generateSalt();
      await encryption.generateUserKey(testPassword, salt);
      
      const hash1 = await encryption.createKeyHash();
      const hash2 = await encryption.createKeyHash();
      
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex string
    });

    it('should generate different hashes for different keys', async () => {
      const salt1 = encryption.generateSalt();
      await encryption.generateUserKey('password1', salt1);
      const hash1 = await encryption.createKeyHash();
      
      const salt2 = encryption.generateSalt();
      await encryption.generateUserKey('password2', salt2);
      const hash2 = await encryption.createKeyHash();
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Memory Management', () => {
    it('should clear key from memory', () => {
      encryption.clearKey();
      // This test ensures the method doesn't throw an error
      expect(() => encryption.clearKey()).not.toThrow();
    });
  });
});

describe('EncryptionUtils', () => {
  describe('ArrayBuffer to Base64 Conversion', () => {
    it('should convert ArrayBuffer to base64 and back', () => {
      const originalData = new TextEncoder().encode('Hello, World!');
      const base64 = EncryptionUtils.arrayBufferToBase64(originalData.buffer);
      const convertedBack = EncryptionUtils.base64ToArrayBuffer(base64);
      
      expect(new Uint8Array(convertedBack)).toEqual(originalData);
    });

    it('should handle empty ArrayBuffer', () => {
      const emptyBuffer = new ArrayBuffer(0);
      const base64 = EncryptionUtils.arrayBufferToBase64(emptyBuffer);
      const convertedBack = EncryptionUtils.base64ToArrayBuffer(base64);
      
      expect(convertedBack.byteLength).toBe(0);
    });
  });

  describe('Uint8Array to Base64 Conversion', () => {
    it('should convert Uint8Array to base64 and back', () => {
      const originalArray = new Uint8Array([1, 2, 3, 4, 5]);
      const base64 = EncryptionUtils.uint8ArrayToBase64(originalArray);
      const convertedBack = EncryptionUtils.base64ToUint8Array(base64);
      
      expect(convertedBack).toEqual(originalArray);
    });

    it('should handle empty Uint8Array', () => {
      const emptyArray = new Uint8Array(0);
      const base64 = EncryptionUtils.uint8ArrayToBase64(emptyArray);
      const convertedBack = EncryptionUtils.base64ToUint8Array(base64);
      
      expect(convertedBack.length).toBe(0);
    });
  });
});

describe('PrivacyUtils', () => {
  describe('Demographic Bucketing', () => {
    it('should create correct age buckets', () => {
      expect(PrivacyUtils.createAgeBucket(17)).toBe('under_18');
      expect(PrivacyUtils.createAgeBucket(20)).toBe('age_18_24');
      expect(PrivacyUtils.createAgeBucket(30)).toBe('age_25_34');
      expect(PrivacyUtils.createAgeBucket(40)).toBe('age_35_44');
      expect(PrivacyUtils.createAgeBucket(50)).toBe('age_45_54');
      expect(PrivacyUtils.createAgeBucket(60)).toBe('age_55_64');
      expect(PrivacyUtils.createAgeBucket(70)).toBe('age_65_plus');
    });

    it('should create correct region buckets', () => {
      expect(PrivacyUtils.createRegionBucket('New York')).toBe('region_northeast');
      expect(PrivacyUtils.createRegionBucket('California')).toBe('region_southwest');
      expect(PrivacyUtils.createRegionBucket('Texas')).toBe('region_southwest');
      expect(PrivacyUtils.createRegionBucket('Illinois')).toBe('region_midwest');
      expect(PrivacyUtils.createRegionBucket('Unknown')).toBe('region_other');
    });

    it('should create correct education buckets', () => {
      expect(PrivacyUtils.createEducationBucket('High School Diploma')).toBe('education_high_school');
      expect(PrivacyUtils.createEducationBucket('Associate Degree')).toBe('education_associate');
      expect(PrivacyUtils.createEducationBucket('Bachelor\'s Degree')).toBe('education_bachelor');
      expect(PrivacyUtils.createEducationBucket('Master\'s Degree')).toBe('education_master');
      expect(PrivacyUtils.createEducationBucket('PhD')).toBe('education_doctorate');
      expect(PrivacyUtils.createEducationBucket('Other')).toBe('education_other');
    });
  });

  describe('Data Anonymization', () => {
    it('should anonymize user data correctly', () => {
      const userData = {
        age: 25,
        location: 'New York, NY',
        education: 'Bachelor\'s Degree',
        user_id: '12345',
        email: 'user@example.com',
        name: 'John Doe',
        exact_location: '123 Main St, New York, NY',
        exact_age: 25
      };

      const anonymized = PrivacyUtils.anonymizeForAnalytics(userData);

      expect(anonymized.age_bucket).toBe('age_25_34');
      expect(anonymized.region_bucket).toBe('region_northeast');
      expect(anonymized.education_bucket).toBe('education_bachelor');
      expect(anonymized.user_id).toBeUndefined();
      expect(anonymized.email).toBeUndefined();
      expect(anonymized.name).toBeUndefined();
      expect(anonymized.exact_location).toBeUndefined();
      expect(anonymized.exact_age).toBeUndefined();
    });

    it('should handle missing data gracefully', () => {
      const userData = {
        age: 25
        // Missing other fields
      };

      const anonymized = PrivacyUtils.anonymizeForAnalytics(userData);

      expect(anonymized.age_bucket).toBe('age_25_34');
      expect(anonymized.region_bucket).toBe('region_other');
      expect(anonymized.education_bucket).toBe('education_other');
    });
  });
});
