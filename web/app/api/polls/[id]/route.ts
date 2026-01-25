import { z } from 'zod';


import { getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, notFoundError, validationError, errorResponse } from '@/lib/api';

import type { NextRequest } from 'next/server';


export const dynamic = 'force-dynamic';
export const revalidate = 0; // Never cache this endpoint

export const GET = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: { id: string } }
) => {
    // Validate poll ID format (UUID)
    const pollIdValidation = z.string().uuid('Invalid poll ID format').safeParse(params.id);
    if (!pollIdValidation.success) {
      return validationError({ pollId: 'Invalid poll ID format' });
    }

    const pollId = pollIdValidation.data;

    const supabaseClient = await getSupabaseServerClient();
    if (!supabaseClient) {
      return errorResponse('Database not available', 500);
    }

    // Use regular client - RLS policies should allow reading polls
    // If we need admin access, we should fix RLS instead of bypassing it
    const { data: poll, error } = await supabaseClient
      .from('polls')
      .select(
        `
          id,
          title,
          description,
          total_votes,
          participation,
          status,
          privacy_level,
          category,
          voting_method,
          created_at,
          created_by,
          poll_settings,
          poll_options:poll_options (
            id,
            text,
            option_text,
            order_index,
            vote_count
          )
        `,
      )
      .eq('id', pollId)
      .maybeSingle();

    if (error || !poll) {
      return notFoundError('Poll not found');
    }

    const options = Array.isArray(poll.poll_options)
      ? [...poll.poll_options]
          .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
          .map((option, index) => ({
            id: option.id,
            text: option.text ?? option.option_text ?? `Option ${index + 1}`,
            order: option.order_index ?? index,
            votes: option.vote_count ?? 0,
          }))
      : [];

    const pollSettings = (poll.poll_settings ?? {}) as Record<string, unknown>;

    const sanitizedPoll = {
      id: poll.id,
      title: poll.title ?? '',
      description: poll.description ?? '',
      options,
      totalvotes: poll.total_votes ?? 0,
      participation: poll.participation ?? 0,
      status: poll.status ?? 'active',
      privacyLevel: poll.privacy_level ?? 'public',
      category: poll.category,
      votingMethod: poll.voting_method ?? 'single',
      createdAt: poll.created_at,
      createdBy: poll.created_by ?? null, // CRITICAL: This must not be null for close button to work
      canVote: (poll.status ?? 'active') === 'active', // Allow voting for active polls
      settings: {
        allowMultipleVotes: Boolean(pollSettings?.allow_multiple_votes),
        allowAnonymousVotes: Boolean(pollSettings?.allow_anonymous_votes ?? true),
        requireAuthentication: Boolean(pollSettings?.require_authentication ?? false),
        showResultsBeforeClose: Boolean(pollSettings?.show_results_before_close ?? false),
      },
    };

    return successResponse(sanitizedPoll);
});

export const DELETE = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: pollId } = await params;

  // Validate poll ID format (UUID)
  const pollIdValidation = z.string().uuid('Invalid poll ID format').safeParse(pollId);
  if (!pollIdValidation.success) {
    return validationError({ pollId: 'Invalid poll ID format' });
  }

  const supabaseClient = await getSupabaseServerClient();
  if (!supabaseClient) {
    return errorResponse('Database not available', 500);
  }

  // Get current user
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    return errorResponse('Authentication required', 401);
  }

  // Get poll to verify ownership
  const { data: poll, error: pollError } = await supabaseClient
    .from('polls')
    .select('id, title, created_by, status')
    .eq('id', pollId)
    .maybeSingle();

  if (pollError || !poll) {
    return notFoundError('Poll not found');
  }

  // Verify user is the creator
  if (poll.created_by !== user.id) {
    return errorResponse('Only the poll creator can delete this poll', 403);
  }

  // Delete poll (cascade will handle related records like votes, options, etc.)
  const { error: deleteError } = await supabaseClient
    .from('polls')
    .delete()
    .eq('id', pollId)
    .eq('created_by', user.id); // Extra safety check

  if (deleteError) {
    return errorResponse('Failed to delete poll', 500);
  }

  return successResponse({
    message: 'Poll deleted successfully',
    pollId,
  });
});
