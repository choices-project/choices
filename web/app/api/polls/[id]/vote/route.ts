import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getSupabaseAdminClient, getSupabaseServerClient } from '@/utils/supabase/server';

import {
  withErrorHandling,
  successResponse,
  authError,
  validationError,
  notFoundError,
  errorResponse,
} from '@/lib/api';
import { getUser } from '@/lib/core/auth/middleware';
import { recordIntegrityForVote } from '@/lib/integrity/vote-integrity';
import { AnalyticsService } from '@/lib/services/analytics';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// Validation schema for vote request body
// Note: Different voting methods use different fields, so we allow all and validate based on method
const voteRequestBodySchema = z.object({
  choice: z.number().int().optional(),
  optionId: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  selections: z.array(z.union([z.number().int(), z.string()])).optional(),
  approvals: z.array(z.union([z.string(), z.number().int()])).optional(),
  rankings: z.array(z.union([z.string(), z.number().int()])).optional(),
  allocations: z.record(z.string(), z.number()).optional(),
  ratings: z.record(z.string(), z.number()).optional(),
}).refine(
  (data) => {
    // At least one voting field must be present
    return data.choice !== undefined ||
           data.optionId !== undefined ||
           (data.selections && data.selections.length > 0) ||
           (data.approvals && data.approvals.length > 0) ||
           (data.rankings && data.rankings.length > 0) ||
           (data.allocations && Object.keys(data.allocations).length > 0) ||
           (data.ratings && Object.keys(data.ratings).length > 0);
  },
  { message: 'At least one voting field must be provided' }
);

type VoteRequestBody = z.infer<typeof voteRequestBodySchema>;

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

