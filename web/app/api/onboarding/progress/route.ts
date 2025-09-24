import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/utils/supabase/server'
import { devLog } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }
    
    const supabaseClient = await supabase;
    
    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get onboarding progress
    const { data: progress, error: progressError } = await supabaseClient
      .from('onboarding_progress')
      .select('*')
      .eq('user_id', String(user.id) as any)
      .single()

    if (progressError && progressError.code !== 'PGRST116') {
      devLog('Error fetching onboarding progress:', progressError)
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
    }

    // Get user profile for additional onboarding data
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('onboarding_completed, onboarding_step, privacy_level, profile_visibility, data_sharing_preferences')
      .eq('user_id', String(user.id) as any)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      devLog('Error fetching user profile:', profileError)
    }

    return NextResponse.json({
      progress: progress || {
        user_id: user.id,
        current_step: 'welcome',
        completed_steps: [],
        step_data: {},
        started_at: null,
        last_activity_at: null,
        completed_at: null,
        total_time_minutes: null
      },
      profile: profile || {
        onboarding_completed: false,
        onboarding_step: 'welcome',
        privacy_level: 'medium',
        profile_visibility: 'public',
        data_sharing_preferences: { analytics: true, research: false, contact: false, marketing: false }
      }
    })
  } catch (error) {
    devLog('Error in onboarding progress GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }
    
    const supabaseClient = await supabase;
    
    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { step, data, action } = body

    if (!step) {
      return NextResponse.json({ error: 'Step is required' }, { status: 400 })
    }

    let result

    switch (action) {
      case 'start':
        // Start onboarding
        result = await supabaseClient.rpc('start_onboarding', { p_user_id: user.id })
        break

      case 'update':
        // Update onboarding step
        result = await supabaseClient.rpc('update_onboarding_step', { 
          p_user_id: user.id, 
          p_step: step, 
          p_data: data || {} 
        })
        break

      case 'complete':
        // Complete onboarding
        result = await supabaseClient.rpc('complete_onboarding', { p_user_id: user.id })
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (result.error) {
      devLog('Error updating onboarding progress:', result.error)
      return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
    }

    // Get updated progress
    const { data: updatedProgress, error: progressError } = await supabaseClient
      .from('onboarding_progress')
      .select('*')
      .eq('user_id', String(user.id) as any)
      .single()

    if (progressError && progressError.code !== 'PGRST116') {
      devLog('Error fetching updated progress:', progressError)
    }

    return NextResponse.json({
      success: true,
      progress: updatedProgress,
      message: `Onboarding ${action} successful`
    })
  } catch (error) {
    devLog('Error in onboarding progress POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

