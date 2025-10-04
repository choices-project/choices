import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { devLog } from '@/lib/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/core/auth/utils'

export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      displayName, 
      bio, 
      primaryConcerns, 
      communityFocus, 
      participationStyle,
      demographics,
      privacySettings
    } = body

    // Get Supabase client
    const supabase = await getSupabaseServerClient()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    // Get current user from JWT token
    const user = getCurrentUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Prepare profile data
    const profileData = {
      display_name: displayName,
      bio: bio || null,
      primary_concerns: primaryConcerns || [],
      community_focus: communityFocus || [],
      participation_style: participationStyle || 'observer',
      demographics: demographics || {},
      privacy_settings: privacySettings || {
        profile_visibility: 'public',
        show_email: false,
        show_activity: true,
        allow_messages: true,
        share_demographics: false,
        allow_analytics: true
      },
      updated_at: new Date().toISOString()
    }

    // Update profile in database
    const { data, error } = await supabase
      .from('user_profiles')
      .update(profileData)
      .eq('user_id', user.userId)
      .select()
      .single()

    if (error) {
      devLog('Profile update error:', error)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: data
    })

  } catch (error) {
    devLog('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
