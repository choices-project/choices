
/**
 * App Store - Zustand Implementation
 *
 * Global application state for UI chrome, feature flags, device hints, and layout helpers.
 * Modernized to align with the 2025 Zustand store standards (typed creator, helpers, tests).
 */

import { useMemo } from 'react';
import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { logger } from '@/lib/utils/logger';

import { createSafeStorage } from './storage';
import type { BaseStore, FeatureFlag } from './types';

export type ThemePreference = 'light' | 'dark' | 'system';
export type SystemTheme = 'light' | 'dark';
export type ScreenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type Orientation = 'portrait' | 'landscape';

export type AppModalEntry = {
  id: string;
  data: Record<string, unknown>;
};

export type AppPreferences = {
  animations: boolean;
  haptics: boolean;
  sound: boolean;
  autoSave: boolean;
  language: string;
  timezone: string;
  compactMode: boolean;
  showTooltips: boolean;
  enableAnalytics: boolean;
  enableCrashReporting: boolean;
};

export type AppI18nState = {
  currentLanguage: string;
  isLoading: boolean;
  error: string | null;
};

export type AppBreadcrumb = {
  label: string;
  href: string;
  icon?: string;
};

export type AppState = {
  theme: ThemePreference;
  systemTheme: SystemTheme;
  resolvedTheme: SystemTheme;
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  sidebarPinned: boolean;
  sidebarActiveSection: string | null;

  activeModal: string | null;
  modalData: Record<string, unknown> | null;
  modalStack: AppModalEntry[];

  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenSize: ScreenSize;
  orientation: Orientation;

  features: Record<string, boolean>;
  featureFlags: FeatureFlag[];

  settings: AppPreferences;
  i18n: AppI18nState;

  currentRoute: string;
  previousRoute: string;
  breadcrumbs: AppBreadcrumb[];

  isLoading: boolean;
  isInitializing: boolean;
  isUpdating: boolean;
  error: string | null;
};

