// Interest-Based Poll Feed Service
// Enhanced feed system with hashtag management and personalization
// Created: October 2, 2025

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger';
import { FEATURE_FLAGS } from '@/lib/core/feature-flags';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Types for interest-based feeds
export type UserInterests = {
  selectedInterests: string[];
  customInterests: string[]; // User-created hashtags
  trendingHashtags: string[]; // Real-time trending
  userHashtags: string[]; // User's custom hashtags
};

export type PersonalizedPollFeed = {
  userId: string;
  generatedAt: string;
  polls: PollRecommendation[];
  interestMatches: InterestMatch[];
  trendingHashtags: string[];
  suggestedInterests: string[];
};

export type PollRecommendation = {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  relevanceScore: number;
  interestMatches: string[];
  totalVotes: number;
  created_at: string;
};

export type InterestMatch = {
  interest: string;
  matchCount: number;
  relevanceScore: number;
};

// Interest-Based Poll Feed Service
export class InterestBasedPollFeed {
  private supabase: any;

  constructor() {
    // Initialize Supabase client
    this.supabase = null; // Will be set in methods
  }

  async generatePersonalizedFeed(
    userId: string,
    userInterests: string[],
    userLocation: string,
    userDemographics: any
  ): Promise<PersonalizedPollFeed> {
    
    try {
      const supabase = await getSupabaseServerClient();
      this.supabase = supabase;
      
      // 1. Get user's interest tags
      const userTags = await this.getUserInterestTags(userId);
      
      // 2. Find polls matching user interests
      const matchingPolls = await this.findMatchingPolls(userTags, userLocation);
      
      // 3. Apply demographic filtering
      const demographicFiltered = await this.applyDemographicFiltering(
        matchingPolls, 
        userDemographics
      );
      
      // 4. Rank by relevance and recency
      const rankedPolls = await this.rankPollsByRelevance(
        demographicFiltered,
        userInterests
      );
      
      return {
        userId,
        generatedAt: new Date().toISOString(),
        polls: rankedPolls,
        interestMatches: this.calculateInterestMatches(rankedPolls, userTags),
        trendingHashtags: await this.getTrendingHashtags(),
        suggestedInterests: await this.getSuggestedInterests(userId)
      };
    } catch (error) {
      logger.error('Failed to generate personalized feed:', error);
      throw new Error('Failed to generate personalized feed');
    }
  }

  // Get user's interest tags from database
  private async getUserInterestTags(userId: string): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_hashtags')
        .select('hashtag')
        .eq('user_id', userId)
        .eq('is_following', true);

      if (error) {
        logger.error('Error fetching user hashtags:', error);
        return [];
      }

