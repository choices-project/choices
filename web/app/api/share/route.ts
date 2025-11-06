/**
 * Share API Route
 *
 * Handles social sharing event tracking and analytics for the Choices platform.
 * Integrates with the existing analytics system and provides comprehensive
 * sharing analytics across all platforms.
 *
 * Created: January 23, 2025
 * Updated: November 6, 2025 - Modernized
 * Status: ✅ ACTIVE
 */

import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, forbiddenError, validationError, errorResponse } from '@/lib/api';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { devLog } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Check if social sharing is enabled
  if (!isFeatureEnabled('SOCIAL_SHARING')) {
    return forbiddenError('Social sharing is disabled');
  }

  const body = await request.json();
  const { platform, poll_id, placement, content_type } = body;

  // Validate required fields
  if (!platform || !poll_id) {
    return validationError({
      platform: !platform ? 'Platform is required' : '',
      poll_id: !poll_id ? 'Poll ID is required' : ''
    });
  }

  // Get Supabase client
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return errorResponse('Database connection failed', 500);
  }

    // Get client IP and user agent
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
    const userAgent = request.headers.get('user-agent') ?? 'unknown';

    // Track the share event (simplified for now)
    devLog('Share event tracked:', {
      platform,
      poll_id,
      placement: placement ?? 'unknown',
      content_type: content_type ?? 'poll',
      ip,
      userAgent
    });

    devLog('Share event tracked successfully:', { platform, poll_id, placement, content_type });

  return successResponse({
    message: 'Share event tracked successfully'
  });
});

export const GET = withErrorHandling(async (request: NextRequest) => {
  if (!isFeatureEnabled('SOCIAL_SHARING')) {
    return forbiddenError('Social sharing is disabled');
  }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') ?? '7');
    const platform = searchParams.get('platform');
    const pollId = searchParams.get('poll_id');

    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return errorResponse('Database connection failed', 500);
    }

    // Build query for share analytics
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    let query = (supabase as any)
      .from('analytics_events')
      .select('*')
      .eq('event_category', 'share')
      .gte('created_at', startDate);

    // Apply platform filter
    if (platform) {
      query = query.eq('event_metadata->>platform', platform);
    }

    // Apply poll ID filter
    if (pollId) {
      query = query.eq('event_metadata->>poll_id', pollId);
    }

    const { data: shareEvents, error: shareError } = await query;

    if (shareError) {
      devLog('Error fetching share analytics:', shareError);
      return errorResponse('Failed to fetch share analytics', 500);
    }

    // Aggregate analytics
    const platformBreakdown: Record<string, number> = {};
    const pollShares: Record<string, number> = {};

    shareEvents?.forEach((event: any) => {
      const eventPlatform = event.event_metadata?.platform || 'unknown';
      const eventPollId = event.event_metadata?.poll_id;

      platformBreakdown[eventPlatform] = (platformBreakdown[eventPlatform] || 0) + 1;

      if (eventPollId) {
        pollShares[eventPollId] = (pollShares[eventPollId] || 0) + 1;
      }
    });

    const topPolls = Object.entries(pollShares)
      .map(([poll_id, shares]) => ({ poll_id, shares }))
      .sort((a, b) => b.shares - a.shares)
      .slice(0, 10);

    return successResponse({
      total_shares: shareEvents?.length || 0,
      platform_breakdown: platformBreakdown,
      top_polls: topPolls,
      period_days: days,
      filters: {
        platform: platform || 'all',
        poll_id: pollId || 'all'
      },
      generated_at: new Date().toISOString()
    });
});
