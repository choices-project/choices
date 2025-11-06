/**
 * PROFILE Feature Exports
 * 
 * Feature exports for profile functionality
 * Types are now centralized in /web/types/
 * 
 * Updated: October 26, 2025
 * Status: ✅ REFACTORED
 */

/**
 * Profile Feature - Main Export Module
 * 
 * Provides clean, organized exports for the profile feature including:
 * - Profile management components
 * - Profile data hooks and services
 * - Profile validation and utilities
 * - Profile types and constants
 * 
 * @fileoverview Central export point for all profile-related functionality
 * @version 1.0.0
 * @since 2024-12-19
 */

// ============================================================================
// COMPONENT EXPORTS
// ============================================================================

/** Main profile display page component */
export { default as ProfilePage } from './components/ProfilePage';

/** Profile editing form component */
export { default as ProfileEdit } from './components/ProfileEdit';

/** Avatar management component */
export { default as ProfileAvatar } from './components/ProfileAvatar';

/** Hashtag integration component */
export { default as ProfileHashtagIntegration } from './components/ProfileHashtagIntegration';

/** 🔒 Privacy dashboard component - View and manage all collected data */
export { default as MyDataDashboard } from './components/MyDataDashboard';

/** 🔒 Privacy settings page - Edit all 16 privacy controls */
export { default as PrivacySettingsPage } from './components/PrivacySettingsPage';

// ============================================================================
// HOOK EXPORTS
// ============================================================================

/** Profile data management hooks */
export {
  useProfileUpdate,
  useProfileAvatar,
  useProfileExport,
  useProfileDelete,
  useProfileLoadingStates,
  useProfileErrorStates,
  useProfileData,
  useProfileCompleteness,
  profileQueryKeys,
} from './hooks/use-profile';

// ============================================================================
// STORE EXPORTS
// ============================================================================

/** Zustand store integration - Centralized */
export {
  useProfileStore,
} from '@/lib/stores';

// ============================================================================
// SERVICE EXPORTS
// ============================================================================

/** Profile service functions */
export {
  getCurrentProfile,
  updateProfile,
  updateProfileAvatar,
  exportUserData,
  deleteProfile,
  transformApiResponseToProfile,
  transformProfileUpdateToApi,
  getProfileDisplayName,
  getProfileInitials,
  isProfileComplete,
  getTrustTierDisplayName,
  getParticipationStyleDisplayName,
} from './lib/profile-service';

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/** Core profile types */
export type {
  ProfileUser,
  UserProfile,
  ProfilePreferences,
  PrivacySettings,
  NotificationPreferences,
  FeedPreferences,
  VotingPreferences,
  ProfileUpdateData,
  ProfileActionResult,
  ProfileValidationResult,
  AvatarUploadResult,
  AvatarValidation,
  ProfileExportData,
  ExportOptions,
  ProfilePageProps,
  ProfileEditProps,
  ProfileAvatarProps,
  ProfilePreferencesProps,
  ProfilePrivacyProps,
  ProfileService,
  ProfileCache,
  UseProfileReturn,
  UseProfileUpdateReturn,
  UseProfileAvatarReturn,
  UseProfileExportReturn,
} from '@/types/profile';

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/** Profile validation utilities */
export {
  validateDisplayName,
  validateUsername,
  validateBio,
  validateEmail,
  validateProfileData,
  validateProfileCompleteness,
  validateAvatarFile,
  validatePrivacySettings,
  sanitizeProfileData,
  getValidationSummary,
} from './utils/profile-validation';

/** Profile constants and configuration */
export {
  PROFILE_LIMITS,
  AVATAR_RESTRICTIONS,
  TRUST_TIERS,
  PARTICIPATION_STYLES,
  PRIVACY_LEVELS,
  PRIMARY_CONCERNS,
  COMMUNITY_FOCUS,
  NOTIFICATION_TYPES,
  NOTIFICATION_CATEGORIES,
  THEME_OPTIONS,
  LANGUAGE_OPTIONS,
  DEFAULT_PROFILE,
  VALIDATION_RULES,
  API_ENDPOINTS,
  CACHE_SETTINGS,
} from './utils/profile-constants';

// ============================================================================
// FEATURE METADATA
// ============================================================================

export const PROFILE_FEATURE_METADATA = {
  name: 'Profile',
  version: '1.0.0',
  description: 'Comprehensive user profile management system',
  status: '✅ CONSOLIDATED',
  created: '2024-12-19',
  lastUpdated: '2024-12-19',
  components: [
    'ProfilePage',
    'ProfileEdit', 
    'ProfileAvatar',
    'MyDataDashboard', // 🔒 Privacy dashboard
    'PrivacySettingsPage', // 🔒 Privacy settings
  ],
  hooks: [
    'useProfile',
    'useProfileUpdate',
    'useProfileAvatar',
    'useProfileExport',
    'useProfileDelete',
    'useProfileLoadingStates',
    'useProfileErrorStates',
    'useProfileData',
    'useProfileCompleteness',
    'useProfileDisplay',
  ],
  services: [
    'getCurrentProfile',
    'updateProfile',
    'updateProfileAvatar',
    'exportUserData',
    'deleteProfile',
  ],
  utilities: [
    'validateProfileData',
    'validateProfileCompleteness',
    'validateAvatarFile',
    'sanitizeProfileData',
  ],
  types: [
    'ProfileUser',
    'UserProfile',
    'ProfileUpdateData',
    'ProfileActionResult',
    'ProfileValidationResult',
    'AvatarUploadResult',
    'ProfileExportData',
  ],
} as const;
