/**
 * App Store - Zustand Implementation
 * 
 * Global application state management including theme, sidebar, feature flags,
 * and app-wide settings. Consolidates scattered local state and Context API usage.
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { withOptional } from '@/lib/utils/objects';
import { logger } from '@/lib/utils/logger';

import type { BaseStore, FeatureFlag } from './types';

// App store state interface
type AppStore = {
  // UI State
  theme: 'light' | 'dark' | 'system';
  systemTheme: 'light' | 'dark';
  resolvedTheme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  sidebarPinned: boolean;
  sidebarActiveSection: string | null;
  
  // Modal State
  activeModal: string | null;
  modalData: any;
  modalStack: Array<{
    id: string;
    data: any;
  }>;
  
  // Mobile UI State
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  orientation: 'portrait' | 'landscape';
  
  // Feature Flags
  features: Record<string, boolean>;
  featureFlags: FeatureFlag[];
  
  // App Settings
  settings: {
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
  
  // Navigation State
  currentRoute: string;
  previousRoute: string;
  breadcrumbs: Array<{
    label: string;
    href: string;
    icon?: string;
  }>;
  
  // Loading States
  isInitializing: boolean;
  isUpdating: boolean;
  
  // Actions - Theme
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
  updateSystemTheme: (systemTheme: 'light' | 'dark') => void;
  
  // Actions - Sidebar
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setSidebarPinned: (pinned: boolean) => void;
  setSidebarActiveSection: (section: string | null) => void;
  
  // Actions - Modal
  openModal: (id: string, data?: any) => void;
  closeModal: () => void;
  closeAllModals: () => void;
  pushModal: (id: string, data?: any) => void;
  popModal: () => void;
  
  // Actions - Mobile UI
  setDeviceInfo: (info: {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    orientation: 'portrait' | 'landscape';
  }) => void;
  
  // Actions - Feature Flags
  setFeatureFlag: (flag: string, enabled: boolean) => void;
  toggleFeatureFlag: (flag: string) => void;
  setFeatureFlags: (flags: Record<string, boolean>) => void;
  loadFeatureFlags: (flags: FeatureFlag[]) => void;
  
  // Actions - Settings
  updateSettings: (settings: Partial<AppStore['settings']>) => void;
  resetSettings: () => void;
  
  // Actions - Navigation
  setCurrentRoute: (route: string) => void;
  setBreadcrumbs: (breadcrumbs: Array<{ label: string; href: string; icon?: string }>) => void;
  addBreadcrumb: (breadcrumb: { label: string; href: string; icon?: string }) => void;
  removeBreadcrumb: (index: number) => void;
  
  // Actions - Loading States
  setInitializing: (initializing: boolean) => void;
  setUpdating: (updating: boolean) => void;
} & BaseStore

// Default settings
const defaultSettings = {
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

// Create app store with middleware
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      immer((set, _get) => ({
        // Initial state
        theme: 'system',
        systemTheme: 'light',
        resolvedTheme: 'light',
        sidebarCollapsed: false,
        sidebarWidth: 280,
        sidebarPinned: false,
        sidebarActiveSection: null,
        
        // Modal state
        activeModal: null,
        modalData: null,
        modalStack: [],
        
        // Mobile UI state
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        screenSize: 'lg',
        orientation: 'landscape',
        
        features: {},
        featureFlags: [],
        settings: defaultSettings,
        currentRoute: '/',
        previousRoute: '',
        breadcrumbs: [],
        isLoading: false,
        isInitializing: false,
        isUpdating: false,
        error: null,
      
      // Base store actions
      setLoading: (loading) => set((state) => {
        state.isLoading = loading;
      }),
      
      setError: (error) => set((state) => {
        state.error = error;
      }),
      
      clearError: () => set((state) => {
        state.error = null;
      }),
      
      // Theme actions
      setTheme: (theme) => set((state) => {
        state.theme = theme;
        
        // Apply theme to document
        if (typeof window !== 'undefined') {
          document.documentElement.setAttribute('data-theme', theme);
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        
        logger.info('Theme changed', { theme });
      }),
      
      toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        state.theme = newTheme;
        
        // Apply theme to document
        if (typeof window !== 'undefined') {
          document.documentElement.setAttribute('data-theme', newTheme);
          if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        
        logger.info('Theme toggled', { newTheme });
      }),
      
      updateSystemTheme: (systemTheme) => set((state) => {
        state.systemTheme = systemTheme;
        if (state.theme === 'system') {
          state.resolvedTheme = systemTheme;
        }
      }),
      
      // Sidebar actions
      toggleSidebar: () => set((state) => {
        state.sidebarCollapsed = !state.sidebarCollapsed;
        logger.debug('Sidebar toggled', { collapsed: state.sidebarCollapsed });
      }),
      
      setSidebarCollapsed: (collapsed) => set((state) => {
        state.sidebarCollapsed = collapsed;
      }),
      
      setSidebarWidth: (width) => set((state) => {
        state.sidebarWidth = Math.max(200, Math.min(400, width)); // Clamp between 200-400px
      }),
      
      setSidebarPinned: (pinned) => set((state) => {
        state.sidebarPinned = pinned;
        if (pinned) {
          state.sidebarCollapsed = false;
        }
      }),
      
      setSidebarActiveSection: (section) => set((state) => {
        state.sidebarActiveSection = section;
      }),
      
      // Modal actions
      openModal: (id, data) => set((state) => {
        state.activeModal = id;
        state.modalData = data;
        state.modalStack.push({ id, data });
      }),
      
      closeModal: () => set((state) => {
        state.modalStack.pop();
        if (state.modalStack.length > 0) {
          const previous = state.modalStack[state.modalStack.length - 1];
          if (previous) {
            state.activeModal = previous.id;
            state.modalData = previous.data;
          }
        } else {
          state.activeModal = null;
          state.modalData = null;
        }
      }),
      
      closeAllModals: () => set((state) => {
        state.activeModal = null;
        state.modalData = null;
        state.modalStack = [];
      }),
      
      pushModal: (id, data) => set((state) => {
        state.modalStack.push({ id, data });
        state.activeModal = id;
        state.modalData = data;
      }),
      
      popModal: () => set((state) => {
        if (state.modalStack.length > 0) {
          state.modalStack.pop();
          if (state.modalStack.length > 0) {
            const previous = state.modalStack[state.modalStack.length - 1];
            if (previous) {
              state.activeModal = previous.id;
              state.modalData = previous.data;
            }
          } else {
            state.activeModal = null;
            state.modalData = null;
          }
        }
      }),
      
      // Mobile UI actions
      setDeviceInfo: (info) => set((state) => {
        state.isMobile = info.isMobile;
        state.isTablet = info.isTablet;
        state.isDesktop = info.isDesktop;
        state.screenSize = info.screenSize;
        state.orientation = info.orientation;
      }),
      
      // Feature flag actions
      setFeatureFlag: (flag, enabled) => set((state) => {
        state.features[flag] = enabled;
        logger.info('Feature flag set', { flag, enabled });
      }),
      
      toggleFeatureFlag: (flag) => set((state) => {
        state.features[flag] = !state.features[flag];
        logger.info('Feature flag toggled', { flag, enabled: state.features[flag] });
      }),
      
      setFeatureFlags: (flags) => set((state) => {
        state.features = { ...state.features, ...flags };
        logger.info('Feature flags updated', { flags });
      }),
      
      loadFeatureFlags: (flags) => set((state) => {
        state.featureFlags = flags;
        // Initialize features from loaded flags
        flags.forEach(flag => {
          state.features[flag.id] = flag.enabled;
        });
        logger.info('Feature flags loaded', { count: flags.length });
      }),
      
      // Settings actions
      updateSettings: (settings) => set((state) => {
        state.settings = { ...state.settings, ...settings };
        logger.info('App settings updated', { settings });
      }),
      
      resetSettings: () => set((state) => {
        state.settings = { ...defaultSettings };
        logger.info('App settings reset to defaults');
      }),
      
      // Navigation actions
      setCurrentRoute: (route) => set((state) => {
        state.previousRoute = state.currentRoute;
        state.currentRoute = route;
        logger.debug('Route changed', { from: state.previousRoute, to: route });
      }),
      
      setBreadcrumbs: (breadcrumbs) => set((state) => {
        state.breadcrumbs = breadcrumbs;
      }),
      
      addBreadcrumb: (breadcrumb) => set((state) => {
        state.breadcrumbs.push(breadcrumb);
      }),
      
      removeBreadcrumb: (index) => set((state) => {
        state.breadcrumbs.splice(index, 1);
      }),
      
      // Loading state actions
      setInitializing: (initializing) => set((state) => {
        state.isInitializing = initializing;
      }),
      
      setUpdating: (updating) => set((state) => {
        state.isUpdating = updating;
      }),
    })),
    {
      name: 'app-store',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarWidth: state.sidebarWidth,
        sidebarPinned: state.sidebarPinned,
        features: state.features,
        settings: state.settings,
      }),
    }
  ),
  { name: 'app-store' }
));

// Store selectors for optimized re-renders
export const useTheme = () => useAppStore(state => state.theme);
export const useSystemTheme = () => useAppStore(state => state.systemTheme);
export const useResolvedTheme = () => useAppStore(state => state.resolvedTheme);
export const useSidebarCollapsed = () => useAppStore(state => state.sidebarCollapsed);
export const useSidebarWidth = () => useAppStore(state => state.sidebarWidth);
export const useSidebarPinned = () => useAppStore(state => state.sidebarPinned);
export const useSidebarActiveSection = () => useAppStore(state => state.sidebarActiveSection);

// Modal selectors
export const useActiveModal = () => useAppStore(state => state.activeModal);
export const useModalData = () => useAppStore(state => state.modalData);
export const useModalStack = () => useAppStore(state => state.modalStack);

// Mobile UI selectors
export const useIsMobile = () => useAppStore(state => state.isMobile);
export const useIsTablet = () => useAppStore(state => state.isTablet);
export const useIsDesktop = () => useAppStore(state => state.isDesktop);
export const useScreenSize = () => useAppStore(state => state.screenSize);
export const useOrientation = () => useAppStore(state => state.orientation);

export const useFeatureFlags = () => useAppStore(state => state.features);
export const useAppSettings = () => useAppStore(state => state.settings);
export const useCurrentRoute = () => useAppStore(state => state.currentRoute);
export const useBreadcrumbs = () => useAppStore(state => state.breadcrumbs);
export const useAppLoading = () => useAppStore(state => state.isLoading);
export const useAppError = () => useAppStore(state => state.error);

// Action selectors
export const useAppActions = () => useAppStore(state => ({
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
  setCurrentRoute: state.setCurrentRoute,
  setBreadcrumbs: state.setBreadcrumbs,
  addBreadcrumb: state.addBreadcrumb,
  removeBreadcrumb: state.removeBreadcrumb,
  setInitializing: state.setInitializing,
  setUpdating: state.setUpdating,
}));

// Computed selectors
export const useIsFeatureEnabled = (flag: string) => useAppStore(state => {
  return state.features[flag] ?? false;
});

export const useAppTheme = () => useAppStore(state => {
  if (state.theme === 'system') {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return state.theme;
});

export const useAppLanguage = () => useAppStore(state => state.settings.language);
export const useAppTimezone = () => useAppStore(state => state.settings.timezone);
export const useAppAnimations = () => useAppStore(state => state.settings.animations);
export const useAppHaptics = () => useAppStore(state => state.settings.haptics);

// Store utilities
export const appStoreUtils = {
  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled: (flag: string) => {
    const state = useAppStore.getState();
    return state.features[flag] ?? false;
  },
  
  /**
   * Get all enabled features
   */
  getEnabledFeatures: () => {
    const state = useAppStore.getState();
    return Object.entries(state.features)
      .filter(([_, enabled]) => enabled)
      .map(([flag, _]) => flag);
  },
  
  /**
   * Get all disabled features
   */
  getDisabledFeatures: () => {
    const state = useAppStore.getState();
    return Object.entries(state.features)
      .filter(([_, enabled]) => !enabled)
      .map(([flag, _]) => flag);
  },
  
  /**
   * Get current theme with system preference
   */
  getCurrentTheme: () => {
    const state = useAppStore.getState();
    if (state.theme === 'system') {
      return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return state.theme;
  },
  
  /**
   * Get app configuration
   */
  getAppConfig: () => {
    const state = useAppStore.getState();
    return {
      theme: state.theme,
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
      }
    };
  },
  
  /**
   * Initialize app store with default values
   */
  initialize: () => {
    const state = useAppStore.getState();
    
    // Set initial theme
    if (typeof window !== 'undefined') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      const theme = state.theme === 'system' ? systemTheme : state.theme;
      document.documentElement.setAttribute('data-theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    logger.info('App store initialized');
  }
};

