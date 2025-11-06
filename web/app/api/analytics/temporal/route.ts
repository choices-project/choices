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

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { canAccessAnalytics, logAnalyticsAccess } from '@/lib/auth/adminGuard';
import { PrivacyAwareQueryBuilder } from '@/features/analytics/lib/privacyFilters';
import { logger } from '@/lib/utils/logger';
import { getCached, CACHE_TTL, CACHE_PREFIX, generateCacheKey } from '@/lib/cache/analytics-cache';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Access control - Admin or T3
    const allowT3 = true; // Temporal patterns are less sensitive
    if (!canAccessAnalytics(user, allowT3)) {
      logAnalyticsAccess(user, 'temporal-api', false);
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    logAnalyticsAccess(user, 'temporal-api', true);

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '30d';
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

    (votes || []).forEach((vote: any) => {
      const date = new Date(vote.created_at);
      
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
      velocityByDate.set(dateKey, (velocityByDate.get(dateKey) || 0) + 1);
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
    const peakHour = hourly.reduce((max, curr) => 
      curr.activity > max.activity ? curr : max
    , hourly[0]);

    const peakDay = daily.reduce((max, curr) => 
      curr.activity > max.activity ? curr : max
    , daily[0]);

    const avgActivity = (votes?.length || 0) / days;

    logger.info('Temporal data generated', {
      range,
      totalVotes: votes?.length || 0,
      peakHour: peakHour.label,
      peakDay: peakDay.day
    });

        return {
          ok: true,
          hourly,
          daily,
          velocity,
          peakHour: peakHour.hour,
          peakDay: peakDay.day,
          avgActivity,
          generated_at: new Date().toISOString()
        };
      }
    );

    // Return with cache metadata
    return NextResponse.json({
      ...result,
      _cache: {
        hit: fromCache,
        ttl: CACHE_TTL.TEMPORAL,
        key: cacheKey
      }
    });

  } catch (error) {
    logger.error('Temporal API error', { error });
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

