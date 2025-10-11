/**
 * Profile Constants
 * 
 * Constants and configuration for the profile feature
 * Centralized configuration and default values
 * 
 * Created: December 19, 2024
 * Status: ✅ CONSOLIDATED
 */

// ============================================================================
// PROFILE LIMITS
// ============================================================================

export const PROFILE_LIMITS = {
  MAX_DISPLAY_NAME_LENGTH: 100,
  MAX_USERNAME_LENGTH: 50,
  MAX_BIO_LENGTH: 500,
  MAX_AVATAR_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_PRIMARY_CONCERNS: 10,
  MAX_COMMUNITY_FOCUS: 10,
  MIN_DISPLAY_NAME_LENGTH: 2,
  MIN_USERNAME_LENGTH: 3,
} as const;

// ============================================================================
// FILE RESTRICTIONS
// ============================================================================

export const AVATAR_RESTRICTIONS = {
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_SIZE: PROFILE_LIMITS.MAX_AVATAR_SIZE,
  MIN_DIMENSIONS: { width: 100, height: 100 },
  MAX_DIMENSIONS: { width: 2048, height: 2048 },
  RECOMMENDED_DIMENSIONS: { width: 400, height: 400 },
} as const;

// ============================================================================
// TRUST TIERS
// ============================================================================

export const TRUST_TIERS = {
  T0: {
    name: 'New User',
    description: 'Recently joined the platform',
    color: 'gray',
    requirements: ['Account created'],
    benefits: ['Basic platform access'],
  },
  T1: {
    name: 'Verified User',
    description: 'Email verified and basic profile complete',
    color: 'blue',
    requirements: ['Email verified', 'Profile complete'],
    benefits: ['Enhanced features', 'Priority support'],
  },
  T2: {
    name: 'Trusted User',
    description: 'Active community member with positive engagement',
    color: 'green',
    requirements: ['Active participation', 'Positive feedback'],
    benefits: ['Advanced features', 'Community moderation'],
  },
  T3: {
    name: 'VIP User',
    description: 'Long-term trusted community leader',
    color: 'purple',
    requirements: ['Long-term engagement', 'Leadership role'],
    benefits: ['Premium features', 'Admin privileges'],
  },
} as const;

// ============================================================================
// PARTICIPATION STYLES
// ============================================================================

export const PARTICIPATION_STYLES = {
  observer: {
    name: 'Observer',
    description: 'Prefers to watch and learn from community discussions',
    icon: '👁️',
    characteristics: ['Reads content', 'Learns from others', 'Occasional participation'],
  },
  contributor: {
    name: 'Contributor',
    description: 'Regularly participates in discussions and provides input',
    icon: '💬',
    characteristics: ['Active in discussions', 'Shares opinions', 'Helps others'],
  },
  leader: {
    name: 'Leader',
    description: 'Takes initiative and guides community discussions',
    icon: '👑',
    characteristics: ['Initiates discussions', 'Mentors others', 'Shapes community direction'],
  },
} as const;

// ============================================================================
// PRIVACY SETTINGS
// ============================================================================

export const PRIVACY_LEVELS = {
  public: {
    name: 'Public',
    description: 'Visible to everyone',
    icon: '🌐',
    settings: {
      profile_visibility: 'public',
      show_email: true,
      show_activity: true,
      allow_messages: true,
    },
  },
  friends: {
    name: 'Friends Only',
    description: 'Visible to friends and connections',
    icon: '👥',
    settings: {
      profile_visibility: 'friends',
      show_email: false,
      show_activity: true,
      allow_messages: true,
    },
  },
  private: {
    name: 'Private',
    description: 'Only visible to you',
    icon: '🔒',
    settings: {
      profile_visibility: 'private',
      show_email: false,
      show_activity: false,
      allow_messages: false,
    },
  },
} as const;

// ============================================================================
// INTEREST CATEGORIES
// ============================================================================

export const PRIMARY_CONCERNS = [
  'Climate Change',
  'Healthcare Access',
  'Economic Inequality',
  'Education Quality',
  'Public Safety',
  'Infrastructure',
  'Social Justice',
  'Technology & Privacy',
  'Immigration',
  'National Security',
  'Housing Affordability',
  'Mental Health',
  'Criminal Justice',
  'Voting Rights',
  'Environmental Protection',
] as const;

