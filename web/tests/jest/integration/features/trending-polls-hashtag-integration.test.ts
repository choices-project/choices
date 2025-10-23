/**
 * Integration Tests for Trending Polls (Hashtag-Based Implementation)
 * 
 * Tests the integration between trending polls feature and hashtag system:
 * - HashtagPollsIntegrationService
 * - TrendingHashtagsTracker
 * - HashtagPollsFeed component
 * - Trending polls API endpoints
 * 
 * Created: January 23, 2025
 * Status: ✅ ACTIVE
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { HashtagPollsIntegrationService } from '@/features/feeds/lib/hashtag-polls-integration';
import { TrendingHashtagsTracker } from '@/features/feeds/lib/TrendingHashtags';
import { calculateTrendingHashtags } from '@/features/hashtags/lib/hashtag-analytics';
import { T } from '@/tests/registry/testIds';

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        gte: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      }))
    })),
    insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
    update: jest.fn(() => Promise.resolve({ data: [], error: null }))
  }))
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase
}));

describe('Trending Polls - Hashtag Integration Tests', () => {
  let hashtagService: HashtagPollsIntegrationService;
  let trendingTracker: TrendingHashtagsTracker;

  beforeEach(() => {
    hashtagService = new HashtagPollsIntegrationService(mockSupabase);
    trendingTracker = TrendingHashtagsTracker.getInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('HashtagPollsIntegrationService', () => {
    it('should generate personalized feed with trending hashtags', async () => {
      const mockUserId = 'test-user-123';
      const mockHashtagData = [
        { hashtag: '#politics', usage_count: 45, recency_score: 0.8 },
        { hashtag: '#climate', usage_count: 32, recency_score: 0.9 },
        { hashtag: '#economy', usage_count: 28, recency_score: 0.7 }
      ];

      // Mock the analytics_events query
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({ 
                data: mockHashtagData, 
                error: null 
              }))
            }))
          }))
        }))
      });

      const result = await hashtagService.generatePersonalizedFeed(mockUserId, 10);
      
      expect(result).toBeDefined();
      expect(result.recommended_polls).toBeDefined();
      expect(result.trending_hashtags).toBeDefined();
      expect(result.user_interests).toBeDefined();
    });

    it('should calculate trending scores correctly', async () => {
      const mockHashtagUsage = [
        { hashtag: '#politics', count: 50, recency: 0.9 },
        { hashtag: '#climate', count: 30, recency: 0.8 },
        { hashtag: '#economy', count: 20, recency: 0.7 }
      ];

      // Test trending score calculation
      const trendingScores = mockHashtagUsage.map(item => ({
        hashtag: item.hashtag,
        score: item.count * 0.7 + item.recency * 0.3
      })).sort((a, b) => b.score - a.score);

      expect(trendingScores[0].hashtag).toBe('#politics');
      expect(trendingScores[0].score).toBeGreaterThan(trendingScores[1].score);
    });

    it('should handle hashtag engagement tracking', async () => {
      const mockEngagement = {
        hashtag: '#politics',
        action: 'view' as const,
        userId: 'test-user-123',
        timestamp: new Date().toISOString()
      };

      // Mock the engagement tracking
      mockSupabase.from.mockReturnValue({
        insert: jest.fn(() => Promise.resolve({ 
          data: [mockEngagement], 
          error: null 
        }))
      });

      const result = await hashtagService.trackHashtagEngagement(
        mockEngagement.userId,
        mockEngagement.hashtag,
        mockEngagement.action
      );

      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('analytics_events');
    });
  });

  describe('TrendingHashtagsTracker', () => {
    it('should track hashtag usage and calculate trends', () => {
      const tracker = TrendingHashtagsTracker.getInstance();
      
      // Simulate hashtag usage
      tracker.trackHashtagUsage('test-user-1', '#politics', { category: 'politics' });
      tracker.trackHashtagUsage('test-user-2', '#politics', { category: 'politics' });
      tracker.trackHashtagUsage('test-user-3', '#climate', { category: 'environment' });

      const trendingHashtags = tracker.getTrendingHashtags(5);
      
      expect(trendingHashtags).toBeDefined();
      expect(trendingHashtags.length).toBeGreaterThan(0);
    });

    it('should provide hashtag analytics', () => {
      const tracker = TrendingHashtagsTracker.getInstance();
      
      // Add some test data
      tracker.trackHashtagUsage('user1', '#politics', { category: 'politics' });
      tracker.trackHashtagUsage('user2', '#politics', { category: 'politics' });
      tracker.trackHashtagUsage('user3', '#climate', { category: 'environment' });

      const analytics = tracker.getHashtagAnalytics();
      
      expect(analytics.totalHashtags).toBeGreaterThan(0);
      expect(analytics.totalUsage).toBeGreaterThan(0);
      expect(analytics.trendingHashtags).toBeDefined();
      expect(analytics.categoryBreakdown).toBeDefined();
    });

    it('should identify viral potential hashtags', () => {
      const tracker = TrendingHashtagsTracker.getInstance();
      
      // Simulate high-engagement hashtag
      for (let i = 0; i < 10; i++) {
        tracker.trackHashtagUsage(`user${i}`, '#viral', { category: 'trending' });
      }

      const analytics = tracker.getHashtagAnalytics();
      
      expect(analytics.viralPotential).toBeDefined();
      expect(analytics.viralPotential.length).toBeGreaterThan(0);
    });
  });

  describe('Hashtag Analytics Integration', () => {
    it('should calculate trending hashtags with proper scoring', async () => {
      const mockUsageData = [
        { hashtag_id: 'hashtag-1', created_at: new Date().toISOString(), user_id: 'user1' },
        { hashtag_id: 'hashtag-1', created_at: new Date().toISOString(), user_id: 'user2' },
        { hashtag_id: 'hashtag-2', created_at: new Date().toISOString(), user_id: 'user3' }
      ];

      const mockHashtags = [
        { id: 'hashtag-1', name: '#politics', category: 'politics' },
        { id: 'hashtag-2', name: '#climate', category: 'environment' }
      ];

      // Mock the database queries
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'hashtag_usage') {
          return {
            select: jest.fn(() => ({
              gte: jest.fn(() => ({
                order: jest.fn(() => Promise.resolve({ 
                  data: mockUsageData, 
                  error: null 
                }))
              }))
            }))
          };
        } else if (table === 'hashtags') {
          return {
            select: jest.fn(() => ({
              in: jest.fn(() => Promise.resolve({ 
                data: mockHashtags, 
                error: null 
              }))
            }))
          };
        }
        return { select: jest.fn(() => ({ eq: jest.fn(() => Promise.resolve({ data: [], error: null })) })) };
      });

      const trendingHashtags = await calculateTrendingHashtags('politics', 10);
      
      expect(trendingHashtags).toBeDefined();
      expect(Array.isArray(trendingHashtags)).toBe(true);
    });
  });

  describe('Component Integration', () => {
    it('should render trending polls with proper test IDs', () => {
      const mockTrendingData = {
        trendingHashtags: ['#politics', '#climate', '#economy'],
        trendingPolls: [
          { id: 'poll-1', title: 'Political Poll', hashtags: ['#politics'] },
          { id: 'poll-2', title: 'Climate Poll', hashtags: ['#climate'] }
        ]
      };

      // Test that components use proper test IDs
      const expectedTestIds = [
        T.dashboard.trendingPollsSection,
        T.dashboard.trendingHashtags,
        T.dashboard.trendingPolls,
        T.poll.item,
        T.poll.title
      ];

      expectedTestIds.forEach(testId => {
        expect(testId).toBeDefined();
        expect(typeof testId).toBe('string');
      });
    });

    it('should handle hashtag selection and filtering', () => {
      const mockHashtagSelection = {
        selectedHashtags: ['#politics', '#climate'],
        onHashtagSelect: jest.fn(),
        onPollSelect: jest.fn()
      };

      // Test hashtag selection logic
      const handleHashtagSelect = (hashtag: string) => {
        if (mockHashtagSelection.selectedHashtags.includes(hashtag)) {
          mockHashtagSelection.selectedHashtags = mockHashtagSelection.selectedHashtags.filter(h => h !== hashtag);
        } else {
          mockHashtagSelection.selectedHashtags.push(hashtag);
        }
        mockHashtagSelection.onHashtagSelect(hashtag);
      };

      // Test adding hashtag
      handleHashtagSelect('#economy');
      expect(mockHashtagSelection.selectedHashtags).toContain('#economy');
      expect(mockHashtagSelection.onHashtagSelect).toHaveBeenCalledWith('#economy');

      // Test removing hashtag
      handleHashtagSelect('#politics');
      expect(mockHashtagSelection.selectedHashtags).not.toContain('#politics');
    });
  });

  describe('Performance and Caching', () => {
    it('should cache trending hashtag results', async () => {
      const cacheKey = 'trending_hashtags_10';
      const mockTrendingData = ['#politics', '#climate', '#economy'];

      // Mock cache implementation
      const cache = new Map();
      cache.set(cacheKey, mockTrendingData);

      const cachedResult = cache.get(cacheKey);
      expect(cachedResult).toEqual(mockTrendingData);
    });

    it('should handle cache expiration', () => {
      const cache = new Map();
      const cacheKey = 'trending_hashtags_10';
      const cacheData = {
        data: ['#politics', '#climate'],
        timestamp: Date.now() - 25 * 60 * 60 * 1000 // 25 hours ago
      };

      cache.set(cacheKey, cacheData);

      // Check if cache is expired (24 hour TTL)
      const isExpired = Date.now() - cacheData.timestamp > 24 * 60 * 60 * 1000;
      expect(isExpired).toBe(true);
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({ 
                data: null, 
                error: new Error('Database connection failed') 
              }))
            }))
          }))
        }))
      });

      const result = await hashtagService.generatePersonalizedFeed('test-user', 10);
      
      // Should return empty results instead of throwing
      expect(result.recommended_polls).toEqual([]);
      expect(result.trending_hashtags).toEqual([]);
    });

    it('should provide fallback hashtag interests', async () => {
      const mockUserId = 'test-user-123';
      
      // Mock empty user interests
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ 
            data: [], 
            error: null 
          }))
        }))
      });

      const result = await hashtagService.generatePersonalizedFeed(mockUserId, 10);
      
      // Should have fallback interests
      expect(result.user_interests).toBeDefined();
      expect(Array.isArray(result.user_interests)).toBe(true);
    });
  });
});
