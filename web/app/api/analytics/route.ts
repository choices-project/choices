/**
 * @fileoverview Analytics API
 *
 * Basic analytics endpoint providing platform metrics and user statistics
 * with rate limiting. Currently uses direct database queries for polls,
 * votes, and user activity data.
 *
 * Updated: November 6, 2025 - Modernized
 * @author Choices Platform Team
 * @created 2025-10-24
 * @version 3.0.0
 * @since 1.0.0
 */

import { getSupabaseAdminClient, getSupabaseServerClient } from '@/utils/supabase/server';

import { AnalyticsService } from '@/features/analytics/lib/analytics-service';


import {
  withErrorHandling,
  successResponse,
  authError,
  forbiddenError,
  validationError,
  errorResponse,
} from '@/lib/api';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';


export const dynamic = 'force-dynamic';

/**
 * Get analytics data
 *
 * @param {NextRequest} request - Request object
 * @param {string} [request.searchParams.type] - Analytics type (general, public, summary, poll, user)
 * @param {string} [request.searchParams.id] - ID for poll or user specific analytics
 * @param {string} [request.searchParams.period] - Time period for analytics (default: '7d')
 * @returns {Promise<NextResponse>} Analytics data response
 *
 * @example
 * GET /api/analytics?type=public
 * GET /api/analytics?type=poll&id=poll-123
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') ?? 'general';
    const id = searchParams.get('id');
    const period = searchParams.get('period') ?? '7d';

    // Public statistics (no auth required)
    if (type === 'public') {
      try {
        const supabase = await getSupabaseAdminClient();

        // Get total polls
        const { count: totalPolls, error: pollsError } = await supabase
          .from('polls')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        if (pollsError) {
          logger.error('Error fetching total polls:', pollsError);
        }

        // Get total votes across all polls
        const { data: pollsWithVotes, error: votesError } = await supabase
          .from('polls')
          .select('total_votes')
          .eq('is_active', true);

        if (votesError) {
          logger.error('Error fetching total votes:', votesError);
        }

        const totalVotes = pollsWithVotes?.reduce((sum: number, poll: { total_votes: number | null }) => sum + (poll.total_votes ?? 0), 0) ?? 0;

        // Get active users (users who have voted in the last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { count: activeUsers, error: usersError } = await supabase
          .from('votes')
          .select('user_id', { count: 'exact', head: true })
          .gte('created_at', thirtyDaysAgo)
          .not('user_id', 'is', null);

        if (usersError) {
          logger.error('Error fetching active users:', usersError);
        }

        return successResponse({
          stats: {
            totalPolls: totalPolls ?? 0,
            totalVotes,
            activeUsers: activeUsers ?? 0,
          },
          type: 'public',
          generatedAt: new Date().toISOString(),
        });

      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Error in public stats API:', err);
        return errorResponse('Failed to fetch public statistics', 500);
      }
    }

    // Analytics summary (requires user auth)
    if (type === 'summary') {
      try {
        // Check for user authentication
        const supabase = await getSupabaseServerClient();
        const { data: { user }, error: authFetchError } = await supabase.auth.getUser();

        if (authFetchError || !user) {
          return authError('Authentication required for analytics summary');
        }

        const analyticsService = AnalyticsService.getInstance();
        const summary = await analyticsService.getAnalyticsSummary();

        return successResponse({
          summary,
          generatedAt: new Date().toISOString(),
          type: 'summary',
          userId: user.id,
        });

      } catch (error) {
        logger.error('Error getting analytics summary', error instanceof Error ? error : new Error(String(error)));
        return errorResponse('Failed to get analytics summary', 500);
      }
    }

    // Poll-specific analytics (requires admin auth)
    if (type === 'poll') {
      if (!id) {
        return validationError({ pollId: 'Poll ID is required for poll analytics' });
      }

      try {
        // Check for admin authentication
        const supabase = await getSupabaseServerClient();
        const { data: { user }, error: authFetchError } = await supabase.auth.getUser();

        if (authFetchError || !user) {
          return authError('Authentication required for poll analytics');
        }

        // Check if user is admin by querying the user_profiles table
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_admin')
          .eq('user_id', user.id)
          .single();

        const isAdmin = profile?.is_admin ?? false;

        if (!isAdmin) {
          return forbiddenError('Admin access required for poll analytics');
        }

        const analyticsService = AnalyticsService.getInstance();
        const pollAnalytics = await analyticsService.getPollAnalytics(id);

        return successResponse({
          poll: pollAnalytics,
          generatedAt: new Date().toISOString(),
          type: 'poll',
          pollId: id,
          adminUser: {
            id: user.id,
            email: user.email,
          },
        });

      } catch (error) {
        logger.error('Error getting poll analytics', error instanceof Error ? error : new Error(String(error)));
        return errorResponse('Failed to get poll analytics', 500);
      }
    }

    // User-specific analytics (requires admin auth)
    if (type === 'user') {
      if (!id) {
        return validationError({ userId: 'User ID is required for user analytics' });
      }

      try {
        // Check for admin authentication
        const supabase = await getSupabaseServerClient();
        const { data: { user }, error: authFetchError } = await supabase.auth.getUser();

        if (authFetchError || !user) {
          return authError('Authentication required for user analytics');
        }

        // Check if user is admin by querying the user_profiles table
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_admin')
          .eq('user_id', user.id)
          .single();

        const isAdmin = profile?.is_admin ?? false;

        if (!isAdmin) {
          return forbiddenError('Admin access required for user analytics');
        }

        const analyticsService = AnalyticsService.getInstance();
        const userAnalytics = await analyticsService.getUserAnalytics(id);

        return successResponse({
          userAnalytics,
          generatedAt: new Date().toISOString(),
          type: 'user',
          userId: id,
          adminUser: {
            id: user.id,
            email: user.email,
          },
        });

      } catch (error) {
        logger.error('Error getting user analytics', error instanceof Error ? error : new Error(String(error)));
        return errorResponse('Failed to get user analytics', 500);
      }
    }

    // General analytics (requires admin auth)
    if (type === 'general') {
      try {
        // SECURITY: Always require real authentication - no bypass
        const supabase = await getSupabaseServerClient();
        const { data: { user }, error: authFetchError } = await supabase.auth.getUser();

        if (authFetchError || !user) {
          return authError('Authentication required for general analytics');
        }

        // Check if user is admin by querying the user_profiles table
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_admin')
          .eq('user_id', user.id)
          .single();

        const isAdmin = profile?.is_admin ?? false;

        if (!isAdmin) {
          return forbiddenError('Admin access required for general analytics');
        }

        // Get analytics data directly
        const analyticsService = AnalyticsService.getInstance();
        const analyticsData = await analyticsService.getAnalyticsSummary();

        return successResponse({
          analytics: analyticsData,
          generatedAt: new Date().toISOString(),
          performance: {
            queryOptimized: true,
            cacheEnabled: true,
          },
          type: 'general',
          period,
          adminUser: {
            id: user.id,
            email: user.email,
          },
        });

      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Analytics API error:', err);

        return errorResponse('Internal server error', 500);
      }
    }

  // Invalid type parameter
  return validationError({
    type: 'Invalid type parameter. Valid types: general, public, summary, poll, user'
  });
});

// Handle unsupported methods
export function POST() {
  return errorResponse(
    'Method not allowed. Use GET for analytics queries.',
    405,
    undefined,
    'METHOD_NOT_ALLOWED'
  );
}
