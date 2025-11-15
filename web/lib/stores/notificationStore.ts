/**
 * Notification Store - Modernized Zustand Implementation
 *
 * Manages toast notifications, in-app alerts, and admin/system messages.
 * Provides standardized state/action exports, middleware composition,
 * and selector utilities aligned with the store modernization guidelines.
 *
 * Created: October 10, 2025
 * Updated: November 9, 2025
 */

import { useMemo } from 'react';
import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import type { AdminNotification, NewAdminNotification } from '@/features/admin/types';
import { logger } from '@/lib/utils/logger';

import { useAnalyticsStore } from './analyticsStore';
import { createSafeStorage } from './storage';
import type { BaseStore, Notification, ElectionNotificationContext } from './types';

export type NotificationSettings = {
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  duration: number;
  maxNotifications: number;
  enableSound: boolean;
  enableHaptics: boolean;
  enableAutoDismiss: boolean;
  enableStacking: boolean;
};

export type NotificationState = {
  notifications: Notification[];
  unreadCount: number;
  adminNotifications: AdminNotification[];
  adminUnreadCount: number;
  settings: NotificationSettings;
  isLoading: boolean;
  isAdding: boolean;
  isRemoving: boolean;
  error: string | null;
};

export type NotificationActions = Pick<BaseStore, 'setLoading' | 'setError' | 'clearError'> & {
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  clearByType: (type: Notification['type']) => void;

  addAdminNotification: (notification: NewAdminNotification) => void;
  removeAdminNotification: (id: string) => void;
  markAdminNotificationAsRead: (id: string) => void;
  markAllAdminNotificationsAsRead: () => void;
  clearAllAdminNotifications: () => void;
  clearAdminNotificationsByType: (type: AdminNotification['type']) => void;

  updateSettings: (settings: Partial<NotificationSettings>) => void;
  resetSettings: () => void;

  setAdding: (adding: boolean) => void;
  setRemoving: (removing: boolean) => void;

  getNotification: (id: string) => Notification | undefined;
  getNotificationsByType: (type: Notification['type']) => Notification[];
  getUnreadNotifications: () => Notification[];
};

export type NotificationStore = NotificationState & NotificationActions;

type NotificationStoreCreator = StateCreator<
  NotificationStore,
  [['zustand/devtools', never], ['zustand/persist', unknown], ['zustand/immer', never]]
>;

const ADMIN_AUTO_DISMISS_MS = 3000;

export const defaultNotificationSettings: NotificationSettings = {
  position: 'top-right',
  duration: 5000,
  maxNotifications: 5,
  enableSound: true,
  enableHaptics: true,
  enableAutoDismiss: true,
  enableStacking: true
};

const createNotificationId = () =>
  `notification_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

const createAdminNotificationId = () =>
  `admin_notification_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

const isElectionNotification = (
  notification: Notification
): notification is Notification & { context: ElectionNotificationContext } =>
  notification.context?.kind === 'election';

const trackElectionNotificationEvent = (
  phase: 'delivered' | 'opened',
  notification: Notification & { context: ElectionNotificationContext }
) => {
  try {
    const analyticsState = useAnalyticsStore.getState();
    const { trackEvent, sessionId } = analyticsState;

    if (typeof trackEvent !== 'function') {
      return;
    }

    trackEvent({
      event_type: `notifications.election.${phase}`,
      session_id: sessionId,
      event_data: {
        election_id: notification.context.electionId,
        division_id: notification.context.divisionId,
        days_until: notification.context.daysUntil,
        source: notification.context.source ?? 'unknown'
      },
      created_at: new Date().toISOString(),
      type: 'notification',
      category: 'civics',
      action: `election_${phase}`,
      label: notification.context.countdownLabel ?? notification.title,
      metadata: {
        electionDate: notification.context.electionDate,
        representativeNames: notification.context.representativeNames ?? [],
        notificationId: notification.id,
        ...(notification.metadata ? { notificationMetadata: notification.metadata } : {}),
        ...(notification.context.metadata ? { contextMetadata: notification.context.metadata } : {})
      }
    });
  } catch (error) {
    logger.warn('Failed to track election notification analytics event', {
      phase,
      notificationId: notification.id,
      error
    });
  }
};

