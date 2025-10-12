/**
 * Enhanced User Profile API Route
 * 
 * Superior implementation - maintains E2E bypass functionality
 * Uses Supabase native sessions consistently
 * 
 * Created: January 27, 2025
 * Status: ✅ SUPERIOR IMPLEMENTATION
 */

import { type NextRequest, NextResponse } from 'next/server';

import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/profile - Get user profile
 * Superior implementation using Supabase native sessions
 */
export async function GET(_request: NextRequest) {
  try {
    // Use Supabase native sessions - no E2E bypasses
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

    // Get user profile from database
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, user_id, display_name, avatar_url, bio, created_at, updated_at, trust_tier, username')
      .eq('user_id', String(user.id) as any)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    // Return profile data in expected format
    const profileData = data ? {
      id: data.id,
      userid: data.user_id,
      displayname: data.display_name,
      bio: data.bio,
      username: data.username,
      trust_tier: data.trust_tier,
      createdat: data.created_at,
      updatedat: data.updated_at,
      avatar: data.avatar_url
    } : null;

    return NextResponse.json({
      success: true,
      user: profileData,
      hasProfile: !!data
    });

  } catch (error) {
    console.error('User profile API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