export type AppActions = Pick<BaseStore, 'setLoading' | 'setError' | 'clearError'> & {
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
  updateSystemTheme: (systemTheme: SystemTheme) => void;

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setSidebarPinned: (pinned: boolean) => void;
  setSidebarActiveSection: (section: string | null) => void;

  openModal: (id: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  closeAllModals: () => void;
  pushModal: (id: string, data?: Record<string, unknown>) => void;
  popModal: () => void;

  setDeviceInfo: (info: {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    screenSize: ScreenSize;
    orientation: Orientation;
  }) => void;

  setFeatureFlag: (flag: string, enabled: boolean) => void;
  toggleFeatureFlag: (flag: string) => void;
  setFeatureFlags: (flags: Record<string, boolean>) => void;
  loadFeatureFlags: (flags: FeatureFlag[]) => void;

  updateSettings: (settings: Partial<AppPreferences>) => void;
  resetSettings: () => void;

  setLanguage: (language: string) => void;
  setI18nLoading: (loading: boolean) => void;
  setI18nError: (error: string | null) => void;

  setCurrentRoute: (route: string) => void;
  setBreadcrumbs: (breadcrumbs: AppBreadcrumb[]) => void;
  addBreadcrumb: (breadcrumb: AppBreadcrumb) => void;
  removeBreadcrumb: (index: number) => void;

  setInitializing: (initializing: boolean) => void;
  setUpdating: (updating: boolean) => void;

  resetAppState: () => void;
};

export type AppStore = AppState & AppActions;

type AppStoreCreator = StateCreator<
  AppStore,
  [['zustand/devtools', never], ['zustand/persist', unknown], ['zustand/immer', never]]
>;

const defaultPreferences: AppPreferences = {
  animations: true,
  haptics: true,
  sound: true,
  autoSave: true,
  language: 'en',
  timezone: 'UTC',
  compactMode: false,
  showTooltips: true,
  enableAnalytics: true,
  enableCrashReporting: true,
};

const createDefaultPreferences = (): AppPreferences => ({ ...defaultPreferences });

export const createInitialAppState = (): AppState => ({
  theme: 'system',
  systemTheme: 'light',
  resolvedTheme: 'light',
  sidebarCollapsed: false,
  sidebarWidth: 280,
  sidebarPinned: false,
  sidebarActiveSection: null,

  activeModal: null,
  modalData: null,
  modalStack: [],

  isMobile: false,
  isTablet: false,
  isDesktop: true,
  screenSize: 'lg',
  orientation: 'landscape',

  features: {},
  featureFlags: [],

  settings: createDefaultPreferences(),
  i18n: {
    currentLanguage: 'en',
    isLoading: false,
    error: null,
  },

  currentRoute: '/',
  previousRoute: '',
  breadcrumbs: [],

  isLoading: false,
  isInitializing: false,
  isUpdating: false,
  error: null,
});

export const initialAppState: AppState = createInitialAppState();

const clampSidebarWidth = (width: number) => Math.max(200, Math.min(400, width));
const resolveTheme = (theme: ThemePreference, systemTheme: SystemTheme): SystemTheme =>
  theme === 'system' ? systemTheme : theme;

const applyThemeToDocument = (theme: SystemTheme) => {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.setAttribute('data-theme', theme);
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

export const createAppActions = (
  set: Parameters<AppStoreCreator>[0],
  get: Parameters<AppStoreCreator>[1],
): AppActions => {
  const setDraft = set as unknown as (fn: (draft: AppState) => void) => void;
  const setState = (recipe: (draft: AppState) => void) => {
    setDraft(recipe);
  };

  return {
    setLoading: (loading) => setState((state) => {
      state.isLoading = loading;
    }),

    setError: (error) => setState((state) => {
      state.error = error;
    }),

    clearError: () => setState((state) => {
      state.error = null;
    }),

    setTheme: (theme) => {
      setState((state) => {
        state.theme = theme;
        state.resolvedTheme = resolveTheme(theme, state.systemTheme);
      });

      applyThemeToDocument(get().resolvedTheme);
      logger.info('Theme changed', { theme });
    },

    toggleTheme: () => {
      let nextTheme: ThemePreference = 'dark';
      setState((state) => {
        const currentTheme = state.theme;
        const currentResolved = state.resolvedTheme;
        const baseline = currentTheme === 'system' ? currentResolved : currentTheme;
        nextTheme = baseline === 'dark' ? 'light' : 'dark';
        state.theme = nextTheme;
        state.resolvedTheme = resolveTheme(nextTheme, state.systemTheme);
      });

      applyThemeToDocument(get().resolvedTheme);
      logger.info('Theme toggled', { theme: get().theme });
    },

    updateSystemTheme: (systemTheme) => {
      setState((state) => {
        state.systemTheme = systemTheme;
        state.resolvedTheme = resolveTheme(state.theme, systemTheme);
      });

      if (get().theme === 'system') {
        applyThemeToDocument(get().resolvedTheme);
      }
    },

    toggleSidebar: () => {
      setState((state) => {
        state.sidebarCollapsed = !state.sidebarCollapsed;
      });
      logger.debug('Sidebar toggled', { collapsed: get().sidebarCollapsed });
    },

    setSidebarCollapsed: (collapsed) => setState((state) => {
      state.sidebarCollapsed = collapsed;
    }),

    setSidebarWidth: (width) => setState((state) => {
      state.sidebarWidth = clampSidebarWidth(width);
    }),

    setSidebarPinned: (pinned) => setState((state) => {
      state.sidebarPinned = pinned;
      if (pinned) {
        state.sidebarCollapsed = false;
      }
    }),

    setSidebarActiveSection: (section) => setState((state) => {
      state.sidebarActiveSection = section;
    }),

    openModal: (id, data) => setState((state) => {
      state.activeModal = id;
      state.modalData = data ?? null;
      state.modalStack.push({ id, data: data ?? {} });
    }),

    closeModal: () => setState((state) => {
      state.modalStack.pop();
      const previous = state.modalStack[state.modalStack.length - 1];
      if (previous) {
        state.activeModal = previous.id;
        state.modalData = previous.data;
        return;
      }
      state.activeModal = null;
      state.modalData = null;
    }),

    closeAllModals: () => setState((state) => {
      state.activeModal = null;
      state.modalData = null;
      state.modalStack = [];
    }),

    pushModal: (id, data) => setState((state) => {
      state.modalStack.push({ id, data: data ?? {} });
      state.activeModal = id;
      state.modalData = data ?? null;
    }),

    popModal: () => setState((state) => {
      if (state.modalStack.length === 0) {
        return;
      }
      state.modalStack.pop();
      const previous = state.modalStack[state.modalStack.length - 1];
      if (previous) {
        state.activeModal = previous.id;
        state.modalData = previous.data;
      } else {
        state.activeModal = null;
        state.modalData = null;
      }
    }),

    setDeviceInfo: (info) => setState((state) => {
      state.isMobile = info.isMobile;
      state.isTablet = info.isTablet;
      state.isDesktop = info.isDesktop;
      state.screenSize = info.screenSize;
      state.orientation = info.orientation;
    }),

    setFeatureFlag: (flag, enabled) => {
      setState((state) => {
        state.features[flag] = enabled;
      });
      logger.info('Feature flag set', { flag, enabled });
    },

    toggleFeatureFlag: (flag) => {
      let next: boolean;
      setState((state) => {
        const current = state.features[flag] ?? false;
        next = !current;
        state.features[flag] = next;
      });
      logger.info('Feature flag toggled', { flag, enabled: get().features[flag] });
    },

    setFeatureFlags: (flags) => {
      setState((state) => {
        state.features = { ...state.features, ...flags };
      });
      logger.info('Feature flags updated', { count: Object.keys(flags).length });
    },

    loadFeatureFlags: (flags) => {
      setState((state) => {
        state.featureFlags = flags;
        flags.forEach((flag) => {
          state.features[flag.id] = flag.enabled;
        });
      });
      logger.info('Feature flags loaded', { count: flags.length });
    },

    updateSettings: (settings) => {
      setState((state) => {
        state.settings = { ...state.settings, ...settings };
      });
      logger.info('App settings updated', { keys: Object.keys(settings) });
    },

    resetSettings: () => {
      setState((state) => {
        state.settings = createDefaultPreferences();
      });
      logger.info('App settings reset to defaults');
    },

    setLanguage: (language) => {
      setState((state) => {
        state.i18n.currentLanguage = language;
        state.settings.language = language;
      });
      logger.info('Language changed', { language });
    },

    setI18nLoading: (loading) => setState((state) => {
      state.i18n.isLoading = loading;
    }),

    setI18nError: (error) => setState((state) => {
      state.i18n.error = error;
    }),

    setCurrentRoute: (route) => {
      let previousRoute = '';
      setState((state) => {
        previousRoute = state.currentRoute;
        state.previousRoute = state.currentRoute;
        state.currentRoute = route;
      });
      logger.debug('Route changed', { from: previousRoute, to: route });
    },

    setBreadcrumbs: (breadcrumbs) => setState((state) => {
      state.breadcrumbs = breadcrumbs;
    }),

    addBreadcrumb: (breadcrumb) => setState((state) => {
      state.breadcrumbs.push(breadcrumb);
    }),

    removeBreadcrumb: (index) => setState((state) => {
      if (index < 0 || index >= state.breadcrumbs.length) {
        return;
      }
      state.breadcrumbs.splice(index, 1);
    }),

    setInitializing: (initializing) => setState((state) => {
      state.isInitializing = initializing;
    }),

    setUpdating: (updating) => setState((state) => {
      state.isUpdating = updating;
    }),

    resetAppState: () => setState((state) => {
      Object.assign(state, createInitialAppState());
    }),
  };
};

export const appStoreCreator: AppStoreCreator = (set, get) =>
  Object.assign(createInitialAppState(), createAppActions(set, get));

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      immer(appStoreCreator),
      {
        name: 'app-store',
        storage: createSafeStorage(),
        partialize: (state) => ({
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
          sidebarWidth: state.sidebarWidth,
          sidebarPinned: state.sidebarPinned,
          features: state.features,
          settings: state.settings,
        }),
      },
    ),
    { name: 'app-store' },
  ),
);

