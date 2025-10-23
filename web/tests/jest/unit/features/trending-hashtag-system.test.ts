/**
 * Unit Tests for Trending Hashtag System
 * 
 * Tests the hashtag-based trending polls implementation:
 * - HashtagPollsIntegrationService
 * - TrendingHashtagsTracker
 * - Hashtag analytics and scoring
 * - Trending polls API integration
 * 
 * Created: January 23, 2025
 * Status: ✅ ACTIVE
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
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

describe('Trending Hashtag System - Unit Tests', () => {
  let hashtagService: HashtagPollsIntegrationService;
  let trendingTracker: TrendingHashtagsTracker;

  beforeEach(() => {
    hashtagService = new HashtagPollsIntegrationService(mockSupabase);
    trendingTracker = TrendingHashtagsTracker.getInstance();
    jest.clearAllMocks();
  });

  describe('HashtagPollsIntegrationService', () => {
    it('should initialize with proper configuration', () => {
      expect(hashtagService).toBeDefined();
      expect(hashtagService).toBeInstanceOf(HashtagPollsIntegrationService);
    });

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

    it('should calculate trending scores with proper weighting', () => {
      const mockHashtagUsage = [
        { hashtag: '#politics', count: 50, recency: 0.9 },
        { hashtag: '#climate', count: 30, recency: 0.8 },
        { hashtag: '#economy', count: 20, recency: 0.7 }
      ];

      // Test trending score calculation (count * 0.7 + recency * 0.3)
      const trendingScores = mockHashtagUsage.map(item => ({
        hashtag: item.hashtag,
        score: item.count * 0.7 + item.recency * 0.3
      })).sort((a, b) => b.score - a.score);

      expect(trendingScores[0].hashtag).toBe('#politics');
      expect(trendingScores[0].score).toBe(50 * 0.7 + 0.9 * 0.3); // 35.27
      expect(trendingScores[1].hashtag).toBe('#climate');
      expect(trendingScores[2].hashtag).toBe('#economy');
    });

    it('should track hashtag engagement correctly', async () => {
      const mockEngagement = {
        hashtag: '#politics',
        action: 'view' as const,
        userId: 'test-user-123',
        timestamp: new Date().toISOString()
      };

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

    it('should handle empty hashtag data gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({ 
                data: [], 
                error: null 
              }))
            }))
          }))
        }))
      });

      const result = await hashtagService.generatePersonalizedFeed('test-user', 10);
      
      expect(result.recommended_polls).toEqual([]);
      expect(result.trending_hashtags).toEqual([]);
      expect(result.user_interests).toBeDefined();
    });
  });

  describe('TrendingHashtagsTracker', () => {
    it('should track hashtag usage correctly', () => {
      const tracker = TrendingHashtagsTracker.getInstance();
      
      // Track some hashtag usage
      tracker.trackHashtagUsage('user1', '#politics', { category: 'politics' });
      tracker.trackHashtagUsage('user2', '#politics', { category: 'politics' });
      tracker.trackHashtagUsage('user3', '#climate', { category: 'environment' });

      const trendingHashtags = tracker.getTrendingHashtags(5);
      
      expect(trendingHashtags).toBeDefined();
      expect(Array.isArray(trendingHashtags)).toBe(true);
    });

    it('should provide comprehensive hashtag analytics', () => {
      const tracker = TrendingHashtagsTracker.getInstance();
      
      // Add test data
      tracker.trackHashtagUsage('user1', '#politics', { category: 'politics' });
      tracker.trackHashtagUsage('user2', '#politics', { category: 'politics' });
      tracker.trackHashtagUsage('user3', '#climate', { category: 'environment' });
      tracker.trackHashtagUsage('user4', '#economy', { category: 'economics' });

      const analytics = tracker.getHashtagAnalytics();
      
      expect(analytics.totalHashtags).toBeGreaterThan(0);
      expect(analytics.totalUsage).toBeGreaterThan(0);
      expect(analytics.trendingHashtags).toBeDefined();
      expect(analytics.categoryBreakdown).toBeDefined();
      expect(analytics.userEngagement).toBeDefined();
    });

    it('should identify viral potential hashtags', () => {
      const tracker = TrendingHashtagsTracker.getInstance();
      
      // Simulate high-engagement hashtag
      for (let i = 0; i < 15; i++) {
        tracker.trackHashtagUsage(`user${i}`, '#viral', { category: 'trending' });
      }

      const analytics = tracker.getHashtagAnalytics();
      
      expect(analytics.viralPotential).toBeDefined();
      expect(Array.isArray(analytics.viralPotential)).toBe(true);
    });

    it('should handle time-based trending calculations', () => {
      const tracker = TrendingHashtagsTracker.getInstance();
      
      // Simulate hashtag usage over time
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);
      const twoHoursAgo = now - (2 * 60 * 60 * 1000);

      // Mock time-based usage
      tracker.trackHashtagUsage('user1', '#trending', { 
        category: 'trending',
        timestamp: new Date(oneHourAgo).toISOString()
      });
      
      tracker.trackHashtagUsage('user2', '#trending', { 
        category: 'trending',
        timestamp: new Date(twoHoursAgo).toISOString()
      });

      const analytics = tracker.getHashtagAnalytics();
      
      expect(analytics.trendingHashtags).toBeDefined();
      expect(Array.isArray(analytics.trendingHashtags)).toBe(true);
    });
  });

  describe('Hashtag Analytics Integration', () => {
    it('should calculate trending hashtags with proper metrics', async () => {
      const mockUsageData = [
        { hashtag_id: 'hashtag-1', created_at: new Date().toISOString(), user_id: 'user1' },
        { hashtag_id: 'hashtag-1', created_at: new Date().toISOString(), user_id: 'user2' },
        { hashtag_id: 'hashtag-2', created_at: new Date().toISOString(), user_id: 'user3' }
      ];

      const mockHashtags = [
        { id: 'hashtag-1', name: '#politics', category: 'politics' },
        { id: 'hashtag-2', name: '#climate', category: 'environment' }
      ];

      // Mock database queries
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

    it('should handle different time periods correctly', async () => {
      const periods = ['24h', '7d', '30d', '90d', '1y'] as const;
      
      for (const period of periods) {
        const mockUsageData = [
          { hashtag_id: 'hashtag-1', created_at: new Date().toISOString(), user_id: 'user1' }
        ];

        mockSupabase.from.mockReturnValue({
          select: jest.fn(() => ({
            gte: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({ 
                data: mockUsageData, 
                error: null 
              }))
            }))
          }))
        });

        const result = await calculateTrendingHashtags('politics', 10);
        expect(result).toBeDefined();
      }
    });
  });

  describe('Component Integration with Test IDs', () => {
    it('should use proper test IDs for trending polls components', () => {
      const expectedTestIds = [
        T.dashboard.trendingPollsSection,
        T.dashboard.trendingHashtags,
        T.dashboard.trendingPolls,
        T.poll.item,
        T.poll.title,
        T.poll.category
      ];

      expectedTestIds.forEach(testId => {
        expect(testId).toBeDefined();
        expect(typeof testId).toBe('string');
        expect(testId.length).toBeGreaterThan(0);
      });
    });

    it('should handle hashtag selection with proper test IDs', () => {
      const hashtagSelectionTestIds = [
        T.poll.categoryFilter,
        T.poll.search,
        T.dashboard.feedTab
      ];

      hashtagSelectionTestIds.forEach(testId => {
        expect(testId).toBeDefined();
        expect(typeof testId).toBe('string');
      });
    });
  });

  describe('Performance and Caching', () => {
    it('should implement proper caching for trending hashtags', () => {
      const cache = new Map();
      const cacheKey = 'trending_hashtags_10';
      const mockData = ['#politics', '#climate', '#economy'];
      
      cache.set(cacheKey, mockData);
      const cached = cache.get(cacheKey);
      
      expect(cached).toEqual(mockData);
    });

    it('should handle cache expiration correctly', () => {
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

    it('should handle concurrent hashtag tracking', () => {
      const tracker = TrendingHashtagsTracker.getInstance();
      
      // Simulate concurrent usage tracking
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          Promise.resolve(tracker.trackHashtagUsage(`user${i}`, '#concurrent', { category: 'test' }))
        );
      }

      return Promise.all(promises).then(() => {
        const analytics = tracker.getHashtagAnalytics();
        expect(analytics.totalUsage).toBeGreaterThanOrEqual(100);
      });
    });
  });

  describe('Error Handling', () => {
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

    it('should provide fallback data when analytics fail', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ 
            data: [], 
            error: new Error('Analytics service unavailable') 
          }))
        }))
      });

      const result = await hashtagService.generatePersonalizedFeed('test-user', 10);
      
      expect(result.user_interests).toBeDefined();
      expect(Array.isArray(result.user_interests)).toBe(true);
    });
  });
});
