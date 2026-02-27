/**
 * Centralised feature flag registry with typed lookups and runtime toggles.
 * Core features that are always on live in `ALWAYS_ENABLED_FLAGS` and are
 * treated as immutable capabilities (they no longer count as feature flags).
 */

import logger from '@/lib/utils/logger';

if (typeof window !== 'undefined') {
  logger.info('[FEATURE_FLAGS] Module loading on client');
}

const ALWAYS_ENABLED_FLAGS = [
  'PWA',
  'ADMIN',
  'FEEDBACK_WIDGET',
  'ENHANCED_ONBOARDING',
  'ENHANCED_PROFILE',
  'ENHANCED_AUTH',
  'ENHANCED_DASHBOARD',
  'ENHANCED_POLLS',
  'ENHANCED_VOTING',
  'CIVICS_ADDRESS_LOOKUP',
  // Legacy; no active gate. Representative detail shows campaign finance regardless.
  'CANDIDATE_ACCOUNTABILITY',
  'CANDIDATE_CARDS',
  'ALTERNATIVE_CANDIDATES',
  'FEATURE_DB_OPTIMIZATION_SUITE',
  'ANALYTICS',
  'WEBAUTHN',
] as const;

type AlwaysEnabledFlag = typeof ALWAYS_ENABLED_FLAGS[number];
const ALWAYS_ENABLED_SET = new Set<string>(ALWAYS_ENABLED_FLAGS);

export const FEATURE_FLAGS = {
  /** @deprecated @quarantined No implementation. See docs/FEATURE_STATUS.md § Feature Quarantine. */
  AUTOMATED_POLLS: false,
  SOCIAL_SHARING: false,
  SOCIAL_SHARING_POLLS: false,
  /** @deprecated @quarantined No civics-specific sharing surfaces. See docs/FEATURE_STATUS.md. */
  SOCIAL_SHARING_CIVICS: false,
  /** @deprecated @quarantined No OG/visual pipeline. See docs/FEATURE_STATUS.md. */
  SOCIAL_SHARING_VISUAL: false,
  /** @deprecated @quarantined No OG/visual pipeline. See docs/FEATURE_STATUS.md. */
  SOCIAL_SHARING_OG: false,
  CONTACT_INFORMATION_SYSTEM: true, // GA: RLS, rate limits, admin UI, My Submissions, bulk approve/reject
  /** @deprecated @quarantined No automated civics validation. See docs/FEATURE_STATUS.md. */
  CIVICS_TESTING_STRATEGY: false,
  PUSH_NOTIFICATIONS: true, // ✅ ENABLED - Production ready (January 2025)
  CIVIC_ENGAGEMENT_V2: true, // Shipped: API + UI on rep detail; CivicActionList with create/sign
} as const;

type MutableFlag = keyof typeof FEATURE_FLAGS;
export type FeatureFlagKey = MutableFlag | AlwaysEnabledFlag;

export type FeatureFlag = {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
  key?: FeatureFlagKey;
  category?: string;
};

export type FeatureFlagMetadata = {
  description?: string;
  category?: string;
  dependencies?: string[];
  experimental?: boolean;
  deprecated?: boolean;
};

export type FeatureFlagConfig = {
  flags: Record<string, boolean>;
  timestamp: string;
  version: string;
};

export type FeatureFlagSubscription = {
  unsubscribe: () => void;
};

export type FeatureFlagSystemInfo = {
  totalFlags: number;
  enabledFlags: number;
  disabledFlags: number;
  environment: string;
  categories: Record<string, number>;
};

/** Aliases for getFlagsByCategory; maps legacy names to CATEGORY_MAP keys */
const CATEGORY_ALIASES: Record<string, string> = {
  optional: 'future',
  experimental: 'future',
};

const CATEGORY_MAP: Record<string, ReadonlyArray<FeatureFlagKey>> = {
  core: ALWAYS_ENABLED_FLAGS,
  future: [
    'AUTOMATED_POLLS',
    'SOCIAL_SHARING',
    'SOCIAL_SHARING_POLLS',
    'SOCIAL_SHARING_CIVICS',
    'SOCIAL_SHARING_VISUAL',
    'SOCIAL_SHARING_OG',
    'CIVIC_ENGAGEMENT_V2',
  ],
  privacy: ['CONTACT_INFORMATION_SYSTEM'],
  performance: ['FEATURE_DB_OPTIMIZATION_SUITE'],
  civics: ['CIVICS_TESTING_STRATEGY'],
  auth: ['WEBAUTHN'],
  system: ['PUSH_NOTIFICATIONS'],
  analytics: ['ANALYTICS'],
};