// Memoized selectors
export const useTheme = () => useAppStore((state) => state.theme);
export const useSystemTheme = () => useAppStore((state) => state.systemTheme);
export const useResolvedTheme = () => useAppStore((state) => state.resolvedTheme);
export const useSidebarCollapsed = () => useAppStore((state) => state.sidebarCollapsed);
export const useSidebarWidth = () => useAppStore((state) => state.sidebarWidth);
export const useSidebarPinned = () => useAppStore((state) => state.sidebarPinned);
export const useSidebarActiveSection = () => useAppStore((state) => state.sidebarActiveSection);

export const useActiveModal = () => useAppStore((state) => state.activeModal);
export const useModalData = () => useAppStore((state) => state.modalData);
export const useModalStack = () => useAppStore((state) => state.modalStack);

export const useIsMobile = () => useAppStore((state) => state.isMobile);
export const useIsTablet = () => useAppStore((state) => state.isTablet);
export const useIsDesktop = () => useAppStore((state) => state.isDesktop);
export const useScreenSize = () => useAppStore((state) => state.screenSize);
export const useOrientation = () => useAppStore((state) => state.orientation);

export const useAppFeatureFlags = () => useAppStore((state) => state.features);
export const useAppSettings = () => useAppStore((state) => state.settings);
export const useCurrentRoute = () => useAppStore((state) => state.currentRoute);
export const useBreadcrumbs = () => useAppStore((state) => state.breadcrumbs);
export const useAppLoading = () => useAppStore((state) => state.isLoading);
export const useAppError = () => useAppStore((state) => state.error);