const buildNotification = (
  payload: Omit<Notification, 'id' | 'timestamp' | 'read'>
): Notification => {
  const base: Notification = {
    id: createNotificationId(),
    timestamp: new Date().toISOString(),
    read: false,
    type: payload.type,
    title: payload.title,
    message: payload.message
  };

  const overrides: Partial<Notification> = {};
  if (payload.duration !== undefined) {
    overrides.duration = payload.duration;
  }
  if (payload.actions) {
    overrides.actions = payload.actions;
  }
  if (payload.persistent !== undefined) {
    overrides.persistent = payload.persistent;
  }
  if (payload.context) {
    overrides.context = payload.context;
  }
  if (payload.source) {
    overrides.source = payload.source;
  }
  if (payload.metadata) {
    overrides.metadata = payload.metadata;
  }

  return { ...base, ...overrides };
};

const buildAdminNotification = (
  payload: NewAdminNotification,
  id: string = createAdminNotificationId()
): AdminNotification => {
  const issuedAt = payload.timestamp ?? new Date().toISOString();
  const createdAt = payload.created_at ?? issuedAt;

  const base: AdminNotification = {
    id,
    timestamp: issuedAt,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    read: payload.read ?? false,
    created_at: createdAt
  };

  const overrides: Partial<AdminNotification> = {};
  if (payload.action) {
    overrides.action = payload.action;
  }
  if (payload.metadata) {
    overrides.metadata = payload.metadata;
  }

  return { ...base, ...overrides };
};

const calculateUnread = (notifications: Notification[]) =>
  notifications.reduce((count, notification) => (notification.read ? count : count + 1), 0);

const calculateAdminUnread = (notifications: AdminNotification[]) =>
  notifications.reduce((count, notification) => (notification.read ? count : count + 1), 0);

const scheduleNotificationEffects = (
  notification: Notification,
  get: () => NotificationStore,
  removeNotification: (id: string) => void
) => {
  const state = get();
  const { settings } = state;

  if (settings.enableAutoDismiss) {
    const duration = notification.duration ?? settings.duration;
    if (duration !== 0) {
      setTimeout(() => {
        const { notifications } = get();
        if (notifications.some((item) => item.id === notification.id)) {
          removeNotification(notification.id);
        }
      }, duration);
    }
  }

  if (settings.enableSound && typeof window !== 'undefined') {
    setTimeout(() => {
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.3;
        void audio.play();
      } catch {
        // Ignore audio errors
      }
    }, 0);
  }

  if (
    settings.enableHaptics &&
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    'vibrate' in navigator
  ) {
    setTimeout(() => {
      try {
        navigator.vibrate(50);
      } catch {
        // Ignore vibration errors
      }
    }, 0);
  }
};

const scheduleAdminNotificationEffects = (
  notification: AdminNotification,
  get: () => NotificationStore,
  removeAdminNotification: (id: string) => void
) => {
  const state = get();
  const { settings } = state;

  if (settings.enableAutoDismiss && notification.type !== 'error') {
    setTimeout(() => {
      const { adminNotifications } = get();
      if (adminNotifications.some((item) => item.id === notification.id)) {
        removeAdminNotification(notification.id);
      }
    }, ADMIN_AUTO_DISMISS_MS);
  }
};

export const initialNotificationState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  adminNotifications: [],
  adminUnreadCount: 0,
  settings: { ...defaultNotificationSettings },
  isLoading: false,
  isAdding: false,
  isRemoving: false,
  error: null
};

export const createInitialNotificationState = (): NotificationState => ({
  notifications: [],
  unreadCount: 0,
  adminNotifications: [],
  adminUnreadCount: 0,
  settings: { ...defaultNotificationSettings },
  isLoading: false,
  isAdding: false,
  isRemoving: false,
  error: null
});

