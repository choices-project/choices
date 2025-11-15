import type { NextRequest } from 'next/server'

import { withErrorHandling, successResponse, authError, errorResponse, validationError } from '@/lib/api';
import { devLog } from '@/lib/utils/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

const VALID_PROFILE_VISIBILITY = ['public', 'private', 'friends_only', 'anonymous'] as const;
const VALID_DATA_SHARING = ['none', 'analytics_only', 'research', 'full'] as const;
const VALID_DATA_RETENTION = ['30_days', '90_days', '1_year', 'indefinite'] as const;

type PrivacyPreferencePayload = {
  profile_visibility?: typeof VALID_PROFILE_VISIBILITY[number];
  data_sharing_level?: typeof VALID_DATA_SHARING[number];
  data_retention_preference?: typeof VALID_DATA_RETENTION[number];
  allow_contact?: boolean;
  allow_research?: boolean;
  allow_marketing?: boolean;
  allow_analytics?: boolean;
  notification_preferences?: Record<string, boolean>;
};

const buildDefaultPreferences = (userId: string) => ({
  user_id: userId,
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
});

export const GET = withErrorHandling(async () => {
  const supabase = await getSupabaseServerClient()
  
  if (!supabase) {
    return errorResponse('Database connection failed', 500);
  }
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return authError('User not authenticated');
  }

    // Get privacy preferences
    const { data: preferences, error: preferencesError } = await (supabase as any)
      .from('user_privacy_preferences')
      .select('*')
      .eq('user_id', String(user.id))
      .single()

  if (preferencesError && preferencesError.code !== 'PGRST116') {
    devLog('Error fetching privacy preferences:', preferencesError)
    return errorResponse('Failed to fetch preferences', 500);
  }

    const defaultPreferences = buildDefaultPreferences(String(user.id));

  return successResponse({
    preferences: preferences ?? defaultPreferences
  });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return errorResponse('Database connection failed', 500);
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return authError('User not authenticated');
  }

  let body: PrivacyPreferencePayload;
  try {
    body = await request.json();
  } catch {
    return validationError({ _error: 'Invalid JSON body' });
  }

  const {
    profile_visibility,
    data_sharing_level,
    allow_contact,
    allow_research,
    allow_marketing,
    allow_analytics,
    notification_preferences,
    data_retention_preference
  } = body;

  const errors: Record<string, string> = {};

  if (profile_visibility && !VALID_PROFILE_VISIBILITY.includes(profile_visibility)) {
    errors.profile_visibility = 'Invalid profile visibility selection';
  }

  if (data_sharing_level && !VALID_DATA_SHARING.includes(data_sharing_level)) {
    errors.data_sharing_level = 'Invalid data sharing level';
  }

  if (data_retention_preference && !VALID_DATA_RETENTION.includes(data_retention_preference)) {
    errors.data_retention_preference = 'Invalid data retention preference';
  }

  const booleanFields: Array<[keyof PrivacyPreferencePayload, boolean | undefined]> = [
    ['allow_contact', allow_contact],
    ['allow_research', allow_research],
    ['allow_marketing', allow_marketing],
    ['allow_analytics', allow_analytics],
  ];

  for (const [field, value] of booleanFields) {
    if (value !== undefined && typeof value !== 'boolean') {
      errors[field] = 'Must be a boolean';
    }
  }

  if (
    notification_preferences !== undefined &&
    (typeof notification_preferences !== 'object' || Array.isArray(notification_preferences))
  ) {
    errors.notification_preferences = 'Notification preferences must be an object';
  }

  if (Object.keys(errors).length > 0) {
    return validationError(errors);
  }

  const preferencePayload: Record<string, any> = {
    user_id: String(user.id),
    updated_at: new Date().toISOString(),
  };

  if (profile_visibility) preferencePayload.profile_visibility = profile_visibility;
  if (data_sharing_level) preferencePayload.data_sharing_level = data_sharing_level;
  if (typeof allow_contact === 'boolean') preferencePayload.allow_contact = allow_contact;
  if (typeof allow_research === 'boolean') preferencePayload.allow_research = allow_research;
  if (typeof allow_marketing === 'boolean') preferencePayload.allow_marketing = allow_marketing;
  if (typeof allow_analytics === 'boolean') preferencePayload.allow_analytics = allow_analytics;
  if (notification_preferences && !Array.isArray(notification_preferences)) {
    preferencePayload.notification_preferences = notification_preferences;
  }
  if (data_retention_preference) {
    preferencePayload.data_retention_preference = data_retention_preference;
  }

  const { data: updatedPreferences, error: upsertError } = await (supabase as any)
    .from('user_privacy_preferences')
    .upsert(preferencePayload, { onConflict: 'user_id' })
    .select('*')
    .eq('user_id', String(user.id))
    .single();

  if (upsertError) {
    devLog('Error updating privacy preferences:', upsertError);
    return errorResponse('Failed to update preferences', 500);
  }

  const profileUpdates: Record<string, any> = {};
  if (profile_visibility) {
    profileUpdates.profile_visibility = profile_visibility;
  }

  if (data_sharing_level) {
    const dataSharingPreferences: Record<string, boolean> = {
      analytics: data_sharing_level !== 'none',
      research: data_sharing_level === 'research' || data_sharing_level === 'full',
    };

    if (typeof allow_contact === 'boolean') {
      dataSharingPreferences.contact = allow_contact;
    }

    if (typeof allow_marketing === 'boolean') {
      dataSharingPreferences.marketing = allow_marketing;
    }

    profileUpdates.data_sharing_preferences = dataSharingPreferences;
  }

  if (Object.keys(profileUpdates).length > 0) {
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update(profileUpdates)
      .eq('user_id', String(user.id));

    if (profileError) {
      devLog('Error updating user profile:', profileError);
    }
  }

  const effectivePreferences = updatedPreferences ?? buildDefaultPreferences(String(user.id));

  return successResponse({
    message: 'Privacy preferences updated successfully',
    preferences: effectivePreferences,
  });
});

