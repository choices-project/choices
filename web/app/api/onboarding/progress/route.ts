import type { NextRequest} from 'next/server';

import { withErrorHandling, successResponse, authError, errorResponse, validationError } from '@/lib/api';
import { devLog } from '@/lib/utils/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (): Promise<any> => {
  const supabase = getSupabaseServerClient()

  if (!supabase) {
    return errorResponse('Database connection failed', 500);
  }

  const supabaseClient = await supabase;

  // Get current user
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
  if (userError || !user) {
    return authError('User not authenticated');
  }

    // Get onboarding progress
    const { data: progress, error: progressError } = await (supabaseClient as any)
      .from('onboarding_progress')
      .select('*')
      .eq('user_id', String(user.id))
      .single()

  if (progressError && progressError.code !== 'PGRST116') {
    devLog('Error fetching onboarding progress:', progressError)
    return errorResponse('Failed to fetch progress', 500);
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

  return successResponse({
    progress: progress ?? {
      user_id: user.id,
      current_step: 'welcome',
      completed_steps: [],
      step_data: {},
      started_at: null,
      last_activity_at: null,
      completed_at: null,
      total_time_minutes: null
    },
    profile: profile ?? {
      onboarding_completed: false,
      onboarding_step: 'welcome',
      privacy_level: 'medium',
      profile_visibility: 'public',
      data_sharing_preferences: { analytics: true, research: false, contact: false, marketing: false }
    }
  });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = getSupabaseServerClient()

  if (!supabase) {
    return errorResponse('Database connection failed', 500);
  }

  const supabaseClient = await supabase;

  // Get current user
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
  if (userError || !user) {
    return authError('User not authenticated');
  }

  const body = await request.json()
  const { step, data, action } = body

  if (!step) {
    return validationError({ step: 'Step is required' });
  }

    let updatedProgress: any = null;
    let progressError: any = null;

    switch (action) {
      case 'start': {
        // Start onboarding - upsert progress record
        const { data: startData, error: startError } = await (supabaseClient as any)
          .from('onboarding_progress')
          .upsert({
            user_id: user.id,
            current_step: step || 'welcome',
            started_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString()
          })
          .select()
          .single();
        updatedProgress = startData;
        progressError = startError;
        break;
      }

      case 'update': {
        // Update onboarding step
        const { data: updateData, error: updateError } = await (supabaseClient as any)
          .from('onboarding_progress')
          .update({
            current_step: step,
            step_data: data || {},
            last_activity_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .select()
          .single();
        updatedProgress = updateData;
        progressError = updateError;
        break;
      }

      case 'complete': {
        // Complete onboarding
        const { data: completeData, error: completeError } = await (supabaseClient as any)
          .from('onboarding_progress')
          .update({
            completed_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .select()
          .single();
        updatedProgress = completeData;
        progressError = completeError;
        break;
      }

      default:
        return validationError({ action: 'Invalid action. Use: start, update, or complete' });
    }

    if (progressError && progressError.code !== 'PGRST116') {
      devLog('Error fetching updated progress:', progressError)
    }

    return successResponse({
      progress: updatedProgress,
      message: `Onboarding ${action} successful`
    });
});

