/**
 * Module Loading System
 * 
 * Dynamically loads modules based on feature flags, providing a clean
 * way to conditionally include functionality in the application.
 */

import { featureFlagManager, isFeatureEnabled } from './feature-flags';

export interface ModuleConfig {
  id: string;
  name: string;
  description: string;
  featureFlag: string;
  dependencies?: string[];
  loadFunction: () => Promise<any>;
  fallback?: any;
  metadata?: Record<string, any>;
}

export interface LoadedModule {
  id: string;
  module: any;
  loaded: boolean;
  error?: Error;
  loadTime?: number;
}

export class ModuleLoader {
  private modules: Map<string, ModuleConfig> = new Map();
  private loadedModules: Map<string, LoadedModule> = new Map();
  private loadingPromises: Map<string, Promise<any>> = new Map();

  constructor() {
    this.initializeModules();
  }

  /**
   * Initialize default modules
   */
  private initializeModules(): void {
    // Core modules - always loaded
    // Authentication module temporarily disabled - AuthProvider not found
    /*
    this.registerModule({
      id: 'authentication',
      name: 'Authentication Module',
      description: 'User authentication and authorization',
      featureFlag: 'authentication',
      loadFunction: () => import('../components/auth/AuthProvider'),
      fallback: null
    });
    */

    // Voting module temporarily disabled - VotingInterface not found
    /*
    this.registerModule({
      id: 'voting',
      name: 'Voting Module',
      description: 'Core voting functionality',
      featureFlag: 'voting',
      loadFunction: () => import('../components/voting/VotingInterface'),
      fallback: null
    });
    */

    // Database module temporarily disabled - database module not found
    /*
    this.registerModule({
      id: 'database',
      name: 'Database Module',
      description: 'Database utilities and models',
      featureFlag: 'database',
      loadFunction: () => import('./database'),
      fallback: null
    });
    */

    this.registerModule({
      id: 'api',
      name: 'API Module',
      description: 'API utilities and endpoints',
      featureFlag: 'api',
      loadFunction: () => import('./api'),
      fallback: null
    });

    // UI module temporarily disabled - ui module not found
    /*
    this.registerModule({
      id: 'ui',
      name: 'UI Module',
      description: 'Core UI components',
      featureFlag: 'ui',
      loadFunction: () => import('../components/ui'),
      fallback: null
    });
    */

    // Optional modules - loaded based on feature flags
    // Advanced Privacy module temporarily disabled - AdvancedPrivacy not found
    /*
    this.registerModule({
      id: 'advancedPrivacy',
      name: 'Advanced Privacy Module',
      description: 'Zero-knowledge proofs, differential privacy, VOPRF protocol',
      featureFlag: 'advancedPrivacy',
      loadFunction: () => import('../components/privacy/AdvancedPrivacy'),
      fallback: null
    });
    */

    // Analytics module temporarily disabled - AnalyticsDashboard not found
    /*
    this.registerModule({
      id: 'analytics',
      name: 'Analytics Module',
      description: 'Data visualization and analytics',
      featureFlag: 'analytics',
      loadFunction: () => import('../components/analytics/AnalyticsDashboard'),
      fallback: null
    });
    */

    // PWA module temporarily disabled - PWAProvider not found
    /*
    this.registerModule({
      id: 'pwa',
      name: 'PWA Module',
      description: 'Progressive web app features',
      featureFlag: 'pwa',
      loadFunction: () => import('../components/pwa/PWAProvider'),
      fallback: null
    });
    */

    // Admin module temporarily disabled - AdminPanel not found
    /*
    this.registerModule({
      id: 'admin',
      name: 'Admin Module',
      description: 'System administration and management',
      featureFlag: 'admin',
      loadFunction: () => import('../components/admin/AdminPanel'),
      fallback: null
    });
    */

    // Audit module temporarily disabled - AuditProvider not found
    /*
    this.registerModule({
      id: 'audit',
      name: 'Audit Module',
      description: 'Audit trails and logging',
      featureFlag: 'audit',
      loadFunction: () => import('../components/audit/AuditProvider'),
      fallback: null
    });
    */

    // Experimental modules
    // Experimental UI module temporarily disabled - ExperimentalUI not found
    /*
    this.registerModule({
      id: 'experimentalUI',
      name: 'Experimental UI Module',
      description: 'Experimental UI components',
      featureFlag: 'experimentalUI',
      loadFunction: () => import('../components/experimental/ExperimentalUI'),
      fallback: null
    });
    */

    // AI Features module temporarily disabled - AIFeatures not found
    /*
    this.registerModule({
      id: 'aiFeatures',
      name: 'AI Features Module',
      description: 'AI-powered features and machine learning',
      featureFlag: 'aiFeatures',
      loadFunction: () => import('../components/ai/AIFeatures'),
      fallback: null
    });
    */
  }

