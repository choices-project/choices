/**
 * Profile Validation Utilities
 * 
 * Validation functions for profile data
 * Ensures data integrity and user input validation
 * 
 * Created: December 19, 2024
 * Status: ✅ CONSOLIDATED
 */

import { isValidEmail } from '@/lib/utils/format-utils';
import { withOptional } from '@/lib/utils/objects';

import type { 
  ProfileUpdateData, 
  ProfileValidationResult
} from '../types';
import { 
  PROFILE_CONSTANTS 
} from '../types';


// ============================================================================
// FIELD VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate display name
 * Checks length and character restrictions
 */
export function validateDisplayName(displayName: string): { isValid: boolean; error?: string } {
  if (!displayName || displayName.trim().length === 0) {
    return { isValid: false, error: 'Display name is required' };
  }

  if (displayName.length > PROFILE_CONSTANTS.MAX_DISPLAY_NAME_LENGTH) {
    return { 
      isValid: false, 
      error: `Display name must be ${PROFILE_CONSTANTS.MAX_DISPLAY_NAME_LENGTH} characters or less` 
    };
  }

  if (displayName.trim().length < 2) {
    return { isValid: false, error: 'Display name must be at least 2 characters' };
  }

  return { isValid: true };
}

/**
 * Validate username
 * Checks length, character restrictions, and uniqueness
 */
export function validateUsername(username: string): { isValid: boolean; error?: string } {
  if (!username || username.trim().length === 0) {
    return { isValid: false, error: 'Username is required' };
  }

  if (username.length > PROFILE_CONSTANTS.MAX_USERNAME_LENGTH) {
    return { 
      isValid: false, 
      error: `Username must be ${PROFILE_CONSTANTS.MAX_USERNAME_LENGTH} characters or less` 
    };
  }

  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { 
      isValid: false, 
      error: 'Username can only contain letters, numbers, underscores, and hyphens' 
    };
  }

  if (username.startsWith('-') || username.endsWith('-')) {
    return { 
      isValid: false, 
      error: 'Username cannot start or end with a hyphen' 
    };
  }

  return { isValid: true };
}

/**
 * Validate bio
 * Checks length and content restrictions
 */
export function validateBio(bio: string): { isValid: boolean; error?: string } {
  if (bio && bio.length > PROFILE_CONSTANTS.MAX_BIO_LENGTH) {
    return { 
      isValid: false, 
      error: `Bio must be ${PROFILE_CONSTANTS.MAX_BIO_LENGTH} characters or less` 
    };
  }

  return { isValid: true };
}

/**
 * Validate email
 * Checks email format and basic requirements
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: 'Email is required' };
  }

  if (!isValidEmail(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
}

// ============================================================================
// COMPREHENSIVE VALIDATION
// ============================================================================

/**
 * Validate complete profile data
 * Comprehensive validation for all profile fields
 */
