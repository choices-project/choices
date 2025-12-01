/**
 * Feature Flags Hook
 * 
 * Enhanced React hook for feature flags with Zustand integration and API support.
 * Integrates with existing appStore and provides real-time updates.
 */

import { useState, useEffect, useCallback } from 'react';

import { featureFlagManager } from '@/lib/core/feature-flags';
import { useAppActions, useAppFeatureFlags } from '@/lib/stores/appStore';

const _IS_E2E_HARNESS = process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1';

export function useFeatureFlags() {
  const features = useAppFeatureFlags();
  const { setFeatureFlag, toggleFeatureFlag, setFeatureFlags } = useAppActions();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch flags from API and sync with appStore
  const fetchFlags = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/feature-flags');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update appStore with fetched flags
        const flagUpdates: Record<string, boolean> = {};
        Object.entries(data.flags).forEach(([key, value]) => {
          flagUpdates[key] = value as boolean;
        });
        
        setFeatureFlags(flagUpdates);
      } else {
        throw new Error(data.error || 'Failed to fetch feature flags');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      // Silently fail - feature flags are non-critical
    } finally {
      setIsLoading(false);
    }
  }, [setFeatureFlags]);

  // Auto-fetch flags on mount
  useEffect(() => {
    void fetchFlags();
  }, [fetchFlags]);

  return {
    // State
    flags: features,
    isLoading,
    error,
    
    // Actions
    fetchFlags,
    setFeatureFlag,
    toggleFeatureFlag,
    clearError: () => setError(null),
    
        // Utilities
        isEnabled: (flagId: string) => features[flagId] ?? false,
        getAllFlags: () => featureFlagManager.getAllFlags(),
        getEnabledFlags: () => featureFlagManager.getEnabledFlags(),
        getDisabledFlags: () => featureFlagManager.getDisabledFlags(),
        getFlagsByCategory: (category: string) => featureFlagManager.getFlagsByCategory(category),
        getSystemInfo: () => featureFlagManager.getSystemInfo(),
        systemInfo: featureFlagManager.getSystemInfo(),
        areDependenciesEnabled: (flagId: string) => featureFlagManager.areDependenciesEnabled(flagId),
        subscribe: (callback: (flags: Record<string, boolean>) => void) => featureFlagManager.subscribe(callback)
  };
}

// Convenience hook for single flag
export function useFeatureFlag(flagId: string) {
  const { isEnabled, isLoading } = useFeatureFlags();
  return {
    enabled: isEnabled(flagId),
    disabled: !isEnabled(flagId),
    loading: isLoading
  };
}

// Hook for batch flag checking
export function useFeatureFlagsBatch(flagIds: string[]) {
  const { isEnabled, isLoading } = useFeatureFlags();
  
  const flags = flagIds.reduce((acc, flagId) => {
    acc[flagId] = isEnabled(flagId);
    return acc;
  }, {} as Record<string, boolean>);
  
  const allEnabled = flagIds.every(flagId => isEnabled(flagId));
  const anyEnabled = flagIds.some(flagId => isEnabled(flagId));
  
  return {
    flags,
    allEnabled,
    anyEnabled,
    allDisabled: !anyEnabled,
    loading: isLoading
  };
}

// Hook for feature flag with dependencies
export function useFeatureFlagWithDependencies(flagId: string) {
  const { isEnabled, areDependenciesEnabled, isLoading } = useFeatureFlags();
  
  return {
    enabled: isEnabled(flagId),
    disabled: !isEnabled(flagId),
    dependenciesMet: areDependenciesEnabled(flagId),
    loading: isLoading
  };
}
















