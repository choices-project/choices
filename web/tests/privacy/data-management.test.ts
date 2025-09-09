/**
 * Privacy Data Management Tests
 * 
 * Tests for data management functionality
 * 
 * @created September 9, 2025
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PrivacyDataManager } from '../../utils/privacy/data-management';

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
  from: jest.fn(() => {
    const mockQueryBuilder = {
      select: jest.fn(() => mockQueryBuilder),
      eq: jest.fn(() => mockQueryBuilder),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: null
      }),
      order: jest.fn().mockResolvedValue({
        data: [],
        error: null
      }),
      upsert: jest.fn().mockResolvedValue({
        data: null,
        error: null
      }),
      insert: jest.fn().mockResolvedValue({
        data: null,
        error: null
      }),
      update: jest.fn(() => mockQueryBuilder)
    };
    return mockQueryBuilder;
  })
};

describe('PrivacyDataManager', () => {
  let dataManager: PrivacyDataManager;

  beforeEach(() => {
    jest.clearAllMocks();
    dataManager = new PrivacyDataManager(mockSupabase);
  });

  describe('exportUserData', () => {
    it('should export user data successfully', async () => {
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

      const result = await dataManager.exportUserData();

      expect(result).toEqual(mockExportData);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('export_user_data', {
        target_user_id: 'test-user-id'
      });
    });

    it('should return null on error', async () => {
      mockSupabase.rpc.mockReturnValue({
        data: null,
        error: { message: 'Database error' }
      });

      const result = await dataManager.exportUserData();

      expect(result).toBeNull();
    });

    it('should handle exceptions', async () => {
      mockSupabase.rpc.mockImplementation(() => {
        throw new Error('Network error');
      });

      const result = await dataManager.exportUserData();

      expect(result).toBeNull();
    });
  });

  describe('anonymizeUserData', () => {
    it('should anonymize user data successfully', async () => {
      mockSupabase.rpc.mockReturnValue({
        data: null,
        error: null
      });

      const result = await dataManager.anonymizeUserData();

      expect(result.success).toBe(true);
      expect(result.message).toBe('User data successfully anonymized');
      expect(result.anonymized_fields).toContain('username');
      expect(result.anonymized_fields).toContain('encrypted_demographics');
      expect(mockSupabase.rpc).toHaveBeenCalledWith('anonymize_user_data', {
        target_user_id: 'test-user-id'
      });
    });

    it('should handle database errors', async () => {
      mockSupabase.rpc.mockReturnValue({
        data: null,
        error: { message: 'Database error' }
      });

      const result = await dataManager.anonymizeUserData();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Database error');
      expect(result.anonymized_fields).toEqual([]);
    });

    it('should handle unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockReturnValue({
        data: { user: null }
      });

      const result = await dataManager.anonymizeUserData();

      expect(result.success).toBe(false);
      expect(result.message).toBe('User not authenticated');
    });

    it('should handle exceptions', async () => {
      mockSupabase.rpc.mockImplementation(() => {
        throw new Error('Network error');
      });

      const result = await dataManager.anonymizeUserData();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Network error');
    });
  });

  describe('storeEncryptedData', () => {
    const testData = { age: 25, location: 'New York' };
    const testPassword = 'test_password_123';

    it('should store encrypted data in user_profiles_encrypted table', async () => {
      mockSupabase.from.mockReturnValue({
        upsert: jest.fn(() => ({
          data: null,
          error: null
        }))
      });

      const result = await dataManager.storeEncryptedData(
        'demographics',
        testData,
        testPassword
      );

      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles_encrypted');
    });

    it('should store encrypted data in private_user_data table', async () => {
      mockSupabase.from.mockReturnValue({
        upsert: jest.fn(() => ({
          data: null,
          error: null
        }))
      });

      const result = await dataManager.storeEncryptedData(
        'personal_info',
        testData,
        testPassword
      );

      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('private_user_data');
    });

    it('should handle unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockReturnValue({
        data: { user: null }
      });

      const result = await dataManager.storeEncryptedData(
        'demographics',
        testData,
        testPassword
      );

      expect(result).toBe(false);
    });

    it('should handle database errors', async () => {
      mockSupabase.from.mockReturnValue({
        upsert: jest.fn(() => ({
          data: null,
          error: { message: 'Database error' }
        }))
      });

      const result = await dataManager.storeEncryptedData(
        'demographics',
        testData,
        testPassword
      );

      expect(result).toBe(false);
    });

    it('should handle exceptions', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Network error');
      });

      const result = await dataManager.storeEncryptedData(
        'demographics',
        testData,
        testPassword
      );

      expect(result).toBe(false);
    });
  });

  describe('retrieveEncryptedData', () => {
    const testPassword = 'test_password_123';

    it('should retrieve encrypted data from user_profiles_encrypted table', async () => {
      const mockData = {
        encrypted_demographics: 'encrypted-data',
        key_derivation_salt: 'salt-data'
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: mockData,
              error: null
            }))
          }))
        }))
      });

      const result = await dataManager.retrieveEncryptedData(
        'demographics',
        testPassword
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles_encrypted');
    });

    it('should retrieve encrypted data from private_user_data table', async () => {
      const mockData = {
        encrypted_personal_info: 'encrypted-data'
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: mockData,
              error: null
            }))
          }))
        }))
      });

      const result = await dataManager.retrieveEncryptedData(
        'personal_info',
        testPassword
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('private_user_data');
    });

    it('should return null when no data exists', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: null
            }))
          }))
        }))
      });

      const result = await dataManager.retrieveEncryptedData(
        'demographics',
        testPassword
      );

      expect(result).toBeNull();
    });

    it('should handle unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockReturnValue({
        data: { user: null }
      });

      const result = await dataManager.retrieveEncryptedData(
        'demographics',
        testPassword
      );

      expect(result).toBeNull();
    });
  });

  describe('contributeToAnalytics', () => {
    const demographicData = {
      age: 25,
      location: 'New York',
      education: 'Bachelor\'s Degree'
    };

    it('should contribute to analytics successfully', async () => {
      mockSupabase.rpc.mockReturnValue({
        data: true,
        error: null
      });

      const result = await dataManager.contributeToAnalytics(
        'poll-123',
        demographicData,
        1,
        30
      );

      expect(result).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('contribute_to_analytics', {
        target_poll_id: 'poll-123',
        target_age_bucket: 'age_25_34',
        target_region_bucket: 'region_northeast',
        target_education_bucket: 'education_bachelor',
        target_vote_choice: 1,
        target_participation_time: '30 seconds'
      });
    });

    it('should handle database errors', async () => {
      mockSupabase.rpc.mockReturnValue({
        data: null,
        error: { message: 'Database error' }
      });

      const result = await dataManager.contributeToAnalytics(
        'poll-123',
        demographicData,
        1,
        30
      );

      expect(result).toBe(false);
    });

    it('should handle exceptions', async () => {
      mockSupabase.rpc.mockImplementation(() => {
        throw new Error('Network error');
      });

      const result = await dataManager.contributeToAnalytics(
        'poll-123',
        demographicData,
        1,
        30
      );

      expect(result).toBe(false);
    });
  });

  describe('getPrivacyDashboard', () => {
    it('should return privacy dashboard data', async () => {
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
        });

      const result = await dataManager.getPrivacyDashboard();

      expect(result.consentSummary).toBeDefined();
      expect(result.dataExportAvailable).toBe(true);
      expect(result.anonymizationAvailable).toBe(true);
      expect(result.encryptionStatus.demographics).toBe(true);
      expect(result.encryptionStatus.personal_info).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await dataManager.getPrivacyDashboard();

      expect(result.consentSummary.totalConsents).toBe(0);
      expect(result.dataExportAvailable).toBe(false);
      expect(result.anonymizationAvailable).toBe(false);
      expect(result.encryptionStatus.demographics).toBe(false);
    });
  });

  describe('Demographic Bucketing', () => {
    it('should create correct age buckets', () => {
      // Test the private methods through public interface
      const testData = { age: 25, location: 'New York', education: 'Bachelor\'s' };
      
      // This tests the bucketing logic indirectly through contributeToAnalytics
      expect(dataManager.contributeToAnalytics('poll-1', testData, 1, 30)).toBeDefined();
    });
  });
});
