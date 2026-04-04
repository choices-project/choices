/**
 * Poll Activity API
 *
 * Returns daily vote counts for the last 7 days for public polls.
 * Used for sparkline trend charts on poll detail page.
 *
 * GET /api/polls/[id]/activity
 * Response: { data: Array<{ date: string; count: number }> }
 */

import { getSupabaseAdminClient } from '@/utils/supabase/server';

import { withErrorHandling, notFoundError, successResponse, validationError } from '@/lib/api';

import type { NextRequest } from 'next/server';

const DAYS = 7;

export const GET = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: pollId } = await params;
  if (!pollId) {
    return validationError({ pollId: 'Poll ID is required' });
  }

  const supabase = await getSupabaseAdminClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - DAYS);
  const startIso = startDate.toISOString();

  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select('id, is_public, voting_method')
    .eq('id', pollId)
    .maybeSingle();

  if (pollError || !poll) {
    return notFoundError('Poll not found');
  }

  if (!poll.is_public) {
    return notFoundError('Poll not found');
  }

  const votingMethod = (poll.voting_method ?? 'single').toLowerCase();
  const dailyCounts = new Map<string, number>();

  if (votingMethod === 'ranked') {
    const { data: rankings } = await supabase
      .from('poll_rankings')
      .select('created_at')
      .eq('poll_id', pollId)
      .gte('created_at', startIso);

    (rankings ?? []).forEach((r: { created_at: string | null }) => {
      if (r.created_at) {
        const key = r.created_at.split('T')[0] ?? '';
        if (key) dailyCounts.set(key, (dailyCounts.get(key) ?? 0) + 1);
      }
    });
  } else {
    const { data: votes } = await supabase
      .from('votes')
      .select('created_at')
      .eq('poll_id', pollId)
      .gte('created_at', startIso);

    (votes ?? []).forEach((v: { created_at: string | null }) => {
      if (v.created_at) {
        const key = v.created_at.split('T')[0] ?? '';
        if (key) dailyCounts.set(key, (dailyCounts.get(key) ?? 0) + 1);
      }
    });
  }

  const dates: string[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0] ?? '');
  }

  const data = dates.map((date) => ({
    date,
    count: dailyCounts.get(date) ?? 0,
  }));

  return successResponse({ data });
});
