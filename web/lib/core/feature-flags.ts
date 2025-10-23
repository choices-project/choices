/**
 * Core Feature Flags System
 * 
 * Centralized feature flag management with type safety and runtime control.
 * Provides the foundation for feature rollout, A/B testing, and safe deployments.
 */

import { logger } from '@/lib/utils/logger';

// Feature Flag Types
export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
  category?: string;
  dependencies?: string[];
  metadata?: Record<string, unknown>;
}

export interface FeatureFlagConfig {
  flags: Record<string, boolean>;
  categories: Record<string, string[]>;
  environment: string;
  version: string;
}

export interface FeatureFlagManager {
  isEnabled(flagId: string): boolean;
  isDisabled(flagId: string): boolean;
  enable(flagId: string): boolean;
  disable(flagId: string): boolean;
  toggle(flagId: string): boolean;
  getFlag(flagId: string): FeatureFlag | undefined;
  getAllFlags(): Map<string, FeatureFlag>;
  getEnabledFlags(): FeatureFlag[];
  getDisabledFlags(): FeatureFlag[];
  getFlagsByCategory(category: 'core' | 'optional' | 'experimental'): FeatureFlag[];
  getSystemInfo(): {
    totalFlags: number;
    enabledFlags: number;
    disabledFlags: number;
    environment: string;
    categories: Record<string, number>;
  };
  subscribe(callback: (flags: Record<string, boolean>) => void): { unsubscribe: () => void };
  updateFlagMetadata(flagId: string, metadata: Record<string, unknown>): boolean;
  reset(): void;
  exportConfig(): FeatureFlagConfig;
  importConfig(config: FeatureFlagConfig): void;
  areDependenciesEnabled(flagId: string): boolean;
}

// Feature Flag Definitions
export const FEATURE_FLAGS = {
  // ===== CORE MVP FEATURES (Always Enabled) =====
  WEBAUTHN: true,
  PWA: true,
  ADMIN: true,
  FEEDBACK_WIDGET: true,        // CRITICAL: User feedback collection widget
  
  // ===== ADMIN FEATURES (Nice-to-have for MVP) =====
  USER_SUGGESTIONS_MANAGER: false, // Admin can access from laptop for now
  
  // ===== ENHANCED MVP FEATURES (FULLY IMPLEMENTED) =====
  ENHANCED_PROFILE: true,            // Advanced profile management with privacy controls
  ENHANCED_POLLS: true,              // Advanced poll creation and management system (164 polls active)
  ENHANCED_VOTING: true,             // Advanced voting methods and analytics (3 votes active)
  CIVICS_ADDRESS_LOOKUP: true,       // Address-based representative lookup system (IMPLEMENTED)
  CIVICS_REPRESENTATIVE_DATABASE: true, // Federal, state, and local representative database (IMPLEMENTED - 1,273 representatives)
  CIVICS_CAMPAIGN_FINANCE: true,     // FEC campaign finance data integration (IMPLEMENTED - 92 FEC records)
  CIVICS_VOTING_RECORDS: true,       // Congressional voting records and analysis (IMPLEMENTED - 2,185 voting records)
  CANDIDATE_ACCOUNTABILITY: true,    // Promise tracking and performance metrics (IMPLEMENTED)
  CANDIDATE_CARDS: true,             // Comprehensive candidate information cards (2 candidates)
  ALTERNATIVE_CANDIDATES: true,      // Platform for non-duopoly candidates (IMPLEMENTED)
  
  // ===== ENABLED FEATURES (FULLY IMPLEMENTED) =====
  AUTOMATED_POLLS: false,            // AI-powered poll generation from trending topics (NOT IMPLEMENTED)
  DEMOGRAPHIC_FILTERING: true,       // Personalize content based on user demographics (ENABLED - 100%)
  // TRENDING_POLLS: Removed - functionality already implemented through hashtag system
  ADVANCED_PRIVACY: true,            // Zero-knowledge proofs and differential privacy (ENABLED - 100%)
  MEDIA_BIAS_ANALYSIS: false,        // Media bias detection and analysis (NOT IMPLEMENTED)
  POLL_NARRATIVE_SYSTEM: false,      // AI-powered poll narrative generation (PARTIALLY IMPLEMENTED - 70%)
  SOCIAL_SHARING: true,              // Master switch for all social features (ENABLED - 100%)
  SOCIAL_SHARING_POLLS: true,        // Poll sharing (Twitter, Facebook, LinkedIn) (ENABLED - 100%)
  SOCIAL_SHARING_CIVICS: true,       // Representative sharing (ENABLED - 100%)
  SOCIAL_SHARING_VISUAL: false,      // Visual content generation (IG, TikTok) (NOT IMPLEMENTED)
  SOCIAL_SHARING_OG: false,          // Dynamic Open Graph image generation (NOT IMPLEMENTED)
  SOCIAL_SIGNUP: false,              // Social OAuth signup (NOT IMPLEMENTED)
  CONTACT_INFORMATION_SYSTEM: true,  // Contact information system with messaging (ENABLED - 100%)
  CIVICS_TESTING_STRATEGY: false,    // Civics testing strategy (NOT IMPLEMENTED)
  DEVICE_FLOW_AUTH: false,           // OAuth 2.0 Device Authorization Grant flow (DISABLED - Future implementation)
  
  // ===== PERFORMANCE & OPTIMIZATION =====
  PERFORMANCE_OPTIMIZATION: true,   // Image optimization, virtual scrolling, lazy loading (enabled for mobile)
  FEATURE_DB_OPTIMIZATION_SUITE: true, // Database optimization suite - enabled for performance
  ANALYTICS: true,                   // Advanced analytics and user insights
  
  // ===== SYSTEM FEATURES =====
  PUSH_NOTIFICATIONS: true,          // Push notifications and alerts (enabled for mobile PWA)
  THEMES: true,                      // Dark mode and theme customization (enabled for mobile UX)
  ACCESSIBILITY: true,               // Advanced accessibility features (enabled for mobile accessibility)
  INTERNATIONALIZATION: true,        // Multi-language support (ENABLED - 100%)
  
  // Legacy flags for backward compatibility
  CORE_AUTH: true,
  CORE_POLLS: true,
  CORE_USERS: true,
  EXPERIMENTAL_UIFeature: false,
  AIFeaturesFeature: false,
  AdvancedPrivacyFeature: false,
  AnalyticsFeature: false,
  PWAFeature: true,
  AdminFeature: true,
  AuditFeature: false,
  ExperimentalUIFeature: false,
  VotingFeature: true,
  DatabaseFeature: true,
  APIFeature: true,
  UIFeature: true,
  AuthFeature: true
} as const;

