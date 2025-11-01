/**
 * Profile Types
 * 
 * Type definitions for user profile functionality based on actual database schema
 * Generated from Supabase user_profiles table
 * 
 * Created: October 26, 2025
 * Status: ✅ ACTIVE
 */

import type { Database } from './database';

// Base types from database
export type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];

// Extended profile types for UI
export type UserProfile = {
  // Additional computed fields
  initials?: string;
  fullName?: string;
  isComplete?: boolean;
  completionPercentage?: number;
} & UserProfileRow

// Profile editing types
export type ProfileUpdateData = {
  display_name?: string;
  bio?: string;
  username?: string;
  primary_concerns?: string[];
  community_focus?: string[];
  participation_style?: 'observer' | 'participant' | 'leader' | 'organizer';
  privacy_settings?: {
    profile_visibility?: 'public' | 'private' | 'friends';
    show_email?: boolean;
    show_activity?: boolean;
    allow_messages?: boolean;
    share_demographics?: boolean;
    allow_analytics?: boolean;
  };
  demographics?: Record<string, any>;
}

// Profile preferences
export type ProfilePreferences = {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
  feed: FeedPreferences;
  voting: VotingPreferences;
}

export type NotificationPreferences = {
  email: boolean;
  push: boolean;
  inApp: boolean;
  mentions: boolean;
  votes: boolean;
  comments: boolean;
  follows: boolean;
}

export type PrivacySettings = {
  profile_visibility: 'public' | 'private' | 'friends';
  show_email: boolean;
  show_activity: boolean;
  allow_messages: boolean;
  share_demographics: boolean;
  allow_analytics: boolean;
}

export type FeedPreferences = {
  showTrending: boolean;
  showFollowing: boolean;
  showRecommended: boolean;
  autoRefresh: boolean;
  itemsPerPage: number;
}

export type VotingPreferences = {
  defaultMethod: 'single' | 'multiple' | 'ranked' | 'approval' | 'quadratic' | 'range';
  showResults: boolean;
  allowComments: boolean;
  requireVerification: boolean;
}

// Profile action results
export type ProfileActionResult = {
  success: boolean;
  data?: UserProfile;
  error?: string;
}

export type ProfileValidationResult = {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

export type AvatarUploadResult = {
  success: boolean;
  url?: string;
  error?: string;
}

export type AvatarValidation = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export type ProfileExportData = {
  profile: UserProfile;
  preferences: ProfilePreferences;
  activity: any[];
  votes: any[];
  comments: any[];
}

export type ExportOptions = {
  includeActivity: boolean;
  includeVotes: boolean;
  includeComments: boolean;
  format: 'json' | 'csv';
}

// Component props
export type ProfilePageProps = {
  user: UserProfile;
  isOwnProfile?: boolean;
  canEdit?: boolean;
}

export type ProfileEditProps = {
  profile: UserProfile;
  onSave: (data: ProfileUpdateData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export type ProfileAvatarProps = {
  avatar_url?: string | null;
  display_name?: string | null;
  onUpload?: (file: File) => void;
  onRemove?: () => void;
  isLoading?: boolean;
  maxSize?: number;
  allowedTypes?: string[];
}

export type ProfilePreferencesProps = {
  preferences: ProfilePreferences;
  onUpdate: (preferences: Partial<ProfilePreferences>) => void;
}

export type ProfilePrivacyProps = {
  settings: PrivacySettings;
  onUpdate: (settings: Partial<PrivacySettings>) => void;
}

// Service interfaces
export type ProfileService = {
  getProfile(userId: string): Promise<UserProfile>;
  updateProfile(userId: string, data: ProfileUpdateData): Promise<ProfileActionResult>;
  uploadAvatar(userId: string, file: File): Promise<AvatarUploadResult>;
  validateProfile(data: ProfileUpdateData): ProfileValidationResult;
  exportProfile(userId: string, options: ExportOptions): Promise<ProfileExportData>;
}

export type ProfileCache = {
  get(userId: string): UserProfile | null;
  set(userId: string, profile: UserProfile): void;
  invalidate(userId: string): void;
  clear(): void;
}

// Hook return types
export type UseProfileReturn = {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export type UseProfileUpdateReturn = {
  updateProfile: (data: ProfileUpdateData) => Promise<ProfileActionResult>;
  isUpdating: boolean;
  error: string | null;
}

export type UseProfileAvatarReturn = {
  uploadAvatar: (file: File) => Promise<AvatarUploadResult>;
  isUploading: boolean;
  error: string | null;
}

export type UseProfileExportReturn = {
  exportProfile: (options: ExportOptions) => Promise<ProfileExportData>;
  isExporting: boolean;
  error: string | null;
}

// Legacy compatibility (for existing components)
export type ProfileUser = UserProfile;

// Constants and defaults
export const PROFILE_CONSTANTS = {
  MAX_DISPLAY_NAME_LENGTH: 100,
  MAX_USERNAME_LENGTH: 50,
  MAX_BIO_LENGTH: 500,
  MAX_AVATAR_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_AVATAR_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
  TRUST_TIERS: ['T0', 'T1', 'T2', 'T3'] as const,
  PARTICIPATION_STYLES: ['observer', 'participant', 'leader', 'organizer'] as const,
  PROFILE_VISIBILITY: ['public', 'private', 'friends'] as const,
} as const;

export const PROFILE_DEFAULTS = {
  trust_tier: 'T0',
  is_active: true,
  is_admin: false,
  participation_style: 'observer' as const,
  primary_concerns: [] as string[],
  community_focus: [] as string[],
  demographics: {} as Record<string, any>,
  privacy_settings: {
    profile_visibility: 'public' as const,
    show_email: false,
    show_activity: true,
    allow_messages: true,
    share_demographics: false,
    allow_analytics: true,
  },
} as const;