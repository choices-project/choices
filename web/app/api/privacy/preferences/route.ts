import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { devLog } from '@/lib/logger'
import { cookies } from 'next/headers'

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get privacy preferences
    const { data: preferences, error: preferencesError } = await supabase
      .from('user_privacy_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (preferencesError && preferencesError.code !== 'PGRST116') {
      devLog('Error fetching privacy preferences:', preferencesError)
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
    }

    // Return default preferences if none exist
    const defaultPreferences = {
      user_id: user.id,
      profile_visibility: 'public',
      data_sharing_level: 'analytics_only',
      allow_contact: false,
      allow_research: false,
      allow_marketing: false,
      allow_analytics: true,
      notification_preferences: { email: true, push: true, sms: false },
      data_retention_preference: '90_days',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json({
      preferences: preferences || defaultPreferences
    })
  } catch (error) {
    devLog('Error in privacy preferences GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      profile_visibility,
      data_sharing_level,
      allow_contact,
      allow_research,
      allow_marketing,
      allow_analytics,
      notification_preferences,
      data_retention_preference
    } = body

    // Validate input
    const validProfileVisibility = ['public', 'private', 'friends_only', 'anonymous']
    const validDataSharingLevel = ['none', 'analytics_only', 'research', 'full']
    const validDataRetention = ['30_days', '90_days', '1_year', 'indefinite']

    if (profile_visibility && !validProfileVisibility.includes(profile_visibility)) {
      return NextResponse.json({ error: 'Invalid profile visibility' }, { status: 400 })
    }

    if (data_sharing_level && !validDataSharingLevel.includes(data_sharing_level)) {
      return NextResponse.json({ error: 'Invalid data sharing level' }, { status: 400 })
    }

    if (data_retention_preference && !validDataRetention.includes(data_retention_preference)) {
      return NextResponse.json({ error: 'Invalid data retention preference' }, { status: 400 })
    }

    // Update privacy preferences using the database function
    const result = await supabase.rpc('update_privacy_preferences', {
      p_user_id: user.id,
      p_profile_visibility: profile_visibility,
      p_data_sharing_level: data_sharing_level,
      p_allow_contact: allow_contact,
      p_allow_research: allow_research,
      p_allow_marketing: allow_marketing,
      p_allow_analytics: allow_analytics,
      p_notification_preferences: notification_preferences,
      p_data_retention_preference: data_retention_preference
    })

    if (result.error) {
      devLog('Error updating privacy preferences:', result.error)
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
    }

    // Also update user_profiles table for backward compatibility
    const profileUpdates: any = {}
    if (profile_visibility) profileUpdates.profile_visibility = profile_visibility
    if (data_sharing_level) profileUpdates.data_sharing_preferences = { 
      analytics: data_sharing_level !== 'none',
      research: data_sharing_level === 'research' || data_sharing_level === 'full',
      contact: allow_contact,
      marketing: allow_marketing
    }

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update(profileUpdates)
        .eq('user_id', user.id)

      if (profileError) {
        devLog('Error updating user profile:', profileError)
      }
    }

    // Get updated preferences
    const { data: updatedPreferences, error: fetchError } = await supabase
      .from('user_privacy_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      devLog('Error fetching updated preferences:', fetchError)
    }

    return NextResponse.json({
      success: true,
      preferences: updatedPreferences,
      message: 'Privacy preferences updated successfully'
    })
  } catch (error) {
    devLog('Error in privacy preferences POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

