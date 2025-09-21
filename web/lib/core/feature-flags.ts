/**
 * Centralized flags with case-insensitive lookups and typed keys.
 * Add new flags here; remove when dead.
 */
export const FEATURE_FLAGS = {
  // ===== CORE MVP FEATURES (Always Enabled) =====
  CORE_AUTH: true,
  CORE_POLLS: true,
  CORE_USERS: true,
  WEBAUTHN: true,
  PWA: true,
  ADMIN: true,
  
  // ===== ENHANCED MVP FEATURES (Ready for Implementation) =====
  ENHANCED_ONBOARDING: true,         // Multi-step onboarding system with comprehensive data collection
  ENHANCED_PROFILE: true,            // Advanced profile management with privacy controls
  ENHANCED_AUTH: false,              // SSR-safe authentication with advanced utilities
  ENHANCED_DASHBOARD: true,          // Advanced dashboard with analytics and insights (COMPLETED)
  ENHANCED_POLLS: true,              // Advanced poll creation and management system
  ENHANCED_VOTING: true,             // Advanced voting methods and analytics
  
  // ===== CIVICS & ACCOUNTABILITY FEATURES =====
  CIVICS_ADDRESS_LOOKUP: true,       // Address-based representative lookup system
  CIVICS_REPRESENTATIVE_DATABASE: true, // Federal, state, and local representative database
  CIVICS_CAMPAIGN_FINANCE: true,     // FEC campaign finance data integration
  CIVICS_VOTING_RECORDS: true,       // Congressional voting records and analysis
  CANDIDATE_ACCOUNTABILITY: true,    // Promise tracking and performance metrics
  CANDIDATE_CARDS: true,             // Comprehensive candidate information cards
  ALTERNATIVE_CANDIDATES: true,      // Platform for non-duopoly candidates
  
  // ===== FUTURE FEATURES (Development Required) =====
  AUTOMATED_POLLS: false,            // AI-powered poll generation from trending topics
  ADVANCED_PRIVACY: false,           // Zero-knowledge proofs and differential privacy
  SOCIAL_SHARING: false,             // Master switch for all social features
  SOCIAL_SHARING_POLLS: false,       // Poll sharing (Twitter, Facebook, LinkedIn)
  SOCIAL_SHARING_CIVICS: false,      // Representative sharing
  SOCIAL_SHARING_VISUAL: false,      // Visual content generation (IG, TikTok)
  SOCIAL_SHARING_OG: false,          // Dynamic Open Graph image generation
  SOCIAL_SIGNUP: false,              // Social OAuth signup
  
  // ===== PERFORMANCE & OPTIMIZATION =====
  PERFORMANCE_OPTIMIZATION: false,   // Image optimization, virtual scrolling, lazy loading
  FEATURE_DB_OPTIMIZATION_SUITE: true, // Database optimization suite - enabled for performance
  ANALYTICS: false,                  // Advanced analytics and user insights
  EXPERIMENTAL_UI: false,            // Experimental UI components
  EXPERIMENTAL_ANALYTICS: false,     // Experimental analytics features
  EXPERIMENTAL_COMPONENTS: false,    // Experimental components - keep disabled until evaluated
  
  // ===== SYSTEM FEATURES =====
  FEEDBACK_WIDGET: true,             // Enhanced feedback collection system
  NOTIFICATIONS: false,              // Push notifications and alerts
  THEMES: false,                     // Dark mode and theme customization
  ACCESSIBILITY: false,              // Advanced accessibility features
  INTERNATIONALIZATION: false,       // Multi-language support
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
    // Core MVP features
    core: ['CORE_AUTH', 'CORE_POLLS', 'CORE_USERS', 'WEBAUTHN', 'PWA', 'ADMIN', 'FEEDBACK_WIDGET'],
    
    // Enhanced MVP features ready for implementation
    enhanced: ['ENHANCED_ONBOARDING', 'ENHANCED_PROFILE', 'ENHANCED_AUTH', 'ENHANCED_DASHBOARD', 'ENHANCED_POLLS', 'ENHANCED_VOTING'],
    
    // Future features requiring development
    future: ['AUTOMATED_POLLS', 'ADVANCED_PRIVACY', 'CIVICS_ADDRESS_LOOKUP', 'SOCIAL_SHARING', 'SOCIAL_SHARING_POLLS', 'SOCIAL_SHARING_CIVICS', 'SOCIAL_SHARING_VISUAL', 'SOCIAL_SHARING_OG', 'SOCIAL_SIGNUP'],
    
    // Performance and optimization
    performance: ['PERFORMANCE_OPTIMIZATION', 'FEATURE_DB_OPTIMIZATION_SUITE', 'ANALYTICS'],
    
    // Experimental features
    experimental: ['EXPERIMENTAL_UI', 'EXPERIMENTAL_ANALYTICS', 'EXPERIMENTAL_COMPONENTS'],
    
    // System features
    system: ['NOTIFICATIONS', 'THEMES', 'ACCESSIBILITY', 'INTERNATIONALIZATION']
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
    const categories: Record<string, string[]> = {
      // Core MVP features
      core: ['CORE_AUTH', 'CORE_POLLS', 'CORE_USERS', 'WEBAUTHN', 'PWA', 'ADMIN', 'FEEDBACK_WIDGET'],
      
      // Enhanced MVP features ready for implementation
      enhanced: ['ENHANCED_ONBOARDING', 'ENHANCED_PROFILE', 'ENHANCED_AUTH', 'ENHANCED_DASHBOARD', 'ENHANCED_POLLS', 'ENHANCED_VOTING'],
      
      // Future features requiring development
      future: ['AUTOMATED_POLLS', 'ADVANCED_PRIVACY', 'CIVICS_ADDRESS_LOOKUP', 'SOCIAL_SHARING', 'SOCIAL_SHARING_POLLS', 'SOCIAL_SHARING_CIVICS', 'SOCIAL_SHARING_VISUAL', 'SOCIAL_SHARING_OG', 'SOCIAL_SIGNUP'],
      
      // Performance and optimization
      performance: ['PERFORMANCE_OPTIMIZATION', 'FEATURE_DB_OPTIMIZATION_SUITE', 'ANALYTICS'],
      
      // Experimental features
      experimental: ['EXPERIMENTAL_UI', 'EXPERIMENTAL_ANALYTICS', 'EXPERIMENTAL_COMPONENTS'],
      
      // System features
      system: ['NOTIFICATIONS', 'THEMES', 'ACCESSIBILITY', 'INTERNATIONALIZATION']
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
      core: 7,        // CORE_AUTH, CORE_POLLS, CORE_USERS, WEBAUTHN, PWA, ADMIN, FEEDBACK_WIDGET
      enhanced: 6,    // ENHANCED_ONBOARDING, ENHANCED_PROFILE, ENHANCED_AUTH, ENHANCED_DASHBOARD, ENHANCED_POLLS, ENHANCED_VOTING
      future: 9,      // AUTOMATED_POLLS, ADVANCED_PRIVACY, CIVICS_ADDRESS_LOOKUP, SOCIAL_SHARING + 5 sub-features
      performance: 3, // PERFORMANCE_OPTIMIZATION, FEATURE_DB_OPTIMIZATION_SUITE, ANALYTICS
      experimental: 3, // EXPERIMENTAL_UI, EXPERIMENTAL_ANALYTICS, EXPERIMENTAL_COMPONENTS
      system: 4       // NOTIFICATIONS, THEMES, ACCESSIBILITY, INTERNATIONALIZATION
    }
  }),
  areDependenciesEnabled: (flagId: string): boolean => {
    // Enhanced dependency check for all features
    const dependencies: Record<string, string[]> = {
      // Core dependencies
      'ADVANCED_PRIVACY': ['CORE_AUTH'],
      'PWA': ['CORE_AUTH', 'CORE_POLLS'],
      'WEBAUTHN': ['CORE_AUTH'],
      
      // Enhanced feature dependencies
      'ENHANCED_ONBOARDING': ['CORE_AUTH'],
      'ENHANCED_PROFILE': ['CORE_AUTH', 'CORE_USERS'],
      'ENHANCED_AUTH': ['CORE_AUTH'],
      'ENHANCED_DASHBOARD': ['CORE_AUTH', 'CORE_POLLS', 'CORE_USERS'],
      'ENHANCED_POLLS': ['CORE_AUTH', 'CORE_POLLS'],
      'ENHANCED_VOTING': ['CORE_AUTH', 'CORE_POLLS'],
      
      // Future feature dependencies
      'AUTOMATED_POLLS': ['CORE_AUTH', 'CORE_POLLS', 'ADMIN'],
      'CIVICS_ADDRESS_LOOKUP': ['CORE_AUTH'],
      'SOCIAL_SHARING': ['CORE_AUTH', 'CORE_POLLS'],
      'SOCIAL_SHARING_POLLS': ['SOCIAL_SHARING', 'CORE_POLLS'],
      'SOCIAL_SHARING_CIVICS': ['SOCIAL_SHARING', 'CIVICS_ADDRESS_LOOKUP'],
      'SOCIAL_SHARING_VISUAL': ['SOCIAL_SHARING'],
      'SOCIAL_SHARING_OG': ['SOCIAL_SHARING'],
      'SOCIAL_SIGNUP': ['CORE_AUTH'],
      
      // Performance dependencies
      'PERFORMANCE_OPTIMIZATION': ['CORE_AUTH'],
      'ANALYTICS': ['CORE_AUTH'],
      
      // System feature dependencies
      'NOTIFICATIONS': ['CORE_AUTH', 'PWA'],
      'THEMES': ['CORE_AUTH'],
      'ACCESSIBILITY': ['CORE_AUTH'],
      'INTERNATIONALIZATION': ['CORE_AUTH']
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