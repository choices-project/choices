/**
 * Enhanced Profile API Route
 * 
 * Superior implementation - uses Supabase native sessions
 * This maintains API compatibility while using superior patterns
 * 
 * Created: January 27, 2025
 * Status: ✅ SUPERIOR IMPLEMENTATION
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { createApiLogger } from '@/lib/utils/api-logger';

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
      .select('id, user_id, display_name, avatar_url, bio, created_at, updated_at, trust_tier, username, email, is_admin, is_active')
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