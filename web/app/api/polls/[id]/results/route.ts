import { getSupabaseAdminClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, notFoundError, errorResponse, validationError } from '@/lib/api';
import { getIntegrityThreshold } from '@/lib/integrity/vote-integrity';
import { logger } from '@/lib/utils/logger';
import { voteEngine } from '@/lib/vote/engine';
import type { PollData, VoteData } from '@/lib/vote/types';

import type { NextRequest } from 'next/server';


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
    const integrityParam = url.searchParams.get('integrity');
    const trustTier = tierParam ? Number.parseInt(tierParam, 10) : null;
    const includeAllVotes = integrityParam === 'all';
    const integrityThreshold = getIntegrityThreshold();

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

      let filteredBallots = ballots ?? [];
      let scoredBallotIds = new Set<string>();
      let excludedBallots = 0;

      if (!includeAllVotes && filteredBallots.length > 0) {
        const ballotIds = filteredBallots.map((ballot) => ballot.id);
        const { data: scoreRows, error: scoreError } = await (supabase as any)
          .from('vote_integrity_scores')
          .select('vote_id, score')
          .eq('poll_id', id)
          .eq('vote_type', 'ranked')
          .in('vote_id', ballotIds);

        if (scoreError) {
          logger.warn('Integrity score lookup failed for ranked ballots', scoreError);
        } else {
          scoredBallotIds = new Set(
            (scoreRows ?? [])
              .filter((row: { score?: number }) => (row.score ?? 0) >= integrityThreshold)
              .map((row: { vote_id?: string | null }) => row.vote_id)
              .filter(Boolean) as string[]
          );
          excludedBallots = ballotIds.filter((idValue) => !scoredBallotIds.has(idValue)).length;
          
          // Include unscored ballots that are very recent (within last 5 seconds) to handle async integrity scoring
          // This ensures newly submitted votes appear immediately even if integrity scoring hasn't completed
          const now = Date.now();
          const recentCutoff = new Date(now - 5000).toISOString();
          
          // Include both scored ballots and very recent unscored ballots
          filteredBallots = filteredBallots.filter(
            (ballot) => scoredBallotIds.has(ballot.id) || (ballot.created_at && ballot.created_at >= recentCutoff)
          );
        }
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

      const voteData: VoteData[] = filteredBallots.map((ballot) => {
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
        integrity: {
          mode: includeAllVotes ? 'all' : 'verified',
          threshold: integrityThreshold,
          raw_total_votes: (ballots ?? []).length,
          excluded_votes: excludedBallots,
          scored_votes: scoredBallotIds.size,
          unscored_votes: Math.max((ballots ?? []).length - scoredBallotIds.size, 0),
        },
      });
    }

    const { data: voteRows, error: votesError } = await supabase
      .from('votes')
      .select('id, option_id')
      .eq('poll_id', id);

    if (votesError) {
      logger.error('Results vote query error:', votesError);
      return errorResponse('Failed to get results', 500);
    }

    let filteredVotes = voteRows ?? [];
    const rawTotalVotes = filteredVotes.length;

    if (trustTier !== null && filteredVotes.length > 0) {
      const voteIds = filteredVotes.map((vote) => vote.id).filter(Boolean) as string[];

      if (voteIds.length > 0) {
        const { data: trustRows, error: trustError } = await supabase
          .from('vote_trust_tiers')
          .select('vote_id, trust_tier')
          .eq('trust_tier', trustTier)
          .in('vote_id', voteIds);

        if (trustError) {
          logger.warn('Results trust tier lookup failed, continuing without tier filter', trustError);
        } else {
          const allowedIds = new Set(
            (trustRows ?? []).map((row) => row.vote_id).filter(Boolean) as string[],
          );
          filteredVotes = filteredVotes.filter((vote) => allowedIds.has(vote.id));
        }
      } else {
        filteredVotes = [];
      }
    }

    let excludedVotes = 0;
    let scoredVoteIds = new Set<string>();

    if (!includeAllVotes && filteredVotes.length > 0) {
      const voteIds = filteredVotes.map((vote) => vote.id).filter(Boolean) as string[];

      if (voteIds.length > 0) {
        const { data: scoreRows, error: scoreError } = await (supabase as any)
          .from('vote_integrity_scores')
          .select('vote_id, score')
          .eq('poll_id', id)
          .eq('vote_type', 'vote')
          .in('vote_id', voteIds);

        if (scoreError) {
          logger.warn('Integrity score lookup failed for votes', scoreError);
        } else {
          scoredVoteIds = new Set(
            (scoreRows ?? [])
              .filter((row: { score?: number }) => (row.score ?? 0) >= integrityThreshold)
              .map((row: { vote_id?: string | null }) => row.vote_id)
              .filter(Boolean) as string[]
          );
          excludedVotes = voteIds.filter((idValue) => !scoredVoteIds.has(idValue)).length;
          filteredVotes = filteredVotes.filter((vote) => scoredVoteIds.has(vote.id));
        }
      }
    }

    const counts = filteredVotes.reduce<Record<string, number>>((acc, vote) => {
      const optionId = vote.option_id;
      if (optionId) {
        acc[optionId] = (acc[optionId] ?? 0) + 1;
      }
      return acc;
    }, {});

    const rows = Object.entries(counts).map(([option_id, vote_count]) => ({
      option_id,
      vote_count,
    }));

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
      integrity: {
        mode: includeAllVotes ? 'all' : 'verified',
        threshold: integrityThreshold,
        raw_total_votes: rawTotalVotes,
        excluded_votes: excludedVotes,
        scored_votes: scoredVoteIds.size,
        unscored_votes: Math.max(rawTotalVotes - scoredVoteIds.size, 0),
      },
    });
});
