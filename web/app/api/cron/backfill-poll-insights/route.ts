'use server'

/**
 * Cron: Backfill Poll Demographic Insights
 *
 * Iterates all polls and invokes update_poll_demographic_insights(poll_id)
 * to precompute entries in poll_demographic_insights.
 *
 * Security: Requires CRON_SECRET header matching env CRON_SECRET.
 */

import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, errorResponse, forbiddenError } from '@/lib/api';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { devLog } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const providedSecret = request.headers.get('x-cron-secret') ?? request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const expectedSecret = process.env.CRON_SECRET ?? '';
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return forbiddenError('Invalid cron secret');
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  // Iterate polls with simple pagination to avoid large memory usage
  const pageSize = 200;
  let page = 0;
  let processed = 0;
  let updated = 0;
  let errors = 0;

  while (true) {
    const { data: polls, error } = await supabase
      .from('polls')
      .select('id')
      .order('created_at', { ascending: true })
      .range(page * pageSize, page * pageSize + pageSize - 1);

    if (error) {
      devLog('Error reading polls for backfill', { error, page });
      return errorResponse('Failed to load polls for backfill', 500);
    }

    if (!polls || polls.length === 0) {
      break;
    }

    for (const poll of polls) {
      processed++;
      try {
        const pollId: string = (poll as { id: string }).id;
        const { error: rpcError } = await supabase
          .rpc('update_poll_demographic_insights', { p_poll_id: pollId });
        if (rpcError) {
          errors++;
          devLog('Backfill RPC error', { pollId, error: rpcError });
        } else {
          updated++;
        }
      } catch (e) {
        errors++;
        devLog('Unexpected error in backfill loop', { error: e });
      }
    }

    page++;
    if (polls.length < pageSize) {
      break;
    }
  }

  return successResponse({
    message: 'Backfill complete',
    processed,
    updated,
    errors
  });
});

export const GET = withErrorHandling(async () => errorResponse('Method not allowed', 405));
export const PUT = withErrorHandling(async () => errorResponse('Method not allowed', 405));
export const DELETE = withErrorHandling(async () => errorResponse('Method not allowed', 405));


