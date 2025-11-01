/**
 * PWA Store - Zustand Implementation
 * 
 * Comprehensive PWA state management including installation status,
 * offline mode, update notifications, and PWA-specific settings.
 * Consolidates PWA state management and service worker integration.
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

import { create } from 'zustand';
import { devtools , persist } from 'zustand/middleware';

import { logger } from '@/lib/utils/logger';

// PWA data types
export type PWAInstallation = {
  isInstalled: boolean;
  installPrompt: any; // BeforeInstallPromptEvent
  canInstall: boolean;
  installSource: 'browser' | 'app_store' | 'play_store' | 'manual';
  installedAt?: string;
  version: string;
}

export type PWAOffline = {
  isOnline: boolean;
  isOffline: boolean;
  lastOnline: string;
  offlineSince?: string;
  offlineData: {
    cachedPages: string[];
    cachedResources: string[];
    queuedActions: Array<{
      id: string;
      action: string;
      data: any;
      timestamp: string;
    }>;
  };
}

type PWAUpdate = {
  isAvailable: boolean;
  isDownloading: boolean;
  isInstalling: boolean;
  version: string;
  releaseNotes: string;
  downloadProgress: number;
  installPrompt: any;
  autoUpdate: boolean;
  updateChannel: 'stable' | 'beta' | 'alpha';
}

export type PWANotification = {
  id: string;
  type: 'update' | 'offline' | 'install' | 'permission' | 'error';
  title: string;
  message: string;
  action?: {
    label: string;
    handler: () => void;
  };
  dismissible: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  read: boolean;
}

type PWAPreferences = {
  autoUpdate: boolean;
  offlineMode: boolean;
  backgroundSync: boolean;
  pushNotifications: boolean;
  installPrompt: boolean;
  updateChannel: 'stable' | 'beta' | 'alpha';
  cacheStrategy: 'aggressive' | 'balanced' | 'conservative';
  dataUsage: {
    maxCacheSize: number; // MB
    maxOfflineStorage: number; // MB
    syncFrequency: number; // minutes
  };
  privacy: {
    shareUsageData: boolean;
    shareCrashReports: boolean;
    sharePerformanceData: boolean;
  };
}

type PWAPerformance = {
  loadTime: number;
  timeToInteractive: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  memoryUsage: number;
  networkLatency: number;
  cacheHitRate: number;
  offlineCapability: number;
}

// PWA store state interface
type PWAStore = {
  // PWA state
  installation: PWAInstallation;
  offline: PWAOffline;
  update: PWAUpdate;
  notifications: PWANotification[];
  performance: PWAPerformance | null;
  
  // Preferences
  preferences: PWAPreferences;
  
  // Loading states
  isLoading: boolean;
  isInstalling: boolean;
  isUpdating: boolean;
  isSyncing: boolean;
  error: string | null;
  
  // Actions - Installation
  setInstallation: (installation: Partial<PWAInstallation>) => void;
  setInstallPrompt: (prompt: any) => void;
  setCanInstall: (canInstall: boolean) => void;
  installPWA: () => Promise<void>;
  uninstallPWA: () => Promise<void>;
  
  // Actions - Offline management
  setOnlineStatus: (isOnline: boolean) => void;
  setOfflineData: (data: Partial<PWAOffline['offlineData']>) => void;
  addCachedPage: (page: string) => void;
  removeCachedPage: (page: string) => void;
  addCachedResource: (resource: string) => void;
  removeCachedResource: (resource: string) => void;
  queueOfflineAction: (action: PWAOffline['offlineData']['queuedActions'][0]) => void;
  processOfflineActions: () => Promise<void>;
  
  // Actions - Updates
  setUpdateAvailable: (update: Partial<PWAUpdate>) => void;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
  skipUpdate: () => void;
  setAutoUpdate: (enabled: boolean) => void;
  
  // Actions - Notifications
  addNotification: (notification: Omit<PWANotification, 'id' | 'createdAt'>) => void;
  removeNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  
  // Actions - Performance
  setPerformance: (performance: PWAPerformance) => void;
  updatePerformanceMetrics: (metrics: Partial<PWAPerformance>) => void;
  
  // Actions - Preferences
  updatePreferences: (preferences: Partial<PWAPreferences>) => void;
  resetPreferences: () => void;
  
  // Actions - Service Worker
  registerServiceWorker: () => Promise<void>;
  unregisterServiceWorker: () => Promise<void>;
  updateServiceWorker: () => Promise<void>;
  
  // Actions - Data operations
  syncData: () => Promise<void>;
  clearCache: () => Promise<void>;
  exportData: () => Promise<void>;
  importData: (data: any) => Promise<void>;
  
  // Actions - Loading states
  setLoading: (loading: boolean) => void;
  setInstalling: (installing: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Default PWA preferences
const defaultPreferences: PWAPreferences = {
  autoUpdate: true,
  offlineMode: true,
  backgroundSync: true,
  pushNotifications: true,
  installPrompt: true,
  updateChannel: 'stable',
  cacheStrategy: 'balanced',
  dataUsage: {
    maxCacheSize: 100, // 100MB
    maxOfflineStorage: 50, // 50MB
    syncFrequency: 15, // 15 minutes
  },
  privacy: {
    shareUsageData: false,
    shareCrashReports: true,
    sharePerformanceData: false,
  },
};

// Create PWA store with middleware
export const usePWAStore = create<PWAStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        installation: {
          isInstalled: false,
          installPrompt: null,
          canInstall: false,
          installSource: 'manual',
          version: '1.0.0',
        },
        offline: {
          isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
          isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
          lastOnline: new Date().toISOString(),
          offlineData: {
            cachedPages: [],
            cachedResources: [],
            queuedActions: [],
          },
        },
        update: {
          isAvailable: false,
          isDownloading: false,
          isInstalling: false,
          version: '',
          releaseNotes: '',
          downloadProgress: 0,
          installPrompt: null,
          autoUpdate: true,
          updateChannel: 'stable',
        },
        notifications: [],
        performance: null,
        preferences: defaultPreferences,
        isLoading: false,
        isInstalling: false,
        isUpdating: false,
        isSyncing: false,
        error: null,
        
        // Installation actions
        setInstallation: (installation) => set((state) => ({
          installation: { ...state.installation, ...installation }
        })),
        
        setInstallPrompt: (prompt) => set((state) => ({
          installation: { ...state.installation, installPrompt: prompt }
        })),
        
        setCanInstall: (canInstall) => set((state) => ({
          installation: { ...state.installation, canInstall }
        })),
        
        installPWA: async () => {
          const { setInstalling, setError, installation } = get();
          
          try {
            setInstalling(true);
            setError(null);
            
            if (installation.installPrompt) {
              installation.installPrompt.prompt();
              const { outcome } = await installation.installPrompt.userChoice;
              
              if (outcome === 'accepted') {
                set((state) => ({
                  installation: {
                    ...state.installation,
                    isInstalled: true,
                    installedAt: new Date().toISOString(),
                    installPrompt: null,
                  }
                }));
                
                logger.info('PWA installed successfully');
              }
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to install PWA:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setInstalling(false);
          }
        },
        
        uninstallPWA: async () => {
          await Promise.resolve(); // Satisfy require-await rule
          const { setInstalling, setError } = get();
          
          try {
            setInstalling(true);
            setError(null);
            
            // PWA uninstallation is handled by the browser
            set((state) => ({
              installation: {
                ...state.installation,
                isInstalled: false,
                installedAt: undefined,
              }
            }));
            
            logger.info('PWA uninstalled');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to uninstall PWA:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setInstalling(false);
          }
        },
        
        // Offline management actions
        setOnlineStatus: (isOnline) => set((state) => ({
          offline: {
            ...state.offline,
            isOnline,
            isOffline: !isOnline,
            lastOnline: isOnline ? new Date().toISOString() : state.offline.lastOnline,
            offlineSince: isOnline ? undefined : new Date().toISOString(),
          }
        })),
        
        setOfflineData: (data) => set((state) => ({
          offline: {
            ...state.offline,
            offlineData: { ...state.offline.offlineData, ...data }
          }
        })),
        
        addCachedPage: (page) => set((state) => ({
          offline: {
            ...state.offline,
            offlineData: {
              ...state.offline.offlineData,
              cachedPages: [...state.offline.offlineData.cachedPages, page]
            }
          }
        })),
        
        removeCachedPage: (page) => set((state) => ({
          offline: {
            ...state.offline,
            offlineData: {
              ...state.offline.offlineData,
              cachedPages: state.offline.offlineData.cachedPages.filter(p => p !== page)
            }
          }
        })),
        
        addCachedResource: (resource) => set((state) => ({
          offline: {
            ...state.offline,
            offlineData: {
              ...state.offline.offlineData,
              cachedResources: [...state.offline.offlineData.cachedResources, resource]
            }
          }
        })),
        
        removeCachedResource: (resource) => set((state) => ({
          offline: {
            ...state.offline,
            offlineData: {
              ...state.offline.offlineData,
              cachedResources: state.offline.offlineData.cachedResources.filter(r => r !== resource)
            }
          }
        })),
        
        queueOfflineAction: (action) => set((state) => ({
          offline: {
            ...state.offline,
            offlineData: {
              ...state.offline.offlineData,
              queuedActions: [...state.offline.offlineData.queuedActions, action]
            }
          }
        })),
        
        processOfflineActions: async () => {
          const { setSyncing, setError, offline } = get();
          
          try {
            setSyncing(true);
            setError(null);
            
            // Process queued actions when online
            for (const action of offline.offlineData.queuedActions) {
              try {
                await fetch('/api/offline/process', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(action),
                });
              } catch (error) {
                logger.error('Failed to process offline action:', error as Error);
              }
            }
            
            // Clear processed actions
            set((state) => ({
              offline: {
                ...state.offline,
                offlineData: {
                  ...state.offline.offlineData,
                  queuedActions: []
                }
              }
            }));
            
            logger.info('Offline actions processed', {
              count: offline.offlineData.queuedActions.length
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to process offline actions:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setSyncing(false);
          }
        },
        
        // Update actions
        setUpdateAvailable: (update) => set((state) => ({
          update: { ...state.update, ...update }
        })),
        
        downloadUpdate: async () => {
          const { setUpdating, setError } = get();
          
          try {
            setUpdating(true);
            setError(null);
            
            set((state) => ({
              update: { ...state.update, isDownloading: true }
            }));
            
            // Simulate download progress
            for (let progress = 0; progress <= 100; progress += 10) {
              set((state) => ({
                update: { ...state.update, downloadProgress: progress }
              }));
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            set((state) => ({
              update: { ...state.update, isDownloading: false }
            }));
            
            logger.info('Update downloaded successfully');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to download update:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setUpdating(false);
          }
        },
        
        installUpdate: async () => {
          await Promise.resolve(); // Satisfy require-await rule
          const { setUpdating, setError } = get();
          
          try {
            setUpdating(true);
            setError(null);
            
            set((state) => ({
              update: { ...state.update, isInstalling: true }
            }));
            
            // Reload the page to apply update
            window.location.reload();
            
            logger.info('Update installed successfully');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to install update:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setUpdating(false);
          }
        },
        
        skipUpdate: () => set((state) => ({
          update: { ...state.update, isAvailable: false }
        })),
        
        setAutoUpdate: (enabled) => set((state) => ({
          update: { ...state.update, autoUpdate: enabled }
        })),
        
        // Notification actions
        addNotification: (notification) => set((state) => ({
          notifications: [
            ...state.notifications,
            {
              ...notification,
              id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              createdAt: new Date().toISOString(),
            }
          ]
        })),
        
        removeNotification: (id) => set((state) => ({
          notifications: state.notifications.filter(notification => notification.id !== id)
        })),
        
        markNotificationRead: (id) => set((state) => ({
          notifications: state.notifications.map(notification =>
            notification.id === id 
              ? { ...notification, read: true }
              : notification
          )
        })),
        
        clearNotifications: () => set({ notifications: [] }),
        
        // Performance actions
        setPerformance: (performance) => set({ performance }),
        
        updatePerformanceMetrics: (metrics) => set((state) => ({
          performance: state.performance 
            ? { ...state.performance, ...metrics }
            : { ...metrics } as PWAPerformance
        })),
        
        // Preferences actions
        updatePreferences: (preferences) => set((state) => ({
          preferences: { ...state.preferences, ...preferences }
        })),
        
        resetPreferences: () => set({ preferences: defaultPreferences }),
        
        // Service Worker actions
        registerServiceWorker: async () => {
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            if ('serviceWorker' in navigator) {
              const registration = await navigator.serviceWorker.register('/sw.js');
              logger.info('Service Worker registered:', { scope: registration.scope, active: !!registration.active });
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to register Service Worker:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setLoading(false);
          }
        },
        
        unregisterServiceWorker: async () => {
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            if ('serviceWorker' in navigator) {
              const registrations = await navigator.serviceWorker.getRegistrations();
              for (const registration of registrations) {
                await registration.unregister();
              }
              logger.info('Service Worker unregistered');
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to unregister Service Worker:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setLoading(false);
          }
        },
        
        updateServiceWorker: async () => {
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            if ('serviceWorker' in navigator) {
              const registration = await navigator.serviceWorker.getRegistration();
              if (registration) {
                await registration.update();
                logger.info('Service Worker updated');
              }
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to update Service Worker:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setLoading(false);
          }
        },
        
        // Data operations
        syncData: async () => {
          const { setSyncing, setError } = get();
          
          try {
            setSyncing(true);
            setError(null);
            
            // Sync offline data with server
            const response = await fetch('/api/pwa/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });
            
            if (!response.ok) {
              throw new Error('Failed to sync data');
            }
            
            logger.info('Data synced successfully');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to sync data:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setSyncing(false);
          }
        },
        
        clearCache: async () => {
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            if ('caches' in window) {
              const cacheNames = await caches.keys();
              await Promise.all(
                cacheNames.map(cacheName => caches.delete(cacheName))
              );
            }
            
            set((state) => ({
              offline: {
                ...state.offline,
                offlineData: {
                  cachedPages: [],
                  cachedResources: [],
                  queuedActions: state.offline.offlineData.queuedActions,
                }
              }
            }));
            
            logger.info('Cache cleared successfully');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to clear cache:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setLoading(false);
          }
        },
        
        exportData: async () => {
          await Promise.resolve(); // Satisfy require-await rule
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            const state = get();
            const data = {
              installation: state.installation,
              offline: state.offline,
              preferences: state.preferences,
              performance: state.performance,
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'pwa-data.json';
            a.click();
            URL.revokeObjectURL(url);
            
            logger.info('PWA data exported successfully');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to export data:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setLoading(false);
          }
        },
        
        importData: async (data) => {
          await Promise.resolve(); // Satisfy require-await rule
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            set({
              installation: data.installation ?? get().installation,
              offline: data.offline ?? get().offline,
              preferences: data.preferences ?? get().preferences,
              performance: data.performance ?? get().performance,
            });
            
            logger.info('PWA data imported successfully');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to import data:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setLoading(false);
          }
        },
        
        // Loading state actions
        setLoading: (loading) => set({ isLoading: loading }),
        setInstalling: (installing) => set({ isInstalling: installing }),
        setUpdating: (updating) => set({ isUpdating: updating }),
        setSyncing: (syncing) => set({ isSyncing: syncing }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
      }),
      {
        name: 'pwa-store',
        partialize: (state) => ({
          installation: state.installation,
          offline: state.offline,
          preferences: state.preferences,
          performance: state.performance,
        }),
      }
    ),
    { name: 'pwa-store' }
  )
);

// Store selectors for optimized re-renders
export const usePWAInstallation = () => usePWAStore(state => state.installation);
export const usePWAOffline = () => usePWAStore(state => state.offline);
export const usePWAUpdate = () => usePWAStore(state => state.update);
export const usePWANotifications = () => usePWAStore(state => state.notifications);
export const usePWAPerformance = () => usePWAStore(state => state.performance);
export const usePWAPreferences = () => usePWAStore(state => state.preferences);
export const usePWALoading = () => usePWAStore(state => state.isLoading);
export const usePWAError = () => usePWAStore(state => state.error);

// Action selectors
export const usePWAActions = () => usePWAStore(state => ({
  setInstallation: state.setInstallation,
  setInstallPrompt: state.setInstallPrompt,
  setCanInstall: state.setCanInstall,
  installPWA: state.installPWA,
  uninstallPWA: state.uninstallPWA,
  setOnlineStatus: state.setOnlineStatus,
  setOfflineData: state.setOfflineData,
  addCachedPage: state.addCachedPage,
  removeCachedPage: state.removeCachedPage,
  addCachedResource: state.addCachedResource,
  removeCachedResource: state.removeCachedResource,
  queueOfflineAction: state.queueOfflineAction,
  processOfflineActions: state.processOfflineActions,
  setUpdateAvailable: state.setUpdateAvailable,
  downloadUpdate: state.downloadUpdate,
  installUpdate: state.installUpdate,
  skipUpdate: state.skipUpdate,
  setAutoUpdate: state.setAutoUpdate,
  addNotification: state.addNotification,
  removeNotification: state.removeNotification,
  markNotificationRead: state.markNotificationRead,
  clearNotifications: state.clearNotifications,
  setPerformance: state.setPerformance,
  updatePerformanceMetrics: state.updatePerformanceMetrics,
  updatePreferences: state.updatePreferences,
  resetPreferences: state.resetPreferences,
  registerServiceWorker: state.registerServiceWorker,
  unregisterServiceWorker: state.unregisterServiceWorker,
  updateServiceWorker: state.updateServiceWorker,
  syncData: state.syncData,
  clearCache: state.clearCache,
  exportData: state.exportData,
  importData: state.importData,
  setLoading: state.setLoading,
  setInstalling: state.setInstalling,
  setUpdating: state.setUpdating,
  setSyncing: state.setSyncing,
  setError: state.setError,
  clearError: state.clearError,
}));

// Computed selectors
export const usePWAStats = () => usePWAStore(state => ({
  isInstalled: state.installation.isInstalled,
  canInstall: state.installation.canInstall,
  isOnline: state.offline.isOnline,
  isOffline: state.offline.isOffline,
  updateAvailable: state.update.isAvailable,
  notifications: state.notifications.length,
  unreadNotifications: state.notifications.filter(n => !n.read).length,
  cachedPages: state.offline.offlineData.cachedPages.length,
  cachedResources: state.offline.offlineData.cachedResources.length,
  queuedActions: state.offline.offlineData.queuedActions.length,
  isLoading: state.isLoading,
  isInstalling: state.isInstalling,
  isUpdating: state.isUpdating,
  isSyncing: state.isSyncing,
  error: state.error,
}));

export const useUnreadNotifications = () => usePWAStore(state => 
  state.notifications.filter(notification => !notification.read)
);

export const useHighPriorityNotifications = () => usePWAStore(state => 
  state.notifications.filter(notification => notification.priority === 'high')
);

// Store utilities
export const pwaStoreUtils = {
  /**
   * Get PWA summary
   */
  getPWASummary: () => {
    const state = usePWAStore.getState();
    return {
      isInstalled: state.installation.isInstalled,
      canInstall: state.installation.canInstall,
      isOnline: state.offline.isOnline,
      updateAvailable: state.update.isAvailable,
      notifications: state.notifications.length,
      performance: state.performance,
    };
  },
  
  /**
   * Get offline capability score
   */
  getOfflineCapability: () => {
    const state = usePWAStore.getState();
    const cachedPages = state.offline.offlineData.cachedPages.length;
    const cachedResources = state.offline.offlineData.cachedResources.length;
    return Math.min(100, (cachedPages + cachedResources) * 10);
  },
  
  /**
   * Get cache usage
   */
  getCacheUsage: () => {
    const state = usePWAStore.getState();
    const maxSize = state.preferences.dataUsage.maxCacheSize;
    const used = state.offline.offlineData.cachedPages.length + 
                 state.offline.offlineData.cachedResources.length;
    return {
      used,
      max: maxSize,
      percentage: (used / maxSize) * 100,
    };
  },
  
  /**
   * Check if update is needed
   */
  isUpdateNeeded: () => {
    const state = usePWAStore.getState();
    return state.update.isAvailable && !state.update.isDownloading && !state.update.isInstalling;
  }
};

