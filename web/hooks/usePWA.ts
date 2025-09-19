/**
 * PWA Hook
 * 
 * Comprehensive hook that provides PWA functionality including
 * installation, offline status, service worker management, and notifications.
 */

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { isFeatureEnabled } from '@/lib/core/feature-flags';

// Import PWA managers
import { 
  serviceWorkerManager, 
  type ServiceWorkerStatus 
} from '@/lib/pwa/service-worker';
import { 
  pwaInstallationManager, 
  type InstallationStatus, 
  type InstallationResult 
} from '@/lib/pwa/installation';

export type PWAStatus = {
  // Feature availability
  isSupported: boolean;
  isEnabled: boolean;
  
  // Installation
  installation: InstallationStatus;
  
  // Service Worker
  serviceWorker: ServiceWorkerStatus;
  
  // Connection
  isOnline: boolean;
  
  // Offline data
  offlineVotes: number;
  hasOfflineData: boolean;
  
  // Notifications
  notificationsSupported: boolean;
  notificationsEnabled: boolean;
  notificationsPermission: NotificationPermission;
  
  // Loading states
  loading: boolean;
  error: string | null;
};

export type PWAActions = {
  // Installation
  promptInstallation: () => Promise<InstallationResult>;
  
  // Service Worker
  checkForUpdates: () => Promise<boolean>;
  skipWaiting: () => Promise<void>;
  
  // Offline
  syncOfflineData: () => Promise<void>;
  clearOfflineData: () => Promise<void>;
  
  // Notifications
  requestNotificationPermission: () => Promise<boolean>;
  subscribeToNotifications: () => Promise<boolean>;
  unsubscribeFromNotifications: () => Promise<boolean>;
  
  // Utility
  refresh: () => Promise<void>;
};