export const createNotificationActions = (
  set: Parameters<NotificationStoreCreator>[0],
  get: Parameters<NotificationStoreCreator>[1]
): NotificationActions => {
  const setState = set as unknown as (recipe: (draft: NotificationState) => void) => void;

  return {
    setLoading: (loading) => {
      setState((state) => {
        state.isLoading = loading;
      });
    },

    setError: (error) => {
      setState((state) => {
        state.error = error;
      });
    },

    clearError: () => {
      setState((state) => {
        state.error = null;
      });
    },

    addNotification: (payload) => {
      const notification = buildNotification(payload);
      let analyticsTargetId: string | null = null;
      let shouldSchedule = true;

      setState((state) => {
        if (isElectionNotification(notification)) {
          const existingIndex = state.notifications.findIndex(
            (existing) =>
              isElectionNotification(existing) &&
              existing.context.electionId === notification.context.electionId &&
              existing.context.divisionId === notification.context.divisionId
          );

          if (existingIndex !== -1) {
            const existing = state.notifications[existingIndex];
          if (!existing) {
            return;
          }
            existing.title = notification.title;
            existing.message = notification.message;
            existing.timestamp = notification.timestamp;
            existing.read = false;
            if (typeof notification.duration === 'number') {
              existing.duration = notification.duration;
            }
            if (typeof notification.persistent === 'boolean') {
              existing.persistent = notification.persistent;
            }
            if (notification.actions) {
              existing.actions = notification.actions;
            }
            if (notification.context) {
              existing.context = notification.context;
            }
            if (notification.metadata) {
              existing.metadata = notification.metadata;
            }
            existing.source = notification.source ?? existing.source ?? 'civics';
            analyticsTargetId = existing.id;
            state.unreadCount = calculateUnread(state.notifications);
            shouldSchedule = false;
            return;
          }
        }

        const nextQueue = state.settings.enableStacking
          ? [notification, ...state.notifications]
          : [notification];

        state.notifications = nextQueue.slice(0, state.settings.maxNotifications);
        state.unreadCount = calculateUnread(state.notifications);
        analyticsTargetId = notification.id;
      });

      if (analyticsTargetId) {
        const storedNotification = get().notifications.find(
          (item) => item.id === analyticsTargetId
        );

        if (storedNotification) {
          if (shouldSchedule) {
            scheduleNotificationEffects(storedNotification, get, (id) => get().removeNotification(id));

            if (isElectionNotification(storedNotification)) {
              trackElectionNotificationEvent('delivered', storedNotification);
            }
          }
        }
      }
    },

    removeNotification: (id) => {
      setState((state) => {
        const nextNotifications = state.notifications.filter((notification) => notification.id !== id);
        if (nextNotifications.length !== state.notifications.length) {
          state.notifications = nextNotifications;
          state.unreadCount = calculateUnread(state.notifications);
        }
      });
    },

    markAsRead: (id) => {
      let analyticsTargetId: string | null = null;

      setState((state) => {
        const target = state.notifications.find((notification) => notification.id === id);
        if (target && !target.read) {
          if (isElectionNotification(target)) {
            analyticsTargetId = target.id;
          }
          target.read = true;
          state.unreadCount = calculateUnread(state.notifications);
        }
      });

      if (analyticsTargetId) {
        const storedNotification = get().notifications.find(
          (notification) => notification.id === analyticsTargetId
        );

        if (storedNotification && isElectionNotification(storedNotification)) {
          trackElectionNotificationEvent('opened', storedNotification);
        }
      }
    },

    markAllAsRead: () => {
      const analyticsIds: string[] = [];

      setState((state) => {
        state.notifications.forEach((notification) => {
          if (!notification.read) {
            if (isElectionNotification(notification)) {
              analyticsIds.push(notification.id);
            }
            notification.read = true;
          }
        });
        state.unreadCount = 0;
      });

      if (analyticsIds.length > 0) {
        const storedNotifications = get().notifications.filter((notification) =>
          analyticsIds.includes(notification.id)
        );

        storedNotifications
          .filter(isElectionNotification)
          .forEach((notification) => trackElectionNotificationEvent('opened', notification));
      }
    },

    clearAll: () => {
      setState((state) => {
        state.notifications = [];
        state.unreadCount = 0;
      });
    },

    clearByType: (type) => {
      setState((state) => {
        const beforeCount = state.notifications.length;
        state.notifications = state.notifications.filter((notification) => notification.type !== type);
        state.unreadCount = calculateUnread(state.notifications);

        const removed = beforeCount - state.notifications.length;
        if (removed > 0) {
          logger.debug(`Cleared ${removed} notifications of type ${type}`);
        }
      });
    },

    addAdminNotification: (payload) => {
      const notification = buildAdminNotification(payload);

      setState((state) => {
        const nextQueue = state.settings.enableStacking
          ? [notification, ...state.adminNotifications]
          : [notification];

        state.adminNotifications = nextQueue.slice(0, state.settings.maxNotifications);
        state.adminUnreadCount = calculateAdminUnread(state.adminNotifications);
      });

      scheduleAdminNotificationEffects(notification, get, (id) =>
        get().removeAdminNotification(id)
      );
    },

    removeAdminNotification: (id) => {
      setState((state) => {
        const nextNotifications = state.adminNotifications.filter(
          (notification) => notification.id !== id
        );
        if (nextNotifications.length !== state.adminNotifications.length) {
          state.adminNotifications = nextNotifications;
          state.adminUnreadCount = calculateAdminUnread(state.adminNotifications);
        }
      });
    },

    markAdminNotificationAsRead: (id) => {
      setState((state) => {
        const target = state.adminNotifications.find((notification) => notification.id === id);
        if (target && !target.read) {
          target.read = true;
          state.adminUnreadCount = calculateAdminUnread(state.adminNotifications);
        }
      });
    },

    markAllAdminNotificationsAsRead: () => {
      setState((state) => {
        state.adminNotifications.forEach((notification) => {
          notification.read = true;
        });
        state.adminUnreadCount = 0;
      });
    },

    clearAllAdminNotifications: () => {
      setState((state) => {
        state.adminNotifications = [];
        state.adminUnreadCount = 0;
      });
    },

    clearAdminNotificationsByType: (type) => {
      setState((state) => {
        const beforeCount = state.adminNotifications.length;
        state.adminNotifications = state.adminNotifications.filter(
          (notification) => notification.type !== type
        );
        state.adminUnreadCount = calculateAdminUnread(state.adminNotifications);

        const removed = beforeCount - state.adminNotifications.length;
        if (removed > 0) {
          logger.debug(`Cleared ${removed} admin notifications of type ${type}`);
        }
      });
    },

    updateSettings: (settings) => {
      setState((state) => {
        state.settings = { ...state.settings, ...settings };
      });
    },

    resetSettings: () => {
      setState((state) => {
        state.settings = { ...defaultNotificationSettings };
      });

      logger.info('Notification settings reset to defaults');
    },

    setAdding: (adding) => {
      setState((state) => {
        state.isAdding = adding;
      });
    },

    setRemoving: (removing) => {
      setState((state) => {
        state.isRemoving = removing;
      });
    },

    getNotification: (id) => get().notifications.find((notification) => notification.id === id),

    getNotificationsByType: (type) =>
      get().notifications.filter((notification) => notification.type === type),

    getUnreadNotifications: () =>
      get().notifications.filter((notification) => !notification.read)
  } satisfies NotificationActions;
};

