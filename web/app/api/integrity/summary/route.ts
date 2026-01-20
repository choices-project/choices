import { getSupabaseAdminClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, errorResponse } from '@/lib/api';
import { getIntegrityThreshold } from '@/lib/integrity/vote-integrity';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (_request: NextRequest) => {
  const supabase = await getSupabaseAdminClient();
  const threshold = getIntegrityThreshold();

  const { data: scoredRows, error: scoredError } = await (supabase as any)
    .from('vote_integrity_scores')
    .select('score')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  if (scoredError) {
    logger.error('Failed to load integrity summary', scoredError);
    return errorResponse('Failed to load integrity summary', 500);
  }

  const scores = scoredRows ?? [];
  const totalScored = scores.length;
  const excludedVotes = scores.filter((row: { score?: number }) => (row.score ?? 0) < threshold).length;
  const includedVotes = totalScored - excludedVotes;

  return successResponse({
    window_days: 30,
    integrity_threshold: threshold,
    total_scored_votes: totalScored,
    included_votes: includedVotes,
    excluded_votes: excludedVotes,
  });
});
