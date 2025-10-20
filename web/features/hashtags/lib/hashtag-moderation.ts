/**
 * Hashtag Moderation Service
 * 
 * Comprehensive moderation system for hashtags including:
 * - Auto-moderation with content analysis
 * - User flagging system
 * - Manual moderation tools
 * - Spam detection
 * - Content policy enforcement
 * 
 * Created: October 11, 2025
 * Status: ✅ ACTIVE
 */

import { logger } from '@/lib/utils/logger';
import { getSupabaseClient } from '@/utils/supabase/client';

import type { 
  HashtagModeration, 
  HashtagFlag, 
  HashtagApiResponse,
  Hashtag
} from '../types';

// ============================================================================
// MODERATION CONSTANTS
// ============================================================================

const MODERATION_CONSTANTS = {
  // Auto-moderation thresholds
  SPAM_THRESHOLD: 0.8,
  INAPPROPRIATE_THRESHOLD: 0.7,
  MISLEADING_THRESHOLD: 0.6,
  DUPLICATE_THRESHOLD: 0.9,
  
  // Flag limits
  MAX_FLAGS_PER_HASHTAG: 10,
  FLAG_COOLDOWN_HOURS: 24,
  
  // Review timeouts
  AUTO_APPROVE_HOURS: 72,
  HUMAN_REVIEW_THRESHOLD: 0.5,
  
  // Content analysis
  SPAM_KEYWORDS: [
    'buy', 'sell', 'promo', 'discount', 'offer', 'deal',
    'click', 'link', 'free', 'win', 'prize', 'money'
  ],
  
  INAPPROPRIATE_KEYWORDS: [
    'hate', 'violence', 'explicit', 'adult',
    'illegal', 'harmful', 'dangerous'
  ],
  
  MISLEADING_PATTERNS: [
    /fake/i, /scam/i, /fraud/i, /lie/i, /false/i
  ]
} as const;

// ============================================================================
// CORE MODERATION FUNCTIONS
// ============================================================================

/**
 * Get moderation status for a hashtag
 */
