import type { NextRequest } from 'next/server';
import { withErrorHandling, successResponse, validationError, errorResponse } from '@/lib/api';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { logger } from '@/lib/utils/logger';

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
  const hashtags = Array.isArray(body?.hashtags)
    ? (body.hashtags as string[]).filter((h) => typeof h === 'string').slice(0, 20)
    : [];

  if (!pollId || !action) {
    return validationError({
      pollId: !pollId ? 'pollId is required' : undefined,
      action: !action ? "action must be 'view' | 'click' | 'share'" : undefined,
    });
  }

  try {
    const payload = {
      metric_name: 'hashtag_engagement',
      metric_value: 1,
      // Use simple JSON structure to store context
      context: {
        poll_id: pollId,
        action,
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