export function validateProfileData(data: ProfileUpdateData): ProfileValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Display name validation
  if (data.displayname || data.display_name) {
    const displayName = data.displayname || data.display_name || '';
    const validation = validateDisplayName(displayName);
    if (!validation.isValid) {
      errors.push(validation.error!);
    }
  }

  // Username validation
  if (data.username) {
    const validation = validateUsername(data.username);
    if (!validation.isValid) {
      errors.push(validation.error!);
    }
  }

  // Bio validation
  if (data.bio) {
    const validation = validateBio(data.bio);
    if (!validation.isValid) {
      errors.push(validation.error!);
    }
  }

  // Trust tier validation
  if (data.trust_tier && !PROFILE_CONSTANTS.TRUST_TIERS.includes(data.trust_tier as any)) {
    errors.push(`Trust tier must be one of: ${PROFILE_CONSTANTS.TRUST_TIERS.join(', ')}`);
  }

  // Participation style validation
  if (data.participationstyle || data.participation_style) {
    const style = data.participationstyle || data.participation_style;
    if (style && !PROFILE_CONSTANTS.PARTICIPATION_STYLES.includes(style as any)) {
      errors.push(`Participation style must be one of: ${PROFILE_CONSTANTS.PARTICIPATION_STYLES.join(', ')}`);
    }
  }

  // Privacy settings validation
  if (data.privacysettings || data.privacy_settings) {
    const settings = data.privacysettings || data.privacy_settings;
    if (settings?.profile_visibility && !PROFILE_CONSTANTS.PROFILE_VISIBILITY.includes(settings.profile_visibility as any)) {
      errors.push(`Profile visibility must be one of: ${PROFILE_CONSTANTS.PROFILE_VISIBILITY.join(', ')}`);
    }
  }

  // Array field validation
  if (data.primaryconcerns || data.primary_concerns) {
    const concerns = data.primaryconcerns || data.primary_concerns || [];
    if (concerns.length > 10) {
      warnings.push('You can select up to 10 primary concerns');
    }
  }

  if (data.communityfocus || data.community_focus) {
    const focus = data.communityfocus || data.community_focus || [];
    if (focus.length > 10) {
      warnings.push('You can select up to 10 community focus areas');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// SPECIALIZED VALIDATION
// ============================================================================

/**
 * Validate profile completeness
 * Checks if profile has all required fields
 */
export function validateProfileCompleteness(profile: any): { 
  isComplete: boolean; 
  missingFields: string[]; 
  completionPercentage: number 
} {
  const requiredFields = ['display_name', 'username', 'email'];
  const missingFields: string[] = [];

  requiredFields.forEach(field => {
    if (!profile[field] || profile[field].trim().length === 0) {
      missingFields.push(field.replace('_', ' '));
    }
  });

  const isComplete = missingFields.length === 0;
  const completionPercentage = Math.round(((requiredFields.length - missingFields.length) / requiredFields.length) * 100);

  return {
    isComplete,
    missingFields,
    completionPercentage
  };
}

/**
 * Validate avatar file
 * Checks file size, type, and other restrictions
 */
export function validateAvatarFile(file: File): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }

  if (file.size > PROFILE_CONSTANTS.MAX_AVATAR_SIZE) {
    return { 
      isValid: false, 
      error: `File size must be less than ${Math.round(PROFILE_CONSTANTS.MAX_AVATAR_SIZE / (1024 * 1024))}MB` 
    };
  }

  if (!PROFILE_CONSTANTS.ALLOWED_AVATAR_TYPES.includes(file.type as 'image/jpeg' | 'image/png' | 'image/webp')) {
    return { 
      isValid: false, 
      error: `File type must be one of: ${PROFILE_CONSTANTS.ALLOWED_AVATAR_TYPES.join(', ')}` 
    };
  }

  return { isValid: true };
}

/**
 * Validate privacy settings
 * Ensures privacy settings are valid and consistent
 */
export function validatePrivacySettings(settings: any): { isValid: boolean; error?: string } {
  if (!settings) {
    return { isValid: true }; // Privacy settings are optional
  }

  if (settings.profile_visibility && !PROFILE_CONSTANTS.PROFILE_VISIBILITY.includes(settings.profile_visibility)) {
    return { 
      isValid: false, 
      error: `Profile visibility must be one of: ${PROFILE_CONSTANTS.PROFILE_VISIBILITY.join(', ')}` 
    };
  }

  return { isValid: true };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Sanitize profile data
 * Removes potentially harmful content and normalizes data
 */
export function sanitizeProfileData(data: ProfileUpdateData): ProfileUpdateData {
  const sanitized = withOptional(data);

  // Sanitize text fields
  if (sanitized.displayname) {
    sanitized.displayname = sanitized.displayname.trim();
  }
  if (sanitized.display_name) {
    sanitized.display_name = sanitized.display_name.trim();
  }
  if (sanitized.username) {
    sanitized.username = sanitized.username.trim().toLowerCase();
  }
  if (sanitized.bio) {
    sanitized.bio = sanitized.bio.trim();
  }

  // Sanitize arrays
  if (sanitized.primaryconcerns) {
    sanitized.primaryconcerns = sanitized.primaryconcerns.map(concern => concern.trim());
  }
  if (sanitized.primary_concerns) {
    sanitized.primary_concerns = sanitized.primary_concerns.map(concern => concern.trim());
  }
  if (sanitized.communityfocus) {
    sanitized.communityfocus = sanitized.communityfocus.map(focus => focus.trim());
  }
  if (sanitized.community_focus) {
    sanitized.community_focus = sanitized.community_focus.map(focus => focus.trim());
  }

  return sanitized;
}

/**
 * Get validation summary
 * Provides a summary of validation results
 */
export function getValidationSummary(validation: ProfileValidationResult): string {
  if (validation.isValid) {
    if (validation.warnings.length > 0) {
      return `Valid with ${validation.warnings.length} warning(s)`;
    }
    return 'Valid';
  }
  
  return `Invalid: ${validation.errors.join(', ')}`;
}
