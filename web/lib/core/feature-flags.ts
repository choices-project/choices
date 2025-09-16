/**
 * Centralized flags with case-insensitive lookups and typed keys.
 * Add new flags here; remove when dead.
 */
export const FEATURE_FLAGS = {
  CORE_AUTH: true,
  CORE_POLLS: true,
  CORE_USERS: true,
  WEBAUTHN: false,
  PWA: false,
  ANALYTICS: false,
  ADMIN: true,
  EXPERIMENTAL_UI: false,
  EXPERIMENTAL_ANALYTICS: false,
  ADVANCED_PRIVACY: false,
} as const;

type KnownFlag = keyof typeof FEATURE_FLAGS;

// Define the missing FeatureFlagKey type
export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

export type FeatureFlagManager = typeof featureFlagManager;

// also accept lowercase legacy names found in code: 'pwa', 'advancedPrivacy'
const ALIASES: Record<string, FeatureFlagKey> = {
  pwa: 'PWA',
  advancedprivacy: 'ADVANCED_PRIVACY',
  'advanced-privacy': 'ADVANCED_PRIVACY',
  analytics: 'ANALYTICS',
  admin: 'ADMIN',
};

function normalize(key: string): FeatureFlagKey | undefined {
  if ((FEATURE_FLAGS as any)[key]) return key as FeatureFlagKey;
  const alias = ALIASES[key.toLowerCase()];
  return alias;
}

export function isFeatureEnabled<K extends string>(key: K): boolean {
  if ((FEATURE_FLAGS as Record<string, boolean>)[key] !== undefined) {
    return (FEATURE_FLAGS as Record<string, boolean>)[key];
  }
  // Unknown flags default to false but don't crash
  return false;
}

export const featureFlagManager = {
  enable: (k: string | FeatureFlagKey): boolean => {
    const key = normalize(String(k)); 
    if (key) {
      (FEATURE_FLAGS as any)[key] = true;
      return true;
    }
    return false;
  },
  disable: (k: string | FeatureFlagKey): boolean => {
    const key = normalize(String(k)); 
    if (key) {
      (FEATURE_FLAGS as any)[key] = false;
      return true;
    }
    return false;
  },
  toggle: (k: string | FeatureFlagKey): boolean => {
    const key = normalize(String(k)); 
    if (key) {
      (FEATURE_FLAGS as any)[key] = !FEATURE_FLAGS[key];
      return true;
    }
    return false;
  },
  get: isFeatureEnabled,
  all: () => ({ ...FEATURE_FLAGS }),
  
  // Additional methods expected by useFeatureFlags hook
  getAllFlags: () => {
    const flags: FeatureFlag[] = Object.entries(FEATURE_FLAGS).map(([key, enabled]) => ({
      id: key,
      name: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      enabled,
      description: `Feature flag for ${key.toLowerCase().replace(/_/g, ' ')}`
    }));
    return new Map(flags.map(flag => [flag.id, flag]));
  },
  isEnabled: isFeatureEnabled,
  getFlag: (flagId: string): FeatureFlag | undefined => {
    const enabled = isFeatureEnabled(flagId);
    if (enabled !== undefined) {
      return {
        id: flagId,
        name: flagId.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        enabled,
        description: `Feature flag for ${flagId.toLowerCase().replace(/_/g, ' ')}`
      };
    }
    return undefined;
  },
  getEnabledFlags: () => Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => enabled)
    .map(([key, enabled]) => ({
      id: key,
      name: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      enabled,
      description: `Feature flag for ${key.toLowerCase().replace(/_/g, ' ')}`
    })),
  getDisabledFlags: () => Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => !enabled)
    .map(([key, enabled]) => ({
      id: key,
      name: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      enabled,
      description: `Feature flag for ${key.toLowerCase().replace(/_/g, ' ')}`
    })),
  getFlagsByCategory: (category: string): FeatureFlag[] => {
    // Simple categorization - can be enhanced
    const categories: Record<string, string[]> = {
      core: ['CORE_AUTH', 'CORE_POLLS', 'CORE_USERS'],
      experimental: ['EXPERIMENTAL_UI', 'EXPERIMENTAL_ANALYTICS'],
      features: ['WEBAUTHN', 'PWA', 'ANALYTICS', 'ADMIN', 'ADVANCED_PRIVACY']
    };
    const flagIds = categories[category] || [];
    return flagIds.map(flagId => ({
      id: flagId,
      name: flagId.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      enabled: isFeatureEnabled(flagId),
      description: `Feature flag for ${flagId.toLowerCase().replace(/_/g, ' ')}`
    }));
  },
  getSystemInfo: () => ({
    totalFlags: Object.keys(FEATURE_FLAGS).length,
    enabledFlags: Object.values(FEATURE_FLAGS).filter(Boolean).length,
    disabledFlags: Object.values(FEATURE_FLAGS).filter(f => !f).length,
    environment: process.env.NODE_ENV || 'development',
    categories: {
      core: 3,
      experimental: 2,
      features: 5
    }
  }),
  areDependenciesEnabled: (flagId: string) => {
    // Simple dependency check - can be enhanced
    const dependencies: Record<string, string[]> = {
      'ADVANCED_PRIVACY': ['CORE_AUTH'],
      'PWA': ['CORE_AUTH', 'CORE_POLLS'],
      'WEBAUTHN': ['CORE_AUTH']
    };
    const deps = dependencies[flagId] || [];
    return deps.every(dep => isFeatureEnabled(dep));
  },
  subscribe: (callback: (flags: any) => void) => {
    // Simple subscription - in a real app, this would use a proper event system
    // For now, just return a no-op unsubscribe function
    return () => {};
  },
  updateFlagMetadata: (flagId: string, metadata: Record<string, any>): boolean => {
    // For now, just return true - in a real app, this would update flag metadata
    console.log(`Updating metadata for flag ${flagId}:`, metadata);
    return true;
  },
  reset: (): void => {
    // Reset all flags to their default values
    Object.keys(FEATURE_FLAGS).forEach(key => {
      (FEATURE_FLAGS as any)[key] = FEATURE_FLAGS[key as FeatureFlagKey];
    });
  },
  exportConfig: (): any => {
    // Export current flag configuration
    return {
      flags: { ...FEATURE_FLAGS },
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  },
  importConfig: (config: any): void => {
    // Import flag configuration
    if (config && config.flags) {
      Object.entries(config.flags).forEach(([key, value]) => {
        if (key in FEATURE_FLAGS && typeof value === 'boolean') {
          (FEATURE_FLAGS as any)[key] = value;
        }
      });
    }
  }
};

// Named helpers kept for compatibility
export const enableFeature = featureFlagManager.enable;
export const disableFeature = featureFlagManager.disable;
export const toggleFeature = featureFlagManager.toggle;
export const getFeatureFlag = (k: string | FeatureFlagKey) => isFeatureEnabled(k);
export const getAllFeatureFlags = () => featureFlagManager.all();

// Additional exports expected by useFeatureFlags hook
export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
  key?: FeatureFlagKey;
  category?: string;
}

export const FeatureFlagManager = featureFlagManager;