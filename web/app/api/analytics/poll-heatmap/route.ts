/**
 * Poll Heatmap Analytics API
 *
 * Returns poll engagement data showing which polls are "hot" right now.
 *
 * Features:
 * - Engagement scoring (votes + unique voters)
 * - Category filtering
 * - Limit controls (top N polls)
 * - Privacy-aware (only opted-in users counted)
 * - Access control (admin-only)
 *
 * Access: Admin-only
 *
 * Created: November 5, 2025
 * Status: ✅ Production-ready
 */

import type { NextRequest } from 'next/server';

import { PrivacyAwareQueryBuilder } from '@/features/analytics/lib/privacyFilters';
import { withErrorHandling, forbiddenError, successResponse, errorResponse } from '@/lib/api';
import { canAccessAnalytics, logAnalyticsAccess } from '@/lib/auth/adminGuard';
import { getCached, CACHE_TTL, CACHE_PREFIX, generateCacheKey } from '@/lib/cache/analytics-cache';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export const GET = withErrorHandling(async (request: NextRequest): Promise<any> => {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!canAccessAnalytics(user, false)) {
    logAnalyticsAccess(user, 'poll-heatmap-api', false);
    return forbiddenError('Unauthorized - Admin access required');
  }

  logAnalyticsAccess(user, 'poll-heatmap-api', true);

  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') ?? '20');

    // Generate cache key
    const cacheKey = generateCacheKey(CACHE_PREFIX.POLL_HEATMAP, { category, limit });

    // Try to get from cache or fetch from database
    const { data: result, fromCache } = await getCached(
      cacheKey,
      CACHE_TTL.POLL_HEATMAP,
      async () => {
        // Initialize privacy-aware query builder
        const queryBuilder = new PrivacyAwareQueryBuilder(supabase);

        // Get all polls
        let pollsQuery = supabase
          .from('polls')
          .select('id, title, hashtags, created_at, status, total_votes');

        // Apply category filter
        if (category && category !== 'All Categories') {
          pollsQuery = pollsQuery.eq('category', category);
        }

        const { data: polls, error: pollsError } = await pollsQuery;

        if (pollsError) {
          logger.error('Failed to fetch polls for heatmap', { error: pollsError });
          throw new Error('Failed to fetch polls');
        }

        if (!polls || polls.length === 0) {
          return {
            polls: [],
            categories: []
          };
        }

        // Get votes for these polls (from opted-in users only)
        const pollIds = polls.map(p => p.id);

        const votesQueryResult = await queryBuilder.getVoteAnalytics({});
        const { data: allVotes, error: votesError } = votesQueryResult;

        if (votesError) {
          logger.error('Failed to fetch votes for poll heatmap', { error: votesError });
          throw new Error('Failed to fetch votes');
        }

        // Filter votes for our polls only
        const relevantVotes = (allVotes || []).filter((v: any) => pollIds.includes(v.poll_id));

        // Calculate engagement metrics per poll
        const pollMetrics = polls.map(poll => {
          const pollVotes = relevantVotes.filter(v => v.poll_id === poll.id);
          const totalVotes = pollVotes.length;
          const uniqueVoters = new Set(pollVotes.map(v => v.user_id)).size;

          const engagementScore = (totalVotes * 0.4) + (uniqueVoters * 0.6);

          const isActive = poll.status === 'active';

          return {
            poll_id: poll.id,
            title: poll.title,
            category: poll.hashtags?.[0] ?? 'general',
            total_votes: totalVotes,
            unique_voters: uniqueVoters,
            engagement_score: engagementScore,
            created_at: poll.created_at,
            is_active: isActive
          };
        });

        // Sort by engagement score (highest first) and apply limit
        const sortedPolls = pollMetrics
          .sort((a, b) => b.engagement_score - a.engagement_score)
          .slice(0, limit);

        // Get unique categories (from hashtags)
        const categories = Array.from(new Set(pollMetrics.map(p => p.category))).sort();

        logger.info('Poll heatmap data generated', {
          category: category ?? 'all',
          limit,
          pollsReturned: sortedPolls.length,
          totalVotesAnalyzed: allVotes?.length ?? 0
        });

        return {
          polls: sortedPolls,
          categories
        };
      }
    );

    logger.info('Poll heatmap data served', { fromCache });

    return successResponse({
      polls: result.polls,
      categories: result.categories,
      cache: {
        hit: fromCache,
        ttl: CACHE_TTL.POLL_HEATMAP
      }
    });
  } catch (error) {
    logger.error('Poll heatmap analytics error', error instanceof Error ? error : new Error(String(error)));
    return errorResponse('Failed to load poll heatmap analytics', 500);
  }
});

