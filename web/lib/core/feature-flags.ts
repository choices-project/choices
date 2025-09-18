/**
 * Centralized flags with case-insensitive lookups and typed keys.
 * Add new flags here; remove when dead.
 */
export const FEATURE_FLAGS = {
  CORE_AUTH: true,
  CORE_POLLS: true,
  CORE_USERS: true,
  WEBAUTHN: true,
  PWA: true,
  ANALYTICS: false,
  ADMIN: true,
  EXPERIMENTAL_UI: false,
  EXPERIMENTAL_ANALYTICS: false,
  ADVANCED_PRIVACY: false,
  // Database optimization suite - enabled for performance
  FEATURE_DB_OPTIMIZATION_SUITE: true,
  // Experimental components - keep disabled until evaluated
  EXPERIMENTAL_COMPONENTS: false,
  // Civics address lookup system - disabled by default until e2e is complete
  CIVICS_ADDRESS_LOOKUP: false,
} as const;

// Define proper types for feature flag system
export type FeatureFlag = {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
  key?: FeatureFlagKey;
  category?: string;
}

export type FeatureFlagMetadata = {
  description?: string;
  category?: string;
  dependencies?: string[];
  experimental?: boolean;
  deprecated?: boolean;
}

export type FeatureFlagConfig = {
  flags: Record<string, boolean>;
  timestamp: string;
  version: string;
}

export type FeatureFlagSubscription = {
  unsubscribe: () => void;
}

export type FeatureFlagSystemInfo = {
  totalFlags: number;
  enabledFlags: number;
  disabledFlags: number;
  environment: string;
  categories: Record<string, number>;
}

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
  civics: 'CIVICS_ADDRESS_LOOKUP',
  'civics-address-lookup': 'CIVICS_ADDRESS_LOOKUP',
};

function normalize(key: string): FeatureFlagKey | null {
  if (key in FEATURE_FLAGS) return key as FeatureFlagKey;
  const alias = ALIASES[key.toLowerCase()];
  return alias || null;
}

export function isFeatureEnabled<K extends string>(key: K): boolean {
  const normalizedKey = normalize(key);
  if (normalizedKey && normalizedKey in FEATURE_FLAGS) {
    return FEATURE_FLAGS[normalizedKey];
  }
  // Unknown flags default to false but don't crash
  return false;
}

// Create a mutable copy of FEATURE_FLAGS for runtime modifications
const mutableFlags: Record<string, boolean> = { ...FEATURE_FLAGS };

// Helper function to categorize flags
function categorizeFlag(flagId: string): string {
  const categories: Record<string, string[]> = {
    core: ['CORE_AUTH', 'CORE_POLLS', 'CORE_USERS'],
    experimental: ['EXPERIMENTAL_UI', 'EXPERIMENTAL_ANALYTICS'],
    features: ['WEBAUTHN', 'PWA', 'ANALYTICS', 'ADMIN', 'ADVANCED_PRIVACY', 'FEATURE_DB_OPTIMIZATION_SUITE', 'CIVICS_ADDRESS_LOOKUP']
  };
  
  for (const [category, flags] of Object.entries(categories)) {
    if (flags.includes(flagId)) {
      return category;
    }
  }
  return 'general';
}