export const COMMUNITY_FOCUS = [
  'Education',
  'Healthcare',
  'Environment',
  'Economic Development',
  'Public Safety',
  'Housing',
  'Transportation',
  'Social Services',
  'Arts & Culture',
  'Youth Programs',
  'Senior Services',
  'Disability Services',
  'Veteran Services',
  'Community Development',
  'Civic Engagement',
] as const;

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

export const NOTIFICATION_TYPES = {
  email: {
    name: 'Email Notifications',
    description: 'Receive updates via email',
    default: true,
  },
  push: {
    name: 'Push Notifications',
    description: 'Receive browser notifications',
    default: true,
  },
  sms: {
    name: 'SMS Notifications',
    description: 'Receive text message updates',
    default: false,
  },
} as const;

export const NOTIFICATION_CATEGORIES = {
  poll_updates: {
    name: 'Poll Updates',
    description: 'Updates about polls you\'ve participated in',
    default: true,
  },
  representative_updates: {
    name: 'Representative Updates',
    description: 'Updates from your representatives',
    default: true,
  },
  system_updates: {
    name: 'System Updates',
    description: 'Important platform updates and announcements',
    default: true,
  },
  community_updates: {
    name: 'Community Updates',
    description: 'Updates from your community',
    default: false,
  },
} as const;

// ============================================================================
// THEME OPTIONS
// ============================================================================

export const THEME_OPTIONS = {
  light: {
    name: 'Light',
    description: 'Light theme for daytime use',
    value: 'light',
  },
  dark: {
    name: 'Dark',
    description: 'Dark theme for low-light conditions',
    value: 'dark',
  },
  system: {
    name: 'System',
    description: 'Follow system preference',
    value: 'system',
  },
} as const;

// ============================================================================
// LANGUAGE OPTIONS
// ============================================================================

export const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
] as const;

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_PROFILE = {
  trust_tier: 'T0',
  participation_style: 'observer',
  profile_visibility: 'public',
  theme: 'system',
  language: 'en',
  timezone: 'UTC',
  privacy_settings: {
    profile_visibility: 'public',
    show_email: false,
    show_activity: true,
    allow_messages: true,
    share_demographics: false,
    allow_analytics: true,
  },
  preferences: {
    theme: 'system',
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
// VALIDATION RULES
// ============================================================================

export const VALIDATION_RULES = {
  username: {
    pattern: /^[a-zA-Z0-9_-]+$/,
    minLength: PROFILE_LIMITS.MIN_USERNAME_LENGTH,
    maxLength: PROFILE_LIMITS.MAX_USERNAME_LENGTH,
    cannotStartWith: ['-', '_'],
    cannotEndWith: ['-', '_'],
  },
  displayName: {
    minLength: PROFILE_LIMITS.MIN_DISPLAY_NAME_LENGTH,
    maxLength: PROFILE_LIMITS.MAX_DISPLAY_NAME_LENGTH,
    allowedCharacters: /^[a-zA-Z0-9\s\-_.,!?]+$/,
  },
  bio: {
    maxLength: PROFILE_LIMITS.MAX_BIO_LENGTH,
    allowedCharacters: /^[a-zA-Z0-9\s\-_.,!?@#$%^&*()+=\[\]{}|\\:";'<>?\/~`]+$/,
  },
} as const;

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API_ENDPOINTS = {
  profile: '/api/profile',
  profileUpdate: '/api/profile/update',
  profileAvatar: '/api/profile/avatar',
  profileExport: '/api/profile/export',
  profileDelete: '/api/profile/delete',
  userProfile: '/api/user/profile',
} as const;

// ============================================================================
// CACHE SETTINGS
// ============================================================================

export const CACHE_SETTINGS = {
  profileStaleTime: 5 * 60 * 1000, // 5 minutes
  profileGcTime: 10 * 60 * 1000, // 10 minutes
  avatarStaleTime: 15 * 60 * 1000, // 15 minutes
  avatarGcTime: 30 * 60 * 1000, // 30 minutes
  retryAttempts: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
} as const;
