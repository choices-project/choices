import type { NextRequest } from 'next/server';
import { z } from 'zod';

import {
  withErrorHandling,
  successResponse,
  authError,
  notFoundError,
  forbiddenError,
  errorResponse,
  parseBody
} from '@/lib/api';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';


export const dynamic = 'force-dynamic';

const voteSchema = z.object({
  pollId: z.string().uuid(),
  optionId: z.string().uuid(),
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return errorResponse('Supabase client not available', 500);
  }

  const bodyResult = await parseBody(request, voteSchema);
  if (!bodyResult.success) return bodyResult.error;
  const validatedData = bodyResult.data;

  const { data: { user }, error: userError } = await (await supabase).auth.getUser();
  if (userError || !user) {
    return authError('Authentication required');
  }

  // Check if poll exists and is active
  const { data: poll, error: pollError } = await (await supabase)
    .from('polls')
    .select('id, created_by, voting_method, privacy_level, end_time, options, total_votes, participation, question')
    .eq('id', validatedData.pollId)
    .single();

  if (pollError || !poll) {
    logger.error('Poll not found or error fetching poll', pollError as Error);
    return notFoundError('Poll not found or inactive');
  }

  // Check if voting is allowed (e.g., poll not ended)
  if (poll.end_time && new Date(poll.end_time) < new Date()) {
    return forbiddenError('Voting for this poll has ended');
  }

  // Check if option is valid for this poll and get choice index
  const options = poll.options as any[]; // Assuming options is a JSON array
  const optionIndex = options.findIndex(option => option.id === validatedData.optionId);
  if (optionIndex === -1) {
    return errorResponse('Invalid option for this poll', 400, undefined, 'VALIDATION_ERROR');
  }

  // Record the vote using existing schema fields
  const { error: voteError } = await (await supabase)
    .from('votes')
    .insert({
      poll_id: validatedData.pollId,
      user_id: user.id,
      option_id: validatedData.optionId,
      poll_option_id: validatedData.optionId, // Duplicate for compatibility
      poll_question: poll.question,
      vote_status: 'active',
      trust_tier: 1, // Default trust tier
      voter_session: request.headers.get('x-session-id') ?? null,
      ip_address: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
    });

  if (voteError) {
    logger.error('Error recording vote:', voteError as Error);
    return errorResponse('Failed to record vote', 500, voteError.message);
  }

  // Update poll total_votes and participation using existing fields
  const { error: updatePollError } = await (await supabase)
    .from('polls')
    .update({
      total_votes: (poll.total_votes ?? 0) + 1, // Use existing total_votes field
      participation: (poll.participation ?? 0) + 1 // Use existing participation field
    })
    .eq('id', validatedData.pollId);

  if (updatePollError) {
    logger.warn('Failed to update poll vote count:', { updatePollError });
  }

  return successResponse({
    message: 'Vote recorded successfully',
    poll_id: validatedData.pollId,
    option_id: validatedData.optionId
  });
});