const DEPENDENCY_MAP: Partial<Record<MutableFlag, FeatureFlagKey[]>> = {
  SOCIAL_SHARING_POLLS: ['SOCIAL_SHARING'],
  SOCIAL_SHARING_CIVICS: ['SOCIAL_SHARING', 'CIVICS_ADDRESS_LOOKUP'],
  SOCIAL_SHARING_VISUAL: ['SOCIAL_SHARING'],
  SOCIAL_SHARING_OG: ['SOCIAL_SHARING'],
  PUSH_NOTIFICATIONS: ['PWA'],
  CIVIC_ENGAGEMENT_V2: ['CIVICS_ADDRESS_LOOKUP'],
};

const ALIASES: Record<string, FeatureFlagKey> = {
  pwa: 'PWA',
  admin: 'ADMIN',
  analytics: 'ANALYTICS',
  aifeatures: 'ANALYTICS',
  civics: 'CIVICS_ADDRESS_LOOKUP',
  'civics-address-lookup': 'CIVICS_ADDRESS_LOOKUP',
  'social-sharing': 'SOCIAL_SHARING',
  'social-sharing-polls': 'SOCIAL_SHARING_POLLS',
  'social-sharing-civics': 'SOCIAL_SHARING_CIVICS',
  'social-sharing-visual': 'SOCIAL_SHARING_VISUAL',
  'social-sharing-og': 'SOCIAL_SHARING_OG',
  notifications: 'PUSH_NOTIFICATIONS',
  'civic-engagement-v2': 'CIVIC_ENGAGEMENT_V2',
  civicengagementv2: 'CIVIC_ENGAGEMENT_V2',
  webauthn: 'WEBAUTHN',
  'feature-db-optimization-suite': 'FEATURE_DB_OPTIMIZATION_SUITE',
  'feature_db_optimization_suite': 'FEATURE_DB_OPTIMIZATION_SUITE',
};

function isMutableFlag(key: FeatureFlagKey | string): key is MutableFlag {
  return Object.prototype.hasOwnProperty.call(FEATURE_FLAGS, key);
}

function isAlwaysEnabledFlag(key: FeatureFlagKey | string): key is AlwaysEnabledFlag {
  return ALWAYS_ENABLED_SET.has(String(key));
}

