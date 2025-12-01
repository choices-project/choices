/**
 * Temporal Analytics API
 *
 * Returns temporal patterns showing when users are most active.
 * Analyzes hourly, daily, and velocity patterns.
 *
 * Privacy Features:
 * - Only includes users who opted in
 * - Aggregated time-based data only
 * - No individual timestamps exposed
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
import { canAccessAnalytics, logAnalyticsAccess } from '@/lib/auth/adminGuard';
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
    logAnalyticsAccess(user, 'temporal-api', false);
    return forbiddenError('Unauthorized - Admin or T3 required');
  }

  logAnalyticsAccess(user, 'temporal-api', true);

  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') ?? '30d';
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;

    // Generate cache key
    const cacheKey = generateCacheKey(CACHE_PREFIX.TEMPORAL, { range });

    // Try to get from cache or fetch from database
    const { data: result, fromCache } = await getCached(
      cacheKey,
      CACHE_TTL.TEMPORAL,
      async () => {
        // Initialize privacy-aware query builder
        const queryBuilder = new PrivacyAwareQueryBuilder(supabase);

        // Get votes from opted-in users only
        const votesQueryResult = await queryBuilder.getVoteAnalytics({
          dateRange: String(days)
        });

        const { data: votes, error: votesError } = await votesQueryResult;

        if (votesError) {
          logger.error('Failed to fetch votes for temporal analysis', { error: votesError });
          throw new Error('Failed to fetch temporal data');
        }

        // Analyze hourly patterns (0-23)
        const hourlyActivity = new Array(24).fill(0);

        // Analyze daily patterns (Mon-Sun)
        const dailyActivity = new Array(7).fill(0);
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        // Analyze velocity (activity over time)
        const velocityByDate = new Map<string, number>();

        (votes ?? []).forEach((vote: any) => {
          const date = new Date(vote.created_at);
          if (isNaN(date.getTime())) return; // Skip invalid dates

          // Hour of day (0-23)
          const hour = date.getHours();
          hourlyActivity[hour]++;

          // Day of week (0=Sunday, 1=Monday, etc.)
          let dayIndex = date.getDay();
          // Convert to Monday=0 format
          dayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
          dailyActivity[dayIndex]++;

          // Velocity (activity per date)
          const dateKey = date.toISOString().split('T')[0];
          if (dateKey) {
            velocityByDate.set(dateKey, (velocityByDate.get(dateKey) ?? 0) + 1);
          }
        });

        // Format hourly data
        const formatHour = (hour: number): string => {
          if (hour === 0) return '12 AM';
          if (hour === 12) return '12 PM';
          if (hour < 12) return `${hour} AM`;
          return `${hour - 12} PM`;
        };

        const hourly = hourlyActivity.map((activity, hour) => ({
          hour,
          activity,
          label: formatHour(hour)
        }));

        // Format daily data
        const daily = dailyActivity.map((activity, dayIndex) => ({
          day: dayNames[dayIndex],
          activity,
          dayIndex
        }));

        // Format velocity data (last 30 days)
        const velocity = Array.from(velocityByDate.entries())
          .map(([timestamp, velocity]) => ({
            timestamp,
            velocity
          }))
          .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
          .slice(-30); // Last 30 days

        // Calculate insights
        const defaultHour = { hour: 0, activity: 0, label: '12 AM' };
        const defaultDay = { day: 'Monday', activity: 0, dayIndex: 0 };

        const peakHour = hourly.length > 0 && hourly[0]
          ? hourly.reduce((max, curr) => (curr.activity > max.activity ? curr : max), hourly[0])
          : defaultHour;

        const peakDay = daily.length > 0 && daily[0]
          ? daily.reduce((max, curr) => (curr.activity > max.activity ? curr : max), daily[0])
          : defaultDay;

        const avgActivity = (votes?.length ?? 0) / days;

        logger.info('Temporal data generated', {
          range,
          totalVotes: votes?.length ?? 0,
          peakHour: peakHour.label,
          peakDay: peakDay.day
        });

        return {
          hourly,
          daily,
          velocity,
          peakHour: peakHour.hour,
          peakDay: peakDay.day,
          avgActivity,
          generatedAt: new Date().toISOString()
        };
      }
    );

    // Return with cache metadata
    const response = successResponse({
      hourly: result.hourly,
      daily: result.daily,
      velocity: result.velocity,
      peakHour: result.peakHour,
      peakDay: result.peakDay,
      avgActivity: result.avgActivity,
      generatedAt: result.generatedAt,
      cache: {
        hit: fromCache,
        ttl: CACHE_TTL.TEMPORAL,
        key: cacheKey
      }
    });
    return applyAnalyticsCacheHeaders(response, {
      cacheKey,
      etagSeed: `${cacheKey}:${result.generatedAt}`,
      ttlSeconds: CACHE_TTL.TEMPORAL,
      scope: 'private',
    });
  } catch (error) {
    logger.error('Temporal analytics error', error instanceof Error ? error : new Error(String(error)));
    return errorResponse(
      'Failed to load temporal analytics',
      500,
      undefined,
      'ANALYTICS_RPC_FAILED'
    );
  }
});

