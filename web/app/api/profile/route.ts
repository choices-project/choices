/**
 * @fileoverview Profile Management API
 * 
 * Comprehensive profile management API providing user profile CRUD operations,
 * preferences management, interests tracking, and onboarding progress handling.
 * Supports avatar uploads, privacy settings, and complete user data management.
 * 
 * @author Choices Platform Team
 * @created 2025-10-24
 * @version 2.0.0
 * @since 1.0.0
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { undefinedToNull } from '@/lib/util/clean';



// Validation schemas
const profileSchema = z.object({
  // Required fields for database
  email: z.string().email(),
  
  // Optional profile fields that match database schema
  avatar_url: z.string().url().optional().or(z.literal('')),
  bio: z.string().max(500).optional(),
  display_name: z.string().max(100).optional(),
  username: z.string().min(3).max(50).optional(),
  trust_tier: z.string().optional(),
  is_admin: z.boolean().optional(),
  is_active: z.boolean().optional(),
  // onboarding_completed removed - determined by presence of key fields
  // Additional fields that exist in database
  community_focus: z.array(z.string()).optional(),
  primary_concerns: z.array(z.string()).optional(),
  primary_hashtags: z.array(z.string()).optional(),
  followed_hashtags: z.array(z.string()).optional(),
  preferences: z.any().optional(),
  demographics: z.any().optional(),
  location_data: z.any().optional(),
  privacy_settings: z.any().optional(),
});

const preferencesSchema = z.object({
  email_notifications: z.boolean().optional(),
  push_notifications: z.boolean().optional(),
  dark_mode: z.boolean().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  marketing_emails: z.boolean().optional(),
  weekly_digest: z.boolean().optional(),
});

const interestsSchema = z.object({
  categories: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
});

const onboardingSchema = z.object({
  step: z.number().int().min(1).max(10).optional(),
  completed: z.boolean().optional(),
  completed_at: z.string().optional(),
});

/**
 * Get user profile with preferences, interests, and onboarding data
 * 
 * Fetches the authenticated user's profile from user_profiles table,
 * along with privacy_settings as preferences, interests, and onboarding progress.
 * 
 * @param {NextRequest} request - Request object
 * @returns {Promise<NextResponse>} Object containing profile, preferences, interests, and onboarding data
 * 
 * @example
 * GET /api/profile
 * // Returns: { profile: {...}, preferences: {...}, interests: {...}, onboarding: {...} }
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      logger.error('Supabase not configured');
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      logger.warn('User not authenticated or auth error', authError);
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found
      logger.error('Error fetching profile', profileError);
      return NextResponse.json({ error: 'Error fetching profile' }, { status: 500 });
    }

    // Fetch preferences from user_profiles.privacy_settings (new schema)
    let preferences = null;
    if (profile?.privacy_settings) {
      preferences = profile.privacy_settings;
    }

    // Fetch interests - FUNCTIONALITY MERGED INTO user_profiles
    const interests = {
      categories: profile?.primary_concerns ?? [],
      keywords: profile?.community_focus ?? [],
      topics: [] // primary_hashtags not in schema
    };

    // Fetch onboarding progress - determined by presence of key fields
    const isOnboardingCompleted = !!(
      profile?.demographics && 
      profile?.primary_concerns && 
      profile?.community_focus &&
      profile?.participation_style
    );
    const onboarding = {
      completed: isOnboardingCompleted,
      data: profile?.demographics ?? {}
    };

    const responseData = {
      profile: profile ?? null,
      preferences: preferences ?? null,
      interests: interests ?? null,
      onboarding: onboarding ?? null,
    };

    logger.info('Profile data fetched successfully', { userId: user.id });
    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    logger.error('GET /api/profile error', error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Handle profile, preferences, interests, and onboarding updates
 * 
 * Processes different types of updates based on request body:
 * - profile: Updates user_profiles table fields
 * - preferences: Updates privacy_settings in user_profiles
 * - interests: Updates interests in user_profiles
 * - onboarding: Updates onboarding progress and demographics
 * - avatar: Handles avatar upload to storage
 * 
 * @param {NextRequest} request - Request object
 * @param {Object} [request.body.profile] - Profile data to update
 * @param {Object} [request.body.preferences] - Privacy preferences to update
 * @param {Object} [request.body.interests] - User interests to update
 * @param {Object} [request.body.onboarding] - Onboarding progress to update
 * @param {File} [request.body.avatar] - Avatar file to upload
 * @returns {Promise<NextResponse>} Update result for the specific action taken
 * 
 * @example
 * POST /api/profile
 * {
 *   "profile": { "display_name": "John Doe", "bio": "Developer" },
 *   "preferences": { "notifications": true, "dataSharing": false }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      logger.error('Supabase not configured');
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      logger.warn('User not authenticated or auth error', authError);
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    const body = await request.json();

    let response = NextResponse.json({ message: 'No specific action taken' }, { status: 200 });

    // Handle profile updates
    if (body.profile) {
      const parsedProfile = profileSchema.safeParse(body.profile);
      if (!parsedProfile.success) {
        logger.warn('Invalid profile data', parsedProfile.error.issues);
        return NextResponse.json({ error: 'Invalid profile data', details: parsedProfile.error.issues }, { status: 400 });
      }
    const { data, error } = await supabase
      .from('user_profiles')
      .update(undefinedToNull(parsedProfile.data) as Record<string, unknown>)
      .eq('user_id', user.id)
      .select();
    if (error) {
        logger.error('Error upserting profile', error);
        return NextResponse.json({ error: 'Error updating profile' }, { status: 500 });
      }
      logger.info('Profile updated successfully', { userId: user.id, profile: data });
      response = NextResponse.json({ message: 'Profile updated successfully', profile: data }, { status: 200 });
    }

    // Handle preferences updates - now stored in user_profiles.privacy_settings
    if (body.preferences) {
      const parsedPreferences = preferencesSchema.safeParse(body.preferences);
      if (!parsedPreferences.success) {
        logger.warn('Invalid preferences data', parsedPreferences.error.issues);
        return NextResponse.json({ error: 'Invalid preferences data', details: parsedPreferences.error.issues }, { status: 400 });
      }
      
      // Update privacy_settings in user_profiles table
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ 
          privacy_settings: parsedPreferences.data,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select();
        
      if (error) {
        logger.error('Error updating preferences', error);
        return NextResponse.json({ error: 'Error updating preferences' }, { status: 500 });
      }
      logger.info('Preferences updated successfully', { userId: user.id, preferences: data });
      response = NextResponse.json({ message: 'Preferences updated successfully', preferences: data }, { status: 200 });
    }

    // Handle interests updates
    if (body.interests) {
      const parsedInterests = interestsSchema.safeParse(body.interests);
      if (!parsedInterests.success) {
        logger.warn('Invalid interests data', parsedInterests.error.issues);
        return NextResponse.json({ error: 'Invalid interests data', details: parsedInterests.error.issues }, { status: 400 });
      }
      // FUNCTIONALITY MERGED INTO user_profiles - update profile with interests
      const updateData: Record<string, unknown> = {};
      if (parsedInterests.data.categories) {
        updateData.primary_concerns = parsedInterests.data.categories;
      }
      if (parsedInterests.data.keywords) {
        updateData.community_focus = parsedInterests.data.keywords;
      }
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', user.id)
        .select();
      if (error) {
        logger.error('Error upserting interests', error);
        return NextResponse.json({ error: 'Error updating interests' }, { status: 500 });
      }
      logger.info('Interests updated successfully', { userId: user.id, interests: data });
      response = NextResponse.json({ message: 'Interests updated successfully', interests: data }, { status: 200 });
    }

    // Handle onboarding progress updates
    if (body.onboarding) {
      const parsedOnboarding = onboardingSchema.safeParse(body.onboarding);
      if (!parsedOnboarding.success) {
        logger.warn('Invalid onboarding data', parsedOnboarding.error.issues);
        return NextResponse.json({ error: 'Invalid onboarding data', details: parsedOnboarding.error.issues }, { status: 400 });
      }
    // Update profile with onboarding data - no separate onboarding_completed field
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        demographics: parsedOnboarding.data,
        trust_tier: 'bronze', // Start with bronze trust tier
        participation_style: 'balanced',
        primary_concerns: [],
        community_focus: [],
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select();
    if (error) {
        logger.error('Error upserting onboarding progress', error);
        return NextResponse.json({ error: 'Error updating onboarding progress' }, { status: 500 });
      }
      logger.info('Onboarding progress updated successfully', { userId: user.id, onboarding: data });
      response = NextResponse.json({ message: 'Onboarding progress updated successfully', onboarding: data }, { status: 200 });
    }

    // Handle avatar upload (if file is present in form data)
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('avatar') as File;

      if (file) {
        const fileName = `${user.id}-${Date.now()}.${file.name.split('.').pop()}`;
        const { data: _uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          logger.error('Avatar upload error', uploadError);
          return NextResponse.json({ error: 'Error uploading avatar' }, { status: 500 });
        }

        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        const avatarUrl = publicUrlData.publicUrl;

        const { error: updateProfileError } = await supabase
          .from('user_profiles')
          .update({ avatar_url: avatarUrl })
          .eq('id', user.id);

        if (updateProfileError) {
          logger.error('Error updating profile with avatar URL', updateProfileError);
          return NextResponse.json({ error: 'Error updating profile with avatar URL' }, { status: 500 });
        }
        logger.info('Avatar uploaded and profile updated successfully', { userId: user.id, avatarUrl });
        response = NextResponse.json({ message: 'Avatar uploaded successfully', avatar_url: avatarUrl }, { status: 200 });
      }
    }

    return response;

  } catch (error) {
    logger.error('POST /api/profile error', error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Update user profile (full replacement)
 * 
 * @param {NextRequest} request - Request object
 * @param {Object} request.body - Complete profile data
 * @returns {Promise<NextResponse>} Profile update result
 * 
 * @example
 * PUT /api/profile
 * {
 *   "display_name": "John Doe",
 *   "bio": "Updated bio"
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      logger.error('Supabase not configured');
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      logger.warn('User not authenticated or auth error', authError);
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    const body = await request.json();

    const parsedProfile = profileSchema.safeParse(body);
    if (!parsedProfile.success) {
      logger.warn('Invalid profile data for PUT', parsedProfile.error.issues);
      return NextResponse.json({ error: 'Invalid profile data', details: parsedProfile.error.issues }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update(undefinedToNull(parsedProfile.data) as Record<string, unknown>)
      .eq('id', user.id)
      .select();

    if (error) {
      logger.error('Error updating profile via PUT', error);
      return NextResponse.json({ error: 'Error updating profile' }, { status: 500 });
    }

    if (data?.length === 0) {
      return NextResponse.json({ error: 'Profile not found or no changes made' }, { status: 404 });
    }

    logger.info('Profile updated successfully via PUT', { userId: user.id, profile: data[0] });
    return NextResponse.json({ message: 'Profile updated successfully', profile: data[0] }, { status: 200 });

  } catch (error) {
    logger.error('PUT /api/profile error', error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Delete user profile
 * 
 * @param {NextRequest} request - Request object
 * @returns {Promise<NextResponse>} Profile deletion result
 * 
 * @example
 * DELETE /api/profile
 */
