import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  withErrorHandling,
  successResponse,
  authError,
  validationError,
  notFoundError,
  errorResponse,
} from '@/lib/api';
import { getUser } from '@/lib/core/auth/middleware';
import { AnalyticsService } from '@/lib/services/analytics';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

type VoteRequestBody = {
  choice?: number;
  optionId?: string;
  metadata?: Record<string, unknown>;
  selections?: number[];
  approvals?: Array<string | number>;
  rankings?: Array<string | number>;
  allocations?: Record<string, number>;
  ratings?: Record<string, number>;
};

type PollOptionRow = {
  id: string;
  text?: string | null;
  option_text?: string | null;
  order_index?: number | null;
};

type PollRecord = {
  id: string;
  status: string | null;
  privacy_level: string | null;
  voting_method: string | null;
  poll_settings: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  poll_options: PollOptionRow[];
};

const SUPPORTED_METHODS = new Set(['single', 'multiple', 'approval', 'ranked']);

const MULTI_SELECT_METHODS = new Set(['multiple', 'approval']);

const normalizeOptions = (options: PollOptionRow[]) =>
  [...options]
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map((option, index) => ({
      id: option.id,
      text: option.text ?? option.option_text ?? `Option ${index + 1}`,
      order: option.order_index ?? index,
      index,
    }));