export const notificationStoreCreator: NotificationStoreCreator = (set, get) =>
  Object.assign(createInitialNotificationState(), createNotificationActions(set, get));

export const useNotificationStore = create<NotificationStore>()(
  devtools(
    persist(
      immer(notificationStoreCreator),
      {
        name: 'notification-store',
        storage: createSafeStorage(),
        partialize: (state) => ({
          settings: state.settings
        })
      }
    ),
    { name: 'notification-store' }
  )
);

export const notificationSelectors = {
  notifications: (state: NotificationStore) => state.notifications,
  unreadCount: (state: NotificationStore) => state.unreadCount,
  adminNotifications: (state: NotificationStore) => state.adminNotifications,
  adminUnreadCount: (state: NotificationStore) => state.adminUnreadCount,
  settings: (state: NotificationStore) => state.settings,
  isLoading: (state: NotificationStore) => state.isLoading,
  isAdding: (state: NotificationStore) => state.isAdding,
  isRemoving: (state: NotificationStore) => state.isRemoving,
  error: (state: NotificationStore) => state.error
} as const;

export const useNotifications = () => useNotificationStore(notificationSelectors.notifications);
export const useUnreadCount = () => useNotificationStore(notificationSelectors.unreadCount);
export const useNotificationSettings = () => useNotificationStore(notificationSelectors.settings);
export const useNotificationLoading = () => useNotificationStore(notificationSelectors.isLoading);
export const useNotificationError = () => useNotificationStore(notificationSelectors.error);
export const useNotificationFlags = () =>
  useNotificationStore((state) => ({
    isAdding: state.isAdding,
    isRemoving: state.isRemoving
  }));

