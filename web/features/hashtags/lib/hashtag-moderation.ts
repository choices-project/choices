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
import type { Database } from '@/types/supabase';
import { getSupabaseBrowserClient } from '@/utils/supabase/client';

import type {
  HashtagModeration,
  HashtagFlag,
  HashtagApiResponse,
  Hashtag,
  HashtagCategory
} from '../types';

// Database types
type HashtagFlagRow = Database['public']['Tables']['hashtag_flags']['Row'];

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
    const supabase = await getSupabaseBrowserClient();

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
    const flags = (data ?? []) as HashtagFlagRow[];
    const pendingFlags = flags.filter(flag => flag.status === 'pending');
    const moderationStatus = pendingFlags.length > 0 ? 'pending' :
                           flags.length > 0 ? 'flagged' : 'approved';

    // Transform flags to match HashtagFlag type
    const _transformedFlags: HashtagFlag[] = flags.map((flag: HashtagFlagRow) => ({
      id: flag.id,
      hashtag_id: flag.hashtag_id,
      user_id: flag.user_id,
      flag_type: flag.flag_type as 'inappropriate' | 'spam' | 'misleading' | 'duplicate' | 'other',
      reason: flag.reason ?? '',
      created_at: flag.created_at ?? new Date().toISOString(),
      updated_at: flag.created_at ?? new Date().toISOString(), // Use created_at since updated_at doesn't exist
      status: (flag.status === 'approved' ? 'resolved' :
              flag.status === 'rejected' ? 'rejected' : 'pending') as 'pending' | 'reviewed' | 'resolved' | 'approved' | 'rejected' | 'flagged'
    }));

    const moderationData: HashtagModeration = {
      id: `moderation_${hashtagId}`,
      hashtag_id: hashtagId,
      status: moderationStatus,
      created_at: (flags[0] as HashtagFlagRow | undefined)?.created_at ?? new Date().toISOString(),
      updated_at: (flags[0] as HashtagFlagRow | undefined)?.created_at ?? new Date().toISOString(), // Use created_at since updated_at doesn't exist
      human_review_required: pendingFlags.length > 0,
      ...(pendingFlags.length > 0 ? { moderation_reason: 'Pending review' } : {})
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
    const supabase = await getSupabaseBrowserClient();

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
    const insertData: Database['public']['Tables']['hashtag_flags']['Insert'] = {
      hashtag_id: hashtagId,
      user_id: user.id,
      flagged_by: user.id,
      reason,
      status: 'pending',
      flag_type: 'inappropriate'
    };

    const result = await supabase
      .from('hashtag_flags')
      .insert(insertData as any)
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
    const flagData = data as HashtagFlagRow;
    const transformedFlag: HashtagFlag = {
      id: flagData.id,
      hashtag_id: flagData.hashtag_id,
      user_id: flagData.user_id,
      flag_type: flagData.flag_type as 'inappropriate' | 'spam' | 'misleading' | 'duplicate' | 'other',
      reason: flagData.reason ?? '',
      created_at: flagData.created_at ?? new Date().toISOString(),
      updated_at: flagData.created_at ?? new Date().toISOString(), // Use created_at since updated_at doesn't exist
      status: (flagData.status ?? 'pending') as 'pending' | 'reviewed' | 'resolved' | 'approved' | 'rejected' | 'flagged'
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
  _reason?: string
): Promise<HashtagApiResponse<HashtagModeration>> {
  try {
    const supabase = await getSupabaseBrowserClient();
    const userId = (await supabase.auth.getUser()).data.user?.id;

    if (!userId) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    // Update hashtag flags with moderation decision
    const updateData: Database['public']['Tables']['hashtag_flags']['Update'] = {
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId
    };

    const { data, error } = await supabase
      .from('hashtag_flags')
      .update(updateData as any)
      .eq('hashtag_id', hashtagId)
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

      const hashtagUpdate: Database['public']['Tables']['hashtags']['Update'] = {
        is_trending: false
      };

      await supabase
        .from('hashtags')
        .update(hashtagUpdate as any)
        .eq('id', hashtagId);
    }

    // Get updated moderation status
    const moderationResult = await getHashtagModeration(hashtagId);

    if (!moderationResult.success || !moderationResult.data) {
      return {
        success: false,
        error: 'Failed to get updated moderation status'
      };
    }

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
    const supabase = await getSupabaseBrowserClient();

    let query = supabase
      .from('hashtag_flags')
      .select(`
        *,
        hashtags!inner(*)
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
        hashtag_id: item.hashtag,
        status: item.status,
        moderation_reason: item.reason,
        moderated_by: item.reviewed_by,
        moderated_at: item.updated_at ?? item.created_at,
        flags: [], // Will be populated separately if needed
        auto_moderation_score: 0.5, // Default score
        human_review_required: item.status === 'pending'
      }
    })) ?? [];

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
    const supabase = await getSupabaseBrowserClient();

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
      .eq('hashtag', hashtagId)
      .eq('status', 'pending');

    // Determine if human review is required
    const humanReviewRequired = score > MODERATION_CONSTANTS.HUMAN_REVIEW_THRESHOLD ||
                               (flagCount ?? 0) >= 3;

    // Update hashtag flags with auto-moderation results
    const autoUpdateData: Database['public']['Tables']['hashtag_flags']['Update'] = {
      status: humanReviewRequired ? 'flagged' : 'approved',
      reviewed_at: new Date().toISOString()
    };

    await supabase
      .from('hashtag_flags')
      .update(autoUpdateData as any)
      .eq('hashtag_id', hashtagId)
      .eq('status', 'pending');

    // Auto-approve if score is low and no flags
    if (score < MODERATION_CONSTANTS.HUMAN_REVIEW_THRESHOLD && (flagCount ?? 0) === 0) {
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
  const specialCharCount = (name.match(/[^a-z0-9]/g) ?? []).length;
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
    const supabase = await getSupabaseBrowserClient();

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
    const hashtagRows = (data ?? []) as Database['public']['Tables']['hashtags']['Row'][];
    const duplicates = hashtagRows.filter(hashtag => {
      const existingNormalized = hashtag.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const similarity = calculateSimilarity(normalizedName, existingNormalized);
      return similarity > MODERATION_CONSTANTS.DUPLICATE_THRESHOLD;
    });

    // Transform duplicates to Hashtag type
    const transformedDuplicates: Hashtag[] = duplicates.map(hashtag => {
      const result: Hashtag = {
        id: hashtag.id,
        name: hashtag.name,
        display_name: hashtag.name,
        category: (hashtag.category ?? 'general') as HashtagCategory,
        follower_count: hashtag.follower_count ?? 0,
        usage_count: hashtag.usage_count ?? 0,
        is_featured: hashtag.is_featured ?? false,
        is_trending: hashtag.is_trending ?? false,
        is_verified: hashtag.is_verified ?? false,
        trend_score: hashtag.trending_score ?? 0,
        created_at: hashtag.created_at ?? new Date().toISOString(),
        updated_at: hashtag.updated_at ?? new Date().toISOString(),
        metadata: hashtag.metadata as Record<string, any> ?? {}
      };
      if (hashtag.description) result.description = hashtag.description;
      if (hashtag.created_by) result.created_by = hashtag.created_by;
      return result;
    });

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

  for (let i = 0; i <= str1.length; i++) {
    const row = matrix[0];
    if (row) row[i] = i;
  }
  for (let j = 0; j <= str2.length; j++) {
    const row = matrix[j];
    if (row) row[0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    const currentRow = matrix[j];
    const previousRow = matrix[j - 1];
    if (!currentRow || !previousRow) {
      continue;
    }

    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      const prevI = currentRow[i - 1] ?? 0;
      const prevJ = previousRow[i] ?? 0;
      const prevBoth = previousRow[i - 1] ?? 0;
      currentRow[i] = Math.min(
        prevI + 1,
        prevJ + 1,
        prevBoth + indicator
      );
    }
  }

  const lastRow = matrix[str2.length];
  return lastRow ? lastRow[str1.length] ?? 0 : 0;
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
    const supabase = await getSupabaseBrowserClient();

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

    // Get top flag types (using reason field since flag_type doesn't exist in DB)
    const { data: flagTypes } = await supabase
      .from('hashtag_flags')
      .select('reason')
      .eq('status', 'pending');

    const topFlagTypes = flagTypes?.reduce((acc: any, flag: any) => {
      // Categorize by reason content since flag_type doesn't exist
      const reason = flag.reason?.toLowerCase() ?? 'other';
      let type = 'other';

      if (reason.includes('spam') || reason.includes('promotional')) type = 'spam';
      else if (reason.includes('inappropriate') || reason.includes('offensive')) type = 'inappropriate';
      else if (reason.includes('misleading') || reason.includes('false')) type = 'misleading';
      else if (reason.includes('duplicate')) type = 'duplicate';

        acc[type] = (acc[type] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>) ?? {};

    const topFlagTypesArray = Object.entries(topFlagTypes)
      .map(([type, count]) => ({ type, count }))
      .sort((a: any, b: any) => (b.count as number) - (a.count as number))
      .slice(0, 5);

    return {
      success: true,
      data: {
        total_hashtags: totalHashtags ?? 0,
        pending_review: pendingReview ?? 0,
        approved: approved ?? 0,
        rejected: rejected ?? 0,
        flagged: flagged ?? 0,
        auto_approved: approved ?? 0, // Simplified for now
        human_reviewed: (approved ?? 0) + (rejected ?? 0),
        flag_count: flagCount ?? 0,
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
