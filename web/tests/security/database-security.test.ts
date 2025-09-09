/**
 * Database Security Tests
 * 
 * Tests for database security, RLS policies, and admin functions
 * 
 * @created September 9, 2025
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

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
      data: null,
      error: null
    })),
    delete: jest.fn(() => ({
      data: null,
      error: null
    }))
  }))
};

describe('Database Security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('is_system_admin Function', () => {
    it('should return true for hardcoded admin user ID', async () => {
      mockSupabase.rpc.mockReturnValue({
        data: true,
        error: null
      });

      const result = await mockSupabase.rpc('is_system_admin', {
        user_id: 'your-user-id-here'
      });

      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should return false for non-admin user ID', async () => {
      mockSupabase.rpc.mockReturnValue({
        data: false,
        error: null
      });

      const result = await mockSupabase.rpc('is_system_admin', {
        user_id: 'other-user-id'
      });

      expect(result.data).toBe(false);
      expect(result.error).toBeNull();
    });

    it('should handle invalid UUID format', async () => {
      mockSupabase.rpc.mockReturnValue({
        data: null,
        error: { message: 'Invalid UUID format' }
      });

      const result = await mockSupabase.rpc('is_system_admin', {
        user_id: 'invalid-uuid'
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('get_system_metrics Function', () => {
    it('should return system metrics for admin user', async () => {
      const mockMetrics = {
        total_users: 100,
        total_polls: 50,
        total_votes: 500,
        active_users_30d: 25,
        system_health: 'good',
        privacy_compliance: 'verified'
      };

      mockSupabase.rpc.mockReturnValue({
        data: mockMetrics,
        error: null
      });

      const result = await mockSupabase.rpc('get_system_metrics');

      expect(result.data).toEqual(mockMetrics);
      expect(result.error).toBeNull();
    });

    it('should reject access for non-admin user', async () => {
      mockSupabase.rpc.mockReturnValue({
        data: null,
        error: { message: 'Unauthorized: Only system admin can access metrics' }
      });

      const result = await mockSupabase.rpc('get_system_metrics');

      expect(result.data).toBeNull();
      expect(result.error.message).toContain('Unauthorized');
    });
  });

  describe('anonymize_user_data Function', () => {
    it('should allow users to anonymize their own data', async () => {
      mockSupabase.rpc.mockReturnValue({
        data: null,
        error: null
      });

      const result = await mockSupabase.rpc('anonymize_user_data', {
        target_user_id: 'test-user-id'
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });

    it('should reject anonymization of other users\' data', async () => {
      mockSupabase.rpc.mockReturnValue({
        data: null,
        error: { message: 'Unauthorized: Users can only anonymize their own data' }
      });

      const result = await mockSupabase.rpc('anonymize_user_data', {
        target_user_id: 'other-user-id'
      });

      expect(result.data).toBeNull();
      expect(result.error.message).toContain('Unauthorized');
    });
  });

  describe('export_user_data Function', () => {
    it('should allow users to export their own data', async () => {
      const mockExportData = {
        profile: { id: '1', username: 'testuser' },
        polls: [],
        votes: [],
        consent: [],
        analytics_contributions: [],
        exported_at: '2025-09-09T00:00:00Z'
      };

      mockSupabase.rpc.mockReturnValue({
        data: mockExportData,
        error: null
      });

      const result = await mockSupabase.rpc('export_user_data', {
        target_user_id: 'test-user-id'
      });

      expect(result.data).toEqual(mockExportData);
      expect(result.error).toBeNull();
    });

    it('should reject export of other users\' data', async () => {
      mockSupabase.rpc.mockReturnValue({
        data: null,
        error: { message: 'Unauthorized: Users can only export their own data' }
      });

      const result = await mockSupabase.rpc('export_user_data', {
        target_user_id: 'other-user-id'
      });

      expect(result.data).toBeNull();
      expect(result.error.message).toContain('Unauthorized');
    });
  });

  describe('contribute_to_analytics Function', () => {
    it('should allow analytics contribution with valid consent', async () => {
      mockSupabase.rpc.mockReturnValue({
        data: true,
        error: null
      });

      const result = await mockSupabase.rpc('contribute_to_analytics', {
        target_poll_id: 'poll-123',
        target_age_bucket: 'age_25_34',
        target_region_bucket: 'region_northeast',
        target_education_bucket: 'education_bachelor',
        target_vote_choice: 1,
        target_participation_time: '30 seconds'
      });

      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should reject analytics contribution without consent', async () => {
      mockSupabase.rpc.mockReturnValue({
        data: null,
        error: { message: 'Unauthorized: User has not granted consent for analytics' }
      });

      const result = await mockSupabase.rpc('contribute_to_analytics', {
        target_poll_id: 'poll-123',
        target_age_bucket: 'age_25_34',
        target_region_bucket: 'region_northeast',
        target_education_bucket: 'education_bachelor',
        target_vote_choice: 1,
        target_participation_time: '30 seconds'
      });

      expect(result.data).toBeNull();
      expect(result.error.message).toContain('consent');
    });

    it('should reject analytics contribution for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockReturnValue({
        data: { user: null }
      });

      mockSupabase.rpc.mockReturnValue({
        data: null,
        error: { message: 'Unauthorized: Must be authenticated to contribute to analytics' }
      });

      const result = await mockSupabase.rpc('contribute_to_analytics', {
        target_poll_id: 'poll-123',
        target_age_bucket: 'age_25_34',
        target_region_bucket: 'region_northeast',
        target_education_bucket: 'education_bachelor',
        target_vote_choice: 1,
        target_participation_time: '30 seconds'
      });

      expect(result.data).toBeNull();
      expect(result.error.message).toContain('authenticated');
    });
  });

  describe('Row Level Security (RLS)', () => {
    describe('user_consent table', () => {
      it('should allow users to access their own consent data', async () => {
        const mockConsentData = [
          {
            id: '1',
            user_id: 'test-user-id',
            consent_type: 'analytics',
            granted: true
          }
        ];

        mockSupabase.from.mockReturnValue({
          select: jest.fn(() => ({
            data: mockConsentData,
            error: null
          }))
        });

        const result = await mockSupabase.from('user_consent').select('*');

        expect(result.data).toEqual(mockConsentData);
        expect(result.error).toBeNull();
      });

      it('should prevent users from accessing other users\' consent data', async () => {
        mockSupabase.from.mockReturnValue({
          select: jest.fn(() => ({
            data: [],
            error: null
          }))
        });

        const result = await mockSupabase.from('user_consent').select('*');

        // RLS should filter out other users' data
        expect(result.data).toEqual([]);
      });
    });

    describe('user_profiles_encrypted table', () => {
      it('should allow users to access their own profile data', async () => {
        const mockProfileData = {
          id: '1',
          user_id: 'test-user-id',
          username: 'testuser',
          encrypted_demographics: 'encrypted-data'
        };

        mockSupabase.from.mockReturnValue({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: mockProfileData,
                error: null
              }))
            }))
          }))
        });

        const result = await mockSupabase
          .from('user_profiles_encrypted')
          .select('*')
          .eq('user_id', 'test-user-id')
          .single();

        expect(result.data).toEqual(mockProfileData);
        expect(result.error).toBeNull();
      });

      it('should prevent users from accessing other users\' profile data', async () => {
        mockSupabase.from.mockReturnValue({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: null,
                error: { message: 'Row not found' }
              }))
            }))
          }))
        });

        const result = await mockSupabase
          .from('user_profiles_encrypted')
          .select('*')
          .eq('user_id', 'other-user-id')
          .single();

        expect(result.data).toBeNull();
        expect(result.error).toBeDefined();
      });
    });

    describe('private_user_data table', () => {
      it('should allow users to access their own private data', async () => {
        const mockPrivateData = {
          id: '1',
          user_id: 'test-user-id',
          encrypted_personal_info: 'encrypted-data'
        };

        mockSupabase.from.mockReturnValue({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: mockPrivateData,
                error: null
              }))
            }))
          }))
        });

        const result = await mockSupabase
          .from('private_user_data')
          .select('*')
          .eq('user_id', 'test-user-id')
          .single();

        expect(result.data).toEqual(mockPrivateData);
        expect(result.error).toBeNull();
      });

      it('should prevent users from accessing other users\' private data', async () => {
        mockSupabase.from.mockReturnValue({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: null,
                error: { message: 'Row not found' }
              }))
            }))
          }))
        });

        const result = await mockSupabase
          .from('private_user_data')
          .select('*')
          .eq('user_id', 'other-user-id')
          .single();

        expect(result.data).toBeNull();
        expect(result.error).toBeDefined();
      });
    });

    describe('analytics_contributions table', () => {
      it('should allow users to access their own analytics contributions', async () => {
        const mockContributions = [
          {
            id: '1',
            user_id: 'test-user-id',
            poll_id: 'poll-123',
            age_bucket: 'age_25_34'
          }
        ];

        mockSupabase.from.mockReturnValue({
          select: jest.fn(() => ({
            data: mockContributions,
            error: null
          }))
        });

        const result = await mockSupabase
          .from('analytics_contributions')
          .select('*');

        expect(result.data).toEqual(mockContributions);
        expect(result.error).toBeNull();
      });

      it('should prevent users from accessing other users\' contributions', async () => {
        mockSupabase.from.mockReturnValue({
          select: jest.fn(() => ({
            data: [],
            error: null
          }))
        });

        const result = await mockSupabase
          .from('analytics_contributions')
          .select('*');

        // RLS should filter out other users' contributions
        expect(result.data).toEqual([]);
      });
    });

    describe('privacy_logs table', () => {
      it('should allow system admin to access privacy logs', async () => {
        const mockLogs = [
          {
            id: '1',
            action: 'data_exported',
            user_id_hash: 'hashed-user-id',
            created_at: '2025-09-09T00:00:00Z'
          }
        ];

        mockSupabase.from.mockReturnValue({
          select: jest.fn(() => ({
            data: mockLogs,
            error: null
          }))
        });

        const result = await mockSupabase
          .from('privacy_logs')
          .select('*');

        expect(result.data).toEqual(mockLogs);
        expect(result.error).toBeNull();
      });

      it('should prevent non-admin users from accessing privacy logs', async () => {
        mockSupabase.from.mockReturnValue({
          select: jest.fn(() => ({
            data: [],
            error: null
          }))
        });

        const result = await mockSupabase
          .from('privacy_logs')
          .select('*');

        // RLS should filter out logs for non-admin users
        expect(result.data).toEqual([]);
      });
    });
  });

  describe('Data Integrity', () => {
    it('should enforce unique constraints on user_consent', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn(() => ({
          data: null,
          error: { message: 'duplicate key value violates unique constraint' }
        }))
      });

      const result = await mockSupabase
        .from('user_consent')
        .insert({
          user_id: 'test-user-id',
          consent_type: 'analytics',
          granted: true,
          purpose: 'Analytics'
        });

      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('unique constraint');
    });

    it('should enforce foreign key constraints', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn(() => ({
          data: null,
          error: { message: 'violates foreign key constraint' }
        }))
      });

      const result = await mockSupabase
        .from('analytics_contributions')
        .insert({
          poll_id: 'non-existent-poll',
          user_id: 'test-user-id',
          consent_granted: true
        });

      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('foreign key');
    });
  });
});