export async function getHashtagModeration(hashtagId: string): Promise<HashtagApiResponse<HashtagModeration>> {
  try {
    const supabase = getSupabaseClient();
    
    const result = await supabase
      .from('hashtag_flags')
      .select('*')
      .eq('hashtag', hashtagId)
      .order('created_at', { ascending: false });
    
    const { data, error } = result;

    if (error) {
      logger.error('Failed to get hashtag moderation:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Transform hashtag_flags data to HashtagModeration format
    const flags = data || [];
    const pendingFlags = flags.filter(flag => flag.status === 'pending');
    const moderationStatus = pendingFlags.length > 0 ? 'pending' : 
                           flags.length > 0 ? 'flagged' : 'approved';

    // Transform flags to match HashtagFlag type
    const transformedFlags: HashtagFlag[] = flags.map(flag => ({
      id: flag.id,
      hashtag_id: flag.hashtag,
      user_id: flag.reporter_id || '',
      flag_type: 'other' as const, // Default type since hashtag_flags doesn't have flag_type
      reason: flag.reason,
      created_at: flag.created_at || new Date().toISOString(),
      status: flag.status === 'approved' ? 'resolved' : 
              flag.status === 'rejected' ? 'dismissed' : 'pending'
    }));

    const moderationData: HashtagModeration = {
      hashtag_id: hashtagId,
      status: moderationStatus,
      moderated_at: flags[0]?.updated_at || new Date().toISOString(),
      flags: transformedFlags,
      auto_moderation_score: 0.5, // Default score
      human_review_required: pendingFlags.length > 0
    };

    return {
      success: true,
      data: moderationData
    };
  } catch (error) {
    logger.error('Error getting hashtag moderation:', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: 'Failed to get moderation status'
    };
  }
}

/**
 * Create a flag for a hashtag
 */
export async function flagHashtag(
  hashtagId: string,
  flagType: HashtagFlag['flag_type'],
  reason: string
): Promise<HashtagApiResponse<HashtagFlag>> {
  try {
    const supabase = getSupabaseClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    // Check if user has already flagged this hashtag recently
    const { data: existingFlags } = await supabase
      .from('hashtag_flags')
      .select('id, created_at')
      .eq('hashtag', hashtagId)
      .eq('reporter_id', user.id)
      .gte('created_at', new Date(Date.now() - MODERATION_CONSTANTS.FLAG_COOLDOWN_HOURS * 60 * 60 * 1000).toISOString());

    if (existingFlags && existingFlags.length > 0) {
      return {
        success: false,
        error: 'You have already flagged this hashtag recently. Please wait before flagging again.'
      };
    }

    // Create the flag
    const result = await supabase
      .from('hashtag_flags')
      .insert({
        hashtag: hashtagId,
        reporter_id: user.id,
        reason,
        status: 'pending'
      })
      .select()
      .single();
    
    const { data, error } = result;

    if (error) {
      logger.error('Failed to create hashtag flag:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Trigger auto-moderation if needed
    await triggerAutoModeration(hashtagId);

    // Transform the returned data to match HashtagFlag type
    const transformedFlag: HashtagFlag = {
      id: data.id,
      hashtag_id: data.hashtag,
      user_id: data.reporter_id || '',
      flag_type: 'other', // Default since hashtag_flags doesn't have flag_type
      reason: data.reason,
      created_at: data.created_at || new Date().toISOString(),
      status: data.status as 'pending' | 'resolved' | 'dismissed'
    };

    return {
      success: true,
      data: transformedFlag
    };
  } catch (error) {
    logger.error('Error flagging hashtag:', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: 'Failed to flag hashtag'
    };
  }
}

/**
 * Moderate a hashtag (approve, reject, or flag)
 */
export async function moderateHashtag(
  hashtagId: string,
  status: HashtagModeration['status'],
  reason?: string
): Promise<HashtagApiResponse<HashtagModeration>> {
  try {
    const supabase = getSupabaseClient();
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    // Update hashtag flags with moderation decision
    const { data, error } = await supabase
      .from('hashtag_flags')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('hashtag', hashtagId)
      .eq('status', 'pending')
      .select();

    if (error) {
      logger.error('Failed to moderate hashtag:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Update hashtag status if rejected
    if (status === 'rejected') {
      // Get current hashtag metadata first
      const { data: hashtagData } = await supabase
        .from('hashtags')
        .select('metadata')
        .eq('id', hashtagId)
        .single();

      await supabase
        .from('hashtags')
        .update({ 
          is_featured: false,
          is_trending: false,
          metadata: {
            ...(hashtagData?.metadata as Record<string, any> || {}),
            moderation_status: 'rejected',
            moderation_reason: reason
          }
        })
        .eq('id', hashtagId);
    }

    // Get updated moderation status
    const moderationResult = await getHashtagModeration(hashtagId);
    
    return {
      success: true,
      data: moderationResult.data
    };
  } catch (error) {
    logger.error('Error moderating hashtag:', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: 'Failed to moderate hashtag'
    };
  }
}

/**
 * Get flagged hashtags for moderation queue
 */
export async function getModerationQueue(
  status?: HashtagModeration['status'],
  limit = 50
): Promise<HashtagApiResponse<Array<Hashtag & { moderation: HashtagModeration }>>> {
  try {
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from('hashtag_flags')
      .select(`
        *,
        hashtags:hashtags(*)
      `)
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to get moderation queue:', error);
      return {
        success: false,
        error: error.message
      };
    }

    const result = data?.map((item: any) => ({
      ...item.hashtags,
      moderation: {
        hashtag_id: item.hashtag_id,
        status: item.status,
        moderation_reason: item.moderation_reason,
        moderated_by: item.moderated_by,
        moderated_at: item.moderated_at,
        flags: [], // Will be populated separately if needed
        auto_moderation_score: item.auto_moderation_score || 0,
        human_review_required: item.human_review_required || false
      }
    })) || [];

    return {
      success: true,
      data: result
    };
  } catch (error) {
    logger.error('Error getting moderation queue:', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: 'Failed to get moderation queue'
    };
  }
}

// ============================================================================
// AUTO-MODERATION FUNCTIONS
// ============================================================================

/**
 * Trigger auto-moderation for a hashtag
 */
export async function triggerAutoModeration(hashtagId: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    
    // Get hashtag details
    const { data: hashtag } = await supabase
      .from('hashtags')
      .select('*')
      .eq('id', hashtagId)
      .single();

    if (!hashtag) return;

    // Calculate auto-moderation score
    const score = await calculateAutoModerationScore(hashtag);
    
    // Get flag count
    const { count: flagCount } = await supabase
      .from('hashtag_flags')
      .select('*', { count: 'exact', head: true })
      .eq('hashtag_id', hashtagId)
      .eq('status', 'pending');

    // Determine if human review is required
    const humanReviewRequired = score > MODERATION_CONSTANTS.HUMAN_REVIEW_THRESHOLD || 
                               (flagCount || 0) >= 3;

    // Update hashtag flags with auto-moderation results
    await supabase
      .from('hashtag_flags')
      .update({
        status: humanReviewRequired ? 'flagged' : 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('hashtag', hashtagId)
      .eq('status', 'pending');

    // Auto-approve if score is low and no flags
    if (score < MODERATION_CONSTANTS.HUMAN_REVIEW_THRESHOLD && (flagCount || 0) === 0) {
      await moderateHashtag(hashtagId, 'approved', 'Auto-approved by system');
    }

    logger.info(`Auto-moderation triggered for hashtag ${hashtagId}: score=${score}, human_review=${humanReviewRequired}`);
  } catch (error) {
    logger.error('Error in auto-moderation:', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Calculate auto-moderation score for a hashtag
 */
export async function calculateAutoModerationScore(hashtag: any): Promise<number> {
  let score = 0;
  const name = hashtag.name.toLowerCase();
  
  // Check for spam keywords
  const spamMatches = MODERATION_CONSTANTS.SPAM_KEYWORDS.filter(keyword => 
    name.includes(keyword.toLowerCase())
  );
  score += spamMatches.length * 0.3;

  // Check for inappropriate keywords
  const inappropriateMatches = MODERATION_CONSTANTS.INAPPROPRIATE_KEYWORDS.filter(keyword => 
    name.includes(keyword.toLowerCase())
  );
  score += inappropriateMatches.length * 0.4;

  // Check for misleading patterns
  const misleadingMatches = MODERATION_CONSTANTS.MISLEADING_PATTERNS.filter(pattern => 
    pattern.test(name)
  );
  score += misleadingMatches.length * 0.2;

  // Check for excessive special characters
  const specialCharCount = (name.match(/[^a-z0-9]/g) || []).length;
  if (specialCharCount > name.length * 0.3) {
    score += 0.2;
  }

  // Check for repetitive characters
  const repetitivePattern = /(.)\1{2,}/;
  if (repetitivePattern.test(name)) {
    score += 0.3;
  }

  // Check for very short or very long names
  if (name.length < 3) score += 0.2;
  if (name.length > 30) score += 0.1;

  return Math.min(score, 1.0); // Cap at 1.0
}

/**
 * Check for duplicate hashtags
 */
export async function checkForDuplicates(hashtagName: string): Promise<HashtagApiResponse<Hashtag[]>> {
  try {
    const supabase = getSupabaseClient();
    
    // Normalize the name for comparison
    const normalizedName = hashtagName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const { data, error } = await supabase
      .from('hashtags')
      .select('*')
      .ilike('name', `%${normalizedName}%`);

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    // Filter for actual duplicates (similarity > 80%)
    const duplicates = data?.filter(hashtag => {
      const existingNormalized = hashtag.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const similarity = calculateSimilarity(normalizedName, existingNormalized);
      return similarity > MODERATION_CONSTANTS.DUPLICATE_THRESHOLD;
    }) || [];

    // Transform duplicates to handle null values
    const transformedDuplicates = duplicates.map(hashtag => ({
      ...hashtag,
      description: hashtag.description || undefined,
      category: hashtag.category as any || undefined,
      created_by: hashtag.created_by || undefined,
      follower_count: hashtag.follower_count || 0,
      usage_count: hashtag.usage_count || 0,
      is_featured: hashtag.is_featured || false,
      is_trending: hashtag.is_trending || false,
      is_verified: hashtag.is_verified || false,
      trend_score: hashtag.trend_score || 0,
      created_at: hashtag.created_at || new Date().toISOString(),
      updated_at: hashtag.updated_at || new Date().toISOString(),
      metadata: hashtag.metadata as Record<string, any> || undefined
    }));

    return {
      success: true,
      data: transformedDuplicates
    };
  } catch (error) {
    logger.error('Error checking for duplicates:', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: 'Failed to check for duplicates'
    };
  }
}

/**
 * Calculate string similarity (simple implementation)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = Array(str2.length + 1).fill(0).map(() => Array(str1.length + 1).fill(0));
  
  for (let i = 0; i <= str1.length; i++) matrix[0]![i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j]![0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j]![i] = Math.min(
        (matrix[j]![i - 1] ?? 0) + 1,
        (matrix[j - 1]![i] ?? 0) + 1,
        (matrix[j - 1]![i - 1] ?? 0) + indicator
      );
    }
  }
  
  return matrix[str2.length]![str1.length] ?? 0;
}

// ============================================================================
// MODERATION ANALYTICS
// ============================================================================

/**
 * Get moderation statistics
 */
export async function getModerationStats(): Promise<HashtagApiResponse<{
  total_hashtags: number;
  pending_review: number;
  approved: number;
  rejected: number;
  flagged: number;
  auto_approved: number;
  human_reviewed: number;
  flag_count: number;
  top_flag_types: Array<{ type: string; count: number }>;
}>> {
  try {
    const supabase = getSupabaseClient();
    
    // Get basic counts
    const [
      { count: totalHashtags },
      { count: pendingReview },
      { count: approved },
      { count: rejected },
      { count: flagged },
      { count: flagCount }
    ] = await Promise.all([
      supabase.from('hashtags').select('*', { count: 'exact', head: true }),
      supabase.from('hashtag_flags').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('hashtag_flags').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('hashtag_flags').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
      supabase.from('hashtag_flags').select('*', { count: 'exact', head: true }).eq('status', 'flagged'),
      supabase.from('hashtag_flags').select('*', { count: 'exact', head: true })
    ]);

    // Get top flag types
    const { data: flagTypes } = await supabase
      .from('hashtag_flags')
      .select('flag_type')
      .eq('status', 'pending');

    const topFlagTypes = flagTypes?.reduce((acc: any, flag: any) => {
      const type = flag.flag_type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const topFlagTypesArray = Object.entries(topFlagTypes)
      .map(([type, count]) => ({ type, count }))
      .sort((a: any, b: any) => (b.count as number) - (a.count as number))
      .slice(0, 5);

    return {
      success: true,
      data: {
        total_hashtags: totalHashtags || 0,
        pending_review: pendingReview || 0,
        approved: approved || 0,
        rejected: rejected || 0,
        flagged: flagged || 0,
        auto_approved: approved || 0, // Simplified for now
        human_reviewed: (approved || 0) + (rejected || 0),
        flag_count: flagCount || 0,
        top_flag_types: topFlagTypesArray as Array<{ type: string; count: number }>
      }
    };
  } catch (error) {
    logger.error('Error getting moderation stats:', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: 'Failed to get moderation statistics'
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  MODERATION_CONSTANTS
};
