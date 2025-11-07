import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, notFoundError, errorResponse, validationError } from '@/lib/api';
import { logger } from '@/lib/utils/logger';
import { voteEngine } from '@/lib/vote/engine';
import type { PollData, VoteData } from '@/lib/vote/types';
import { getSupabaseAdminClient } from '@/utils/supabase/server';

const normalizeOptions = (options: Array<{ id: string; text?: string | null; option_text?: string | null; order_index?: number | null }>) =>
  [...options]
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map((option, index) => ({
      id: option.id,
      text: option.text ?? option.option_text ?? `Option ${index + 1}`,
      order: option.order_index ?? index,
      index,
    }));

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
    const url = new URL(request.url);
    const tierParam = url.searchParams.get('tier');
    const trustTier = tierParam ? Number.parseInt(tierParam, 10) : null;

    if (tierParam && Number.isNaN(trustTier)) {
      return validationError({ tier: 'tier must be a number' });
    }

    const { id } = params;
    if (!id) {
      return validationError({ pollId: 'Poll ID is required' });
    }

    const supabase = await getSupabaseAdminClient();

    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select(`
        id,
        is_public,
        voting_method,
        poll_options:poll_options (
          id,
          text,
          option_text,
          order_index
        )
      `)
      .eq('id', id)
      .eq('is_public', true)
      .maybeSingle<{
        id: string;
        is_public: boolean | null;
        voting_method: string | null;
        poll_options: Array<{ id: string; text?: string | null; option_text?: string | null; order_index?: number | null }>;
      }>();

    if (pollError || !poll) {
      return notFoundError('Poll not found');
    }

    const votingMethod = (poll.voting_method ?? 'single').toLowerCase();
    const normalizedOptions = normalizeOptions(poll.poll_options ?? []);

    if (votingMethod === 'ranked') {
      const { data: ballots, error: ballotsError } = await supabase
        .from('poll_rankings')
        .select('id, rankings, user_id, created_at')
        .eq('poll_id', id);

      if (ballotsError) {
        logger.error('Ranked results ballot query error:', ballotsError);
        return errorResponse('Failed to get ranked results', 500);
      }

      const pollData: PollData = {
        id,
        title: 'Ranked Poll',
        votingMethod: 'ranked',
        options: normalizedOptions.map((option) => ({
          id: option.index.toString(),
          text: option.text,
        })),
        status: 'active',
        createdBy: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        votingConfig: {},
      };

      const voteData: VoteData[] = (ballots ?? []).map((ballot) => {
        const rankingSequence = (ballot.rankings ?? [])
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value));

        const base: VoteData = {
          id: ballot.id,
          pollId: id,
          rankings: rankingSequence,
          privacyLevel: 'public',
          timestamp: new Date(ballot.created_at ?? new Date().toISOString()),
          auditReceipt: ballot.id,
        };

        if (ballot.user_id) {
          base.userId = ballot.user_id;
        }

        return base;
      });

      const engineResults = await voteEngine.calculateResults(pollData, voteData);
      const optionVotes = engineResults.results.optionVotes ?? {};
      const optionPercentages = engineResults.results.optionPercentages ?? {};
      const bordaScores = engineResults.results.bordaScores ?? {};

      const optionStats = normalizedOptions.map((option) => ({
        option_id: option.index.toString(),
        option_index: option.index,
        text: option.text,
        first_choice_votes: optionVotes[option.index.toString()] ?? 0,
        first_choice_percentage: optionPercentages[option.index.toString()] ?? 0,
        borda_score: bordaScores[option.index.toString()] ?? 0,
      }));

      return successResponse({
        poll_id: id,
        voting_method: 'ranked',
        total_votes: engineResults.totalVotes,
        rounds: engineResults.results.instantRunoffRounds ?? [],
        winner: engineResults.results.winner ?? null,
        option_stats: optionStats,
      });
    }

    const { data: results, error: resultsError } = await supabase
      .rpc('get_poll_results_by_trust_tier', {
        p_poll_id: id,
        p_trust_tier: trustTier,
      });

    if (resultsError) {
      logger.error('Results query error:', resultsError);
      return errorResponse('Failed to get results', 500);
    }

    const rows = Array.isArray(results) ? results : [];
    const totalVotes = rows.reduce((sum: number, row: any) => sum + (row?.vote_count ?? 0), 0);

    const optionTextMap = new Map(normalizedOptions.map((option) => [option.id, option.text]));
    const optionTotals = rows.map((row: any) => ({
      option_id: row?.option_id ?? '',
      option_text: optionTextMap.get(row?.option_id ?? '') ?? row?.option_text ?? 'Option',
      vote_count: row?.vote_count ?? 0,
      percentage: totalVotes > 0 ? ((row?.vote_count ?? 0) / totalVotes) * 100 : 0,
    }));

    return successResponse({
      poll_id: id,
      voting_method: votingMethod,
      trust_tier_filter: trustTier,
      results: optionTotals,
      total_votes: totalVotes,
    });
});
