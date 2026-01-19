/**
 * Sophisticated Civic Engagement Utilities Tests
 * 
 * Tests for Civic Engagement V2 utility functions
 * 
 * Feature Flag: CIVIC_ENGAGEMENT_V2
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import {
  createSophisticatedCivicAction,
  getRepresentativesByLocation,
  trackRepresentativeContact,
  getTrendingCivicActions,
  calculateCivicEngagementMetrics,
  calculateCivicScore,
  calculateCommunityImpact,
  calculateTrustTier,
  getCivicEngagementRecommendations,
} from '@/lib/utils/sophisticated-civic-engagement';
import type { SophisticatedCivicAction, CivicEngagementMetrics } from '@/lib/utils/sophisticated-civic-engagement';

// Mock dependencies
jest.mock('@/lib/core/feature-flags', () => ({
  isFeatureEnabled: jest.fn(() => true),
}));

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(),
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockSupabase = jest.requireMock('@/utils/supabase/server') as {
  getSupabaseServerClient: jest.Mock;
};

const createMockSupabaseClient = () => {
  const mockClient = {
    from: jest.fn(() => mockClient),
    select: jest.fn(() => mockClient),
    insert: jest.fn(() => mockClient),
    eq: jest.fn(() => mockClient),
    contains: jest.fn(() => mockClient),
    order: jest.fn(() => mockClient),
    limit: jest.fn(() => mockClient),
    single: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  };
  return mockClient;
};

describe('Sophisticated Civic Engagement Utilities', () => {
  let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = createMockSupabaseClient();
    mockSupabase.getSupabaseServerClient.mockResolvedValue(mockSupabaseClient);
  });

  describe('createSophisticatedCivicAction', () => {
    it('creates a civic action successfully', async () => {
      const mockAction = {
        id: '123',
        title: 'Test Action',
        description: 'Test Description',
        action_type: 'petition',
        category: 'environment',
        urgency_level: 'high',
        target_representatives: [1, 2],
        current_signatures: 0,
        required_signatures: 1000,
        status: 'active',
        is_public: true,
        created_by: 'user-123',
        created_at: '2025-01-22T00:00:00Z',
        updated_at: '2025-01-22T00:00:00Z',
        metadata: {},
      };

      mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValue({
        data: mockAction,
        error: null,
      });

      const result = await createSophisticatedCivicAction(
        {
          title: 'Test Action',
          description: 'Test Description',
          actionType: 'petition',
          category: 'environment',
          urgencyLevel: 'high',
          targetRepresentatives: [1, 2],
          targetSignatures: 1000,
          isPublic: true,
        },
        'user-123'
      );

      expect(result).not.toBeNull();
      expect(result?.title).toBe('Test Action');
      expect(result?.action_type).toBe('petition');
      expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });

    it('returns null when database insert fails', async () => {
      mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      });

      const result = await createSophisticatedCivicAction(
        {
          title: 'Test Action',
          description: 'Test Description',
          actionType: 'petition',
          category: 'environment',
          urgencyLevel: 'high',
          targetRepresentatives: [1, 2],
          targetSignatures: 1000,
          isPublic: true,
        },
        'user-123'
      );

      expect(result).toBeNull();
    });

    it('handles end date when provided', async () => {
      const mockAction = {
        id: '123',
        title: 'Test Action',
        description: 'Test Description',
        action_type: 'petition',
        category: 'environment',
        urgency_level: 'high',
        target_representatives: [1, 2],
        current_signatures: 0,
        required_signatures: 1000,
        status: 'active',
        is_public: true,
        created_by: 'user-123',
        created_at: '2025-01-22T00:00:00Z',
        updated_at: '2025-01-22T00:00:00Z',
        end_date: '2025-12-31T23:59:59Z',
        metadata: {},
      };

      mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValue({
        data: mockAction,
        error: null,
      });

      const result = await createSophisticatedCivicAction(
        {
          title: 'Test Action',
          description: 'Test Description',
          actionType: 'petition',
          category: 'environment',
          urgencyLevel: 'high',
          targetRepresentatives: [1, 2],
          targetSignatures: 1000,
          endDate: '2025-12-31T23:59:59Z',
          isPublic: true,
        },
        'user-123'
      );

      expect(result?.end_date).toBe('2025-12-31T23:59:59Z');
    });
  });

  describe('getRepresentativesByLocation', () => {
    it('fetches representatives by state', async () => {
      const mockRepresentatives = [
        {
          id: 1,
          name: 'Senator Smith',
          office: 'U.S. Senator',
          party: 'Democratic',
          state: 'CA',
          district: 'At-Large',
        },
      ];

      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.limit = jest.fn().mockResolvedValue({
        data: mockRepresentatives,
        error: null,
      }) as any;

      const result = await getRepresentativesByLocation(
        { state: 'CA' },
        {}
      );

      expect(result.length).toBeGreaterThan(0);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('state', 'CA');
    });

    it('applies party filter when provided', async () => {
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.limit = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }) as any;

      await getRepresentativesByLocation(
        { state: 'CA' },
        { party: 'Democratic' }
      );

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('party', 'Democratic');
    });

    it('returns empty array on error', async () => {
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.limit = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Query failed' },
      });

      const result = await getRepresentativesByLocation(
        { state: 'CA' },
        {}
      );

      expect(result).toEqual([]);
    });
  });

  describe('trackRepresentativeContact', () => {
    it('tracks contact successfully', async () => {
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 1 },
        error: null,
      });
      mockSupabaseClient.insert.mockResolvedValue({
        error: null,
      });

      const result = await trackRepresentativeContact(
        1,
        {
          method: 'email',
          subject: 'Test Subject',
          message: 'Test Message',
          priority: 'high',
        },
        'user-123'
      );

      expect(result).toBe(true);
      expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });

    it('returns false when representative not found', async () => {
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      const result = await trackRepresentativeContact(
        999,
        {
          method: 'email',
          subject: 'Test',
          message: 'Test',
          priority: 'normal',
        },
        'user-123'
      );

      expect(result).toBe(false);
    });
  });

  describe('getTrendingCivicActions', () => {
    it('fetches trending actions', async () => {
      const mockActions = [
        {
          id: '1',
          title: 'Trending Action',
          action_type: 'petition',
          current_signatures: 100,
          required_signatures: 1000,
          created_at: new Date().toISOString(),
          status: 'active',
          is_public: true,
        },
      ];

      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.order.mockReturnValue(mockSupabaseClient);
      (mockSupabaseClient.limit as jest.Mock).mockResolvedValue({
        data: mockActions,
        error: null,
      });

      const result = await getTrendingCivicActions(10);

      expect(result.length).toBeGreaterThan(0);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'active');
    });

    it('applies category filter when provided', async () => {
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.order.mockReturnValue(mockSupabaseClient);
      (mockSupabaseClient.limit as jest.Mock).mockResolvedValue({
        data: [],
        error: null,
      });

      await getTrendingCivicActions(10, 'environment');

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('category', 'environment');
    });
  });

  describe('calculateCivicScore', () => {
    it('calculates score correctly', () => {
      const actions: SophisticatedCivicAction[] = [
        {
          id: '1',
          title: 'Action 1',
          description: 'Desc',
          action_type: 'petition',
          category: 'env',
          urgency_level: 'high',
          target_representatives: [],
          signature_count: 0,
          target_signatures: 0,
          status: 'active',
          is_public: true,
          created_by: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const score = calculateCivicScore(actions, 5, 50);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('caps score at 100', () => {
      const manyActions = Array.from({ length: 20 }, (_, i) => ({
        id: String(i),
        title: `Action ${i}`,
        description: 'Desc',
        action_type: 'petition' as const,
        category: 'env',
        urgency_level: 'high' as const,
        target_representatives: [],
        signature_count: 0,
        target_signatures: 0,
        status: 'active' as const,
        is_public: true,
        created_by: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const score = calculateCivicScore(manyActions, 100, 10000);

      expect(score).toBe(100);
    });
  });

  describe('calculateCommunityImpact', () => {
    it('calculates impact based on public actions and signatures', () => {
      const actions: SophisticatedCivicAction[] = [
        {
          id: '1',
          title: 'Public Action',
          description: 'Desc',
          action_type: 'petition',
          category: 'env',
          urgency_level: 'high',
          target_representatives: [],
          signature_count: 500,
          target_signatures: 1000,
          status: 'active',
          is_public: true,
          created_by: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const impact = calculateCommunityImpact(actions, 500);

      expect(impact).toBeGreaterThan(0);
      expect(impact).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateTrustTier', () => {
    it('returns T3 for high scores', () => {
      expect(calculateTrustTier(95)).toBe('T3');
    });

    it('returns T2 for medium-high scores', () => {
      expect(calculateTrustTier(80)).toBe('T2');
    });

    it('returns T1 for medium scores', () => {
      expect(calculateTrustTier(60)).toBe('T1');
    });

    it('returns T0 for low scores', () => {
      expect(calculateTrustTier(30)).toBe('T0');
    });
  });

  describe('calculateCivicEngagementMetrics', () => {
    it('calculates comprehensive metrics', () => {
      const actions: SophisticatedCivicAction[] = [
        {
          id: '1',
          title: 'Petition',
          description: 'Desc',
          action_type: 'petition',
          category: 'env',
          urgency_level: 'high',
          target_representatives: [],
          signature_count: 100,
          target_signatures: 1000,
          status: 'active',
          is_public: true,
          created_by: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const metrics = calculateCivicEngagementMetrics(actions, 5, 100);

      expect(metrics.total_actions).toBe(1);
      expect(metrics.active_petitions).toBe(1);
      expect(metrics.representative_interactions).toBe(5);
      expect(metrics.signature_count).toBe(100);
      expect(metrics.civic_score).toBeGreaterThan(0);
      expect(metrics.community_impact).toBeGreaterThan(0);
      expect(['T0', 'T1', 'T2', 'T3']).toContain(metrics.trust_tier);
    });
  });

  describe('getCivicEngagementRecommendations', () => {
    it('provides recommendations for low engagement', () => {
      const metrics: CivicEngagementMetrics = {
        total_actions: 0,
        active_petitions: 0,
        representative_interactions: 0,
        signature_count: 0,
        civic_score: 20,
        community_impact: 10,
        trust_tier: 'T0',
      };

      const recommendations = getCivicEngagementRecommendations(metrics, []);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.includes('first civic action'))).toBe(true);
    });

    it('provides recommendations for improving trust tier', () => {
      const metrics: CivicEngagementMetrics = {
        total_actions: 2,
        active_petitions: 1,
        representative_interactions: 1,
        signature_count: 5,
        civic_score: 40,
        community_impact: 30,
        trust_tier: 'T1',
      };

      const recommendations = getCivicEngagementRecommendations(metrics, []);

      expect(recommendations.length).toBeGreaterThan(0);
    });
  });
});

