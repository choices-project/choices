/**
 * React Hook for Feature Flags
 * 
 * Provides easy access to feature flags in React components with automatic
 * re-rendering when flags change.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

import type { 
  FeatureFlag, 
  FeatureFlagManager,
  FeatureFlagConfig} from '@/lib/core/feature-flags';
import { 
  featureFlagManager,
  isFeatureEnabled as _isFeatureEnabled,
  enableFeature as _enableFeature,
  disableFeature as _disableFeature,
  toggleFeature as _toggleFeature,
  getFeatureFlag as _getFeatureFlag,
  getAllFeatureFlags as _getAllFeatureFlags
} from '@/lib/core/feature-flags';

export type UseFeatureFlagsReturn = {
  // Flag checking
  isEnabled: (flagId: string) => boolean;
  isDisabled: (flagId: string) => boolean;
  
  // Flag management
  enable: (flagId: string) => boolean;
  disable: (flagId: string) => boolean;
  toggle: (flagId: string) => boolean;
  
  // Flag data
  getFlag: (flagId: string) => FeatureFlag | undefined;
  getAllFlags: () => Map<string, FeatureFlag>;
  getEnabledFlags: () => FeatureFlag[];
  getDisabledFlags: () => FeatureFlag[];
  getFlagsByCategory: (category: 'core' | 'optional' | 'experimental') => FeatureFlag[];
  
  // System info
  systemInfo: {
    totalFlags: number;
    enabledFlags: number;
    disabledFlags: number;
    environment: string;
    categories: Record<string, number>;
  };
  
  // Loading state
  loading: boolean;
  
  // Manager instance
  manager: FeatureFlagManager;
}

/**
 * Main hook for feature flags
 */
export function useFeatureFlags(): UseFeatureFlagsReturn {
  const [, setFlags] = useState<Map<string, FeatureFlag>>(new Map());
  const [loading, setLoading] = useState(true);

  // Initialize flags on mount
  useEffect(() => {
    setFlags(featureFlagManager.getAllFlags());
    setLoading(false);

    // Subscribe to flag changes
    const subscription = featureFlagManager.subscribe((newFlags) => {
      setFlags(new Map(Object.entries(newFlags).map(([key, enabled]) => [key, {
        id: key,
        name: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        enabled,
        description: `Feature flag for ${key.toLowerCase().replace(/_/g, ' ')}`
      }])));
    });

    return subscription.unsubscribe;
  }, []);

  // Memoized functions to prevent unnecessary re-renders
  const isEnabled = useCallback((flagId: string): boolean => {
    return featureFlagManager.isEnabled(flagId);
  }, []);

  const isDisabled = useCallback((flagId: string): boolean => {
    return !featureFlagManager.isEnabled(flagId);
  }, []);

  const enable = useCallback((flagId: string): boolean => {
    return featureFlagManager.enable(flagId);
  }, []);

  const disable = useCallback((flagId: string): boolean => {
    return featureFlagManager.disable(flagId);
  }, []);

  const toggle = useCallback((flagId: string): boolean => {
    return featureFlagManager.toggle(flagId);
  }, []);

  const getFlag = useCallback((flagId: string): FeatureFlag | undefined => {
    return featureFlagManager.getFlag(flagId) ?? undefined;
  }, []);

  const getAllFlags = useCallback((): Map<string, FeatureFlag> => {
    return featureFlagManager.getAllFlags();
  }, []);

  const getEnabledFlags = useCallback((): FeatureFlag[] => {
    return featureFlagManager.getEnabledFlags();
  }, []);

  const getDisabledFlags = useCallback((): FeatureFlag[] => {
    return featureFlagManager.getDisabledFlags();
  }, []);

  const getFlagsByCategory = useCallback((category: 'core' | 'optional' | 'experimental'): FeatureFlag[] => {
    return featureFlagManager.getFlagsByCategory(category);
  }, []);

  const systemInfo = useMemo(() => {
    return featureFlagManager.getSystemInfo();
  }, []);

  return {
    isEnabled,
    isDisabled,
    enable,
    disable,
    toggle,
    getFlag,
    getAllFlags,
    getEnabledFlags,
    getDisabledFlags,
    getFlagsByCategory,
    systemInfo,
    loading,
    manager: featureFlagManager
  };
}

/**
 * Hook for checking a specific feature flag
 */