export const useAdminNotifications = () =>
  useNotificationStore(notificationSelectors.adminNotifications);
export const useAdminUnreadCount = () =>
  useNotificationStore(notificationSelectors.adminUnreadCount);

export const useNotificationActions = () => {
  const addNotification = useNotificationStore((state) => state.addNotification);
  const removeNotification = useNotificationStore((state) => state.removeNotification);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const clearAll = useNotificationStore((state) => state.clearAll);
  const clearByType = useNotificationStore((state) => state.clearByType);
  const addAdminNotification = useNotificationStore((state) => state.addAdminNotification);
  const removeAdminNotification = useNotificationStore((state) => state.removeAdminNotification);
  const markAdminNotificationAsRead = useNotificationStore((state) => state.markAdminNotificationAsRead);
  const markAllAdminNotificationsAsRead = useNotificationStore((state) => state.markAllAdminNotificationsAsRead);
  const clearAllAdminNotifications = useNotificationStore((state) => state.clearAllAdminNotifications);
  const clearAdminNotificationsByType = useNotificationStore((state) => state.clearAdminNotificationsByType);
  const updateSettings = useNotificationStore((state) => state.updateSettings);
  const resetSettings = useNotificationStore((state) => state.resetSettings);
  const setAdding = useNotificationStore((state) => state.setAdding);
  const setRemoving = useNotificationStore((state) => state.setRemoving);
  const getNotification = useNotificationStore((state) => state.getNotification);
  const getNotificationsByType = useNotificationStore((state) => state.getNotificationsByType);
  const getUnreadNotifications = useNotificationStore((state) => state.getUnreadNotifications);

  return useMemo(
    () => ({
      addNotification,
      removeNotification,
      markAsRead,
      markAllAsRead,
      clearAll,
      clearByType,
      addAdminNotification,
      removeAdminNotification,
      markAdminNotificationAsRead,
      markAllAdminNotificationsAsRead,
      clearAllAdminNotifications,
      clearAdminNotificationsByType,
      updateSettings,
      resetSettings,
      setAdding,
      setRemoving,
      getNotification,
      getNotificationsByType,
      getUnreadNotifications
    }),
    [
      addNotification,
      removeNotification,
      markAsRead,
      markAllAsRead,
      clearAll,
      clearByType,
      addAdminNotification,
      removeAdminNotification,
      markAdminNotificationAsRead,
      markAllAdminNotificationsAsRead,
      clearAllAdminNotifications,
      clearAdminNotificationsByType,
      updateSettings,
      resetSettings,
      setAdding,
      setRemoving,
      getNotification,
      getNotificationsByType,
      getUnreadNotifications
    ]
  );
};

