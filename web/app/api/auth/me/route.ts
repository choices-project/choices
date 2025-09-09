import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger';

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

    // Get user profile from user_profiles table
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('username, email, trust_tier, display_name, avatar_url, bio, is_active')
      .eq('user_id', session.user.id)
      .single()

    if (profileError || !profile) {
      logger.warn('User profile not found', { userId: session.user.id })
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        username: profile.username,
        trust_tier: profile.trust_tier,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        is_active: profile.is_active
      }
    })

  } catch (error) {
    logger.error('Error getting current user', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
