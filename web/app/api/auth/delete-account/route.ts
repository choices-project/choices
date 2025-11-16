import type { NextRequest } from 'next/server'

import { withErrorHandling, successResponse, authError, errorResponse } from '@/lib/api';
import { devLog } from '@/lib/utils/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

type CleanupWarning = {
  step: string;
  message: string;
};

export const DELETE = withErrorHandling(async (_request: NextRequest) => {
  // Get Supabase client
  const supabase = await getSupabaseServerClient()
  
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  // Get current user from Supabase native session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError || !session?.user) {
    return authError('User not authenticated');
  }
    
    const user = session.user

  const warnings: CleanupWarning[] = []

  // Delete user profile
  const { error: profileError } = await supabase
    .from('user_profiles')
    .delete()
    .eq('user_id', user.id)

  if (profileError) {
    devLog('Profile deletion error:', { error: profileError })
    return errorResponse('Failed to delete profile', 500);
  }

    // Delete user votes
    const { error: votesError } = await supabase
      .from('votes')
      .delete()
      .eq('user_id', user.id)

    if (votesError) {
      devLog('Votes deletion error:', { error: votesError })
      warnings.push({
        step: 'votes',
        message: votesError.message ?? 'Unknown error deleting votes',
      })
    }

    // Delete user polls
    const { error: pollsError } = await supabase
      .from('polls')
      .delete()
      .eq('created_by', user.id)

    if (pollsError) {
      devLog('Polls deletion error:', { error: pollsError })
      warnings.push({
        step: 'polls',
        message: pollsError.message ?? 'Unknown error deleting polls',
      })
    }

    // Delete WebAuthn credentials
    const { error: credentialsError } = await supabase
      .from('webauthn_credentials')
      .delete()
      .eq('user_id', user.id)

    if (credentialsError) {
      devLog('Credentials deletion error:', { error: credentialsError })
      warnings.push({
        step: 'webauthn_credentials',
        message: credentialsError.message ?? 'Unknown error deleting credentials',
      })
    }

  // Delete user from Supabase Auth
  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)

  if (deleteError) {
    devLog('Auth deletion error:', { error: deleteError })
    return errorResponse('Failed to delete user account', 500);
  }

  const response = successResponse({
    message: 'Account deleted successfully',
    warnings: warnings.length > 0 ? warnings : undefined,
  })

  response.cookies.set('sb-access-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  response.cookies.set('sb-refresh-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  return response;
});