export const useNotificationsByType = (type: Notification['type']) =>
  useNotificationStore((state) => state.getNotificationsByType(type));

export const useUnreadNotifications = () =>
  useNotificationStore((state) => state.getUnreadNotifications());

export const useElectionNotifications = () => {
  const notifications = useNotificationStore(notificationSelectors.notifications);

  return useMemo(
    () => notifications.filter(isElectionNotification),
    [notifications]
  );
};

export const useNotificationPosition = () =>
  useNotificationStore((state) => state.settings.position);
export const useNotificationDuration = () =>
  useNotificationStore((state) => state.settings.duration);
export const useNotificationMaxCount = () =>
  useNotificationStore((state) => state.settings.maxNotifications);

export const useAdminNotificationsByType = (type: AdminNotification['type']) =>
  useNotificationStore((state) =>
    state.adminNotifications.filter((notification) => notification.type === type)
  );

export const useUnreadAdminNotifications = () =>
  useNotificationStore((state) =>
    state.adminNotifications.filter((notification) => !notification.read)
  );

export type CreateElectionNotificationOptions = {
  title: string;
  message: string;
  countdownLabel: string;
  electionId: string;
  divisionId: string;
  electionDate: string;
  daysUntil: number;
  representativeNames?: string[];
  source?: ElectionNotificationContext['source'];
  duration?: number;
  persistent?: boolean;
  metadata?: Record<string, unknown>;
  notificationType?: Notification['type'];
};

