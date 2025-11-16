import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, validationError, errorResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/analytics/hashtag/engagement
 * Body: { pollId: string, action: 'view' | 'click' | 'share', hashtags?: string[] }
 *
 * Writes a lightweight engagement record into platform_analytics (metric_name: 'hashtag_engagement').
 * Gracefully no-ops if table is absent.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  const body = await request.json().catch(() => ({}));
  const pollId = typeof body?.pollId === 'string' ? body.pollId : '';
  const action = body?.action as 'view' | 'click' | 'share' | undefined;
  const hashtags: string[] = Array.isArray(body?.hashtags)
    ? (body.hashtags as unknown[]).map((h) => String(h)).filter((h) => h.length > 0).slice(0, 20)
    : [];

  if (!pollId || !action) {
    const errors: Record<string, string> = {};
    if (!pollId) errors.pollId = 'pollId is required';
    if (!action) errors.action = "action must be 'view' | 'click' | 'share'";
    return validationError(errors);
  }

  const actionStrict: 'view' | 'click' | 'share' = action as 'view' | 'click' | 'share';

  try {
    const payload = {
      metric_name: 'hashtag_engagement',
      metric_value: 1,
      // Use simple JSON structure to store context
      context: {
        poll_id: pollId,
        action: actionStrict,
        hashtags,
        at: new Date().toISOString(),
      } as unknown as any,
    };

    const { error } = await (supabase as any)
      .from('platform_analytics')
      .insert(payload);

    if (error) {
      // If table doesn't exist, log and continue (no throw)
      const message = error?.message ?? '';
      if (message.includes('does not exist')) {
        logger.info('platform_analytics table not available; skipping hashtag engagement write');
        return successResponse({ recorded: false, reason: 'table_missing' });
      }
      logger.error('Failed to record hashtag engagement', { error });
      return errorResponse('Failed to record engagement', 500);
    }

    return successResponse({ recorded: true });
  } catch (e) {
    logger.error('Unexpected error recording hashtag engagement', { error: e });
    return errorResponse('Unexpected error', 500);
  }
});

/**
 * GET /api/analytics/hashtag/engagement?poll_id=...&days=7
 *
 * Returns aggregated hashtag engagement counts for a poll:
 * { totals: { view: number, click: number, share: number }, since: ISOString }
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  const { searchParams } = new URL(request.url);
  const pollId = searchParams.get('poll_id') ?? '';
  const days = Number.parseInt(searchParams.get('days') ?? '7', 10);
  const since = new Date(Date.now() - (isFinite(days) ? days : 7) * 24 * 60 * 60 * 1000);
  const sinceIso = since.toISOString();

  if (!pollId) {
    return validationError({ poll_id: 'poll_id is required' });
  }

  try {
    const { data, error } = await (supabase as any)
      .from('platform_analytics')
      .select('metric_name, metric_value, created_at, context')
      .eq('metric_name', 'hashtag_engagement')
      .eq('context->>poll_id', pollId)
      .gte('created_at', sinceIso)
      .limit(5000);

    if (error) {
      const message = error?.message ?? '';
      if (message.includes('does not exist')) {
        return successResponse({ totals: { view: 0, click: 0, share: 0 }, since: sinceIso });
      }
      logger.error('Failed to read hashtag engagement analytics', { error });
      return errorResponse('Failed to read engagement analytics', 500);
    }

    const totals = { view: 0, click: 0, share: 0 } as Record<'view' | 'click' | 'share', number>;
    for (const row of Array.isArray(data) ? data : []) {
      const ctx = (row as any)?.context ?? {};
      const action = String(ctx?.action ?? '').toLowerCase();
      if (action === 'view' || action === 'click' || action === 'share') {
        totals[action] += Number((row as any)?.metric_value ?? 0) || 0;
      }
    }

    return successResponse({ totals, since: sinceIso });
  } catch (e) {
    logger.error('Unexpected error reading hashtag engagement', { error: e });
    return errorResponse('Unexpected error', 500);
  }
});


