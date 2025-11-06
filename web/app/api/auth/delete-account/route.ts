import type { NextRequest } from 'next/server'

import { withErrorHandling, successResponse, authError, errorResponse } from '@/lib/api';
import { devLog } from '@/lib/utils/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export const DELETE = withErrorHandling(async (_request: NextRequest) => {
  // Get Supabase client
  const supabase = await getSupabaseServerClient()
  
  if (!supabase) {
    return errorResponse('Supabase not configured', 500);
  }

  // Get current user from Supabase native session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError || !session?.user) {
    return authError('User not authenticated');
  }
    
    const user = session.user

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
      // Continue - this is not critical
    }

    // Delete user polls
    const { error: pollsError } = await supabase
      .from('polls')
      .delete()
      .eq('created_by', user.id)

    if (pollsError) {
      devLog('Polls deletion error:', { error: pollsError })
      // Continue - this is not critical
    }

    // Delete WebAuthn credentials
    const { error: credentialsError } = await supabase
      .from('webauthn_credentials')
      .delete()
      .eq('user_id', user.id)

    if (credentialsError) {
      devLog('Credentials deletion error:', { error: credentialsError })
      // Continue - this is not critical
    }

  // Delete user from Supabase Auth
  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)

  if (deleteError) {
    devLog('Auth deletion error:', { error: deleteError })
    return errorResponse('Failed to delete user account', 500);
  }

  return successResponse({
    message: 'Account deleted successfully'
  });
});