export const notificationStoreUtils = {
  createSuccess: (title: string, message: string, duration?: number) => {
    useNotificationStore.getState().addNotification({
      type: 'success',
      title,
      message,
      duration: duration ?? defaultNotificationSettings.duration
    });
  },

  createError: (title: string, message: string, duration?: number) => {
    useNotificationStore.getState().addNotification({
      type: 'error',
      title,
      message,
      duration: duration ?? 0
    });
  },

  createWarning: (title: string, message: string, duration?: number) => {
    useNotificationStore.getState().addNotification({
      type: 'warning',
      title,
      message,
      duration: duration ?? defaultNotificationSettings.duration
    });
  },

  createInfo: (title: string, message: string, duration?: number) => {
    useNotificationStore.getState().addNotification({
      type: 'info',
      title,
      message,
      duration: duration ?? defaultNotificationSettings.duration
    });
  },

  createPersistent: (title: string, message: string, type: Notification['type'] = 'info') => {
    useNotificationStore.getState().addNotification({
      type,
      title,
      message,
      duration: 0,
      persistent: true
    });
  },

  createElectionNotification: ({
    title,
    message,
    countdownLabel,
    electionId,
    divisionId,
    electionDate,
    daysUntil,
    representativeNames,
    source = 'automation',
    duration,
    persistent,
    metadata,
    notificationType = 'info'
  }: CreateElectionNotificationOptions) => {
    const shouldPersist = persistent ?? daysUntil <= 1;

    useNotificationStore.getState().addNotification({
      type: notificationType,
      title,
      message,
      duration:
        typeof duration === 'number'
          ? duration
          : shouldPersist
            ? 0
            : defaultNotificationSettings.duration,
      persistent: shouldPersist,
      source: 'civics',
      metadata: metadata ?? {},
      context: {
        kind: 'election',
        electionId,
        divisionId,
        electionDate,
        daysUntil,
        countdownLabel,
        representativeNames,
        source,
        metadata: metadata ?? {}
      }
    });
  },

  createWithActions: (
    title: string,
    message: string,
    type: Notification['type'],
    actions: Array<{ label: string; action: () => void }>,
    duration?: number
  ) => {
    useNotificationStore.getState().addNotification({
      type,
      title,
      message,
      actions,
      duration: duration ?? 0
    });
  },

  getStats: () => {
    const state = useNotificationStore.getState();
    const notifications = state.notifications;

    return {
      total: notifications.length,
      unread: notifications.filter((notification) => !notification.read).length,
      byType: {
        success: notifications.filter((notification) => notification.type === 'success').length,
        error: notifications.filter((notification) => notification.type === 'error').length,
        warning: notifications.filter((notification) => notification.type === 'warning').length,
        info: notifications.filter((notification) => notification.type === 'info').length
      },
      oldest: notifications.length ? notifications[notifications.length - 1]?.timestamp : null,
      newest: notifications.length ? notifications[0]?.timestamp : null
    };
  },

  cleanup: (maxAge: number = 24 * 60 * 60 * 1000) => {
    const state = useNotificationStore.getState();
    const cutoff = Date.now() - maxAge;

    const oldNotifications = state.notifications.filter((notification) => {
      const timestamp = new Date(notification.timestamp).getTime();
      return Number.isFinite(timestamp) && timestamp < cutoff;
    });

    if (oldNotifications.length) {
      const { removeNotification } = state;
      oldNotifications.forEach((notification) => removeNotification(notification.id));
      logger.debug('Cleaned up old notifications', { count: oldNotifications.length });
    }
  },

  createAdminSuccess: (title: string, message: string) => {
    useNotificationStore.getState().addAdminNotification({
      type: 'success',
      title,
      message
    });
  },

  createAdminError: (title: string, message: string) => {
    useNotificationStore.getState().addAdminNotification({
      type: 'error',
      title,
      message
    });
  },

  createAdminWarning: (title: string, message: string) => {
    useNotificationStore.getState().addAdminNotification({
      type: 'warning',
      title,
      message
    });
  },

  createAdminInfo: (title: string, message: string) => {
    useNotificationStore.getState().addAdminNotification({
      type: 'info',
      title,
      message
    });
  },

  getAdminStats: () => {
    const state = useNotificationStore.getState();
    const notifications = state.adminNotifications;

    return {
      total: notifications.length,
      unread: notifications.filter((notification) => !notification.read).length,
      byType: {
        success: notifications.filter((notification) => notification.type === 'success').length,
        error: notifications.filter((notification) => notification.type === 'error').length,
        warning: notifications.filter((notification) => notification.type === 'warning').length,
        info: notifications.filter((notification) => notification.type === 'info').length
      },
      oldest: notifications.length ? notifications[notifications.length - 1]?.created_at ?? null : null,
      newest: notifications.length ? notifications[0]?.created_at ?? null : null
    };
  }
};

export const notificationStoreSubscriptions = {
  onNotificationChange: (callback: (notifications: Notification[]) => void) =>
    useNotificationStore.subscribe((state) => {
      callback(state.notifications);
    }),

  onUnreadCountChange: (callback: (count: number) => void) =>
    useNotificationStore.subscribe((state) => {
      callback(state.unreadCount);
    }),

  onNotificationTypeChange: (
    type: Notification['type'],
    callback: (notifications: Notification[]) => void
  ) =>
    useNotificationStore.subscribe((state) => {
      callback(state.notifications.filter((notification) => notification.type === type));
    })
};

export const notificationStoreDebug = {
  logState: () => {
    const state = useNotificationStore.getState();
    logger.debug('Notification Store State', {
      total: state.notifications.length,
      unread: state.unreadCount,
      settings: state.settings,
      isLoading: state.isLoading,
      isAdding: state.isAdding,
      isRemoving: state.isRemoving,
      error: state.error
    });
  },

  logNotifications: () => {
    const state = useNotificationStore.getState();
    logger.debug('All Notifications', { notifications: state.notifications });
  },

  logStats: () => {
    logger.debug('Notification Statistics', notificationStoreUtils.getStats());
  },

  clearAll: () => {
    useNotificationStore.getState().clearAll();
    logger.info('All notifications cleared');
  }
};
