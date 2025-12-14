'use client';

import { useEffect, useMemo, useState } from 'react';

import type { AdminNotification, AdminUser, NewAdminNotification } from '@/features/admin/types';

import {
  useAdminStore,
  useAdminFeatureFlags,
  useAdminNotifications,
  useAdminSidebarCollapsed,
  type AdminStore,
  type AdminReimportProgress,
  useAdminSelectedUsers,
  useAdminShowBulkActions,
} from '@/lib/stores';

// Import buildAdminNotification from adminStore (it's not exported, so we'll define it locally)
const buildAdminNotification = (input: NewAdminNotification): AdminNotification => {
  const issuedAt = input.timestamp ?? new Date().toISOString();
  const createdAt = input.created_at ?? issuedAt;

  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  const base: AdminNotification = {
    id,
    timestamp: issuedAt,
    type: input.type,
    title: input.title,
    message: input.message,
    read: input.read ?? false,
    created_at: createdAt,
  };

  const overrides: Partial<AdminNotification> = {};

  if (input.action) {
    overrides.action = input.action;
  }

  if (input.metadata) {
    overrides.metadata = { ...(input.metadata as Record<string, unknown>) };
  }

  return { ...base, ...overrides };
};

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
  var __adminStoreHarness: AdminStoreHarness | undefined;
}

const formatList = (values: string[]) => (values.length ? values.join(', ') : 'none');

export default function AdminStoreHarnessPage() {
  const [_ready, setReady] = useState(false);
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

  // Actions are accessed directly from store in useEffect, no need to destructure here

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  // Set up harness with empty deps to ensure it's set immediately and doesn't re-run
  // Access actions from store state directly to avoid dependency issues
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const harness: AdminStoreHarness = {
      toggleSidebar: () => {
        const currentState = useAdminStore.getState();
        const next = !currentState.sidebarCollapsed;
        useAdminStore.setState((draft) => {
          draft.sidebarCollapsed = next;
        });
      },
      addNotification: (notification: NewAdminNotification) => {
        const newNotification = buildAdminNotification(notification);
        useAdminStore.setState((draft) => {
          draft.notifications.unshift(newNotification);
          if (draft.notifications.length > 10) {
            draft.notifications.length = 10;
          }
        });
      },
      markNotificationRead: (id: string) => {
        useAdminStore.setState((draft) => {
          const notification = draft.notifications.find((n) => n.id === id);
          if (notification) {
            notification.read = true;
          }
        });
      },
      enableFeatureFlag: (flagId: string) => {
        const currentState = useAdminStore.getState();
        const currentFlags = currentState.featureFlags.flags;
        if (currentFlags[flagId] === true) {
          return true;
        }
        useAdminStore.setState((draft) => {
          draft.featureFlags.flags[flagId] = true;
          if (!draft.featureFlags.enabledFlags.includes(flagId)) {
            draft.featureFlags.enabledFlags.push(flagId);
          }
          draft.featureFlags.disabledFlags = draft.featureFlags.disabledFlags.filter((f) => f !== flagId);
        });
        return true;
      },
      disableFeatureFlag: (flagId: string) => {
        const currentState = useAdminStore.getState();
        const currentFlags = currentState.featureFlags.flags;
        if (currentFlags[flagId] === false) {
          return true;
        }
        useAdminStore.setState((draft) => {
          draft.featureFlags.flags[flagId] = false;
          draft.featureFlags.enabledFlags = draft.featureFlags.enabledFlags.filter((f) => f !== flagId);
          if (!draft.featureFlags.disabledFlags.includes(flagId)) {
            draft.featureFlags.disabledFlags.push(flagId);
          }
        });
        return true;
      },
      setReimportProgress: (progress: Partial<AdminReimportProgress>) => {
        useAdminStore.setState((draft) => {
          Object.assign(draft.reimportProgress, progress);
        });
      },
      setIsReimportRunning: (running: boolean) => {
        useAdminStore.setState((draft) => {
          draft.isReimportRunning = running;
        });
      },
      seedUsers: (seed: AdminUser[]) => {
        useAdminStore.setState((draft) => {
          draft.users = seed;
        });
      },
      selectUser: (userId: string) => {
        useAdminStore.setState((draft) => {
          if (!draft.userFilters.selectedUsers.includes(userId)) {
            draft.userFilters.selectedUsers.push(userId);
          }
        });
      },
      deselectUser: (userId: string) => {
        useAdminStore.setState((draft) => {
          draft.userFilters.selectedUsers = draft.userFilters.selectedUsers.filter((id) => id !== userId);
        });
      },
      selectAllUsers: () => {
        const state = useAdminStore.getState();
        useAdminStore.setState((draft) => {
          draft.userFilters.selectedUsers = state.users.map((u) => u.id);
        });
      },
      deselectAllUsers: () => {
        useAdminStore.setState((draft) => {
          draft.userFilters.selectedUsers = [];
        });
      },
      resetAdminState: () => {
        useAdminStore.setState((draft) => {
          draft.notifications = [];
          draft.userFilters.selectedUsers = [];
          // Reset feature flags but preserve categories, isLoading, and error
          draft.featureFlags.flags = {};
          draft.featureFlags.enabledFlags = [];
          draft.featureFlags.disabledFlags = [];
          draft.featureFlags.lockedFlags = [];
          // Keep categories, isLoading, and error as they are
        });
      },
      getSnapshot: () => useAdminStore.getState(),
    };

    window.__adminStoreHarness = harness;

    // Set dataset attribute to signal readiness (similar to other harness pages)
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.adminStoreHarness = 'ready';
    }

    // Mark as ready
    setReady(true);

    return () => {
      if (window.__adminStoreHarness === harness) {
        delete (window as any).__adminStoreHarness;
      }
      if (typeof document !== 'undefined') {
        delete document.documentElement.dataset.adminStoreHarness;
      }
    };
  }, []); // Empty deps - set up once, access store directly

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


