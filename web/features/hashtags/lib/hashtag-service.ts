/**
 * Hashtag Service
 * 
 * Core service layer for hashtag operations including CRUD, search, trending,
 * analytics, and cross-feature integration
 * 
 * Created: December 19, 2024
 * Updated: October 11, 2025
 * Status: ✅ ACTIVE
 */

import { logger } from '@/lib/utils/logger';

import { createClient } from '../../../utils/supabase/client';
import type {
  Hashtag,
  HashtagSuggestion,
  HashtagValidation,
  HashtagCategory,
  UserHashtag,
  TrendingHashtag,
  HashtagSearchQuery,
  HashtagSearchResult,
  HashtagAnalytics,
  HashtagApiResponse,
  HashtagStatsResponse,
  HashtagUserPreferences,
  ProfileHashtagIntegration,
  PollHashtagIntegration,
  FeedHashtagIntegration
} from '../types';

const supabase = createClient();

// ============================================================================
// CORE HASHTAG OPERATIONS
// ============================================================================

/**
 * Get hashtag by ID
 */
export async function getHashtagById(id: string): Promise<HashtagApiResponse<Hashtag>> {
  try {
    const result = await supabase
      .from('hashtags')
      .select('*')
      .eq('id', id)
      .single();
    
    const { data, error } = result;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch hashtag' 
    };
  }
}

/**
 * Get hashtag by name
 */
export async function getHashtagByName(name: string): Promise<HashtagApiResponse<Hashtag>> {
  try {
    const normalizedName = name.toLowerCase().replace(/^#/, '');
    
    const result = await supabase
      .from('hashtags')
      .select('*')
      .eq('name', normalizedName)
      .single();
    
    const { data, error } = result;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch hashtag' 
    };
  }
}

/**
 * Create new hashtag
 */
export async function createHashtag(
  name: string, 
  description?: string,
  category?: HashtagCategory
): Promise<HashtagApiResponse<Hashtag>> {
  try {
    const normalizedName = name.toLowerCase().replace(/^#/, '');
    
    // Check if hashtag already exists
    const existing = await getHashtagByName(normalizedName);
    if (existing.success && existing.data) {
      return { success: false, error: 'Hashtag already exists' };
    }

    const result = await supabase
      .from('hashtags')
      .insert({
        name: normalizedName,
        display_name: name,
        description,
        category,
        usage_count: 0,
        follower_count: 0,
        is_trending: false,
        trend_score: 0,
        is_verified: false,
        is_featured: false
      })
      .select()
      .single();
    
    const { data, error } = result;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create hashtag' 
    };
  }
}

/**
 * Update hashtag
 */
export async function updateHashtag(
  id: string, 
  updates: Partial<Hashtag>
): Promise<HashtagApiResponse<Hashtag>> {
  try {
    const result = await supabase
      .from('hashtags')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    const { data, error } = result;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update hashtag' 
    };
  }
}

/**
 * Delete hashtag
 */
export async function deleteHashtag(id: string): Promise<HashtagApiResponse<boolean>> {
  try {
    const { error } = await supabase
      .from('hashtags')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete hashtag' 
    };
  }
}

// ============================================================================
// HASHTAG SEARCH AND DISCOVERY
// ============================================================================

/**
 * Search hashtags
 */