      return data?.map((item: any) => item.hashtag) || [];
    } catch (error) {
      logger.error('Error in getUserInterestTags:', error);
      return [];
    }
  }

  // Find polls matching user interests
  private async findMatchingPolls(userTags: string[], userLocation: string): Promise<PollRecommendation[]> {
    try {
      // Future: Implement location-based filtering when DEMOGRAPHIC_FILTERING feature flag is enabled
      if (FEATURE_FLAGS.DEMOGRAPHIC_FILTERING) {
        // TODO: Implement location-based filtering
        logger.debug('Location-based filtering not yet implemented', { userLocation });
      }
      
      if (userTags.length === 0) {
        // Return trending polls if no interests
        return await this.getTrendingPolls();
      }

      const { data, error } = await this.supabase
        .from('polls')
        .select(`
          id, title, description, category, tags, total_votes, created_at,
          created_by, status, privacy_level
        `)
        .eq('status', 'active')
        .eq('privacy_level', 'public')
        .overlaps('tags', userTags)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        logger.error('Error fetching matching polls:', error);
        return [];
      }

      return data?.map((poll: any) => ({
        id: poll.id,
        title: poll.title,
        description: poll.description,
        category: poll.category,
        tags: poll.tags || [],
        relevanceScore: this.calculateRelevanceScore(poll.tags, userTags),
        interestMatches: this.findMatchingInterests(poll.tags, userTags),
        totalVotes: poll.total_votes || 0,
        created_at: poll.created_at
      })) || [];
    } catch (error) {
      logger.error('Error in findMatchingPolls:', error);
      return [];
    }
  }

  // Apply demographic filtering
  private async applyDemographicFiltering(
    polls: PollRecommendation[],
    userDemographics: any
  ): Promise<PollRecommendation[]> {
    // Future: Implement demographic filtering when DEMOGRAPHIC_FILTERING feature flag is enabled
    if (FEATURE_FLAGS.DEMOGRAPHIC_FILTERING) {
      // TODO: Implement demographic filtering
      logger.debug('Demographic filtering not yet implemented', { userDemographics });
    }
    
    // For MVP, return all polls
    return polls;
  }

  // Rank polls by relevance and recency
  private async rankPollsByRelevance(
    polls: PollRecommendation[],
    userInterests: string[]
  ): Promise<PollRecommendation[]> {
    return polls
      .map(poll => {
        const safeTags = poll.tags ?? [];
        return {
          id: poll.id,
          title: poll.title,
          description: poll.description,
          category: poll.category || 'general',
          tags: safeTags,
          relevanceScore: this.calculateRelevanceScore(safeTags, userInterests),
          interestMatches: this.findInterestMatches(safeTags, userInterests),
          totalVotes: poll.totalVotes || 0,
          created_at: poll.created_at
        };
      })
      .sort((a, b) => {
        // Sort by relevance score first, then by recency
        if (a.relevanceScore !== b.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, 20); // Return top 20 polls
  }

  // Calculate relevance score based on tag matches
  private calculateRelevanceScore(pollTags: string[], userInterests: string[]): number {
    if (!pollTags || pollTags.length === 0) return 0;
    
    const matches = pollTags.filter(tag => userInterests.includes(tag)).length;
    return matches / pollTags.length;
  }

  // Find matching interests between poll and user
  private findMatchingInterests(pollTags: string[], userInterests: string[]): string[] {
    return pollTags.filter(tag => userInterests.includes(tag));
  }

  // Alias for findMatchingInterests to match the usage
  private findInterestMatches(pollTags: string[], userInterests: string[]): string[] {
    return this.findMatchingInterests(pollTags, userInterests);
  }

  // Calculate interest matches for analytics
  private calculateInterestMatches(polls: PollRecommendation[], userTags: string[]): InterestMatch[] {
    // Future: Implement analytics when TRENDING_POLLS feature flag is enabled
    if (FEATURE_FLAGS.TRENDING_POLLS) {
      // TODO: Implement trending analytics
      logger.debug('Trending analytics not yet implemented', { userTags });
    }
    
    const interestCounts: { [key: string]: number } = {};
    
    polls.forEach(poll => {
      poll.interestMatches.forEach(interest => {
        interestCounts[interest] = (interestCounts[interest] || 0) + 1;
      });
    });

    return Object.entries(interestCounts)
      .map(([interest, count]) => ({
        interest,
        matchCount: count,
        relevanceScore: count / polls.length
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // Get trending hashtags
  private async getTrendingHashtags(): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('hashtag_trends')
        .select('hashtag, trend_score')
        .order('trend_score', { ascending: false })
        .limit(10);

      if (error) {
        logger.error('Error fetching trending hashtags:', error);
        return [];
      }

      return data?.map((item: any) => item.hashtag) || [];
    } catch (error) {
      logger.error('Error in getTrendingHashtags:', error);
      return [];
    }
  }

  // Get suggested interests for user
  private async getSuggestedInterests(userId: string): Promise<string[]> {
    try {
      // Get interests from similar users
      const { data, error } = await this.supabase
        .from('user_hashtags')
        .select('hashtag')
        .neq('user_id', userId)
        .eq('is_following', true)
        .limit(20);

      if (error) {
        logger.error('Error fetching suggested interests:', error);
        return [];
      }

      // Count frequency of hashtags
      const hashtagCounts: { [key: string]: number } = {};
      data?.forEach((item: any) => {
        hashtagCounts[item.hashtag] = (hashtagCounts[item.hashtag] || 0) + 1;
      });

      // Return top 5 most popular hashtags
      return Object.entries(hashtagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([hashtag]) => hashtag);
    } catch (error) {
      logger.error('Error in getSuggestedInterests:', error);
      return [];
    }
  }

  // Get trending polls when no interests are available
  private async getTrendingPolls(): Promise<PollRecommendation[]> {
    try {
      const { data, error } = await this.supabase
        .from('polls')
        .select(`
          id, title, description, category, tags, total_votes, created_at,
          created_by, status, privacy_level
        `)
        .eq('status', 'active')
        .eq('privacy_level', 'public')
        .order('total_votes', { ascending: false })
        .limit(20);

      if (error) {
        logger.error('Error fetching trending polls:', error);
        return [];
      }

      return data?.map((poll: any) => ({
        id: poll.id,
        title: poll.title,
        description: poll.description,
        category: poll.category,
        tags: poll.tags || [],
        relevanceScore: 0.5, // Default relevance for trending
        interestMatches: [],
        totalVotes: poll.total_votes || 0,
        created_at: poll.created_at
      })) || [];
    } catch (error) {
      logger.error('Error in getTrendingPolls:', error);
      return [];
    }
  }
}

// API endpoint for personalized feeds
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const includeTrending = searchParams.get('includeTrending') === 'true';
    
    // Future: Add trending polls when TRENDING_POLLS feature flag is added
    if (includeTrending) {
      // This will add trending polls to the personalized feed
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const feedService = new InterestBasedPollFeed();
    
    // Get user profile data
    const supabase = await getSupabaseServerClient();
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate personalized feed
    const personalizedFeed = await feedService.generatePersonalizedFeed(
      userId,
      userProfile.interests || [],
      userProfile.location || '',
      userProfile.demographics || {}
    );

    return NextResponse.json({
      ok: true,
      data: personalizedFeed
    });

  } catch (error) {
    logger.error('Personalized feed API error:', error);
    return NextResponse.json({
      error: 'Failed to generate personalized feed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// API endpoint for hashtag management
export async function POST(request: NextRequest) {
  try {
    const { hashtag, userId, action } = await request.json();
    
    if (!hashtag || !userId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    
    switch (action) {
      case 'follow':
        await supabase.from('user_hashtags').upsert({
          user_id: userId,
          hashtag: hashtag,
          is_following: true
        });
        break;
        
      case 'unfollow':
        await supabase.from('user_hashtags')
          .update({ is_following: false })
          .eq('user_id', userId)
          .eq('hashtag', hashtag);
        break;
        
      case 'create':
        await supabase.from('user_hashtags').insert({
          user_id: userId,
          hashtag: hashtag,
          is_custom: true,
          is_following: true
        });
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: `Hashtag ${action} successful`
    });

  } catch (error) {
    logger.error('Hashtag management API error:', error);
    return NextResponse.json({
      error: 'Failed to manage hashtag',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
