/**
 * PWA Hook
 * 
 * Comprehensive hook that provides PWA functionality including
 * installation, offline status, service worker management, and notifications.
 */

import { useState, useEffect, useCallback } from 'react';

import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { 
  pwaInstallationManager, 
  type InstallationStatus, 
  type InstallationResult 
} from '@/lib/pwa/installation';
import { 
  serviceWorkerManager, 
  type ServiceWorkerStatus 
} from '@/lib/pwa/service-worker';
import { logger } from '@/lib/utils/logger';

// Import PWA managers

export interface PWAStatus {
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
}

export interface PWAActions {
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
}

export function usePWA(): PWAStatus & PWAActions {
  const [status, setStatus] = useState<PWAStatus>({
    isSupported: typeof window !== 'undefined' ? ('serviceWorker' in navigator && 'PushManager' in window) : false,
    isEnabled: isFeatureEnabled('PWA'),
    installation: {
      isInstallable: false,
      isInstalled: false,
      canPrompt: false,
      platform: null,
      deferredPrompt: null
    },
    serviceWorker: {
      isSupported: typeof window !== 'undefined' ? 'serviceWorker' in navigator : false,
      isRegistered: false,
      isActive: false,
      isInstalling: false,
      isWaiting: false
    },
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
    offlineVotes: 0,
    hasOfflineData: false,
    notificationsSupported: typeof window !== 'undefined' ? 'Notification' in window : false,
    notificationsEnabled: false,
    notificationsPermission: 'default',
    loading: true,
    error: null
  });

  // Initialize PWA
  const initializePWA = useCallback(async () => {
    try {
      logger.info('usePWA: Starting initialization...');
      setStatus(prev => ({ ...prev, loading: true, error: null }));

      // Check if PWA feature is enabled
      const pwaEnabled = isFeatureEnabled('PWA');
      logger.info('usePWA: PWA feature enabled:', { enabled: pwaEnabled });
      if (!pwaEnabled) {
        logger.info('usePWA: PWA feature is disabled, setting status');
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
      logger.info('usePWA: PWA support check:', {
        serviceWorker: 'serviceWorker' in navigator,
        pushManager: 'PushManager' in window,
        isSupported
      });
      
      // Get installation status
      const installationStatus = pwaInstallationManager.getStatus();
      
      // Register service worker if not already registered
      const serviceWorkerStatus = await serviceWorkerManager.register();
      
      // Check notification permission
      const notificationsPermission = 'Notification' in window 
        ? Notification.permission 
        : 'denied';
      
      // Get offline data status
      const offlineVotes = await getOfflineVotesCount();
      
      const finalStatus = {
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
      };
      
      logger.info('usePWA: Setting final status:', finalStatus);
      setStatus(prev => ({ ...prev, ...finalStatus }));

    } catch (error) {
      logger.error('PWA: Initialization failed:', error instanceof Error ? error : new Error('Unknown error'));
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
      logger.error('PWA: Installation prompt failed:', error instanceof Error ? error : new Error('Unknown error'));
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
      logger.error('PWA: Failed to check for updates:', error instanceof Error ? error : new Error('Unknown error'));
      return false;
    }
  }, []);

  // Skip waiting for service worker
  const skipWaiting = useCallback(async (): Promise<void> => {
    try {
      await serviceWorkerManager.skipWaiting();
    } catch (error) {
      logger.error('PWA: Failed to skip waiting:', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }, []);

  // Sync offline data
  const syncOfflineData = useCallback(async (): Promise<void> => {
    try {
      logger.info('PWA: Syncing offline data...');
      
      // Update offline data count
      const offlineVotes = await getOfflineVotesCount();
      setStatus(prev => ({
        ...prev,
        offlineVotes,
        hasOfflineData: offlineVotes > 0
      }));
    } catch (error) {
      logger.error('PWA: Failed to sync offline data:', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }, []);

  // Clear offline data
  const clearOfflineData = useCallback(async (): Promise<void> => {
    try {
      logger.info('PWA: Clearing offline data...');
      
      setStatus(prev => ({
        ...prev,
        offlineVotes: 0,
        hasOfflineData: false
      }));
    } catch (error) {
      logger.error('PWA: Failed to clear offline data:', error instanceof Error ? error : new Error('Unknown error'));
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
      logger.error('PWA: Failed to request notification permission:', error instanceof Error ? error : new Error('Unknown error'));
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

      logger.info('PWA: Subscribing to notifications...');
      
      return true;
    } catch (error) {
      logger.error('PWA: Failed to subscribe to notifications:', error instanceof Error ? error : new Error('Unknown error'));
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
      logger.error('PWA: Failed to unsubscribe from notifications:', error instanceof Error ? error : new Error('Unknown error'));
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
        logger.error('PWA: Auto-sync failed:', error instanceof Error ? error : new Error('Unknown error'));
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

    // Add event listeners (only on client side)
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    // Cleanup
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
      unsubscribeInstallation();
      unsubscribeServiceWorker();
    };
  }, [syncOfflineData]);

  return Object.assign({}, status, {
    promptInstallation,
    checkForUpdates,
    skipWaiting,
    syncOfflineData,
    clearOfflineData,
    requestNotificationPermission,
    subscribeToNotifications,
    unsubscribeFromNotifications,
    refresh
  });
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
    logger.error('PWA: Failed to get offline votes count:', error instanceof Error ? error : new Error('Unknown error'));
    return 0;
  }
}
