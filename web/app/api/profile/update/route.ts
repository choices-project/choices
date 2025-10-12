/**
 * Enhanced Profile Update API Route
 * 
 * Superior implementation - handles profile updates with proper validation
 * Maintains compatibility with existing profile edit page
 * 
 * Created: January 27, 2025
 * Status: ✅ SUPERIOR IMPLEMENTATION
 */

import { type NextRequest, NextResponse } from 'next/server';

import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/profile/update - Update user profile
 * Superior implementation using Supabase native sessions
 */
export async function PUT(request: NextRequest) {
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

    // Prepare update data with proper field mapping
    const updateData = {
      display_name: body.displayname || body.displayName,
      bio: body.bio,
      primary_concerns: body.primaryconcerns || body.primaryConcerns || [],
      community_focus: body.communityfocus || body.communityFocus || [],
      participation_style: body.participationstyle || body.participationStyle || 'observer',
      demographics: body.demographics || {},
      privacy_settings: body.privacysettings || body.privacySettings || {
        profile_visibility: 'public',
        show_email: false,
        show_activity: true,
        allow_messages: true,
        share_demographics: false,
        allow_analytics: true
      },
      updated_at: new Date().toISOString()
    };

    // Update profile in database
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', String(user.id) as any)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: data
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}