export async function DELETE(_request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      logger.error('Supabase not configured');
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      logger.warn('User not authenticated or auth error', authError);
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Delete all related data using new schema
    const deletePromises = [
      supabase.from('user_profiles').delete().eq('user_id', user.id),
      supabase.from('votes').delete().eq('user_id', user.id),
      supabase.from('polls').delete().eq('created_by', user.id),
      supabase.from('analytics_events').delete().eq('user_id', user.id),
      supabase.from('user_hashtags').delete().eq('user_id', user.id),
      supabase.from('feedback').delete().eq('user_id', user.id),
    ];

    const results = await Promise.allSettled(deletePromises);
    
    // Check for errors
    const errors = results.filter(result => result.status === 'rejected' || (result.status === 'fulfilled' && result.value.error));
    if (errors.length > 0) {
      logger.error('Error deleting profile data', errors);
      return NextResponse.json({ error: 'Error deleting profile data' }, { status: 500 });
    }

    logger.info('Profile deleted successfully', { userId: user.id });
    return NextResponse.json({ message: 'Profile deleted successfully' }, { status: 200 });

  } catch (error) {
    logger.error('DELETE /api/profile error', error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Partial update of user profile
 * 
 * @param {NextRequest} request - Request object
 * @param {Object} request.body - Partial profile data to update
 * @returns {Promise<NextResponse>} Profile update result
 * 
 * @example
 * PATCH /api/profile
 * {
 *   "bio": "Updated bio only"
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      logger.error('Supabase not configured');
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      logger.warn('User not authenticated or auth error', authError);
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    const body = await request.json();

    // Validate partial profile data
    const parsedProfile = profileSchema.partial().safeParse(body);
    if (!parsedProfile.success) {
      logger.warn('Invalid profile data for PATCH', parsedProfile.error.issues);
      return NextResponse.json({ error: 'Invalid profile data', details: parsedProfile.error.issues }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update(undefinedToNull({ ...parsedProfile.data, updated_at: new Date().toISOString() }) as Record<string, unknown>)
      .eq('id', user.id)
      .select();

    if (error) {
      logger.error('Error updating profile via PATCH', error);
      return NextResponse.json({ error: 'Error updating profile' }, { status: 500 });
    }

    if (data?.length === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    logger.info('Profile updated successfully via PATCH', { userId: user.id, profile: data[0] });
    return NextResponse.json({ message: 'Profile updated successfully', profile: data[0] }, { status: 200 });

  } catch (error) {
    logger.error('PATCH /api/profile error', error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}