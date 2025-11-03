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

// import { logger } from '@/lib/utils/logger';

// Temporary logger for development
import type { Database } from '@/types/database';

import { getSupabaseBrowserClient } from '../../../utils/supabase/client';
import type {
  Hashtag,
  HashtagSuggestion,
  HashtagCategory,
  UserHashtag,
  TrendingHashtag,
  HashtagSearchQuery,
  HashtagSearchResponse,
  HashtagEngagement,
  HashtagAnalytics,
  HashtagApiResponse
} from '../types';

const logger = {
  info: (message: string, context?: any) => console.log(`[INFO] ${message}`, context),
  error: (message: string, context?: any) => console.error(`[ERROR] ${message}`, context),
  warn: (message: string, context?: any) => console.warn(`[WARN] ${message}`, context)
};

// Database types
type HashtagRow = Database['public']['Tables']['hashtags']['Row'];
type _HashtagInsert = Database['public']['Tables']['hashtags']['Insert'];
type _HashtagUpdate = Database['public']['Tables']['hashtags']['Update'];

// JSON field types
export type HashtagMetadata = {
  source?: string;
  auto_generated?: boolean;
  moderation_notes?: string;
  [key: string]: unknown;
}

export type UserHashtagPreferences = {
  notifications?: boolean;
  auto_follow?: boolean;
  [key: string]: unknown;
}

export type HashtagActivity = {
  id: string;
  hashtag_id: string;
  hashtag: {
    id: string;
    name: string;
    display_name: string;
    usage_count: number;
    follower_count: number;
    is_trending: boolean;
    trend_score: number;
    created_at: string;
    updated_at: string;
    is_verified: boolean;
    is_featured: boolean;
  };
  content_type: 'poll' | 'comment' | 'profile' | 'feed';
  content_id: string;
  user_id: string;
  created_at: string;
}

// Helper function to transform database data to Hashtag type
function transformHashtagData(data: HashtagRow): Hashtag {
  return {
    id: String(data.id),
    name: String(data.name),
    display_name: String(data.name),
    description: undefined,
    category: 'general' as HashtagCategory,
    usage_count: 0,
    is_trending: false,
    is_verified: false,
    is_featured: false,
    follower_count: 0,
    trend_score: 0,
    created_at: String(data.created_at ?? new Date().toISOString()),
    updated_at: String(data.updated_at ?? new Date().toISOString()),
    created_by: undefined,
    metadata: {}
  };
}

const supabaseClientPromise = getSupabaseBrowserClient();

// ============================================================================
// CORE HASHTAG OPERATIONS
// ============================================================================

/**
 * Get hashtag by ID
 */
