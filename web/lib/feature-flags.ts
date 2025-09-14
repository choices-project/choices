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
  ADMIN: true, // Enable admin system
  
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

// Feature flag manager for dynamic control
export const featureFlagManager = {
  isEnabled: isFeatureEnabled,
  getEnabled: getEnabledFeatures,
  getDisabled: getDisabledFeatures,
  enableFeature: (feature: FeatureFlag) => {
    // In a real implementation, this would update a database or config
    console.warn(`Feature flag ${feature} cannot be enabled at runtime in this implementation`);
  },
  disableFeature: (feature: FeatureFlag) => {
    // In a real implementation, this would update a database or config
    console.warn(`Feature flag ${feature} cannot be disabled at runtime in this implementation`);
  },
  toggleFeature: (feature: FeatureFlag) => {
    // In a real implementation, this would toggle a database or config
    console.warn(`Feature flag ${feature} cannot be toggled at runtime in this implementation`);
  },
  getFeatureFlag: (feature: FeatureFlag) => FEATURE_FLAGS[feature],
  getAllFeatureFlags: () => FEATURE_FLAGS,
};

// Export individual functions for backward compatibility
export const enableFeature = featureFlagManager.enableFeature;
export const disableFeature = featureFlagManager.disableFeature;
export const toggleFeature = featureFlagManager.toggleFeature;
export const getFeatureFlag = featureFlagManager.getFeatureFlag;
export const getAllFeatureFlags = featureFlagManager.getAllFeatureFlags;

