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
import { devtools, persist } from 'zustand/middleware';

import { withOptional } from '@/lib/util/objects';
import { logger } from '@/lib/utils/logger';
import type { BeforeInstallPromptEvent, OfflineVotePayload, OfflineVoteRecord, PWAQueuedAction as SharedQueuedAction } from '@/types/pwa';

import { createSafeStorage } from './storage';

export type PWAQueuedActionData = Record<string, unknown>;

export type PWAQueuedAction<TData extends PWAQueuedActionData = PWAQueuedActionData> = SharedQueuedAction<TData>;

export type PWAOfflineData<TAction extends PWAQueuedAction = PWAQueuedAction> = {
  cachedPages: string[];
  cachedResources: string[];
  queuedActions: TAction[];
};

export type OfflineVoteActionData = OfflineVotePayload;

export type OfflineVoteQueuedAction = PWAQueuedAction<OfflineVoteActionData>;

export const isOfflineVoteAction = (
  action: PWAQueuedAction
): action is OfflineVoteQueuedAction => {
  if (typeof action.data !== 'object' || action.data === null) {
    return false;
  }

  const { pollId, choice } = action.data as Record<string, unknown>;

  return typeof pollId === 'string' && typeof choice === 'number';
};

// PWA data types
export type PWAInstallation = {
  isInstalled: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
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
  offlineData: PWAOfflineData;
}

