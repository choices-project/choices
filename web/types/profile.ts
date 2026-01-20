/**
 * Profile Types
 *
 * Type definitions for user profile functionality based on actual database schema
 * Generated from Supabase user_profiles table
 *
 * Created: October 26, 2025
 * Status: ✅ ACTIVE
 */

import type { Database, Json } from './database';

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

export type ProfileLocation = {
  state?: string;
  district?: string;
  county?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
} & Record<string, Json | undefined>;

export type ProfileDemographics = {
  location?: ProfileLocation;
  languages?: string[];
  pronouns?: string;
  ageRange?: string;
  metadata?: Record<string, Json>;
} & Record<string, Json | undefined>;

// Profile editing types
export type ProfileUpdateData = {
  display_name?: string;
  bio?: string;
  username?: string;
  primary_concerns?: string[];
  community_focus?: string[];
  participation_style?: 'observer' | 'participant' | 'leader' | 'organizer';
  privacy_settings?: Partial<PrivacySettings>;
  demographics?: ProfileDemographics;
}

// Profile preferences
export type DashboardPreferences = {
  showElectedOfficials: boolean;
  showQuickActions: boolean;
  showRecentActivity: boolean;
  showEngagementScore: boolean;
};

export type ProfilePreferences = {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
  feed: FeedPreferences;
  voting: VotingPreferences;
  dashboard?: DashboardPreferences;
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

/**
 * Comprehensive Privacy Settings
 *
 * PRIVACY PARAMOUNT: All data collection requires explicit opt-in
 * Default: ALL settings false (privacy-first approach)
 *
 * Updated: November 5, 2025
 */
export type PrivacySettings = {
  // ===== DATA COLLECTION CONTROLS =====
  // User must explicitly opt-in to any data collection

  /** Allow collection of location/address data */
  collectLocationData: boolean;

  /** Allow storage of voting history */
  collectVotingHistory: boolean;

  /** Allow tracking of hashtag/interest data */
  trackInterests: boolean;

  /** Allow tracking of feed interactions (likes, reads, etc.) */
  trackFeedActivity: boolean;

  /** Allow collection of analytics/telemetry data */
  collectAnalytics: boolean;

  /** Allow tracking of representative interactions */
  trackRepresentativeInteractions: boolean;

  /** Allow integrity signal collection for bot detection */
  collectIntegritySignals: boolean;

  /** Allow advanced integrity signals (device/network) */
  collectIntegrityAdvancedSignals: boolean;

  // ===== VISIBILITY CONTROLS =====
  // Control what others can see (separate from collection)

  /** Show read history to others */
  showReadHistory: boolean;

  /** Show bookmarks to others */
  showBookmarks: boolean;

  /** Show likes to others */
  showLikes: boolean;

  /** Share activity with others */
  shareActivity: boolean;

  // ===== TRUST & BIOMETRIC CONTROLS =====

  /** Participate in trust tier scoring system */
  participateInTrustTier: boolean;

  // ===== PERSONALIZATION CONTROLS =====

  /** Allow feed personalization based on interests */
  personalizeFeeds: boolean;

  /** Allow personalized recommendations */
  personalizeRecommendations: boolean;

  // ===== DATA RETENTION CONTROLS =====

  /** Retain voting history long-term */
  retainVotingHistory: boolean;

  /** Retain search history */
  retainSearchHistory: boolean;

  /** Retain location history */
  retainLocationHistory: boolean;

  // ===== LEGACY FIELDS (Deprecated but kept for compatibility) =====

  /** @deprecated Use visibility controls instead */
  profile_visibility?: 'public' | 'private' | 'friends';

  /** @deprecated Use collectAnalytics instead */
  allow_analytics?: boolean;

  /** @deprecated Use shareActivity instead */
  show_activity?: boolean;

  /** @deprecated Use separate messaging preferences */
  allow_messages?: boolean;

  /** @deprecated Use shareActivity instead */
  share_demographics?: boolean;

  /** @deprecated Use separate email preferences */
  show_email?: boolean;
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
  preferences?: ProfilePreferences | null;
  error?: string;
}

export type ProfileActivityRecord = {
  id: string;
  type: string;
  created_at: string;
  description?: string;
  metadata?: Record<string, Json>;
};

export type ProfileCommentRecord = Record<string, Json | undefined> & {
  id?: string;
  created_at?: string;
  body?: string;
  target_type?: string;
  target_id?: string;
};

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
  activity: ProfileActivityRecord[];
  votes: Database['public']['Tables']['votes']['Row'][];
  comments: ProfileCommentRecord[];
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
  profile?: UserProfile | null;
  onSave?: (data: ProfileUpdateData) => Promise<void>;
  onCancel?: () => void;
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
  removeAvatar: () => Promise<boolean>;
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
  TRUST_TIERS: ['T0', 'T1', 'T2', 'T3', 'T4'] as const,
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
  demographics: {} satisfies ProfileDemographics,
  privacy_settings: {
    profile_visibility: 'public' as const,
    show_email: false,
    show_activity: true,
    allow_messages: true,
    share_demographics: false,
    allow_analytics: true,
    collectIntegritySignals: false,
    collectIntegrityAdvancedSignals: false,
  } satisfies Partial<PrivacySettings>,
} as const;