// Feature Flag Categories
export const FEATURE_FLAG_CATEGORIES: Record<string, string[]> = {
  core: ['WEBAUTHN', 'PWA', 'ADMIN', 'FEEDBACK_WIDGET', 'CORE_AUTH', 'CORE_POLLS', 'CORE_USERS'],
  enhanced: ['ENHANCED_PROFILE', 'ENHANCED_POLLS', 'ENHANCED_VOTING'],
  civics: ['CIVICS_ADDRESS_LOOKUP', 'CIVICS_REPRESENTATIVE_DATABASE', 'CIVICS_CAMPAIGN_FINANCE', 'CIVICS_VOTING_RECORDS', 'CANDIDATE_ACCOUNTABILITY', 'CANDIDATE_CARDS', 'ALTERNATIVE_CANDIDATES'],
  future: ['AUTOMATED_POLLS', 'MEDIA_BIAS_ANALYSIS', 'POLL_NARRATIVE_SYSTEM'],
  personalization: ['DEMOGRAPHIC_FILTERING'],
  privacy: ['ADVANCED_PRIVACY'],
  performance: ['PERFORMANCE_OPTIMIZATION', 'FEATURE_DB_OPTIMIZATION_SUITE'],
  social: ['SOCIAL_SHARING', 'SOCIAL_SHARING_POLLS', 'SOCIAL_SHARING_CIVICS', 'SOCIAL_SHARING_VISUAL', 'SOCIAL_SHARING_OG', 'SOCIAL_SIGNUP'],
  system: ['PUSH_NOTIFICATIONS', 'THEMES', 'ACCESSIBILITY', 'INTERNATIONALIZATION'],
  analytics: ['ANALYTICS'],
  admin: ['USER_SUGGESTIONS_MANAGER'],
  contact: ['CONTACT_INFORMATION_SYSTEM'],
  testing: ['CIVICS_TESTING_STRATEGY'],
  auth: ['DEVICE_FLOW_AUTH'],
  legacy: ['EXPERIMENTAL_UIFeature', 'AIFeaturesFeature', 'AdvancedPrivacyFeature', 'AnalyticsFeature', 'PWAFeature', 'AdminFeature', 'AuditFeature', 'ExperimentalUIFeature', 'VotingFeature', 'DatabaseFeature', 'APIFeature', 'UIFeature', 'AuthFeature']
};

