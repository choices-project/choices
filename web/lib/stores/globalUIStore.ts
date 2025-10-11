/**
 * Global UI Store
 * 
 * Centralized Zustand store for global UI state management including
 * theme, sidebar, notifications, modals, and app-wide UI state.
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { withOptional } from '@/lib/utils/objects';

// ============================================================================
// TYPES
// ============================================================================

export type Theme = 'light' | 'dark' | 'system';

export type Notification = {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
  timestamp: Date;
  read: boolean;
}

export type SidebarState = {
  isOpen: boolean;
  isCollapsed: boolean;
  width: number;
  pinned: boolean;
  activeSection: string | null;
}

export type ModalState = {
  activeModal: string | null;
  modalData: any;
  stack: Array<{
    id: string;
    data: any;
  }>;
}

export type GlobalUIStore = {
  // Theme State
  theme: Theme;
  systemTheme: 'light' | 'dark';
  resolvedTheme: 'light' | 'dark';
  
  // Sidebar State
  sidebar: SidebarState;
  
  // Notification State
  notifications: {
    enabled: boolean;
    permission: NotificationPermission;
    queue: Notification[];
    unreadCount: number;
    settings: {
      desktop: boolean;
      mobile: boolean;
      email: boolean;
      push: boolean;
    };
  };
  
  // Modal State
  modals: ModalState;
  
  // Loading States
  isLoading: boolean;
  isInitializing: boolean;
  
  // Error State
  error: string | null;
  
  // Actions - Theme
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  updateSystemTheme: (systemTheme: 'light' | 'dark') => void;
  
  // Actions - Sidebar
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setSidebarPinned: (pinned: boolean) => void;
  setActiveSection: (section: string | null) => void;
  
  // Actions - Notifications
  showNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  hideNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  requestNotificationPermission: () => Promise<boolean>;
  updateNotificationSettings: (settings: Partial<GlobalUIStore['notifications']['settings']>) => void;
  
  // Actions - Modals
  openModal: (modalId: string, data?: any) => void;
  closeModal: () => void;
  closeAllModals: () => void;
  pushModal: (modalId: string, data?: any) => void;
  popModal: () => void;
  
  // Actions - Loading & Error
  setLoading: (loading: boolean) => void;
  setInitializing: (initializing: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Initialization
  initialize: () => void;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useGlobalUIStore = create<GlobalUIStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial State
        theme: 'system',
        systemTheme: 'light',
        resolvedTheme: 'light',
        
        sidebar: {
          isOpen: true,
          isCollapsed: false,
          width: 280,
          pinned: false,
          activeSection: null
        },
        
        notifications: {
          enabled: false,
          permission: 'default',
          queue: [],
          unreadCount: 0,
          settings: {
            desktop: true,
            mobile: true,
            email: false,
            push: false
          }
        },
        
        modals: {
          activeModal: null,
          modalData: null,
          stack: []
        },
        
        isLoading: false,
        isInitializing: true,
        error: null,

        // Theme Actions
        setTheme: (theme: Theme) => {
          set((state) => {
            state.theme = theme;
            state.resolvedTheme = theme === 'system' ? state.systemTheme : theme;
          });
          
          // Apply theme to document
          if (typeof document !== 'undefined') {
            const resolvedTheme = theme === 'system' ? get().systemTheme : theme;
            document.documentElement.setAttribute('data-theme', resolvedTheme);
            document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
          }
        },

        toggleTheme: () => {
          const currentTheme = get().theme;
          const newTheme = currentTheme === 'light' ? 'dark' : 'light';
          get().setTheme(newTheme);
        },

        updateSystemTheme: (systemTheme: 'light' | 'dark') => {
          set((state) => {
            state.systemTheme = systemTheme;
            if (state.theme === 'system') {
              state.resolvedTheme = systemTheme;
            }
          });
          
          // Apply system theme if current theme is 'system'
          if (get().theme === 'system') {
            if (typeof document !== 'undefined') {
              document.documentElement.setAttribute('data-theme', systemTheme);
              document.documentElement.classList.toggle('dark', systemTheme === 'dark');
            }
          }
        },

        // Sidebar Actions
        toggleSidebar: () => {
          set((state) => {
            state.sidebar.isOpen = !state.sidebar.isOpen;
          });
        },

        setSidebarOpen: (isOpen: boolean) => {
          set((state) => {
            state.sidebar.isOpen = isOpen;
          });
        },

        setSidebarCollapsed: (collapsed: boolean) => {
          set((state) => {
            state.sidebar.isCollapsed = collapsed;
          });
        },

        setSidebarWidth: (width: number) => {
          set((state) => {
            state.sidebar.width = Math.max(200, Math.min(400, width));
          });
        },

        setSidebarPinned: (pinned: boolean) => {
          set((state) => {
            state.sidebar.pinned = pinned;
          });
        },

        setActiveSection: (section: string | null) => {
          set((state) => {
            state.sidebar.activeSection = section;
          });
        },

        // Notification Actions
        showNotification: (notification) => {
          const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const newNotification: Notification = withOptional(notification, {
            id,
            timestamp: new Date(),
            read: false
          });

          set((state) => {
            state.notifications.queue.push(newNotification);
            state.notifications.unreadCount += 1;
          });

          // Auto-hide notification after duration
          if (notification.duration && notification.duration > 0) {
            setTimeout(() => {
              get().hideNotification(id);
            }, notification.duration);
          }

          // Show browser notification if permission granted
          if (get().notifications.permission === 'granted' && notification.type !== 'info') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.ico'
            });
          }
        },

        hideNotification: (id: string) => {
          set((state) => {
            const index = state.notifications.queue.findIndex(n => n.id === id);
            if (index !== -1) {
              const notification = state.notifications.queue[index];
              if (!notification.read) {
                state.notifications.unreadCount = Math.max(0, state.notifications.unreadCount - 1);
              }
              state.notifications.queue.splice(index, 1);
            }
          });
        },

        markNotificationRead: (id: string) => {
          set((state) => {
            const notification = state.notifications.queue.find(n => n.id === id);
            if (notification && !notification.read) {
              notification.read = true;
              state.notifications.unreadCount = Math.max(0, state.notifications.unreadCount - 1);
            }
          });
        },

        markAllNotificationsRead: () => {
          set((state) => {
            state.notifications.queue.forEach(notification => {
              notification.read = true;
            });
            state.notifications.unreadCount = 0;
          });
        },

        clearNotifications: () => {
          set((state) => {
            state.notifications.queue = [];
            state.notifications.unreadCount = 0;
          });
        },

        requestNotificationPermission: async () => {
          if (typeof window === 'undefined' || !('Notification' in window)) {
            return false;
          }

          try {
            const permission = await Notification.requestPermission();
            set((state) => {
              state.notifications.permission = permission;
              state.notifications.enabled = permission === 'granted';
            });
            return permission === 'granted';
          } catch (error) {
            console.error('Failed to request notification permission:', error);
            return false;
          }
        },

        updateNotificationSettings: (settings) => {
          set((state) => {
            state.notifications.settings = withOptional(state.notifications.settings, settings);
          });
        },

        // Modal Actions
        openModal: (modalId: string, data?: any) => {
          set((state) => {
            state.modals.activeModal = modalId;
            state.modals.modalData = data;
            state.modals.stack = [{ id: modalId, data }];
          });
        },

        closeModal: () => {
          set((state) => {
            if (state.modals.stack.length > 1) {
              state.modals.stack.pop();
              const previousModal = state.modals.stack[state.modals.stack.length - 1];
              state.modals.activeModal = previousModal.id;
              state.modals.modalData = previousModal.data;
            } else {
              state.modals.activeModal = null;
              state.modals.modalData = null;
              state.modals.stack = [];
            }
          });
        },

        closeAllModals: () => {
          set((state) => {
            state.modals.activeModal = null;
            state.modals.modalData = null;
            state.modals.stack = [];
          });
        },

        pushModal: (modalId: string, data?: any) => {
          set((state) => {
            state.modals.stack.push({ id: modalId, data });
            state.modals.activeModal = modalId;
            state.modals.modalData = data;
          });
        },

        popModal: () => {
          get().closeModal();
        },

        // Loading & Error Actions
        setLoading: (loading: boolean) => {
          set((state) => {
            state.isLoading = loading;
          });
        },

        setInitializing: (initializing: boolean) => {
          set((state) => {
            state.isInitializing = initializing;
          });
        },

        setError: (error: string | null) => {
          set((state) => {
            state.error = error;
          });
        },

        clearError: () => {
          set((state) => {
            state.error = null;
          });
        },

        // Initialization
        initialize: () => {
          set((state) => {
            state.isInitializing = true;
            state.error = null;
          });

          try {
            // Initialize theme
            if (typeof window !== 'undefined') {
              const savedTheme = localStorage.getItem('theme') as Theme;
              const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              
              set((state) => {
                state.theme = savedTheme || 'system';
                state.systemTheme = systemTheme;
                state.resolvedTheme = state.theme === 'system' ? systemTheme : state.theme;
              });

              // Apply theme
              const resolvedTheme = get().resolvedTheme;
              document.documentElement.setAttribute('data-theme', resolvedTheme);
              document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');

              // Listen for system theme changes
              const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
              const handleSystemThemeChange = (e: MediaQueryListEvent) => {
                get().updateSystemTheme(e.matches ? 'dark' : 'light');
              };
              mediaQuery.addEventListener('change', handleSystemThemeChange);
            }

            // Initialize notifications
            if (typeof window !== 'undefined' && 'Notification' in window) {
              set((state) => {
                state.notifications.permission = Notification.permission;
                state.notifications.enabled = Notification.permission === 'granted';
              });
            }

            set((state) => {
              state.isInitializing = false;
            });

          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to initialize global UI';
              state.isInitializing = false;
            });
          }
        }
      })),
      {
        name: 'global-ui-storage',
        partialize: (state) => ({
          theme: state.theme,
          sidebar: state.sidebar,
          notifications: {
            enabled: state.notifications.enabled,
            settings: state.notifications.settings
          }
        })
      }
    ),
    { name: 'global-ui-store' }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

export const useGlobalUI = () => useGlobalUIStore();

// Theme Selectors
export const useTheme = () => useGlobalUIStore(state => state.theme);
export const useResolvedTheme = () => useGlobalUIStore(state => state.resolvedTheme);
export const useSystemTheme = () => useGlobalUIStore(state => state.systemTheme);

// Sidebar Selectors
export const useSidebar = () => useGlobalUIStore(state => state.sidebar);
export const useSidebarOpen = () => useGlobalUIStore(state => state.sidebar.isOpen);
export const useSidebarCollapsed = () => useGlobalUIStore(state => state.sidebar.isCollapsed);
export const useSidebarWidth = () => useGlobalUIStore(state => state.sidebar.width);
export const useSidebarPinned = () => useGlobalUIStore(state => state.sidebar.pinned);
export const useActiveSection = () => useGlobalUIStore(state => state.sidebar.activeSection);

// Notification Selectors
export const useNotifications = () => useGlobalUIStore(state => state.notifications);
export const useNotificationQueue = () => useGlobalUIStore(state => state.notifications.queue);
export const useUnreadCount = () => useGlobalUIStore(state => state.notifications.unreadCount);
export const useNotificationPermission = () => useGlobalUIStore(state => state.notifications.permission);
export const useNotificationSettings = () => useGlobalUIStore(state => state.notifications.settings);

// Modal Selectors
export const useModals = () => useGlobalUIStore(state => state.modals);
export const useActiveModal = () => useGlobalUIStore(state => state.modals.activeModal);
export const useModalData = () => useGlobalUIStore(state => state.modals.modalData);
export const useModalStack = () => useGlobalUIStore(state => state.modals.stack);

// Loading & Error Selectors
export const useGlobalUILoading = () => useGlobalUIStore(state => state.isLoading);
export const useGlobalUIInitializing = () => useGlobalUIStore(state => state.isInitializing);
export const useGlobalUIError = () => useGlobalUIStore(state => state.error);

// ============================================================================
// ACTIONS
// ============================================================================

export const useGlobalUIActions = () => useGlobalUIStore(state => ({
  // Theme Actions
  setTheme: state.setTheme,
  toggleTheme: state.toggleTheme,
  updateSystemTheme: state.updateSystemTheme,
  
  // Sidebar Actions
  toggleSidebar: state.toggleSidebar,
  setSidebarOpen: state.setSidebarOpen,
  setSidebarCollapsed: state.setSidebarCollapsed,
  setSidebarWidth: state.setSidebarWidth,
  setSidebarPinned: state.setSidebarPinned,
  setActiveSection: state.setActiveSection,
  
  // Notification Actions
  showNotification: state.showNotification,
  hideNotification: state.hideNotification,
  markNotificationRead: state.markNotificationRead,
  markAllNotificationsRead: state.markAllNotificationsRead,
  clearNotifications: state.clearNotifications,
  requestNotificationPermission: state.requestNotificationPermission,
  updateNotificationSettings: state.updateNotificationSettings,
  
  // Modal Actions
  openModal: state.openModal,
  closeModal: state.closeModal,
  closeAllModals: state.closeAllModals,
  pushModal: state.pushModal,
  popModal: state.popModal,
  
  // Loading & Error Actions
  setLoading: state.setLoading,
  setInitializing: state.setInitializing,
  setError: state.setError,
  clearError: state.clearError,
  
  // Initialization
  initialize: state.initialize
}));

// ============================================================================
// UTILITIES
// ============================================================================

export const useThemeActions = () => useGlobalUIStore(state => ({
  setTheme: state.setTheme,
  toggleTheme: state.toggleTheme,
  updateSystemTheme: state.updateSystemTheme
}));

export const useSidebarActions = () => useGlobalUIStore(state => ({
  toggleSidebar: state.toggleSidebar,
  setSidebarOpen: state.setSidebarOpen,
  setSidebarCollapsed: state.setSidebarCollapsed,
  setSidebarWidth: state.setSidebarWidth,
  setSidebarPinned: state.setSidebarPinned,
  setActiveSection: state.setActiveSection
}));

export const useNotificationActions = () => useGlobalUIStore(state => ({
  showNotification: state.showNotification,
  hideNotification: state.hideNotification,
  markNotificationRead: state.markNotificationRead,
  markAllNotificationsRead: state.markAllNotificationsRead,
  clearNotifications: state.clearNotifications,
  requestNotificationPermission: state.requestNotificationPermission,
  updateNotificationSettings: state.updateNotificationSettings
}));

export const useModalActions = () => useGlobalUIStore(state => ({
  openModal: state.openModal,
  closeModal: state.closeModal,
  closeAllModals: state.closeAllModals,
  pushModal: state.pushModal,
  popModal: state.popModal
}));
