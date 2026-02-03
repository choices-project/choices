/**
 * Share Analytics API Route
 *
 * Provides comprehensive analytics for social sharing events.
 * Aggregates data from analytics_events table for share events.
 *
 * Created: January 26, 2026
 * Status: ✅ ACTIVE
 */

import { getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, forbiddenError, errorResponse } from '@/lib/api';
import { ANALYTICS_EVENTS_SHARE_SELECT_COLUMNS } from '@/lib/api/response-builders';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { devLog } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const GET = withErrorHandling(async (request: NextRequest) => {
  if (!isFeatureEnabled('SOCIAL_SHARING')) {
    return forbiddenError('Social sharing is disabled');
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') ?? '7', 10);
  const platform = searchParams.get('platform');
  const contentId = searchParams.get('content_id');
  const contentType = searchParams.get('content_type');

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return errorResponse('Database connection failed', 500);
  }

  // Build query for share analytics
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from('analytics_events')
    .select(ANALYTICS_EVENTS_SHARE_SELECT_COLUMNS)
    .eq('event_type', 'share')
    .gte('created_at', startDate);

  // Apply platform filter
  if (platform) {
    query = query.eq('event_data->>platform', platform);
  }

  // Apply content ID filter (works for poll_id, representative_id, etc.)
  if (contentId) {
    // Check multiple possible fields in event_data
    query = query.or(`event_data->>poll_id.eq.${contentId},event_data->>content_id.eq.${contentId}`);
  }

  // Apply content type filter
  if (contentType) {
    query = query.eq('event_data->>content_type', contentType);
  }

  const { data: shareEvents, error: shareError } = await query;

  if (shareError) {
    devLog('Error fetching share analytics:', shareError);
    return errorResponse('Failed to fetch share analytics', 500);
  }

  // Aggregate analytics
  const platformBreakdown: Record<string, number> = {};
  const contentTypeBreakdown: Record<string, number> = {};
  const contentShares: Record<string, number> = {};
  const timeSeries: Record<string, number> = {};

  shareEvents?.forEach((event) => {
    const eventData = event.event_data as Record<string, unknown> | null;
    const eventPlatform = (eventData?.platform as string) || 'unknown';
    const eventContentType = (eventData?.content_type as string) || 'poll';
    const eventContentId: string = (eventData?.poll_id as string) || (eventData?.content_id as string) || 'unknown';
    const eventDate: string = event.created_at ? (new Date(event.created_at).toISOString().split('T')[0] ?? 'unknown') : 'unknown';

    // Platform breakdown
    platformBreakdown[eventPlatform] = (platformBreakdown[eventPlatform] || 0) + 1;

    // Content type breakdown
    contentTypeBreakdown[eventContentType] = (contentTypeBreakdown[eventContentType] || 0) + 1;

    // Content shares (by ID)
    if (eventContentId !== 'unknown') {
      contentShares[eventContentId] = (contentShares[eventContentId] || 0) + 1;
    }

    // Time series (daily)
    timeSeries[eventDate] = (timeSeries[eventDate] || 0) + 1;
  });

  // Sort and get top content
  const topContent = Object.entries(contentShares)
    .map(([contentId, shares]) => ({ contentId, shares }))
    .sort((a, b) => b.shares - a.shares)
    .slice(0, 10);

  // Sort time series by date
  const sortedTimeSeries = Object.entries(timeSeries)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));

  return successResponse({
    analytics: {
      totalShares: shareEvents?.length || 0,
      platformBreakdown,
      contentTypeBreakdown,
      topContent,
      timeSeries: sortedTimeSeries,
      periodDays: days,
      filters: {
        platform: platform ?? 'all',
        contentId: contentId ?? 'all',
        contentType: contentType ?? 'all',
      },
    },
  });
});
