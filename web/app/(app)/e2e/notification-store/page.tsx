'use client';

import { useEffect } from 'react';

import {
  useNotifications,
  useUnreadCount,
  useNotificationSettings,
  useAdminNotifications,
  useAdminUnreadCount,
  useNotificationActions,
  useNotificationStore,
  type NotificationStore
} from '@/lib/stores/notificationStore';

type NotificationHarnessActions = ReturnType<typeof useNotificationActions>;

export type NotificationStoreHarness = {
  getSnapshot: () => NotificationStore;
  addNotification: NotificationHarnessActions['addNotification'];
  clearAll: NotificationHarnessActions['clearAll'];
  markAsRead: NotificationHarnessActions['markAsRead'];
  addAdminNotification: NotificationHarnessActions['addAdminNotification'];
  clearAllAdmin: NotificationHarnessActions['clearAllAdminNotifications'];
  markAdminAsRead: NotificationHarnessActions['markAdminNotificationAsRead'];
  updateSettings: NotificationHarnessActions['updateSettings'];
  resetSettings: NotificationHarnessActions['resetSettings'];
};

declare global {
  interface Window {
    __notificationStoreHarness?: NotificationStoreHarness;
  }
}

const formatTimestamp = (value?: string | null) => {
  if (!value) {
    return 'none';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString();
};

export default function NotificationStoreHarnessPage() {
  const notifications = useNotifications();
  const unreadCount = useUnreadCount();
  const settings = useNotificationSettings();
  const adminNotifications = useAdminNotifications();
  const adminUnreadCount = useAdminUnreadCount();
  const actions = useNotificationActions();

  useEffect(() => {
    const harness: NotificationStoreHarness = {
      getSnapshot: () => useNotificationStore.getState(),
      addNotification: actions.addNotification,
      clearAll: actions.clearAll,
      markAsRead: actions.markAsRead,
      addAdminNotification: actions.addAdminNotification,
      clearAllAdmin: actions.clearAllAdminNotifications,
      markAdminAsRead: actions.markAdminNotificationAsRead,
      updateSettings: actions.updateSettings,
      resetSettings: actions.resetSettings
    };

    window.__notificationStoreHarness = harness;
    return () => {
      if (window.__notificationStoreHarness === harness) {
        delete window.__notificationStoreHarness;
      }
    };
  }, [
    actions.addNotification,
    actions.clearAll,
    actions.markAsRead,
    actions.addAdminNotification,
    actions.clearAllAdminNotifications,
    actions.markAdminNotificationAsRead,
    actions.updateSettings,
    actions.resetSettings
  ]);

  return (
    <main data-testid="notification-store-harness" className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold">Notification Store Harness</h1>
        <p className="text-sm text-slate-600">
          Interact with the notification store via <code>window.__notificationStoreHarness</code>.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <div>
          <h2 className="text-lg font-medium">User Notifications</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt>Total</dt>
              <dd data-testid="notification-count">{String(notifications.length)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Unread</dt>
              <dd data-testid="notification-unread">{String(unreadCount)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Auto-dismiss</dt>
              <dd data-testid="notification-autodismiss">{String(settings.enableAutoDismiss)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Duration (ms)</dt>
              <dd data-testid="notification-duration">{String(settings.duration)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Stacking</dt>
              <dd data-testid="notification-stacking">{String(settings.enableStacking)}</dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 className="text-lg font-medium">Admin Notifications</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt>Total</dt>
              <dd data-testid="admin-notification-count">{String(adminNotifications.length)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Unread</dt>
              <dd data-testid="admin-notification-unread">{String(adminUnreadCount)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-medium">User Queue</h3>
          <ul data-testid="notification-list" className="space-y-2 text-sm">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className="rounded border border-slate-200 bg-slate-50 p-2"
                data-read={notification.read}
                data-type={notification.type}
              >
                <p className="font-medium">{notification.title}</p>
                <p>{notification.message}</p>
                <p className="text-xs text-slate-500">duration: {notification.duration ?? 'default'}</p>
                <p className="text-xs text-slate-500">timestamp: {formatTimestamp(notification.timestamp)}</p>
              </li>
            ))}
            {notifications.length === 0 && <li className="text-xs text-slate-500">No notifications</li>}
          </ul>
        </div>

        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-medium">Admin Queue</h3>
          <ul data-testid="admin-notification-list" className="space-y-2 text-sm">
            {adminNotifications.map((notification) => (
              <li
                key={notification.id}
                className="rounded border border-slate-200 bg-slate-50 p-2"
                data-read={notification.read}
                data-type={notification.type}
              >
                <p className="font-medium">{notification.title}</p>
                <p>{notification.message}</p>
                <p className="text-xs text-slate-500">created: {formatTimestamp(notification.created_at)}</p>
              </li>
            ))}
            {adminNotifications.length === 0 && <li className="text-xs text-slate-500">No admin notifications</li>}
          </ul>
        </div>
      </section>
    </main>
  );
}

