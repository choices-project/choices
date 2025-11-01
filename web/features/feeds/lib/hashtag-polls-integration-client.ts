/**
 * Hashtag-Polls Integration for Feeds - Client Version
 * 
 * Client-safe version of hashtag-polls integration service
 * Uses client-side Supabase client instead of server-only imports
 * 
 * Created: January 19, 2025
 * Status: ✅ ACTIVE
 */

import type { 
  UserPreferences
} from '@/features/civics/lib/types/civics-types';
import { logger } from '@/lib/utils/logger';
import { getSupabaseBrowserClient } from '@/utils/supabase/client';

// Local type definitions
export type PollRecommendation = {
  id?: string; // Alias for pollId for compatibility
  pollId: string;
  title: string;
  description?: string;
  hashtags: string[];
  tags?: string[]; // Alias for hashtags for compatibility
  relevanceScore: number;
  reason: string;
  totalVotes?: number;
  engagementScore?: number;
  created_at?: string;
  interestMatches?: string[];
}

// Enhanced hashtag-polls integration types
export type HashtagPollIntegration = {
  poll_id: string;
  hashtags: string[];
  primary_hashtag: string;
  hashtag_engagement: {
    total_views: number;
    hashtag_clicks: number;
    hashtag_shares: number;
  };
  trending_score: number;
  user_relevance_score: number;
  feed_priority: number;
}

export type HashtagFeedAnalytics = {
  hashtag: string;
  poll_count: number;
  engagement_rate: number;
  trending_position: number;
  user_interest_level: number;
  last_activity: Date;
}

export type PersonalizedHashtagFeed = {
  user_id: string;
  hashtag_interests: string[];
  recommended_polls: PollRecommendation[];
  trending_hashtags: string[];
  hashtag_analytics: HashtagFeedAnalytics[];
  feed_score: number;
  last_updated: Date;
}

/**
 * Client-Safe Hashtag-Polls Integration Service
 * 
 * Provides hashtag-polls integration for feeds using client-side Supabase
 * with real-time analytics and personalization
 */
