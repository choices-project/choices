'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  useNotifications,
  useUnreadCount,
  useNotificationSettings,
  useAdminNotifications,
  useAdminUnreadCount,
  useNotificationActions,
  useNotificationStore,
  notificationStoreUtils,
  type CreateElectionNotificationOptions,
  type NotificationStore
} from '@/lib/stores/notificationStore';
import { useAnalyticsStore } from '@/lib/stores/analyticsStore';

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
  sendElectionNotification: (options: CreateElectionNotificationOptions) => void;
  enableAnalyticsTracking: () => void;
  disableAnalyticsTracking: () => void;
  clearElectionNotifications: () => void;
};

declare global {
  var __notificationStoreHarness: NotificationStoreHarness | undefined;
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

const buildElectionOptions = (
  overrides: Partial<CreateElectionNotificationOptions> = {}
): CreateElectionNotificationOptions => {
  const defaultDaysUntil = 5;
  const electionDate = new Date(Date.now() + defaultDaysUntil * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  return {
    title: 'Upcoming Election',
    message: `Election on ${electionDate}`,
    countdownLabel: `Election in ${defaultDaysUntil} days`,
    electionId: 'sample-election',
    divisionId: 'ocd-division/country:us/state:ca',
    electionDate,
    daysUntil: defaultDaysUntil,
    representativeNames: ['Sample Representative'],
    source: 'notification-center',
    notificationType: 'info',
    ...overrides
  };
};

const AnalyticsControls = () => {
  const trackingEnabled = useAnalyticsStore((state) => state.trackingEnabled);
  const preferencesEnabled = useAnalyticsStore((state) => state.preferences.trackingEnabled);
  const setTrackingEnabled = useAnalyticsStore((state) => state.setTrackingEnabled);
  const updatePreferences = useAnalyticsStore((state) => state.updatePreferences);

  const toggleTracking = (enabled: boolean) => {
    setTrackingEnabled(enabled);
    updatePreferences({ trackingEnabled: enabled });
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-medium">Analytics Controls</h2>
      <p className="text-sm text-slate-600">
        Election notifications emit analytics events when tracking is enabled.
      </p>
      <dl className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
        <div className="flex items-center justify-between gap-2">
          <dt>Tracking Enabled</dt>
          <dd data-testid="analytics-tracking">{String(trackingEnabled)}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt>Preferences Enabled</dt>
          <dd data-testid="analytics-preferences">{String(preferencesEnabled)}</dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded bg-emerald-600 px-3 py-1 text-sm font-medium text-white shadow-sm hover:bg-emerald-500"
          onClick={() => toggleTracking(true)}
          data-testid="analytics-enable"
        >
          Enable Tracking
        </button>
        <button
          type="button"
          className="rounded bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-300"
          onClick={() => toggleTracking(false)}
          data-testid="analytics-disable"
        >
          Disable Tracking
        </button>
      </div>
    </section>
  );
};

const ElectionNotificationSandbox = ({ optOut }: { optOut: boolean }) => {
  const [formState, setFormState] = useState<CreateElectionNotificationOptions>(() =>
    buildElectionOptions()
  );
  const [daysUntilInput, setDaysUntilInput] = useState<string>(String(formState.daysUntil));
  const [countdownLabelInput, setCountdownLabelInput] = useState<string>(formState.countdownLabel);

  const updateFormState = (next: Partial<CreateElectionNotificationOptions>) => {
    setFormState((prev) => {
      const merged = { ...prev, ...next };
      if (typeof next.daysUntil === 'number') {
        setDaysUntilInput(String(next.daysUntil));
      }
      if (typeof next.countdownLabel === 'string') {
        setCountdownLabelInput(next.countdownLabel);
      }
      return merged;
    });
  };

  const dispatchNotification = (overrides: Partial<CreateElectionNotificationOptions> = {}) => {
    if (optOut) {
      return;
    }

    const parsedDays = Number(daysUntilInput);
    const daysUntil = Number.isFinite(parsedDays) ? parsedDays : formState.daysUntil;
    const payload = buildElectionOptions({
      ...formState,
      countdownLabel: countdownLabelInput,
      daysUntil,
      ...overrides
    });

    notificationStoreUtils.createElectionNotification(payload);
  };

  return (
    <section className="rounded-lg border border-rose-200 bg-rose-50 p-4 shadow-sm">
      <h2 className="text-lg font-medium text-rose-900">Election Notification Sandbox</h2>
      <p className="text-sm text-rose-700">
        Replay election countdown alerts, verify dedupe behaviour, and test rollback toggles.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-rose-900">
          Election Title
          <input
            className="mt-1 w-full rounded border border-rose-300 bg-white p-2 text-sm"
            value={formState.title}
            onChange={(event) => updateFormState({ title: event.target.value })}
            data-testid="election-title-input"
          />
        </label>

        <label className="text-sm font-medium text-rose-900">
          Election ID
          <input
            className="mt-1 w-full rounded border border-rose-300 bg-white p-2 text-sm"
            value={formState.electionId}
            onChange={(event) => updateFormState({ electionId: event.target.value })}
            data-testid="election-id-input"
          />
        </label>

        <label className="text-sm font-medium text-rose-900">
          Division ID
          <input
            className="mt-1 w-full rounded border border-rose-300 bg-white p-2 text-sm"
            value={formState.divisionId}
            onChange={(event) => updateFormState({ divisionId: event.target.value })}
            data-testid="election-division-input"
          />
        </label>

        <label className="text-sm font-medium text-rose-900">
          Election Date (YYYY-MM-DD)
          <input
            className="mt-1 w-full rounded border border-rose-300 bg-white p-2 text-sm"
            value={formState.electionDate}
            onChange={(event) => updateFormState({ electionDate: event.target.value })}
            data-testid="election-date-input"
          />
        </label>

        <label className="text-sm font-medium text-rose-900">
          Days Until Election
          <input
            className="mt-1 w-full rounded border border-rose-300 bg-white p-2 text-sm"
            value={daysUntilInput}
            type="number"
            onChange={(event) => setDaysUntilInput(event.target.value)}
            data-testid="election-days-input"
          />
        </label>

        <label className="text-sm font-medium text-rose-900">
          Countdown Label
          <input
            className="mt-1 w-full rounded border border-rose-300 bg-white p-2 text-sm"
            value={countdownLabelInput}
            onChange={(event) => setCountdownLabelInput(event.target.value)}
            data-testid="election-countdown-input"
          />
        </label>

        <label className="text-sm font-medium text-rose-900 md:col-span-2">
          Message
          <input
            className="mt-1 w-full rounded border border-rose-300 bg-white p-2 text-sm"
            value={formState.message}
            onChange={(event) => updateFormState({ message: event.target.value })}
            data-testid="election-message-input"
          />
        </label>

        <label className="text-sm font-medium text-rose-900 md:col-span-2">
          Representative Names (comma separated)
          <input
            className="mt-1 w-full rounded border border-rose-300 bg-white p-2 text-sm"
            value={formState.representativeNames?.join(', ') ?? ''}
            onChange={(event) =>
              updateFormState({
                representativeNames: event.target.value
                  .split(',')
                  .map((value) => value.trim())
                  .filter(Boolean)
              })
            }
            data-testid="election-representatives-input"
          />
        </label>

        <label className="text-sm font-medium text-rose-900">
          Notification Source
          <select
            className="mt-1 w-full rounded border border-rose-300 bg-white p-2 text-sm"
            value={formState.source}
            onChange={(event) =>
              updateFormState({
                source: event.target.value as CreateElectionNotificationOptions['source']
              })
            }
            data-testid="election-source-select"
          >
            <option value="notification-center">notification-center</option>
            <option value="dashboard">dashboard</option>
            <option value="lure">lure</option>
            <option value="contact">contact</option>
            <option value="automation">automation</option>
            <option value="pwa">pwa</option>
          </select>
        </label>

        <label className="text-sm font-medium text-rose-900">
          Notification Type
          <select
            className="mt-1 w-full rounded border border-rose-300 bg-white p-2 text-sm"
            value={formState.notificationType}
            onChange={(event) =>
              updateFormState({
                notificationType:
                  event.target.value as NonNullable<CreateElectionNotificationOptions['notificationType']>
              })
            }
            data-testid="election-type-select"
          >
            <option value="info">info</option>
            <option value="success">success</option>
            <option value="warning">warning</option>
            <option value="error">error</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded bg-rose-600 px-3 py-1 text-sm font-medium text-white shadow-sm hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-rose-200"
          onClick={() => dispatchNotification()}
          disabled={optOut}
          data-testid="election-send-button"
        >
          Send Election Notification
        </button>
        <button
          type="button"
          className="rounded bg-amber-600 px-3 py-1 text-sm font-medium text-white shadow-sm hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-amber-200"
          onClick={() =>
            dispatchNotification({
              daysUntil: Math.max(0, (Number(daysUntilInput) || formState.daysUntil) - 1),
              countdownLabel:
                Math.max(0, (Number(daysUntilInput) || formState.daysUntil) - 1) === 0
                  ? 'Election day'
                  : `Election in ${Math.max(
                      0,
                      (Number(daysUntilInput) || formState.daysUntil) - 1
                    )} days`
            })
          }
          disabled={optOut}
          data-testid="election-send-updated-button"
        >
          Send Updated (dedupe) Notification
        </button>
        <button
          type="button"
          className="rounded bg-slate-700 px-3 py-1 text-sm font-medium text-white shadow-sm hover:bg-slate-600"
          onClick={() => useNotificationStore.getState().clearAll()}
          data-testid="election-clear-button"
        >
          Clear Notifications (Rollback)
        </button>
      </div>

      {optOut && (
        <p className="mt-3 text-sm font-medium text-rose-800" data-testid="election-optout-banner">
          Opt-out enabled: election notifications are suppressed.
        </p>
      )}
    </section>
  );
};

export default function NotificationStoreHarnessPage() {
  const notifications = useNotifications();
  const unreadCount = useUnreadCount();
  const settings = useNotificationSettings();
  const adminNotifications = useAdminNotifications();
  const adminUnreadCount = useAdminUnreadCount();
  const actions = useNotificationActions();
  const [optOutElectionAlerts, setOptOutElectionAlerts] = useState(false);

  const harnessUtilities = useMemo(() => {
    const sendElectionNotification = (options: CreateElectionNotificationOptions) => {
      notificationStoreUtils.createElectionNotification(options);
    };

    const enableTracking = () => {
      useAnalyticsStore.getState().setTrackingEnabled(true);
      useAnalyticsStore.getState().updatePreferences({ trackingEnabled: true });
    };

    const disableTracking = () => {
      useAnalyticsStore.getState().setTrackingEnabled(false);
      useAnalyticsStore.getState().updatePreferences({ trackingEnabled: false });
    };

    const clearElectionNotifications = () => {
      useNotificationStore.getState().clearAll();
    };

    return {
      sendElectionNotification,
      enableTracking,
      disableTracking,
      clearElectionNotifications
    };
  }, []);

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
      resetSettings: actions.resetSettings,
      sendElectionNotification: harnessUtilities.sendElectionNotification,
      enableAnalyticsTracking: harnessUtilities.enableTracking,
      disableAnalyticsTracking: harnessUtilities.disableTracking,
      clearElectionNotifications: harnessUtilities.clearElectionNotifications
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
    actions.resetSettings,
    harnessUtilities.clearElectionNotifications,
    harnessUtilities.disableTracking,
    harnessUtilities.enableTracking,
    harnessUtilities.sendElectionNotification
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

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-medium">Election Alert Controls</h2>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label htmlFor="opt-out-toggle" className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              id="opt-out-toggle"
              type="checkbox"
              checked={optOutElectionAlerts}
              onChange={(event) => setOptOutElectionAlerts(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-500"
              data-testid="election-optout-toggle"
            />
            Opt out of election notifications
          </label>
          <button
            type="button"
            className="rounded bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-300 disabled:cursor-not-allowed disabled:bg-slate-100"
            onClick={() => notificationStoreUtils.createElectionNotification(buildElectionOptions())}
            disabled={optOutElectionAlerts}
            data-testid="election-send-default"
          >
            Send Default Election Alert
          </button>
        </div>
      </section>

      <ElectionNotificationSandbox optOut={optOutElectionAlerts} />
      <AnalyticsControls />

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

