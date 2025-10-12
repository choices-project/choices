/**
 * Feature Flags Store
 * 
 * Centralized Zustand store for feature flag management.
 * Replaces the complex useFeatureFlags hook system with a simpler,
 * more performant Zustand-based approach.
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { 
  FEATURE_FLAGS, 
  featureFlagManager,
  type FeatureFlag,
  type FeatureFlagKey,
  type FeatureFlagConfig,
  type FeatureFlagMetadata
} from '@/lib/core/feature-flags';

// ============================================================================
// TYPES
// ============================================================================

export interface FeatureFlagsStore {
  // State
  flags: Map<string, FeatureFlag>;
  enabledFlags: string[];
  disabledFlags: string[];
  categories: Record<string, string[]>;
  systemInfo: {
    totalFlags: number;
    enabledFlags: number;
    disabledFlags: number;
    environment: string;
    categories: Record<string, number>;
  };
  isLoading: boolean;
  error: string | null;
  
  // Actions
  enableFlag: (flagId: string) => boolean;
  disableFlag: (flagId: string) => boolean;
  toggleFlag: (flagId: string) => boolean;
  isEnabled: (flagId: string) => boolean;
  isDisabled: (flagId: string) => boolean;
  getFlag: (flagId: string) => FeatureFlag | undefined;
  getFlagsByCategory: (category: string) => FeatureFlag[];
  getEnabledFlags: () => FeatureFlag[];
  getDisabledFlags: () => FeatureFlag[];
  updateFlagMetadata: (flagId: string, metadata: FeatureFlagMetadata) => boolean;
  resetFlags: () => void;
  exportConfig: () => FeatureFlagConfig;
  importConfig: (config: FeatureFlagConfig) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Initialization
  initializeFlags: () => void;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useFeatureFlagsStore = create<FeatureFlagsStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial State
        flags: new Map(),
        enabledFlags: [],
        disabledFlags: [],
        categories: {},
        systemInfo: {
          totalFlags: 0,
          enabledFlags: 0,
          disabledFlags: 0,
          environment: process.env.NODE_ENV || 'development',
          categories: {}
        },
        isLoading: true,
        error: null,

        // Actions
        enableFlag: (flagId: string) => {
          const success = featureFlagManager.enable(flagId);
          if (success) {
            set((state) => {
              const flag = state.flags.get(flagId);
              if (flag) {
                flag.enabled = true;
                state.enabledFlags = Array.from(state.flags.values())
                  .filter(f => f.enabled)
                  .map(f => f.id);
                state.disabledFlags = Array.from(state.flags.values())
                  .filter(f => !f.enabled)
                  .map(f => f.id);
                state.systemInfo.enabledFlags = state.enabledFlags.length;
                state.systemInfo.disabledFlags = state.disabledFlags.length;
              }
            });
          }
          return success;
        },

        disableFlag: (flagId: string) => {
          const success = featureFlagManager.disable(flagId);
          if (success) {
            set((state) => {
              const flag = state.flags.get(flagId);
              if (flag) {
                flag.enabled = false;
                state.enabledFlags = Array.from(state.flags.values())
                  .filter(f => f.enabled)
                  .map(f => f.id);
                state.disabledFlags = Array.from(state.flags.values())
                  .filter(f => !f.enabled)
                  .map(f => f.id);
                state.systemInfo.enabledFlags = state.enabledFlags.length;
                state.systemInfo.disabledFlags = state.disabledFlags.length;
              }
            });
          }
          return success;
        },

        toggleFlag: (flagId: string) => {
          const success = featureFlagManager.toggle(flagId);
          if (success) {
            set((state) => {
              const flag = state.flags.get(flagId);
              if (flag) {
                flag.enabled = !flag.enabled;
                state.enabledFlags = Array.from(state.flags.values())
                  .filter(f => f.enabled)
                  .map(f => f.id);
                state.disabledFlags = Array.from(state.flags.values())
                  .filter(f => !f.enabled)
                  .map(f => f.id);
                state.systemInfo.enabledFlags = state.enabledFlags.length;
                state.systemInfo.disabledFlags = state.disabledFlags.length;
              }
            });
          }
          return success;
        },

        isEnabled: (flagId: string) => {
          return featureFlagManager.isEnabled(flagId);
        },

        isDisabled: (flagId: string) => {
          return !featureFlagManager.isEnabled(flagId);
        },

        getFlag: (flagId: string) => {
          return get().flags.get(flagId);
        },

        getFlagsByCategory: (category: string) => {
          return Array.from(get().flags.values())
            .filter(flag => flag.category === category);
        },

        getEnabledFlags: () => {
          return Array.from(get().flags.values())
            .filter(flag => flag.enabled);
        },

        getDisabledFlags: () => {
          return Array.from(get().flags.values())
            .filter(flag => !flag.enabled);
        },

        updateFlagMetadata: (flagId: string, metadata: FeatureFlagMetadata) => {
          const success = featureFlagManager.updateFlagMetadata(flagId, metadata);
          // Note: FeatureFlag type doesn't include metadata, so we just return success
          return success;
        },

        resetFlags: () => {
          featureFlagManager.reset();
          set((state) => {
            // Reset to default flags
            const defaultFlags = new Map();
            Object.entries(FEATURE_FLAGS).forEach(([key, enabled]) => {
              defaultFlags.set(key, {
                id: key,
                name: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
                enabled,
                description: `Feature flag for ${key.toLowerCase().replace(/_/g, ' ')}`,
                key: key as FeatureFlagKey,
                category: 'general'
              });
            });
            state.flags = defaultFlags;
            state.enabledFlags = Array.from(defaultFlags.values())
              .filter(f => f.enabled)
              .map(f => f.id);
            state.disabledFlags = Array.from(defaultFlags.values())
              .filter(f => !f.enabled)
              .map(f => f.id);
            state.systemInfo.enabledFlags = state.enabledFlags.length;
            state.systemInfo.disabledFlags = state.disabledFlags.length;
          });
        },

        exportConfig: () => {
          return featureFlagManager.exportConfig();
        },

        importConfig: (config: FeatureFlagConfig) => {
          featureFlagManager.importConfig(config);
          get().initializeFlags();
        },

        setLoading: (loading: boolean) => {
          set((state) => {
            state.isLoading = loading;
          });
        },

        setError: (error: string | null) => {
          set((state) => {
            state.error = error;
          });
        },

        clearError: () => {
          set((state) => {
            state.error = null;
          });
        },

        initializeFlags: () => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            // Get all flags from the feature flag manager
            const allFlags = featureFlagManager.getAllFlags();
            
            set((state) => {
              state.flags = allFlags;
              state.enabledFlags = Array.from(allFlags.values())
                .filter(f => f.enabled)
                .map(f => f.id);
              state.disabledFlags = Array.from(allFlags.values())
                .filter(f => !f.enabled)
                .map(f => f.id);
              
              // Update system info
              state.systemInfo.totalFlags = allFlags.size;
              state.systemInfo.enabledFlags = state.enabledFlags.length;
              state.systemInfo.disabledFlags = state.disabledFlags.length;
              
              // Categorize flags
              const categories: Record<string, string[]> = {};
              allFlags.forEach((flag) => {
                const category = flag.category || 'uncategorized';
                if (!categories[category]) {
                  categories[category] = [];
                }
                categories[category].push(flag.id);
              });
              state.categories = categories;
              state.systemInfo.categories = Object.fromEntries(
                Object.entries(categories).map(([cat, flags]) => [cat, flags.length])
              );
              
              state.isLoading = false;
            });

            // Subscribe to flag changes
            featureFlagManager.subscribe((flags) => {
              set((state) => {
                const flagMap = new Map();
                Object.entries(flags).forEach(([key, enabled]) => {
                  flagMap.set(key, {
                    id: key,
                    name: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
                    enabled,
                    description: `Feature flag for ${key.toLowerCase().replace(/_/g, ' ')}`,
                    key: key as FeatureFlagKey,
                    category: 'general'
                  });
                });
                state.flags = flagMap;
                state.enabledFlags = Array.from(flagMap.values())
                  .filter(f => f.enabled)
                  .map(f => f.id);
                state.disabledFlags = Array.from(flagMap.values())
                  .filter(f => !f.enabled)
                  .map(f => f.id);
                state.systemInfo.enabledFlags = state.enabledFlags.length;
                state.systemInfo.disabledFlags = state.disabledFlags.length;
              });
            });

          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to initialize feature flags';
              state.isLoading = false;
            });
          }
        }
      })),
      {
        name: 'feature-flags-storage',
        partialize: (state) => ({
          flags: Object.fromEntries(state.flags),
          enabledFlags: state.enabledFlags,
          disabledFlags: state.disabledFlags,
          categories: state.categories,
          systemInfo: state.systemInfo
        })
      }
    ),
    { name: 'feature-flags-store' }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

export const useFeatureFlags = () => useFeatureFlagsStore();
export const useFeatureFlag = (flagId: string) => useFeatureFlagsStore(state => state.flags.get(flagId));
export const useIsFeatureEnabled = (flagId: string) => useFeatureFlagsStore(state => state.isEnabled(flagId));
export const useIsFeatureDisabled = (flagId: string) => useFeatureFlagsStore(state => state.isDisabled(flagId));
export const useEnabledFlags = () => useFeatureFlagsStore(state => state.getEnabledFlags());
export const useDisabledFlags = () => useFeatureFlagsStore(state => state.getDisabledFlags());
export const useFlagsByCategory = (category: string) => useFeatureFlagsStore(state => state.getFlagsByCategory(category));
export const useFeatureFlagsLoading = () => useFeatureFlagsStore(state => state.isLoading);
export const useFeatureFlagsError = () => useFeatureFlagsStore(state => state.error);
export const useFeatureFlagsSystemInfo = () => useFeatureFlagsStore(state => state.systemInfo);

// ============================================================================
// ACTIONS
// ============================================================================

export const useFeatureFlagsActions = () => useFeatureFlagsStore(state => ({
  enableFlag: state.enableFlag,
  disableFlag: state.disableFlag,
  toggleFlag: state.toggleFlag,
  updateFlagMetadata: state.updateFlagMetadata,
  resetFlags: state.resetFlags,
  exportConfig: state.exportConfig,
  importConfig: state.importConfig,
  setLoading: state.setLoading,
  setError: state.setError,
  clearError: state.clearError,
  initializeFlags: state.initializeFlags
}));

// ============================================================================
// UTILITIES
// ============================================================================

export const useFeatureFlagWithDependencies = (flagId: string) => {
  const flag = useFeatureFlag(flagId);
  const isEnabled = useIsFeatureEnabled(flagId);
  const isLoading = useFeatureFlagsLoading();
  
  return {
    enabled: isEnabled,
    disabled: !isEnabled,
    dependenciesMet: true, // Simplified for now
    flag,
    loading: isLoading
  };
};

export const useFeatureFlagManagement = () => {
  const flags = useFeatureFlagsStore(state => state.flags);
  const systemInfo = useFeatureFlagsSystemInfo();
  const actions = useFeatureFlagsActions();
  const loading = useFeatureFlagsLoading();
  
  return {
    flags,
    systemInfo,
    updateFlagMetadata: actions.updateFlagMetadata,
    reset: actions.resetFlags,
    exportConfig: actions.exportConfig,
    importConfig: actions.importConfig,
    loading
  };
};