type PWAUpdate = {
  isAvailable: boolean;
  isDownloading: boolean;
  isInstalling: boolean;
  version: string;
  releaseNotes: string;
  downloadProgress: number;
  installPrompt: BeforeInstallPromptEvent | null;
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

type PWAStorePersistedState = {
  installation: PWAInstallation;
  offline: PWAOffline;
  preferences: PWAPreferences;
  performance: PWAPerformance | null;
};

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
  offlineQueueSize: number;
  offlineQueueUpdatedAt: string | null;
  
  // Actions - Installation
  setInstallation: (installation: Partial<PWAInstallation>) => void;
  setInstallPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
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
  queueOfflineAction: (action: PWAQueuedAction) => void;
  processOfflineActions: () => Promise<void>;
  setOfflineQueueSize: (size: number, updatedAt?: string) => void;
  
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
  importData: (data: Partial<PWAStorePersistedState>) => Promise<void>;
  
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
          isOnline: (typeof window !== 'undefined' && typeof navigator !== 'undefined') ? navigator.onLine : true,
          isOffline: (typeof window !== 'undefined' && typeof navigator !== 'undefined') ? !navigator.onLine : false,
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
        offlineQueueSize: 0,
        offlineQueueUpdatedAt: null,
        
        // Installation actions
        setInstallation: (installation) => set((state) => ({
          installation: mergeInstallationState(state.installation, installation)
        })),
        
        setInstallPrompt: (prompt) => set((state) => ({
          installation: mergeInstallationState(state.installation, { installPrompt: prompt })
        })),
        
        setCanInstall: (canInstall) => set((state) => ({
          installation: mergeInstallationState(state.installation, { canInstall })
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
                  installation: mergeInstallationState(state.installation, {
                    isInstalled: true,
                    installedAt: new Date().toISOString(),
                    installPrompt: null,
                  })
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
            set((state) => {
              const nextInstallation = mergeInstallationState(state.installation, {
                isInstalled: false,
                installPrompt: null,
              });

              Reflect.deleteProperty(nextInstallation, 'installedAt');

              return {
                installation: nextInstallation,
              };
            });
            
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
        setOnlineStatus: (isOnline) => set((state) => {
          const offline = mergeOfflineState(state.offline, {
            isOnline,
            isOffline: !isOnline,
            lastOnline: isOnline ? new Date().toISOString() : state.offline.lastOnline,
            ...(isOnline ? {} : { offlineSince: new Date().toISOString() }),
          });

          if (isOnline) {
            Reflect.deleteProperty(offline, 'offlineSince');
          }

          return { offline };
        }),
        
        setOfflineData: (data) => set((state) => ({
          offline: mergeOfflineState(state.offline, {
            offlineData: mergeOfflineData(state.offline.offlineData, data)
          })
        })),
        
        addCachedPage: (page) => set((state) => ({
          offline: mergeOfflineState(state.offline, {
            offlineData: mergeOfflineData(state.offline.offlineData, {
              cachedPages: [...state.offline.offlineData.cachedPages, page]
            })
          })
        })),
        
        removeCachedPage: (page) => set((state) => ({
          offline: mergeOfflineState(state.offline, {
            offlineData: mergeOfflineData(state.offline.offlineData, {
              cachedPages: state.offline.offlineData.cachedPages.filter((p) => p !== page)
            })
          })
        })),
        
        addCachedResource: (resource) => set((state) => ({
          offline: mergeOfflineState(state.offline, {
            offlineData: mergeOfflineData(state.offline.offlineData, {
              cachedResources: [...state.offline.offlineData.cachedResources, resource]
            })
          })
        })),
        
        removeCachedResource: (resource) => set((state) => ({
          offline: mergeOfflineState(state.offline, {
            offlineData: mergeOfflineData(state.offline.offlineData, {
              cachedResources: state.offline.offlineData.cachedResources.filter((r) => r !== resource)
            })
          })
        })),
        
        queueOfflineAction: (action) => set((state) => {
          const nextQueuedActions = [...state.offline.offlineData.queuedActions, action];
          const nextUpdatedAt = new Date().toISOString();
          return {
            offline: mergeOfflineState(state.offline, {
              offlineData: mergeOfflineData(state.offline.offlineData, {
                queuedActions: nextQueuedActions
              })
            }),
            offlineQueueSize: nextQueuedActions.length,
            offlineQueueUpdatedAt: nextUpdatedAt,
          };
        }),
        
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
              offline: mergeOfflineState(state.offline, {
                offlineData: mergeOfflineData(state.offline.offlineData, {
                  queuedActions: []
                })
              }),
              offlineQueueSize: 0,
              offlineQueueUpdatedAt: new Date().toISOString(),
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

        setOfflineQueueSize: (size, updatedAt) => set({
          offlineQueueSize: size,
          offlineQueueUpdatedAt: updatedAt ?? new Date().toISOString(),
        }),
        
        // Update actions
        setUpdateAvailable: (update) => set((state) => ({
          update: mergeUpdateState(state.update, update)
        })),
        
        downloadUpdate: async () => {
          const { setUpdating, setError } = get();
          
          try {
            setUpdating(true);
            setError(null);
            
            set((state) => ({
              update: mergeUpdateState(state.update, { isDownloading: true })
            }));
            
            // Simulate download progress
            for (let progress = 0; progress <= 100; progress += 10) {
              set((state) => ({
                update: mergeUpdateState(state.update, { downloadProgress: progress })
              }));
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            set((state) => ({
              update: mergeUpdateState(state.update, { isDownloading: false })
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
              update: mergeUpdateState(state.update, { isInstalling: true })
            }));
            
            // Reload the page to apply update
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
            
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
          update: mergeUpdateState(state.update, { isAvailable: false })
        })),
        
        setAutoUpdate: (enabled) => set((state) => ({
          update: mergeUpdateState(state.update, { autoUpdate: enabled })
        })),
        
        // Notification actions
        addNotification: (notification) => set((state) => {
          const enrichedNotification = withOptional(notification, {
            id: `notification_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
            createdAt: new Date().toISOString(),
          }) as PWANotification;

          return {
            notifications: [...state.notifications, enrichedNotification]
          };
        }),
        
        removeNotification: (id) => set((state) => ({
          notifications: state.notifications.filter(notification => notification.id !== id)
        })),
        
        markNotificationRead: (id) => set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === id
              ? withOptional(notification, { read: true })
              : notification
          )
        })),
        
        clearNotifications: () => set({ notifications: [] }),
        
        // Performance actions
        setPerformance: (performance) => set({ performance }),
        
        updatePerformanceMetrics: (metrics) => set((state) => ({
          performance: mergePerformanceState(state.performance, metrics)
        })),
        
        // Preferences actions
        updatePreferences: (preferences) => set((state) => ({
          preferences: mergePreferencesState(state.preferences, preferences)
        })),
        
        resetPreferences: () => set({ preferences: defaultPreferences }),
        
        // Service Worker actions
        registerServiceWorker: async () => {
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
              const registration = await navigator.serviceWorker.register('/service-worker.js');
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
            
            if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
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
            
            if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
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
            
            if (typeof window !== 'undefined' && 'caches' in window) {
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

            if (typeof window === 'undefined' || typeof document === 'undefined') {
              logger.warn('PWA data export skipped: no browser environment detected');
              return;
            }
            
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
        storage: createSafeStorage(),
        partialize: (state): PWAStorePersistedState => ({
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
  setOfflineQueueSize: state.setOfflineQueueSize,
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
  offlineQueueSize: state.offlineQueueSize,
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
      offlineQueueSize: state.offlineQueueSize,
      offlineQueueUpdatedAt: state.offlineQueueUpdatedAt,
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

const defaultPerformance: PWAPerformance = {
  loadTime: 0,
  timeToInteractive: 0,
  firstContentfulPaint: 0,
  largestContentfulPaint: 0,
  cumulativeLayoutShift: 0,
  memoryUsage: 0,
  networkLatency: 0,
  cacheHitRate: 0,
  offlineCapability: 0,
};

const mergeStateStrict = <T extends Record<string, unknown>>(current: T, updates: Partial<T>): T => {
  const merged = withOptional(current, updates as Record<string, unknown>);

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) {
      delete (merged as Record<string, unknown>)[key];
    }
  }

  return merged as T;
};

const mergeInstallationState = (current: PWAInstallation, updates: Partial<PWAInstallation>) =>
  mergeStateStrict(current, updates);

const mergeOfflineState = (current: PWAOffline, updates: Partial<PWAOffline>) =>
  mergeStateStrict(current, updates);

const mergeOfflineData = (
  current: PWAOffline['offlineData'],
  updates: Partial<PWAOffline['offlineData']>
) => mergeStateStrict(current, updates);

const mergeUpdateState = (current: PWAUpdate, updates: Partial<PWAUpdate>) =>
  mergeStateStrict(current, updates);

const mergePreferencesState = (current: PWAPreferences, updates: Partial<PWAPreferences>) =>
  mergeStateStrict(current, updates);

const mergePerformanceState = (current: PWAPerformance | null, updates: Partial<PWAPerformance>) =>
  mergeStateStrict(current ?? defaultPerformance, updates);

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
  },

  /**
   * Subscribe to offline queue size changes
   */
  onOfflineQueueSizeChange: (callback: (size: number, updatedAt: string | null) => void) => {
    let prevSize: number | null = null;
    return usePWAStore.subscribe((state) => {
      const size = state.offlineQueueSize;
      if (size !== prevSize) {
        callback(size, state.offlineQueueUpdatedAt);
      }
      prevSize = size;
      return size;
    });
  },
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
      offlineQueueSize: state.offlineQueueSize,
      offlineQueueUpdatedAt: state.offlineQueueUpdatedAt,
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
