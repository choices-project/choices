/**
 * Feature Flags
 * 
 * Centralized feature flag system to enable/disable features gracefully.
 * This allows us to focus on core functionality while keeping future features ready.
 */

export const FEATURE_FLAGS = {
  // Core features (always enabled)
  CORE_AUTH: true,
  CORE_POLLS: true,
  CORE_USERS: true,
  
  // Future features (disabled for now)
  WEBAUTHN: false,
  PWA: false,
  ANALYTICS: false,
  ADMIN: false,
  
  // Experimental features
  EXPERIMENTAL_UI: false,
  EXPERIMENTAL_ANALYTICS: false,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: FeatureFlag): boolean {
  return FEATURE_FLAGS[feature];
}

/**
 * Get all enabled features
 */
export function getEnabledFeatures(): FeatureFlag[] {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature as FeatureFlag);
}

/**
 * Get all disabled features
 */
export function getDisabledFeatures(): FeatureFlag[] {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => !enabled)
    .map(([feature]) => feature as FeatureFlag);
}
