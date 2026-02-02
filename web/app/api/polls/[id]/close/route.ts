import { getSupabaseServerClient, getSupabaseAdminClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, authError, validationError, notFoundError, forbiddenError, errorResponse } from '@/lib/api';
import { devLog } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

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

  const admin = await getSupabaseAdminClient();

  // Auth: try both getUser() and getSession() for better cookie handling
  const [authResult, sessionResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession(),
  ]);
  const sessionUser = sessionResult.data?.session?.user;
  const { data: { user: authUser }, error: userError } = authResult;
  const user = authUser ?? sessionUser;

  if (!user) {
    devLog('Close poll: auth failed', {
      getUserError: userError,
      hasSession: !!sessionUser,
      pollId,
      hasCookies: !!request.headers.get('cookie'),
    });
    return authError('Authentication required to close polls');
  }

  // Fetch poll with admin client so RLS never hides the row; we enforce creator/admin below
  const { data: poll, error: pollError } = admin
    ? await admin.from('polls').select('id, title, status, created_by, end_time, baseline_at, allow_post_close').eq('id', pollId).single()
    : { data: null, error: new Error('Admin client unavailable') };

  if (pollError || !poll) {
    devLog('Close poll: poll not found', { pollId, error: pollError });
    return notFoundError('Poll not found');
  }

  const rawCreator = poll.created_by != null ? String(poll.created_by).trim() : '';
  const rawUser = user.id ? String(user.id).trim() : '';
  const norm = (s: string) => s.toLowerCase();
  const match = rawCreator && rawUser && (rawCreator === rawUser || norm(rawCreator) === norm(rawUser));

  devLog('Close poll: permission check', {
    pollId,
    rawCreator,
    rawUser,
    match,
  });

  if (match) {
    // Creator may close
  } else {
    const { data: profile } = admin
      ? await admin.from('user_profiles').select('is_admin').eq('user_id', user.id).maybeSingle()
      : { data: null };
    const isAdmin = profile?.is_admin === true;
    if (!isAdmin) {
      return forbiddenError('Only the poll creator or an admin can close this poll');
    }
  }

  if (poll.status === 'closed') {
    return validationError({ status: 'Poll is already closed' });
  }

  if (poll.status !== 'active') {
    return validationError({ status: 'Only active polls can be closed' });
  }

    const baselineAt = new Date().toISOString();
    const now = new Date().toISOString();

    const client = admin ?? supabase;
    const { error: updateError } = await client
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
