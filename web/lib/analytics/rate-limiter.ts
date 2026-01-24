/**
 * Advanced Analytics Rate Limiter
 *
 * Enforces rate limits for advanced analytics:
 * - Regular users: 3 requests per week
 * - Admins: Unlimited
 * - Only available for closed polls (non-admins)
 *
 * Created: January 2025
 */

import { getSupabaseServerClient } from '@/utils/supabase/server';

import { logger } from '@/lib/utils/logger';

export type AnalyticsType = 'demographics' | 'geographic' | 'trust_tier' | 'temporal' | 'funnel';

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetDate: Date;
  reason?: string;
};

/**
 * Check if user can run advanced analytics
 */
export async function canRunAdvancedAnalytics(
  userId: string,
  pollId: string,
  analyticsType: AnalyticsType,
  isAdmin: boolean
): Promise<RateLimitResult> {
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      logger.error('Supabase client not available for rate limiting');
      return {
        allowed: false,
        remaining: 0,
        resetDate: new Date(),
        reason: 'Service unavailable'
      };
    }

    // Admins bypass all limits
    if (isAdmin) {
      return {
        allowed: true,
        remaining: Infinity,
        resetDate: new Date()
      };
    }

    // Check if poll is closed (non-admins can only run analytics on closed polls)
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id, status')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      logger.error('Failed to fetch poll for rate limiting', { pollId, error: pollError });
      return {
        allowed: false,
        remaining: 0,
        resetDate: new Date(),
        reason: 'Poll not found'
      };
    }

    if (poll.status !== 'closed') {
      return {
        allowed: false,
        remaining: 0,
        resetDate: new Date(),
        reason: 'Advanced analytics only available for closed polls'
      };
    }

    // Count usage in last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Type assertion needed since table may not be in Supabase types yet
    // Using any to avoid TypeScript errors with new table
    const result: any = await (supabase as any)
      .from('advanced_analytics_usage')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', weekAgo.toISOString());
    const count: number | null = result?.count ?? null;
    const countError = result?.error;

    if (countError) {
      logger.error('Failed to count analytics usage', { userId, error: countError });
      // Fail open - allow request if we can't check (better UX than blocking)
      return {
        allowed: true,
        remaining: 3,
        resetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };
    }

    const used = count ?? 0;
    const remaining = Math.max(0, 3 - used);
    const allowed = remaining > 0;

    // Calculate reset date (7 days from oldest usage, or 7 days from now if no usage)
    let resetDate = new Date();
    resetDate.setDate(resetDate.getDate() + 7); // Default: 7 days from now

    if (used > 0) {
      // Find oldest usage in the last 7 days
      const oldestResult: any = await (supabase as any)
        .from('advanced_analytics_usage')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
      const oldestUsage = oldestResult?.data;
      const oldestError = oldestResult?.error;

      if (!oldestError && oldestUsage?.created_at) {
        const oldestDate = new Date(oldestUsage.created_at);
        resetDate = new Date(oldestDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      }
    }

    logger.debug('Rate limit check', {
      userId,
      pollId,
      analyticsType,
      isAdmin,
      used,
      remaining,
      allowed
    });

    return {
      allowed,
      remaining,
      resetDate,
      reason: allowed ? undefined : `You have used all 3 advanced analytics this week. Reset date: ${resetDate.toLocaleDateString()}`
    };
  } catch (error) {
    logger.error('Error checking rate limit', { userId, pollId, error });
    // Fail open - allow request if we can't check
    return {
      allowed: true,
      remaining: 3,
      resetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      reason: 'Rate limit check failed, allowing request'
    };
  }
}

/**
 * Record analytics usage (only for non-admins)
 */
export async function recordAnalyticsUsage(
  userId: string,
  pollId: string,
  analyticsType: AnalyticsType
): Promise<void> {
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      logger.error('Supabase client not available for recording usage');
      return;
    }

    // Use upsert to handle duplicates gracefully
    // Type assertion needed since table may not be in Supabase types yet
    const result: any = await (supabase as any)
      .from('advanced_analytics_usage')
      .upsert({
        user_id: userId,
        poll_id: pollId,
        analytics_type: analyticsType,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,poll_id,analytics_type'
      });
    const error = result?.error;

    if (error) {
      logger.error('Failed to record analytics usage', {
        userId,
        pollId,
        analyticsType,
        error
      });
      // Don't throw - this is not critical, just logging
    } else {
      logger.debug('Recorded analytics usage', { userId, pollId, analyticsType });
    }
  } catch (error) {
    logger.error('Error recording analytics usage', { userId, pollId, analyticsType, error });
    // Don't throw - this is not critical
  }
}

/**
 * Get remaining analytics count for user
 */
export async function getRemainingAnalyticsCount(userId: string): Promise<number> {
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return 3; // Default to full limit if we can't check
    }

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Type assertion needed since table may not be in Supabase types yet
    const result: any = await (supabase as any)
      .from('advanced_analytics_usage')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', weekAgo.toISOString());
    const count: number | null = result?.count ?? null;
    const countError = result?.error;

    if (countError) {
      logger.error('Failed to get remaining count', { userId, error: countError });
      return 3; // Default to full limit
    }

    return Math.max(0, 3 - (count ?? 0));
  } catch (error) {
    logger.error('Error getting remaining count', { userId, error });
    return 3; // Default to full limit
  }
}
