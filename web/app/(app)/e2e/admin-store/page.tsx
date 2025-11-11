'use client';

import { useEffect, useMemo } from 'react';

import {
  useAdminStore,
  useAdminActions,
  useAdminFeatureFlags,
  useAdminFeatureFlagActions,
  useAdminNotifications,
  useAdminSidebarCollapsed,
  type AdminStore,
  type AdminReimportProgress,
  useAdminReimportActions,
  useAdminSelectedUsers,
  useAdminShowBulkActions,
  useAdminUserActions,
} from '@/lib/stores';
import type { AdminUser, NewAdminNotification } from '@/features/admin/types';

export type AdminStoreHarness = {
  toggleSidebar: () => void;
  addNotification: (notification: NewAdminNotification) => void;
  markNotificationRead: (id: string) => void;
  enableFeatureFlag: (flagId: string) => boolean;
  disableFeatureFlag: (flagId: string) => boolean;
  setReimportProgress: (progress: Partial<AdminReimportProgress>) => void;
  setIsReimportRunning: (running: boolean) => void;
  seedUsers: (users: AdminUser[]) => void;
  selectUser: (userId: string) => void;
  deselectUser: (userId: string) => void;
  selectAllUsers: () => void;
  deselectAllUsers: () => void;
  resetAdminState: () => void;
  getSnapshot: () => AdminStore;
};

declare global {
  interface Window {
    __adminStoreHarness?: AdminStoreHarness;
  }
}

const formatList = (values: string[]) => (values.length ? values.join(', ') : 'none');

export default function AdminStoreHarnessPage() {
  const sidebarCollapsed = useAdminSidebarCollapsed();
  const notifications = useAdminNotifications();
  const featureFlags = useAdminFeatureFlags();

  const currentPage = useAdminStore((state) => state.currentPage);
  const activeTab = useAdminStore((state) => state.activeTab);
  const users = useAdminStore((state) => state.users);
  const selectedUsers = useAdminSelectedUsers();
  const showBulkActions = useAdminShowBulkActions();
  const reimportProgress = useAdminStore((state) => state.reimportProgress);
  const isReimportRunning = useAdminStore((state) => state.isReimportRunning);
  const reimportLogs = useAdminStore((state) => state.reimportLogs);

  const { toggleSidebar, addNotification, markNotificationRead, resetAdminState } = useAdminActions();
  const { setReimportProgress, setIsReimportRunning } = useAdminReimportActions();
  const { enableFeatureFlag, disableFeatureFlag } = useAdminFeatureFlagActions();
  const { selectUser, deselectUser, selectAllUsers, deselectAllUsers } = useAdminUserActions();

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  useEffect(() => {
    const harness: AdminStoreHarness = {
      toggleSidebar,
      addNotification,
      markNotificationRead,
      enableFeatureFlag,
      disableFeatureFlag,
      setReimportProgress,
      setIsReimportRunning,
      seedUsers: (seed: AdminUser[]) => {
        useAdminStore.setState((draft) => {
          draft.users = seed;
        });
      },
      selectUser,
      deselectUser,
      selectAllUsers,
      deselectAllUsers,
      resetAdminState,
      getSnapshot: () => useAdminStore.getState(),
    };

    window.__adminStoreHarness = harness;
    return () => {
      if (window.__adminStoreHarness === harness) {
        delete window.__adminStoreHarness;
      }
    };
  }, [
    toggleSidebar,
    addNotification,
    markNotificationRead,
    enableFeatureFlag,
    disableFeatureFlag,
    setReimportProgress,
    setIsReimportRunning,
    selectUser,
    deselectUser,
    selectAllUsers,
    deselectAllUsers,
    resetAdminState,
  ]);

  return (
    <main data-testid="admin-store-harness" className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold">Admin Store Harness</h1>
        <p className="text-sm text-slate-600">
          Interact with the admin store via <code>window.__adminStoreHarness</code>.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <div>
          <h2 className="text-lg font-medium">Shell State</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt>Sidebar collapsed</dt>
              <dd data-testid="admin-sidebar-collapsed">{String(sidebarCollapsed)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Current page</dt>
              <dd data-testid="admin-current-page">{currentPage}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Active tab</dt>
              <dd data-testid="admin-active-tab">{activeTab}</dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 className="text-lg font-medium">Notifications</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt>Total notifications</dt>
              <dd data-testid="admin-notification-count">{notifications.length}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Unread notifications</dt>
              <dd data-testid="admin-unread-count">{unreadCount}</dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 className="text-lg font-medium">Users</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt>Total users</dt>
              <dd data-testid="admin-users-count">{users.length}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Bulk actions visible</dt>
              <dd data-testid="admin-bulk-actions-visible">{String(showBulkActions)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Selected user IDs</dt>
              <dd data-testid="admin-selected-users">{formatList(selectedUsers)}</dd>
            </div>
          </dl>
          <ul className="mt-2 space-y-1 text-xs" data-testid="admin-users-list">
            {users.length === 0 ? (
              <li className="text-slate-500">No users seeded.</li>
            ) : (
              users.map((user) => (
                <li key={user.id} className="rounded border border-slate-200 p-2">
                  <span className="font-medium">{user.name}</span>{' '}
                  <span className="text-slate-500">({user.role})</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-medium">Feature Flags</h2>
        <dl className="mt-2 space-y-1 text-sm">
          <div className="flex justify-between gap-2">
            <dt>Enabled</dt>
            <dd data-testid="admin-feature-flags-enabled">
              {formatList(featureFlags.enabledFlags)}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Disabled</dt>
            <dd data-testid="admin-feature-flags-disabled">
              {formatList(featureFlags.disabledFlags)}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Locked</dt>
            <dd data-testid="admin-feature-flags-locked">
              {formatList(featureFlags.lockedFlags)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-medium">Reimport Progress</h2>
        <dl className="mt-2 space-y-1 text-sm">
          <div className="flex justify-between gap-2">
            <dt>Running</dt>
            <dd data-testid="admin-reimport-running">{String(isReimportRunning)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Processed</dt>
            <dd data-testid="admin-reimport-progress">
              {reimportProgress.processedStates}/{reimportProgress.totalStates}
            </dd>
          </div>
        </dl>
        <ul className="mt-2 space-y-1 text-xs" data-testid="admin-reimport-logs">
          {reimportLogs.length === 0 ? (
            <li className="text-slate-500">No logs recorded.</li>
          ) : (
            reimportLogs.map((log, index) => (
              <li key={`${log}-${index}`} className="rounded border border-slate-200 p-2">
                {log}
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-medium">Notifications List</h2>
        <ul className="mt-2 space-y-2 text-sm" data-testid="admin-notification-list">
          {notifications.length === 0 ? (
            <li className="text-slate-500">No notifications available.</li>
          ) : (
            notifications.map((notification) => (
              <li key={notification.id} className="flex flex-col rounded border border-slate-200 p-2">
                <span className="font-medium">{notification.title}</span>
                <span className="text-slate-600">{notification.message}</span>
                <span className="text-xs text-slate-400">
                  {notification.type} · {notification.read ? 'read' : 'unread'}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}


