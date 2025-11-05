/**
 * PWA Feature Exports
 * 
 * Feature exports for pwa functionality
 * Types are now centralized in /web/types/
 * 
 * Updated: October 26, 2025
 * Status: ✅ REFACTORED
 */

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
  
  // Use the superior implementation (moved from archive)
  return import('./lib/pwa-utils').then(module => ({
    isPwaSupported: () => 'serviceWorker' in navigator,
    canInstallPwa: () => module.pwaManager.isInstalled() === false && 'beforeinstallprompt' in window,
    installPwa: () => module.pwaManager.getPWAStatus().then(status => status.installable),
    isOffline: () => !navigator.onLine,
    registerServiceWorker: () => module.PWAUtils.registerServiceWorker(),
    /**
     * Unregisters all service workers and clears cache storage.
     * Returns false on error instead of throwing.
     * 
     * @returns True if unregistered successfully, false otherwise
     */
    unregisterServiceWorker: async () => {
      try {
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
          }
          // Clear caches
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
          }
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to unregister service worker:', error);
        return false;
      }
    },
    // Additional utilities from superior implementation
    pwaManager: module.pwaManager,
    pwaWebAuthn: module.pwaWebAuthn,
    privacyStorage: module.privacyStorage,
    PWAUtils: module.PWAUtils,
  }));
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
  
  // Use existing superior PWA components
  return Promise.resolve({
    InstallPrompt: () => import('@/features/pwa/components/PWAInstaller').then(m => m.default),
    OfflineIndicator: () => import('@/features/pwa/components/OfflineIndicator').then(m => m.default),
    NotificationSettings: () => import('@/features/pwa/components/NotificationSettings').then(m => m.default),
    NotificationPreferences: () => import('@/features/pwa/components/NotificationPreferences').then(m => m.default),
    PWAVotingInterface: () => import('@/features/pwa/components/PWAVotingInterface').then(m => m.PWAVotingInterface),
    PWAUserProfile: () => import('@/features/pwa/components/PWAUserProfile').then(m => m.PWAUserProfile),
    PWAIntegration: () => import('@/features/pwa/components/PWAIntegration').then(m => m.default),
  });
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
  
  // Use existing superior PWA hooks  
  return Promise.resolve({
    usePWAUtils: () => import('@/features/pwa/hooks/usePWAUtils').then(m => m.usePWAUtils),
  });
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
