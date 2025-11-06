/**
 * Notification Store - Zustand Implementation
 * 
 * Global notification state management including toast notifications,
 * system alerts, and user feedback. Consolidates multiple notification
 * systems into a unified store.
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import type { AdminNotification } from '@/features/admin/types';
import { logger } from '@/lib/utils/logger';

import type { Notification, BaseStore } from './types';


// Notification store state interface
type NotificationStore = {
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  
  // Admin notifications
  adminNotifications: AdminNotification[];
  adminUnreadCount: number;
  
  // Settings
  settings: {
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    duration: number;
    maxNotifications: number;
    enableSound: boolean;
    enableHaptics: boolean;
    enableAutoDismiss: boolean;
    enableStacking: boolean;
  };
  
  // Loading states
  isAdding: boolean;
  isRemoving: boolean;
  
  // Actions - Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  clearByType: (type: Notification['type']) => void;
  
  // Actions - Admin Notifications
  addAdminNotification: (notification: Omit<AdminNotification, 'id' | 'created_at' | 'read'>) => void;
  removeAdminNotification: (id: string) => void;
  markAdminNotificationAsRead: (id: string) => void;
  markAllAdminNotificationsAsRead: () => void;
  clearAllAdminNotifications: () => void;
  clearAdminNotificationsByType: (type: AdminNotification['type']) => void;
  
  // Actions - Settings
  updateSettings: (settings: Partial<NotificationStore['settings']>) => void;
  resetSettings: () => void;
  
  // Actions - Loading states
  setAdding: (adding: boolean) => void;
  setRemoving: (removing: boolean) => void;
  
  // Actions - Utility
  getNotification: (id: string) => Notification | undefined;
  getNotificationsByType: (type: Notification['type']) => Notification[];
  getUnreadNotifications: () => Notification[];
} & BaseStore

// Default notification settings
const defaultSettings = {
  position: 'top-right' as const,
  duration: 5000,
  maxNotifications: 5,
  enableSound: true,
  enableHaptics: true,
  enableAutoDismiss: true,
  enableStacking: true,
};

// Create notification store with middleware
export const useNotificationStore = create<NotificationStore>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      notifications: [],
      unreadCount: 0,
      adminNotifications: [],
      adminUnreadCount: 0,
      settings: defaultSettings,
      isLoading: false,
      isAdding: false,
      isRemoving: false,
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
      
      // Notification actions
      addNotification: (notification) => set((state) => {
        const newNotification: Notification = {
          ...notification,
          id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          read: false,
        } as Notification;
        
        // Add to notifications array
        if (state.settings.enableStacking) {
          state.notifications.unshift(newNotification);
        } else {
          state.notifications = [newNotification];
        }
        
        // Limit notifications
        if (state.notifications.length > state.settings.maxNotifications) {
          state.notifications = state.notifications.slice(0, state.settings.maxNotifications);
        }
        
        // Update unread count
        state.unreadCount = state.notifications.filter(n => !n.read).length;
        
        // Auto-dismiss if enabled
        if (state.settings.enableAutoDismiss && newNotification.duration !== 0) {
          setTimeout(() => {
            const currentState = get();
            if (currentState.notifications.find(n => n.id === newNotification.id)) {
              currentState.removeNotification(newNotification.id);
            }
          }, newNotification.duration ?? state.settings.duration);
        }
        
        // Play sound if enabled (defer to avoid act() warnings)
        if (state.settings.enableSound && typeof window !== 'undefined') {
          setTimeout(() => {
            try {
              const audio = new Audio('/sounds/notification.mp3');
              audio.volume = 0.3;
              audio.play().catch(() => {
                // Ignore audio play errors
              });
            } catch {
              // Ignore audio errors
            }
          }, 0);
        }
        
        // Haptic feedback if enabled (defer to avoid act() warnings)
        if (state.settings.enableHaptics && typeof window !== 'undefined' && 'vibrate' in navigator) {
          setTimeout(() => {
            try {
              navigator.vibrate(50);
            } catch {
              // Ignore vibration errors
            }
          }, 0);
        }
        
      }),
      
      removeNotification: (id) => set((state) => {
        const notification = state.notifications.find(n => n.id === id);
        if (notification) {
          state.notifications = state.notifications.filter(n => n.id !== id);
          state.unreadCount = state.notifications.filter(n => !n.read).length;
        }
      }),
      
      markAsRead: (id) => set((state) => {
        const notification = state.notifications.find(n => n.id === id);
        if (notification && !notification.read) {
          notification.read = true;
          state.unreadCount = state.notifications.filter(n => !n.read).length;
        }
      }),
      
      markAllAsRead: () => set((state) => {
        state.notifications.forEach(n => n.read = true);
        state.unreadCount = 0;
      }),
      
      clearAll: () => set((state) => {
        state.notifications = [];
        state.unreadCount = 0;
      }),
      
      clearByType: (type) => set((state) => {
        const beforeCount = state.notifications.length;
        state.notifications = state.notifications.filter(n => n.type !== type);
        state.unreadCount = state.notifications.filter(n => !n.read).length;
        logger.debug(`Cleared ${beforeCount - state.notifications.length} notifications of type ${type}`);
      }),
      
      // Admin notification actions
      addAdminNotification: (notification) => set((state) => {
        const newAdminNotification: AdminNotification = {
          ...notification,
          id: `admin_notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date().toISOString(),
          read: false,
        };
        
        // Add to admin notifications array
        if (state.settings.enableStacking) {
          state.adminNotifications.unshift(newAdminNotification);
        } else {
          state.adminNotifications = [newAdminNotification];
        }
        
        // Limit admin notifications
        if (state.adminNotifications.length > state.settings.maxNotifications) {
          state.adminNotifications = state.adminNotifications.slice(0, state.settings.maxNotifications);
        }
        
        // Update admin unread count
        state.adminUnreadCount = state.adminNotifications.filter(n => !n.read).length;
        
        // Auto-dismiss if enabled (admin notifications have shorter default duration)
        if (state.settings.enableAutoDismiss && notification.type !== 'error') {
          setTimeout(() => {
            const currentState = get();
            if (currentState.adminNotifications.find(n => n.id === newAdminNotification.id)) {
              currentState.removeAdminNotification(newAdminNotification.id);
            }
          }, 3000); // 3 seconds for admin notifications
        }
        
      }),
      
      removeAdminNotification: (id) => set((state) => {
        const notification = state.adminNotifications.find(n => n.id === id);
        if (notification) {
          state.adminNotifications = state.adminNotifications.filter(n => n.id !== id);
          state.adminUnreadCount = state.adminNotifications.filter(n => !n.read).length;
        }
      }),
      
      markAdminNotificationAsRead: (id) => set((state) => {
        const notification = state.adminNotifications.find(n => n.id === id);
        if (notification && !notification.read) {
          notification.read = true;
          state.adminUnreadCount = state.adminNotifications.filter(n => !n.read).length;
        }
      }),
      
      markAllAdminNotificationsAsRead: () => set((state) => {
        state.adminNotifications.forEach(n => n.read = true);
        state.adminUnreadCount = 0;
      }),
      
      clearAllAdminNotifications: () => set((state) => {
        state.adminNotifications = [];
        state.adminUnreadCount = 0;
      }),
      
      clearAdminNotificationsByType: (type) => set((state) => {
        const beforeCount = state.adminNotifications.length;
        state.adminNotifications = state.adminNotifications.filter(n => n.type !== type);
        state.adminUnreadCount = state.adminNotifications.filter(n => !n.read).length;
        logger.debug(`Cleared ${beforeCount - state.adminNotifications.length} admin notifications of type ${type}`);
      }),
      
      // Settings actions
      updateSettings: (settings) => set((state) => {
        state.settings = { ...state.settings, ...settings };
      }),
      
      resetSettings: () => set((state) => {
        state.settings = { ...defaultSettings };
        logger.info('Notification settings reset to defaults');
      }),
      
      // Loading state actions
      setAdding: (adding) => set((state) => {
        state.isAdding = adding;
      }),
      
      setRemoving: (removing) => set((state) => {
        state.isRemoving = removing;
      }),
      
      // Utility actions
      getNotification: (id) => {
        const state = get();
        return state.notifications.find(n => n.id === id);
      },
      
      getNotificationsByType: (type) => {
        const state = get();
        return state.notifications.filter(n => n.type === type);
      },
      
      getUnreadNotifications: () => {
        const state = get();
        return state.notifications.filter(n => !n.read);
      },
    })),
    { name: 'notification-store' }
));

// Store selectors for optimized re-renders
export const useNotifications = () => useNotificationStore(state => state.notifications);
export const useUnreadCount = () => useNotificationStore(state => state.unreadCount);
export const useNotificationSettings = () => useNotificationStore(state => state.settings);
export const useNotificationLoading = () => useNotificationStore(state => state.isLoading);
export const useNotificationError = () => useNotificationStore(state => state.error);

// Admin notification selectors
export const useAdminNotifications = () => useNotificationStore(state => state.adminNotifications);
export const useAdminUnreadCount = () => useNotificationStore(state => state.adminUnreadCount);

// Action selectors
export const useNotificationActions = () => useNotificationStore(state => ({
  addNotification: state.addNotification,
  removeNotification: state.removeNotification,
  markAsRead: state.markAsRead,
  markAllAsRead: state.markAllAsRead,
  clearAll: state.clearAll,
  clearByType: state.clearByType,
  addAdminNotification: state.addAdminNotification,
  removeAdminNotification: state.removeAdminNotification,
  markAdminNotificationAsRead: state.markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead: state.markAllAdminNotificationsAsRead,
  clearAllAdminNotifications: state.clearAllAdminNotifications,
  clearAdminNotificationsByType: state.clearAdminNotificationsByType,
  updateSettings: state.updateSettings,
  resetSettings: state.resetSettings,
  setAdding: state.setAdding,
  setRemoving: state.setRemoving,
  getNotification: state.getNotification,
  getNotificationsByType: state.getNotificationsByType,
  getUnreadNotifications: state.getUnreadNotifications,
}));

// Computed selectors
export const useNotificationsByType = (type: Notification['type']) => useNotificationStore(state => {
  return state.notifications.filter(n => n.type === type);
});

export const useUnreadNotifications = () => useNotificationStore(state => {
  return state.notifications.filter(n => !n.read);
});

export const useNotificationPosition = () => useNotificationStore(state => state.settings.position);
export const useNotificationDuration = () => useNotificationStore(state => state.settings.duration);
export const useNotificationMaxCount = () => useNotificationStore(state => state.settings.maxNotifications);

// Admin notification computed selectors
export const useAdminNotificationsByType = (type: AdminNotification['type']) => useNotificationStore(state => {
  return state.adminNotifications.filter(n => n.type === type);
});

export const useUnreadAdminNotifications = () => useNotificationStore(state => {
  return state.adminNotifications.filter(n => !n.read);
});

// Store utilities
export const notificationStoreUtils = {
  /**
   * Create a success notification
   */
  createSuccess: (title: string, message: string, duration?: number) => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({
      type: 'success',
      title,
      message,
      duration: duration ?? 5000,
    });
  },
  
  /**
   * Create an error notification
   */
  createError: (title: string, message: string, duration?: number) => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({
      type: 'error',
      title,
      message,
      duration: duration ?? 0, // Error notifications don't auto-dismiss by default
    });
  },
  
  /**
   * Create a warning notification
   */
  createWarning: (title: string, message: string, duration?: number) => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({
      type: 'warning',
      title,
      message,
      duration: duration ?? 5000,
    });
  },
  
  /**
   * Create an info notification
   */
  createInfo: (title: string, message: string, duration?: number) => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({
      type: 'info',
      title,
      message,
      duration: duration ?? 5000,
    });
  },
  
  /**
   * Create a persistent notification
   */
  createPersistent: (title: string, message: string, type: Notification['type'] = 'info') => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({
      type,
      title,
      message,
      duration: 0, // Never auto-dismiss
      persistent: true,
    });
  },
  
  /**
   * Create a notification with actions
   */
  createWithActions: (
    title: string, 
    message: string, 
    type: Notification['type'],
    actions: Array<{ label: string; action: () => void }>,
    duration?: number
  ) => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({
      type,
      title,
      message,
      duration: duration ?? 0,
      actions,
    });
  },
  
  /**
   * Get notification statistics
   */
  getStats: () => {
    const state = useNotificationStore.getState();
    const notifications = state.notifications;
    
    return {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      byType: {
        success: notifications.filter(n => n.type === 'success').length,
        error: notifications.filter(n => n.type === 'error').length,
        warning: notifications.filter(n => n.type === 'warning').length,
        info: notifications.filter(n => n.type === 'info').length,
      },
      oldest: notifications.length > 0 ? notifications[notifications.length - 1]?.timestamp : null,
      newest: notifications.length > 0 ? notifications[0]?.timestamp : null,
    };
  },
  
  /**
   * Clean up old notifications
   */
  cleanup: (maxAge: number = 24 * 60 * 60 * 1000) => { // 24 hours default
    const state = useNotificationStore.getState();
    const now = Date.now();
    const cutoff = now - maxAge;
    
    const oldNotifications = state.notifications.filter(n => {
      const notificationTime = new Date(n.timestamp).getTime();
      return notificationTime < cutoff;
    });
    
    if (oldNotifications.length > 0) {
      oldNotifications.forEach(n => state.removeNotification(n.id));
      logger.debug('Cleaned up old notifications', { count: oldNotifications.length });
    }
  },
  
  /**
   * Create an admin success notification
   */
  createAdminSuccess: (title: string, message: string) => {
    const { addAdminNotification } = useNotificationStore.getState();
    addAdminNotification({
      type: 'success',
      title,
      message,
    });
  },
  
  /**
   * Create an admin error notification
   */
  createAdminError: (title: string, message: string) => {
    const { addAdminNotification } = useNotificationStore.getState();
    addAdminNotification({
      type: 'error',
      title,
      message,
    });
  },
  
  /**
   * Create an admin warning notification
   */
  createAdminWarning: (title: string, message: string) => {
    const { addAdminNotification } = useNotificationStore.getState();
    addAdminNotification({
      type: 'warning',
      title,
      message,
    });
  },
  
  /**
   * Create an admin info notification
   */
  createAdminInfo: (title: string, message: string) => {
    const { addAdminNotification } = useNotificationStore.getState();
    addAdminNotification({
      type: 'info',
      title,
      message,
    });
  },
  
  /**
   * Get admin notification statistics
   */
  getAdminStats: () => {
    const state = useNotificationStore.getState();
    const notifications = state.adminNotifications;
    
    return {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      byType: {
        success: notifications.filter(n => n.type === 'success').length,
        error: notifications.filter(n => n.type === 'error').length,
        warning: notifications.filter(n => n.type === 'warning').length,
        info: notifications.filter(n => n.type === 'info').length,
      },
      oldest: notifications.length > 0 ? notifications[notifications.length - 1]?.created_at : null,
      newest: notifications.length > 0 ? notifications[0]?.created_at : null,
    };
  }
};