// Store subscriptions for external integrations
export const appStoreSubscriptions = {
  /**
   * Subscribe to theme changes
   */
  onThemeChange: (callback: (theme: string) => void) => {
    return useAppStore.subscribe(
      (state, prevState) => {
        const { theme } = state;
        const { theme: prevTheme } = prevState;
        if (theme !== prevTheme) {
          callback(theme);
        }
      }
    );
  },
  
  /**
   * Subscribe to sidebar changes
   */
  onSidebarChange: (callback: (collapsed: boolean) => void) => {
    return useAppStore.subscribe(
      (state, prevState) => {
        const { sidebarCollapsed } = state;
        const { sidebarCollapsed: prevCollapsed } = prevState;
        if (sidebarCollapsed !== prevCollapsed) {
          callback(sidebarCollapsed);
        }
      }
    );
  },
  
  /**
   * Subscribe to feature flag changes
   */
  onFeatureFlagChange: (flag: string, callback: (enabled: boolean) => void) => {
    return useAppStore.subscribe(
      (state, prevState) => {
        const enabled = state.features[flag];
        const prevEnabled = prevState.features[flag];
        if (enabled !== prevEnabled) {
          callback(enabled ?? false);
        }
      }
    );
  },
  
  /**
   * Subscribe to settings changes
   */
  onSettingsChange: (callback: (settings: AppStore['settings']) => void) => {
    return useAppStore.subscribe(
      (state, prevState) => {
        const { settings } = state;
        const { settings: prevSettings } = prevState;
        if (settings !== prevSettings) {
          callback(settings);
        }
      }
    );
  }
};

// Store debugging utilities
export const appStoreDebug = {
  /**
   * Log current app state
   */
  logState: () => {
    const state = useAppStore.getState();
    logger.debug('App Store State', {
      theme: state.theme,
      sidebarCollapsed: state.sidebarCollapsed,
      features: state.features,
      settings: state.settings,
      currentRoute: state.currentRoute,
      isLoading: state.isLoading,
      error: state.error
    });
  },
  
  /**
   * Log feature flags
   */
  logFeatureFlags: () => {
    const state = useAppStore.getState();
    logger.debug('Feature Flags', {
      enabled: Object.entries(state.features).filter(([_, enabled]) => enabled),
      disabled: Object.entries(state.features).filter(([_, enabled]) => !enabled),
      total: Object.keys(state.features).length
    });
  },
  
  /**
   * Log app settings
   */
  logSettings: () => {
    const state = useAppStore.getState();
    logger.debug('App Settings', state.settings);
  },
  
  /**
   * Reset store to initial state
   */
  reset: () => {
    useAppStore.getState().resetSettings();
    logger.info('App store reset to initial state');
  }
};