export class HashtagPollsIntegrationServiceClient {
  private supabase: any;
  private cache = new Map<string, any>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeSupabase();
  }

  private async initializeSupabase() {
    try {
      this.supabase = await getSupabaseBrowserClient();
    } catch (error) {
      logger.error('Failed to initialize Supabase client:', error instanceof Error ? error : new Error(String(error)));
      this.supabase = null;
    }
  }

  /**
   * Generate personalized hashtag-based poll feed
   */
  async generateHashtagPollFeed(
    userId: string,
    userPreferences: UserPreferences,
    limit = 20
  ): Promise<PersonalizedHashtagFeed> {
    try {
      if (!this.supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Get user's hashtag interests
      const hashtagInterests = await this.getUserHashtagInterests(userId);
      
      // Get trending hashtags
      const trendingHashtags = await this.getTrendingHashtags(10);
      
      // Generate poll recommendations based on hashtags
      const recommendedPolls = await this.getHashtagBasedPollRecommendations(
        userId,
        hashtagInterests,
        limit
      );
      
      // Calculate hashtag analytics
      const hashtagAnalytics = await this.calculateHashtagAnalytics(
        hashtagInterests,
        trendingHashtags
      );
      
      // Calculate overall feed score
      const feedScore = this.calculateFeedScore(recommendedPolls, hashtagAnalytics);
      
      return {
        user_id: userId,
        hashtag_interests: hashtagInterests,
        recommended_polls: recommendedPolls,
        trending_hashtags: trendingHashtags,
        hashtag_analytics: hashtagAnalytics,
        feed_score: feedScore,
        last_updated: new Date()
      };
      
    } catch (error) {
      logger.error('Failed to generate hashtag poll feed:', error as Error);
      throw error;
    }
  }

  /**
   * Get user's followed hashtags - the primary driver for feed autopopulation
   * This is the core mechanism that drives personalized poll recommendations
   */
  private async getUserHashtagInterests(userId: string): Promise<string[]> {
    try {
      const cacheKey = `user_followed_hashtags_${userId}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      // Get user's explicitly followed hashtags from user_hashtags table
      const { data: followedHashtags, error: followedError } = await this.supabase
        .from('user_hashtags')
        .select(`
          hashtag_id,
          hashtags!inner(
            name,
            display_name,
            category
          )
        `)
        .eq('user_id', userId)
        .eq('is_following', true);

      if (followedError) {
        logger.warn('Failed to get user followed hashtags:', followedError);
        // Fallback to engagement-based interests if following data unavailable
        return await this.getFallbackHashtagInterests(userId);
      }

      // Extract hashtag names from followed hashtags
      const followedHashtagNames = followedHashtags?.map((uh: any) => 
        uh.hashtags?.name
      ).filter(Boolean) || [];

      // If user has no followed hashtags, get trending hashtags as default
      if (followedHashtagNames.length === 0) {
        const trendingHashtags = await this.getTrendingHashtags(5);
        this.setCachedData(cacheKey, trendingHashtags);
        return trendingHashtags;
      }

      this.setCachedData(cacheKey, followedHashtagNames);
      return followedHashtagNames;
      
    } catch (error) {
      logger.error('Failed to get user followed hashtags:', error as Error);
      return await this.getFallbackHashtagInterests(userId);
    }
  }

  /**
   * Fallback method to get hashtag interests from engagement history
   * Used when user_hashtags table is not available or user has no followed hashtags
   */
  private async getFallbackHashtagInterests(userId: string): Promise<string[]> {
    try {
      // Get user's hashtag engagement history as fallback
      const { data: engagementData, error } = await this.supabase
        .from('analytics_events')
        .select('event_data')
        .eq('user_id', userId)
        .eq('event_category', 'hashtag')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        logger.warn('Failed to get user hashtag engagement:', error);
        return [];
      }

      // Analyze hashtag interests from engagement data
      const hashtagScores = new Map<string, number>();
      
      engagementData?.forEach((event: any) => {
        const eventData = event.event_data;
        if (eventData?.hashtag) {
          const hashtag = eventData.hashtag;
          const currentScore = hashtagScores.get(hashtag) || 0;
          hashtagScores.set(hashtag, currentScore + 1);
        }
      });

      // Sort by engagement score and return top hashtags
      const sortedHashtags = Array.from(hashtagScores.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([hashtag]) => hashtag);

      return sortedHashtags;
      
    } catch (error) {
      logger.error('Failed to get fallback hashtag interests:', error as Error);
      return [];
    }
  }

  /**
   * Get trending hashtags with real-time analysis
   */
  private async getTrendingHashtags(limit: number): Promise<string[]> {
    try {
      const cacheKey = `trending_hashtags_${limit}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      // Get hashtag usage data from the last 24 hours
      const { data: hashtagData, error } = await this.supabase
        .from('analytics_events')
        .select('event_data, created_at')
        .eq('event_category', 'hashtag')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        logger.warn('Failed to get trending hashtags:', error);
        return [];
      }

      // Calculate trending scores
      const hashtagScores = new Map<string, { count: number; recency: number }>();
      
      hashtagData?.forEach((event: any) => {
        const eventData = event.event_data;
        if (eventData?.hashtag) {
          const hashtag = eventData.hashtag;
          const current = hashtagScores.get(hashtag) || { count: 0, recency: 0 };
          const hoursAgo = (Date.now() - new Date(event.created_at).getTime()) / (1000 * 60 * 60);
          const recencyScore = Math.max(0, 24 - hoursAgo) / 24; // Higher score for more recent
          
          hashtagScores.set(hashtag, {
            count: current.count + 1,
            recency: Math.max(current.recency, recencyScore)
          });
        }
      });

      // Calculate final trending scores
      const trendingScores = Array.from(hashtagScores.entries())
        .map(([hashtag, data]) => ({
          hashtag,
          score: data.count * 0.7 + data.recency * 0.3 // Weight count more than recency
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.hashtag);

      this.setCachedData(cacheKey, trendingScores);
      return trendingScores;
      
    } catch (error) {
      logger.error('Failed to get trending hashtags:', error as Error);
      return [];
    }
  }

  /**
   * Get poll recommendations based on followed hashtags
   * This is the core autopopulation mechanism for personalized feeds
   */
  private async getHashtagBasedPollRecommendations(
    userId: string,
    followedHashtags: string[],
    limit: number
  ): Promise<PollRecommendation[]> {
    try {
      if (followedHashtags.length === 0) {
        // If user follows no hashtags, get trending polls as fallback
        return await this.getTrendingPollRecommendations(limit);
      }

      // Get polls that match user's followed hashtags with priority scoring
      const { data: pollsData, error } = await this.supabase
        .from('polls')
        .select(`
          id,
          title,
          description,
          options,
          total_votes,
          created_at,
          hashtags,
          primary_hashtag,
          hashtag_engagement
        `)
        .contains('hashtags', followedHashtags) // Use contains for array matching
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit * 3); // Get more for better filtering

      if (error) {
        logger.warn('Failed to get hashtag-based polls:', error);
        return await this.getTrendingPollRecommendations(limit);
      }

      // Convert to PollRecommendation format with enhanced hashtag scoring
      const recommendations: PollRecommendation[] = pollsData?.map((poll: any) => {
        // Calculate priority score based on followed hashtags
        const followedHashtagMatches = (poll.hashtags || []).filter((hashtag: string) => 
          followedHashtags.includes(hashtag)
        ).length;
        
        const hashtagMatchScore = followedHashtagMatches / Math.max(followedHashtags.length, 1);
        const primaryHashtagBonus = followedHashtags.includes(poll.primary_hashtag) ? 0.3 : 0;
        
        const engagementScore = this.calculateEngagementScore(poll);
        const recencyScore = this.calculateRecencyScore(poll.created_at);
        
        // Enhanced relevance scoring with followed hashtag priority
        const relevanceScore = (
          hashtagMatchScore * 0.6 + // Higher weight for followed hashtags
          primaryHashtagBonus * 0.2 + // Bonus for primary hashtag match
          engagementScore * 0.15 +
          recencyScore * 0.05
        );

        // Generate personalized reason based on followed hashtags
        const matchedHashtags = (poll.hashtags || []).filter((hashtag: string) => 
          followedHashtags.includes(hashtag)
        );
        const reason = matchedHashtags.length > 0 
          ? `Matches your followed hashtags: ${matchedHashtags.map((h: string) => `#${h}`).join(', ')}`
          : `Related to your interests in ${poll.primary_hashtag || 'politics'}`;

        return {
          poll_id: poll.id,
          title: poll.title,
          description: poll.description,
          relevanceScore,
          hashtag_match_score: hashtagMatchScore + primaryHashtagBonus,
          engagement_score: engagementScore,
          recency_score: recencyScore,
          hashtags: poll.hashtags || [],
          primary_hashtag: poll.primary_hashtag,
          total_votes: poll.total_votes || 0,
          created_at: poll.created_at,
          reason
        };
      }) || [];

      // Sort by relevance score and return top recommendations
      return recommendations
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);
        
    } catch (error) {
      logger.error('Failed to get hashtag-based poll recommendations:', error as Error);
      return await this.getTrendingPollRecommendations(limit);
    }
  }

  /**
   * Get trending poll recommendations as fallback
   */
  private async getTrendingPollRecommendations(limit: number): Promise<PollRecommendation[]> {
    try {
      const { data: pollsData, error } = await this.supabase
        .from('polls')
        .select(`
          id,
          title,
          description,
          options,
          total_votes,
          created_at,
          hashtags,
          primary_hashtag,
          hashtag_engagement
        `)
        .eq('status', 'active')
        .order('total_votes', { ascending: false })
        .limit(limit);

      if (error) {
        logger.warn('Failed to get trending polls:', error);
        return [];
      }

      return pollsData?.map((poll: any) => ({
        poll_id: poll.id,
        title: poll.title,
        description: poll.description,
        relevanceScore: 0.5, // Default score for trending
        hashtag_match_score: 0,
        engagement_score: this.calculateEngagementScore(poll),
        recency_score: this.calculateRecencyScore(poll.created_at),
        hashtags: poll.hashtags || [],
        primary_hashtag: poll.primary_hashtag,
        total_votes: poll.total_votes || 0,
        created_at: poll.created_at,
        reason: 'Trending poll'
      })) || [];
      
    } catch (error) {
      logger.error('Failed to get trending poll recommendations:', error as Error);
      return [];
    }
  }

  /**
   * Calculate hashtag analytics for user interests
   */
  private async calculateHashtagAnalytics(
    userInterests: string[],
    trendingHashtags: string[]
  ): Promise<HashtagFeedAnalytics[]> {
    try {
      const analytics: HashtagFeedAnalytics[] = [];
      
      for (const hashtag of userInterests) {
        // Get poll count for this hashtag
        const { data: pollData, error: pollError } = await this.supabase
          .from('polls')
          .select('id, hashtag_engagement')
          .contains('hashtags', [hashtag])
          .eq('status', 'active');

        if (pollError) {
          logger.warn(`Failed to get poll data for hashtag ${hashtag}:`, pollError);
          continue;
        }

        // Calculate engagement rate
        const totalEngagement = pollData?.reduce((sum: number, poll: any) => {
          const engagement = poll.hashtag_engagement || {};
          return sum + (engagement.total_views || 0) + (engagement.hashtag_clicks || 0);
        }, 0) || 0;

        const pollCount = pollData?.length || 0;
        const engagementRate = pollCount > 0 ? totalEngagement / pollCount : 0;

        // Calculate trending position
        const trendingPosition = trendingHashtags.indexOf(hashtag) + 1;
        const isTrending = trendingPosition > 0;

        // Calculate user interest level
        const userInterestLevel = userInterests.indexOf(hashtag) + 1;
        const normalizedInterest = 1 - (userInterestLevel - 1) / userInterests.length;

        analytics.push({
          hashtag,
          poll_count: pollCount,
          engagement_rate: engagementRate,
          trending_position: isTrending ? trendingPosition : 0,
          user_interest_level: normalizedInterest,
          last_activity: new Date()
        });
      }

      return analytics;
      
    } catch (error) {
      logger.error('Failed to calculate hashtag analytics:', error as Error);
      return [];
    }
  }

  /**
   * Calculate engagement score for a poll
   */
  private calculateEngagementScore(poll: any): number {
    const totalVotes = poll.total_votes || 0;
    const engagement = poll.hashtag_engagement || {};
    const hashtagViews = engagement.total_views || 0;
    const hashtagClicks = engagement.hashtag_clicks || 0;
    
    // Normalize engagement score (0-1)
    const totalEngagement = totalVotes + hashtagViews + hashtagClicks;
    return Math.min(1, totalEngagement / 1000); // Cap at 1000 for normalization
  }

  /**
   * Calculate recency score for a poll
   */
  private calculateRecencyScore(createdAt: string): number {
    const hoursAgo = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    return Math.max(0, 1 - hoursAgo / 168); // Decay over 1 week
  }

  /**
   * Calculate overall feed score
   */
  private calculateFeedScore(
    recommendations: PollRecommendation[],
    analytics: HashtagFeedAnalytics[]
  ): number {
    if (recommendations.length === 0) return 0;

    const avgRelevance = recommendations.reduce((sum, rec) => 
      sum + rec.relevanceScore, 0) / recommendations.length;
    
    const avgAnalytics = analytics.reduce((sum, analytic) => 
      sum + analytic.engagement_rate, 0) / Math.max(analytics.length, 1);

    return (avgRelevance * 0.7 + avgAnalytics * 0.3);
  }

  /**
   * Track hashtag engagement in feeds
   */
  async trackHashtagEngagement(
    userId: string,
    hashtag: string,
    action: 'view' | 'click' | 'share' | 'follow'
  ): Promise<void> {
    try {
      if (!this.supabase) return;

      await this.supabase.from('analytics_events').insert({
        user_id: userId,
        event_type: 'vote', // Use existing event type
        event_category: 'hashtag',
        event_data: {
          hashtag,
          action,
          timestamp: new Date().toISOString()
        }
      });

      // Clear relevant cache
      this.clearCacheForUser(userId);
      
    } catch (error) {
      logger.error('Failed to track hashtag engagement:', error as Error);
    }
  }

  /**
   * Get real-time hashtag trending data
   */
  async getRealTimeTrendingData(): Promise<HashtagFeedAnalytics[]> {
    try {
      const cacheKey = 'realtime_trending_data';
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      const trendingHashtags = await this.getTrendingHashtags(20);
      const analytics = await this.calculateHashtagAnalytics(
        trendingHashtags,
        trendingHashtags
      );

      this.setCachedData(cacheKey, analytics);
      return analytics;
      
    } catch (error) {
      logger.error('Failed to get real-time trending data:', error as Error);
      return [];
    }
  }

  // Cache management methods
  private getCachedData(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private clearCacheForUser(userId: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(userId)
    );
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Export singleton instance
export const hashtagPollsIntegrationServiceClient = new HashtagPollsIntegrationServiceClient();