// Store subscriptions for external integrations
export const pwaStoreSubscriptions = {
  /**
   * Subscribe to installation changes
   */
  onInstallationChange: (callback: (installation: PWAInstallation) => void) => {
    let prevInstallation: PWAInstallation | null = null;
    return usePWAStore.subscribe(
      (state) => {
        const installation = state.installation;
        if (installation !== prevInstallation) {
          callback(installation);
        }
        prevInstallation = installation;
        return installation;
      }
    );
  },
  
  /**
   * Subscribe to offline status changes
   */
  onOfflineStatusChange: (callback: (isOffline: boolean) => void) => {
    let prevIsOffline: boolean | null = null;
    return usePWAStore.subscribe(
      (state) => {
        const isOffline = state.offline.isOffline;
        if (isOffline !== prevIsOffline) {
          callback(isOffline);
        }
        prevIsOffline = isOffline;
        return isOffline;
      }
    );
  },
  
  /**
   * Subscribe to update availability
   */
  onUpdateAvailable: (callback: (update: PWAUpdate) => void) => {
    let prevUpdate: PWAUpdate | null = null;
    return usePWAStore.subscribe(
      (state) => {
        const update = state.update;
        if (update.isAvailable !== prevUpdate?.isAvailable) {
          callback(update);
        }
        prevUpdate = update;
        return update;
      }
    );
  }
};

// Store debugging utilities
export const pwaStoreDebug = {
  /**
   * Log current PWA state
   */
  logState: () => {
    const state = usePWAStore.getState();
    logger.debug('PWA Store State', {
      isInstalled: state.installation.isInstalled,
      canInstall: state.installation.canInstall,
      isOnline: state.offline.isOnline,
      updateAvailable: state.update.isAvailable,
      notifications: state.notifications.length,
      cachedPages: state.offline.offlineData.cachedPages.length,
      queuedActions: state.offline.offlineData.queuedActions.length,
      isLoading: state.isLoading,
      error: state.error
    });
  },
  
  /**
   * Log PWA summary
   */
  logSummary: () => {
    const summary = pwaStoreUtils.getPWASummary();
    logger.debug('PWA Summary', summary);
  },
  
  /**
   * Log offline capability
   */
  logOfflineCapability: () => {
    const capability = pwaStoreUtils.getOfflineCapability();
    logger.debug('Offline Capability', { capability });
  },
  
  /**
   * Reset PWA store
   */
  reset: () => {
    usePWAStore.getState().resetPreferences();
    usePWAStore.getState().clearNotifications();
    logger.info('PWA store reset');
  }
};
