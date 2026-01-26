import { getSupabaseServerClient } from '@/utils/supabase/server';

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

  // Try both getUser() and getSession() for better compatibility
  const [authResult, sessionResult, pollResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession(),
    supabase.from('polls').select('id, title, status, created_by, end_time, baseline_at, allow_post_close').eq('id', pollId).single(),
  ]);
  
  // Use session user if getUser() fails (better cookie handling)
  const sessionUser = sessionResult.data?.session?.user;
  const { data: { user: authUser }, error: userError } = authResult;
  
  // Fallback to session user if getUser() fails
  const user = authUser || sessionUser;
  
  if (!user) {
    devLog('Authentication failed - no user found', {
      getUserError: userError,
      hasSessionUser: !!sessionUser,
      pollId,
      cookies: request.headers.get('cookie') ? 'present' : 'missing',
    });
    return authError('Authentication required to close polls');
  }
  
  devLog('User authenticated for poll close', {
    userId: user.id,
    userEmail: user.email,
    pollId,
  });

  const { data: poll, error: pollError } = pollResult;
  if (pollError || !poll) {
    devLog('Poll not found or error fetching poll', { pollId, error: pollError });
    return notFoundError('Poll not found');
  }

  // Normalize IDs to strings for comparison (handle UUID vs string)
  // UUIDs are case-insensitive but we'll compare as-is first, then try normalized
  const pollCreatorIdRaw = poll.created_by ? String(poll.created_by).trim() : null;
  const userIdRaw = user.id ? String(user.id).trim() : null;
  const pollCreatorId = pollCreatorIdRaw?.toLowerCase() ?? null;
  const userId = userIdRaw?.toLowerCase() ?? null;
  
  devLog('Checking poll close permissions', {
    pollId,
    pollCreatorId,
    userId,
    pollCreatorIdRaw: poll.created_by,
    userIdRaw: user.id,
    pollTitle: poll.title,
    pollStatus: poll.status,
    idsMatch: pollCreatorId === userId,
    pollCreatorIdType: typeof poll.created_by,
    userIdType: typeof user.id,
  });

  // Try both exact match and normalized match
  const isCreatorExact = pollCreatorIdRaw && userIdRaw && pollCreatorIdRaw === userIdRaw;
  const isCreatorNormalized = pollCreatorId && userId && pollCreatorId === userId;
  const isCreator = isCreatorExact || isCreatorNormalized;
  if (isCreator) {
    devLog('User is poll creator, allowing close', { pollId, userId });
    // Creator may close; no profile check needed
  } else {
    devLog('User is not creator, checking admin status', { pollId, userId, pollCreatorId });
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (profileError) {
      devLog('Error fetching user profile', { error: profileError, userId });
    }
    
    const isAdmin = profile?.is_admin === true;
    devLog('Admin check result', { isAdmin, userId, pollId });
    
    if (!isAdmin) {
      devLog('Access denied: User is neither creator nor admin', {
        pollId,
        userId,
        pollCreatorId,
        isAdmin
      });
      return forbiddenError('Only the poll creator or an admin can close this poll');
    }
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