export const featureFlagManager = {
  enable: (k: string | FeatureFlagKey): boolean => {
    const key = normalize(String(k)); 
    if (key && key in mutableFlags) {
      mutableFlags[key] = true;
      return true;
    }
    return false;
  },
  disable: (k: string | FeatureFlagKey): boolean => {
    const key = normalize(String(k)); 
    if (key && key in mutableFlags) {
      mutableFlags[key] = false;
      return true;
    }
    return false;
  },
  toggle: (k: string | FeatureFlagKey): boolean => {
    const key = normalize(String(k)); 
    if (key && key in mutableFlags) {
      mutableFlags[key] = !mutableFlags[key];
      return true;
    }
    return false;
  },
  get: (key: string | FeatureFlagKey): boolean => {
    const normalizedKey = normalize(String(key));
    if (normalizedKey && normalizedKey in mutableFlags) {
      return mutableFlags[normalizedKey] || false;
    }
    return false;
  },
  all: () => ({ ...mutableFlags }),
  
  // Additional methods expected by useFeatureFlags hook
  getAllFlags: (): Map<string, FeatureFlag> => {
    const flags: FeatureFlag[] = Object.entries(mutableFlags).map(([key, enabled]) => ({
      id: key,
      name: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      enabled,
      description: `Feature flag for ${key.toLowerCase().replace(/_/g, ' ')}`,
      key: key as FeatureFlagKey,
      category: categorizeFlag(key)
    }));
    return new Map(flags.map(flag => [flag.id, flag]));
  },
  isEnabled: (key: string | FeatureFlagKey): boolean => {
    const normalizedKey = normalize(String(key));
    if (normalizedKey && normalizedKey in mutableFlags) {
      return mutableFlags[normalizedKey] || false;
    }
    return false;
  },
  getFlag: (flagId: string): FeatureFlag | null => {
    const normalizedKey = normalize(flagId);
    if (normalizedKey && normalizedKey in mutableFlags) {
      const enabled = mutableFlags[normalizedKey] || false;
      return {
        id: flagId,
        name: flagId.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        enabled,
        description: `Feature flag for ${flagId.toLowerCase().replace(/_/g, ' ')}`,
        key: normalizedKey,
        category: categorizeFlag(flagId)
      };
    }
    return null;
  },
  getEnabledFlags: (): FeatureFlag[] => Object.entries(mutableFlags)
    .filter(([_, enabled]) => enabled)
    .map(([key, enabled]) => ({
      id: key,
      name: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      enabled,
      description: `Feature flag for ${key.toLowerCase().replace(/_/g, ' ')}`,
      key: key as FeatureFlagKey,
      category: categorizeFlag(key)
    })),
  getDisabledFlags: (): FeatureFlag[] => Object.entries(mutableFlags)
    .filter(([_, enabled]) => !enabled)
    .map(([key, enabled]) => ({
      id: key,
      name: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      enabled,
      description: `Feature flag for ${key.toLowerCase().replace(/_/g, ' ')}`,
      key: key as FeatureFlagKey,
      category: categorizeFlag(key)
    })),
  getFlagsByCategory: (category: string): FeatureFlag[] => {
    // Simple categorization - can be enhanced
    const categories: Record<string, string[]> = {
      core: ['CORE_AUTH', 'CORE_POLLS', 'CORE_USERS'],
      experimental: ['EXPERIMENTAL_UI', 'EXPERIMENTAL_ANALYTICS'],
      features: ['WEBAUTHN', 'PWA', 'ANALYTICS', 'ADMIN', 'ADVANCED_PRIVACY', 'CIVICS_ADDRESS_LOOKUP']
    };
    const flagIds = categories[category] || [];
    return flagIds.map(flagId => ({
      id: flagId,
      name: flagId.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      enabled: mutableFlags[flagId as FeatureFlagKey] || false,
      description: `Feature flag for ${flagId.toLowerCase().replace(/_/g, ' ')}`,
      key: flagId as FeatureFlagKey,
      category: category
    }));
  },
  getSystemInfo: (): FeatureFlagSystemInfo => ({
    totalFlags: Object.keys(mutableFlags).length,
    enabledFlags: Object.values(mutableFlags).filter(Boolean).length,
    disabledFlags: Object.values(mutableFlags).filter(f => !f).length,
    environment: process.env.NODE_ENV || 'development',
    categories: {
      core: 3,
      experimental: 2,
      features: 5
    }
  }),
  areDependenciesEnabled: (flagId: string): boolean => {
    // Simple dependency check - can be enhanced
    const dependencies: Record<string, string[]> = {
      'ADVANCED_PRIVACY': ['CORE_AUTH'],
      'PWA': ['CORE_AUTH', 'CORE_POLLS'],
      'WEBAUTHN': ['CORE_AUTH']
    };
    const deps = dependencies[flagId] || [];
    return deps.every(dep => {
      const normalizedKey = normalize(dep);
      return normalizedKey ? mutableFlags[normalizedKey] : false;
    });
  },
  subscribe: (callback: (flags: Record<string, boolean>) => void): FeatureFlagSubscription => {
    // Simple subscription - in a real app, this would use a proper event system
    // For now, just return a no-op unsubscribe function
    return {
      unsubscribe: () => {}
    };
  },
  updateFlagMetadata: (flagId: string, metadata: FeatureFlagMetadata): boolean => {
    // For now, just return true - in a real app, this would update flag metadata
    console.log(`Updating metadata for flag ${flagId}:`, metadata);
    return true;
  },
  reset: (): void => {
    // Reset all flags to their default values
    Object.keys(FEATURE_FLAGS).forEach(key => {
      const flagKey = key as FeatureFlagKey;
      mutableFlags[flagKey] = FEATURE_FLAGS[flagKey];
    });
  },
  exportConfig: (): FeatureFlagConfig => {
    // Export current flag configuration
    return {
      flags: { ...mutableFlags },
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  },
  importConfig: (config: FeatureFlagConfig): void => {
    // Import flag configuration
    if (config && config.flags) {
      Object.entries(config.flags).forEach(([key, value]) => {
        const normalizedKey = normalize(key);
        if (normalizedKey && normalizedKey in mutableFlags && typeof value === 'boolean') {
          mutableFlags[normalizedKey] = value;
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

// E2E API functions
export async function getFeatureFlags(): Promise<Record<string, boolean>> {
  return featureFlagManager.all();
}

export async function setFeatureFlags(flags: Record<string, boolean>): Promise<void> {
  Object.entries(flags).forEach(([key, value]) => {
    const normalizedKey = normalize(key);
    if (normalizedKey && normalizedKey in mutableFlags && typeof value === 'boolean') {
      mutableFlags[normalizedKey] = value;
    }
  });
}
export const getAllFeatureFlags = () => featureFlagManager.all();

// Additional exports expected by useFeatureFlags hook
export const FeatureFlagManager = featureFlagManager;