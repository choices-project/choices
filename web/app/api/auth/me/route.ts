import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { devLog } from '@/lib/logger';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }

    const supabaseClient = await supabase

    // Get current user session
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get user data from ia_users table
    const { data: user, error: userError } = await supabaseClient
      .from('ia_users')
      .select('stable_id, email, verification_tier')
      .eq('stable_id', session.user.id)
      .single()

    if (userError || !user) {
      devLog('User not found in ia_users table:', session.user.id)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.stable_id,
        email: user.email,
        verification_tier: user.verification_tier
      }
    })

  } catch (error) {
    devLog('Error getting current user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