export async function searchHashtags(query: HashtagSearchQuery): Promise<HashtagApiResponse<HashtagSearchResult>> {
  try {
    const startTime = Date.now();
    let supabaseQuery = supabase
      .from('hashtags')
      .select('*');

    // Apply text search
    if (query.query) {
      supabaseQuery = supabaseQuery.or(`name.ilike.%${query.query}%,display_name.ilike.%${query.query}%,description.ilike.%${query.query}%`);
    }

    // Apply filters
    if (query.filters) {
      if (query.filters.category) {
        supabaseQuery = supabaseQuery.eq('category', query.filters.category);
      }
      if (query.filters.is_trending !== undefined) {
        supabaseQuery = supabaseQuery.eq('is_trending', query.filters.is_trending);
      }
      if (query.filters.is_verified !== undefined) {
        supabaseQuery = supabaseQuery.eq('is_verified', query.filters.is_verified);
      }
      if (query.filters.min_usage_count !== undefined) {
        supabaseQuery = supabaseQuery.gte('usage_count', query.filters.min_usage_count);
      }
      if (query.filters.created_after) {
        supabaseQuery = supabaseQuery.gte('created_at', query.filters.created_after);
      }
      if (query.filters.created_before) {
        supabaseQuery = supabaseQuery.lte('created_at', query.filters.created_before);
      }
    }

    // Apply sorting
    const sortField = query.sort ?? 'relevance';
    switch (sortField) {
      case 'usage':
        supabaseQuery = supabaseQuery.order('usage_count', { ascending: false });
        break;
      case 'trending':
        supabaseQuery = supabaseQuery.order('trend_score', { ascending: false });
        break;
      case 'alphabetical':
        supabaseQuery = supabaseQuery.order('name', { ascending: true });
        break;
      case 'created':
        supabaseQuery = supabaseQuery.order('created_at', { ascending: false });
        break;
      default:
        supabaseQuery = supabaseQuery.order('usage_count', { ascending: false });
    }

    // Apply pagination
    const limit = query.limit || 20;
    const offset = query.offset || 0;
    supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

    const { data: hashtags, error, count } = await supabaseQuery;

    if (error) {
      return { success: false, error: error.message };
    }

    const result: HashtagSearchResult = {
      hashtags: hashtags || [],
      total_count: count || 0,
      suggestions: generateSuggestions(query.query, hashtags || []),
      related_queries: await generateRelatedQueries(query.query),
      filters_applied: query.filters || {},
      search_time_ms: Date.now() - startTime
    };

    return { success: true, data: result };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to search hashtags' 
    };
  }
}

/**
 * Get trending hashtags
 */
export async function getTrendingHashtags(
  category?: HashtagCategory,
  limit = 20
): Promise<HashtagApiResponse<TrendingHashtag[]>> {
  try {
    let supabaseQuery = supabase
      .from('hashtags')
      .select('*')
      .eq('is_trending', true)
      .order('trend_score', { ascending: false })
      .limit(limit);

    if (category) {
      supabaseQuery = supabaseQuery.eq('category', category);
    }

    const { data: hashtags, error } = await supabaseQuery;

    if (error) {
      return { success: false, error: error.message };
    }

    // Transform to trending hashtags with additional metrics
    const trendingHashtags: TrendingHashtag[] = await Promise.all((hashtags || []).map(async hashtag => ({
      hashtag,
      trend_score: hashtag.trend_score,
      growth_rate: await calculateGrowthRate(hashtag),
      usage_count_24h: await calculateUsage24h(hashtag),
      usage_count_7d: await calculateUsage7d(hashtag),
      peak_position: await calculatePeakPosition(hashtag.id),
      current_position: await calculateCurrentPosition(hashtag.id),
      related_hashtags: await calculateRelatedHashtags(hashtag.id),
      trending_since: hashtag.created_at,
      category_trends: await calculateCategoryTrends(hashtag.category)
    })));

    return { success: true, data: trendingHashtags };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch trending hashtags' 
    };
  }
}

/**
 * Get hashtag suggestions
 */
