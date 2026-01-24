/**
 * Poll Post-Close API Route
 *
 * Handles enabling/disabling post-close voting for a poll.
 * Only the poll creator or admin can modify post-close settings.
 *
 * Created: September 15, 2025
 * Updated: September 15, 2025
 */

import { getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, authError, errorResponse, validationError, notFoundError, forbiddenError } from '@/lib/api';
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
      throw new Error('Supabase client not available');
    }

  const [sessionResult, pollResult] = await Promise.all([
    supabase.auth.getSession(),
    supabase.from('polls').select('id, title, status, created_by, allow_post_close, baseline_at').eq('id', pollId).single(),
  ]);

  const { data: { session }, error: sessionError } = sessionResult;
  if (sessionError || !session?.user) {
    return authError('Authentication required to modify post-close settings');
  }
  const user = session.user;
  if (!user) {
    return authError('Authentication required to modify post-close settings');
  }

  const { data: poll, error: pollError } = pollResult;
  if (pollError || !poll) {
    return notFoundError('Poll not found');
  }

  if (poll.created_by !== user.id) {
    return forbiddenError('Only the poll creator can modify post-close settings');
  }

  if (poll.status !== 'closed') {
    return validationError({ status: 'Post-close voting can only be enabled for closed polls' });
  }

  if (!poll.baseline_at) {
    return validationError({ baseline: 'Poll must have a baseline before enabling post-close voting' });
  }

    // Enable post-close voting
    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('polls')
      .update({
        allow_post_close: true,
        updated_at: now
      })
      .eq('id', pollId);

  if (updateError) {
    devLog('Error enabling post-close voting:', { error: updateError });
    return errorResponse('Failed to enable post-close voting', 500);
  }

  devLog('Post-close voting enabled', {
    pollId,
    title: poll.title,
    enabledBy: user.id,
    baselineAt: poll.baseline_at
  });

  return successResponse({
    message: 'Post-close voting enabled successfully',
    poll: {
      id: pollId,
      allowPostClose: true,
      baselineAt: poll.baseline_at
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

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return authError('Authentication required to modify post-close settings');
  }

  const user = session.user;
  if (!user) {
    return authError('Authentication required to modify post-close settings');
  }

  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select('id, title, status, created_by, allow_post_close')
    .eq('id', pollId)
    .single();

  if (pollError || !poll) {
    return notFoundError('Poll not found');
  }

  if (poll.created_by !== user.id) {
    return forbiddenError('Only the poll creator can modify post-close settings');
  }

  if (!poll.allow_post_close) {
    return validationError({ status: 'Post-close voting is not enabled for this poll' });
  }

    // Disable post-close voting
    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('polls')
      .update({
        allow_post_close: false,
        updated_at: now
      })
      .eq('id', pollId);

  if (updateError) {
    devLog('Error disabling post-close voting:', { error: updateError });
    return errorResponse('Failed to disable post-close voting', 500);
  }

  devLog('Post-close voting disabled', {
    pollId,
    title: poll.title,
    disabledBy: user.id
  });

  return successResponse({
    message: 'Post-close voting disabled successfully',
    poll: {
      id: pollId,
      allowPostClose: false
    }
  });
});