export const useAppActions = () =>
  useMemo(() => {
    const state = useAppStore.getState();

    return {
      setLoading: state.setLoading,
      setError: state.setError,
      clearError: state.clearError,
      setTheme: state.setTheme,
      toggleTheme: state.toggleTheme,
      updateSystemTheme: state.updateSystemTheme,
      toggleSidebar: state.toggleSidebar,
      setSidebarCollapsed: state.setSidebarCollapsed,
      setSidebarWidth: state.setSidebarWidth,
      setSidebarPinned: state.setSidebarPinned,
      setSidebarActiveSection: state.setSidebarActiveSection,
      openModal: state.openModal,
      closeModal: state.closeModal,
      closeAllModals: state.closeAllModals,
      pushModal: state.pushModal,
      popModal: state.popModal,
      setDeviceInfo: state.setDeviceInfo,
      setFeatureFlag: state.setFeatureFlag,
      toggleFeatureFlag: state.toggleFeatureFlag,
      setFeatureFlags: state.setFeatureFlags,
      loadFeatureFlags: state.loadFeatureFlags,
      updateSettings: state.updateSettings,
      resetSettings: state.resetSettings,
      setLanguage: state.setLanguage,
      setI18nLoading: state.setI18nLoading,
      setI18nError: state.setI18nError,
      setCurrentRoute: state.setCurrentRoute,
      setBreadcrumbs: state.setBreadcrumbs,
      addBreadcrumb: state.addBreadcrumb,
      removeBreadcrumb: state.removeBreadcrumb,
      setInitializing: state.setInitializing,
      setUpdating: state.setUpdating,
      resetAppState: state.resetAppState,
    };
  }, []);

export const appSelectors = {
  theme: (state: AppStore) => state.theme,
  resolvedTheme: (state: AppStore) => state.resolvedTheme,
  sidebarCollapsed: (state: AppStore) => state.sidebarCollapsed,
  activeModal: (state: AppStore) => state.activeModal,
  features: (state: AppStore) => state.features,
  settings: (state: AppStore) => state.settings,
  currentRoute: (state: AppStore) => state.currentRoute,
  breadcrumbs: (state: AppStore) => state.breadcrumbs,
  isLoading: (state: AppStore) => state.isLoading,
  error: (state: AppStore) => state.error,
  isInitializing: (state: AppStore) => state.isInitializing,
  isUpdating: (state: AppStore) => state.isUpdating,
};