  /**
   * Register a new module
   */
  registerModule(config: ModuleConfig): void {
    this.modules.set(config.id, config);
  }

  /**
   * Unregister a module
   */
  unregisterModule(moduleId: string): boolean {
    return this.modules.delete(moduleId);
  }

  /**
   * Check if a module should be loaded based on feature flags
   */
  shouldLoadModule(moduleId: string): boolean {
    const moduleConfig = this.modules.get(moduleId);
    if (!moduleConfig) {
      return false;
    }

    // Check if the feature flag is enabled
    if (!isFeatureEnabled(moduleConfig.featureFlag)) {
      return false;
    }

    // Check dependencies
    if (moduleConfig.dependencies) {
      return moduleConfig.dependencies.every(depId => this.shouldLoadModule(depId));
    }

    return true;
  }

  /**
   * Load a module if it should be loaded
   */
  async loadModule(moduleId: string): Promise<LoadedModule> {
    // Check if already loaded
    if (this.loadedModules.has(moduleId)) {
      return this.loadedModules.get(moduleId)!;
    }

    // Check if already loading
    if (this.loadingPromises.has(moduleId)) {
      await this.loadingPromises.get(moduleId);
      return this.loadedModules.get(moduleId)!;
    }

    const moduleConfig = this.modules.get(moduleId);
    if (!moduleConfig) {
      throw new Error(`Module ${moduleId} not found`);
    }

    // Check if module should be loaded
    if (!this.shouldLoadModule(moduleId)) {
      const loadedModule: LoadedModule = {
        id: moduleId,
        module: moduleConfig.fallback || null,
        loaded: false,
        error: new Error(`Module ${moduleId} is disabled by feature flag ${moduleConfig.featureFlag}`)
      };
      this.loadedModules.set(moduleId, loadedModule);
      return loadedModule;
    }

    // Start loading
    const loadPromise = this.performLoad(moduleId, moduleConfig);
    this.loadingPromises.set(moduleId, loadPromise);

    try {
      const result = await loadPromise;
      this.loadingPromises.delete(moduleId);
      return result;
    } catch (error) {
      this.loadingPromises.delete(moduleId);
      throw error;
    }
  }

  /**
   * Perform the actual module loading
   */
  private async performLoad(moduleId: string, module: ModuleConfig): Promise<LoadedModule> {
    const startTime = Date.now();

    try {
      const moduleExport = await module.loadFunction();
      const loadTime = Date.now() - startTime;

      const loadedModule: LoadedModule = {
        id: moduleId,
        module: moduleExport,
        loaded: true,
        loadTime
      };

      this.loadedModules.set(moduleId, loadedModule);
      return loadedModule;
    } catch (error) {
      const loadTime = Date.now() - startTime;
      
      const loadedModule: LoadedModule = {
        id: moduleId,
        module: module.fallback || null,
        loaded: false,
        error: error as Error,
        loadTime
      };

      this.loadedModules.set(moduleId, loadedModule);
      return loadedModule;
    }
  }

  /**
   * Load multiple modules
   */
  async loadModules(moduleIds: string[]): Promise<LoadedModule[]> {
    const promises = moduleIds.map(id => this.loadModule(id));
    return Promise.all(promises);
  }

