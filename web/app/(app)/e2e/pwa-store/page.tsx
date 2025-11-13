'use client';

import { notFound } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { usePWAStore, type PWAStore, type PWANotification } from '@/lib/stores/pwaStore';

const isProduction = process.env.NODE_ENV === 'production';
const allowHarness = process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1';

export type PWAStoreHarness = {
  getSnapshot: () => PWAStore;
  setInstallation: PWAStore['setInstallation'];
  setInstallPrompt: PWAStore['setInstallPrompt'];
  setCanInstall: PWAStore['setCanInstall'];
  installPWA: PWAStore['installPWA'];
  uninstallPWA: PWAStore['uninstallPWA'];
  setOnlineStatus: PWAStore['setOnlineStatus'];
  setOfflineData: PWAStore['setOfflineData'];
  setOfflineQueueSize: PWAStore['setOfflineQueueSize'];
  queueOfflineAction: PWAStore['queueOfflineAction'];
  processOfflineActions: PWAStore['processOfflineActions'];
  updatePreferences: PWAStore['updatePreferences'];
  resetPreferences: PWAStore['resetPreferences'];
  addNotification: PWAStore['addNotification'];
  removeNotification: PWAStore['removeNotification'];
  clearNotifications: PWAStore['clearNotifications'];
  markNotificationRead: PWAStore['markNotificationRead'];
  syncData: PWAStore['syncData'];
  setSyncing: PWAStore['setSyncing'];
  setError: PWAStore['setError'];
  clearError: PWAStore['clearError'];
  resetAll: () => void;
};

declare global {
  var __pwaStoreHarness: PWAStoreHarness | undefined;
}

const formatLastUpdated = (value: string | null | undefined) => {
  if (!value) {
    return 'never';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'unknown';
  }
  return date.toLocaleString();
};

const formatNotification = (notification: PWANotification) => {
  return `${notification.type} • ${notification.title}`;
};

