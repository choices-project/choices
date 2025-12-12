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
import { immer } from 'zustand/middleware/immer';

import { logger } from '@/lib/utils/logger';


import { createBaseStoreActions } from './baseStoreActions';
import { createSafeStorage } from './storage';

import type { BaseStore } from './types';
import type { BeforeInstallPromptEvent, OfflineVotePayload, PWAQueuedAction as SharedQueuedAction } from '@/types/pwa';
import type { StateCreator } from 'zustand';

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

export type PWAState = {
  installation: PWAInstallation;
  offline: PWAOffline;
  update: PWAUpdate;
  notifications: PWANotification[];
  performance: PWAPerformance | null;
  preferences: PWAPreferences;
  isLoading: boolean;
  isInstalling: boolean;
  isUpdating: boolean;
  isSyncing: boolean;
  error: string | null;
  offlineQueueSize: number;
  offlineQueueUpdatedAt: string | null;
};

export type PWAActions = Pick<BaseStore, 'setLoading' | 'setError' | 'clearError'> & {
  setInstallation: (installation: Partial<PWAInstallation>) => void;
  setInstallPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
  setCanInstall: (canInstall: boolean) => void;
  installPWA: () => Promise<void>;
  uninstallPWA: () => Promise<void>;
  setOnlineStatus: (isOnline: boolean) => void;
  setOfflineData: (data: Partial<PWAOffline['offlineData']>) => void;
  addCachedPage: (page: string) => void;
  removeCachedPage: (page: string) => void;
  addCachedResource: (resource: string) => void;
  removeCachedResource: (resource: string) => void;
  queueOfflineAction: (action: PWAQueuedAction) => void;
  processOfflineActions: () => Promise<void>;
  setOfflineQueueSize: (size: number, updatedAt?: string) => void;
  setUpdateAvailable: (update: Partial<PWAUpdate>) => void;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
  skipUpdate: () => void;
  setAutoUpdate: (enabled: boolean) => void;
  addNotification: (notification: Omit<PWANotification, 'id' | 'createdAt'>) => void;
  removeNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  setPerformance: (performance: PWAPerformance) => void;
  updatePerformanceMetrics: (metrics: Partial<PWAPerformance>) => void;
  updatePreferences: (preferences: Partial<PWAPreferences>) => void;
  resetPreferences: () => void;
  registerServiceWorker: () => Promise<void>;
  unregisterServiceWorker: () => Promise<void>;
  updateServiceWorker: () => Promise<void>;
  syncData: () => Promise<void>;
  clearCache: () => Promise<void>;
  exportData: () => Promise<void>;
  importData: (data: Partial<PWAStorePersistedState>) => Promise<void>;
  setInstalling: (installing: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setSyncing: (syncing: boolean) => void;
};

export type PWAStore = PWAState & PWAActions;

export type PWAStoreCreator = StateCreator<PWAStore, [['zustand/immer', never]], [], PWAStore>;

export type PWAEnvironment = {
  getWindow: () => (Window & typeof globalThis) | undefined;
  getDocument: () => Document | undefined;
  getNavigator: () => Navigator | undefined;
  getFetch: () => (typeof fetch) | undefined;
  getCaches: () => CacheStorage | undefined;
  getServiceWorkerContainer: () => ServiceWorkerContainer | undefined;
};

// Default PWA preferences
const createDefaultPreferences = (): PWAPreferences => ({
  autoUpdate: true,
  offlineMode: true,
  backgroundSync: true,
  pushNotifications: true,
  installPrompt: true,
  updateChannel: 'stable',
  cacheStrategy: 'balanced',
  dataUsage: {
    maxCacheSize: 100,
    maxOfflineStorage: 50,
    syncFrequency: 15,
  },
  privacy: {
    shareUsageData: false,
    shareCrashReports: true,
    sharePerformanceData: false,
  },
});

export const createPWAEnvironment = (): PWAEnvironment => {
  const resolveWindow = (): (Window & typeof globalThis) | undefined => {
    if (typeof globalThis !== 'undefined' && typeof (globalThis as any).window !== 'undefined') {
      return (globalThis as any).window as Window & typeof globalThis;
    }
    return typeof window === 'undefined' ? undefined : window;
  };

  const resolveDocument = (): Document | undefined => {
    if (typeof globalThis !== 'undefined' && typeof (globalThis as any).document !== 'undefined') {
      return (globalThis as any).document as Document;
    }
    return typeof document === 'undefined' ? undefined : document;
  };

  const resolveNavigator = (): Navigator | undefined => {
    if (typeof globalThis !== 'undefined' && typeof (globalThis as any).navigator !== 'undefined') {
      return (globalThis as any).navigator as Navigator;
    }
    return typeof navigator === 'undefined' ? undefined : navigator;
  };

  const resolveFetch = (): typeof fetch | undefined => {
    if (typeof globalThis !== 'undefined' && typeof (globalThis as any).fetch !== 'undefined') {
      return (globalThis as any).fetch as typeof fetch;
    }
    return typeof fetch === 'undefined' ? undefined : fetch;
  };

  return {
    getWindow: resolveWindow,
    getDocument: resolveDocument,
    getNavigator: resolveNavigator,
    getFetch: resolveFetch,
    getCaches: () => {
      const win = resolveWindow();
      if (!win || !('caches' in win)) {
        return undefined;
      }
      return win.caches;
    },
    getServiceWorkerContainer: () => {
      const nav = resolveNavigator();
      if (!nav || !('serviceWorker' in nav)) {
        return undefined;
      }
      return nav.serviceWorker;
    },
  };
};

export const createInitialPWAState = (
  environment: PWAEnvironment = createPWAEnvironment(),
): PWAState => {
  const navigatorRef = environment.getNavigator();
  const isOnline = navigatorRef?.onLine ?? true;
  const timestamp = new Date().toISOString();

  return {
    installation: {
      isInstalled: false,
      installPrompt: null,
      canInstall: false,
      installSource: 'manual',
      version: '1.0.0',
    },
    offline: {
      isOnline,
      isOffline: !isOnline,
      lastOnline: timestamp,
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
    preferences: createDefaultPreferences(),
    isLoading: false,
    isInstalling: false,
    isUpdating: false,
    isSyncing: false,
    error: null,
    offlineQueueSize: 0,
    offlineQueueUpdatedAt: null,
  };
};

export const createPWAActions = (
  set: (recipe: (draft: PWAStore) => void) => void,
  get: () => PWAStore,
  environment: PWAEnvironment,
): PWAActions => {
  const baseActions = createBaseStoreActions<PWAStore>(set);
  const now = () => new Date().toISOString();

  return {
    ...baseActions,
    setInstalling: (installing) =>
      set((state) => {
        state.isInstalling = installing;
      }),
    setUpdating: (updating) =>
      set((state) => {
        state.isUpdating = updating;
      }),
    setSyncing: (syncing) =>
      set((state) => {
        state.isSyncing = syncing;
      }),
    setInstallation: (installation) =>
      set((state) => {
        state.installation = mergeInstallationState(state.installation, installation);
      }),
    setInstallPrompt: (prompt) =>
      set((state) => {
        state.installation = mergeInstallationState(state.installation, { installPrompt: prompt });
      }),
    setCanInstall: (canInstall) =>
      set((state) => {
        state.installation = mergeInstallationState(state.installation, { canInstall });
      }),
    installPWA: async () => {
      const { setInstalling, setError } = get();

      try {
        setInstalling(true);
        setError(null);

        const { installation } = get();
        if (installation.installPrompt) {
          installation.installPrompt.prompt();
          const { outcome } = await installation.installPrompt.userChoice;

          if (outcome === 'accepted') {
            set((state) => {
              state.installation = mergeInstallationState(state.installation, {
                isInstalled: true,
                installedAt: now(),
                installPrompt: null,
              });
            });

            logger.info('PWA installed successfully');
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(errorMessage);
        logger.error(
          'Failed to install PWA:',
          error instanceof Error ? error : new Error(errorMessage),
        );
      } finally {
        setInstalling(false);
      }
    },
    uninstallPWA: async () => {
      await Promise.resolve();
      const { setInstalling, setError } = get();

      try {
        setInstalling(true);
        setError(null);

        set((state) => {
          const nextInstallation = mergeInstallationState(state.installation, {
            isInstalled: false,
            installPrompt: null,
          });

          Reflect.deleteProperty(nextInstallation, 'installedAt');
          state.installation = nextInstallation;
        });

        logger.info('PWA uninstalled');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(errorMessage);
        logger.error(
          'Failed to uninstall PWA:',
          error instanceof Error ? error : new Error(errorMessage),
        );
      } finally {
        setInstalling(false);
      }
    },
    setOnlineStatus: (isOnline) =>
      set((state) => {
        const offline = mergeOfflineState(state.offline, {
          isOnline,
          isOffline: !isOnline,
          lastOnline: isOnline ? now() : state.offline.lastOnline,
          ...(isOnline ? {} : { offlineSince: now() }),
        });

        if (isOnline) {
          Reflect.deleteProperty(offline, 'offlineSince');
        }

        state.offline = offline;
      }),
    setOfflineData: (data) =>
      set((state) => {
        state.offline = mergeOfflineState(state.offline, {
          offlineData: mergeOfflineData(state.offline.offlineData, data),
        });
      }),
    addCachedPage: (page) =>
      set((state) => {
        state.offline = mergeOfflineState(state.offline, {
          offlineData: mergeOfflineData(state.offline.offlineData, {
            cachedPages: [...state.offline.offlineData.cachedPages, page],
          }),
        });
      }),
    removeCachedPage: (page) =>
      set((state) => {
        state.offline = mergeOfflineState(state.offline, {
          offlineData: mergeOfflineData(state.offline.offlineData, {
            cachedPages: state.offline.offlineData.cachedPages.filter((p) => p !== page),
          }),
        });
      }),
    addCachedResource: (resource) =>
      set((state) => {
        state.offline = mergeOfflineState(state.offline, {
          offlineData: mergeOfflineData(state.offline.offlineData, {
            cachedResources: [...state.offline.offlineData.cachedResources, resource],
          }),
        });
      }),
    removeCachedResource: (resource) =>
      set((state) => {
        state.offline = mergeOfflineState(state.offline, {
          offlineData: mergeOfflineData(state.offline.offlineData, {
            cachedResources: state.offline.offlineData.cachedResources.filter(
              (item) => item !== resource,
            ),
          }),
        });
      }),
    queueOfflineAction: (action) =>
      set((state) => {
        const nextQueuedActions = [...state.offline.offlineData.queuedActions, action];
        state.offline = mergeOfflineState(state.offline, {
          offlineData: mergeOfflineData(state.offline.offlineData, {
            queuedActions: nextQueuedActions,
          }),
        });
        state.offlineQueueSize = nextQueuedActions.length;
        state.offlineQueueUpdatedAt = now();
      }),
    processOfflineActions: async () => {
      const { setSyncing, setError } = get();
      const fetchFn = environment.getFetch();
      const { offline } = get();

      if (!fetchFn) {
        logger.warn('Fetch API unavailable; skipping offline action processing.');
        return;
      }

      try {
        setSyncing(true);
        setError(null);

        for (const action of offline.offlineData.queuedActions) {
          try {
            await fetchFn('/api/offline/process', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(action),
            });
          } catch (error) {
            logger.error('Failed to process offline action:', error as Error);
          }
        }

        set((state) => {
          state.offline = mergeOfflineState(state.offline, {
            offlineData: mergeOfflineData(state.offline.offlineData, {
              queuedActions: [],
            }),
          });
          state.offlineQueueSize = 0;
          state.offlineQueueUpdatedAt = now();
        });

        logger.info('Offline actions processed', {
          count: offline.offlineData.queuedActions.length,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(errorMessage);
        logger.error(
          'Failed to process offline actions:',
          error instanceof Error ? error : new Error(errorMessage),
        );
      } finally {
        setSyncing(false);
      }
    },
    setOfflineQueueSize: (size, updatedAt) =>
      set((state) => {
        state.offlineQueueSize = size;
        state.offlineQueueUpdatedAt = updatedAt ?? now();
      }),
    setUpdateAvailable: (update) =>
      set((state) => {
        state.update = mergeUpdateState(state.update, update);
      }),
    downloadUpdate: async () => {
      const { setUpdating, setError } = get();

      try {
        setUpdating(true);
        setError(null);

        set((state) => {
          state.update = mergeUpdateState(state.update, { isDownloading: true });
        });

        for (let progress = 0; progress <= 100; progress += 10) {
          set((state) => {
            state.update = mergeUpdateState(state.update, { downloadProgress: progress });
          });
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        set((state) => {
          state.update = mergeUpdateState(state.update, { isDownloading: false });
        });

        logger.info('Update downloaded successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(errorMessage);
        logger.error(
          'Failed to download update:',
          error instanceof Error ? error : new Error(errorMessage),
        );
      } finally {
        setUpdating(false);
      }
    },
    installUpdate: async () => {
      await Promise.resolve();
      const { setUpdating, setError } = get();

      try {
        setUpdating(true);
        setError(null);

        set((state) => {
          state.update = mergeUpdateState(state.update, { isInstalling: true });
        });

        const win = environment.getWindow();
        win?.location.reload();

        logger.info('Update installed successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(errorMessage);
        logger.error(
          'Failed to install update:',
          error instanceof Error ? error : new Error(errorMessage),
        );
      } finally {
        setUpdating(false);
      }
    },
    skipUpdate: () =>
      set((state) => {
        state.update = mergeUpdateState(state.update, { isAvailable: false });
      }),
    setAutoUpdate: (enabled) =>
      set((state) => {
        state.update = mergeUpdateState(state.update, { autoUpdate: enabled });
      }),
    addNotification: (notification) =>
      set((state) => {
        const enrichedNotification: PWANotification = {
          ...notification,
          id: `notification_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
          createdAt: now(),
          read: notification.read ?? false,
        };
        state.notifications = [...state.notifications, enrichedNotification];
      }),
    removeNotification: (id) =>
      set((state) => {
        state.notifications = state.notifications.filter((notification) => notification.id !== id);
      }),
    markNotificationRead: (id) =>
      set((state) => {
        state.notifications = state.notifications.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification,
        );
      }),
    clearNotifications: () =>
      set((state) => {
        state.notifications = [];
      }),
    setPerformance: (performance) =>
      set((state) => {
        state.performance = performance;
      }),
    updatePerformanceMetrics: (metrics) =>
      set((state) => {
        state.performance = mergePerformanceState(state.performance, metrics);
      }),
    updatePreferences: (preferences) =>
      set((state) => {
        state.preferences = mergePreferencesState(state.preferences, preferences);
      }),
    resetPreferences: () =>
      set((state) => {
        state.preferences = createDefaultPreferences();
      }),
    registerServiceWorker: async () => {
      const { setLoading, setError } = get();
      const serviceWorker = environment.getServiceWorkerContainer();

      if (!serviceWorker) {
        logger.warn('Service worker registration skipped; navigator.serviceWorker unavailable.');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const registration = await serviceWorker.register('/service-worker.js');
        logger.info('Service worker registered', { scope: registration.scope });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to register service worker';
        setError(errorMessage);
        logger.error(
          'Service worker registration failed:',
          error instanceof Error ? error : new Error(errorMessage),
        );
      } finally {
        setLoading(false);
      }
    },
    unregisterServiceWorker: async () => {
      const { setLoading, setError } = get();
      const serviceWorker = environment.getServiceWorkerContainer();

      if (!serviceWorker) {
        logger.warn('Service worker unregistration skipped; navigator.serviceWorker unavailable.');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const registrations = await serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
        logger.info('Service worker unregistered');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to unregister service worker';
        setError(errorMessage);
        logger.error(
          'Service worker unregistration failed:',
          error instanceof Error ? error : new Error(errorMessage),
        );
      } finally {
        setLoading(false);
      }
    },
    updateServiceWorker: async () => {
      const { setLoading, setError } = get();
      const serviceWorker = environment.getServiceWorkerContainer();

      if (!serviceWorker) {
        logger.warn('Service worker update skipped; navigator.serviceWorker unavailable.');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const registration = await serviceWorker.getRegistration();
        await registration?.update();
        logger.info('Service worker update triggered');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update service worker';
        setError(errorMessage);
        logger.error(
          'Service worker update failed:',
          error instanceof Error ? error : new Error(errorMessage),
        );
      } finally {
        setLoading(false);
      }
    },
    syncData: async () => {
      const { setSyncing, setError } = get();
      const fetchFn = environment.getFetch();

      if (!fetchFn) {
        logger.warn('Sync skipped; fetch unavailable.');
        return;
      }

      try {
        setSyncing(true);
        setError(null);

        const response = await fetchFn('/api/pwa/sync', { method: 'POST' });
        if (!response.ok) {
          throw new Error(`Sync failed with status ${response.status}`);
        }

        logger.info('PWA data synced successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(errorMessage);
        logger.error(
          'Failed to sync PWA data:',
          error instanceof Error ? error : new Error(errorMessage),
        );
      } finally {
        setSyncing(false);
      }
    },
    clearCache: async () => {
      const { setLoading, setError } = get();
      const caches = environment.getCaches();

      if (!caches) {
        logger.warn('Cache clearing skipped; CacheStorage unavailable.');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
        logger.info('PWA cache cleared');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to clear cache';
        setError(errorMessage);
        logger.error(
          'PWA cache clearing failed:',
          error instanceof Error ? error : new Error(errorMessage),
        );
      } finally {
        setLoading(false);
      }
    },
    exportData: async () => {
      const { setLoading, setError } = get();
      const documentRef = environment.getDocument();
      const windowRef = environment.getWindow();

      if (!documentRef || !windowRef) {
        logger.warn('Export skipped; document/window unavailable.');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { installation, offline, preferences, performance } = get();
        const data: PWAStorePersistedState = {
          installation,
          offline,
          preferences,
          performance,
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = windowRef.URL.createObjectURL(blob);
        const a = documentRef.createElement('a');
        a.href = url;
        a.download = `pwa-export-${Date.now()}.json`;
        a.click();
        windowRef.URL.revokeObjectURL(url);

        logger.info('PWA data exported');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to export data';
        setError(errorMessage);
        logger.error(
          'PWA export failed:',
          error instanceof Error ? error : new Error(errorMessage),
        );
      } finally {
        setLoading(false);
      }
    },
    importData: async (data) => {
      const { setLoading, setError } = get();

      try {
        setLoading(true);
        setError(null);

        set((state) => {
          if (data.installation) {
            state.installation = mergeInstallationState(state.installation, data.installation);
          }
          if (data.offline) {
            state.offline = mergeOfflineState(state.offline, data.offline);
          }
          if (data.preferences) {
            state.preferences = mergePreferencesState(state.preferences, data.preferences);
          }
          if (data.performance) {
            state.performance = mergePerformanceState(state.performance, data.performance);
          }
        });

        logger.info('PWA data imported');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to import data';
        setError(errorMessage);
        logger.error(
          'PWA import failed:',
          error instanceof Error ? error : new Error(errorMessage),
        );
      } finally {
        setLoading(false);
      }
    },
  };
};

export const pwaStoreCreator: PWAStoreCreator = (set, get) => {
  const environment = createPWAEnvironment();
  return Object.assign(
    createInitialPWAState(environment),
    createPWAActions(set, get, environment),
  );
};

export const usePWAStore = create<PWAStore>()(
  devtools(
    persist(
      immer(pwaStoreCreator),
      {
        name: 'pwa-store',
        storage: createSafeStorage(),
        // Skip hydration delay in E2E/test environments for faster test execution
        skipHydration: process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1' || process.env.PLAYWRIGHT_USE_MOCKS === '1',
        partialize: (state) => ({
          installation: state.installation,
          offline: state.offline,
          preferences: state.preferences,
          performance: state.performance,
        }),
      },
    ),
    { name: 'pwa-store' },
  ),
);

// Store selectors for optimized re-renders
export const usePWAInstallation = () => usePWAStore(state => state.installation);
export const usePWAOffline = () => usePWAStore(state => state.offline);
export const usePWAUpdate = () => usePWAStore(state => state.update);
export const usePWANotifications = () => usePWAStore(state => state.notifications);
export const usePWAPerformance = () => usePWAStore(state => state.performance);
export const usePWAPreferences = () => usePWAStore(state => state.preferences);
export const usePWALoading = () => usePWAStore(state => state.isLoading);
export const usePWASyncing = () => usePWAStore(state => state.isSyncing);
export const usePWAError = () => usePWAStore(state => state.error);

// Action selectors
const selectPWAActions = (state: PWAStore) => ({
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
});

export const usePWAActions = () => usePWAStore(selectPWAActions);
export const getPWAActions = () => selectPWAActions(usePWAStore.getState());

export const pwaSelectors = {
  installation: (state: PWAStore) => state.installation,
  offline: (state: PWAStore) => state.offline,
  update: (state: PWAStore) => state.update,
  notifications: (state: PWAStore) => state.notifications,
  performance: (state: PWAStore) => state.performance,
  preferences: (state: PWAStore) => state.preferences,
  isLoading: (state: PWAStore) => state.isLoading,
  isInstalling: (state: PWAStore) => state.isInstalling,
  isUpdating: (state: PWAStore) => state.isUpdating,
  isSyncing: (state: PWAStore) => state.isSyncing,
  error: (state: PWAStore) => state.error,
  offlineQueueSize: (state: PWAStore) => state.offlineQueueSize,
  offlineQueueUpdatedAt: (state: PWAStore) => state.offlineQueueUpdatedAt,
};

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
  offlineQueueUpdatedAt: state.offlineQueueUpdatedAt,
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
  const merged: Record<string, unknown> = { ...current };

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) {
      delete merged[key];
    } else {
      merged[key] = value;
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
