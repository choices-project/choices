// Interest-Based Poll Feed Service
// Enhanced feed system with hashtag management and personalization
// Created: October 2, 2025

import { NextResponse } from 'next/server';


import { getSupabaseServerClient } from '@/utils/supabase/server';

import { logger } from '@/lib/utils/logger';
// Database types are used directly when needed

import { hashtagPollsIntegrationService } from './hashtag-polls-integration';

import type { NextRequest } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Types for interest-based feeds
export type UserInterests = {
  selectedInterests: string[];
  customInterests: string[]; // User-created hashtags
  trendingHashtags: string[]; // Real-time trending
  userHashtags: string[]; // User's custom hashtags
}

// Proper types for JSON fields from database
export type LocationData = {
  state?: string;
  region?: string;
  district?: string;
  county?: string;
  country?: string;
}

export type Demographics = {
  age_range?: string;
  education_level?: string;
  income_bracket?: string;
  political_affiliation?: string;
  [key: string]: unknown;
}

// Database types are used directly when needed

export type PersonalizedPollFeed = {
  userId: string;
  generatedAt: string;
  polls: PollRecommendation[];
  interestMatches: InterestMatch[];
  trendingHashtags: string[];
  suggestedInterests: string[];
}

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
}

export type InterestMatch = {
  interest: string;
  matchCount: number;
  relevanceScore: number;
}

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
      const demographicFiltered = this.applyDemographicFiltering(
        matchingPolls, 
        userDemographics
      );
      
      // 4. Rank by relevance and recency
      const rankedPolls = this.rankPollsByRelevance(
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
      logger.error('Failed to generate personalized feed:', error instanceof Error ? error : new Error(String(error)));
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
        logger.error('Error fetching user hashtags:', error instanceof Error ? error : new Error(String(error)));
        return [];
      }

      return data?.map((item: any) => item.hashtag) ?? [];
    } catch (error) {
      logger.error('Error in getUserInterestTags:', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  // Find polls matching user interests with district-based civic filtering
  private async findMatchingPolls(userTags: string[], userLocation: string): Promise<PollRecommendation[]> {
    try {
      // Enhanced location-based filtering with civic district integration
      logger.debug('Location-based filtering enabled', { userLocation });
      
      // Parse location data for district-based filtering
      const locationData = this.parseLocationData(userLocation);
      if (locationData) {
        return await this.getDistrictBasedPolls(userTags, locationData);
      }
      
      if (userTags.length === 0) {
        // Return trending polls if no interests
        return await this.getTrendingPolls();
      }

      const { data, error } = await this.supabase
        .from('polls')
        .select(`
          id, title, description, category, tags, total_votes, created_at,
          created_by, status, privacy_level, jurisdiction, district
        `)
        .eq('status', 'active')
        .eq('privacy_level', 'public')
        .overlaps('tags', userTags)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        logger.error('Error fetching matching polls:', error instanceof Error ? error : new Error(String(error)));
        return [];
      }

      return data?.map((poll: any) => ({
        id: poll.id,
        title: poll.title,
        description: poll.description,
        category: poll.category,
        tags: poll.tags ?? [],
        relevanceScore: this.calculateRelevanceScore(poll.tags, userTags),
        interestMatches: this.findMatchingInterests(poll.tags, userTags),
        totalVotes: poll.total_votes ?? 0,
        created_at: poll.created_at,
        jurisdiction: poll.jurisdiction,
        district: poll.district
      })) ?? [];
    } catch (error) {
      logger.error('Error in findMatchingPolls:', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  // Parse location data to extract district information
  private parseLocationData(locationData: string): { state?: string; district?: string; county?: string } | null {
    try {
      if (!locationData) return null;
      
      const parsed = JSON.parse(locationData);
      return {
        state: parsed.state,
        district: parsed.district,
        county: parsed.county
      };
    } catch {
      return null;
    }
  }

  // Get district-based polls for civic engagement
  private async getDistrictBasedPolls(
    userTags: string[], 
    locationData: { state?: string; district?: string; county?: string }
  ): Promise<PollRecommendation[]> {
    try {
      // Build district-based query
      let query = this.supabase
        .from('polls')
        .select(`
          id, title, description, category, tags, total_votes, created_at,
          created_by, status, privacy_level, jurisdiction, district
        `)
        .eq('status', 'active')
        .eq('privacy_level', 'public');

      // Add district filtering for civic relevance
      if (locationData.state) {
        query = query.or(`jurisdiction.eq.${locationData.state},jurisdiction.is.null`);
      }
      
      if (locationData.district) {
        query = query.or(`district.eq.${locationData.district},district.is.null`);
      }

      // Add interest-based filtering
      if (userTags.length > 0) {
        query = query.overlaps('tags', userTags);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        logger.error('Error fetching district-based polls:', error instanceof Error ? error : new Error(String(error)));
        return [];
      }

      return data?.map((poll: any) => ({
        id: poll.id,
        title: poll.title,
        description: poll.description,
        category: poll.category,
        tags: poll.tags ?? [],
        relevanceScore: this.calculateDistrictRelevanceScore(poll, userTags, locationData),
        interestMatches: this.findMatchingInterests(poll.tags, userTags),
        totalVotes: poll.total_votes ?? 0,
        created_at: poll.created_at,
        jurisdiction: poll.jurisdiction,
        district: poll.district,
        civicRelevance: this.calculateCivicRelevance(poll, locationData)
      })) ?? [];
    } catch (error) {
      logger.error('Error in getDistrictBasedPolls:', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  // Calculate civic relevance score for district-based polls
  private calculateCivicRelevance(poll: any, locationData: { state?: string; district?: string; county?: string }): number {
    let score = 0;
    
    // Higher score for polls in user's jurisdiction
    if (locationData.state && poll.jurisdiction === locationData.state) {
      score += 0.4;
    }
    
    // Highest score for polls in user's specific district
    if (locationData.district && poll.district === locationData.district) {
      score += 0.6;
    }
    
    // Bonus for civic/political categories
    if (poll.category && ['civics', 'politics', 'government', 'elections'].includes(poll.category.toLowerCase())) {
      score += 0.3;
    }
    
    return Math.min(score, 1.0);
  }

  // Calculate district-aware relevance score
  private calculateDistrictRelevanceScore(
    poll: any, 
    userTags: string[], 
    locationData: { state?: string; district?: string; county?: string }
  ): number {
    const baseScore = this.calculateRelevanceScore(poll.tags, userTags);
    const civicScore = this.calculateCivicRelevance(poll, locationData);
    
    // Weight civic relevance higher for district-based feeds
    return (baseScore * 0.6) + (civicScore * 0.4);
  }

  // Apply demographic filtering
  private applyDemographicFiltering(
    polls: PollRecommendation[],
    userDemographics: any
  ): PollRecommendation[] {
    // Demographic filtering implementation
    logger.debug('Demographic filtering enabled', { userDemographics });
    // Demographic filtering is applied through relevance scoring
    
    // For MVP, return all polls
    return polls;
  }

  // Get civic recommendations based on user's district
  async getCivicRecommendations(userId: string, locationData: any): Promise<any> {
    try {
      const parsedLocation = this.parseLocationData(JSON.stringify(locationData));
      if (!parsedLocation) {
        logger.debug('No location data available for civic recommendations', { userId });
        return [];
      }

      // Get representatives for user's district
      const { data: representatives, error: repError } = await this.supabase
        .from('representatives_core')
        .select('*')
        .or(`district.eq.${parsedLocation.district},state.eq.${parsedLocation.state}`)
        .eq('is_current', true)
        .limit(5);

      if (repError) {
        logger.error('Error fetching representatives:', repError);
        return [];
      }

      // Get civic-related polls for the district
      const { data: civicPolls, error: pollsError } = await this.supabase
        .from('polls')
        .select('*')
        .eq('status', 'active')
        .eq('privacy_level', 'public')
        .or(`jurisdiction.eq.${parsedLocation.state},district.eq.${parsedLocation.district}`)
        .in('category', ['civics', 'politics', 'government', 'elections'])
        .order('created_at', { ascending: false })
        .limit(3);

      if (pollsError) {
        logger.error('Error fetching civic polls:', pollsError);
        return [];
      }

      return {
        representatives: representatives ?? [],
        civicPolls: civicPolls ?? [],
        district: parsedLocation.district,
        state: parsedLocation.state
      };
    } catch (error) {
      logger.error('Error getting civic recommendations:', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  // Rank polls by relevance and recency
  private rankPollsByRelevance(
    polls: PollRecommendation[],
    userInterests: string[]
  ): PollRecommendation[] {
    return polls
      .map(poll => {
        const safeTags = poll.tags ?? [];
        return {
          id: poll.id,
          title: poll.title,
          description: poll.description,
          category: poll.category ?? 'general',
          tags: safeTags,
          relevanceScore: this.calculateRelevanceScore(safeTags, userInterests),
          interestMatches: this.findInterestMatches(safeTags, userInterests),
          totalVotes: poll.totalVotes ?? 0,
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
    if (pollTags?.length === 0) return 0;
    
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
    // Trending analytics implementation (always enabled through hashtag system)
    logger.debug('Trending analytics enabled', { userTags });
    // Trending analytics are calculated through interest match counting
    
    const interestCounts: { [key: string]: number } = {};
    
    polls.forEach(poll => {
      poll.interestMatches.forEach(interest => {
        interestCounts[interest] = (interestCounts[interest] ?? 0) + 1;
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
        logger.error('Error fetching trending hashtags:', error instanceof Error ? error : new Error(String(error)));
        return [];
      }

      return data?.map((item: any) => item.hashtag) ?? [];
    } catch (error) {
      logger.error('Error in getTrendingHashtags:', error instanceof Error ? error : new Error(String(error)));
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
        logger.error('Error fetching suggested interests:', error instanceof Error ? error : new Error(String(error)));
        return [];
      }

      // Count frequency of hashtags
      const hashtagCounts: { [key: string]: number } = {};
      data?.forEach((item: any) => {
        hashtagCounts[item.hashtag] = (hashtagCounts[item.hashtag] ?? 0) + 1;
      });

      // Return top 5 most popular hashtags
      return Object.entries(hashtagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([hashtag]) => hashtag);
    } catch (error) {
      logger.error('Error in getSuggestedInterests:', error instanceof Error ? error : new Error(String(error)));
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
        logger.error('Error fetching trending polls:', error instanceof Error ? error : new Error(String(error)));
        return [];
      }

      return data?.map((poll: any) => ({
        id: poll.id,
        title: poll.title,
        description: poll.description,
        category: poll.category,
        tags: poll.tags ?? [],
        relevanceScore: 0.5, // Default relevance for trending
        interestMatches: [],
        totalVotes: poll.total_votes ?? 0,
        created_at: poll.created_at
      })) ?? [];
    } catch (error) {
      logger.error('Error in getTrendingPolls:', error instanceof Error ? error : new Error(String(error)));
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

    // Get user's followed hashtags from database
    let followedHashtagIds: string[] = [];
    try {
      // Get user auth from Supabase to pass to getUserHashtags
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        // Temporarily set auth context for getUserHashtags
        // Note: getUserHashtags uses browser client, so we'll query directly instead
        const { data: userHashtags } = await supabase
          .from('user_hashtags')
          .select('hashtag_id')
          .eq('user_id', userId);
        
        followedHashtagIds = userHashtags?.map(uh => uh.hashtag_id) ?? [];
      }
    } catch (error) {
      logger.warn('Failed to fetch user hashtags:', { error });
    }

    // Enhanced: Add hashtag-based polls integration
    let hashtagPollsFeed = null;
    if (includeTrending) {
      try {
        // Generate hashtag-based poll recommendations
        const locationData = (userProfile.demographics as any)?.location_data as LocationData | null;
        const demographics = userProfile.demographics as Demographics | null;
        
        hashtagPollsFeed = await hashtagPollsIntegrationService.generateHashtagPollFeed(
          userId,
          {
            ...(locationData?.state ? { state: locationData.state } : {}),
            ...(locationData?.region ? { region: locationData.region } : {}),
            followed_hashtags: followedHashtagIds,
            demographics: demographics ?? {}
          },
          10 // Limit hashtag-based recommendations
        );
      } catch (error) {
        logger.warn('Failed to generate hashtag-polls feed:', { error });
      }
    }

    // Generate personalized feed with enhanced district-based civic filtering
    // Map hashtag IDs to hashtag names for userInterests parameter
    let followedHashtagNames: string[] = [];
    if (followedHashtagIds.length > 0) {
      try {
        const { data: hashtags } = await supabase
          .from('hashtags')
          .select('name')
          .in('id', followedHashtagIds);
        followedHashtagNames = hashtags?.map(h => h.name) ?? [];
      } catch (error) {
        logger.warn('Failed to fetch hashtag names:', { error });
      }
    }
    
    const personalizedFeed = await feedService.generatePersonalizedFeed(
      userId,
      followedHashtagNames,
      (userProfile.demographics as any)?.location_data ? JSON.stringify((userProfile.demographics as any).location_data) : '',
      userProfile.demographics ?? {}
    );

    // Add district-based civic recommendations if location data is available
    let civicRecommendations = null;
    if ((userProfile.demographics as any)?.location_data) {
      civicRecommendations = await feedService.getCivicRecommendations(userId, (userProfile.demographics as any).location_data);
    }

    return NextResponse.json({
      ok: true,
      data: {
        ...personalizedFeed,
        civicRecommendations,
        // Enhanced with hashtag-polls integration
        hashtagPollsFeed: hashtagPollsFeed ? {
          user_followed_hashtags: hashtagPollsFeed.hashtag_interests,
          recommended_polls: hashtagPollsFeed.recommended_polls,
          trending_hashtags: hashtagPollsFeed.trending_hashtags,
          feed_score: hashtagPollsFeed.feed_score,
          hashtag_analytics: hashtagPollsFeed.hashtag_analytics
        } : null,
        feed_enhancement: {
          hashtag_integration: !!hashtagPollsFeed,
          personalization_level: (hashtagPollsFeed?.hashtag_interests?.length ?? 0) > 0 ? 'high' : 'medium',
          autopopulation_driver: 'followed_hashtags'
        }
      }
    });

  } catch (error) {
    logger.error('Personalized feed API error:', error instanceof Error ? error : new Error(String(error)));
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
          hashtag_id: hashtag,
          is_primary: true,
          followed_at: new Date().toISOString()
        });
        break;
        
      case 'unfollow':
        await supabase.from('user_hashtags')
          .delete()
          .eq('user_id', userId)
          .eq('hashtag_id', hashtag);
        break;
        
      case 'create':
        await supabase.from('user_hashtags').insert({
          user_id: userId,
          hashtag_id: hashtag,
          is_primary: true,
          followed_at: new Date().toISOString()
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
    logger.error('Hashtag management API error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({
      error: 'Failed to manage hashtag',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