export async function getHashtagSuggestions(
  input: string,
  context?: string,
  limit = 10
): Promise<HashtagApiResponse<HashtagSuggestion[]>> {
  try {
    const normalizedInput = input.toLowerCase().replace(/^#/, '');
    
    // Search for matching hashtags
    const { data: hashtags, error } = await supabase
      .from('hashtags')
      .select('*')
      .or(`name.ilike.%${normalizedInput}%,display_name.ilike.%${normalizedInput}%`)
      .order('usage_count', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    const suggestions: HashtagSuggestion[] = (hashtags || []).map(hashtag => ({
      hashtag,
      reason: determineSuggestionReason(hashtag, input),
      confidence: calculateConfidenceScore(hashtag, input),
      confidence_score: calculateConfidenceScore(hashtag, input),
      source: 'search' as const,
      ...(context && { context })
    }));

    return { success: true, data: suggestions };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch hashtag suggestions' 
    };
  }
}

// ============================================================================
// USER HASHTAG INTERACTIONS
// ============================================================================

/**
 * Follow hashtag
 */
export async function followHashtag(hashtagId: string): Promise<HashtagApiResponse<UserHashtag>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Check if already following
    const { data: existing } = await supabase
      .from('user_hashtags')
      .select('*')
      .eq('user_id', user.id)
      .eq('hashtag_id', hashtagId)
      .single();

    if (existing) {
      return { success: false, error: 'Already following this hashtag' };
    }

    const { data, error } = await supabase
      .from('user_hashtags')
      .insert({
        user_id: user.id,
        hashtag_id: hashtagId,
        followed_at: new Date().toISOString(),
        is_primary: false,
        usage_count: 0
      })
      .select(`
        *,
        hashtag:hashtags(*)
      `)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Update follower count
    await supabase.rpc('increment_hashtag_follower_count', { hashtag_id: hashtagId });

    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to follow hashtag' 
    };
  }
}

/**
 * Unfollow hashtag
 */
export async function unfollowHashtag(hashtagId: string): Promise<HashtagApiResponse<boolean>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('user_hashtags')
      .delete()
      .eq('user_id', user.id)
      .eq('hashtag_id', hashtagId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Update follower count
    await supabase.rpc('decrement_hashtag_follower_count', { hashtag_id: hashtagId });

    return { success: true, data: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to unfollow hashtag' 
    };
  }
}

/**
 * Get user's followed hashtags
 */
export async function getUserHashtags(): Promise<HashtagApiResponse<UserHashtag[]>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('user_hashtags')
      .select(`
        *,
        hashtag:hashtags(*)
      `)
      .eq('user_id', user.id)
      .order('followed_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch user hashtags' 
    };
  }
}

// ============================================================================
// HASHTAG ANALYTICS AND INSIGHTS
// ============================================================================

/**
 * Get hashtag analytics
 */
export async function getHashtagAnalytics(
  hashtagId: string,
  period: '24h' | '7d' | '30d' | '90d' | '1y' = '7d'
): Promise<HashtagApiResponse<HashtagAnalytics>> {
  try {
    // Import the analytics function from hashtag-analytics.ts
    const { calculateHashtagAnalytics } = await import('./hashtag-analytics');
    const analytics = await calculateHashtagAnalytics(hashtagId, period);

    return { success: true, data: analytics };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch hashtag analytics' 
    };
  }
}

/**
 * Get hashtag stats
 */
export async function getHashtagStats(): Promise<HashtagApiResponse<HashtagStatsResponse>> {
  try {
    const { data: stats, error } = await supabase
      .from('hashtags')
      .select('*')
      .order('usage_count', { ascending: false })
      .limit(100);

    if (error) {
      return { success: false, error: error.message };
    }

    const statsResponse: HashtagStatsResponse = {
      total_hashtags: stats?.length || 0,
      trending_count: stats?.filter(s => s.is_trending).length || 0,
      verified_count: stats?.filter(s => s.is_verified).length || 0,
      categories: {} as Record<HashtagCategory, number>,
      top_hashtags: stats?.slice(0, 10) as Hashtag[] || [],
      recent_activity: await getRecentActivity(),
      system_health: {
        api_response_time: 0,
        database_performance: 0,
        cache_hit_rate: 0
      }
    };

    return { success: true, data: statsResponse };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch hashtag stats' 
    };
  }
}

