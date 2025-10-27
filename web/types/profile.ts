/**
 * Profile Types
 * 
 * Type definitions for user profile functionality
 * 
 * Created: October 26, 2025
 * Status: MINIMAL IMPLEMENTATION
 */

export interface ProfilePreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    showEmail: boolean;
    showPhone: boolean;
    showLocation: boolean;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  preferences: ProfilePreferences;
  createdAt: Date;
  updatedAt: Date;
}

export default {
  ProfilePreferences,
  UserProfile
};

// Profile Constants
export const PROFILE_CONSTANTS = {
  MAX_NAME_LENGTH: 100,
  MAX_BIO_LENGTH: 500,
  MAX_LOCATION_LENGTH: 100,
  ALLOWED_THEMES: ['light', 'dark', 'system'],
  ALLOWED_LANGUAGES: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'],
  MAX_NOTIFICATION_SETTINGS: 10,
  PRIVACY_LEVELS: ['public', 'friends', 'private']
} as const;

// Profile Defaults
export const PROFILE_DEFAULTS: ProfilePreferences = {
  theme: 'system',
  language: 'en',
  notifications: {
    email: true,
    push: true,
    sms: false
  },
  privacy: {
    showEmail: false,
    showPhone: false,
    showLocation: false
  }
} as const;