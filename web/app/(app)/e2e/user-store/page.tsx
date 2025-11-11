'use client';

import { useEffect } from 'react';

import { useUserStore, type UserStore } from '@/lib/stores/userStore';

export type UserStoreHarness = {
  setUser: UserStore['setUser'];
  setSession: UserStore['setSession'];
  setUserAndAuth: UserStore['setUserAndAuth'];
  setSessionAndDerived: UserStore['setSessionAndDerived'];
  initializeAuth: UserStore['initializeAuth'];
  setProfile: UserStore['setProfile'];
  updateProfileField: UserStore['updateProfileField'];
  updateArrayField: UserStore['updateArrayField'];
  clearUser: UserStore['clearUser'];
  getSnapshot: () => UserStore;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    __userStoreHarness?: UserStoreHarness;
  }
}

const toDisplayString = (value: unknown) => {
  if (value === null || value === undefined) {
    return 'none';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
};

export default function UserStoreHarnessPage() {
  const user = useUserStore((state) => state.user);
  const session = useUserStore((state) => state.session);
  const profile = useUserStore((state) => state.profile);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const profileEditData = useUserStore((state) => state.profileEditData);
  const preferences = useUserStore((state) => state.profile?.privacy_settings ?? null);
  const currentAddress = useUserStore((state) => state.currentAddress);
  const representatives = useUserStore((state) => state.representatives);

  useEffect(() => {
    const api = useUserStore.getState();
    const harness: UserStoreHarness = {
      setUser: api.setUser,
      setSession: api.setSession,
      setUserAndAuth: api.setUserAndAuth,
      setSessionAndDerived: api.setSessionAndDerived,
      initializeAuth: api.initializeAuth,
      setProfile: api.setProfile,
      updateProfileField: api.updateProfileField,
      updateArrayField: api.updateArrayField,
      clearUser: api.clearUser,
      getSnapshot: () => useUserStore.getState(),
    };

    window.__userStoreHarness = harness;
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.userStoreHarness = 'ready';
    }
    return () => {
      if (window.__userStoreHarness === harness) {
        delete window.__userStoreHarness;
      }
      if (typeof document !== 'undefined' && document.documentElement.dataset.userStoreHarness === 'ready') {
        delete document.documentElement.dataset.userStoreHarness;
      }
    };
  }, []);

  return (
    <main data-testid="user-store-harness" className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold">User Store Harness</h1>
        <p className="text-sm text-slate-600">
          Interact with the user store via <code>window.__userStoreHarness</code>.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <div>
          <h2 className="text-lg font-medium">Authentication</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt>Authenticated</dt>
              <dd data-testid="user-authenticated">{String(isAuthenticated)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>User ID</dt>
              <dd data-testid="user-id">{user?.id ?? 'none'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Session</dt>
              <dd data-testid="user-session">{session?.access_token ?? 'none'}</dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 className="text-lg font-medium">Profile</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt>Display name</dt>
              <dd data-testid="user-profile-display-name">{profile?.username ?? 'none'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Privacy settings</dt>
              <dd data-testid="user-profile-privacy">{toDisplayString(preferences)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <div>
          <h2 className="text-lg font-medium">Profile Edit Data</h2>
          <pre
            data-testid="user-profile-edit"
            className="mt-2 max-h-56 overflow-auto rounded bg-slate-50 p-3 text-xs text-slate-700"
          >
            {JSON.stringify(profileEditData ?? {}, null, 2)}
          </pre>
        </div>
        <div>
          <h2 className="text-lg font-medium">Address & Representatives</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt>Current address</dt>
              <dd data-testid="user-current-address">{currentAddress || 'none'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Representatives</dt>
              <dd data-testid="user-representatives">{representatives.length}</dd>
            </div>
          </dl>
        </div>
      </section>
    </main>
  );
}