// ============================================================================
// HASHTAG VALIDATION
// ============================================================================

/**
 * Validate hashtag name
 */
export async function validateHashtagName(name: string): Promise<HashtagApiResponse<HashtagValidation>> {
  try {
    const normalizedName = name.toLowerCase().replace(/^#/, '');
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Basic validation
    if (!normalizedName || normalizedName.length < 2) {
      errors.push('Hashtag must be at least 2 characters long');
    }

    if (normalizedName.length > 50) {
      errors.push('Hashtag must be less than 50 characters');
    }

    if (!/^[a-z0-9_]+$/.test(normalizedName)) {
      errors.push('Hashtag can only contain letters, numbers, and underscores');
    }

    // Check availability
    const existing = await getHashtagByName(normalizedName);
    const _isAvailable = !existing.success || !existing.data;

    const validation: HashtagValidation = {
      name: normalizedName,
      is_valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      normalized_name: normalizedName,
      availability: {
        is_available: errors.length === 0,
        similar_hashtags: [],
        conflict_reason: errors.length > 0 ? errors[0] : undefined
      }
    };

    return { success: true, data: validation };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to validate hashtag' 
    };
  }
}

// ============================================================================
// CROSS-FEATURE INTEGRATION
// ============================================================================

/**
 * Get profile hashtag integration
 */
export async function getProfileHashtagIntegration(userId: string): Promise<HashtagApiResponse<ProfileHashtagIntegration>> {
  try {
    // Get user's followed hashtags
    const { data: userHashtags, error: userHashtagsError } = await supabase
      .from('user_hashtags')
      .select('*, hashtag:hashtags(*)')
      .eq('user_id', userId);

    if (userHashtagsError) throw userHashtagsError;

    // Get user's hashtag preferences
    const { data: preferences, error: preferencesError } = await supabase
      .from('hashtag_user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (preferencesError) throw preferencesError;

    // Get user's hashtag activity
    const { data: activity, error: activityError } = await supabase
      .from('hashtag_engagement')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(50);

    if (activityError) throw activityError;

    const integration: ProfileHashtagIntegration = {
      user_id: userId,
      primary_hashtags: userHashtags?.filter(uh => uh.is_primary).map(uh => uh.hashtag.name) || [],
      interest_hashtags: userHashtags?.filter(uh => !uh.is_primary).map(uh => uh.hashtag.name) || [],
      custom_hashtags: await getUserCustomHashtags(userId),
      followed_hashtags: userHashtags?.map(uh => uh.hashtag.name) || [],
      hashtag_preferences: preferences || {} as HashtagUserPreferences,
      hashtag_activity: activity || [],
      last_updated: new Date().toISOString()
    };

    return { success: true, data: integration };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch profile hashtag integration' 
    };
  }
}

/**
 * Get poll hashtag integration
 */
export async function getPollHashtagIntegration(pollId: string): Promise<HashtagApiResponse<PollHashtagIntegration>> {
  try {
    // Get poll details with hashtags
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('hashtags, primary_hashtag, total_views')
      .eq('id', pollId)
      .single();

    if (pollError) throw pollError;

    // Get hashtag engagement data
    const { data: engagement, error: engagementError } = await supabase
      .from('hashtag_engagement')
      .select('engagement_type')
      .eq('content_id', pollId)
      .eq('content_type', 'poll');

    if (engagementError) throw engagementError;

    // Get related polls
    const { data: relatedPolls, error: relatedError } = await supabase
      .from('polls')
      .select('id')
      .overlaps('hashtags', poll.hashtags || [])
      .neq('id', pollId)
      .limit(10);

    if (relatedError) throw relatedError;

    // Calculate trending score
    const trendingScore = poll.hashtags?.length ? poll.hashtags.length * 10 : 0;

    const integration: PollHashtagIntegration = {
      poll_id: pollId,
      hashtags: poll.hashtags || [],
      primary_hashtag: poll.primary_hashtag,
      hashtag_engagement: {
        total_views: poll.total_views || 0,
        hashtag_clicks: engagement?.filter(e => e.engagement_type === 'click').length || 0,
        hashtag_shares: engagement?.filter(e => e.engagement_type === 'share').length || 0
      },
      related_polls: relatedPolls?.map(p => p.id) || [],
      hashtag_trending_score: trendingScore
    };

    return { success: true, data: integration };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch poll hashtag integration' 
    };
  }
}

