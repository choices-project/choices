'use client';

import { useEffect } from 'react';

import { useProfileStore, type ProfileStore } from '@/lib/stores/profileStore';

export type ProfileStoreHarness = {
  setProfile: ProfileStore['setProfile'];
  setUserProfile: ProfileStore['setUserProfile'];
  updateProfileCompleteness: ProfileStore['updateProfileCompleteness'];
  resetProfile: ProfileStore['resetProfile'];
  getSnapshot: () => ProfileStore;
};

declare global {
  var __profileStoreHarness: ProfileStoreHarness | undefined;
}

const formatArray = (values: string[]) => (values.length ? values.join(',') : 'none');

export default function ProfileStoreHarnessPage() {
  const profile = useProfileStore((state) => state.profile);
  const userProfile = useProfileStore((state) => state.userProfile);
  const isProfileLoaded = useProfileStore((state) => state.isProfileLoaded);
  const profileCompleteness = useProfileStore((state) => state.profileCompleteness);
  const missingFields = useProfileStore((state) => state.missingFields);
  const preferences = useProfileStore((state) => state.preferences);
  const setProfile = useProfileStore((state) => state.setProfile);
  const setUserProfile = useProfileStore((state) => state.setUserProfile);
  const updateProfileCompleteness = useProfileStore((state) => state.updateProfileCompleteness);
  const resetProfile = useProfileStore((state) => state.resetProfile);

  useEffect(() => {
    const harness: ProfileStoreHarness = {
      setProfile,
      setUserProfile,
      updateProfileCompleteness,
      resetProfile,
      getSnapshot: () => useProfileStore.getState()
    };

    window.__profileStoreHarness = harness;
    return () => {
      if (window.__profileStoreHarness === harness) {
        delete window.__profileStoreHarness;
      }
    };
  }, [setProfile, setUserProfile, updateProfileCompleteness, resetProfile]);

  return (
    <main data-testid="profile-store-harness" className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold">Profile Store Harness</h1>
        <p className="text-sm text-slate-600">
          Interact with the profile store via <code>window.__profileStoreHarness</code>.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <div>
          <h2 className="text-lg font-medium">State</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt>Loaded</dt>
              <dd data-testid="profile-loaded">{String(isProfileLoaded)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Display name</dt>
              <dd data-testid="profile-display-name">{profile?.display_name ?? 'none'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Username</dt>
              <dd data-testid="profile-username">{profile?.username ?? 'none'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Completeness</dt>
              <dd data-testid="profile-completeness">{String(profileCompleteness)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Missing fields</dt>
              <dd data-testid="profile-missing-fields">{formatArray(missingFields)}</dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 className="text-lg font-medium">Derived</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt>Preferences theme</dt>
              <dd data-testid="profile-preferences-theme">{preferences?.theme ?? 'none'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>User profile present</dt>
              <dd data-testid="profile-user-present">{String(Boolean(userProfile))}</dd>
            </div>
          </dl>
        </div>
      </section>
    </main>
  );
}