// Store subscriptions for external integrations
export const notificationStoreSubscriptions = {
  /**
   * Subscribe to notification changes
   */
  onNotificationChange: (callback: (notifications: Notification[]) => void) => {
    return useNotificationStore.subscribe(
      (state) => {
        callback(state.notifications);
      }
    );
  },
  
  /**
   * Subscribe to unread count changes
   */
  onUnreadCountChange: (callback: (count: number) => void) => {
    return useNotificationStore.subscribe(
      (state) => {
        callback(state.unreadCount);
      }
    );
  },
  
  /**
   * Subscribe to specific notification type changes
   */
  onNotificationTypeChange: (type: Notification['type'], callback: (notifications: Notification[]) => void) => {
    return useNotificationStore.subscribe(
      (state) => {
        callback(state.notifications.filter(n => n.type === type));
      }
    );
  }
};

// Store debugging utilities
export const notificationStoreDebug = {
  /**
   * Log current notification state
   */
  logState: () => {
    const state = useNotificationStore.getState();
    logger.debug('Notification Store State', {
      total: state.notifications.length,
      unread: state.unreadCount,
      settings: state.settings,
      isLoading: state.isLoading,
      error: state.error
    });
  },
  
  /**
   * Log all notifications
   */
  logNotifications: () => {
    const state = useNotificationStore.getState();
    logger.debug('All Notifications', { notifications: state.notifications });
  },
  
  /**
   * Log notification statistics
   */
  logStats: () => {
    const stats = notificationStoreUtils.getStats();
    logger.debug('Notification Statistics', stats);
  },
  
  /**
   * Clear all notifications
   */
  clearAll: () => {
    useNotificationStore.getState().clearAll();
    logger.info('All notifications cleared');
  }
};
