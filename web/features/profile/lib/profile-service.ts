/**
 * Profile Service
 *
 * Core business logic for profile management
 * Consolidates profile operations from across the codebase
 *
 * Created: December 19, 2024
 * Status: ✅ CONSOLIDATED
 */

import logger from '@/lib/utils/logger';

import {
  PROFILE_CONSTANTS,
  PROFILE_DEFAULTS,
} from '../../../types/profile';

import type {
  ProfileUser,
  UserProfile,
  ProfileUpdateData,
  ProfileActionResult,
  ProfileValidationResult,
  AvatarUploadResult,
  ProfileExportData,
  ExportOptions,
  PrivacySettings,
  ProfileDemographics,
} from '../../../types/profile';
import type { Json } from '@/types/database';


type ProfileApiEnvelope = {
  success?: unknown;
  data?: unknown;
  profile?: unknown;
  error?: unknown;
};

type ProfileApiRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isJsonValue = (value: unknown): value is Json => {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  if (isRecord(value)) {
    return Object.values(value).every(isJsonValue);
  }

  return false;
};

const toStringOrUndefined = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

const toStringOrNull = (value: unknown): string | null =>
  typeof value === 'string' ? value : null;

const toBooleanOrNull = (value: unknown): boolean | null =>
  typeof value === 'boolean' ? value : null;

const toStringArrayOrNull = (value: unknown): string[] | null =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')
    ? (value as string[])
    : null;

const sanitizeJsonRecord = (value: Record<string, unknown>): Record<string, Json> => {
  const result: Record<string, Json> = {};
  Object.entries(value).forEach(([key, raw]) => {
    if (isJsonValue(raw)) {
      result[key] = raw;
    }
  });
  return result;
};

const toProfileDemographics = (value: unknown): ProfileDemographics | null => {
  if (!isRecord(value)) {
    return null;
  }

  const sanitized = sanitizeJsonRecord(value);
  return Object.keys(sanitized).length > 0 ? (sanitized as ProfileDemographics) : null;
};

type PrivacyVisibilityValue = Exclude<PrivacySettings['profile_visibility'], undefined>;

const PRIVACY_VISIBILITY_SET = new Set<PrivacyVisibilityValue>(
  PROFILE_CONSTANTS.PROFILE_VISIBILITY,
);

const isPrivacyVisibility = (value: unknown): value is PrivacyVisibilityValue =>
  typeof value === 'string' && PRIVACY_VISIBILITY_SET.has(value as PrivacyVisibilityValue);

const PRIVACY_BOOLEAN_KEYS: Array<keyof PrivacySettings> = [
  'collectLocationData',
  'collectVotingHistory',
  'trackInterests',
  'trackFeedActivity',
  'collectAnalytics',
  'trackRepresentativeInteractions',
  'showReadHistory',
  'showBookmarks',
  'showLikes',
  'shareActivity',
  'participateInTrustTier',
  'personalizeFeeds',
  'personalizeRecommendations',
  'retainVotingHistory',
  'retainSearchHistory',
  'retainLocationHistory',
  'allow_analytics',
  'show_activity',
  'allow_messages',
  'share_demographics',
  'show_email',
];

const toPrivacySettings = (value: unknown): Partial<PrivacySettings> | null => {
  if (!isRecord(value)) {
    return null;
  }

  const result: Partial<PrivacySettings> = {};

  PRIVACY_BOOLEAN_KEYS.forEach((key) => {
    const raw = value[key as string];
    if (typeof raw === 'boolean') {
      (result as Record<string, boolean | undefined>)[key as string] = raw;
    }
  });

  const visibility = value.profile_visibility;
  if (isPrivacyVisibility(visibility)) {
    result.profile_visibility = visibility;
  }

  return Object.keys(result).length > 0 ? result : null;
};

const toJsonValue = (value: unknown): Json | null => (isJsonValue(value) ? (value as Json) : null);

const pickProfilePayload = (envelope: ProfileApiEnvelope): ProfileApiRecord | null => {
  if (isRecord(envelope.profile)) {
    return envelope.profile;
  }
  if (isRecord(envelope.data)) {
    return envelope.data;
  }
  return null;
};

