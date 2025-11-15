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

import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { authError, errorResponse, successResponse, validationError, withErrorHandling, parseBody } from '@/lib/api';
import { createProfilePayload } from '@/lib/api/response-builders';
import { undefinedToNull } from '@/lib/util/clean';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';



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

type ProfileRecord = Record<string, unknown> | null;

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
export const GET = withErrorHandling(async (_request: NextRequest) => {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    logger.error('Supabase not configured');
    return errorResponse('Database connection not available', 500);
  }

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    logger.warn('User not authenticated or auth error', authErr);
    return authError('Authentication required');
  }

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found
      logger.error('Error fetching profile', profileError);
      return errorResponse('Error fetching profile', 500, undefined, 'PROFILE_FETCH_FAILED');
    }

    const responseData = createProfilePayload(profile);

  logger.info('Profile data fetched successfully', { userId: user.id });
  return successResponse(responseData);
});

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
export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    logger.error('Supabase not configured');
    return errorResponse('Database connection not available', 500);
  }

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    logger.warn('User not authenticated or auth error', authErr);
    return authError('Authentication required');
  }
  const contentType = request.headers.get('content-type') ?? '';
  const isMultipart = contentType.includes('multipart/form-data');
  let body: any = {};

  if (!isMultipart) {
    const parsedBody = await parseBody<Record<string, unknown>>(request);
    if (!parsedBody.success) {
      return parsedBody.error;
    }
    body = parsedBody.data ?? {};
  }

  const { data: existingProfile, error: profileFetchError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (profileFetchError && profileFetchError.code !== 'PGRST116') {
    logger.error('Error fetching profile before update', profileFetchError);
    return errorResponse('Error fetching profile data', 500, undefined, 'PROFILE_FETCH_FAILED');
  }

  let currentProfile: ProfileRecord = (existingProfile ?? null) as ProfileRecord;
  const captureProfileUpdate = (candidate: unknown) => {
    const nextRecord =
      Array.isArray(candidate) && candidate.length > 0
        ? candidate[0]
        : candidate && typeof candidate === 'object'
          ? candidate
          : null;
    if (nextRecord) {
      currentProfile = nextRecord as ProfileRecord;
    }
  };
  const actionMessages: string[] = [];

    // Handle profile updates
    if (body.profile) {
      const parsedProfile = profileSchema.safeParse(body.profile);
      if (!parsedProfile.success) {
        logger.warn('Invalid profile data', parsedProfile.error.issues);
        const errorDetails = parsedProfile.error.issues.reduce((acc, issue) => {
          acc[issue.path.join('.')] = issue.message;
          return acc;
        }, {} as Record<string, string>);
        return validationError(errorDetails, 'Invalid profile data');
      }
    const { data, error } = await supabase
      .from('user_profiles')
      .update(undefinedToNull(parsedProfile.data) as Record<string, unknown>)
      .eq('user_id', user.id)
      .select();
    if (error) {
        logger.error('Error upserting profile', error);
        return errorResponse('Error updating profile', 500);
      }
      logger.info('Profile updated successfully', { userId: user.id, profile: data });
      captureProfileUpdate(data);
      actionMessages.push('Profile updated successfully');
    }

    // Handle preferences updates - now stored in user_profiles.privacy_settings
    if (body.preferences) {
      const parsedPreferences = preferencesSchema.safeParse(body.preferences);
      if (!parsedPreferences.success) {
        logger.warn('Invalid preferences data', parsedPreferences.error.issues);
        const errorDetails = parsedPreferences.error.issues.reduce((acc, issue) => {
          acc[issue.path.join('.')] = issue.message;
          return acc;
        }, {} as Record<string, string>);
        return validationError(errorDetails, 'Invalid preferences data');
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
        return errorResponse('Error updating preferences', 500);
      }
      logger.info('Preferences updated successfully', { userId: user.id, preferences: data });
      captureProfileUpdate(data);
      actionMessages.push('Preferences updated successfully');
    }

    // Handle interests updates
    if (body.interests) {
      const parsedInterests = interestsSchema.safeParse(body.interests);
      if (!parsedInterests.success) {
        logger.warn('Invalid interests data', parsedInterests.error.issues);
        const errorDetails = parsedInterests.error.issues.reduce((acc, issue) => {
          acc[issue.path.join('.')] = issue.message;
          return acc;
        }, {} as Record<string, string>);
        return validationError(errorDetails, 'Invalid interests data');
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
        return errorResponse('Error updating interests', 500);
      }
      logger.info('Interests updated successfully', { userId: user.id, interests: data });
      captureProfileUpdate(data);
      actionMessages.push('Interests updated successfully');
    }

    // Handle onboarding progress updates
    if (body.onboarding) {
      const parsedOnboarding = onboardingSchema.safeParse(body.onboarding);
      if (!parsedOnboarding.success) {
        logger.warn('Invalid onboarding data', parsedOnboarding.error.issues);
        const errorDetails = parsedOnboarding.error.issues.reduce((acc, issue) => {
          acc[issue.path.join('.')] = issue.message;
          return acc;
        }, {} as Record<string, string>);
        return validationError(errorDetails, 'Invalid onboarding data');
      }
    // Update profile with onboarding data - no separate onboarding_completed field
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        demographics: parsedOnboarding.data,
        trust_tier: 'T1', // Promote to canonical trust tier after onboarding
        participation_style: 'balanced',
        primary_concerns: [],
        community_focus: [],
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select();
    if (error) {
        logger.error('Error upserting onboarding progress', error);
        return errorResponse('Error updating onboarding progress', 500);
      }
      logger.info('Onboarding progress updated successfully', { userId: user.id, onboarding: data });
      captureProfileUpdate(data);
      actionMessages.push('Onboarding progress updated successfully');
    }

    // Handle avatar upload (if file is present in form data)
    if (isMultipart) {
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
          return errorResponse('Error uploading avatar', 500, undefined, 'PROFILE_AVATAR_UPLOAD_FAILED');
        }

        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        const avatarUrl = publicUrlData.publicUrl;

        const { data: avatarProfile, error: updateProfileError } = await supabase
          .from('user_profiles')
          .update({ avatar_url: avatarUrl })
          .eq('user_id', user.id)
          .select('*')
          .single();

        if (updateProfileError) {
          logger.error('Error updating profile with avatar URL', updateProfileError);
          return errorResponse('Error updating profile with avatar URL', 500, undefined, 'PROFILE_AVATAR_UPDATE_FAILED');
        }
        logger.info('Avatar uploaded and profile updated successfully', { userId: user.id, avatarUrl });
        captureProfileUpdate(avatarProfile);
        actionMessages.push('Avatar uploaded successfully');
      }
    }

  const message = actionMessages.length ? actionMessages.join(' | ') : 'No profile changes applied';
  return successResponse({
    ...createProfilePayload(currentProfile),
    message,
  });
});

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
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    logger.error('Supabase not configured');
    return errorResponse('Supabase not configured', 500);
  }

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    logger.warn('User not authenticated or auth error', authErr);
    return authError('User not authenticated');
  }

  const parsedBody = await parseBody<Record<string, unknown>>(request);
  if (!parsedBody.success) {
    return parsedBody.error;
  }

  const parsedProfile = profileSchema.safeParse(parsedBody.data);
  if (!parsedProfile.success) {
    logger.warn('Invalid profile data for PUT', parsedProfile.error.issues);
    const errorDetails = parsedProfile.error.issues.reduce((acc, issue) => {
      acc[issue.path.join('.')] = issue.message;
      return acc;
    }, {} as Record<string, string>);
    return validationError(errorDetails, 'Invalid profile data');
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .update(undefinedToNull(parsedProfile.data) as Record<string, unknown>)
    .eq('user_id', user.id)
    .select();

  if (error) {
    logger.error('Error updating profile via PUT', error);
    return errorResponse('Error updating profile', 500, undefined, 'PROFILE_UPDATE_FAILED');
  }

  if (!data?.length) {
    return errorResponse('Profile not found or no changes made', 404, undefined, 'PROFILE_NOT_FOUND');
  }

  const updatedProfile = (data[0] ?? null) as ProfileRecord;
  logger.info('Profile updated successfully via PUT', { userId: user.id, profile: updatedProfile });
  return successResponse({
    ...createProfilePayload(updatedProfile),
    message: 'Profile updated successfully',
  });
});

