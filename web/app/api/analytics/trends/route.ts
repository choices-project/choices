/**
 * Trends Analytics API
 * 
 * Returns time-series data for votes, participation, and engagement.
 * 
 * Privacy Features:
 * - Only includes users who opted in
 * - Aggregated data only (no individual records)
 * - Access logged for audit trail
 * 
 * Access: Admin or T3 users
 * 
 * Created: November 5, 2025
 * Status: ✅ Production-ready
 */

import type { NextRequest } from 'next/server';

import { PrivacyAwareQueryBuilder } from '@/features/analytics/lib/privacyFilters';
import { applyAnalyticsCacheHeaders } from '@/lib/analytics/cache-headers';
import { withErrorHandling, forbiddenError, successResponse, errorResponse } from '@/lib/api';
import { canAccessAnalytics, logAnalyticsAccessToDatabase } from '@/lib/auth/adminGuard';
import { getCached, CACHE_TTL, CACHE_PREFIX, generateCacheKey } from '@/lib/cache/analytics-cache';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const allowT3 = true;
  if (!canAccessAnalytics(user, allowT3)) {
    await logAnalyticsAccessToDatabase(
      supabase,
      user,
      '/api/analytics/trends',
      false,
      {
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        metadata: { endpoint: 'trends', access_level: 'admin_or_t3' }
      }
    );
    return forbiddenError('Unauthorized - Admin or T3 required');
  }

  await logAnalyticsAccessToDatabase(
    supabase,
    user,
    '/api/analytics/trends',
    true,
    {
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      metadata: { endpoint: 'trends', access_level: 'admin_or_t3' }
    }
  );

  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') ?? '7d';

    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;

    // Generate cache key
    const cacheKey = generateCacheKey(CACHE_PREFIX.TRENDS, { range });

    // Try to get from cache or fetch from database
    const { data: result, fromCache } = await getCached(
      cacheKey,
      CACHE_TTL.TRENDS,
      async () => {
        // Initialize privacy-aware query builder
        const queryBuilder = new PrivacyAwareQueryBuilder(supabase);

        // Get votes from opted-in users only
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const votesQueryResult = await queryBuilder.getVoteAnalytics({
          dateRange: String(days)
        });

        const { data: votes, error: votesError } = await votesQueryResult;

        if (votesError) {
          logger.error('Failed to fetch votes for trends', { error: votesError });
          throw new Error('Failed to fetch trend data');
        }

        // Aggregate by date
        const trendsByDate = new Map<string, { votes: number; voters: Set<string> }>();

        (votes || []).forEach((vote: any) => {
          const voteDate = new Date(vote.created_at);
          if (isNaN(voteDate.getTime())) return; // Skip invalid dates
          const date = voteDate.toISOString().split('T')[0];
          if (!date) return; // Skip if date string is invalid

          let dayData = trendsByDate.get(date);
          if (!dayData) {
            dayData = { votes: 0, voters: new Set() };
            trendsByDate.set(date, dayData);
          }
          dayData.votes += 1;
        });

        // Convert to array and calculate metrics
        const trends = Array.from(trendsByDate.entries())
          .map(([date, data]) => ({
            date,
            votes: data.votes,
            participation: data.votes > 0 ? Math.min(100, (data.votes / 10)) : 0, // Simplified calc
            velocity: data.votes // Activity per day
          }))
          .sort((a, b) => a.date.localeCompare(b.date));

        logger.info('Trends data generated', {
          range,
          dataPoints: trends.length,
          totalVotes: trends.reduce((sum, t) => sum + t.votes, 0)
        });

        return {
          trends,
          range,
          generatedAt: new Date().toISOString()
        };
      }
    );

    logger.info('Trends data served', { fromCache });

    const response = successResponse({
      trends: result.trends,
      range: result.range,
      generatedAt: result.generatedAt,
      cache: {
        hit: fromCache,
        ttl: CACHE_TTL.TRENDS
      }
    });
    return applyAnalyticsCacheHeaders(response, {
      cacheKey,
      etagSeed: `${cacheKey}:${result.generatedAt}`,
      ttlSeconds: CACHE_TTL.TRENDS,
      scope: 'private',
    });
  } catch (error) {
    logger.error('Trends analytics error', error instanceof Error ? error : new Error(String(error)));
    return errorResponse(
      'Failed to load trends analytics',
      500,
      undefined,
      'ANALYTICS_RPC_FAILED'
    );
  }
});