export async function getHashtagById(id: string): Promise<HashtagApiResponse<Hashtag>> {
  const supabase = await supabaseClientPromise;
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

    return { success: true, data: data ? transformHashtagData(data) : undefined };
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
  const supabase = await supabaseClientPromise;
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

    return { success: true, data: transformHashtagData(data) };
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
  const supabase = await supabaseClientPromise;
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

    return { success: true, data: transformHashtagData(data) };
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
  const supabase = await supabaseClientPromise;
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

    return { success: true, data: transformHashtagData(data) };
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
  const supabase = await supabaseClientPromise;
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
export async function searchHashtags(query: HashtagSearchQuery): Promise<HashtagApiResponse<HashtagSearchResponse>> {
  const supabase = await supabaseClientPromise;
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
    if (query.category) {
      supabaseQuery = supabaseQuery.eq('category', query.category);
    }

    // Apply sorting
    const sortField = query.sort_by ?? 'relevance';
    switch (sortField) {
      case 'popularity':
        supabaseQuery = supabaseQuery.order('usage_count', { ascending: false });
        break;
      case 'trending':
        supabaseQuery = supabaseQuery.order('trend_score', { ascending: false });
        break;
      case 'recent':
        supabaseQuery = supabaseQuery.order('created_at', { ascending: false });
        break;
      case 'relevance':
      default:
        supabaseQuery = supabaseQuery.order('usage_count', { ascending: false });
        break;
    }

    // Apply pagination
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

    const { data: hashtags, error, count } = await supabaseQuery;

    if (error) {
      return { success: false, error: error.message };
    }

    const result: HashtagSearchResponse = {
      hashtags: (hashtags ?? []).map(transformHashtagData),
      total_count: count ?? 0,
      suggestions: generateSuggestions(query.query, (hashtags ?? []).map(transformHashtagData)),
      related_queries: await generateRelatedQueries(query.query),
      filters_applied: {},
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
  const supabase = await supabaseClientPromise;
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

    // Get category trends metadata if category filter is applied
    let categoryMetadata: Record<string, number> | null = null;
    if (category) {
      try {
        categoryMetadata = await calculateCategoryTrends(category);
      } catch (error) {
        logger.warn('Failed to calculate category trends:', error);
      }
    }

    // Transform to trending hashtags with additional metrics
    const trendingHashtags: TrendingHashtag[] = await Promise.all((hashtags ?? []).map(async hashtag => {
      const transformedHashtag = transformHashtagData(hashtag);
      const trendingHashtag: TrendingHashtag = {
        hashtag: transformedHashtag,
        trend_score: hashtag.trending_score ?? 0,
        growth_rate: await calculateGrowthRate(transformedHashtag),
        peak_usage: await calculateUsage24h(transformedHashtag),
        time_period: '24h'
      };
      
      // Store additional metrics for internal use (not part of TrendingHashtag type)
      (trendingHashtag as any).usage_7d = await calculateUsage7d(transformedHashtag);
      (trendingHashtag as any).peak_position = await calculatePeakPosition(hashtag.id);
      (trendingHashtag as any).current_position = await calculateCurrentPosition(hashtag.id);
      
      // Add category context metadata if available
      if (categoryMetadata && category) {
        (trendingHashtag as any).categoryContext = {
          category,
          totalTrendScore: categoryMetadata.total_trend_score,
          totalUsage: categoryMetadata.total_usage,
          trendingCount: categoryMetadata.trending_count,
          averageTrendScore: categoryMetadata.average_trend_score,
          averageUsage: categoryMetadata.average_usage
        };
      }
      
      return trendingHashtag;
    }));

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
  const supabase = await supabaseClientPromise;
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

    // Get base suggestions
    const suggestions: HashtagSuggestion[] = (hashtags ?? []).map(hashtag => ({
      hashtag: transformHashtagData(hashtag),
      reason: determineSuggestionReason(transformHashtagData(hashtag), input),
      confidence: calculateConfidenceScore(transformHashtagData(hashtag), input),
      confidence_score: calculateConfidenceScore(transformHashtagData(hashtag), input),
      source: 'similar' as const,
      ...(context && { context })
    }));

    // Enhance suggestions with related hashtags for the first matching hashtag
    if (suggestions.length > 0 && suggestions[0].hashtag.id) {
      try {
        const relatedHashtagNames = await calculateRelatedHashtags(suggestions[0].hashtag.id);
        // Add related hashtags as additional suggestions if not already present
        if (relatedHashtagNames.length > 0) {
          const existingNames = new Set(suggestions.map(s => s.hashtag.name.toLowerCase()));
          for (const relatedName of relatedHashtagNames) {
            if (!existingNames.has(relatedName.toLowerCase()) && suggestions.length < limit) {
              // Fetch the related hashtag details
              const { data: relatedHashtag } = await supabase
                .from('hashtags')
                .select('*')
                .eq('name', relatedName)
                .single();
              
              if (relatedHashtag) {
                suggestions.push({
                  hashtag: transformHashtagData(relatedHashtag),
                  reason: 'related',
                  confidence: 0.7,
                  confidence_score: 0.7,
                  source: 'similar' as const, // Use 'similar' as closest match to 'related'
                  ...(context && { context })
                });
              }
            }
          }
        }
      } catch (error) {
        logger.warn('Failed to fetch related hashtags for suggestions:', error);
        // Continue without related hashtags if there's an error
      }
    }

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
  const supabase = await supabaseClientPromise;
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

    // Update follower count manually
    const { data: currentHashtag } = await supabase
      .from('hashtags')
      .select('follower_count')
      .eq('id', hashtagId)
      .single();
    
    if (currentHashtag) {
      await supabase
        .from('hashtags')
        .update({ follower_count: (currentHashtag.follower_count ?? 0) + 1 })
        .eq('id', hashtagId);
    }

    return { success: true, data: {
      ...data,
      hashtag: transformHashtagData(data.hashtag),
      followed_at: data.followed_at ?? new Date().toISOString(),
      is_primary: data.is_primary ?? false,
      usage_count: data.usage_count ?? 0,
      last_used_at: data.last_used_at ?? new Date().toISOString(),
      preferences: data.preferences ?? {}
    } as unknown as UserHashtag };
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
  const supabase = await supabaseClientPromise;
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

    // Update follower count manually
    const { data: currentHashtag } = await supabase
      .from('hashtags')
      .select('follower_count')
      .eq('id', hashtagId)
      .single();
    
    if (currentHashtag) {
      await supabase
        .from('hashtags')
        .update({ follower_count: Math.max((currentHashtag.follower_count ?? 0) - 1, 0) })
        .eq('id', hashtagId);
    }

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
  const supabase = await supabaseClientPromise;
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

    return { success: true, data: (data ?? []).map(item => ({
      ...item,
      hashtag: transformHashtagData(item.hashtag),
      followed_at: item.followed_at ?? new Date().toISOString(),
      is_primary: item.is_primary ?? false,
      usage_count: item.usage_count ?? 0,
      last_used_at: item.last_used_at ?? new Date().toISOString(),
      preferences: item.preferences ?? {}
    } as unknown as UserHashtag)) };
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
  const _supabase = await supabaseClientPromise; // kept for parity if needed later
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
export async function getHashtagStats(): Promise<HashtagApiResponse<any>> {
  const supabase = await supabaseClientPromise;
  try {
    const { data: stats, error } = await supabase
      .from('hashtags')
      .select('*')
      .order('usage_count', { ascending: false })
      .limit(100);

    if (error) {
      return { success: false, error: error.message };
    }

    const statsResponse = {
      total_hashtags: stats?.length ?? 0,
      trending_count: stats?.filter(s => s.is_trending).length ?? 0,
      verified_count: stats?.filter(s => s.is_verified).length ?? 0,
      categories: {} as Record<HashtagCategory, number>,
      top_hashtags: (stats?.slice(0, 10) as Hashtag[]) ?? [],
      recent_activity: await getRecentActivity() as HashtagActivity[],
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
export async function validateHashtagName(name: string): Promise<HashtagApiResponse<any>> {
  const _supabase = await supabaseClientPromise; // ensure client ready for potential calls
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

    const validation = {
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
export async function getProfileHashtagIntegration(userId: string): Promise<HashtagApiResponse<any>> {
  const supabase = await supabaseClientPromise;
  try {
    // Get user's followed hashtags
    const { data: userHashtags, error: userHashtagsError } = await supabase
      .from('user_hashtags')
      .select('*, hashtag:hashtags(*)')
      .eq('user_id', userId);

    if (userHashtagsError) throw userHashtagsError;

    // Get user's hashtag preferences from hashtag_user_preferences table
    let preferences, preferencesError;
    try {
      const result = await supabase
        .from('hashtag_user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
      preferences = result.data;
      preferencesError = result.error;
    } catch (tableError) {
      logger.warn('Error fetching user hashtag preferences', { tableError });
      preferences = null;
      preferencesError = tableError;
    }

    if (preferencesError) throw preferencesError;

    // Get user's hashtag activity from hashtag_engagement table
    let activity, activityError;
    try {
      const result = await supabase
        .from('hashtag_engagement')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(50);
      activity = result.data as HashtagActivity[] | null;
      activityError = result.error;
    } catch (tableError) {
      logger.warn('Error fetching hashtag engagement', { tableError });
      activity = null;
      activityError = tableError;
    }

    if (activityError) throw activityError;

    const integration = {
      user_id: userId,
      primary_hashtags: userHashtags?.filter(uh => uh.is_primary).map(uh => uh.hashtag.name) ?? [],
      interest_hashtags: userHashtags?.filter(uh => !uh.is_primary).map(uh => uh.hashtag.name) ?? [],
      custom_hashtags: await getUserCustomHashtags(userId),
      followed_hashtags: userHashtags?.map(uh => uh.hashtag.name) ?? [],
      hashtag_preferences: (preferences ?? {
        user_id: userId,
        default_categories: [],
        auto_follow_suggestions: false,
        trending_notifications: false,
        related_hashtag_suggestions: false,
        privacy_settings: {
          show_followed_hashtags: true,
          show_hashtag_activity: true,
          allow_hashtag_recommendations: true
        },
        notification_preferences: {
          new_trending_hashtags: false,
          hashtag_updates: false,
          related_content: true,
          weekly_digest: false
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }) as unknown as any,
      hashtag_activity: (activity ?? []) as unknown as HashtagEngagement[],
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
export async function getPollHashtagIntegration(pollId: string): Promise<HashtagApiResponse<any>> {
  const supabase = await supabaseClientPromise;
  try {
    // Get poll details with hashtags
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('hashtags, primary_hashtag, total_views')
      .eq('id', pollId)
      .single();

    if (pollError) throw pollError;

    // Get hashtag engagement data (fallback to hashtag_usage if table doesn't exist)
    let engagement, engagementError;
    try {
      const result = await supabase
        .from('hashtag_engagement')
        .select('engagement_type')
        .eq('content_id', pollId)
        .eq('content_type', 'poll');
      engagement = result.data;
      engagementError = result.error;
    } catch (tableError) {
      // Fallback to hashtag_usage table
      logger.warn('hashtag_engagement table not available, using hashtag_usage', { tableError });
      const result = await supabase
        .from('hashtag_usage')
        .select('*')
        .eq('content_id', pollId)
        .eq('content_type', 'poll');
      engagement = result.data;
      engagementError = result.error;
    }

    if (engagementError) throw engagementError;

    // Get related polls
    const { data: relatedPolls, error: relatedError } = await supabase
      .from('polls')
      .select('id')
      .overlaps('hashtags', poll.hashtags ?? [])
      .neq('id', pollId)
      .limit(10);

    if (relatedError) throw relatedError;

    // Calculate trending score
    const trendingScore = poll.hashtags?.length ? poll.hashtags.length * 10 : 0;

    const integration = {
      poll_id: pollId,
      hashtags: poll.hashtags ?? [],
      primary_hashtag: poll.primary_hashtag ?? undefined,
      hashtag_engagement: {
        total_views: poll.total_views ?? 0,
        hashtag_clicks: (engagement as unknown as HashtagEngagement[])?.filter(e => e.action === 'click').length ?? 0,
        hashtag_shares: (engagement as unknown as HashtagEngagement[])?.filter(e => e.action === 'share').length ?? 0
      },
      related_polls: relatedPolls?.map(p => p.id) ?? [],
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
export async function getFeedHashtagIntegration(feedId: string): Promise<HashtagApiResponse<any>> {
  const supabase = await supabaseClientPromise;
  try {
    // Get feed details (fallback to user_profiles if feeds table doesn't exist)
    let feed, feedError;
    try {
      const result = await supabase
        .from('feeds')
        .select('hashtag_filters, user_id')
        .eq('id', feedId)
        .single();
      feed = result.data;
      feedError = result.error;
    } catch (tableError) {
      // Fallback to user_profiles table
      logger.warn('feeds table not available, using user_profiles', { tableError });
      const result = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', feedId)
        .single();
      const feedData = result.data as { hashtag_filters?: string[]; id: string } | null;
      feed = feedData ? {
        hashtag_filters: feedData.hashtag_filters ?? [],
        user_id: feedData.id
      } : null;
      feedError = result.error;
    }

    if (feedError) throw feedError;

    // Get trending hashtags
    const { data: trendingHashtags, error: trendingError } = await supabase
      .from('hashtags')
      .select('name')
      .eq('is_trending', true)
      .order('trend_score', { ascending: false })
      .limit(10);

    if (trendingError) throw trendingError;

    // Get hashtag content from feed_items table
    let hashtagContent, contentError;
    try {
      const result = await supabase
        .from('feed_items')
        .select('*')
        .eq('feed_id', feedId)
        .eq('item_type', 'hashtag')
        .order('created_at', { ascending: false })
        .limit(20);
      hashtagContent = result.data;
      contentError = result.error;
    } catch (tableError) {
      logger.warn('Error fetching feed items', { tableError });
      hashtagContent = null;
      contentError = tableError;
    }

    if (contentError) throw contentError;

    // Get personalized hashtags for user
    const { data: personalizedHashtags, error: personalError } = await supabase
      .from('user_hashtags')
      .select('hashtag:hashtags(name)')
      .eq('user_id', feed?.user_id ?? '')
      .order('usage_count', { ascending: false })
      .limit(10);

    if (personalError) throw personalError;

    // Get hashtag analytics using basic analytics (hashtag_analytics table doesn't exist)
    let analytics, analyticsError;
    try {
      analytics = {
        total_hashtags: hashtagContent?.length ?? 0,
        trending_count: trendingHashtags?.length ?? 0,
        engagement_rate: 0,
        last_updated: new Date().toISOString()
      };
      analyticsError = null;
    } catch (tableError) {
      logger.warn('Error calculating basic analytics', { tableError });
      analytics = null;
      analyticsError = tableError;
    }

    if (analyticsError) throw analyticsError;

    const integration = {
      feed_id: feedId,
      hashtag_filters: feed?.hashtag_filters ?? [],
      trending_hashtags: trendingHashtags?.map(h => h.name) ?? [],
      hashtag_content: (hashtagContent ?? []) as unknown as any[],
      hashtag_analytics: (analytics ?? {}) as unknown as HashtagAnalytics,
      personalized_hashtags: personalizedHashtags?.map((uh: any) => uh.hashtag.name) ?? []
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

function generateSuggestions(query: string, hashtags: Hashtag[]): HashtagSuggestion[] {
  if (!query || hashtags.length === 0) return [];
  
  return hashtags
    .slice(0, 5)
    .map(h => ({
      hashtag: h,
      reason: 'Similar to your search',
      confidence: 0.8,
      source: 'similar' as const
    }))
    .filter(suggestion => suggestion.hashtag.name.toLowerCase().includes(query.toLowerCase()));
}

async function generateRelatedQueries(query: string): Promise<string[]> {
  const supabase = await supabaseClientPromise;
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
  const supabase = await supabaseClientPromise;
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
  const supabase = await supabaseClientPromise;
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
  const supabase = await supabaseClientPromise;
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
  const supabase = await supabaseClientPromise;
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
  const supabase = await supabaseClientPromise;
  try {
    // Get historical trending data (fallback to hashtags table if history table doesn't exist)
    // Get hashtag trending history using RPC function
    let historicalData, error;
    try {
      const result = await supabase.rpc('get_hashtag_trending_history', { p_hashtag_id: hashtagId });
      historicalData = result.data;
      error = result.error;
    } catch (tableError) {
      // Fallback to hashtags table
      logger.warn('hashtag_trending_history function not available, using hashtags table', { tableError });
      const result = await supabase
        .from('hashtags')
        .select('trending_score')
        .eq('id', hashtagId)
        .single();
      historicalData = result.data ? [{ position_rank: Math.max(1, 100 - (result.data.trending_score || 0)) }] : [];
      error = result.error;
    }

    if (error || !historicalData?.length) return 1;

    // Find the best (lowest) position
    const positions = historicalData.map((d: any) => d.position_rank || 1);
    return Math.min(...positions);
  } catch (error) {
    console.error('Failed to calculate peak position:', error);
    return 1;
  }
}

async function calculateCurrentPosition(hashtagId: string): Promise<number> {
  const supabase = await supabaseClientPromise;
  try {
    // Get current trending ranking
    const { data: currentRanking, error } = await supabase
      .from('hashtags')
      .select('id, trending_score')
      .eq('is_trending', true)
      .order('trending_score', { ascending: false });

    if (error || !currentRanking?.length) return 1;

    const position = currentRanking.findIndex(h => h.id === hashtagId);
    return position >= 0 ? position + 1 : 1;
  } catch (error) {
    console.error('Failed to calculate current position:', error);
    return 1;
  }
}

/**
 * Calculate related hashtags for a given hashtag
 * 
 * Finds hashtags in the same category with high usage counts. Useful for:
 * - Hashtag suggestion systems (integrate with getHashtagSuggestions ENABLED_)
 * - Related hashtag displays on hashtag detail pages
 * - Recommendation engines
 * 
 * @param hashtagId - The ID of the hashtag to find related hashtags for
 * @returns Array of related hashtag names (up to 5, sorted by usage)
 * 
 * @example
 * ```ts
 * const related = await calculateRelatedHashtags('hashtag-id-123');
 * // Returns: ['#hashtag1', '#hashtag2', ...]
 * ```
 * 
 * Integrated into getHashtagSuggestions for enhanced related suggestions
 */
export async function calculateRelatedHashtags(hashtagId: string): Promise<string[]> {
  const supabase = await supabaseClientPromise;
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
      .eq('category', hashtag.category ?? 'general')
      .neq('id', hashtagId)
      .order('usage_count', { ascending: false })
      .limit(5);

    if (relatedError) return [];

    return relatedHashtags?.map(h => h.name) ?? [];
  } catch (error) {
    console.error('Failed to calculate related hashtags:', error);
    return [];
  }
}

/**
 * Calculate category trends metrics
 * 
 * Provides aggregate statistics for trending hashtags within a category. Useful for:
 * - Category-based trending displays (getTrendingHashtags with category filter)
 * - Category analytics dashboards
 * - Performance benchmarking (getHashtagPerformanceInsights)
 * 
 * @param category - The category to analyze
 * @returns Object with category trend metrics:
 *   - total_trend_score: Sum of all trending scores in category
 *   - total_usage: Sum of all usage counts in category  
 *   - trending_count: Number of trending hashtags in category
 *   - average_trend_score: Average trending score
 *   - average_usage: Average usage count
 * 
 * @example
 * ```ts
 * const trends = await calculateCategoryTrends('politics');
 * // Returns: { total_trend_score: 1250, total_usage: 5000, trending_count: 15, ... }
 * ```
 * 
 * Integrated into getTrendingHashtags when category filter is applied for category context metadata
 */
export async function calculateCategoryTrends(category: string): Promise<Record<string, number>> {
  const supabase = await supabaseClientPromise;
  try {
    // Get category trending data
    const { data: categoryData, error } = await supabase
      .from('hashtags')
      .select('trending_score, usage_count')
      .eq('category', category)
      .eq('is_trending', true);

    if (error || !categoryData?.length) return {};

    const totalTrendScore = categoryData.reduce((sum, h) => sum + (h.trending_score ?? 0), 0);
    const totalUsage = categoryData.reduce((sum, h) => sum + (h.usage_count ?? 0), 0);

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
  const supabase = await supabaseClientPromise;
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
      hashtag: {
        id: usage.hashtag_id,
        name: usage.hashtag?.name || '',
        display_name: usage.hashtag?.name || '',
        usage_count: 0,
        follower_count: 0,
        is_trending: false,
        trend_score: 0,
        created_at: usage.created_at || new Date().toISOString(),
        updated_at: usage.created_at || new Date().toISOString(),
        is_verified: false,
        is_featured: false
      },
      content_type: 'poll' as const,
      content_id: '',
      user_id: usage.user_id,
      created_at: usage.created_at,
      context: undefined,
      sentiment: 'neutral' as const,
      engagement_score: 0
    })) || [];
  } catch (error) {
    console.error('Failed to get recent activity:', error);
    return [];
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(preferences: Partial<any>): Promise<HashtagApiResponse<any>> {
  const supabase = await supabaseClientPromise;
  try {
    const { data, error } = await supabase
      .from('hashtag_user_preferences')
      .upsert({
        user_id: preferences.user_id || '',
        preferences: preferences as unknown as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as unknown as any };
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
export async function getUserPreferences(): Promise<HashtagApiResponse<any>> {
  const supabase = await supabaseClientPromise;
  try {
    const { data, error } = await supabase
      .from('hashtag_user_preferences')
      .select('*')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as unknown as any };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get user preferences' 
    };
  }
}
