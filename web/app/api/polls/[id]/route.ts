import type { NextRequest} from 'next/server';

import { withErrorHandling, successResponse, notFoundError, validationError, errorResponse } from '@/lib/api';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: { id: string } }
) => {
    const pollId = params.id;

    if (!pollId) {
      return validationError({ pollId: 'Poll ID is required' });
    }

    const supabaseClient = await getSupabaseServerClient();
    if (!supabaseClient) {
      return errorResponse('Database not available', 500);
    }

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
      canVote: (poll.status ?? 'active') === 'active',
      settings: {
        allowMultipleVotes: Boolean(pollSettings?.allow_multiple_votes),
        allowAnonymousVotes: Boolean(pollSettings?.allow_anonymous_votes ?? true),
        requireAuthentication: Boolean(pollSettings?.require_authentication ?? false),
        showResultsBeforeClose: Boolean(pollSettings?.show_results_before_close ?? false),
      },
    };

    return successResponse(sanitizedPoll);
});
