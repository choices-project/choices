/**
 * Civic Database Analytics Tracking Tests
 * 
 * Tests the re-enabled analytics tracking functionality:
 * - updateCivicDatabaseEntry() persists data
 * - updatePollDemographicInsights() calls RPC
 * - Graceful handling of missing tables/functions
 * - Trust tier history tracking
 * - No cascading failures
 * 
 * Created: November 5, 2025
 * Status: ✅ Testing restored analytics
 */

import { AnalyticsService } from '@/features/analytics/lib/analytics-service';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(),
  rpc: jest.fn(),
};

// Mock getSupabaseServerClient
jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(() => Promise.resolve(mockSupabase as any)),
}));

// Mock logger
jest.mock('@/lib/utils/logger', () => ({
  devLog: jest.fn(),
}));

describe('AnalyticsService - Civic Database Tracking', () => {
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    analyticsService = AnalyticsService.getInstance();
  });

  describe('updatePollDemographicInsights', () => {
    it('calls update_poll_demographic_insights RPC function', async () => {
      // Mock successful RPC call
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      await analyticsService.updatePollDemographicInsights('poll-123');

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'update_poll_demographic_insights',
        { p_poll_id: 'poll-123' }
      );
    });

    it('handles missing function gracefully', async () => {
      // Mock function not found error
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'function "update_poll_demographic_insights" does not exist' }
      });

      // Should not throw
      await expect(
        analyticsService.updatePollDemographicInsights('poll-123')
      ).resolves.not.toThrow();
    });

    it('logs warning when function does not exist', async () => {
      const { devLog } = require('@/lib/utils/logger');
      
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'function does not exist' }
      });

      await analyticsService.updatePollDemographicInsights('poll-123');

      // Should have logged warning via devLog
      expect(devLog).toHaveBeenCalled();
    });

    it('does not throw on RPC error to prevent cascading failures', async () => {
      mockSupabase.rpc.mockRejectedValue(new Error('Database connection lost'));

      // Should handle error gracefully
      await expect(
        analyticsService.updatePollDemographicInsights('poll-123')
      ).resolves.not.toThrow();
    });
  });

  describe('updateCivicDatabaseEntry', () => {
    it('queries civic_database_entries table', async () => {
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      
      mockSupabase.from.mockReturnValue(mockFrom);
      mockSupabase.from.mockReturnValue({
        ...mockFrom,
        upsert: jest.fn().mockResolvedValue({ error: null }),
      });

      // Mock trust tier calculation
      jest.spyOn(analyticsService as any, 'calculateTrustTierScore').mockResolvedValue({
        trust_tier: 'tier_2',
        score: 0.75,
        factors: {
          biometric_verified: true,
          phone_verified: false,
          identity_verified: true
        }
      });

      // Mock user hash
      jest.spyOn(analyticsService as any, 'generateUserHash').mockResolvedValue('hash_abc123');

      await analyticsService.updateCivicDatabaseEntry('user-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('civic_database_entries');
    });

    it('handles missing table gracefully', async () => {
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'relation "civic_database_entries" does not exist', code: '42P01' }
        }),
      };
      
      mockSupabase.from.mockReturnValue(mockFrom);

      // Should not throw
      await expect(
        analyticsService.updateCivicDatabaseEntry('user-123')
      ).resolves.not.toThrow();
    });

    it('creates new entry for first-time user', async () => {
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        upsert: jest.fn().mockResolvedValue({ error: null }),
      };
      
      mockSupabase.from.mockReturnValue(mockFrom);

      // Mock dependencies
      jest.spyOn(analyticsService as any, 'calculateTrustTierScore').mockResolvedValue({
        trust_tier: 'tier_1',
        score: 0.5,
        factors: { biometric_verified: false, phone_verified: true, identity_verified: false }
      });
      jest.spyOn(analyticsService as any, 'generateUserHash').mockResolvedValue('hash_new');

      await analyticsService.updateCivicDatabaseEntry('new-user');

      expect(mockFrom.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          stable_user_id: 'new-user',
          user_hash: 'hash_new',
          current_trust_tier: 'tier_1'
        })
      );
    });

    it('tracks trust tier history when tier changes', async () => {
      const existingEntry = {
        id: 'entry-1',
        current_trust_tier: 'tier_1',
        trust_tier_history: [{
          trust_tier: 'tier_1',
          upgrade_date: '2025-01-01T00:00:00Z',
          reason: 'Initial',
          verification_methods: []
        }],
        trust_tier_upgrade_date: '2025-01-01T00:00:00Z'
      };

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: existingEntry, error: null }),
        upsert: jest.fn().mockResolvedValue({ error: null }),
      };
      
      mockSupabase.from.mockReturnValue(mockFrom);

      // Mock upgraded trust tier
      jest.spyOn(analyticsService as any, 'calculateTrustTierScore').mockResolvedValue({
        trust_tier: 'tier_2', // Upgraded!
        score: 0.75,
        factors: { biometric_verified: true, phone_verified: true, identity_verified: true }
      });
      jest.spyOn(analyticsService as any, 'generateUserHash').mockResolvedValue('hash_abc');

      await analyticsService.updateCivicDatabaseEntry('user-123');

      // Should have added new history entry
      expect(mockFrom.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          current_trust_tier: 'tier_2',
          trust_tier_history: expect.arrayContaining([
            expect.objectContaining({
              trust_tier: 'tier_2',
              reason: 'Analytics update'
            })
          ])
        })
      );
    });

    it('includes verification methods in tier history', async () => {
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        upsert: jest.fn().mockResolvedValue({ error: null }),
      };
      
      mockSupabase.from.mockReturnValue(mockFrom);

      jest.spyOn(analyticsService as any, 'calculateTrustTierScore').mockResolvedValue({
        trust_tier: 'tier_3',
        score: 0.9,
        factors: {
          biometric_verified: true,
          phone_verified: true,
          identity_verified: true
        }
      });
      jest.spyOn(analyticsService as any, 'generateUserHash').mockResolvedValue('hash_123');

      await analyticsService.updateCivicDatabaseEntry('user-123');

      expect(mockFrom.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          trust_tier_history: expect.arrayContaining([
            expect.objectContaining({
              verification_methods: expect.arrayContaining(['biometric', 'phone', 'identity'])
            })
          ])
        })
      );
    });

    it('does not throw on upsert error', async () => {
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        upsert: jest.fn().mockResolvedValue({ error: { message: 'Upsert failed' } }),
      };
      
      mockSupabase.from.mockReturnValue(mockFrom);

      jest.spyOn(analyticsService as any, 'calculateTrustTierScore').mockResolvedValue({
        trust_tier: 'tier_1',
        score: 0.5,
        factors: {}
      });
      jest.spyOn(analyticsService as any, 'generateUserHash').mockResolvedValue('hash');

      // Should log but not throw
      await expect(
        analyticsService.updateCivicDatabaseEntry('user-123')
      ).resolves.not.toThrow();
    });
  });
});

