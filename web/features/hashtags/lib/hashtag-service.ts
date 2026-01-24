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

import {
  HASHTAGS_SELECT_COLUMNS,
  USER_HASHTAGS_SELECT_COLUMNS,
} from '@/lib/api/response-builders';
import { logger } from '@/lib/utils/logger';

import { getSupabaseBrowserClient } from '../../../utils/supabase/client';
import { HASHTAG_CATEGORIES } from '../types';

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
  HashtagApiResponse,
  HashtagMetadata,
  UserHashtagPreferences,
  HashtagUserPreferences,
  CategoryTrendSummary,
  ProfileHashtagIntegration,
  UpdateHashtagUserPreferencesInput,
  HashtagFilterPreferences,
  HashtagNotificationPreferences,
  HashtagActivity,
  PollHashtagIntegration,
  FeedHashtagIntegration,
  HashtagValidation,
  FeedHashtagAnalytics,
} from '../types';
import type { Database, Json } from '@/types/supabase';

type HashtagRow = Database['public']['Tables']['hashtags']['Row'];
type UserHashtagRow = Database['public']['Tables']['user_hashtags']['Row'];
type UserHashtagWithRelation = UserHashtagRow & { hashtag?: HashtagRow | null };
type HashtagUserPreferencesRow = Database['public']['Tables']['hashtag_user_preferences']['Row'];
type HashtagEngagementRow = Database['public']['Tables']['hashtag_engagement']['Row'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isJsonValue = (value: unknown): value is Json => {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  return isRecord(value) && Object.values(value).every(isJsonValue);
};

const parseJsonRecord = (value: Json | null): Record<string, Json> | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const result: Record<string, Json> = {};
  Object.entries(value).forEach(([key, entry]) => {
    if (isJsonValue(entry)) {
      result[key] = entry;
    }
  });

  return Object.keys(result).length > 0 ? result : undefined;
};

const normalizeHashtagCategory = (category: string | null): HashtagCategory =>
  category && HashtagCategorySet.has(category as HashtagCategory)
    ? (category as HashtagCategory)
    : 'community';

const parseMetadata = (metadata: Json | null): HashtagMetadata | undefined => {
  const record = parseJsonRecord(metadata);
  return record ? (record as HashtagMetadata) : undefined;
};

const parseUserHashtagPreferences = (
  preferences: Json | null
): UserHashtagPreferences | undefined => {
  const record = parseJsonRecord(preferences);
  return record ? (record as UserHashtagPreferences) : undefined;
};

const parseHashtagUserPreferences = (
  row: HashtagUserPreferencesRow | null
): HashtagUserPreferences | null => {
  if (!row) {
    return null;
  }

  const followedHashtags =
    Array.isArray(row.followed_hashtags) && row.followed_hashtags.every((item) => typeof item === 'string')
      ? (row.followed_hashtags as string[])
      : [];

  const hashtagFilters = parseJsonRecord(row.hashtag_filters ?? null);
  const notificationPreferences = parseJsonRecord(row.notification_preferences ?? null);

  const preferences: HashtagUserPreferences = {
    userId: row.user_id,
    followedHashtags,
    hashtagFilters: (hashtagFilters ?? {}) as HashtagUserPreferences['hashtagFilters'],
    notificationPreferences: (notificationPreferences ?? {}) as HashtagUserPreferences['notificationPreferences'],
  };

  if (row.created_at) {
    preferences.createdAt = row.created_at;
  }

  if (row.updated_at) {
    preferences.updatedAt = row.updated_at;
  }

  return preferences;
};

// Database types
const HashtagCategorySet = new Set<HashtagCategory>(HASHTAG_CATEGORIES);

const ensureHashtagRow = (row?: HashtagRow | null, fallbackId?: string): HashtagRow => {
  if (row) {
    return row;
  }

  const id = fallbackId ?? `missing_${Date.now()}`;
  return {
    id,
    name: fallbackId ?? id,
    category: null,
    created_at: null,
    created_by: null,
    description: null,
    follower_count: null,
    is_featured: null,
    is_trending: null,
    is_verified: null,
    metadata: null,
    trending_score: null,
    updated_at: null,
    usage_count: null,
  };
};

