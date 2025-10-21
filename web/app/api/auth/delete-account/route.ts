import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { devLog } from '@/lib/utils/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function DELETE(_request: NextRequest) {
  try {
    // Get Supabase client
    const supabase = await getSupabaseServerClient()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    // Get current user from Supabase native session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }
    
    const user = session.user

    // Delete user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', user.id as any)

    if (profileError) {
      devLog('Profile deletion error:', { error: profileError })
      return NextResponse.json(
        { error: 'Failed to delete profile' },
        { status: 500 }
      )
    }

    // Delete user votes
    const { error: votesError } = await supabase
      .from('votes')
      .delete()
      .eq('user_id', user.id as any)

    if (votesError) {
      devLog('Votes deletion error:', { error: votesError })
      // Continue - this is not critical
    }

    // Delete user polls
    const { error: pollsError } = await supabase
      .from('polls')
      .delete()
      .eq('created_by', user.id as any)

    if (pollsError) {
      devLog('Polls deletion error:', { error: pollsError })
      // Continue - this is not critical
    }

    // Delete WebAuthn credentials
    const { error: credentialsError } = await supabase
      .from('webauthn_credentials')
      .delete()
      .eq('user_id', user.id as any)

    if (credentialsError) {
      devLog('Credentials deletion error:', { error: credentialsError })
      // Continue - this is not critical
    }

    // Delete user from Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(user.id)

    if (authError) {
      devLog('Auth deletion error:', { error: authError })
      return NextResponse.json(
        { error: 'Failed to delete user account' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    })

  } catch (error) {
    devLog('Account deletion error:', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
