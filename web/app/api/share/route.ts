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

import { getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, forbiddenError, validationError, errorResponse } from '@/lib/api';
import { ANALYTICS_EVENTS_SHARE_SELECT_COLUMNS } from '@/lib/api/response-builders';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { devLog } from '@/lib/utils/logger';

import type { Json, TablesInsert } from '@/types/supabase';
import type { NextRequest } from 'next/server';


export const POST = withErrorHandling(async (request: NextRequest) => {
  // Check if social sharing is enabled
  if (!isFeatureEnabled('SOCIAL_SHARING')) {
    return forbiddenError('Social sharing is disabled');
  }

  const body = await request.json().catch(() => ({}));
  const platformRaw = typeof body?.platform === 'string' ? body.platform : '';
  const pollIdRaw = typeof body?.poll_id === 'string' ? body.poll_id : '';
  const placementRaw = typeof body?.placement === 'string' ? body.placement : undefined;
  const contentTypeRaw = typeof body?.content_type === 'string' ? body.content_type : undefined;

  // Validate platform/content_type via allowlists; coerce unknowns
  const allowedPlatforms = new Set(['twitter','facebook','reddit','copy','link','whatsapp','telegram','email','instagram','unknown']);
  const allowedContentTypes = new Set(['poll','candidate','representative','other']);
  const platform = allowedPlatforms.has(platformRaw.toLowerCase()) ? platformRaw.toLowerCase() : 'unknown';
  const content_type = contentTypeRaw && allowedContentTypes.has(contentTypeRaw.toLowerCase())
    ? contentTypeRaw.toLowerCase()
    : 'poll';
  const poll_id = pollIdRaw;
  const placement = placementRaw?.slice(0, 64) ?? 'unknown';

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

    // Basic bot/UA filtering (best-effort, privacy-preserving)
    const userAgent = request.headers.get('user-agent') ?? 'unknown';
    const isBot = /bot|crawler|spider|slurp|facebookexternalhit|mediapartners-google/i.test(userAgent);
    if (isBot) {
      return successResponse({ recorded: false, reason: 'bot' });
    }

    // Persist analytics event according to typed schema
    // event_data is Json type which accepts Record<string, unknown>
    const payload: TablesInsert<'analytics_events'> = {
      event_type: 'share',
      event_data: {
        platform,
        poll_id,
        placement: placement ?? 'unknown',
        content_type: content_type ?? 'poll'
      } as Json,
      user_agent: userAgent,
      referrer: request.headers.get('referer'),
      // ip_address is unknown-typed; omit to avoid type issues across environments
      created_at: new Date().toISOString()
    };
    const { error } = await supabase
      .from('analytics_events')
      .insert(payload);
    if (error) {
      devLog('Share analytics insert failed (non-blocking)', { error });
    }

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

    let query = supabase
      .from('analytics_events')
      .select(ANALYTICS_EVENTS_SHARE_SELECT_COLUMNS)
      .eq('event_type', 'share')
      .gte('created_at', startDate);

    // Apply platform filter
    if (platform) {
      query = query.eq('event_data->>platform', platform);
    }

    // Apply poll ID filter
    if (pollId) {
      query = query.eq('event_data->>poll_id', pollId);
    }

    const { data: shareEvents, error: shareError } = await query;

    if (shareError) {
      devLog('Error fetching share analytics:', shareError);
      return errorResponse('Failed to fetch share analytics', 500);
    }

    // Aggregate analytics
    const platformBreakdown: Record<string, number> = {};
    const pollShares: Record<string, number> = {};

    shareEvents?.forEach((event) => {
      const eventData = event.event_data as Record<string, unknown> | null;
      const eventPlatform = (eventData?.platform as string) || 'unknown';
      const eventPollId = eventData?.poll_id as string | undefined;

      platformBreakdown[eventPlatform] = (platformBreakdown[eventPlatform] || 0) + 1;

      if (eventPollId) {
        pollShares[eventPollId] = (pollShares[eventPollId] || 0) + 1;
      }
    });

    const topPolls = Object.entries(pollShares)
      .map(([pollId, shares]) => ({ pollId, shares }))
      .sort((a, b) => b.shares - a.shares)
      .slice(0, 10);

    return successResponse({
      analytics: {
        totalShares: shareEvents?.length || 0,
        platformBreakdown,
        topPolls,
        periodDays: days,
        filters: {
          platform: platform ?? 'all',
          pollId: pollId ?? 'all'
        }
      }
    });
});