// Feature Flag Dependencies
export const FEATURE_FLAG_DEPENDENCIES: Record<string, string[]> = {
  ENHANCED_PROFILE: ['CORE_AUTH'],
  ENHANCED_POLLS: ['CORE_POLLS'],
  ENHANCED_VOTING: ['CORE_POLLS'],
  CIVICS_ADDRESS_LOOKUP: ['CORE_AUTH'],
  CIVICS_REPRESENTATIVE_DATABASE: ['CIVICS_ADDRESS_LOOKUP'],
  CIVICS_CAMPAIGN_FINANCE: ['CIVICS_REPRESENTATIVE_DATABASE'],
  CIVICS_VOTING_RECORDS: ['CIVICS_REPRESENTATIVE_DATABASE'],
  CANDIDATE_ACCOUNTABILITY: ['CIVICS_REPRESENTATIVE_DATABASE'],
  CANDIDATE_CARDS: ['CIVICS_REPRESENTATIVE_DATABASE'],
  ALTERNATIVE_CANDIDATES: ['CIVICS_REPRESENTATIVE_DATABASE'],
  AUTOMATED_POLLS: ['ANALYTICS'],
  DEMOGRAPHIC_FILTERING: ['ANALYTICS'],
  // TRENDING_POLLS: Removed - functionality already implemented through hashtag system
  SOCIAL_SHARING_POLLS: ['SOCIAL_SHARING'],
  SOCIAL_SHARING_CIVICS: ['SOCIAL_SHARING'],
  SOCIAL_SHARING_VISUAL: ['SOCIAL_SHARING'],
  SOCIAL_SHARING_OG: ['SOCIAL_SHARING'],
  SOCIAL_SIGNUP: ['SOCIAL_SHARING'],
  CONTACT_INFORMATION_SYSTEM: ['CIVICS_REPRESENTATIVE_DATABASE'],
  DEVICE_FLOW_AUTH: ['CORE_AUTH'],
  // Legacy dependencies
  AIFeaturesFeature: ['ANALYTICS'],
  AdvancedPrivacyFeature: ['ADVANCED_PRIVACY'],
  AnalyticsFeature: ['ANALYTICS'],
  PWAFeature: ['PWA'],
  AdminFeature: ['ADMIN'],
  AuditFeature: ['ADMIN'],
  ExperimentalUIFeature: ['ANALYTICS'],
  VotingFeature: ['CORE_POLLS'],
  DatabaseFeature: ['CORE_AUTH'],
  APIFeature: ['CORE_AUTH'],
  UIFeature: ['CORE_AUTH'],
  AuthFeature: ['CORE_AUTH']
};

// Feature Flag Manager Implementation
class FeatureFlagManagerImpl implements FeatureFlagManager {
  private flags: Record<string, boolean>;
  private subscribers: Set<(flags: Record<string, boolean>) => void>;
  private metadata: Map<string, Record<string, unknown>>;

  constructor() {
    this.flags = { ...FEATURE_FLAGS };
    this.subscribers = new Set();
    this.metadata = new Map();
    
    // Initialize metadata
    this.initializeMetadata();
    
    logger.info('Feature flag manager initialized', {
      totalFlags: Object.keys(this.flags).length,
      enabledFlags: Object.values(this.flags).filter(Boolean).length
    });
  }

  private initializeMetadata(): void {
    Object.keys(this.flags).forEach(flagId => {
      this.metadata.set(flagId, {
        category: this.getCategoryForFlag(flagId),
        dependencies: FEATURE_FLAG_DEPENDENCIES[flagId] || [],
        description: `Feature flag for ${flagId.toLowerCase().replace(/_/g, ' ')}`,
        lastModified: new Date().toISOString()
      });
    });
  }

  private getCategoryForFlag(flagId: string): string {
    for (const [category, flags] of Object.entries(FEATURE_FLAG_CATEGORIES)) {
      if (flags.includes(flagId)) {
        return category;
      }
    }
    return 'general';
  }

  isEnabled(flagId: string): boolean {
    const normalizedId = this.normalizeFlagId(flagId);
    return this.flags[normalizedId] === true;
  }

  isDisabled(flagId: string): boolean {
    return !this.isEnabled(flagId);
  }