/**
 * Delete user profile
 *
 * @param {NextRequest} request - Request object
 * @returns {Promise<NextResponse>} Profile deletion result
 *
 * @example
 * DELETE /api/profile
 */
export const DELETE = withErrorHandling(async (_request: NextRequest) => {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    logger.error('Supabase not configured');
    return errorResponse('Supabase not configured', 500);
  }

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    logger.warn('User not authenticated or auth error', authErr);
    return authError('User not authenticated');
  }

  const deletePromises = [
    supabase.from('user_profiles').delete().eq('user_id', user.id),
    supabase.from('votes').delete().eq('user_id', user.id),
    supabase.from('polls').delete().eq('created_by', user.id),
    supabase.from('analytics_events').delete().eq('user_id', user.id),
    supabase.from('user_hashtags').delete().eq('user_id', user.id),
    supabase.from('feedback').delete().eq('user_id', user.id),
  ];

  const results = await Promise.allSettled(deletePromises);
  const errors = results.filter((result) => {
    if (result.status === 'rejected') {
      return true;
    }
    return Boolean((result.value as { error?: unknown }).error);
  });

  if (errors.length > 0) {
    logger.error('Error deleting profile data', errors);
    return errorResponse('Error deleting profile data', 500, undefined, 'PROFILE_DELETE_FAILED');
  }

  logger.info('Profile deleted successfully', { userId: user.id });
  return successResponse({ message: 'Profile deleted successfully' });
});

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
export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    logger.error('Supabase not configured');
    return errorResponse('Supabase not configured', 500);
  }

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    logger.warn('User not authenticated or auth error', authErr);
    return authError('User not authenticated');
  }

  const parsedBody = await parseBody<Record<string, unknown>>(request);
  if (!parsedBody.success) {
    return parsedBody.error;
  }

  const parsedProfile = profileSchema.partial().safeParse(parsedBody.data);
  if (!parsedProfile.success) {
    logger.warn('Invalid profile data for PATCH', parsedProfile.error.issues);
    const errorDetails = parsedProfile.error.issues.reduce((acc, issue) => {
      acc[issue.path.join('.')] = issue.message;
      return acc;
    }, {} as Record<string, string>);
    return validationError(errorDetails, 'Invalid profile data');
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .update(undefinedToNull({ ...parsedProfile.data, updated_at: new Date().toISOString() }) as Record<string, unknown>)
    .eq('user_id', user.id)
    .select();

  if (error) {
    logger.error('Error updating profile via PATCH', error);
    return errorResponse('Error updating profile', 500, undefined, 'PROFILE_UPDATE_FAILED');
  }

  if (!data?.length) {
    return errorResponse('Profile not found', 404, undefined, 'PROFILE_NOT_FOUND');
  }

  const updatedProfile = (data[0] ?? null) as ProfileRecord;
  logger.info('Profile updated successfully via PATCH', { userId: user.id, profile: updatedProfile });
  return successResponse({
    ...createProfilePayload(updatedProfile),
    message: 'Profile updated successfully',
  });
});