const transformHashtagData = (data: HashtagRow): Hashtag => {
  const metadata = parseMetadata(data.metadata);
  const displayNameFromMetadata =
    metadata && typeof metadata.display_name === 'string' ? (metadata.display_name as string) : undefined;

  const hashtag: Hashtag = {
    id: String(data.id),
    name: data.name,
    category: normalizeHashtagCategory(data.category),
    usage_count: data.usage_count ?? 0,
    is_trending: Boolean(data.is_trending),
    is_verified: Boolean(data.is_verified),
    is_featured: Boolean(data.is_featured),
    follower_count: data.follower_count ?? 0,
    trend_score: data.trending_score ?? 0,
    created_at: data.created_at ?? new Date().toISOString(),
    updated_at: data.updated_at ?? new Date().toISOString(),
  };

  const displayName = displayNameFromMetadata ?? data.description ?? data.name;
  if (displayName) {
    hashtag.display_name = displayName;
  }

  if (data.description) {
    hashtag.description = data.description;
  }

  if (data.created_by) {
    hashtag.created_by = data.created_by;
  }

  if (metadata) {
    hashtag.metadata = metadata;
  }

  return hashtag;
};

const transformUserHashtag = (row: UserHashtagWithRelation): UserHashtag => {
  const hashtagRow = ensureHashtagRow(row.hashtag ?? null, row.hashtag_id);

  const userHashtag: UserHashtag = {
    id: row.id,
    user_id: row.user_id,
    hashtag_id: row.hashtag_id,
    hashtag: transformHashtagData(hashtagRow),
    followed_at: row.followed_at ?? new Date().toISOString(),
    is_primary: Boolean(row.is_primary),
    usage_count: row.usage_count ?? 0,
  };

  if (row.last_used_at) {
    userHashtag.last_used_at = row.last_used_at;
  }

  if (row.created_at) {
    userHashtag.created_at = row.created_at;
  }

  const preferences = parseUserHashtagPreferences(row.preferences);
  if (preferences) {
    userHashtag.preferences = preferences;
  }

  return userHashtag;
};

const transformHashtagEngagement = (row: HashtagEngagementRow): HashtagEngagement => {
  const engagement: HashtagEngagement = {
    id: row.id,
    hashtag_id: row.hashtag_id,
    user_id: row.user_id,
    engagement_type: row.engagement_type,
    timestamp: row.timestamp ?? new Date().toISOString(),
  };

  if (row.created_at) {
    engagement.created_at = row.created_at;
  }

  const metadata = parseJsonRecord(row.metadata ?? null);
  if (metadata) {
    engagement.metadata = metadata as Record<string, unknown>;
  }

  return engagement;
};

let supabaseClientPromise:
  | Promise<Awaited<ReturnType<typeof getSupabaseBrowserClient>>>
  | null = null;

function ensureSupabaseClient() {
  if (typeof window === 'undefined') {
    throw new Error(
      'Hashtag service requires a browser Supabase client. Provide an explicit client when using this module on the server.'
    );
  }
  if (!supabaseClientPromise) {
    supabaseClientPromise = getSupabaseBrowserClient();
  }
  return supabaseClientPromise;
}

// ============================================================================
// CORE HASHTAG OPERATIONS
// ============================================================================

/**
 * Get hashtag by ID
 */