  enable(flagId: string): boolean {
    const normalizedId = this.normalizeFlagId(flagId);
    
    if (!(normalizedId in this.flags)) {
      logger.warn('Attempted to enable unknown feature flag', { flagId: normalizedId });
      return false;
    }

    if (this.flags[normalizedId] === true) {
      return true; // Already enabled
    }

    // Check dependencies
    if (!this.areDependenciesEnabled(normalizedId)) {
      logger.warn('Cannot enable feature flag - dependencies not met', { 
        flagId: normalizedId, 
        dependencies: FEATURE_FLAG_DEPENDENCIES[normalizedId] 
      });
      return false;
    }

    this.flags[normalizedId] = true;
    this.notifySubscribers();
    
    logger.info('Feature flag enabled', { flagId: normalizedId });
    return true;
  }

  disable(flagId: string): boolean {
    const normalizedId = this.normalizeFlagId(flagId);
    
    if (!(normalizedId in this.flags)) {
      logger.warn('Attempted to disable unknown feature flag', { flagId: normalizedId });
      return false;
    }

    if (this.flags[normalizedId] === false) {
      return true; // Already disabled
    }

    this.flags[normalizedId] = false;
    this.notifySubscribers();
    
    logger.info('Feature flag disabled', { flagId: normalizedId });
    return true;
  }

  toggle(flagId: string): boolean {
    const normalizedId = this.normalizeFlagId(flagId);
    
    if (this.isEnabled(normalizedId)) {
      return this.disable(normalizedId);
    } else {
      return this.enable(normalizedId);
    }
  }

  getFlag(flagId: string): FeatureFlag | undefined {
    const normalizedId = this.normalizeFlagId(flagId);
    
    if (!(normalizedId in this.flags)) {
      return undefined;
    }

    const metadata = this.metadata.get(normalizedId) || {};
    
    return {
      id: normalizedId,
      name: normalizedId.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      enabled: this.flags[normalizedId] ?? false,
      description: metadata.description as string || `Feature flag for ${normalizedId.toLowerCase().replace(/_/g, ' ')}`,
      category: metadata.category as string,
      dependencies: metadata.dependencies as string[],
      metadata
    };
  }

  getAllFlags(): Map<string, FeatureFlag> {
    const flags = new Map<string, FeatureFlag>();
    
    Object.keys(this.flags).forEach(flagId => {
      const flag = this.getFlag(flagId);
      if (flag) {
        flags.set(flagId, flag);
      }
    });
    
    return flags;
  }

  getEnabledFlags(): FeatureFlag[] {
    return Array.from(this.getAllFlags().values()).filter(flag => flag.enabled);
  }

  getDisabledFlags(): FeatureFlag[] {
    return Array.from(this.getAllFlags().values()).filter(flag => !flag.enabled);
  }

  getFlagsByCategory(category: keyof typeof FEATURE_FLAG_CATEGORIES): FeatureFlag[] {
    const categoryFlags = FEATURE_FLAG_CATEGORIES[category] || [];
    return Array.from(this.getAllFlags().values()).filter(flag => 
      categoryFlags.includes(flag.id)
    );
  }

  getSystemInfo(): {
    totalFlags: number;
    enabledFlags: number;
    disabledFlags: number;
    environment: string;
    categories: Record<string, number>;
  } {
    const allFlags = this.getAllFlags();
    const enabledFlags = this.getEnabledFlags();
    const disabledFlags = this.getDisabledFlags();
    
    const categories: Record<string, number> = {};
    Object.keys(FEATURE_FLAG_CATEGORIES).forEach(category => {
      categories[category] = this.getFlagsByCategory(category).length;
    });

    return {
      totalFlags: allFlags.size,
      enabledFlags: enabledFlags.length,
      disabledFlags: disabledFlags.length,
      environment: process.env.NODE_ENV || 'development',
      categories
    };
  }

  subscribe(callback: (flags: Record<string, boolean>) => void): { unsubscribe: () => void } {
    this.subscribers.add(callback);
    
    return {
      unsubscribe: () => {
        this.subscribers.delete(callback);
      }
    };
  }

  updateFlagMetadata(flagId: string, metadata: Record<string, unknown>): boolean {
    const normalizedId = this.normalizeFlagId(flagId);
    
    if (!(normalizedId in this.flags)) {
      logger.warn('Attempted to update metadata for unknown feature flag', { flagId: normalizedId });
      return false;
    }

    const existingMetadata = this.metadata.get(normalizedId) || {};
    this.metadata.set(normalizedId, { ...existingMetadata, ...metadata });
    
    logger.info('Feature flag metadata updated', { flagId: normalizedId, metadata });
    return true;
  }

  reset(): void {
    this.flags = { ...FEATURE_FLAGS };
    this.initializeMetadata();
    this.notifySubscribers();
    
    logger.info('Feature flags reset to defaults');
  }

