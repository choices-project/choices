'use client';

import { useEffect } from 'react';

import { useUserStore, type UserStore } from '@/lib/stores/userStore';

export type UserStoreHarness = {
  setUser: UserStore['setUser'];
  setSession: UserStore['setSession'];
  setUserAndAuth: UserStore['setUserAndAuth'];
  setSessionAndDerived: UserStore['setSessionAndDerived'];
  initializeAuth: UserStore['initializeAuth'];
  signOut: UserStore['signOut'];
  setUserError: UserStore['setUserError'];
  clearUserError: UserStore['clearUserError'];
  setProfile: UserStore['setProfile'];
  updateProfileField: UserStore['updateProfileField'];
  updateArrayField: UserStore['updateArrayField'];
  setProfileEditError: UserStore['setProfileEditError'];
  clearProfileEditError: UserStore['clearProfileEditError'];
  clearAllProfileEditErrors: UserStore['clearAllProfileEditErrors'];
  setCurrentAddress: UserStore['setCurrentAddress'];
  setRepresentatives: UserStore['setRepresentatives'];
  setBiometricSupported: UserStore['setBiometricSupported'];
  setBiometricAvailable: UserStore['setBiometricAvailable'];
  setBiometricCredentials: UserStore['setBiometricCredentials'];
  setBiometricRegistering: UserStore['setBiometricRegistering'];
  setBiometricError: UserStore['setBiometricError'];
  setBiometricSuccess: UserStore['setBiometricSuccess'];
  resetBiometric: UserStore['resetBiometric'];
  clearUser: UserStore['clearUser'];
  getSnapshot: () => UserStore;
};

declare global {
  var __userStoreHarness: UserStoreHarness | undefined;
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
  const profileEditErrors = useUserStore((state) => state.profileEditErrors);
  const preferences = useUserStore((state) => state.profile?.privacy_settings ?? null);
  const currentAddress = useUserStore((state) => state.currentAddress);
  const representatives = useUserStore((state) => state.representatives);
  const biometric = useUserStore((state) => state.biometric);
  const userError = useUserStore((state) => state.error);

  useEffect(() => {
    const api = useUserStore.getState();
    const harness: UserStoreHarness = {
      setUser: api.setUser,
      setSession: api.setSession,
      setUserAndAuth: api.setUserAndAuth,
      setSessionAndDerived: api.setSessionAndDerived,
      initializeAuth: api.initializeAuth,
      signOut: api.signOut,
      setUserError: api.setUserError,
      clearUserError: api.clearUserError,
      setProfile: api.setProfile,
      updateProfileField: api.updateProfileField,
      updateArrayField: api.updateArrayField,
      setProfileEditError: api.setProfileEditError,
      clearProfileEditError: api.clearProfileEditError,
      clearAllProfileEditErrors: api.clearAllProfileEditErrors,
      setCurrentAddress: api.setCurrentAddress,
      setRepresentatives: api.setRepresentatives,
      setBiometricSupported: api.setBiometricSupported,
      setBiometricAvailable: api.setBiometricAvailable,
      setBiometricCredentials: api.setBiometricCredentials,
      setBiometricRegistering: api.setBiometricRegistering,
      setBiometricError: api.setBiometricError,
      setBiometricSuccess: api.setBiometricSuccess,
      resetBiometric: api.resetBiometric,
      clearUser: api.clearUser,
      getSnapshot: () => useUserStore.getState(),
    };

    window.__userStoreHarness = harness;

    return () => {
      if (window.__userStoreHarness === harness) {
        delete window.__userStoreHarness;
      }
    };
  }, []);

  useEffect(() => {
    let ready = false;
    const markReady = () => {
      if (ready) return;
      ready = true;
      if (typeof document !== 'undefined') {
        document.documentElement.dataset.userStoreHarness = 'ready';
      }
    };

    const persist = (useUserStore as typeof useUserStore & {
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
            <div className="flex justify-between gap-2">
              <dt>Error</dt>
              <dd data-testid="user-error">{toDisplayString(userError)}</dd>
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
          <pre
            data-testid="user-profile-edit-errors"
            className="mt-2 max-h-56 overflow-auto rounded bg-rose-50 p-3 text-xs text-rose-700"
          >
            {JSON.stringify(profileEditErrors ?? {}, null, 2)}
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

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-medium">Biometric / Passkey State</h2>
        <dl className="mt-2 space-y-1 text-sm">
          <div className="flex justify-between gap-2">
            <dt>Supported</dt>
            <dd data-testid="user-biometric-supported">{toDisplayString(biometric.isSupported)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Available</dt>
            <dd data-testid="user-biometric-available">{toDisplayString(biometric.isAvailable)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Has Credentials</dt>
            <dd data-testid="user-biometric-credentials">{toDisplayString(biometric.hasCredentials)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Registering</dt>
            <dd data-testid="user-biometric-registering">{String(biometric.isRegistering)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Success</dt>
            <dd data-testid="user-biometric-success">{String(biometric.success)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Error</dt>
            <dd data-testid="user-biometric-error">{toDisplayString(biometric.error)}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}