export async function getHashtagById(id: string): Promise<HashtagApiResponse<Hashtag>> {
  const supabase = await ensureSupabaseClient();
  try {
    const result = await supabase
      .from('hashtags')
      .select(HASHTAGS_SELECT_COLUMNS)
      .eq('id', id)
      .single();

    const { data, error } = result;

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Hashtag not found' };
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
 * Get hashtag by name
 */
export async function getHashtagByName(name: string): Promise<HashtagApiResponse<Hashtag>> {
  const supabase = await ensureSupabaseClient();
  try {
    const normalizedName = name.toLowerCase().replace(/^#/, '');

    const result = await supabase
      .from('hashtags')
      .select(HASHTAGS_SELECT_COLUMNS)
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
  const supabase = await ensureSupabaseClient();
  try {
    const normalizedName = name.toLowerCase().replace(/^#/, '');

    // Check if hashtag already exists
    const existing = await getHashtagByName(normalizedName);
    if (existing.success && existing.data) {
      return { success: false, error: 'Hashtag already exists' };
    }

    const insertData: Database['public']['Tables']['hashtags']['Insert'] = {
      name: normalizedName,
      usage_count: 0,
      follower_count: 0,
      is_trending: false,
      trending_score: 0,
      is_verified: false,
      is_featured: false,
      ...(description ? { description } : {}),
      ...(category ? { category } : {})
    };

    const result = await supabase
      .from('hashtags')
      .insert(insertData)
      .select(HASHTAGS_SELECT_COLUMNS)
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
  const supabase = await ensureSupabaseClient();
  try {
    // Map Hashtag fields to database fields
    const dbUpdates: Partial<Database['public']['Tables']['hashtags']['Update']> = {
      ...(updates.name && { name: updates.name }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.category && { category: updates.category }),
      ...(updates.usage_count !== undefined && { usage_count: updates.usage_count }),
      ...(updates.follower_count !== undefined && { follower_count: updates.follower_count }),
      ...(updates.is_trending !== undefined && { is_trending: updates.is_trending }),
      ...(updates.trend_score !== undefined && { trending_score: updates.trend_score }),
      ...(updates.is_verified !== undefined && { is_verified: updates.is_verified }),
      ...(updates.is_featured !== undefined && { is_featured: updates.is_featured }),
      ...(updates.metadata !== undefined && { metadata: updates.metadata as Json }),
      updated_at: new Date().toISOString()
    };

    const result = await supabase
      .from('hashtags')
      .update(dbUpdates)
      .eq('id', id)
      .select(HASHTAGS_SELECT_COLUMNS)
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
  const supabase = await ensureSupabaseClient();
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
  const supabase = await ensureSupabaseClient();
  try {
    const startTime = Date.now();
    let supabaseQuery = supabase
      .from('hashtags')
      .select(HASHTAGS_SELECT_COLUMNS);

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
  const supabase = await ensureSupabaseClient();
  try {
    let supabaseQuery = supabase
      .from('hashtags')
      .select('*')
      .eq('is_trending', true)
      .order('trending_score', { ascending: false })
      .limit(limit);

    if (category) {
      supabaseQuery = supabaseQuery.eq('category', category);
    }

    const { data: hashtags, error } = await supabaseQuery;

    if (error) {
      return { success: false, error: error.message };
    }

    let categorySummary: CategoryTrendSummary | null = null;
    if (category) {
      try {
        categorySummary = await calculateCategoryTrends(category);
      } catch (summaryError) {
        logger.warn('Failed to calculate category trends:', summaryError);
      }
    }

    const trendingHashtags: TrendingHashtag[] = await Promise.all(
      (hashtags ?? []).map(async (hashtagRow) => {
        const transformed = transformHashtagData(hashtagRow);

        const [growthRate, peakUsage, usage7d, peakPosition, currentPosition] = await Promise.all([
          calculateGrowthRate(transformed),
          calculateUsage24h(transformed),
          calculateUsage7d(transformed),
          calculatePeakPosition(hashtagRow.id),
          calculateCurrentPosition(hashtagRow.id),
        ]);

        const trending: TrendingHashtag = {
          hashtag: transformed,
          trend_score: hashtagRow.trending_score ?? 0,
          growth_rate: growthRate,
          peak_usage: peakUsage,
          time_period: '24h',
          usage_7d: usage7d,
          peak_position: peakPosition,
          current_position: currentPosition,
        };

        if (categorySummary && category) {
          trending.categoryContext = categorySummary;
        }

        return trending;
      })
    );

    return { success: true, data: trendingHashtags };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch trending hashtags',
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
  const supabase = await ensureSupabaseClient();
  try {
    const normalizedInput = input.toLowerCase().replace(/^#/, '');

    // Search for matching hashtags
    const { data: hashtags, error } = await supabase
      .from('hashtags')
      .select(HASHTAGS_SELECT_COLUMNS)
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
    if (suggestions.length > 0 && suggestions[0]?.hashtag?.id) {
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
                .select(HASHTAGS_SELECT_COLUMNS)
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
  const supabase = await ensureSupabaseClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Check if already following
    const { data: existing } = await supabase
      .from('user_hashtags')
      .select(USER_HASHTAGS_SELECT_COLUMNS)
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
        usage_count: 0,
      })
      .select(`
        *,
        hashtag:hashtags(*)
      `)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Failed to follow hashtag' };
    }

    // Update follower count manually
    const { data: currentHashtag } = await supabase
      .from('hashtags')
      .select('follower_count')
      .eq('id', hashtagId)
      .single();

    if (currentHashtag) {
      const updateData: Database['public']['Tables']['hashtags']['Update'] = {
        follower_count: (currentHashtag.follower_count ?? 0) + 1,
      };
      await supabase
        .from('hashtags')
        .update(updateData)
        .eq('id', hashtagId);
    }

    return {
      success: true,
      data: transformUserHashtag(data as UserHashtagWithRelation),
    };
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
  const supabase = await ensureSupabaseClient();
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
      const updateData: Database['public']['Tables']['hashtags']['Update'] = {
        follower_count: Math.max((currentHashtag.follower_count ?? 0) - 1, 0)
      };
      await supabase
        .from('hashtags')
        .update(updateData)
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
  const supabase = await ensureSupabaseClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('user_hashtags')
      .select(`
        ${USER_HASHTAGS_SELECT_COLUMNS},
        hashtag:hashtags(${HASHTAGS_SELECT_COLUMNS})
      `)
      .eq('user_id', user.id)
      .order('followed_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    const userHashtags = (data ?? []).map((row) => transformUserHashtag(row as UserHashtagWithRelation));

    return { success: true, data: userHashtags };
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
  const supabase = await ensureSupabaseClient();
  try {
    // Verify hashtag exists using supabase client
    const { data: hashtag, error: hashtagError } = await supabase
      .from('hashtags')
      .select('id')
      .eq('id', hashtagId)
      .single();

    if (hashtagError || !hashtag) {
      return {
        success: false,
        error: 'Hashtag not found'
      };
    }

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
  const supabase = await ensureSupabaseClient();
  try {
    const { data: stats, error } = await supabase
      .from('hashtags')
      .select(HASHTAGS_SELECT_COLUMNS)
      .order('usage_count', { ascending: false })
      .limit(100);

    if (error) {
      return { success: false, error: error.message };
    }

    const statsResponse = {
      total_hashtags: stats?.length ?? 0,
      trending_count: stats?.filter((s: HashtagRow) => s.is_trending).length ?? 0,
      verified_count: stats?.filter((s: HashtagRow) => s.is_verified).length ?? 0,
      categories: {} as Record<HashtagCategory, number>,
      top_hashtags: (stats?.slice(0, 10).map(transformHashtagData)) ?? [],
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

    // Check if hashtag already exists using getHashtagByName
    const existingHashtag = await getHashtagByName(normalizedName);
    const isAvailable = !existingHashtag.success || !existingHashtag.data;

    if (!isAvailable) {
      warnings.push('Hashtag already exists');
    }

    const availability: HashtagValidation['availability'] = {
      is_available: errors.length === 0 && isAvailable,
      similar_hashtags: [],
    };

    const conflictReason = errors[0];
    if (typeof conflictReason === 'string' && conflictReason.length > 0) {
      availability.conflict_reason = conflictReason;
    }

    const validation: HashtagValidation = {
      name: normalizedName,
      is_valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      normalized_name: normalizedName,
      availability,
    };

    return { success: true, data: validation };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate hashtag',
    };
  }
}

// ============================================================================
// CROSS-FEATURE INTEGRATION
// ============================================================================

/**
 * Get profile hashtag integration
 */
export async function getProfileHashtagIntegration(
  userId: string
): Promise<HashtagApiResponse<ProfileHashtagIntegration>> {
  const supabase = await ensureSupabaseClient();
  try {
    const { data: userHashtagRows, error: userHashtagsError } = await supabase
      .from('user_hashtags')
      .select(`${USER_HASHTAGS_SELECT_COLUMNS}, hashtag:hashtags(${HASHTAGS_SELECT_COLUMNS})`)
      .eq('user_id', userId);

    if (userHashtagsError) throw userHashtagsError;

    let preferencesRow: HashtagUserPreferencesRow | null = null;
    try {
      const result = await supabase
        .from('hashtag_user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
      preferencesRow = result.data;
      if (result.error) {
        throw result.error;
      }
    } catch (tableError) {
      logger.warn('Error fetching user hashtag preferences', { tableError });
      preferencesRow = null;
    }

    const { data: engagementRows, error: activityError } = await supabase
      .from('hashtag_engagement')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(50);

    if (activityError) throw activityError;

    const userHashtags = (userHashtagRows ?? []).map((row) => transformUserHashtag(row as UserHashtagWithRelation));
    const primaryHashtags = userHashtags.filter((uh) => uh.is_primary).map((uh) => uh.hashtag.name);
    const interestHashtags = userHashtags.filter((uh) => !uh.is_primary).map((uh) => uh.hashtag.name);
    const followedHashtags = userHashtags.map((uh) => uh.hashtag.name);

    const hashtagPreferences = parseHashtagUserPreferences(preferencesRow);
    const hashtagActivity = (engagementRows ?? []).map((row) => transformHashtagEngagement(row as HashtagEngagementRow));

    const integration: ProfileHashtagIntegration = {
      user_id: userId,
      primary_hashtags: primaryHashtags,
      interest_hashtags: interestHashtags,
      custom_hashtags: await getUserCustomHashtags(userId),
      followed_hashtags: followedHashtags,
      hashtag_preferences: hashtagPreferences,
      hashtag_activity: hashtagActivity,
      last_updated: new Date().toISOString(),
    };

    return { success: true, data: integration };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch profile hashtag integration',
    };
  }
}

/**
 * Get poll hashtag integration
 */
export async function getPollHashtagIntegration(pollId: string): Promise<HashtagApiResponse<PollHashtagIntegration>> {
  const supabase = await ensureSupabaseClient();
  try {
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('hashtags, primary_hashtag, total_views')
      .eq('id', pollId)
      .single();

    if (pollError) throw pollError;

    let engagementData, engagementError;
    try {
      const result = await supabase
        .from('hashtag_engagement')
        .select('engagement_type')
        .eq('content_id', pollId)
        .eq('content_type', 'poll');
      engagementData = result.data;
      engagementError = result.error;
    } catch (tableError) {
      logger.warn('hashtag_engagement table not available, using hashtag_usage', { tableError });
      const result = await supabase
        .from('hashtag_usage')
        .select('engagement_type')
        .eq('content_id', pollId)
        .eq('content_type', 'poll');
      engagementData = result.data;
      engagementError = result.error;
    }

    if (engagementError) throw engagementError;

    const engagementEvents = (engagementData ?? []) as Array<{ engagement_type?: string | null }>;
    const hashtagClicks = engagementEvents.filter((event) => event.engagement_type === 'click').length;
    const hashtagShares = engagementEvents.filter((event) => event.engagement_type === 'share').length;

    const { data: relatedPolls, error: relatedError } = await supabase
      .from('polls')
      .select('id')
      .overlaps('hashtags', poll.hashtags ?? [])
      .neq('id', pollId)
      .limit(10);

    if (relatedError) throw relatedError;

    const trendingScore = poll.hashtags?.length ? poll.hashtags.length * 10 : 0;

    const pollHashtags = Array.isArray(poll.hashtags)
      ? poll.hashtags.filter((value): value is string => typeof value === 'string')
      : [];

    const relatedPollIds = (relatedPolls ?? [])
      .map((p) => (typeof p.id === 'string' ? p.id : null))
      .filter((id): id is string => Boolean(id));

    const integration: PollHashtagIntegration = {
      poll_id: pollId,
      hashtags: pollHashtags,
      hashtag_engagement: {
        total_views: poll.total_views ?? 0,
        hashtag_clicks: hashtagClicks,
        hashtag_shares: hashtagShares,
      },
      related_polls: relatedPollIds,
      hashtag_trending_score: trendingScore,
    };

    if (typeof poll.primary_hashtag === 'string' && poll.primary_hashtag.length > 0) {
      integration.primary_hashtag = poll.primary_hashtag;
    }

    return { success: true, data: integration };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch poll hashtag integration',
    };
  }
}

/**
 * Get feed hashtag integration
 */
export async function getFeedHashtagIntegration(feedId: string): Promise<HashtagApiResponse<FeedHashtagIntegration>> {
  const supabase = await ensureSupabaseClient();
  try {
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
      logger.warn('feeds table not available, using user_profiles', { tableError });
      const result = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', feedId)
        .single();
      const feedData = result.data as { hashtag_filters?: string[]; id: string } | null;
      feed = feedData
        ? {
            hashtag_filters: feedData.hashtag_filters ?? [],
            user_id: feedData.id,
          }
        : null;
      feedError = result.error;
    }

    if (feedError) throw feedError;

    const { data: trendingHashtags, error: trendingError } = await supabase
      .from('hashtags')
      .select('name')
      .eq('is_trending', true)
      .order('trending_score', { ascending: false })
      .limit(10);

    if (trendingError) throw trendingError;

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

    const { data: personalizedHashtags, error: personalError } = await supabase
      .from('user_hashtags')
      .select('hashtag:hashtags(name)')
      .eq('user_id', feed?.user_id ?? '')
      .order('usage_count', { ascending: false })
      .limit(10);

    if (personalError) throw personalError;

    const personalizedHashtagNames = (personalizedHashtags ?? [])
      .map((row) => {
        const record = row as { hashtag: { name: string | null } | null };
        return record.hashtag?.name ?? null;
      })
      .filter((name): name is string => typeof name === 'string' && name.length > 0);

    const feedAnalyticsMap = new Map<string, FeedHashtagAnalytics>();

    (trendingHashtags ?? []).forEach((row, index) => {
      const rawHashtag = row as Record<string, unknown>;
      const hashtagName = typeof rawHashtag.name === 'string' ? (rawHashtag.name as string) : null;
      if (!hashtagName) {
        return;
      }

      const usageCount = typeof rawHashtag.usage_count === 'number' ? (rawHashtag.usage_count as number) : 0;
      const trendScore = typeof rawHashtag.trend_score === 'number' ? (rawHashtag.trend_score as number) : 0;
      const updatedAt = typeof rawHashtag.updated_at === 'string' ? (rawHashtag.updated_at as string) : undefined;

      feedAnalyticsMap.set(hashtagName, {
        hashtag: hashtagName,
        poll_count: usageCount,
        engagement_rate: trendScore,
        user_interest_level: 0,
        trending_position: index + 1,
        last_activity: updatedAt ? new Date(updatedAt).toISOString() : new Date().toISOString(),
      });
    });

    personalizedHashtagNames.forEach((name) => {
      const existing = feedAnalyticsMap.get(name);
      if (existing) {
        existing.user_interest_level = Math.max(existing.user_interest_level, 1);
      } else {
        feedAnalyticsMap.set(name, {
          hashtag: name,
          poll_count: 0,
          engagement_rate: 0,
          user_interest_level: 1,
          last_activity: new Date().toISOString(),
        });
      }
    });

    const feedAnalytics = Array.from(feedAnalyticsMap.values());

    const feedHashtagContent: FeedHashtagIntegration['hashtag_content'] = Array.isArray(hashtagContent)
      ? hashtagContent.map((item) => ({ ...(item as Record<string, unknown>) }))
      : [];

    const trendingHashtagNames: string[] = [];
    (trendingHashtags ?? []).forEach((row) => {
      const rawHashtag = row as Record<string, unknown>;
      if (typeof rawHashtag.name === 'string') {
        trendingHashtagNames.push(rawHashtag.name as string);
      }
    });

    const feedHashtagFilters: string[] = Array.isArray(feed?.hashtag_filters)
      ? (feed?.hashtag_filters as unknown[]).filter((value): value is string => typeof value === 'string')
      : [];

    const integration: FeedHashtagIntegration = {
      feed_id: feedId,
      hashtag_filters: feedHashtagFilters,
      trending_hashtags: trendingHashtagNames,
      hashtag_content: feedHashtagContent,
      hashtag_analytics: feedAnalytics,
      personalized_hashtags: personalizedHashtagNames,
    };

    return { success: true, data: integration };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch feed hashtag integration',
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
  const supabase = await ensureSupabaseClient();
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
    logger.error('Failed to generate related queries:', error);
    return [];
  }
}

async function calculateGrowthRate(hashtag: Hashtag): Promise<number> {
  const supabase = await ensureSupabaseClient();
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

    const recentCount = recentUsage?.length ?? 0;
    const previousCount = previousUsage?.length ?? 0;

    // Calculate growth rate as percentage change
    if (previousCount === 0) {
      return recentCount > 0 ? 100 : 0; // 100% growth if no previous usage
    }

    const growthRate = ((recentCount - previousCount) / previousCount) * 100;
    return Math.round(growthRate * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    logger.error('Failed to calculate growth rate:', error);
    return 0;
  }
}

async function calculateUsage24h(hashtag: Hashtag): Promise<number> {
  const supabase = await ensureSupabaseClient();
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

    return data?.length ?? 0;
  } catch (error) {
    logger.error('Failed to calculate 24h usage:', error);
    return 0;
  }
}

async function calculateUsage7d(hashtag: Hashtag): Promise<number> {
  const supabase = await ensureSupabaseClient();
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

    return data?.length ?? 0;
  } catch (error) {
    logger.error('Failed to calculate 7d usage:', error);
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
  const supabase = await ensureSupabaseClient();
  try {
    const { data, error } = await supabase
      .from('hashtags')
      .select('name')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return data?.map(h => h.name) ?? [];
  } catch (error) {
    logger.error('Failed to get user custom hashtags:', error);
    return [];
  }
}

// ============================================================================
// ADDITIONAL CALCULATION FUNCTIONS
// ============================================================================

async function calculatePeakPosition(hashtagId: string): Promise<number> {
  const supabase = await ensureSupabaseClient();
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
      historicalData = result.data ? [{ position_rank: Math.max(1, 100 - (result.data.trending_score ?? 0)) }] : [];
      error = result.error;
    }

    if (error || !historicalData?.length) return 1;

    // Find the best (lowest) position
    const positions = historicalData.map((d: any) => d.position_rank || 1);
    return Math.min(...positions);
  } catch (error) {
    logger.error('Failed to calculate peak position:', error);
    return 1;
  }
}

async function calculateCurrentPosition(hashtagId: string): Promise<number> {
  const supabase = await ensureSupabaseClient();
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
    logger.error('Failed to calculate current position:', error);
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
  const supabase = await ensureSupabaseClient();
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
    logger.error('Failed to calculate related hashtags:', error);
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
export async function calculateCategoryTrends(category: HashtagCategory): Promise<CategoryTrendSummary | null> {
  const supabase = await ensureSupabaseClient();
  try {
    const { data: categoryData, error } = await supabase
      .from('hashtags')
      .select('trending_score, usage_count')
      .eq('category', category)
      .eq('is_trending', true);

    if (error || !categoryData?.length) {
      return null;
    }

    const totalTrendScore = categoryData.reduce((sum, h) => sum + (h.trending_score ?? 0), 0);
    const totalUsage = categoryData.reduce((sum, h) => sum + (h.usage_count ?? 0), 0);
    const trendingCount = categoryData.length;

    return {
      category,
      totalTrendScore,
      totalUsage,
      trendingCount,
      averageTrendScore: trendingCount > 0 ? totalTrendScore / trendingCount : 0,
      averageUsage: trendingCount > 0 ? totalUsage / trendingCount : 0,
    };
  } catch (error) {
    logger.error('Failed to calculate category trends:', error);
    return null;
  }
}

async function getRecentActivity(): Promise<HashtagActivity[]> {
  const supabase = await ensureSupabaseClient();
  try {
    const { data: recentUsage, error } = await supabase
      .from('hashtag_usage')
      .select('*, hashtag:hashtags(name), user:profiles(username)')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !recentUsage) {
      return [];
    }

    return recentUsage.map((usage) => {
      const usageRecord = usage as Record<string, unknown>;

      const hashtag: Hashtag = {
        id: String(usage.hashtag_id),
        name: usage.hashtag?.name ?? String(usage.hashtag_id),
        display_name: usage.hashtag?.name ?? String(usage.hashtag_id),
        category: 'community',
        usage_count: 0,
        is_trending: false,
        is_verified: false,
        is_featured: false,
        follower_count: 0,
        trend_score: 0,
        created_at: usage.created_at ?? new Date().toISOString(),
        updated_at: usage.created_at ?? new Date().toISOString(),
      };

      const contentId = typeof usageRecord['content_id'] === 'string' ? (usageRecord['content_id'] as string) : '';
      const userId = typeof usageRecord['user_id'] === 'string' ? (usageRecord['user_id'] as string) : '';
      const context = typeof usageRecord['context'] === 'string' ? (usageRecord['context'] as string) : undefined;
      const sentimentValue = typeof usageRecord['sentiment'] === 'string' ? (usageRecord['sentiment'] as string) : undefined;
      const engagementScore = typeof usageRecord['engagement_score'] === 'number' ? (usageRecord['engagement_score'] as number) : undefined;

      const contentType = (usageRecord['content_type'] as HashtagActivity['content_type']) ?? 'feed';
      const createdAt = usage.created_at ?? new Date().toISOString();

      const activity: HashtagActivity = {
        id: usage.id,
        hashtag_id: usage.hashtag_id,
        hashtag,
        content_type: contentType,
        content_id: contentId,
        user_id: userId,
        created_at: createdAt,
      };

      if (context) {
        activity.context = context;
      }

      if (sentimentValue === 'positive' || sentimentValue === 'neutral' || sentimentValue === 'negative') {
        activity.sentiment = sentimentValue;
      }

      if (typeof engagementScore === 'number') {
        activity.engagement_score = engagementScore;
      }

      return activity;
    });
  } catch (error) {
    logger.error('Failed to get recent activity:', error);
    return [];
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  preferences: UpdateHashtagUserPreferencesInput
): Promise<HashtagApiResponse<HashtagUserPreferences>> {
  const supabase = await ensureSupabaseClient();
  try {
    const now = new Date().toISOString();

    const { data: existingRow } = await supabase
      .from('hashtag_user_preferences')
      .select('*')
      .eq('user_id', preferences.userId)
      .single();

    const currentFollowed =
      Array.isArray(existingRow?.followed_hashtags) && existingRow.followed_hashtags.every((item) => typeof item === 'string')
        ? (existingRow.followed_hashtags as string[])
        : [];

    const currentFilters = parseJsonRecord(existingRow?.hashtag_filters ?? null) ?? {};
    const currentNotifications = parseJsonRecord(existingRow?.notification_preferences ?? null) ?? {};

    const nextFollowed = preferences.followedHashtags ?? currentFollowed;
    const nextFilters = preferences.hashtagFilters ?? (currentFilters as HashtagFilterPreferences);
    const nextNotifications =
      preferences.notificationPreferences ?? (currentNotifications as HashtagNotificationPreferences);

    const { data, error } = await supabase
      .from('hashtag_user_preferences')
      .upsert({
        user_id: preferences.userId,
        followed_hashtags: nextFollowed as unknown as Json,
        hashtag_filters: nextFilters as unknown as Json,
        notification_preferences: nextNotifications as unknown as Json,
        created_at: existingRow?.created_at ?? now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const parsed = parseHashtagUserPreferences(data);
    if (parsed) {
      return { success: true, data: parsed };
    }

    return {
      success: true,
      data: {
        userId: preferences.userId,
        followedHashtags: nextFollowed,
        hashtagFilters: nextFilters,
        notificationPreferences: nextNotifications,
        createdAt: existingRow?.created_at ?? now,
        updatedAt: now,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user preferences',
    };
  }
}

/**
 * Get user preferences
 */
export async function getUserPreferences(): Promise<HashtagApiResponse<HashtagUserPreferences | null>> {
  const supabase = await ensureSupabaseClient();
  try {
    const { data, error } = await supabase
      .from('hashtag_user_preferences')
      .select('*')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: parseHashtagUserPreferences(data) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user preferences',
    };
  }
}