  exportConfig(): FeatureFlagConfig {
    return {
      flags: { ...this.flags },
      categories: { ...FEATURE_FLAG_CATEGORIES },
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    };
  }

  importConfig(config: FeatureFlagConfig): void {
    if (config.flags) {
      this.flags = { ...config.flags };
    }
    
    this.notifySubscribers();
    
    logger.info('Feature flag configuration imported', { 
      totalFlags: Object.keys(this.flags).length 
    });
  }

  areDependenciesEnabled(flagId: string): boolean {
    const dependencies = FEATURE_FLAG_DEPENDENCIES[flagId] || [];
    return dependencies.every(dep => this.isEnabled(dep));
  }

  private normalizeFlagId(flagId: string): string {
    // Handle case-insensitive lookups and legacy naming
    const normalized = flagId.toUpperCase();
    
    // Check for exact match first
    if (normalized in this.flags) {
      return normalized;
    }
    
    // Check for legacy naming patterns
    const legacyMappings: Record<string, string> = {
      'AUTHENTICATION': 'CORE_AUTH',
      'POLLS': 'CORE_POLLS',
      'USERS': 'CORE_USERS',
      'ANALYTICS': 'ANALYTICS',
      'PWA': 'PWA',
      'ADMIN': 'ADMIN',
      'WEBAUTHN': 'WEBAUTHN',
      'FEEDBACK_WIDGET': 'FEEDBACK_WIDGET',
      'ENHANCED_PROFILE': 'ENHANCED_PROFILE',
      'ENHANCED_POLLS': 'ENHANCED_POLLS',
      'ENHANCED_VOTING': 'ENHANCED_VOTING',
      'CIVICS_ADDRESS_LOOKUP': 'CIVICS_ADDRESS_LOOKUP',
      'CIVICS_REPRESENTATIVE_DATABASE': 'CIVICS_REPRESENTATIVE_DATABASE',
      'CIVICS_CAMPAIGN_FINANCE': 'CIVICS_CAMPAIGN_FINANCE',
      'CIVICS_VOTING_RECORDS': 'CIVICS_VOTING_RECORDS',
      'CANDIDATE_ACCOUNTABILITY': 'CANDIDATE_ACCOUNTABILITY',
      'CANDIDATE_CARDS': 'CANDIDATE_CARDS',
      'ALTERNATIVE_CANDIDATES': 'ALTERNATIVE_CANDIDATES',
      'AUTOMATED_POLLS': 'AUTOMATED_POLLS',
      'DEMOGRAPHIC_FILTERING': 'DEMOGRAPHIC_FILTERING',
      'TRENDING_POLLS': 'TRENDING_POLLS',
      'PERFORMANCE_OPTIMIZATION': 'PERFORMANCE_OPTIMIZATION',
      'FEATURE_DB_OPTIMIZATION_SUITE': 'FEATURE_DB_OPTIMIZATION_SUITE',
      'EXPERIMENTAL_UI': 'EXPERIMENTAL_UI',
      'EXPERIMENTAL_ANALYTICS': 'EXPERIMENTAL_ANALYTICS',
      'EXPERIMENTAL_COMPONENTS': 'EXPERIMENTAL_COMPONENTS',
      'ADVANCED_PRIVACY': 'ADVANCED_PRIVACY',
      'SOCIAL_SHARING': 'SOCIAL_SHARING',
      'AI_FEATURES': 'AI_FEATURES'
    };
    
    if (normalized in legacyMappings) {
      return legacyMappings[normalized] || normalized;
    }
    
    return normalized;
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback({ ...this.flags });
      } catch (error) {
        logger.error('Error in feature flag subscriber', error instanceof Error ? error : new Error(String(error)));
      }
    });
  }
}

// Create and export the feature flag manager instance
export const featureFlagManager = new FeatureFlagManagerImpl();

// Export convenience functions
export const isFeatureEnabled = (flagId: string): boolean => featureFlagManager.isEnabled(flagId);
export const enableFeature = (flagId: string): boolean => featureFlagManager.enable(flagId);
export const disableFeature = (flagId: string): boolean => featureFlagManager.disable(flagId);
export const toggleFeature = (flagId: string): boolean => featureFlagManager.toggle(flagId);
export const getFeatureFlag = (flagId: string): FeatureFlag | undefined => featureFlagManager.getFlag(flagId);
export const getAllFeatureFlags = (): Map<string, FeatureFlag> => featureFlagManager.getAllFlags();

// Types are already exported at the top of the file