function formatFlagName(flagId: FeatureFlagKey): string {
  return String(flagId)
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalize(key: string): FeatureFlagKey | null {
  if (!key) return null;
  const alias = ALIASES[key.toLowerCase()];
  if (alias) return alias;
  const canonical = key.toUpperCase().replace(/-/g, '_');
  if (isAlwaysEnabledFlag(canonical)) {
    return canonical as AlwaysEnabledFlag;
  }
  if (isMutableFlag(canonical)) {
    return canonical as MutableFlag;
  }
  return null;
}

const mutableFlags: Record<MutableFlag, boolean> = { ...FEATURE_FLAGS };

// Apply env overrides for production persistence (survives server restart)
// Format: FEATURE_FLAGS_OVERRIDE='{"CONTACT_INFORMATION_SYSTEM":true}'
if (typeof process !== 'undefined' && process.env?.FEATURE_FLAGS_OVERRIDE) {
  try {
    const overrides = JSON.parse(process.env.FEATURE_FLAGS_OVERRIDE) as Record<string, boolean>;
    for (const [key, value] of Object.entries(overrides)) {
      const resolved = normalize(key);
      if (resolved && isMutableFlag(resolved) && typeof value === 'boolean') {
        mutableFlags[resolved] = value;
      }
    }
    logger.info('[FEATURE_FLAGS] Applied env overrides', { count: Object.keys(overrides).length });
  } catch {
    logger.warn('[FEATURE_FLAGS] Invalid FEATURE_FLAGS_OVERRIDE JSON, ignoring');
  }
}

let cachedSnapshot: Record<string, boolean> | null = null;

function buildSnapshot(): Record<string, boolean> {
  if (!cachedSnapshot) {
    const snapshot: Record<string, boolean> = { ...mutableFlags };
    ALWAYS_ENABLED_FLAGS.forEach((flag) => {
      snapshot[flag] = true;
    });
    cachedSnapshot = snapshot;
  }
  return cachedSnapshot;
}

const subscribers = new Set<(flags: Record<string, boolean>) => void>();

function notifySubscribers() {
  cachedSnapshot = null;
  const snapshot = buildSnapshot();
  subscribers.forEach((cb) => {
    try {
      cb(snapshot);
    } catch {
      // noop
    }
  });
}

function categorizeFlag(flag: FeatureFlagKey): string {
  const categoryEntries = Object.entries(CATEGORY_MAP);
  for (const [category, flags] of categoryEntries) {
    if (flags.includes(flag)) {
      return category;
    }
  }
  return 'other';
}

const toFeatureFlagDescriptor = (
  flag: FeatureFlagKey,
  enabled: boolean,
  description: string,
): FeatureFlag => ({
  id: flag,
  name: formatFlagName(flag),
  enabled,
  description,
  key: flag,
  category: categorizeFlag(flag),
});

export function isFeatureEnabled<K extends string>(key: K): boolean {
  const normalizedKey = normalize(key);
  if (!normalizedKey) return false;
  if (isAlwaysEnabledFlag(normalizedKey)) return true;
  if (isMutableFlag(normalizedKey)) {
    return mutableFlags[normalizedKey] === true;
  }
  return false;
}

export type FeatureFlagManager = typeof featureFlagManager;

export const featureFlagManager = {
  enable: (input: string | FeatureFlagKey): boolean => {
    const key = normalize(String(input));
    if (!key) return false;
    if (isAlwaysEnabledFlag(key)) {
      logger.info(`[FEATURE_FLAGS] '${key}' is always enabled and cannot be toggled.`);
      return true;
    }
    if (!isMutableFlag(key)) return false;
    if (!mutableFlags[key]) {
      mutableFlags[key] = true;
      notifySubscribers();
    }
    return true;
  },
  disable: (input: string | FeatureFlagKey): boolean => {
    const key = normalize(String(input));
    if (!key) return false;
    if (isAlwaysEnabledFlag(key)) {
      logger.warn(`[FEATURE_FLAGS] Attempted to disable always-on flag '${key}'.`);
      return false;
    }
    if (!isMutableFlag(key)) return false;
    if (mutableFlags[key]) {
      mutableFlags[key] = false;
      notifySubscribers();
    }
    return true;
  },
  toggle: (input: string | FeatureFlagKey): boolean => {
    const key = normalize(String(input));
    if (!key) return false;
    if (isAlwaysEnabledFlag(key)) {
      logger.info(`[FEATURE_FLAGS] '${key}' is always enabled and cannot be toggled.`);
      return true;
    }
    if (!isMutableFlag(key)) return false;
    mutableFlags[key] = !mutableFlags[key];
    notifySubscribers();
    return true;
  },
  get: (input: string | FeatureFlagKey): boolean => {
    const key = normalize(String(input));
    if (!key) return false;
    if (isAlwaysEnabledFlag(key)) return true;
    if (isMutableFlag(key)) return mutableFlags[key] ?? false;
    return false;
  },
  all: () => buildSnapshot(),
  getAllFlags: (): Map<string, FeatureFlag> => {
    const descriptors: FeatureFlag[] = [
      ...ALWAYS_ENABLED_FLAGS.map((flag) =>
        toFeatureFlagDescriptor(flag, true, `Core capability '${flag}' is always enabled.`),
      ),
      ...Object.entries(mutableFlags).map(([key, enabled]) =>
        toFeatureFlagDescriptor(
          key as FeatureFlagKey,
          Boolean(enabled),
          `Feature flag for ${formatFlagName(key as FeatureFlagKey)}`,
        ),
      ),
    ];
    return new Map(descriptors.map((flag) => [flag.id, flag]));
  },
  isEnabled: (input: string | FeatureFlagKey): boolean => isFeatureEnabled(String(input)),
  getFlag: (input: string): FeatureFlag | null => {
    const normalizedKey = normalize(input);
    if (!normalizedKey) return null;
    if (isAlwaysEnabledFlag(normalizedKey)) {
      return toFeatureFlagDescriptor(
        normalizedKey,
        true,
        `Core capability '${normalizedKey}' is always enabled.`,
      );
    }
    if (!isMutableFlag(normalizedKey)) return null;
    const enabled = mutableFlags[normalizedKey] ?? false;
    return toFeatureFlagDescriptor(
      normalizedKey,
      enabled,
      `Feature flag for ${formatFlagName(normalizedKey)}`,
    );
  },
  getEnabledFlags: (): FeatureFlag[] => [
    ...ALWAYS_ENABLED_FLAGS.map((flag) =>
      toFeatureFlagDescriptor(flag, true, `Core capability '${flag}' is always enabled.`),
    ),
    ...Object.entries(mutableFlags)
      .filter(([, enabled]) => enabled)
      .map(([key, enabled]) =>
        toFeatureFlagDescriptor(
          key as FeatureFlagKey,
          Boolean(enabled),
          `Feature flag for ${formatFlagName(key as FeatureFlagKey)}`,
        ),
      ),
  ],
  getDisabledFlags: (): FeatureFlag[] =>
    Object.entries(mutableFlags)
      .filter(([, enabled]) => !enabled)
      .map(([key]) =>
        toFeatureFlagDescriptor(
          key as FeatureFlagKey,
          false,
          `Feature flag for ${formatFlagName(key as FeatureFlagKey)}`,
        ),
      ),
  getFlagsByCategory: (category: string): FeatureFlag[] => {
    const resolved = CATEGORY_ALIASES[category] ?? category;
    const flags = CATEGORY_MAP[resolved] ?? [];
    return flags.map((flag) =>
      toFeatureFlagDescriptor(
        flag,
        isFeatureEnabled(flag),
        `Feature flag for ${formatFlagName(flag)}`,
      ),
    );
  },
  getSystemInfo: (): FeatureFlagSystemInfo => {
    const enabledMutableCount = Object.values(mutableFlags).filter(Boolean).length;
    const disabledMutableCount = Object.values(mutableFlags).filter((flag) => !flag).length;
    const categoryCounts = Object.fromEntries(
      Object.entries(CATEGORY_MAP).map(([category, flags]) => [category, flags.length]),
    );
    return {
      totalFlags: ALWAYS_ENABLED_FLAGS.length + Object.keys(mutableFlags).length,
      enabledFlags: ALWAYS_ENABLED_FLAGS.length + enabledMutableCount,
      disabledFlags: disabledMutableCount,
      environment: process.env.NODE_ENV || 'development',
      categories: categoryCounts,
    };
  },
  areDependenciesEnabled: (flagId: string): boolean => {
    const normalizedKey = normalize(flagId);
    if (!normalizedKey) return false;
    if (isAlwaysEnabledFlag(normalizedKey)) return true;
    if (!isMutableFlag(normalizedKey)) return false;
    const deps = DEPENDENCY_MAP[normalizedKey] ?? [];
    return deps.every((dep) => isFeatureEnabled(dep));
  },
  subscribe: (callback: (flags: Record<string, boolean>) => void): FeatureFlagSubscription => {
    if (typeof callback === 'function') {
      subscribers.add(callback);
      try {
        callback(buildSnapshot());
      } catch {
        // noop
      }
    }
    return { unsubscribe: () => subscribers.delete(callback) };
  },
  updateFlagMetadata: (flagId: string, metadata: FeatureFlagMetadata): boolean => {
    logger.info(`Updating metadata for flag ${flagId}:`, metadata);
    return true;
  },
  reset: (): void => {
    Object.keys(FEATURE_FLAGS).forEach((key) => {
      const mutableKey = key as MutableFlag;
      mutableFlags[mutableKey] = FEATURE_FLAGS[mutableKey];
    });
    cachedSnapshot = null;
    notifySubscribers();
  },
  exportConfig: (): FeatureFlagConfig => ({
    flags: { ...mutableFlags },
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  }),
  importConfig: (config: FeatureFlagConfig): void => {
    if (!config?.flags) return;
    Object.entries(config.flags).forEach(([key, value]) => {
      const normalizedKey = normalize(key);
      if (normalizedKey && isMutableFlag(normalizedKey) && typeof value === 'boolean') {
        mutableFlags[normalizedKey] = value;
      }
    });
    cachedSnapshot = null;
    notifySubscribers();
  },
};

export const enableFeature = featureFlagManager.enable;
export const disableFeature = featureFlagManager.disable;
export const toggleFeature = featureFlagManager.toggle;
export const getFeatureFlag = (k: string | FeatureFlagKey) => isFeatureEnabled(String(k));

export async function getFeatureFlags(): Promise<Record<string, boolean>> {
  return buildSnapshot();
}

export async function setFeatureFlags(flags: Record<string, boolean>): Promise<void> {
  Object.entries(flags).forEach(([key, value]) => {
    const normalizedKey = normalize(key);
    if (normalizedKey && isMutableFlag(normalizedKey) && typeof value === 'boolean') {
      mutableFlags[normalizedKey] = value;
    }
  });
  notifySubscribers();
}

export const getAllFeatureFlags = () => buildSnapshot();