  /**
   * Load all modules that should be loaded
   */
  async loadAllModules(): Promise<LoadedModule[]> {
    const moduleIds = Array.from(this.modules.keys()).filter(id => this.shouldLoadModule(id));
    return this.loadModules(moduleIds);
  }

  /**
   * Get a loaded module
   */
  getLoadedModule(moduleId: string): LoadedModule | undefined {
    return this.loadedModules.get(moduleId);
  }

  /**
   * Get all loaded modules
   */
  getAllLoadedModules(): Map<string, LoadedModule> {
    return new Map(this.loadedModules);
  }

  /**
   * Check if a module is loaded
   */
  isModuleLoaded(moduleId: string): boolean {
    const loadedModule = this.loadedModules.get(moduleId);
    return loadedModule?.loaded || false;
  }

  /**
   * Check if a module is loading
   */
  isModuleLoading(moduleId: string): boolean {
    return this.loadingPromises.has(moduleId);
  }

  /**
   * Unload a module
   */
  unloadModule(moduleId: string): boolean {
    return this.loadedModules.delete(moduleId);
  }

  /**
   * Unload all modules
   */
  unloadAllModules(): void {
    this.loadedModules.clear();
    this.loadingPromises.clear();
  }

  /**
   * Get module configuration
   */
  getModuleConfig(moduleId: string): ModuleConfig | undefined {
    return this.modules.get(moduleId);
  }

  /**
   * Get all module configurations
   */
  getAllModuleConfigs(): Map<string, ModuleConfig> {
    return new Map(this.modules);
  }

  /**
   * Get modules by category
   */
  getModulesByCategory(category: 'core' | 'optional' | 'experimental'): ModuleConfig[] {
    return Array.from(this.modules.values()).filter(module => {
      const flag = featureFlagManager.getFlag(module.featureFlag);
      return flag?.category === category;
    });
  }

  /**
   * Get system information
   */
  getSystemInfo(): {
    totalModules: number;
    loadedModules: number;
    loadingModules: number;
    failedModules: number;
    categories: Record<string, number>;
  } {
    const categories = {
      core: 0,
      optional: 0,
      experimental: 0
    };

    this.modules.forEach(module => {
      const flag = featureFlagManager.getFlag(module.featureFlag);
      if (flag) {
        categories[flag.category]++;
      }
    });

    const loadedModules = Array.from(this.loadedModules.values()).filter(m => m.loaded).length;
    const loadingModules = this.loadingPromises.size;
    const failedModules = Array.from(this.loadedModules.values()).filter(m => !m.loaded && m.error).length;

    return {
      totalModules: this.modules.size,
      loadedModules,
      loadingModules,
      failedModules,
      categories
    };
  }

  /**
   * Subscribe to module loading events
   */
  subscribe(listener: (event: 'module-loaded' | 'module-failed' | 'module-unloaded', moduleId: string) => void): () => void {
    // This would be implemented with an event system
    // For now, return a no-op unsubscribe function
    return () => {};
  }
}

// Create global instance
export const moduleLoader = new ModuleLoader();

// Export convenience functions
export const loadModule = (moduleId: string): Promise<LoadedModule> => 
  moduleLoader.loadModule(moduleId);

export const loadModules = (moduleIds: string[]): Promise<LoadedModule[]> => 
  moduleLoader.loadModules(moduleIds);

export const loadAllModules = (): Promise<LoadedModule[]> => 
  moduleLoader.loadAllModules();

export const getLoadedModule = (moduleId: string): LoadedModule | undefined => 
  moduleLoader.getLoadedModule(moduleId);

export const isModuleLoaded = (moduleId: string): boolean => 
  moduleLoader.isModuleLoaded(moduleId);

export const isModuleLoading = (moduleId: string): boolean => 
  moduleLoader.isModuleLoading(moduleId);

export const shouldLoadModule = (moduleId: string): boolean => 
  moduleLoader.shouldLoadModule(moduleId);

// Export for server-side usage
if (typeof window === 'undefined') {
  (global as any).moduleLoader = moduleLoader;
}
