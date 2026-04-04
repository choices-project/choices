/**
 * Admin Vote Audit API
 *
 * GET /api/admin/polls/[id]/vote-audit
 *
 * Returns vote history for a poll (who voted when, option) for admin investigations.
 * Admin-only. Uses service role to bypass RLS.
 *
 * Supports both:
 * - Regular votes (votes table): single, approval, multiple choice
 * - Ranked votes (poll_rankings table): ranked choice
 *
 * Created: March 2026 (ROADMAP 3.7 Voting Integrity)
 */

import { getSupabaseAdminClient } from '@/utils/supabase/server';

import { requireAdminOr401 } from '@/features/auth/lib/admin-auth';

import { errorResponse, notFoundError, successResponse, withErrorHandling } from '@/lib/api';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

type VoteAuditEntry = {
  id: string;
  userId: string | null;
  displayName: string | null;
  optionText: string | null;
  optionId: string | null;
  rankings: number[] | null;
  createdAt: string;
  source: 'votes' | 'poll_rankings';
};

export const GET = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const authGate = await requireAdminOr401();
  if (authGate) return authGate;

  const { id: pollId } = await params;
  if (!pollId) {
    return notFoundError('Poll ID required');
  }

  const adminClient = await getSupabaseAdminClient();
  if (!adminClient) {
    return errorResponse('Database unavailable', 500);
  }

  // Verify poll exists and get voting method + options
  const { data: poll, error: pollError } = await adminClient
    .from('polls')
    .select('id, voting_method, poll_options:poll_options(id, text, option_text, order_index)')
    .eq('id', pollId)
    .maybeSingle<{
      id: string;
      voting_method: string | null;
      poll_options: Array<{ id: string; text?: string | null; option_text?: string | null; order_index?: number | null }>;
    }>();

  if (pollError || !poll) {
    return notFoundError('Poll not found');
  }

  const votingMethod = (poll.voting_method ?? 'single').toLowerCase();
  const options = (poll.poll_options ?? []).sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  const optionById = Object.fromEntries(
    options.map((o) => [o.id, o.text ?? o.option_text ?? `Option ${o.id}`])
  );

  const entries: VoteAuditEntry[] = [];

  // Fetch regular votes (single, approval, multiple)
  const { data: votes, error: votesError } = await adminClient
    .from('votes')
    .select(`
      id,
      user_id,
      option_id,
      poll_option_id,
      created_at
    `)
    .eq('poll_id', pollId)
    .order('created_at', { ascending: false });

  if (!votesError && votes) {
    for (const v of votes) {
      const optionId = v.poll_option_id ?? v.option_id;
      entries.push({
        id: v.id,
        userId: v.user_id,
        displayName: null,
        optionText: optionById[optionId] ?? optionId ?? null,
        optionId: optionId ?? null,
        rankings: null,
        createdAt: v.created_at ?? '',
        source: 'votes',
      });
    }
  }

  // Fetch ranked votes
  const { data: rankings, error: rankingsError } = await adminClient
    .from('poll_rankings')
    .select('id, user_id, rankings, created_at')
    .eq('poll_id', pollId)
    .order('created_at', { ascending: false });

  if (!rankingsError && rankings) {
    for (const r of rankings) {
      const rankLabels = (r.rankings ?? []).map((idx) => {
        const opt = options[idx];
        return opt ? (opt.text ?? opt.option_text ?? `Option ${idx + 1}`) : `#${idx + 1}`;
      });
      entries.push({
        id: r.id,
        userId: r.user_id,
        displayName: null,
        optionText: rankLabels.length > 0 ? rankLabels.join(' > ') : null,
        optionId: null,
        rankings: r.rankings ?? null,
        createdAt: r.created_at ?? '',
        source: 'poll_rankings',
      });
    }
  }

  // Enrich with display names for user_ids we have
  const userIds = [...new Set(entries.map((e) => e.userId).filter(Boolean))] as string[];
  let displayNames: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await adminClient
      .from('user_profiles')
      .select('user_id, display_name')
      .in('user_id', userIds);
    if (profiles) {
      displayNames = Object.fromEntries(
        profiles.map((p) => [p.user_id, p.display_name ?? '(no name)'])
      );
    }
  }

  const enriched = entries.map((e) => ({
    ...e,
    displayName: e.userId ? (displayNames[e.userId] ?? null) : null,
  }));

  // Sort by createdAt desc
  enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return successResponse({
    pollId,
    votingMethod,
    totalEntries: enriched.length,
    entries: enriched,
  });
});
