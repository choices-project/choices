import { type NextRequest } from 'next/server';

import { withErrorHandling, successResponse, authError, validationError, notFoundError, forbiddenError, errorResponse } from '@/lib/api';
import { devLog } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const pollId = id;

  if (!pollId) {
    return validationError({ pollId: 'Poll ID is required' });
  }

  const supabase = await getSupabaseServerClient();
  
  if (!supabase) {
    return errorResponse('Supabase client not available', 500);
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return authError('Authentication required to close polls');
  }

    // Get poll details
            const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id, title, status, created_by, end_time, baseline_at, allow_post_close')
      .eq('id', pollId)
      .single();

  if (pollError || !poll) {
    return notFoundError('Poll not found');
  }

  if (poll.created_by !== user.id) {
    return forbiddenError('Only the poll creator can close this poll');
  }

  if (poll.status === 'closed') {
    return validationError({ status: 'Poll is already closed' });
  }

  if (poll.status !== 'active') {
    return validationError({ status: 'Only active polls can be closed' });
  }

    // Set baseline timestamp (current time)
    const baselineAt = new Date().toISOString();
    const now = new Date().toISOString();

    // Close the poll
    const { error: updateError } = await supabase
      .from('polls')
      .update({
        status: 'closed',
        baseline_at: baselineAt,
        updated_at: now
      })
      .eq('id', pollId);

  if (updateError) {
    devLog('Error closing poll:', { error: updateError });
    return errorResponse('Failed to close poll', 500);
  }

  devLog('Poll closed successfully', {
    pollId,
    title: poll.title,
    closedBy: user.id,
    baselineAt
  });

  return successResponse({
    message: 'Poll closed successfully',
    poll: {
      id: pollId,
      status: 'closed',
      baselineAt,
      allowPostClose: poll.allow_post_close
    }
  });
});
