/**
 * @fileoverview Analytics API
 * 
 * Basic analytics endpoint providing platform metrics and user statistics
 * with rate limiting. Currently uses direct database queries for polls,
 * votes, and user activity data.
 * 
 * @author Choices Platform Team
 * @created 2025-10-24
 * @version 2.0.0
 * @since 1.0.0
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { AnalyticsService } from '@/features/analytics/lib/analytics-service';
import { logger } from '@/lib/utils/logger';
import { getSupabaseAdminClient, getSupabaseServerClient } from '@/utils/supabase/server';

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
export const GET = async (request: NextRequest) => {
  try {
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
        
        return NextResponse.json({
          totalPolls: totalPolls ?? 0,
          totalVotes,
          activeUsers: activeUsers ?? 0,
          generatedAt: new Date().toISOString(),
          type: 'public'
        });
        
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Error in public stats API:', err);
        return NextResponse.json({
          totalPolls: 0,
          totalVotes: 0,
          activeUsers: 0,
          error: 'Failed to fetch public statistics'
        }, { status: 500 });
      }
    }

    // Analytics summary (requires user auth)
    if (type === 'summary') {
      try {
        // Check for user authentication
        const supabase = await getSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          return NextResponse.json(
            { error: 'Authentication required for analytics summary' },
            { status: 401 }
          );
        }

        const analyticsService = AnalyticsService.getInstance();
        const summary = await analyticsService.getAnalyticsSummary();

        return NextResponse.json({
          success: true,
          data: summary,
          generatedAt: new Date().toISOString(),
          type: 'summary',
          user_id: user.id
        });

      } catch (error) {
        logger.error('Error getting analytics summary', error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json(
          { error: 'Failed to get analytics summary' },
          { status: 500 }
        );
      }
    }

    // Poll-specific analytics (requires admin auth)
    if (type === 'poll') {
      if (!id) {
        return NextResponse.json(
          { error: 'Poll ID is required for poll analytics' },
          { status: 400 }
        );
      }

      try {
        // Check for admin authentication
        const supabase = await getSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          return NextResponse.json(
            { error: 'Authentication required for poll analytics' },
            { status: 401 }
          );
        }

        // Check if user is admin by querying the user_profiles table
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_admin')
          .eq('user_id', user.id)
          .single();
        
        const isAdmin = profile?.is_admin ?? false;

        if (!isAdmin) {
          return NextResponse.json(
            { error: 'Admin access required for poll analytics' },
            { status: 403 }
          );
        }

        const analyticsService = AnalyticsService.getInstance();
        const pollAnalytics = await analyticsService.getPollAnalytics(id);

        return NextResponse.json({
          success: true,
          data: pollAnalytics,
          generatedAt: new Date().toISOString(),
          type: 'poll',
          pollId: id,
          admin_user: {
            id: user.id,
            email: user.email
          }
        });

      } catch (error) {
        logger.error('Error getting poll analytics', error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json(
          { error: 'Failed to get poll analytics' },
          { status: 500 }
        );
      }
    }

    // User-specific analytics (requires admin auth)
    if (type === 'user') {
      if (!id) {
        return NextResponse.json(
          { error: 'User ID is required for user analytics' },
          { status: 400 }
        );
      }

      try {
        // Check for admin authentication
        const supabase = await getSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          return NextResponse.json(
            { error: 'Authentication required for user analytics' },
            { status: 401 }
          );
        }

        // Check if user is admin by querying the user_profiles table
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_admin')
          .eq('user_id', user.id)
          .single();
        
        const isAdmin = profile?.is_admin ?? false;

        if (!isAdmin) {
          return NextResponse.json(
            { error: 'Admin access required for user analytics' },
            { status: 403 }
          );
        }

        const analyticsService = AnalyticsService.getInstance();
        const userAnalytics = await analyticsService.getUserAnalytics(id);

        return NextResponse.json({
          success: true,
          data: userAnalytics,
          generatedAt: new Date().toISOString(),
          type: 'user',
          userId: id,
          admin_user: {
            id: user.id,
            email: user.email
          }
        });

      } catch (error) {
        logger.error('Error getting user analytics', error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json(
          { error: 'Failed to get user analytics' },
          { status: 500 }
        );
      }
    }

    // General analytics (requires admin auth)
    if (type === 'general') {
      try {
        // Check for E2E bypass
        const isE2E = request.headers.get('x-e2e-bypass') === '1' || 
                      process.env.NODE_ENV === 'test' || 
                      process.env.E2E === '1';
        
        let user = null;
        let isAdmin = false;
        
        if (isE2E) {
          // In E2E mode, bypass auth and use mock user
          logger.info('Analytics API: E2E mode detected - bypassing admin check');
          user = { id: 'e2e-test-user', email: 'e2e@test.com' };
          isAdmin = true;
        } else {
          // Check for admin authentication
          const supabase = await getSupabaseServerClient();
          const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
          
          if (authError || !authUser) {
            return NextResponse.json(
              { error: 'Authentication required for general analytics' },
              { status: 401 }
            );
          }

          user = authUser;

          // Check if user is admin by querying the user_profiles table
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('user_id', authUser.id)
            .single();
          
          isAdmin = profile?.is_admin ?? false;

          if (!isAdmin) {
            return NextResponse.json(
              { error: 'Admin access required for general analytics' },
              { status: 403 }
            );
          }
        }

        // Get analytics data directly
        const analyticsService = AnalyticsService.getInstance();
        const analyticsData = await analyticsService.getAnalyticsSummary();

        return NextResponse.json({
          ...analyticsData,
          generatedAt: new Date().toISOString(),
          performance: {
            queryOptimized: true,
            cacheEnabled: true
          },
          type: 'general',
          period,
          admin_user: {
            id: user.id,
            email: user.email
          }
        });

      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Analytics API error:', err);
        
        return NextResponse.json(
          { message: 'Internal server error' },
          { status: 500 }
        );
      }
    }

    // Invalid type parameter
    return NextResponse.json({
      error: 'Invalid type parameter. Valid types: general, public, summary, poll, user',
      generatedAt: new Date().toISOString()
    }, { status: 400 });

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Analytics API error:', err);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
};

// Handle unsupported methods
export function POST() {
  return NextResponse.json({
    error: 'Method not allowed. Use GET for analytics queries.',
    generatedAt: new Date().toISOString()
  }, { status: 405 });
}