/**
 * Get feed hashtag integration
 */
export async function getFeedHashtagIntegration(feedId: string): Promise<HashtagApiResponse<FeedHashtagIntegration>> {
  try {
    // Get feed details
    const { data: feed, error: feedError } = await supabase
      .from('feeds')
      .select('hashtag_filters, user_id')
      .eq('id', feedId)
      .single();

    if (feedError) throw feedError;

    // Get trending hashtags
    const { data: trendingHashtags, error: trendingError } = await supabase
      .from('hashtags')
      .select('name')
      .eq('is_trending', true)
      .order('trend_score', { ascending: false })
      .limit(10);

    if (trendingError) throw trendingError;

    // Get hashtag content
    const { data: hashtagContent, error: contentError } = await supabase
      .from('hashtag_content')
      .select('*')
      .eq('feed_id', feedId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (contentError) throw contentError;

    // Get personalized hashtags for user
    const { data: personalizedHashtags, error: personalError } = await supabase
      .from('user_hashtags')
      .select('hashtag:hashtags(name)')
      .eq('user_id', feed.user_id)
      .order('usage_count', { ascending: false })
      .limit(10);

    if (personalError) throw personalError;

    // Get hashtag analytics
    const { data: analytics, error: analyticsError } = await supabase
      .from('hashtag_analytics')
      .select('*')
      .eq('feed_id', feedId)
      .single();

    if (analyticsError) throw analyticsError;

    const integration: FeedHashtagIntegration = {
      feed_id: feedId,
      hashtag_filters: feed.hashtag_filters || [],
      trending_hashtags: trendingHashtags?.map(h => h.name) || [],
      hashtag_content: hashtagContent || [],
      hashtag_analytics: analytics || {} as HashtagAnalytics,
      personalized_hashtags: personalizedHashtags?.map((uh: any) => uh.hashtag.name) || []
    };

    return { success: true, data: integration };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch feed hashtag integration' 
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateSuggestions(query: string, hashtags: Hashtag[]): string[] {
  if (!query || hashtags.length === 0) return [];
  
  return hashtags
    .slice(0, 5)
    .map(h => h.name)
    .filter(name => name.toLowerCase().includes(query.toLowerCase()));
}

async function generateRelatedQueries(query: string): Promise<string[]> {
  try {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    // Get hashtags that contain the query
    const { data: hashtags, error } = await supabase
      .from('hashtags')
      .select('name, usage_count')
      .ilike('name', `%${normalizedQuery}%`)
      .order('usage_count', { ascending: false })
      .limit(10);

    if (error) throw error;

    // Generate related queries based on hashtag names and usage patterns
    const relatedQueries: string[] = [];
    
    hashtags?.forEach(hashtag => {
      const name = hashtag.name;
      
      // Add the hashtag name itself
      if (name !== normalizedQuery) {
        relatedQueries.push(name);
      }
      
      // Add variations (remove # if present, add common suffixes)
      const baseName = name.replace('#', '');
      if (baseName !== normalizedQuery) {
        relatedQueries.push(baseName);
      }
      
      // Add common variations
      const variations = [
        `${baseName}2024`,
        `${baseName}2025`,
        `new${baseName}`,
        `latest${baseName}`,
        `${baseName}news`,
        `${baseName}update`
      ];
      
      variations.forEach(variation => {
        if (!relatedQueries.includes(variation) && relatedQueries.length < 10) {
          relatedQueries.push(variation);
        }
      });
    });

    // Remove duplicates and limit results
    return [...new Set(relatedQueries)].slice(0, 8);
  } catch (error) {
    console.error('Failed to generate related queries:', error);
    return [];
  }
}

async function calculateGrowthRate(hashtag: Hashtag): Promise<number> {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Get usage data for the last 7 days
    const { data: recentUsage, error: recentError } = await supabase
      .from('hashtag_usage')
      .select('id')
      .eq('hashtag_id', hashtag.id)
      .gte('created_at', sevenDaysAgo.toISOString())
      .lte('created_at', now.toISOString());

    if (recentError) throw recentError;

    // Get usage data for the previous 7 days
    const { data: previousUsage, error: previousError } = await supabase
      .from('hashtag_usage')
      .select('id')
      .eq('hashtag_id', hashtag.id)
      .gte('created_at', fourteenDaysAgo.toISOString())
      .lt('created_at', sevenDaysAgo.toISOString());

    if (previousError) throw previousError;

    const recentCount = recentUsage?.length || 0;
    const previousCount = previousUsage?.length || 0;

    // Calculate growth rate as percentage change
    if (previousCount === 0) {
      return recentCount > 0 ? 100 : 0; // 100% growth if no previous usage
    }

    const growthRate = ((recentCount - previousCount) / previousCount) * 100;
    return Math.round(growthRate * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error('Failed to calculate growth rate:', error);
    return 0;
  }
}

async function calculateUsage24h(hashtag: Hashtag): Promise<number> {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('hashtag_usage')
      .select('id')
      .eq('hashtag_id', hashtag.id)
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .lte('created_at', now.toISOString());

    if (error) throw error;

    return data?.length || 0;
  } catch (error) {
    console.error('Failed to calculate 24h usage:', error);
    return 0;
  }
}

async function calculateUsage7d(hashtag: Hashtag): Promise<number> {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('hashtag_usage')
      .select('id')
      .eq('hashtag_id', hashtag.id)
      .gte('created_at', sevenDaysAgo.toISOString())
      .lte('created_at', now.toISOString());

    if (error) throw error;

    return data?.length || 0;
  } catch (error) {
    console.error('Failed to calculate 7d usage:', error);
    return 0;
  }
}

function determineSuggestionReason(hashtag: Hashtag, input: string): 'trending' | 'related' | 'popular' | 'recent' | 'personal' {
  logger.info(`Determining suggestion reason for hashtag: ${hashtag.name}, input: ${input}`, { hashtagName: hashtag.name, input });
  if (hashtag.is_trending) return 'trending';
  if (hashtag.usage_count > 1000) return 'popular';
  return 'related';
}

function calculateConfidenceScore(hashtag: Hashtag, input: string): number {
  const normalizedInput = input.toLowerCase();
  const normalizedHashtag = hashtag.name.toLowerCase();
  
  // Exact match gets highest confidence
  if (normalizedHashtag === normalizedInput) return 1.0;
  
  // Starts with input gets high confidence
  if (normalizedHashtag.startsWith(normalizedInput)) return 0.9;
  
  // Contains input gets medium confidence
  if (normalizedHashtag.includes(normalizedInput)) return 0.7;
  
  // High usage hashtags get higher confidence
  if (hashtag.usage_count > 1000) return 0.6;
  if (hashtag.usage_count > 100) return 0.4;
  
  return 0.2;
}

/**
 * Get user's custom hashtags (user-created hashtags)
 */
async function getUserCustomHashtags(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('hashtags')
      .select('name')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return data?.map(h => h.name) || [];
  } catch (error) {
    console.error('Failed to get user custom hashtags:', error);
    return [];
  }
}

