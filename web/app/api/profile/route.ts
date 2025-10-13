/**
 * Consolidated Profile API Endpoint
 * 
 * This endpoint consolidates all profile functionality:
 * - User profile management
 * - Profile updates
 * - Avatar management
 * - User preferences
 * - User interests
 * - Onboarding completion
 * 
 * Usage:
 * GET /api/profile - Get current user profile
 * POST /api/profile - Create user profile
 * PUT /api/profile - Update user profile
 * POST /api/profile/avatar - Upload avatar
 * GET /api/profile/preferences - Get user preferences
 * PUT /api/profile/preferences - Update user preferences
 * GET /api/profile/interests - Get user interests
 * PUT /api/profile/interests - Update user interests
 * POST /api/profile/complete-onboarding - Complete onboarding
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createApiLogger } from '@/lib/utils/api-logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/profile - Get current user profile
 * Superior implementation using Supabase native sessions
 */
export async function GET(_request: NextRequest) {
  const logger = createApiLogger('/api/profile', 'GET');
  
  try {
    logger.info('Request received');
    
    // Get Supabase client
    const supabase = await getSupabaseServerClient();
    
    if (!supabase) {
      logger.error('Supabase client not configured');
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // Get current user session from cookies
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      logger.warn('User not authenticated', { sessionError });
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const user = session.user;
    logger.info('User authenticated', { userId: user.id });

    // Get user profile
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, user_id, display_name, avatar_url, bio, created_at, updated_at, trust_tier, username, email, is_admin, is_active, onboarding_completed')
      .eq('user_id', String(user.id) as any)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('Database error while fetching profile', error);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }
    
    logger.success('Profile data retrieved successfully', 200, { profileId: data?.id });

    const response = NextResponse.json({
      success: true,
      profile: data || null,
      hasProfile: !!data,
      email: user.email
    });
    
    // Add CORS headers for E2E tests
    response.headers.set('access-control-allow-origin', '*');
    response.headers.set('access-control-allow-methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('access-control-allow-headers', 'Content-Type, Authorization');
    
    return response;

  } catch (error) {
    logger.error('Profile API error', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile - Create user profile
 * Superior implementation using Supabase native sessions
 */
export async function POST(request: NextRequest) {
  const logger = createApiLogger('/api/profile', 'POST');
  
  try {
    const body = await request.json();
    
    // Get Supabase client
    const supabase = await getSupabaseServerClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // Get current user session from cookies
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const user = session.user;

    // Prepare profile data
    const profileData = {
      user_id: user.id,
      display_name: body.displayName || user.email?.split('@')[0],
      bio: body.bio || null,
      username: body.username || user.email?.split('@')[0],
      trust_tier: 'T0',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert or update profile
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert([profileData] as any, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      logger.error('Database error during profile creation', error);
      return NextResponse.json(
        { error: 'Failed to save profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile saved successfully',
      profile: data[0]
    });

  } catch (error) {
    logger.error('Profile creation error', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile - Update user profile
 * Superior implementation using Supabase native sessions
 */
export async function PUT(request: NextRequest) {
  const logger = createApiLogger('/api/profile', 'PUT');
  
  try {
    const body = await request.json();
    
    // Get Supabase client
    const supabase = await getSupabaseServerClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // Get current user session from cookies
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const user = session.user;

    // Update profile data
    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', String(user.id) as any)
      .select();

    if (error) {
      logger.error('Database error during profile update', error);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: data[0]
    });

  } catch (error) {
    logger.error('Profile update error', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile/avatar - Upload avatar
 * Consolidated avatar management
 */
export async function POST_AVATAR(request: NextRequest) {
  const logger = createApiLogger('/api/profile/avatar', 'POST');
  
  try {
    const formData = await request.formData();
    const file = formData.get('avatar') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabase = await getSupabaseServerClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const user = session.user;

    // Upload file to Supabase Storage
    const fileName = `${user.id}-${Date.now()}.${file.name.split('.').pop()}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file);

    if (uploadError) {
      logger.error('Avatar upload error', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload avatar' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Update user profile with new avatar URL
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ 
        avatar_url: urlData.publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', String(user.id) as any)
      .select();

    if (error) {
      logger.error('Database error during avatar update', error);
      return NextResponse.json(
        { error: 'Failed to update avatar' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Avatar updated successfully',
      avatarUrl: urlData.publicUrl,
      profile: data[0]
    });

  } catch (error) {
    logger.error('Avatar upload error', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/profile/preferences - Get user preferences
 * Consolidated preferences management
 */
export async function GET_PREFERENCES(_request: NextRequest) {
  const logger = createApiLogger('/api/profile/preferences', 'GET');
  
  try {
    // Get Supabase client
    const supabase = await getSupabaseServerClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const user = session.user;

    // Get user preferences
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', String(user.id) as any)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('Database error while fetching preferences', error);
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      preferences: data || {
        notifications: true,
        email_updates: true,
        privacy_level: 'standard',
        theme: 'system'
      }
    });

  } catch (error) {
    logger.error('Preferences API error', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile/preferences - Update user preferences
 * Consolidated preferences management
 */
export async function PUT_PREFERENCES(request: NextRequest) {
  const logger = createApiLogger('/api/profile/preferences', 'PUT');
  
  try {
    const body = await request.json();
    
    // Get Supabase client
    const supabase = await getSupabaseServerClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const user = session.user;

    // Update preferences
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert([{
        user_id: user.id,
        ...body,
        updated_at: new Date().toISOString()
      }] as any, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      logger.error('Database error during preferences update', error);
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: data[0]
    });

  } catch (error) {
    logger.error('Preferences update error', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/profile/interests - Get user interests
 * Consolidated interests management
 */
export async function GET_INTERESTS(_request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user interests from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('interests')
      .eq('id', user.id)
      .single();

    if (userError) {
      logger.error('Failed to fetch user interests:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user interests' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      interests: userData?.interests || []
    });

  } catch (error) {
    logger.error('Error in interests GET:', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile/interests - Update user interests
 * Consolidated interests management
 */
export async function PUT_INTERESTS(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const { interests } = await request.json();
    
    if (!Array.isArray(interests)) {
      return NextResponse.json(
        { error: 'Interests must be an array' },
        { status: 400 }
      );
    }

    // Update user interests in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        interests,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      logger.error('Failed to update user interests:', updateError);
      return NextResponse.json(
        { error: 'Failed to save interests' },
        { status: 500 }
      );
    }

    logger.info(`User ${user.id} updated interests:`, { interests });

    return NextResponse.json({
      success: true,
      message: 'Interests saved successfully',
      interests
    });

  } catch (error) {
    logger.error('Error in interests PUT:', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/profile/onboarding-progress - Get onboarding progress
 * Consolidated onboarding management
 */
export async function GET_ONBOARDING_PROGRESS(_request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    const supabaseClient = await supabase;
    
    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get onboarding progress
    const { data: progress, error: progressError } = await supabaseClient
      .from('onboarding_progress')
      .select('*')
      .eq('user_id', String(user.id) as any)
      .single();

    if (progressError && progressError.code !== 'PGRST116') {
      logger.error('Error fetching onboarding progress:', progressError);
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
    }

    // Get user profile for additional onboarding data
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('onboarding_completed, onboarding_step, privacy_level, profile_visibility, data_sharing_preferences')
      .eq('user_id', String(user.id) as any)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      logger.error('Error fetching user profile:', profileError);
    }

    return NextResponse.json({
      success: true,
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
    });
  } catch (error) {
    logger.error('Error in onboarding progress GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/profile/onboarding-progress - Update onboarding progress
 * Consolidated onboarding management
 */
export async function POST_ONBOARDING_PROGRESS(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    const supabaseClient = await supabase;
    
    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { step, data, action } = body;

    if (!step) {
      return NextResponse.json({ error: 'Step is required' }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'start':
        // Start onboarding
        result = await supabaseClient.rpc('start_onboarding', { p_user_id: user.id });
        break;

      case 'update':
        // Update onboarding step
        result = await supabaseClient.rpc('update_onboarding_step', { 
          p_user_id: user.id, 
          p_step: step, 
          p_data: data || {} 
        });
        break;

      case 'complete':
        // Complete onboarding
        result = await supabaseClient.rpc('complete_onboarding', { p_user_id: user.id });
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (result.error) {
      logger.error('Error updating onboarding progress:', result.error);
      return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
    }

    // Get updated progress
    const { data: updatedProgress, error: progressError } = await supabaseClient
      .from('onboarding_progress')
      .select('*')
      .eq('user_id', String(user.id) as any)
      .single();

    if (progressError && progressError.code !== 'PGRST116') {
      logger.error('Error fetching updated progress:', progressError);
    }

    return NextResponse.json({
      success: true,
      progress: updatedProgress,
      message: `Onboarding ${action} successful`
    });
  } catch (error) {
    logger.error('Error in onboarding progress POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/profile/complete-onboarding - Complete onboarding
 * Consolidated onboarding management
 */
export async function POST_COMPLETE_ONBOARDING(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      );
    }

    const supabaseClient = await supabase;

    // Get current user from Supabase Auth
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      logger.warn('User not authenticated for onboarding completion');
      return NextResponse.redirect(new URL('/login', request.url), { status: 303 });
    }

    // Handle both form data and JSON requests
    const contentType = request.headers.get('content-type');
    let preferences = {};
    
    if (contentType?.includes('application/json')) {
      const body = await request.json();
      preferences = body.preferences || {};
    } else {
      // Handle form data
      const formData = await request.formData();
      // Extract preferences from form data if needed
      preferences = {
        notifications: formData.get('notifications') === 'true',
        dataSharing: formData.get('dataSharing') === 'true',
        theme: formData.get('theme') || 'system'
      };
    }

    // Update user profile to mark onboarding as completed
    const { error: updateError } = await supabaseClient
      .from('user_profiles')
      .update({
        onboarding_completed: true,
        preferences,
        updated_at: new Date().toISOString()
      } as any)
      .eq('user_id', user.id);

    if (updateError) {
      logger.error('Failed to complete onboarding', updateError);
      return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 });
    }

    // Create response with explicit redirect
    const dest = new URL('/dashboard', request.url).toString(); // absolute
    
    // Use 302 for WebKit/Safari, 303 for others (WebKit redirect quirk workaround)
    const userAgent = request.headers.get('user-agent') || '';
    const isWebKit = userAgent.includes('WebKit') && !userAgent.includes('Chrome');
    const status = isWebKit ? 302 : 303;
    
    const response = NextResponse.redirect(dest, { status });

    // Add explicit headers for WebKit compatibility
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('Content-Length', '0'); // help some UA edge cases

    logger.info('Onboarding completed successfully', { userId: user.id });

    return response;

  } catch (error) {
    logger.error('Complete onboarding error', error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}