/**
 * UI Store - Zustand Implementation
 * 
 * Centralized UI state management for modals, navigation, sidebar,
 * and other UI components. Provides consistent UI state across the application.
 * 
 * Created: January 15, 2025
 * Status: ✅ ACTIVE
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';

import type { BaseStore } from './types';

// Modal state interface
export interface ModalState {
  id: string;
  isOpen: boolean;
  component?: React.ComponentType<any>;
  props?: Record<string, any>;
  onClose?: () => void;
  closable?: boolean;
  backdrop?: boolean;
}

// Sidebar state interface
export interface SidebarState {
  isOpen: boolean;
  isCollapsed: boolean;
  width: number;
  pinned: boolean;
  activeItem?: string;
}

// Navigation state interface
export interface NavigationState {
  currentRoute: string;
  previousRoute?: string;
  breadcrumbs: Array<{
    label: string;
    href: string;
  }>;
  history: string[];
  canGoBack: boolean;
  canGoForward: boolean;
}

// Toast state interface
export interface ToastState {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  persistent?: boolean;
}

// UI store interface
type UIStore = {
  // Modal state
  modals: Record<string, ModalState>;
  
  // Sidebar state
  sidebar: SidebarState;
  
  // Navigation state
  navigation: NavigationState;
  
  // Toast state
  toasts: ToastState[];
  
  // Loading states
  globalLoading: boolean;
  pageLoading: boolean;
  
  // Theme state
  theme: 'light' | 'dark' | 'system';
  systemTheme: 'light' | 'dark';
  
  // Screen state
  screenSize: 'mobile' | 'tablet' | 'desktop';
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  
  // Actions - Modal Management
  openModal: (id: string, component?: React.ComponentType<any>, props?: Record<string, any>, options?: Partial<ModalState>) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  updateModal: (id: string, updates: Partial<ModalState>) => void;
  
  // Actions - Sidebar Management
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setSidebarPinned: (pinned: boolean) => void;
  setSidebarActiveItem: (item: string) => void;
  
  // Actions - Navigation Management
  setCurrentRoute: (route: string) => void;
  setBreadcrumbs: (breadcrumbs: NavigationState['breadcrumbs']) => void;
  addToHistory: (route: string) => void;
  goBack: () => void;
  goForward: () => void;
  clearHistory: () => void;
  
  // Actions - Toast Management
  addToast: (toast: Omit<ToastState, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  updateToast: (id: string, updates: Partial<ToastState>) => void;
  
  // Actions - Loading Management
  setGlobalLoading: (loading: boolean) => void;
  setPageLoading: (loading: boolean) => void;
  
  // Actions - Theme Management
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setSystemTheme: (theme: 'light' | 'dark') => void;
  
  // Actions - Screen Management
  setScreenSize: (size: 'mobile' | 'tablet' | 'desktop') => void;
  updateScreenState: () => void;
  
  // Actions - Utility
  resetUI: () => void;
} & BaseStore;

// Create UI store with middleware
export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        modals: {},
        sidebar: {
          isOpen: true,
          isCollapsed: false,
          width: 256,
          pinned: false,
        },
        navigation: {
          currentRoute: '/',
          breadcrumbs: [],
          history: ['/'],
          canGoBack: false,
          canGoForward: false,
        },
        toasts: [],
        globalLoading: false,
        pageLoading: false,
        theme: 'system',
        systemTheme: 'light',
        screenSize: 'desktop',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isLoading: false,
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
        
        // Modal management actions
        openModal: (id, component, props, options = {}) => set((state) => {
          state.modals[id] = {
            id,
            isOpen: true,
            component,
            props,
            closable: true,
            backdrop: true,
            ...options,
          };
        }),
        
        closeModal: (id) => set((state) => {
          if (state.modals[id]) {
            state.modals[id].isOpen = false;
            // Call onClose if provided
            if (state.modals[id].onClose) {
              state.modals[id].onClose();
            }
          }
        }),
        
        closeAllModals: () => set((state) => {
          Object.values(state.modals).forEach(modal => {
            modal.isOpen = false;
            if (modal.onClose) {
              modal.onClose();
            }
          });
        }),
        
        updateModal: (id, updates) => set((state) => {
          if (state.modals[id]) {
            Object.assign(state.modals[id], updates);
          }
        }),
        
        // Sidebar management actions
        toggleSidebar: () => set((state) => {
          state.sidebar.isOpen = !state.sidebar.isOpen;
        }),
        
        setSidebarOpen: (open) => set((state) => {
          state.sidebar.isOpen = open;
        }),
        
        setSidebarCollapsed: (collapsed) => set((state) => {
          state.sidebar.isCollapsed = collapsed;
        }),
        
        setSidebarWidth: (width) => set((state) => {
          state.sidebar.width = Math.max(200, Math.min(400, width));
        }),
        
        setSidebarPinned: (pinned) => set((state) => {
          state.sidebar.pinned = pinned;
        }),
        
        setSidebarActiveItem: (item) => set((state) => {
          state.sidebar.activeItem = item;
        }),
        
        // Navigation management actions
        setCurrentRoute: (route) => set((state) => {
          state.navigation.previousRoute = state.navigation.currentRoute;
          state.navigation.currentRoute = route;
        }),
        
        setBreadcrumbs: (breadcrumbs) => set((state) => {
          state.navigation.breadcrumbs = breadcrumbs;
        }),
        
        addToHistory: (route) => set((state) => {
          const history = state.navigation.history;
          const currentIndex = history.indexOf(state.navigation.currentRoute);
          
          // Remove any forward history if we're not at the end
          if (currentIndex < history.length - 1) {
            history.splice(currentIndex + 1);
          }
          
          // Add new route
          history.push(route);
          state.navigation.currentRoute = route;
          state.navigation.canGoBack = history.length > 1;
          state.navigation.canGoForward = false;
        }),
        
        goBack: () => set((state) => {
          const history = state.navigation.history;
          const currentIndex = history.indexOf(state.navigation.currentRoute);
          
          if (currentIndex > 0) {
            const previousRoute = history[currentIndex - 1];
            state.navigation.previousRoute = state.navigation.currentRoute;
            state.navigation.currentRoute = previousRoute || '';
            state.navigation.canGoBack = currentIndex > 1;
            state.navigation.canGoForward = true;
          }
        }),
        
        goForward: () => set((state) => {
          const history = state.navigation.history;
          const currentIndex = history.indexOf(state.navigation.currentRoute);
          
          if (currentIndex < history.length - 1) {
            const nextRoute = history[currentIndex + 1];
            state.navigation.previousRoute = state.navigation.currentRoute;
            state.navigation.currentRoute = nextRoute || '';
            state.navigation.canGoBack = true;
            state.navigation.canGoForward = currentIndex < history.length - 2;
          }
        }),
        
        clearHistory: () => set((state) => {
          state.navigation.history = [state.navigation.currentRoute];
          state.navigation.canGoBack = false;
          state.navigation.canGoForward = false;
        }),
        
        // Toast management actions
        addToast: (toast) => set((state) => {
          const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          state.toasts.push({
            id,
            duration: 5000,
            persistent: false,
            ...toast,
            position: toast.position || 'top-right',
          });
          
          // Auto-remove toast after duration
          if (!toast.persistent && toast.duration !== 0) {
            setTimeout(() => {
              get().removeToast(id);
            }, toast.duration || 5000);
          }
        }),
        
        removeToast: (id) => set((state) => {
          state.toasts = state.toasts.filter(toast => toast.id !== id);
        }),
        
        clearAllToasts: () => set((state) => {
          state.toasts = [];
        }),
        
        updateToast: (id, updates) => set((state) => {
          const toast = state.toasts.find(t => t.id === id);
          if (toast) {
            Object.assign(toast, updates);
          }
        }),
        
        // Loading management actions
        setGlobalLoading: (loading) => set((state) => {
          state.globalLoading = loading;
        }),
        
        setPageLoading: (loading) => set((state) => {
          state.pageLoading = loading;
        }),
        
        // Theme management actions
        setTheme: (theme) => set((state) => {
          state.theme = theme;
        }),
        
        setSystemTheme: (theme) => set((state) => {
          state.systemTheme = theme;
        }),
        
        // Screen management actions
        setScreenSize: (size) => set((state) => {
          state.screenSize = size;
          state.isMobile = size === 'mobile';
          state.isTablet = size === 'tablet';
          state.isDesktop = size === 'desktop';
        }),
        
        updateScreenState: () => set((state) => {
          if (typeof window !== 'undefined') {
            const width = window.innerWidth;
            if (width < 768) {
              state.screenSize = 'mobile';
              state.isMobile = true;
              state.isTablet = false;
              state.isDesktop = false;
            } else if (width < 1024) {
              state.screenSize = 'tablet';
              state.isMobile = false;
              state.isTablet = true;
              state.isDesktop = false;
            } else {
              state.screenSize = 'desktop';
              state.isMobile = false;
              state.isTablet = false;
              state.isDesktop = true;
            }
          }
        }),
        
        // Utility actions
        resetUI: () => set((state) => {
          state.modals = {};
          state.sidebar = {
            isOpen: true,
            isCollapsed: false,
            width: 256,
            pinned: false,
          };
          state.navigation = {
            currentRoute: '/',
            breadcrumbs: [],
            history: ['/'],
            canGoBack: false,
            canGoForward: false,
          };
          state.toasts = [];
          state.globalLoading = false;
          state.pageLoading = false;
        }),
      })),
      {
        name: 'ui-store',
        partialize: (state) => ({
          sidebar: state.sidebar,
          theme: state.theme,
          navigation: {
            currentRoute: state.navigation.currentRoute,
            breadcrumbs: state.navigation.breadcrumbs,
            history: state.navigation.history,
          },
        }),
      }
    ),
    { name: 'UIStore' }
  )
);

// Store selectors for optimized re-renders
export const useModals = () => useUIStore(state => state.modals);
export const useModal = (id: string) => useUIStore(state => state.modals[id]);
export const useSidebar = () => useUIStore(state => state.sidebar);
export const useNavigation = () => useUIStore(state => state.navigation);
export const useToasts = () => useUIStore(state => state.toasts);
export const useGlobalLoading = () => useUIStore(state => state.globalLoading);
export const usePageLoading = () => useUIStore(state => state.pageLoading);
export const useTheme = () => useUIStore(state => state.theme);
export const useSystemTheme = () => useUIStore(state => state.systemTheme);
export const useScreenSize = () => useUIStore(state => state.screenSize);
export const useIsMobile = () => useUIStore(state => state.isMobile);
export const useIsTablet = () => useUIStore(state => state.isTablet);
export const useIsDesktop = () => useUIStore(state => state.isDesktop);

// Computed selectors
export const useIsModalOpen = (id: string) => useUIStore(state => state.modals[id]?.isOpen || false);
export const useActiveModals = () => useUIStore(state => 
  Object.values(state.modals).filter(modal => modal.isOpen)
);
export const useToastCount = () => useUIStore(state => state.toasts.length);
export const useCurrentBreadcrumbs = () => useUIStore(state => state.navigation.breadcrumbs);
export const useCanNavigate = () => useUIStore(state => ({
  canGoBack: state.navigation.canGoBack,
  canGoForward: state.navigation.canGoForward,
}));

// Action selectors
export const useUIActions = () => useUIStore(state => ({
  openModal: state.openModal,
  closeModal: state.closeModal,
  closeAllModals: state.closeAllModals,
  updateModal: state.updateModal,
  toggleSidebar: state.toggleSidebar,
  setSidebarOpen: state.setSidebarOpen,
  setSidebarCollapsed: state.setSidebarCollapsed,
  setSidebarWidth: state.setSidebarWidth,
  setSidebarPinned: state.setSidebarPinned,
  setSidebarActiveItem: state.setSidebarActiveItem,
  setCurrentRoute: state.setCurrentRoute,
  setBreadcrumbs: state.setBreadcrumbs,
  addToHistory: state.addToHistory,
  goBack: state.goBack,
  goForward: state.goForward,
  clearHistory: state.clearHistory,
  addToast: state.addToast,
  removeToast: state.removeToast,
  clearAllToasts: state.clearAllToasts,
  updateToast: state.updateToast,
  setGlobalLoading: state.setGlobalLoading,
  setPageLoading: state.setPageLoading,
  setTheme: state.setTheme,
  setSystemTheme: state.setSystemTheme,
  setScreenSize: state.setScreenSize,
  updateScreenState: state.updateScreenState,
  resetUI: state.resetUI,
}));

// Debug utilities
export const useUIDebug = () => useUIStore(state => ({
  modals: Object.keys(state.modals),
  activeModals: Object.values(state.modals).filter(modal => modal.isOpen).length,
  toasts: state.toasts.length,
  sidebarOpen: state.sidebar.isOpen,
  currentRoute: state.navigation.currentRoute,
  historyLength: state.navigation.history.length,
  theme: state.theme,
  screenSize: state.screenSize,
}));

// Subscription utilities
export const useUISubscription = (selector: (state: UIStore) => any, callback: (value: any) => void) => {
  return useUIStore.subscribe((state) => {
    const value = selector(state);
    callback(value);
  });
};