export const POST = withErrorHandling(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const pollId = params.id;

  if (!pollId) {
    return validationError({ pollId: 'Poll ID is required' });
  }

  const supabase = await getSupabaseServerClient();

  const user = await getUser().catch((error) => {
    logger.warn('Vote submission authentication lookup failed', error);
    return null;
  });

  if (!user) {
    return authError('Authentication required to vote');
  }

  let body: VoteRequestBody;
  try {
    body = await request.json();
  } catch {
    return validationError({ body: 'Request body must be valid JSON' });
  }

  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select(
      `
        id,
        status,
        privacy_level,
        voting_method,
        poll_settings,
        metadata,
        poll_options:poll_options (
          id,
          text,
          option_text,
          order_index
        )
      `,
    )
    .eq('id', pollId)
    .maybeSingle<PollRecord>();

  if (pollError || !poll) {
    logger.error('Vote submission poll lookup failed', pollError ?? new Error('Poll not found'));
    return notFoundError('Poll not found');
  }

  const votingMethod = (poll.voting_method ?? 'single').toLowerCase();

  if (!SUPPORTED_METHODS.has(votingMethod)) {
    return validationError({
      voting_method: `Voting method '${votingMethod}' is not supported yet.`,
    });
  }

  if ((poll.status ?? 'active') !== 'active') {
    return validationError({ poll: 'This poll is not open for voting.' });
  }

  const options = normalizeOptions(poll.poll_options ?? []);
  const optionByIndex = new Map(options.map((option) => [option.index, option]));
  const optionById = new Map(options.map((option) => [option.id, option]));

  const metadata = (poll.metadata ?? {}) as Record<string, unknown>;
  const settings = (poll.poll_settings ?? {}) as Record<string, unknown>;
  const allowMultipleVotes = Boolean(settings.allow_multiple_votes);
  const configuredMaxSelections =
    typeof settings.max_selections === 'number' && settings.max_selections > 0
      ? settings.max_selections
      : typeof metadata.maxSelections === 'number' && metadata.maxSelections > 0
        ? metadata.maxSelections
        : null;

  const recordAnalyticsSafely = async () => {
    try {
      const analyticsService = AnalyticsService.getInstance();
      await analyticsService.recordPollAnalytics(user.id, pollId);
    } catch (analyticsError) {
      logger.warn('Analytics recording failed for vote', analyticsError);
    }
  };

  if (votingMethod === 'ranked') {
    const rawRankings = Array.isArray(body.rankings) ? body.rankings : [];

    if (rawRankings.length === 0) {
      return validationError({ rankings: 'Provide the ordered rankings before submitting your vote.' });
    }

    const rankingIndices: number[] = [];

    for (const value of rawRankings) {
      let optionIndex: number | undefined;
      if (typeof value === 'number') {
        optionIndex = value;
      } else if (typeof value === 'string') {
        const numeric = Number.parseInt(value, 10);
        if (!Number.isNaN(numeric) && optionByIndex.has(numeric)) {
          optionIndex = numeric;
        } else {
          const option = optionById.get(value);
          optionIndex = option?.index;
        }
      }

      if (optionIndex === undefined || !optionByIndex.has(optionIndex)) {
        return validationError({ rankings: 'One or more ranked options are not valid for this poll.' });
      }

      rankingIndices.push(optionIndex);
    }

    const uniqueRankingIndices = Array.from(new Set(rankingIndices));

    if (uniqueRankingIndices.length === 0) {
      return validationError({ rankings: 'Select at least one option to rank.' });
    }

    const { error: deleteExistingBallotError } = await supabase
      .from('poll_rankings')
      .delete()
      .eq('poll_id', pollId)
      .eq('user_id', user.id);

    if (deleteExistingBallotError) {
      logger.error('Ranked vote delete failed', deleteExistingBallotError);
      return errorResponse('Failed to update your ranked ballot', 500);
    }

    const { data: insertedBallot, error: insertBallotError } = await supabase
      .from('poll_rankings')
      .insert({
        poll_id: pollId,
        user_id: user.id,
        rankings: uniqueRankingIndices,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single<{ id: string }>();

    if (insertBallotError) {
      logger.error('Ranked vote insert failed', insertBallotError);
      return errorResponse('Failed to submit ranked vote', 500);
    }

    await recordAnalyticsSafely();

    return successResponse(
      {
        pollId,
        ballotId: insertedBallot?.id ?? null,
        rankings: uniqueRankingIndices,
      },
      {
        votedAt: new Date().toISOString(),
        pollingMethod: votingMethod,
      },
    );
  }

  let existingVoteRows: Array<{ id: string; option_id: string }> = [];

  if (MULTI_SELECT_METHODS.has(votingMethod) || votingMethod === 'single') {
    const { data: existingVotes, error: existingVotesError } = await supabase
      .from('votes')
      .select('id, option_id')
      .eq('poll_id', pollId)
      .eq('user_id', user.id);

    if (existingVotesError) {
      logger.error('Vote submission existing vote lookup failed', existingVotesError);
      return errorResponse('Unable to verify voting history', 500);
    }

    existingVoteRows = existingVotes ?? [];
  }

  if (MULTI_SELECT_METHODS.has(votingMethod)) {
    const rawValues = votingMethod === 'multiple'
      ? (Array.isArray(body.selections) ? body.selections : [])
      : (Array.isArray(body.approvals) ? body.approvals : []);

    if (rawValues.length === 0) {
      return validationError({
        [votingMethod === 'approval' ? 'approvals' : 'selections']:
          'Select at least one option before submitting your vote.',
      });
    }

    const resolvedOptionIds: string[] = [];

    for (const value of rawValues) {
      let candidate;
      if (typeof value === 'number') {
        candidate = optionByIndex.get(value);
      } else if (typeof value === 'string') {
        candidate = optionById.get(value) ?? optionByIndex.get(Number(value));
      }

      if (!candidate) {
        return validationError({ vote: 'One or more selected options are not valid for this poll.' });
      }

      resolvedOptionIds.push(candidate.id);
    }

    const uniqueOptionIds = Array.from(new Set(resolvedOptionIds));

    if (configuredMaxSelections && uniqueOptionIds.length > configuredMaxSelections) {
      return validationError({
        selections: `You can select up to ${configuredMaxSelections} option${configuredMaxSelections === 1 ? '' : 's'} for this poll.`,
      });
    }

    if (!allowMultipleVotes && existingVoteRows.length > 0) {
      return validationError({ vote: 'You have already submitted selections for this poll.' });
    }

    if (existingVoteRows.length > 0) {
      const { error: deleteError } = await supabase
        .from('votes')
        .delete()
        .eq('poll_id', pollId)
        .eq('user_id', user.id);

      if (deleteError) {
        logger.error('Vote submission delete failed', deleteError);
        return errorResponse('Failed to update your vote', 500);
      }
    }

    const rowsToInsert = uniqueOptionIds.map((optionId) => ({
      poll_id: pollId,
      option_id: optionId,
      poll_option_id: optionId,
      user_id: user.id,
      vote_status: 'submitted',
    }));

    const { data: insertedVotes, error: insertError } = await supabase
      .from('votes')
      .insert(rowsToInsert)
      .select('id');

    if (insertError) {
      logger.error('Vote submission insert failed', insertError);
      return errorResponse('Failed to submit vote', 500);
    }

    await recordAnalyticsSafely();

    return successResponse(
      {
        pollId,
        voteIds: (insertedVotes ?? []).map((vote) => vote.id),
        optionIds: uniqueOptionIds,
        allowMultipleVotes: true,
      },
      {
        votedAt: new Date().toISOString(),
        pollingMethod: votingMethod,
      },
    );
  }

  const optionIdFromBody = typeof body.optionId === 'string' ? body.optionId : undefined;
  const choiceIndex = typeof body.choice === 'number' ? body.choice : undefined;

  let selectedOption = optionIdFromBody
    ? optionById.get(optionIdFromBody) ?? optionByIndex.get(Number(optionIdFromBody))
    : undefined;

  if (!selectedOption) {
    if (choiceIndex === undefined) {
      return validationError({ choice: 'Option selection is required.' });
    }

    if (!Number.isInteger(choiceIndex) || !optionByIndex.has(choiceIndex)) {
      return validationError({ choice: 'Selected option is not valid for this poll.' });
    }

    selectedOption = optionByIndex.get(choiceIndex);
  }

  if (!selectedOption) {
    return validationError({ choice: 'Selected option is not valid for this poll.' });
  }

  if (existingVoteRows.length > 0) {
    if (!allowMultipleVotes) {
      return validationError({ vote: 'You have already voted on this poll.' });
    }

    if (existingVoteRows.some((vote) => vote.option_id === selectedOption?.id)) {
      return validationError({ vote: 'You have already selected this option.' });
    }
  }

  const { data: insertedVote, error: insertError } = await supabase
    .from('votes')
    .insert({
      poll_id: pollId,
      option_id: selectedOption.id,
      poll_option_id: selectedOption.id,
      user_id: user.id,
      vote_status: 'submitted',
    })
    .select('id')
    .single<{ id: string }>();

  if (insertError) {
    logger.error('Vote submission insert failed', insertError);
    return errorResponse('Failed to submit vote', 500);
  }

  await recordAnalyticsSafely();

  const optionIndex = selectedOption.index;

  return successResponse(
    {
      pollId,
      voteId: insertedVote?.id ?? null,
      optionId: selectedOption.id,
      optionIndex,
      allowMultipleVotes,
    },
    {
      votedAt: new Date().toISOString(),
      pollingMethod: votingMethod,
    },
  );
});

export async function HEAD(request: NextRequest, { params }: { params: { id: string } }) {
  const pollId = params.id;

  if (!pollId) {
    return new NextResponse(null, { status: 204 });
  }

  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;

  if (!user) {
    return new NextResponse(null, { status: 204 });
  }

  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select('voting_method')
    .eq('id', pollId)
    .maybeSingle<{ voting_method: string | null }>();

  if (pollError || !poll) {
    return new NextResponse(null, { status: 204 });
  }

  const votingMethod = (poll.voting_method ?? 'single').toLowerCase();

  if (votingMethod === 'ranked') {
    const { count, error } = await supabase
      .from('poll_rankings')
      .select('id', { head: true, count: 'exact' })
      .eq('poll_id', pollId)
      .eq('user_id', user.id);

    if (error) {
      logger.warn('Ranked vote status HEAD lookup failed', error);
      return new NextResponse(null, { status: 204 });
    }

    return new NextResponse(null, { status: count && count > 0 ? 200 : 204 });
  }

  const { error, count } = await supabase
    .from('votes')
    .select('*', { head: true, count: 'exact' })
    .eq('poll_id', pollId)
    .eq('user_id', user.id);

  if (error) {
    logger.warn('Vote status HEAD lookup failed', error);
    return new NextResponse(null, { status: 204 });
  }

  return new NextResponse(null, { status: count && count > 0 ? 200 : 204 });
}

export const GET = withErrorHandling(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const pollId = params.id;

  if (!pollId) {
    return validationError({ pollId: 'Poll ID is required' });
  }

  const supabase = await getSupabaseServerClient();
  const user = await getUser().catch(() => null);

  if (!user) {
    return successResponse({ hasVoted: false });
  }

  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select('voting_method')
    .eq('id', pollId)
    .maybeSingle<{ voting_method: string | null }>();

  if (pollError || !poll) {
    return successResponse({ hasVoted: false });
  }

  const votingMethod = (poll.voting_method ?? 'single').toLowerCase();

  if (votingMethod === 'ranked') {
    const { count, error: rankedError } = await supabase
      .from('poll_rankings')
      .select('id', { head: true, count: 'exact' })
      .eq('poll_id', pollId)
      .eq('user_id', user.id);

    if (rankedError) {
      logger.error('Ranked vote status GET lookup failed', rankedError);
      return errorResponse('Unable to verify vote status', 500);
    }

    return successResponse({ hasVoted: Boolean(count && count > 0) });
  }

  const { count, error: voteError } = await supabase
    .from('votes')
    .select('id', { head: true, count: 'exact' })
    .eq('poll_id', pollId)
    .eq('user_id', user.id);

  if (voteError) {
    logger.error('Vote status GET lookup failed', voteError);
    return errorResponse('Unable to verify vote status', 500);
  }

  return successResponse({ hasVoted: Boolean(count && count > 0) });
});
