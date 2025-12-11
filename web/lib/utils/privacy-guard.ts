/**
 * Privacy Guard Utilities
 * 
 * Ensures ALL user data collection respects user privacy choices.
 * NO data collection without explicit consent.
 * 
 * Created: November 5, 2025
 * Priority: 🔒 CRITICAL - PARAMOUNT
 * Status: ✅ ACTIVE
 */

import { logger } from './logger';

import type { PrivacySettings } from '@/types/profile';


/**
 * Privacy Data Types
 * Each represents a category of data that can be collected
 */
export enum PrivacyDataType {
  LOCATION = 'collectLocationData',
  VOTING_HISTORY = 'collectVotingHistory',
  INTERESTS = 'trackInterests',
  FEED_ACTIVITY = 'trackFeedActivity',
  ANALYTICS = 'collectAnalytics',
  REPRESENTATIVE_INTERACTIONS = 'trackRepresentativeInteractions',
  SEARCH_HISTORY = 'retainSearchHistory'
}

/**
 * Check if user has consented to data collection
 * 
 * @param privacySettings - User's privacy settings
 * @param dataType - Type of data to collect
 * @returns true if user has consented, false otherwise
 */
export function hasPrivacyConsent(
  privacySettings: PrivacySettings | null | undefined,
  dataType: PrivacyDataType
): boolean {
  // Default to NO consent if settings missing
  if (!privacySettings) {
    logger.debug('Privacy check: No settings found, denying consent', { dataType });
    return false;
  }

  // Check specific consent
  const hasConsent = privacySettings[dataType as keyof PrivacySettings] === true;
  
  if (!hasConsent) {
    logger.debug('Privacy check: User has not consented', { dataType });
  }

  return hasConsent;
}

/**
 * Execute function only if user has consented
 * 
 * @param privacySettings - User's privacy settings
 * @param dataType - Type of data to collect
 * @param collectFn - Function to execute if consent given
 * @param fallback - Optional fallback value if no consent
 * @returns Result of collectFn if consent given, fallback otherwise
 */
export async function collectWithConsent<T>(
  privacySettings: PrivacySettings | null | undefined,
  dataType: PrivacyDataType,
  collectFn: () => Promise<T>,
  fallback?: T
): Promise<T | undefined> {
  if (!hasPrivacyConsent(privacySettings, dataType)) {
    logger.info('Data collection skipped - no user consent', {
      dataType,
      reason: 'privacy_settings'
    });
    return fallback;
  }

  try {
    return await collectFn();
  } catch (error) {
    logger.error('Data collection failed', {
      dataType,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return fallback;
  }
}

/**
 * Synchronous version of collectWithConsent
 */
export function collectWithConsentSync<T>(
  privacySettings: PrivacySettings | null | undefined,
  dataType: PrivacyDataType,
  collectFn: () => T,
  fallback?: T
): T | undefined {
  if (!hasPrivacyConsent(privacySettings, dataType)) {
    logger.info('Data collection skipped - no user consent', {
      dataType,
      reason: 'privacy_settings'
    });
    return fallback;
  }

  try {
    return collectFn();
  } catch (error) {
    logger.error('Data collection failed', {
      dataType,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return fallback;
  }
}

/**
 * Check multiple privacy consents at once
 * Returns true only if ALL consents are given
 */
export function hasAllPrivacyConsents(
  privacySettings: PrivacySettings | null | undefined,
  dataTypes: PrivacyDataType[]
): boolean {
  return dataTypes.every(dataType => hasPrivacyConsent(privacySettings, dataType));
}

/**
 * Check if user has given ANY privacy consent
 * Useful for determining if user has gone through privacy onboarding
 */
export function hasAnyPrivacyConsent(
  privacySettings: PrivacySettings | null | undefined
): boolean {
  if (!privacySettings) return false;

  return Object.values(PrivacyDataType).some(dataType =>
    privacySettings[dataType as keyof PrivacySettings] === true
  );
}

/**
 * Get default privacy settings (all disabled for privacy-first approach)
 */
export function getDefaultPrivacySettings(): PrivacySettings {
  return {
    // Data Collection - DEFAULT OFF (opt-in required)
    collectLocationData: false,
    collectVotingHistory: false,
    trackInterests: false,
    trackFeedActivity: false,
    collectAnalytics: false,
    trackRepresentativeInteractions: false,
    
    // Visibility Controls - DEFAULT OFF (user privacy)
    showReadHistory: false,
    showBookmarks: false,
    showLikes: false,
    shareActivity: false,
    
    // Trust & Biometric - DEFAULT OFF (opt-in)
    participateInTrustTier: false,
    
    // Personalization - DEFAULT OFF (opt-in)
    personalizeFeeds: false,
    personalizeRecommendations: false,
    
    // Data Retention - DEFAULT OFF (don't retain)
    retainVotingHistory: false,
    retainSearchHistory: false,
    retainLocationHistory: false
  };
}

/**
 * Validate privacy settings object
 * Ensures all required fields are present
 */
export function validatePrivacySettings(
  settings: Partial<PrivacySettings>
): settings is PrivacySettings {
  const required: (keyof PrivacySettings)[] = [
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
    'retainLocationHistory'
  ];

  return required.every(field => typeof settings[field] === 'boolean');
}

/**
 * Merge partial privacy settings with defaults
 * Useful for migrations and updates
 */
export function mergePrivacySettings(
  current: Partial<PrivacySettings> | null | undefined
): PrivacySettings {
  const defaults = getDefaultPrivacySettings();
  
  if (!current) {
    return defaults;
  }

  const result: Record<string, unknown> = { ...defaults };
  for (const [k, v] of Object.entries(current)) {
    if (v !== undefined) {
      result[k] = v;
    }
  }
  return result as PrivacySettings;
}

/**
 * Privacy Guard Class for easier usage in services
 */
export class PrivacyGuard {
  constructor(private privacySettings: PrivacySettings | null | undefined) {}

  /**
   * Check if data collection is allowed
   */
  canCollect(dataType: PrivacyDataType): boolean {
    return hasPrivacyConsent(this.privacySettings, dataType);
  }

  /**
   * Execute with consent check
   */
  async withConsent<T>(
    dataType: PrivacyDataType,
    fn: () => Promise<T>,
    fallback?: T
  ): Promise<T | undefined> {
    return collectWithConsent(this.privacySettings, dataType, fn, fallback);
  }

  /**
   * Execute sync with consent check
   */
  withConsentSync<T>(
    dataType: PrivacyDataType,
    fn: () => T,
    fallback?: T
  ): T | undefined {
    return collectWithConsentSync(this.privacySettings, dataType, fn, fallback);
  }

  /**
   * Get current privacy settings
   */
  getSettings(): PrivacySettings {
    return mergePrivacySettings(this.privacySettings);
  }

  /**
   * Check if user has completed privacy onboarding
   */
  hasCompletedOnboarding(): boolean {
    return hasAnyPrivacyConsent(this.privacySettings);
  }
}

/**
 * Create a privacy guard instance
 */
export function createPrivacyGuard(
  privacySettings: PrivacySettings | null | undefined
): PrivacyGuard {
  return new PrivacyGuard(privacySettings);
}

/**
 * Privacy violation logger (development only)
 * Logs when data is collected without privacy checks
 */
export function logPrivacyViolation(
  location: string,
  dataType: string,
  details?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === 'development') {
    logger.warn('🚨 PRIVACY VIOLATION DETECTED', {
      location,
      dataType,
      message: 'Data collected without privacy check',
      ...(details ?? {}),
    });
  }
}

