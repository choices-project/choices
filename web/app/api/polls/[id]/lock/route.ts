import { getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, authError, validationError, notFoundError, forbiddenError, errorResponse } from '@/lib/api';
import { devLog } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';



export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (
  _request: NextRequest,
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

  const [authResult, pollResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('polls').select('id, title, status, created_by, locked_at').eq('id', pollId).single(),
  ]);

  const { data: { user }, error: userError } = authResult;
  if (userError || !user) {
    return authError('Authentication required to lock polls');
  }

  const { data: poll, error: pollError } = pollResult;
  if (pollError || !poll) {
    return notFoundError('Poll not found');
  }

  if (poll.created_by !== user.id) {
    return forbiddenError('Only the poll creator can lock this poll');
  }

  if (poll.locked_at) {
    return validationError({ status: 'Poll is already locked' });
  }

  if (poll.status === 'draft') {
    return validationError({ status: 'Draft polls cannot be locked' });
  }

    // Lock the poll
    const lockedAt = new Date().toISOString();
    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('polls')
      .update({
        locked_at: lockedAt,
        updated_at: now
      })
      .eq('id', pollId);

  if (updateError) {
    devLog('Error locking poll:', { error: updateError });
    return errorResponse('Failed to lock poll', 500);
  }

  devLog('Poll locked successfully', {
    pollId,
    title: poll.title,
    lockedBy: user.id,
    lockedAt
  });

  return successResponse({
    message: 'Poll locked successfully',
    poll: {
      id: pollId,
      lockedAt,
      status: poll.status
    }
  });
});

export const DELETE = withErrorHandling(async (
  _request: NextRequest,
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

  const [authResult, pollResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('polls').select('id, title, status, created_by, locked_at').eq('id', pollId).single(),
  ]);

  const { data: { user }, error: userError } = authResult;
  if (userError || !user) {
    return authError('Authentication required to unlock polls');
  }

  const { data: poll, error: pollError } = pollResult;
  if (pollError || !poll) {
    return notFoundError('Poll not found');
  }

  if (poll.created_by !== user.id) {
    return forbiddenError('Only the poll creator can unlock this poll');
  }

  if (!poll.locked_at) {
    return validationError({ status: 'Poll is not locked' });
  }

    // Unlock the poll
    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('polls')
      .update({
        locked_at: null,
        updated_at: now
      })
      .eq('id', pollId);

  if (updateError) {
    devLog('Error unlocking poll:', { error: updateError });
    return errorResponse('Failed to unlock poll', 500);
  }

  devLog('Poll unlocked successfully', {
    pollId,
    title: poll.title,
    unlockedBy: user.id
  });

  return successResponse({
    message: 'Poll unlocked successfully',
    poll: {
      id: pollId,
      lockedAt: null,
      status: poll.status
    }
  });
});
