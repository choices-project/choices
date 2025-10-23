/**
 * Profile Service
 * 
 * Core business logic for profile management
 * Consolidates profile operations from across the codebase
 * 
 * Created: December 19, 2024
 * Status: ✅ CONSOLIDATED
 */

import type { 
  ProfileUser, 
  UserProfile, 
  ProfileUpdateData, 
  ProfileActionResult, 
  ProfileValidationResult,
  AvatarUploadResult,
  ProfileExportData,
  ExportOptions
} from '../types';
import { 
  PROFILE_CONSTANTS,
  PROFILE_DEFAULTS
} from '../types';

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
  if (data.displayname || data.display_name) {
    const displayName = data.displayname || data.display_name || '';
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

  // Trust tier validation
  if (data.trust_tier && !PROFILE_CONSTANTS.TRUST_TIERS.includes(data.trust_tier)) {
    errors.push(`Trust tier must be one of: ${PROFILE_CONSTANTS.TRUST_TIERS.join(', ')}`);
  }

  // Participation style validation
  if (data.participationstyle || data.participation_style) {
    const style = data.participationstyle || data.participation_style;
    if (style && !PROFILE_CONSTANTS.PARTICIPATION_STYLES.includes(style)) {
      errors.push(`Participation style must be one of: ${PROFILE_CONSTANTS.PARTICIPATION_STYLES.join(', ')}`);
    }
  }

  // Privacy settings validation
  if (data.privacysettings || data.privacy_settings) {
    const settings = data.privacysettings || data.privacy_settings;
    if (settings?.profile_visibility && !PROFILE_CONSTANTS.PROFILE_VISIBILITY.includes(settings.profile_visibility)) {
      errors.push(`Profile visibility must be one of: ${PROFILE_CONSTANTS.PROFILE_VISIBILITY.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// PROFILE DATA TRANSFORMATION
// ============================================================================

/**
 * Transform API response to ProfileUser format
 * Handles different API response formats
 */
export function transformApiResponseToProfile(apiData: any): ProfileUser | null {
  if (!apiData?.success) {
    return null;
  }

  const profile = apiData.data || apiData.profile;
  if (!profile) {
    return null;
  }

  return {
    id: profile.id || profile.userid || profile.user_id,
    email: profile.email,
    username: profile.username,
    display_name: profile.display_name || profile.displayname,
    bio: profile.bio,
    avatar_url: profile.avatar_url || profile.avatar,
    trust_tier: profile.trust_tier || PROFILE_DEFAULTS.TRUST_TIER,
    is_admin: profile.is_admin || false,
    is_active: profile.is_active !== false,
    created_at: profile.created_at || profile.createdat,
    updated_at: profile.updated_at || profile.updatedat,
  };
}

/**
 * Transform ProfileUpdateData to API format
 * Handles different field naming conventions
 */
export function transformProfileUpdateToApi(data: ProfileUpdateData): any {
  return {
    displayname: data.displayname || data.display_name,
    bio: data.bio,
    username: data.username,
    primaryconcerns: data.primaryconcerns || data.primary_concerns,
    communityfocus: data.communityfocus || data.community_focus,
    participationstyle: data.participationstyle || data.participation_style,
    privacysettings: data.privacysettings || data.privacy_settings,
    preferences: data.preferences,
    demographics: data.demographics,
  };
}

// ============================================================================
// PROFILE API OPERATIONS
// ============================================================================

/**
 * Get current user profile
 * Fetches profile data from API endpoint
 */
export async function getCurrentProfile(): Promise<ProfileActionResult> {
  try {
    const response = await fetch('/api/profile', {
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
      return {
        success: false,
        error: 'Failed to load profile data',
      };
    }

    return {
      success: true,
      data: profile,
    };

  } catch (error) {
    console.error('Error fetching profile:', error);
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
        error: validation.errors.join(', '),
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
        error: result.error || 'Failed to update profile',
      };
    }

    return {
      success: true,
      data: result.profile,
      message: result.message || 'Profile updated successfully',
    };

  } catch (error) {
    console.error('Error updating profile:', error);
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
      avatar_url: result.avatar_url,
    };

  } catch (error) {
    console.error('Error updating avatar:', error);
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
      body: JSON.stringify(options || {}),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to export data');
    }

    return result.data;

  } catch (error) {
    console.error('Error exporting data:', error);
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
      message: result.message || 'Profile deleted successfully',
    };

  } catch (error) {
    console.error('Error deleting profile:', error);
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
  return profile.display_name || profile.username || profile.email?.split('@')[0] || 'User';
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
  return tierNames[tier] || 'Unknown';
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
  return styleNames[style] || 'Unknown';
}
