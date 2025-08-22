import { NextRequest, NextResponse } from 'next/server';
import { devLog } from '@/lib/logger';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      displayName, 
      bio, 
      primaryConcerns, 
      communityFocus, 
      participationStyle,
      demographics,
      privacy
    } = body

    // Get Supabase client
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
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
      user_id: user.userId,
      display_name: displayName || user.email?.split('@')[0],
      bio: bio || null,
      primary_concerns: primaryConcerns || [],
      community_focus: communityFocus || [],
      participation_style: participationStyle || 'observer',
      demographics: demographics || {},
      privacy_settings: privacy || {
        shareProfile: false,
        shareDemographics: false,
        shareParticipation: false,
        allowAnalytics: false
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    devLog('Creating user profile:', {
      user_id: profileData.user_id,
      display_name: profileData.display_name,
      participation_style: profileData.participation_style
    })

    // Insert or update profile
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert([profileData], {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select()

    if (error) {
      devLog('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to save profile', details: error instanceof Error ? error.message : "Unknown error" },
        { status: 500 }
      )
    }

    devLog('Profile created successfully:', data?.[0]?.id)

    return NextResponse.json({
      success: true,
      message: 'Profile saved successfully',
      profile: data?.[0]
    })

  } catch (error) {
    devLog('Profile API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get Supabase client
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
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

    // Get user profile
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, user_id, display_name, avatar_url, bio, created_at, updated_at')
      .eq('user_id', user.userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      devLog('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: data || null,
      hasProfile: !!data
    })

  } catch (error) {
    devLog('Profile API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get Supabase client
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Update profile data
    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', user.id)
      .select()

    if (error) {
      devLog('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: data?.[0]
    })

  } catch (error) {
    devLog('Profile API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