export const useIsFeatureEnabled = (flag: string) =>
  useAppStore((state) => state.features[flag] ?? false);

export const useAppTheme = () =>
  useAppStore((state) => resolveTheme(state.theme, state.systemTheme));

export const useAppLanguage = () => useAppStore((state) => state.settings.language);
export const useAppTimezone = () => useAppStore((state) => state.settings.timezone);
export const useAppAnimations = () => useAppStore((state) => state.settings.animations);
export const useAppHaptics = () => useAppStore((state) => state.settings.haptics);

export const appStoreUtils = {
  isFeatureEnabled: (flag: string) => {
    const state = useAppStore.getState();
    return state.features[flag] ?? false;
  },

  getEnabledFeatures: () => {
    const state = useAppStore.getState();
    return Object.entries(state.features)
      .filter(([, enabled]) => enabled)
      .map(([flag]) => flag);
  },

  getDisabledFeatures: () => {
    const state = useAppStore.getState();
    return Object.entries(state.features)
      .filter(([, enabled]) => !enabled)
      .map(([flag]) => flag);
  },

  getCurrentTheme: () => {
    const state = useAppStore.getState();
    return resolveTheme(state.theme, state.systemTheme);
  },

  getAppConfig: () => {
    const state = useAppStore.getState();
    return {
      theme: state.theme,
      resolvedTheme: state.resolvedTheme,
      sidebar: {
        collapsed: state.sidebarCollapsed,
        width: state.sidebarWidth,
        pinned: state.sidebarPinned,
      },
      features: state.features,
      settings: state.settings,
      navigation: {
        currentRoute: state.currentRoute,
        previousRoute: state.previousRoute,
        breadcrumbs: state.breadcrumbs,
      },
    };
  },

  initialize: () => {
    const state = useAppStore.getState();
    applyThemeToDocument(resolveTheme(state.theme, state.systemTheme));
    logger.info('App store initialized');
  },
};

export const appStoreSubscriptions = {
  onThemeChange: (callback: (theme: ThemePreference) => void) =>
    useAppStore.subscribe(
      (state, prevState) => {
        if (state.theme !== prevState.theme || state.systemTheme !== prevState.systemTheme) {
          callback(resolveTheme(state.theme, state.systemTheme));
        }
      },
    ),

  onSidebarChange: (callback: (collapsed: boolean) => void) =>
    useAppStore.subscribe(
      (state, prevState) => {
        if (state.sidebarCollapsed !== prevState.sidebarCollapsed) {
          callback(state.sidebarCollapsed);
        }
      },
    ),

  onFeatureFlagChange: (flag: string, callback: (enabled: boolean) => void) =>
    useAppStore.subscribe(
      (state, prevState) => {
        const enabled = state.features[flag];
        const prevEnabled = prevState.features[flag];
        if (enabled !== prevEnabled) {
          callback(enabled ?? false);
        }
      },
    ),

  onSettingsChange: (callback: (settings: AppPreferences) => void) =>
    useAppStore.subscribe(
      (state, prevState) => {
        if (state.settings !== prevState.settings) {
          callback(state.settings);
        }
      },
    ),
};

export const appStoreDebug = {
  logState: () => {
    const state = useAppStore.getState();
    logger.debug('App Store State', {
      theme: state.theme,
      resolvedTheme: state.resolvedTheme,
      sidebarCollapsed: state.sidebarCollapsed,
      features: state.features,
      settings: state.settings,
      currentRoute: state.currentRoute,
      isLoading: state.isLoading,
      error: state.error,
    });
  },

  logFeatureFlags: () => {
    const state = useAppStore.getState();
    logger.debug('Feature Flags', {
      enabled: Object.entries(state.features).filter(([, enabled]) => enabled),
      disabled: Object.entries(state.features).filter(([, enabled]) => !enabled),
      total: Object.keys(state.features).length,
    });
  },

  logSettings: () => {
    const state = useAppStore.getState();
    logger.debug('App Settings', state.settings);
  },

  reset: () => {
    useAppStore.getState().resetAppState();
    logger.info('App store reset to initial state');
  },
};