const normalizeVotingMethod = (method: string): 'single' | 'multiple' | 'approval' | 'ranked' | string => {
  switch (method) {
    case 'single':
    case 'single_choice':
      return 'single';
    case 'multiple':
    case 'multiple_choice':
      return 'multiple';
    case 'ranked':
    case 'ranked_choice':
      return 'ranked';
    case 'approval':
      return 'approval';
    default:
      return method;
  }
};

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
  const adminClient = await getSupabaseAdminClient();
  if (!supabase) {
    logger.error('Supabase not configured for poll voting');
    return errorResponse('Database not available', 500);
  }

  const user = await getUser().catch((error) => {
    logger.warn('Vote submission authentication lookup failed', error);
    return null;
  });

  if (!user) {
    return authError('Authentication required to vote');
  }

  const { data: moderationActions } = await (adminClient as any)
    .from('moderation_actions')
    .select('action, expires_at, status')
    .eq('target_type', 'user')
    .eq('target_id', user.id)
    .eq('status', 'active');

  const activeActions = (moderationActions ?? []).filter((action: { expires_at?: string | null }) => {
    if (!action.expires_at) {
      return true;
    }
    return new Date(action.expires_at).getTime() > Date.now();
  });

  const actionFlags = activeActions.map((action: { action?: string }) => action.action).filter(Boolean) as string[];
  if (actionFlags.includes('suspend')) {
    return errorResponse('Voting suspended for this account', 403);
  }
  if (actionFlags.includes('require_verification')) {
    return validationError({ verification: 'Account verification required before voting' });
  }
  if (actionFlags.includes('throttle')) {
    return errorResponse('Voting temporarily throttled. Please try again later.', 429);
  }

  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || null;
  const userAgent = request.headers.get('user-agent');

  // Parse and validate request body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return validationError({ body: 'Request body must be valid JSON' });
  }

  // Validate with Zod schema
  const validationResult = voteRequestBodySchema.safeParse(rawBody);
  if (!validationResult.success) {
    const fieldErrors: Record<string, string> = {};
    validationResult.error.issues.forEach((issue) => {
      const field = issue.path.join('.') || 'body';
      fieldErrors[field] = issue.message;
    });
    return validationError(fieldErrors, 'Invalid vote data');
  }

  const body: VoteRequestBody = validationResult.data;

  const selectFieldsWithMetadata = `
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
      `;

  const selectFieldsWithoutMetadata = `
        id,
        status,
        privacy_level,
        voting_method,
        poll_settings,
        poll_options:poll_options (
          id,
          text,
          option_text,
          order_index
        )
      `;

  const loadPoll = async (fields: string) =>
    supabase
      .from('polls')
      .select(fields)
      .eq('id', pollId)
      .maybeSingle<PollRecord>();

  let { data: poll, error: pollError } = await loadPoll(selectFieldsWithMetadata);

  if (pollError?.code === '42703') {
    const fallback = await loadPoll(selectFieldsWithoutMetadata);
    poll = fallback.data ? { ...fallback.data, metadata: null } : null;
    pollError = fallback.error ?? null;
  }

  if (pollError || !poll) {
    logger.error('Vote submission poll lookup failed', pollError ?? new Error('Poll not found'));
    return notFoundError('Poll not found');
  }

  const rawVotingMethod = (poll.voting_method ?? 'single').toLowerCase();
  const votingMethod = normalizeVotingMethod(rawVotingMethod);

  if (!SUPPORTED_METHODS.has(votingMethod)) {
    return validationError({
      voting_method: `Voting method '${rawVotingMethod}' is not supported yet.`,
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

    // Use admin client with explicit security checks
    // RLS policies require auth.uid() which may not be available in server context
    // We use admin client but enforce security at application level
    if (!adminClient) {
      logger.error('Admin client not available for ranked vote');
      return errorResponse('Database service unavailable', 500);
    }

    // Verify admin client is using service role (should bypass RLS)
    // Log the client configuration for debugging
    logger.info('Using admin client for poll_rankings operations', {
      pollId,
      userId: user.id,
      hasAdminClient: !!adminClient,
    });

    // Delete existing ballot - explicit security: only delete user's own rankings
    const { error: deleteExistingBallotError, data: deleteData } = await adminClient
      .from('poll_rankings')
      .delete()
      .eq('poll_id', pollId)
      .eq('user_id', user.id) // Explicit security check: user can only delete their own
      .select(); // Select to get more info

    if (deleteExistingBallotError) {
      logger.error('Ranked vote delete failed', {
        error: deleteExistingBallotError,
        pollId,
        userId: user.id,
        message: deleteExistingBallotError.message,
        details: deleteExistingBallotError.details,
        hint: deleteExistingBallotError.hint,
        code: deleteExistingBallotError.code,
        deleteData,
      });

      // Check if it's a permission error - might indicate RLS is still blocking
      if (deleteExistingBallotError.message?.includes('permission denied') || deleteExistingBallotError.code === '42501') {
        logger.error('RLS blocking admin client - this should not happen', {
          error: deleteExistingBallotError,
          pollId,
          userId: user.id,
        });
        return errorResponse(
          'Database permission error. Please contact support if this persists.',
          500
        );
      }

      return errorResponse(
        `Failed to update your ranked ballot: ${deleteExistingBallotError.message ?? 'Database error'}`,
        500
      );
    }

    // Insert new ballot - explicit security: only insert for authenticated user
    const { data: insertedBallot, error: insertBallotError } = await adminClient
      .from('poll_rankings')
      .insert({
        poll_id: pollId,
        user_id: user.id, // Explicit security check: user can only insert for themselves
        rankings: uniqueRankingIndices,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single<{ id: string }>();

    if (insertBallotError) {
      logger.error('Ranked vote insert failed', {
        error: insertBallotError,
        pollId,
        userId: user.id,
        rankings: uniqueRankingIndices,
        message: insertBallotError.message,
        details: insertBallotError.details,
        hint: insertBallotError.hint,
      });
      return errorResponse(
        `Failed to submit ranked vote: ${insertBallotError.message ?? 'Database error'}`,
        500
      );
    }

    await recordAnalyticsSafely();
    // MVP: Integrity scoring is optional - run async to not block vote submission
    // Can be enabled later when needed for fraud detection
    if (insertedBallot?.id) {
      // Run integrity scoring in background - don't block vote submission
      void recordIntegrityForVote({
        supabase,
        adminClient,
        userId: user.id,
        pollId,
        voteId: insertedBallot.id,
        voteType: 'ranked',
        ipAddress: clientIp,
        userAgent,
        actionFlags,
      }).catch((error) => {
        // Log but don't fail the vote submission if integrity scoring fails
        logger.warn('Integrity scoring failed for ranked ballot (non-blocking)', error);
      });
    }

    // Update poll's total_votes count for ranked votes BEFORE returning response
    // Use RPC function to safely update vote count (handles ranked polls automatically)
    // CRITICAL: This must complete before returning success response
    try {
      // Use the secure RPC function that handles both regular and ranked polls
      // Type assertion needed until migration is run and types are regenerated
      const { error: updateError } = await (supabase as any)
        .rpc('update_poll_vote_count', { poll_id_param: pollId });

      if (updateError) {
        // If function doesn't exist yet (migration not run), fall back to adminClient
        if (updateError.message?.includes('function') && updateError.message?.includes('does not exist')) {
          logger.warn('update_poll_vote_count function not found, falling back to adminClient', { pollId });

          if (adminClient) {
            const { data: voterData, error: countError } = await adminClient
              .from('poll_rankings')
              .select('user_id')
              .eq('poll_id', pollId);

            if (!countError && voterData) {
              const uniqueVoterCount = new Set(voterData.map(v => v.user_id)).size;
              const { error: fallbackError } = await adminClient
                .from('polls')
                .update({
                  total_votes: uniqueVoterCount,
                  updated_at: new Date().toISOString()
                })
                .eq('id', pollId);

              if (fallbackError) {
                logger.error('Failed to update poll vote count for ranked vote (fallback)', { pollId, error: fallbackError });
              } else {
                logger.info('Updated poll vote count for ranked vote (fallback)', { pollId, totalVotes: uniqueVoterCount });
              }
            }
          }
        } else {
          logger.error('Failed to update poll vote count for ranked vote via RPC', { pollId, error: updateError });
        }
      } else {
        logger.info('Updated poll vote count for ranked vote via RPC', { pollId });
      }
    } catch (error) {
      logger.error('Exception updating poll vote count for ranked vote', { pollId, error });
      // Don't fail the vote submission if count update fails
    }

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
    if (insertedVotes && insertedVotes.length > 0) {
      void Promise.all(
        insertedVotes.map((vote) =>
          recordIntegrityForVote({
            supabase,
            adminClient,
            userId: user.id,
            pollId,
            voteId: vote.id,
            voteType: 'vote',
            ipAddress: clientIp,
            userAgent,
          actionFlags,
          })
        )
      ).catch((error) => {
        logger.warn('Integrity scoring failed for multi-select votes', error);
      });
    }

    // Update poll's total_votes count for multi-select votes BEFORE returning response
    // Use RPC function to safely update vote count (respects RLS, ensures integrity)
    // CRITICAL: This must complete before returning success response
    try {
      // Use the secure RPC function that recalculates from actual votes
      // Type assertion needed until migration is run and types are regenerated
      const { error: updateError } = await (supabase as any)
        .rpc('update_poll_vote_count', { poll_id_param: pollId });

      if (updateError) {
        // If function doesn't exist yet (migration not run), fall back to adminClient
        if (updateError.message?.includes('function') && updateError.message?.includes('does not exist')) {
          logger.warn('update_poll_vote_count function not found, falling back to adminClient', { pollId });

          if (adminClient) {
            const { data: voterData, error: countError } = await adminClient
              .from('votes')
              .select('user_id')
              .eq('poll_id', pollId);

            if (!countError && voterData) {
              const uniqueVoterCount = new Set(voterData.map(v => v.user_id)).size;
              const { error: fallbackError } = await adminClient
                .from('polls')
                .update({
                  total_votes: uniqueVoterCount,
                  updated_at: new Date().toISOString()
                })
                .eq('id', pollId);

              if (fallbackError) {
                logger.error('Failed to update poll vote count for multi-select (fallback)', { pollId, error: fallbackError });
              } else {
                logger.info('Updated poll vote count for multi-select (fallback)', { pollId, totalVotes: uniqueVoterCount });
              }
            }
          }
        } else {
          logger.error('Failed to update poll vote count for multi-select via RPC', { pollId, error: updateError });
        }
      } else {
        logger.info('Updated poll vote count for multi-select via RPC', { pollId });
      }
    } catch (error) {
      logger.error('Exception updating poll vote count for multi-select', { pollId, error });
      // Don't fail the vote submission if count update fails
    }

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
      logger.warn('Vote submission missing choice', { pollId, body, optionsCount: options.length });
      return validationError({ choice: 'Option selection is required.' });
    }

    if (!Number.isInteger(choiceIndex)) {
      logger.warn('Vote submission invalid choice type', { pollId, choiceIndex, choiceType: typeof choiceIndex });
      return validationError({ choice: 'Selected option must be a valid number.' });
    }

    if (!optionByIndex.has(choiceIndex)) {
      logger.warn('Vote submission choice index out of range', {
        pollId,
        choiceIndex,
        availableIndices: Array.from(optionByIndex.keys()),
        optionsCount: options.length
      });
      return validationError({
        choice: `Selected option index ${choiceIndex} is not valid. This poll has ${options.length} option${options.length === 1 ? '' : 's'} (indices 0-${options.length - 1}).`
      });
    }

    selectedOption = optionByIndex.get(choiceIndex);
  }

  if (!selectedOption) {
    logger.error('Vote submission selectedOption still null after resolution', { pollId, choiceIndex, optionIdFromBody });
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
  if (insertedVote?.id) {
    void recordIntegrityForVote({
      supabase,
      adminClient,
      userId: user.id,
      pollId,
      voteId: insertedVote.id,
      voteType: 'vote',
      ipAddress: clientIp,
      userAgent,
    actionFlags,
    }).catch((error) => {
      logger.warn('Integrity scoring failed for vote', error);
    });
  }

  // Update poll's total_votes count BEFORE returning response
  // Use RPC function to safely update vote count (respects RLS, ensures integrity)
  // CRITICAL: This must complete before returning success response
  try {
      // Use the secure RPC function that recalculates from actual votes
      // This is safer than using adminClient and respects RLS policies
      // Type assertion needed until migration is run and types are regenerated
      const { error: updateError } = await (supabase as any)
        .rpc('update_poll_vote_count', { poll_id_param: pollId });

    if (updateError) {
      // If function doesn't exist yet (migration not run), fall back to adminClient
      if (updateError.message?.includes('function') && updateError.message?.includes('does not exist')) {
        logger.warn('update_poll_vote_count function not found, falling back to adminClient', { pollId });

        // Fallback: Use adminClient only if function doesn't exist
        if (adminClient) {
          const { data: voterData, error: countError } = await adminClient
            .from('votes')
            .select('user_id')
            .eq('poll_id', pollId);

          if (!countError && voterData) {
            const uniqueVoterCount = new Set(voterData.map(v => v.user_id)).size;
            const { error: fallbackError } = await adminClient
              .from('polls')
              .update({
                total_votes: uniqueVoterCount,
                updated_at: new Date().toISOString()
              })
              .eq('id', pollId);

            if (fallbackError) {
              logger.error('Failed to update poll vote count (fallback)', { pollId, error: fallbackError });
            } else {
              logger.info('Updated poll vote count (fallback method)', { pollId, totalVotes: uniqueVoterCount });
            }
          }
        }
      } else {
        logger.error('Failed to update poll vote count via RPC', { pollId, error: updateError });
      }
    } else {
      logger.info('Updated poll vote count via RPC function', { pollId });
    }
  } catch (error) {
    logger.error('Exception updating poll vote count', { pollId, error });
    // Don't fail the vote submission if count update fails
  }

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

export const HEAD = withErrorHandling(async (_request: NextRequest, { params }: { params: { id: string } }) => {
  const pollId = params.id;

  // Validate poll ID from params
  if (!pollId || typeof pollId !== 'string' || pollId.trim().length === 0) {
    return new NextResponse(null, { status: 400 });
  }

  // Validate poll ID format (should be UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(pollId)) {
    return new NextResponse(null, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    logger.error('Supabase not configured for poll voting');
    return new NextResponse(null, { status: 503 });
  }

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
});

export const GET = withErrorHandling(async (_request: NextRequest, { params }: { params: { id: string } }) => {
  const pollId = params.id;

  // Validate poll ID from params
  if (!pollId || typeof pollId !== 'string' || pollId.trim().length === 0) {
    return validationError({ pollId: 'Poll ID is required and must be a valid string' });
  }

  // Validate poll ID format (should be UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(pollId)) {
    return validationError({ pollId: 'Poll ID must be a valid UUID' });
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    logger.error('Supabase not configured for poll voting');
    return errorResponse('Database not available', 500);
  }
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