const buildProfileUser = (record: ProfileApiRecord): ProfileUser | null => {
  const id =
    toStringOrUndefined(record.id) ??
    toStringOrUndefined(record.userid) ??
    toStringOrUndefined(record.user_id);
  const email = toStringOrUndefined(record.email);
  const username = toStringOrUndefined(record.username);

  if (!id || !email || !username) {
    return null;
  }

  const createdAtSource = record.created_at ?? record.createdat;
  const updatedAtSource = record.updated_at ?? record.updatedat;

  const primaryConcerns = toStringArrayOrNull(record.primary_concerns) ?? [];
  const communityFocus = toStringArrayOrNull(record.community_focus) ?? [];

  const demographics =
    toProfileDemographics(record.demographics) ??
    ((PROFILE_DEFAULTS.demographics ?? null) as ProfileDemographics | null);

  const privacySettings =
    toPrivacySettings(record.privacy_settings) ?? PROFILE_DEFAULTS.privacy_settings ?? null;

  const participationStyle =
    toStringOrUndefined(record.participation_style) ??
    PROFILE_DEFAULTS.participation_style ??
    null;

  const trustTier =
    toStringOrUndefined(record.trust_tier) ?? PROFILE_DEFAULTS.trust_tier ?? null;

  const userId =
    toStringOrUndefined(record.user_id) ??
    toStringOrUndefined(record.userid) ??
    id;

  const profile: ProfileUser = {
    id,
    email,
    username,
    display_name: toStringOrNull(record.display_name ?? record.displayname),
    bio: toStringOrNull(record.bio),
    avatar_url: toStringOrNull(record.avatar_url ?? record.avatar),
    trust_tier: trustTier,
    is_admin: toBooleanOrNull(record.is_admin),
    is_active: toBooleanOrNull(record.is_active),
    created_at: toStringOrNull(createdAtSource),
    updated_at: toStringOrNull(updatedAtSource),
    user_id: userId,
    primary_concerns: primaryConcerns,
    community_focus: communityFocus,
    participation_style: participationStyle,
    demographics,
    privacy_settings: privacySettings,
    analytics_dashboard_mode: toStringOrNull(record.analytics_dashboard_mode),
    dashboard_layout: toJsonValue(record.dashboard_layout),
  };

  return profile;
};

const removeUndefined = <T extends Record<string, unknown>>(record: T): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined)
  );
// ============================================================================
// PROFILE VALIDATION
// ============================================================================

/**
 * Validate profile update data
 * Comprehensive validation for all profile fields
 */
export function validateProfileData(data: ProfileUpdateData): ProfileValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Display name validation
  if (data.display_name) {
    const displayName = data.display_name ?? '';
    if (displayName.length > PROFILE_CONSTANTS.MAX_DISPLAY_NAME_LENGTH) {
      errors.push(`Display name must be ${PROFILE_CONSTANTS.MAX_DISPLAY_NAME_LENGTH} characters or less`);
    }
    if (displayName.trim().length === 0) {
      warnings.push('Display name is empty');
    }
  }

  // Username validation
  if (data.username) {
    if (data.username.length > PROFILE_CONSTANTS.MAX_USERNAME_LENGTH) {
      errors.push(`Username must be ${PROFILE_CONSTANTS.MAX_USERNAME_LENGTH} characters or less`);
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(data.username)) {
      errors.push('Username can only contain letters, numbers, underscores, and hyphens');
    }
  }

  // Bio validation
  if (data.bio && data.bio.length > PROFILE_CONSTANTS.MAX_BIO_LENGTH) {
    errors.push(`Bio must be ${PROFILE_CONSTANTS.MAX_BIO_LENGTH} characters or less`);
  }

  // Trust tier validation (read-only, not updatable)
  // Note: trust_tier is not part of ProfileUpdateData as it's managed by the system

  // Participation style validation
  if (data.participation_style) {
    const style = data.participation_style;
    if (style && !PROFILE_CONSTANTS.PARTICIPATION_STYLES.includes(style)) {
      errors.push(`Participation style must be one of: ${PROFILE_CONSTANTS.PARTICIPATION_STYLES.join(', ')}`);
    }
  }

  // Privacy settings validation
  if (data.privacy_settings) {
    const settings = data.privacy_settings;
    if (settings?.profile_visibility && !PROFILE_CONSTANTS.PROFILE_VISIBILITY.includes(settings.profile_visibility)) {
      errors.push(`Profile visibility must be one of: ${PROFILE_CONSTANTS.PROFILE_VISIBILITY.join(', ')}`);
    }
  }

  const errorRecords: Record<string, string> = {};
  errors.forEach((error, index) => {
    errorRecords[`error_${index}`] = error;
  });

  const warningRecords: Record<string, string> = {};
  warnings.forEach((warning, index) => {
    warningRecords[`warning_${index}`] = warning;
  });

  return {
    isValid: errors.length === 0,
    errors: errorRecords,
    warnings: warningRecords
  };
}

// ============================================================================
// PROFILE DATA TRANSFORMATION
// ============================================================================

/**
 * Transform API response to ProfileUser format
 * Handles different API response formats
 */
export function transformApiResponseToProfile(apiData: unknown): ProfileUser | null {
  if (!isRecord(apiData) || apiData.success !== true) {
    return null;
  }

  const profileRecord = pickProfilePayload(apiData as ProfileApiEnvelope);
  if (!profileRecord) {
    return null;
  }

  return buildProfileUser(profileRecord);
}

/**
 * Transform ProfileUpdateData to API format
 * Handles different field naming conventions
 */
export function transformProfileUpdateToApi(data: ProfileUpdateData): Record<string, unknown> {
  const payload = {
    display_name: data.display_name,
    bio: data.bio,
    username: data.username,
    primary_concerns: data.primary_concerns,
    community_focus: data.community_focus,
    participation_style: data.participation_style,
    privacy_settings: data.privacy_settings,
    demographics: data.demographics,
  };

  return removeUndefined(payload);
}

