/**
 * Privacy Workflow Integration Tests
 * 
 * Tests for complete privacy workflows and user journeys
 * 
 * @created September 9, 2025
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ConsentManager } from '../../utils/privacy/consent';
import { PrivacyDataManager } from '../../utils/privacy/data-management';
import { UserEncryption } from '../../utils/privacy/encryption';

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: jest.fn(() => ({
      data: {
        user: {
          id: 'test-user-id'
        }
      }
    }))
  },
  rpc: jest.fn(() => ({
    data: null,
    error: null
  })),
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => ({
          data: null,
          error: null
        }))
      }))
    })),
    insert: jest.fn(() => ({
      data: null,
      error: null
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        is: jest.fn(() => ({
          data: null,
          error: null
        }))
      }))
    }))
  }))
};

describe('Privacy Workflow Integration Tests', () => {
  let consentManager: ConsentManager;
  let dataManager: PrivacyDataManager;
  let encryption: UserEncryption;

  beforeEach(() => {
    jest.clearAllMocks();
    consentManager = new ConsentManager(mockSupabase);
    dataManager = new PrivacyDataManager();
    encryption = new UserEncryption();
  });

  describe('User Onboarding Workflow', () => {
    it('should complete full user onboarding with privacy controls', async () => {
      // Step 1: User grants consent for analytics
      mockSupabase.from.mockReturnValue({
        insert: jest.fn(() => ({
          data: null,
          error: null
        }))
      });

      const consentResult = await consentManager.grantConsent(
        'analytics',
        'To improve user experience',
        ['usage_stats']
      );

      expect(consentResult).toBe(true);

      // Step 2: User stores encrypted demographic data
      const demographicData = {
        age: 25,
        location: 'New York',
        education: 'Bachelor\'s Degree',
        politicalViews: 'Moderate'
      };

      const storeResult = await dataManager.storeEncryptedData(
        'demographics',
        demographicData,
        'user_password_123'
      );

      expect(storeResult).toBe(true);

      // Step 3: User contributes to analytics
      mockSupabase.rpc.mockReturnValue({
        data: true,
        error: null
      });

      const analyticsResult = await dataManager.contributeToAnalytics(
        'poll-123',
        demographicData,
        1,
        30
      );

      expect(analyticsResult).toBe(true);

      // Step 4: Verify user can access their privacy dashboard
      const dashboardResult = await dataManager.getPrivacyDashboard();

      expect(dashboardResult.consentSummary).toBeDefined();
      expect(dashboardResult.dataExportAvailable).toBe(true);
      expect(dashboardResult.anonymizationAvailable).toBe(true);
    });

    it('should handle user who declines analytics consent', async () => {
      // User does not grant analytics consent
      const consentResult = await consentManager.grantConsent(
        'analytics',
        'To improve user experience',
        ['usage_stats']
      );

      // User should still be able to store encrypted data
      const demographicData = {
        age: 25,
        location: 'New York',
        education: 'Bachelor\'s Degree'
      };

      const storeResult = await dataManager.storeEncryptedData(
        'demographics',
        demographicData,
        'user_password_123'
      );

      expect(storeResult).toBe(true);

      // But analytics contribution should fail
      mockSupabase.rpc.mockReturnValue({
        data: null,
        error: { message: 'Unauthorized: User has not granted consent for analytics' }
      });

      const analyticsResult = await dataManager.contributeToAnalytics(
        'poll-123',
        demographicData,
        1,
        30
      );

      expect(analyticsResult).toBe(false);
    });
  });

  describe('Data Management Workflow', () => {
    it('should allow users to export their data', async () => {
      const mockExportData = {
        profile: { id: '1', username: 'testuser' },
        polls: [{ id: '1', title: 'Test Poll' }],
        votes: [{ id: '1', choice: 1 }],
        consent: [{ id: '1', consent_type: 'analytics' }],
        analytics_contributions: [{ id: '1', poll_id: '1' }],
        exported_at: '2025-09-09T00:00:00Z'
      };

      mockSupabase.rpc.mockReturnValue({
        data: mockExportData,
        error: null
      });

      const exportResult = await dataManager.exportUserData();

      expect(exportResult).toEqual(mockExportData);
    });

    it('should allow users to anonymize their data', async () => {
      mockSupabase.rpc.mockReturnValue({
        data: null,
        error: null
      });

      const anonymizeResult = await dataManager.anonymizeUserData();

      expect(anonymizeResult.success).toBe(true);
      expect(anonymizeResult.message).toBe('User data successfully anonymized');
    });

    it('should allow users to retrieve their encrypted data', async () => {
      const mockEncryptedData = {
        encrypted_demographics: 'encrypted-data',
        key_derivation_salt: 'salt-data'
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: mockEncryptedData,
              error: null
            }))
          }))
        }))
      });

      const retrieveResult = await dataManager.retrieveEncryptedData(
        'demographics',
        'user_password_123'
      );

      expect(retrieveResult).toBeDefined();
    });
  });

  describe('Consent Management Workflow', () => {
    it('should allow users to grant and revoke consent', async () => {
      // Grant consent
      mockSupabase.from.mockReturnValue({
        insert: jest.fn(() => ({
          data: null,
          error: null
        }))
      });

      const grantResult = await consentManager.grantConsent(
        'analytics',
        'To improve user experience',
        ['usage_stats']
      );

      expect(grantResult).toBe(true);

      // Revoke consent
      mockSupabase.from.mockReturnValue({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            is: jest.fn(() => ({
              data: null,
              error: null
            }))
          }))
        }))
      });

      const revokeResult = await consentManager.revokeConsent('analytics');

      expect(revokeResult).toBe(true);
    });

    it('should allow users to update multiple consent preferences', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn(() => ({
          data: null,
          error: null
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            is: jest.fn(() => ({
              data: null,
              error: null
            }))
          }))
        }))
      });

      const preferences = {
        analytics: true,
        demographics: true,
        behavioral: false,
        contact: false,
        research: true,
        marketing: false
      };

      const updateResult = await consentManager.updateConsentPreferences(preferences);

      expect(updateResult).toBe(true);
    });

    it('should provide consent summary for users', async () => {
      const mockConsentData = [
        {
          id: '1',
          user_id: 'test-user-id',
          consent_type: 'analytics',
          granted: true,
          granted_at: '2025-09-09T00:00:00Z',
          revoked_at: null,
          consent_version: 1,
          purpose: 'Analytics',
          data_types: ['usage_stats']
        },
        {
          id: '2',
          user_id: 'test-user-id',
          consent_type: 'demographics',
          granted: true,
          granted_at: '2025-09-09T00:00:00Z',
          revoked_at: null,
          consent_version: 1,
          purpose: 'Demographics',
          data_types: ['age', 'location']
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            data: mockConsentData,
            error: null
          }))
        }))
      });

      const summary = await consentManager.getConsentSummary();

      expect(summary.totalConsents).toBe(6);
      expect(summary.activeConsents).toBe(2);
      expect(summary.consentTypes.analytics).toBe(true);
      expect(summary.consentTypes.demographics).toBe(true);
    });
  });

  describe('Encryption Workflow', () => {
    it('should encrypt and decrypt user data correctly', async () => {
      const testData = {
        age: 25,
        location: 'New York',
        education: 'Bachelor\'s Degree',
        politicalViews: 'Moderate'
      };

      const password = 'user_password_123';
      const salt = encryption.generateSalt();

      // Generate encryption key
      await encryption.generateUserKey(password, salt);

      // Encrypt data
      const encryptionResult = await encryption.encryptData(testData);

      expect(encryptionResult.encryptedData).toBeDefined();
      expect(encryptionResult.salt).toBeDefined();
      expect(encryptionResult.iv).toBeDefined();

      // Decrypt data
      const decryptionResult = await encryption.decryptData(
        encryptionResult.encryptedData,
        encryptionResult.salt,
        encryptionResult.iv
      );

      expect(decryptionResult.success).toBe(true);
      expect(decryptionResult.decryptedData).toEqual(testData);
    });

    it('should fail decryption with wrong password', async () => {
      const testData = { age: 25, location: 'New York' };
      const correctPassword = 'correct_password_123';
      const wrongPassword = 'wrong_password_123';
      const salt = encryption.generateSalt();

      // Encrypt with correct password
      await encryption.generateUserKey(correctPassword, salt);
      const encryptionResult = await encryption.encryptData(testData);

      // Try to decrypt with wrong password
      const decryption = new UserEncryption();
      await decryption.generateUserKey(wrongPassword, encryptionResult.salt);

      const decryptionResult = await decryption.decryptData(
        encryptionResult.encryptedData,
        encryptionResult.salt,
        encryptionResult.iv
      );

      expect(decryptionResult.success).toBe(false);
      expect(decryptionResult.error).toBeDefined();
    });
  });

  describe('Analytics Contribution Workflow', () => {
    it('should contribute to analytics with proper consent', async () => {
      // User has granted analytics consent
      const mockConsentData = [
        {
          id: '1',
          user_id: 'test-user-id',
          consent_type: 'analytics',
          granted: true,
          granted_at: '2025-09-09T00:00:00Z',
          revoked_at: null,
          consent_version: 1,
          purpose: 'Analytics',
          data_types: ['usage_stats']
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            data: mockConsentData,
            error: null
          }))
        }))
      });

      // User contributes to analytics
      mockSupabase.rpc.mockReturnValue({
        data: true,
        error: null
      });

      const demographicData = {
        age: 25,
        location: 'New York',
        education: 'Bachelor\'s Degree'
      };

      const result = await dataManager.contributeToAnalytics(
        'poll-123',
        demographicData,
        1,
        30
      );

      expect(result).toBe(true);
    });

    it('should fail analytics contribution without consent', async () => {
      // User has not granted analytics consent
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            data: [],
            error: null
          }))
        }))
      });

      // Analytics contribution should fail
      mockSupabase.rpc.mockReturnValue({
        data: null,
        error: { message: 'Unauthorized: User has not granted consent for analytics' }
      });

      const demographicData = {
        age: 25,
        location: 'New York',
        education: 'Bachelor\'s Degree'
      };

      const result = await dataManager.contributeToAnalytics(
        'poll-123',
        demographicData,
        1,
        30
      );

      expect(result).toBe(false);
    });
  });

  describe('Privacy Dashboard Workflow', () => {
    it('should provide comprehensive privacy dashboard', async () => {
      const mockProfileData = {
        encrypted_demographics: 'data',
        encrypted_preferences: 'data',
        encrypted_contact_info: 'data'
      };

      const mockPrivateData = {
        encrypted_personal_info: 'data',
        encrypted_behavioral_data: 'data',
        encrypted_analytics_data: 'data'
      };

      const mockConsentData = [
        {
          id: '1',
          user_id: 'test-user-id',
          consent_type: 'analytics',
          granted: true,
          granted_at: '2025-09-09T00:00:00Z',
          revoked_at: null,
          consent_version: 1,
          purpose: 'Analytics',
          data_types: ['usage_stats']
        }
      ];

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: mockProfileData,
                error: null
              }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: mockPrivateData,
                error: null
              }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            order: jest.fn(() => ({
              data: mockConsentData,
              error: null
            }))
          }))
        });

      const dashboard = await dataManager.getPrivacyDashboard();

      expect(dashboard.consentSummary).toBeDefined();
      expect(dashboard.dataExportAvailable).toBe(true);
      expect(dashboard.anonymizationAvailable).toBe(true);
      expect(dashboard.encryptionStatus.demographics).toBe(true);
      expect(dashboard.encryptionStatus.personal_info).toBe(true);
      expect(dashboard.encryptionStatus.behavioral_data).toBe(true);
    });
  });
});