export function usePWA(): PWAStatus & PWAActions {
  const [status, setStatus] = useState<PWAStatus>({
    isSupported: false,
    isEnabled: false,
    installation: {
      isInstallable: false,
      isInstalled: false,
      canPrompt: false,
      platform: null,
      deferredPrompt: null
    },
    serviceWorker: {
      isSupported: false,
      isRegistered: false,
      isActive: false,
      isInstalling: false,
      isWaiting: false
    },
    isOnline: navigator.onLine,
    offlineVotes: 0,
    hasOfflineData: false,
    notificationsSupported: 'Notification' in window,
    notificationsEnabled: false,
    notificationsPermission: 'default',
    loading: true,
    error: null
  });

  // Initialize PWA
  const initializePWA = useCallback(async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }));

      // Check if PWA feature is enabled
      const pwaEnabled = isFeatureEnabled('PWA');
      if (!pwaEnabled) {
        setStatus(prev => ({
          ...prev,
          isEnabled: false,
          loading: false,
          error: 'PWA feature is disabled'
        }));
        return;
      }

      // Check basic support
      const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
      
      // Get installation status
      const installationStatus = pwaInstallationManager.getStatus();
      
      // Get service worker status
      const serviceWorkerStatus = await serviceWorkerManager.getStatus();
      
      // Check notification permission
      const notificationsPermission = 'Notification' in window 
        ? Notification.permission 
        : 'denied';
      
      // Get offline data status
      const offlineVotes = await getOfflineVotesCount();
      
      setStatus(prev => ({
        ...prev,
        isSupported,
        isEnabled: pwaEnabled,
        installation: installationStatus,
        serviceWorker: serviceWorkerStatus,
        notificationsPermission,
        notificationsEnabled: notificationsPermission === 'granted',
        offlineVotes,
        hasOfflineData: offlineVotes > 0,
        loading: false,
        error: null
      }));

    } catch (error) {
      logger.error('PWA: Initialization failed:', error);
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, []);

  // Prompt installation
  const promptInstallation = useCallback(async (): Promise<InstallationResult> => {
    try {
      const result = await pwaInstallationManager.promptInstallation();
      
      // Update status after installation attempt
      const installationStatus = pwaInstallationManager.getStatus();
      setStatus(prev => ({
        ...prev,
        installation: installationStatus
      }));
      
      return result;
    } catch (error) {
      logger.error('PWA: Installation prompt failed:', error);
      return {
        success: false,
        outcome: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, []);

  // Check for service worker updates
  const checkForUpdates = useCallback(async (): Promise<boolean> => {
    try {
      const hasUpdate = await serviceWorkerManager.checkForUpdates();
      
      // Update service worker status
      const serviceWorkerStatus = await serviceWorkerManager.getStatus();
      setStatus(prev => ({
        ...prev,
        serviceWorker: serviceWorkerStatus
      }));
      
      return hasUpdate;
    } catch (error) {
      logger.error('PWA: Failed to check for updates:', error);
      return false;
    }
  }, []);

  // Skip waiting for service worker
  const skipWaiting = useCallback(async (): Promise<void> => {
    try {
      await serviceWorkerManager.skipWaiting();
    } catch (error) {
      logger.error('PWA: Failed to skip waiting:', error);
      throw error;
    }
  }, []);

  // Sync offline data
  const syncOfflineData = useCallback(async (): Promise<void> => {
    try {
      // This would typically sync offline votes and other data
      logger.info('PWA: Syncing offline data...');
      
      // Update offline data count
      const offlineVotes = await getOfflineVotesCount();
      setStatus(prev => ({
        ...prev,
        offlineVotes,
        hasOfflineData: offlineVotes > 0
      }));
    } catch (error) {
      logger.error('PWA: Failed to sync offline data:', error);
      throw error;
    }
  }, []);

  // Clear offline data
  const clearOfflineData = useCallback(async (): Promise<void> => {
    try {
      // This would typically clear offline votes and other data
      logger.info('PWA: Clearing offline data...');
      
      setStatus(prev => ({
        ...prev,
        offlineVotes: 0,
        hasOfflineData: false
      }));
    } catch (error) {
      logger.error('PWA: Failed to clear offline data:', error);
      throw error;
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (!('Notification' in window)) {
        return false;
      }

      const permission = await Notification.requestPermission();
      const enabled = permission === 'granted';
      
      setStatus(prev => ({
        ...prev,
        notificationsPermission: permission,
        notificationsEnabled: enabled
      }));
      
      return enabled;
    } catch (error) {
      logger.error('PWA: Failed to request notification permission:', error);
      return false;
    }
  }, []);

  // Subscribe to notifications
  const subscribeToNotifications = useCallback(async (): Promise<boolean> => {
    try {
      if (!status.notificationsEnabled) {
        const enabled = await requestNotificationPermission();
        if (!enabled) {
          return false;
        }
      }

      // This would typically subscribe to push notifications
      logger.info('PWA: Subscribing to notifications...');
      
      return true;
    } catch (error) {
      logger.error('PWA: Failed to subscribe to notifications:', error);
      return false;
    }
  }, [status.notificationsEnabled, requestNotificationPermission]);

  // Unsubscribe from notifications
  const unsubscribeFromNotifications = useCallback(async (): Promise<boolean> => {
    try {
      // This would typically unsubscribe from push notifications
      logger.info('PWA: Unsubscribing from notifications...');
      
      setStatus(prev => ({
        ...prev,
        notificationsEnabled: false
      }));
      
      return true;
    } catch (error) {
      logger.error('PWA: Failed to unsubscribe from notifications:', error);
      return false;
    }
  }, []);

  // Refresh PWA status
  const refresh = useCallback(async (): Promise<void> => {
    await initializePWA();
  }, [initializePWA]);

  // Initialize on mount
  useEffect(() => {
    initializePWA();
  }, [initializePWA]);

  // Set up event listeners
  useEffect(() => {
    // Online/offline status
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      // Auto-sync when coming back online
      syncOfflineData().catch(error => {
        logger.error('PWA: Auto-sync failed:', error);
      });
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    // Installation status changes
    const unsubscribeInstallation = pwaInstallationManager.subscribe((installationStatus) => {
      setStatus(prev => ({ ...prev, installation: installationStatus }));
    });

    // Service worker status changes
    const unsubscribeServiceWorker = serviceWorkerManager.subscribe((serviceWorkerStatus) => {
      setStatus(prev => ({ ...prev, serviceWorker: serviceWorkerStatus }));
    });

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeInstallation();
      unsubscribeServiceWorker();
    };
  }, [syncOfflineData]);

  return {
    ...status,
    promptInstallation,
    checkForUpdates,
    skipWaiting,
    syncOfflineData,
    clearOfflineData,
    requestNotificationPermission,
    subscribeToNotifications,
    unsubscribeFromNotifications,
    refresh
  };
}

/**
 * Get offline votes count
 */
async function getOfflineVotesCount(): Promise<number> {
  try {
    // This would typically read from IndexedDB or localStorage
    // For now, return 0
    return 0;
  } catch (error) {
    logger.error('PWA: Failed to get offline votes count:', error);
    return 0;
  }
}