// ============================================================================
// PROFILE API OPERATIONS
// ============================================================================

/**
 * Get current user profile
 * Fetches profile data from API endpoint
 */
export async function getCurrentProfile(): Promise<ProfileActionResult> {
  // Add timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000); // 30 second timeout

  try {
    const response = await fetch('/api/profile', {
      signal: controller.signal,
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const apiData = await response.json();
    const profile = transformApiResponseToProfile(apiData);

    if (!profile) {
      clearTimeout(timeoutId);
      return {
        success: false,
        error: 'Failed to load profile data',
      };
    }

    clearTimeout(timeoutId);
    return {
      success: true,
      data: profile,
    };

  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle AbortError specifically (timeout or manual abort)
    if (error instanceof Error && error.name === 'AbortError') {
      logger.warn('Profile fetch was aborted (likely timeout)');
      return {
        success: false,
        error: 'Profile request timed out. Please try again.',
      };
    }
    
    logger.error('Error fetching profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch profile',
    };
  }
}

/**
 * Update user profile
 * Updates profile data via API endpoint
 */
export async function updateProfile(updates: ProfileUpdateData): Promise<ProfileActionResult> {
  try {
    // Validate update data
    const validation = validateProfileData(updates);
    if (!validation.isValid) {
      return {
        success: false,
        error: Object.values(validation.errors).join(', '),
      };
    }

    // Transform data for API
    const apiData = transformProfileUpdateToApi(updates);

    const response = await fetch('/api/profile?action=update', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiData),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        error: result.error ?? 'Failed to update profile',
      };
    }

    return {
      success: true,
      data: result.profile,
    };

  } catch (error) {
    logger.error('Error updating profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update profile',
    };
  }
}

/**
 * Update profile avatar
 * Handles avatar file upload
 */
export async function updateProfileAvatar(file: File): Promise<AvatarUploadResult> {
  try {
    // Validate file
    if (file.size > PROFILE_CONSTANTS.MAX_AVATAR_SIZE) {
      return {
        success: false,
        error: `File size must be less than ${PROFILE_CONSTANTS.MAX_AVATAR_SIZE / (1024 * 1024)}MB`,
      };
    }

    if (!PROFILE_CONSTANTS.ALLOWED_AVATAR_TYPES.includes(file.type as 'image/jpeg' | 'image/png' | 'image/webp')) {
      return {
        success: false,
        error: `File type must be one of: ${PROFILE_CONSTANTS.ALLOWED_AVATAR_TYPES.join(', ')}`,
      };
    }

    // Create form data
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch('/api/profile?action=avatar', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to update avatar',
      };
    }

    return {
      success: true,
      url: result.avatar_url,
    };

  } catch (error) {
    logger.error('Error updating avatar:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update avatar',
    };
  }
}

/**
 * Export user data
 * Exports comprehensive user data
 */
export async function exportUserData(options?: ExportOptions): Promise<ProfileExportData> {
  try {
    const response = await fetch('/api/profile/export', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options ?? {}),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error ?? 'Failed to export data');
    }

    return result.data;

  } catch (error) {
    logger.error('Error exporting data:', error);
    throw error;
  }
}

/**
 * Delete user profile
 * Permanently deletes user profile and data
 */
export async function deleteProfile(): Promise<ProfileActionResult> {
  try {
    const response = await fetch('/api/profile/delete', {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to delete profile',
      };
    }

    return {
      success: true,
    };

  } catch (error) {
    logger.error('Error deleting profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete profile',
    };
  }
}

// ============================================================================
// PROFILE UTILITIES
// ============================================================================

/**
 * Get profile display name
 * Returns appropriate display name with fallbacks
 */
export function getProfileDisplayName(profile: ProfileUser | UserProfile): string {
  return profile.display_name ?? profile.username ?? profile.email?.split('@')[0] ?? 'User';
}

/**
 * Get profile initials
 * Returns initials for avatar fallback
 */
export function getProfileInitials(profile: ProfileUser | UserProfile): string {
  const displayName = getProfileDisplayName(profile);
  return displayName
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Check if profile is complete
 * Determines if profile has all required fields
 */
export function isProfileComplete(profile: ProfileUser | UserProfile): boolean {
  return !!(
    profile.display_name &&
    profile.username &&
    profile.email
  );
}

/**
 * Get trust tier display name
 * Returns human-readable trust tier name
 */
export function getTrustTierDisplayName(tier: string): string {
  const tierNames: Record<string, string> = {
    'T0': 'New User',
    'T1': 'Verified User',
    'T2': 'Trusted User',
    'T3': 'VIP User',
  };
  return tierNames[tier] ?? 'Unknown';
}

/**
 * Get participation style display name
 * Returns human-readable participation style name
 */
export function getParticipationStyleDisplayName(style: string): string {
  const styleNames: Record<string, string> = {
    'observer': 'Observer',
    'contributor': 'Contributor',
    'leader': 'Leader',
  };
  return styleNames[style] ?? 'Unknown';
}