// ============================================================================
// ADDITIONAL CALCULATION FUNCTIONS
// ============================================================================

async function calculatePeakPosition(hashtagId: string): Promise<number> {
  try {
    // Get historical trending data
    const { data: historicalData, error } = await supabase
      .from('hashtag_trending_history')
      .select('position')
      .eq('hashtag_id', hashtagId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error || !historicalData?.length) return 1;

    // Find the best (lowest) position
    const positions = historicalData.map(d => d.position);
    return Math.min(...positions);
  } catch (error) {
    console.error('Failed to calculate peak position:', error);
    return 1;
  }
}

async function calculateCurrentPosition(hashtagId: string): Promise<number> {
  try {
    // Get current trending ranking
    const { data: currentRanking, error } = await supabase
      .from('hashtags')
      .select('id, trend_score')
      .eq('is_trending', true)
      .order('trend_score', { ascending: false });

    if (error || !currentRanking?.length) return 1;

    const position = currentRanking.findIndex(h => h.id === hashtagId);
    return position >= 0 ? position + 1 : 1;
  } catch (error) {
    console.error('Failed to calculate current position:', error);
    return 1;
  }
}

async function calculateRelatedHashtags(hashtagId: string): Promise<string[]> {
  try {
    // Get hashtag details
    const { data: hashtag, error: hashtagError } = await supabase
      .from('hashtags')
      .select('category')
      .eq('id', hashtagId)
      .single();

    if (hashtagError) return [];

    // Find related hashtags by category
    const { data: relatedHashtags, error: relatedError } = await supabase
      .from('hashtags')
      .select('name')
      .eq('category', hashtag.category)
      .neq('id', hashtagId)
      .order('usage_count', { ascending: false })
      .limit(5);

    if (relatedError) return [];

    return relatedHashtags?.map(h => h.name) || [];
  } catch (error) {
    console.error('Failed to calculate related hashtags:', error);
    return [];
  }
}

