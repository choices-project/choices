/**
 * PWA Feature Flags Hook
 * 
 * This module provides a React hook for PWA feature flags.
 */

import { useState, useEffect } from 'react';
import { isFeatureEnabled, featureFlagManager } from '@/lib/core/feature-flags';

export function useFeatureFlags() {
  const [flags, setFlags] = useState(() => featureFlagManager.all());

  useEffect(() => {
    // In a real app, you might want to listen for flag changes
    // For now, we'll just use the static flags
    setFlags(featureFlagManager.all());
  }, []);

  return {
    flags,
    isEnabled: isFeatureEnabled,
    getAllFlags: () => featureFlagManager.getAllFlags(),
    getEnabledFlags: () => featureFlagManager.getEnabledFlags(),
    getDisabledFlags: () => featureFlagManager.getDisabledFlags(),
    getFlagsByCategory: (category: string) => featureFlagManager.getFlagsByCategory(category),
    getSystemInfo: () => featureFlagManager.getSystemInfo(),
    areDependenciesEnabled: (flagId: string) => featureFlagManager.areDependenciesEnabled(flagId),
    subscribe: (callback: (flags: any) => void) => featureFlagManager.subscribe(callback)
  };
}