export function useFeatureFlag(flagId: string): {
  enabled: boolean;
  disabled: boolean;
  flag: FeatureFlag | undefined;
  toggle: () => boolean;
  enable: () => boolean;
  disable: () => boolean;
  loading: boolean;
} {
  const { isEnabled, isDisabled, toggle, enable, disable, getFlag, loading } = useFeatureFlags();
  
  const enabled = isEnabled(flagId);
  const disabled = isDisabled(flagId);
  const flag = getFlag(flagId);

  const handleToggle = useCallback(() => toggle(flagId), [toggle, flagId]);
  const handleEnable = useCallback(() => enable(flagId), [enable, flagId]);
  const handleDisable = useCallback(() => disable(flagId), [disable, flagId]);

  return {
    enabled,
    disabled,
    flag,
    toggle: handleToggle,
    enable: handleEnable,
    disable: handleDisable,
    loading
  };
}

/**
 * Hook for checking multiple feature flags at once
 */
export function useFeatureFlagsBatch(flagIds: string[]): {
  enabled: Record<string, boolean>;
  disabled: Record<string, boolean>;
  allEnabled: boolean;
  anyEnabled: boolean;
  loading: boolean;
} {
  const { isEnabled, isDisabled, loading } = useFeatureFlags();
  
  const enabled = useMemo(() => {
    const result: Record<string, boolean> = {};
    flagIds.forEach(id => {
      result[id] = isEnabled(id);
    });
    return result;
  }, [flagIds, isEnabled]);

  const disabled = useMemo(() => {
    const result: Record<string, boolean> = {};
    flagIds.forEach(id => {
      result[id] = isDisabled(id);
    });
    return result;
  }, [flagIds, isDisabled]);

  const allEnabled = useMemo(() => {
    return flagIds.every(id => enabled[id]);
  }, [flagIds, enabled]);

  const anyEnabled = useMemo(() => {
    return flagIds.some(id => enabled[id]);
  }, [flagIds, enabled]);

  return {
    enabled,
    disabled,
    allEnabled,
    anyEnabled,
    loading
  };
}

/**
 * Hook for feature flags with dependencies
 */
export function useFeatureFlagWithDependencies(flagId: string): {
  enabled: boolean;
  disabled: boolean;
  dependenciesMet: boolean;
  flag: FeatureFlag | undefined;
  loading: boolean;
} {
  const { isEnabled, isDisabled, getFlag, loading } = useFeatureFlags();
  
  const enabled = isEnabled(flagId);
  const disabled = isDisabled(flagId);
  const flag = getFlag(flagId);
  
  const dependenciesMet = useMemo(() => {
    return featureFlagManager.areDependenciesEnabled(flagId);
  }, [flagId]);

  return {
    enabled,
    disabled,
    dependenciesMet,
    flag,
    loading
  };
}

/**
 * Hook for admin/management features
 */
export function useFeatureFlagManagement(): {
  flags: Map<string, FeatureFlag>;
  systemInfo: {
    totalFlags: number;
    enabledFlags: number;
    disabledFlags: number;
    environment: string;
    categories: Record<string, number>;
  };
  updateFlagMetadata: (flagId: string, metadata: Record<string, unknown>) => boolean;
  reset: () => void;
  exportConfig: () => Record<string, unknown>;
  importConfig: (config: FeatureFlagConfig) => void;
  loading: boolean;
} {
  const { getAllFlags, systemInfo, loading, manager } = useFeatureFlags();
  
  const flags = getAllFlags();
  
  const updateFlagMetadata = useCallback((flagId: string, metadata: Record<string, any>) => {
    return manager.updateFlagMetadata(flagId, metadata);
  }, [manager]);

  const reset = useCallback(() => {
    manager.reset();
  }, [manager]);

  const exportConfig = useCallback(() => {
    return manager.exportConfig();
  }, [manager]);

  const importConfig = useCallback((config: FeatureFlagConfig) => {
    manager.importConfig(config);
  }, [manager]);

  return {
    flags,
    systemInfo,
    updateFlagMetadata,
    reset,
    exportConfig,
    importConfig,
    loading
  };
}

// Export convenience functions for non-hook usage
export const isFeatureEnabled = _isFeatureEnabled;
export const enableFeature = _enableFeature;
export const disableFeature = _disableFeature;
export const toggleFeature = _toggleFeature;
export const getFeatureFlag = _getFeatureFlag;
export const getAllFeatureFlags = _getAllFeatureFlags;