export default function PWAStoreHarnessPage() {
  if (isProduction && !allowHarness) {
    notFound();
  }

  const [pwaState, setPwaState] = useState<PWAStore>(() => usePWAStore.getState());

  useEffect(() => {
    const unsubscribe = usePWAStore.subscribe((state) => {
      setPwaState(state);
    });
    return unsubscribe;
  }, []);

  const {
    installation,
    offline,
    update,
    notifications,
    preferences,
    isSyncing,
    error,
    offlineQueueUpdatedAt,
  } = pwaState;

  const queueSize = offline.offlineData.queuedActions.length;
  const cachedPages = offline.offlineData.cachedPages.length;
  const cachedResources = offline.offlineData.cachedResources.length;

  const harnessSnapshot = useMemo(
    () => ({
      queueSize,
      cachedPages,
      cachedResources,
      isOffline: !offline.isOnline,
      installable: installation.canInstall,
      installed: installation.isInstalled,
      installPrompt: installation.installPrompt ? 'available' : 'none',
      preferences,
    }),
    [
      cachedPages,
      cachedResources,
      installation.canInstall,
      installation.installPrompt,
      installation.isInstalled,
      offline.isOnline,
      preferences,
      queueSize,
    ],
  );

  useEffect(() => {
    const harness: PWAStoreHarness = {
      getSnapshot: () => usePWAStore.getState(),
      setInstallation: (installation) => usePWAStore.getState().setInstallation(installation),
      setInstallPrompt: (prompt) => usePWAStore.getState().setInstallPrompt(prompt),
      setCanInstall: (canInstall) => usePWAStore.getState().setCanInstall(canInstall),
      installPWA: () => usePWAStore.getState().installPWA(),
      uninstallPWA: () => usePWAStore.getState().uninstallPWA(),
      setOnlineStatus: (isOnline) => usePWAStore.getState().setOnlineStatus(isOnline),
      setOfflineData: (data) => usePWAStore.getState().setOfflineData(data),
      setOfflineQueueSize: (size, updatedAt) => usePWAStore.getState().setOfflineQueueSize(size, updatedAt),
      queueOfflineAction: (action) => usePWAStore.getState().queueOfflineAction(action),
      processOfflineActions: () => usePWAStore.getState().processOfflineActions(),
      updatePreferences: (partial) => usePWAStore.getState().updatePreferences(partial),
      resetPreferences: () => usePWAStore.getState().resetPreferences(),
      addNotification: (notification) => usePWAStore.getState().addNotification(notification),
      removeNotification: (id) => usePWAStore.getState().removeNotification(id),
      clearNotifications: () => usePWAStore.getState().clearNotifications(),
      markNotificationRead: (id) => usePWAStore.getState().markNotificationRead(id),
      syncData: () => usePWAStore.getState().syncData(),
      setSyncing: (value) => usePWAStore.getState().setSyncing(value),
      setError: (value) => usePWAStore.getState().setError(value),
      clearError: () => usePWAStore.getState().clearError(),
      resetAll: () => {
        const api = usePWAStore.getState();
        api.setInstallation({
          isInstalled: false,
          canInstall: true,
          installPrompt: null,
          installSource: api.installation.installSource,
          version: api.installation.version,
        });
        api.setOnlineStatus(true);
        api.setOfflineData({
          queuedActions: [],
          cachedPages: [],
          cachedResources: [],
        });
        api.setOfflineQueueSize(0, new Date().toISOString());
        api.resetPreferences();
        api.clearNotifications();
        api.clearError();
        api.setSyncing(false);
      },
    };

    window.__pwaStoreHarness = harness;
    return () => {
      if (window.__pwaStoreHarness === harness) {
        delete window.__pwaStoreHarness;
      }
    };
  }, []);

  useEffect(() => {
    let ready = false;
    const markReady = () => {
      if (ready) return;
      ready = true;
      if (typeof document !== 'undefined') {
        document.documentElement.dataset.pwaStoreHarness = 'ready';
      }
    };

    const persist = (usePWAStore as typeof usePWAStore & {
      persist?: {
        hasHydrated?: () => boolean;
        onFinishHydration?: (callback: () => void) => (() => void) | void;
      };
    }).persist;

    let unsubscribeHydration: (() => void) | void;

    if (persist?.hasHydrated?.()) {
      markReady();
    } else if (persist?.onFinishHydration) {
      unsubscribeHydration = persist.onFinishHydration(() => {
        markReady();
      });
    } else {
      markReady();
    }

    return () => {
      if (typeof unsubscribeHydration === 'function') {
        unsubscribeHydration();
      }
      if (ready && typeof document !== 'undefined') {
        delete document.documentElement.dataset.pwaStoreHarness;
      }
    };
  }, []);

  return (
    <main
      data-testid="pwa-store-harness"
      className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 bg-slate-50 px-6 py-10"
    >
      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">PWA Store Harness</h1>
        <p className="mt-1 text-sm text-slate-600">
          Interact with the PWA store via <code>window.__pwaStoreHarness</code> for Playwright flows.
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div>
            <dt className="text-slate-500">Installed</dt>
            <dd data-testid="pwa-installed" className="font-medium text-slate-900">
              {String(installation.isInstalled)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Installable</dt>
            <dd data-testid="pwa-installable" className="font-medium text-slate-900">
              {String(installation.canInstall)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Online</dt>
            <dd data-testid="pwa-online" className="font-medium text-slate-900">
              {String(offline.isOnline)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Syncing</dt>
            <dd data-testid="pwa-syncing" className="font-medium text-slate-900">
              {String(isSyncing)}
            </dd>
          </div>
        </dl>
      </header>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Offline Queue</h2>
          <dl className="mt-3 space-y-2 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <dt>Queued actions</dt>
              <dd data-testid="pwa-queue-size" className="font-medium text-slate-900">
                {queueSize}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Cached pages</dt>
              <dd data-testid="pwa-cached-pages" className="font-medium text-slate-900">
                {cachedPages}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Cached resources</dt>
              <dd data-testid="pwa-cached-resources" className="font-medium text-slate-900">
                {cachedResources}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Last update</dt>
              <dd data-testid="pwa-queue-updated" className="font-medium text-slate-900">
                {formatLastUpdated(offlineQueueUpdatedAt)}
              </dd>
            </div>
          </dl>
        </aside>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Preferences</h2>
          <dl className="mt-3 space-y-2 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <dt>Install prompt</dt>
              <dd data-testid="pwa-pref-install-prompt" className="font-medium text-slate-900">
                {String(preferences.installPrompt)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Push notifications</dt>
              <dd data-testid="pwa-pref-notifications" className="font-medium text-slate-900">
                {String(preferences.pushNotifications)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Background sync</dt>
              <dd data-testid="pwa-pref-background-sync" className="font-medium text-slate-900">
                {String(preferences.backgroundSync)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Auto update</dt>
              <dd data-testid="pwa-pref-auto-update" className="font-medium text-slate-900">
                {String(preferences.autoUpdate)}
              </dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
        <div className="mt-3 flex flex-col gap-3" data-testid="pwa-notification-list">
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-500">No notifications queued.</p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
                data-notification-id={notification.id}
                data-type={notification.type}
                data-read={notification.read}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900">{formatNotification(notification)}</span>
                  <span className="text-xs text-slate-500">{notification.priority}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{notification.message}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Update Channel</h2>
        <dl className="mt-3 grid grid-cols-2 gap-4 text-sm text-slate-700 md:grid-cols-4">
          <div>
            <dt>Status</dt>
            <dd data-testid="pwa-update-available" className="font-medium text-slate-900">
              {String(update.isAvailable)}
            </dd>
          </div>
          <div>
            <dt>Downloading</dt>
            <dd data-testid="pwa-update-downloading" className="font-medium text-slate-900">
              {String(update.isDownloading)}
            </dd>
          </div>
          <div>
            <dt>Installing</dt>
            <dd data-testid="pwa-update-installing" className="font-medium text-slate-900">
              {String(update.isInstalling)}
            </dd>
          </div>
          <div>
            <dt>Channel</dt>
            <dd data-testid="pwa-update-channel" className="font-medium text-slate-900">
              {update.updateChannel}
            </dd>
          </div>
        </dl>
      </section>

      {error && (
        <section className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 shadow-sm">
          <h2 className="text-lg font-semibold">Error state</h2>
          <p data-testid="pwa-error">{error}</p>
        </section>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Harness Snapshot</h2>
        <pre data-testid="pwa-harness-snapshot" className="mt-3 overflow-x-auto rounded bg-slate-900 p-4 text-xs text-slate-100">
{JSON.stringify(harnessSnapshot, null, 2)}
        </pre>
      </section>
    </main>
  );
}

