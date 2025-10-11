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
import { withOptional } from '@/lib/utils/objects';
import type { Notification, BaseStore } from './types';

// Notification store state interface
type NotificationStore = {
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  
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
        const newNotification: Notification = withOptional(notification, {
          id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          read: false,
        }) as Notification;
        
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
          }, newNotification.duration || state.settings.duration);
        }
        
        // Play sound if enabled
        if (state.settings.enableSound && typeof window !== 'undefined') {
          try {
            const audio = new Audio('/sounds/notification.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => {
              // Ignore audio play errors
            });
          } catch {
            // Ignore audio errors
          }
        }
        
        // Haptic feedback if enabled
        if (state.settings.enableHaptics && typeof window !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(50);
          } catch {
            // Ignore vibration errors
          }
        }
        
        console.log('Notification added:', newNotification.title);
      }),
      
      removeNotification: (id) => set((state) => {
        const notification = state.notifications.find(n => n.id === id);
        if (notification) {
          state.notifications = state.notifications.filter(n => n.id !== id);
          state.unreadCount = state.notifications.filter(n => !n.read).length;
          console.log('Notification removed:', notification.title);
        }
      }),
      
      markAsRead: (id) => set((state) => {
        const notification = state.notifications.find(n => n.id === id);
        if (notification && !notification.read) {
          notification.read = true;
          state.unreadCount = state.notifications.filter(n => !n.read).length;
          console.log('Notification marked as read:', notification.title);
        }
      }),
      
      markAllAsRead: () => set((state) => {
        state.notifications.forEach(n => n.read = true);
        state.unreadCount = 0;
        console.log('All notifications marked as read');
      }),
      
      clearAll: () => set((state) => {
        state.notifications = [];
        state.unreadCount = 0;
        console.log('All notifications cleared');
      }),
      
      clearByType: (type) => set((state) => {
        const beforeCount = state.notifications.length;
        state.notifications = state.notifications.filter(n => n.type !== type);
        state.unreadCount = state.notifications.filter(n => !n.read).length;
        console.log(`Notifications of type ${type} cleared:`, beforeCount - state.notifications.length);
      }),
      
      // Settings actions
      updateSettings: (settings) => set((state) => {
        state.settings = withOptional(state.settings, settings);
        console.log('Notification settings updated:', settings);
      }),
      
      resetSettings: () => set((state) => {
        state.settings = withOptional(defaultSettings);
        console.log('Notification settings reset to defaults');
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

// Action selectors
export const useNotificationActions = () => useNotificationStore(state => ({
  addNotification: state.addNotification,
  removeNotification: state.removeNotification,
  markAsRead: state.markAsRead,
  markAllAsRead: state.markAllAsRead,
  clearAll: state.clearAll,
  clearByType: state.clearByType,
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
      duration,
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
      duration: duration || 0, // Error notifications don't auto-dismiss by default
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
      duration,
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
      duration,
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
      duration,
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
      oldest: notifications.length > 0 ? notifications[notifications.length - 1].timestamp : null,
      newest: notifications.length > 0 ? notifications[0].timestamp : null,
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
      console.log(`Cleaned up ${oldNotifications.length} old notifications`);
    }
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
    console.log('Notification Store State:', {
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
    console.log('All Notifications:', state.notifications);
  },
  
  /**
   * Log notification statistics
   */
  logStats: () => {
    const stats = notificationStoreUtils.getStats();
    console.log('Notification Statistics:', stats);
  },
  
  /**
   * Clear all notifications
   */
  clearAll: () => {
    useNotificationStore.getState().clearAll();
    console.log('All notifications cleared');
  }
};
