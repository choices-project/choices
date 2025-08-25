/**
 * Feature Flag Management System
 * 
 * This system provides comprehensive feature flag management for the Choices platform.
 * It supports environment-based configuration, runtime flag management, and module loading.
 */

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'core' | 'optional' | 'experimental';
  dependencies?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureFlagConfig {
  flags: Record<string, FeatureFlag>;
  defaultEnabled: boolean;
  environment: 'development' | 'staging' | 'production';
}

export class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();
  private config: FeatureFlagConfig;
  private listeners: Set<(flags: Map<string, FeatureFlag>) => void> = new Set();

  constructor(config?: Partial<FeatureFlagConfig>) {
    this.config = {
      flags: {},
      defaultEnabled: false,
      environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
      ...config
    };
    
    this.initializeFlags();
  }

  /**
   * Initialize feature flags from environment variables and configuration
   */
  private initializeFlags(): void {
    // Core flags - always available
    this.addFlag({
      id: 'authentication',
      name: 'Authentication System',
      description: 'User authentication and authorization',
      enabled: true,
      category: 'core',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.addFlag({
      id: 'voting',
      name: 'Voting System',
      description: 'Core voting functionality',
      enabled: true,
      category: 'core',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.addFlag({
      id: 'database',
      name: 'Database System',
      description: 'Core database functionality',
      enabled: true,
      category: 'core',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.addFlag({
      id: 'api',
      name: 'API System',
      description: 'RESTful API endpoints',
      enabled: true,
      category: 'core',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.addFlag({
      id: 'ui',
      name: 'User Interface',
      description: 'Core user interface components',
      enabled: true,
      category: 'core',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Optional flags - controlled by environment variables
    this.addFlag({
      id: 'advancedPrivacy',
      name: 'Advanced Privacy Features',
      description: 'Zero-knowledge proofs, differential privacy, VOPRF protocol',
      enabled: process.env.ENABLE_ADVANCED_PRIVACY === 'true',
      category: 'optional',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.addFlag({
      id: 'analytics',
      name: 'Analytics System',
      description: 'Data visualization, analytics dashboard, and insights',
      enabled: process.env.ENABLE_ANALYTICS === 'true',
      category: 'optional',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.addFlag({
      id: 'pwa',
      name: 'Progressive Web App',
      description: 'PWA features, offline support, app-like experience',
      enabled: process.env.ENABLE_PWA === 'true',
      category: 'optional',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.addFlag({
      id: 'admin',
      name: 'Admin Dashboard',
      description: 'System administration, user management, poll management',
      enabled: process.env.ENABLE_ADMIN === 'true',
      category: 'optional',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.addFlag({
      id: 'audit',
      name: 'Audit System',
      description: 'Advanced audit trails, logging, and compliance',
      enabled: process.env.ENABLE_AUDIT === 'true',
      category: 'optional',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Experimental flags - for testing new features
    this.addFlag({
      id: 'experimentalUI',
      name: 'Experimental UI Features',
      description: 'New UI components and interactions',
      enabled: process.env.ENABLE_EXPERIMENTAL_UI === 'true',
      category: 'experimental',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.addFlag({
      id: 'aiFeatures',
      name: 'AI-Powered Features',
      description: 'Machine learning and AI integration',
      enabled: process.env.ENABLE_AI_FEATURES === 'true',
      category: 'experimental',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Add a new feature flag
   */
  addFlag(flag: FeatureFlag): void {
    this.flags.set(flag.id, flag);
    this.notifyListeners();
  }

  /**
   * Remove a feature flag
   */
  removeFlag(flagId: string): boolean {
    const removed = this.flags.delete(flagId);
    if (removed) {
      this.notifyListeners();
    }
    return removed;
  }

  /**
   * Check if a feature flag is enabled
   */
  isEnabled(flagId: string): boolean {
    const flag = this.flags.get(flagId);
    return flag?.enabled || false;
  }

  /**
   * Enable a feature flag
   */
  enable(flagId: string): boolean {
    const flag = this.flags.get(flagId);
    if (flag) {
      flag.enabled = true;
      flag.updatedAt = new Date();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * Disable a feature flag
   */
  disable(flagId: string): boolean {
    const flag = this.flags.get(flagId);
    if (flag) {
      flag.enabled = false;
      flag.updatedAt = new Date();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * Toggle a feature flag
   */
  toggle(flagId: string): boolean {
    const flag = this.flags.get(flagId);
    if (flag) {
      flag.enabled = !flag.enabled;
      flag.updatedAt = new Date();
      this.notifyListeners();
      return flag.enabled;
    }
    return false;
  }

  /**
   * Get a feature flag by ID
   */
  getFlag(flagId: string): FeatureFlag | undefined {
    return this.flags.get(flagId);
  }

  /**
   * Get all feature flags
   */
  getAllFlags(): Map<string, FeatureFlag> {
    return new Map(this.flags);
  }

  /**
   * Get flags by category
   */
  getFlagsByCategory(category: 'core' | 'optional' | 'experimental'): FeatureFlag[] {
    return Array.from(this.flags.values()).filter(flag => flag.category === category);
  }

  /**
   * Get enabled flags
   */
  getEnabledFlags(): FeatureFlag[] {
    return Array.from(this.flags.values()).filter(flag => flag.enabled);
  }

  /**
   * Get disabled flags
   */
  getDisabledFlags(): FeatureFlag[] {
    return Array.from(this.flags.values()).filter(flag => !flag.enabled);
  }

  /**
   * Check if all required flags are enabled
   */
  areDependenciesEnabled(flagId: string): boolean {
    const flag = this.flags.get(flagId);
    if (!flag || !flag.dependencies) {
      return true;
    }

    return flag.dependencies.every(depId => this.isEnabled(depId));
  }

  /**
   * Update flag metadata
   */
  updateFlagMetadata(flagId: string, metadata: Record<string, any>): boolean {
    const flag = this.flags.get(flagId);
    if (flag) {
      flag.metadata = { ...flag.metadata, ...metadata };
      flag.updatedAt = new Date();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * Subscribe to flag changes
   */
  subscribe(listener: (flags: Map<string, FeatureFlag>) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of flag changes
   */
  private notifyListeners(): void {
    const currentFlags = new Map(this.flags);
    this.listeners.forEach(listener => {
      try {
        listener(currentFlags);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          // Use devLog for consistent logging
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'feature_flag_error', {
              error_message: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    });
  }

  /**
   * Export flags configuration
   */
  exportConfig(): FeatureFlagConfig {
    return {
      flags: Object.fromEntries(this.flags),
      defaultEnabled: this.config.defaultEnabled,
      environment: this.config.environment
    };
  }

  /**
   * Import flags configuration
   */
  importConfig(config: FeatureFlagConfig): void {
    this.config = config;
    this.flags.clear();
    
    Object.values(config.flags).forEach(flag => {
      this.flags.set(flag.id, flag);
    });
    
    this.notifyListeners();
  }

  /**
   * Reset flags to default state
   */
  reset(): void {
    this.flags.clear();
    this.initializeFlags();
    this.notifyListeners();
  }

  /**
   * Get system information
   */
  getSystemInfo(): {
    totalFlags: number;
    enabledFlags: number;
    disabledFlags: number;
    environment: string;
    categories: Record<string, number>;
  } {
    const categories = {
      core: 0,
      optional: 0,
      experimental: 0
    };

    this.flags.forEach(flag => {
      categories[flag.category]++;
    });

    return {
      totalFlags: this.flags.size,
      enabledFlags: this.getEnabledFlags().length,
      disabledFlags: this.getDisabledFlags().length,
      environment: this.config.environment,
      categories
    };
  }
}

// Create global instance
export const featureFlagManager = new FeatureFlagManager();

// Export convenience functions
export const isFeatureEnabled = (flagId: string): boolean => 
  featureFlagManager.isEnabled(flagId);

export const enableFeature = (flagId: string): boolean => 
  featureFlagManager.enable(flagId);

export const disableFeature = (flagId: string): boolean => 
  featureFlagManager.disable(flagId);

export const toggleFeature = (flagId: string): boolean => 
  featureFlagManager.toggle(flagId);

export const getFeatureFlag = (flagId: string): FeatureFlag | undefined => 
  featureFlagManager.getFlag(flagId);

export const getAllFeatureFlags = (): Map<string, FeatureFlag> => 
  featureFlagManager.getAllFlags();

// Export for server-side usage
if (typeof window === 'undefined') {
  (global as any).featureFlagManager = featureFlagManager;
}