async function calculateCategoryTrends(category: string): Promise<Record<string, number>> {
  try {
    // Get category trending data
    const { data: categoryData, error } = await supabase
      .from('hashtags')
      .select('trend_score, usage_count')
      .eq('category', category)
      .eq('is_trending', true);

    if (error || !categoryData?.length) return {};

    const totalTrendScore = categoryData.reduce((sum, h) => sum + h.trend_score, 0);
    const totalUsage = categoryData.reduce((sum, h) => sum + h.usage_count, 0);

    return {
      total_trend_score: totalTrendScore,
      total_usage: totalUsage,
      trending_count: categoryData.length,
      average_trend_score: totalTrendScore / categoryData.length,
      average_usage: totalUsage / categoryData.length
    };
  } catch (error) {
    console.error('Failed to calculate category trends:', error);
    return {};
  }
}

async function getRecentActivity() {
  try {
    // Get recent hashtag usage activity
    const { data: recentUsage, error } = await supabase
      .from('hashtag_usage')
      .select('*, hashtag:hashtags(name), user:profiles(username)')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) return [];

    return recentUsage?.map(usage => ({
      id: usage.id,
      hashtag_id: usage.hashtag_id,
      hashtag: usage.hashtag,
      content_type: usage.content_type,
      content_id: usage.content_id,
      user_id: usage.user_id,
      created_at: usage.created_at,
      context: usage.context,
      sentiment: usage.sentiment,
      engagement_score: usage.engagement_score
    })) || [];
  } catch (error) {
    console.error('Failed to get recent activity:', error);
    return [];
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(preferences: Partial<HashtagUserPreferences>): Promise<HashtagApiResponse<HashtagUserPreferences>> {
  try {
    const { data, error } = await supabase
      .from('hashtag_user_preferences')
      .upsert(preferences)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update user preferences' 
    };
  }
}

/**
 * Get user preferences
 */
export async function getUserPreferences(): Promise<HashtagApiResponse<HashtagUserPreferences>> {
  try {
    const { data, error } = await supabase
      .from('hashtag_user_preferences')
      .select('*')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get user preferences' 
    };
  }
}
