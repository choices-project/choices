/**
 * Profile Feature Types
 * 
 * Consolidated type definitions for the profile feature
 * Includes all profile-related types from across the codebase
 * 
 * Created: December 19, 2024
 * Status: ✅ CONSOLIDATED
 */

// ============================================================================
// CORE PROFILE TYPES
// ============================================================================

export type ProfileUser = {
  id: string;
  email: string;
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  trust_tier: 'T0' | 'T1' | 'T2' | 'T3';
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type UserProfile = {
  id: string;
  user_id: string;
  username: string;
  email: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  trust_tier: 'T0' | 'T1' | 'T2' | 'T3';
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Enhanced profile fields
  preferences?: ProfilePreferences;
  privacy_settings?: PrivacySettings;
  primary_concerns?: string[];
  community_focus?: string[];
  participation_style?: 'observer' | 'contributor' | 'leader';
  demographics?: Record<string, any>;
  
  // Hashtag integration
  hashtags?: ProfileHashtagIntegration;
  custom_interests?: string[];
  trending_hashtags?: string[];
}

export type ProfilePreferences = {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  timezone?: string;
  notifications?: NotificationPreferences;
  feed_preferences?: FeedPreferences;
  voting_preferences?: VotingPreferences;
}

export type PrivacySettings = {
  profile_visibility: 'public' | 'private' | 'friends';
  show_email: boolean;
  show_activity: boolean;
  allow_messages: boolean;
  share_demographics: boolean;
  allow_analytics: boolean;
  data_retention?: DataRetentionSettings;
}

export type NotificationPreferences = {
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  poll_updates: boolean;
  representative_updates: boolean;
  system_updates: boolean;
}

export type FeedPreferences = {
  show_votes: boolean;
  show_bills: boolean;
  show_statements: boolean;
  show_social_media: boolean;
  show_photos: boolean;
  content_filters?: string[];
  trending_topics?: boolean;
}

export type VotingPreferences = {
  voting_method: 'single' | 'approval' | 'ranked' | 'range' | 'quadratic';
  privacy_level: 'public' | 'anonymous' | 'private';
  notifications: boolean;
  reminders: boolean;
}

export type DataRetentionSettings = {
  profile_data: number; // days
  activity_data: number; // days
  analytics_data: number; // days
  export_data: number; // days
}

// ============================================================================
// HASHTAG INTEGRATION TYPES
// ============================================================================

export type ProfileHashtagIntegration = {
  user_id: string;
  primary_hashtags?: string[];
  interest_hashtags?: string[];
  custom_hashtags?: string[];
  followed_hashtags?: string[];
  hashtag_preferences?: HashtagUserPreferences;
  hashtag_activity?: HashtagEngagement[];
  last_updated: string;
}

export type HashtagUserPreferences = {
  user_id: string;
  default_categories: string[];
  auto_follow_suggestions: boolean;
  trending_notifications: boolean;
  related_hashtag_suggestions: boolean;
  privacy_settings: {
    show_followed_hashtags: boolean;
    show_hashtag_activity: boolean;
    allow_hashtag_recommendations: boolean;
  };
  notification_preferences: {
    new_trending_hashtags: boolean;
    hashtag_updates: boolean;
    related_content: boolean;
    weekly_digest: boolean;
  };
  created_at: string;
  updated_at: string;
}

export type HashtagEngagement = {
  hashtag_id: string;
  user_id: string;
  engagement_type: 'view' | 'click' | 'share' | 'create' | 'follow' | 'unfollow';
  content_id?: string;
  content_type?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// PROFILE UPDATE TYPES
// ============================================================================

export type ProfileUpdateData = {
  displayname?: string;
  display_name?: string;
  bio?: string;
  username?: string;
  primaryconcerns?: string[];
  primary_concerns?: string[];
  communityfocus?: string[];
  community_focus?: string[];
  participationstyle?: 'observer' | 'contributor' | 'leader';
  participation_style?: 'observer' | 'contributor' | 'leader';
  trust_tier?: 'T0' | 'T1' | 'T2' | 'T3';
  privacysettings?: PrivacySettings;
  privacy_settings?: PrivacySettings;
  preferences?: ProfilePreferences;
  demographics?: Record<string, any>;
  
  // Hashtag integration fields
  hashtags?: ProfileHashtagIntegration;
  custom_interests?: string[];
  trending_hashtags?: string[];
}

export type ProfileActionResult = {
  success: boolean;
  data?: ProfileUser | UserProfile;
  error?: string;
  message?: string;
}

export type ProfileValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// AVATAR TYPES
// ============================================================================

export type AvatarUploadResult = {
  success: boolean;
  avatar_url?: string;
  error?: string;
}

export type AvatarValidation = {
  isValid: boolean;
  error?: string;
  maxSize: number;
  allowedTypes: string[];
}

// ============================================================================
// PROFILE EXPORT TYPES
// ============================================================================

export type ProfileExportData = {
  profile: UserProfile;
  preferences: ProfilePreferences;
  privacy_settings: PrivacySettings;
  activity_data?: any[];
  voting_history?: any[];
  representative_data?: any[];
  export_date: string;
  export_version: string;
}

export type ExportOptions = {
  include_activity: boolean;
  include_voting: boolean;
  include_representatives: boolean;
  format: 'json' | 'csv' | 'pdf';
  date_range?: {
    start: string;
    end: string;
  };
}

// ============================================================================
// PROFILE COMPONENT PROPS
// ============================================================================

export type ProfilePageProps = {
  user?: ProfileUser;
  isLoading?: boolean;
  error?: string;
  onEdit?: () => void;
  onSettings?: () => void;
  onExport?: () => void;
}

export type ProfileEditProps = {
  profile: UserProfile;
  onSave: (updates: ProfileUpdateData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string;
}

export type ProfileAvatarProps = {
  avatar_url?: string;
  display_name?: string;
  onUpload: (file: File) => Promise<AvatarUploadResult>;
  onRemove: () => Promise<void>;
  isLoading?: boolean;
  maxSize?: number;
  allowedTypes?: string[];
}

export type ProfilePreferencesProps = {
  preferences: ProfilePreferences;
  onUpdate: (preferences: ProfilePreferences) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export type ProfilePrivacyProps = {
  privacy_settings: PrivacySettings;
  onUpdate: (settings: PrivacySettings) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

// ============================================================================
// PROFILE SERVICE TYPES
// ============================================================================

export type ProfileService = {
  getCurrentProfile: () => Promise<ProfileActionResult>;
  updateProfile: (updates: ProfileUpdateData) => Promise<ProfileActionResult>;
  updateAvatar: (file: File) => Promise<AvatarUploadResult>;
  exportData: (options?: ExportOptions) => Promise<ProfileExportData>;
  validateProfile: (data: ProfileUpdateData) => ProfileValidationResult;
  deleteProfile: () => Promise<ProfileActionResult>;
}

export type ProfileCache = {
  profile: UserProfile | null;
  lastUpdated: string;
  isStale: boolean;
}

// ============================================================================
// PROFILE HOOK TYPES
// ============================================================================

export type UseProfileReturn = {
  profile: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  isStale: boolean;
}

export type UseProfileUpdateReturn = {
  updateProfile: (updates: ProfileUpdateData) => Promise<void>;
  isUpdating: boolean;
  error: Error | null;
  isSuccess: boolean;
}

export type UseProfileAvatarReturn = {
  uploadAvatar: (file: File) => Promise<AvatarUploadResult>;
  removeAvatar: () => Promise<void>;
  isUploading: boolean;
  error: Error | null;
}

export type UseProfileExportReturn = {
  exportData: (options?: ExportOptions) => Promise<ProfileExportData>;
  isExporting: boolean;
  error: Error | null;
  isSuccess: boolean;
}

// ============================================================================
// PROFILE CONSTANTS
// ============================================================================

export const PROFILE_CONSTANTS = {
  MAX_AVATAR_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_AVATAR_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_BIO_LENGTH: 500,
  MAX_DISPLAY_NAME_LENGTH: 100,
  MAX_USERNAME_LENGTH: 50,
  TRUST_TIERS: ['T0', 'T1', 'T2', 'T3'] as const,
  PARTICIPATION_STYLES: ['observer', 'contributor', 'leader'] as const,
  PROFILE_VISIBILITY: ['public', 'private', 'friends'] as const,
  EXPORT_FORMATS: ['json', 'csv', 'pdf'] as const,
} as const;

export const PROFILE_DEFAULTS = {
  TRUST_TIER: 'T0' as const,
  PARTICIPATION_STYLE: 'observer' as const,
  PROFILE_VISIBILITY: 'public' as const,
  PRIVACY_SETTINGS: {
    profile_visibility: 'public' as const,
    show_email: false,
    show_activity: true,
    allow_messages: true,
    share_demographics: false,
    allow_analytics: true,
  },
  PREFERENCES: {
    theme: 'system' as const,
    language: 'en',
    timezone: 'UTC',
    notifications: {
      email_notifications: true,
      push_notifications: true,
      sms_notifications: false,
      poll_updates: true,
      representative_updates: true,
      system_updates: true,
    },
  },
} as const;

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================
