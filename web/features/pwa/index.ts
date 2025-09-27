/**
 * PWA Feature Module
 * 
 * This module provides a graceful wrapper for PWA functionality,
 * allowing it to be disabled via feature flags while maintaining
 * a clean API for components that depend on it.
 */

import { isFeatureEnabled } from '@/lib/core/feature-flags';

// Re-export PWA utilities conditionally
export const getPWAUtils = () => {
  if (!isFeatureEnabled('pwa')) {
    return {
      isPwaSupported: () => false,
      canInstallPwa: () => false,
      installPwa: () => Promise.resolve(false),
      isOffline: () => false,
      registerServiceWorker: () => Promise.resolve(false),
      unregisterServiceWorker: () => Promise.resolve(false),
    };
  }
  
  // PWA utilities not implemented yet
  return Promise.resolve({
    isPwaSupported: () => false,
    canInstallPwa: () => false,
    installPwa: () => Promise.resolve(false),
    isOffline: () => false,
    registerServiceWorker: () => Promise.resolve(false),
    unregisterServiceWorker: () => Promise.resolve(false),
  });
};

// Re-export PWA components conditionally
export const getPWAComponents = () => {
  if (!isFeatureEnabled('pwa')) {
    return {
      InstallPrompt: () => null,
      OfflineIndicator: () => null,
      NotificationSettings: () => null,
    };
  }
  
  // Dynamically import PWA components only when feature is enabled
  return import('./components').then(module => module);
};

// Re-export PWA hooks conditionally
export const getPWAHooks = () => {
  if (!isFeatureEnabled('pwa')) {
    return {
      usePWAUtils: () => ({
        isPwaSupported: false,
        canInstallPwa: false,
        installPwa: () => Promise.resolve(false),
        isOffline: false,
      }),
    };
  }
  
  // Dynamically import PWA hooks only when feature is enabled
  return import('./hooks/usePWAUtils').then(module => module);
};

// Feature status
export const isPWAEnabled = () => isFeatureEnabled('pwa');

// Graceful fallbacks for disabled features
export const PWA_FALLBACKS = {
  isPwaSupported: false,
  canInstallPwa: false,
  installPwa: () => Promise.resolve(false),
  isOffline: false,
  registerServiceWorker: () => Promise.resolve(false),
  unregisterServiceWorker: () => Promise.resolve(false),
};
