import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { updateProfile } from '@/features/profile/lib/profile-service';
import type { ProfileStore } from '@/lib/stores/profileStore';
import { profileStoreCreator } from '@/lib/stores/profileStore';
import { createSafeStorage } from '@/lib/stores/storage';

jest.mock('@/features/profile/lib/profile-service', () => ({
  updateProfile: jest.fn(),
}));

const createTestProfileStore = () =>
  create<ProfileStore>()(
    devtools(
      persist(
        immer(profileStoreCreator),
        {
          name: 'profile-store-test',
          storage: createSafeStorage(),
          partialize: (state) => ({
            profile: state.profile,
            userProfile: state.userProfile,
            preferences: state.preferences,
            privacySettings: state.privacySettings,
            isProfileLoaded: state.isProfileLoaded,
            isProfileComplete: state.isProfileComplete,
            profileCompleteness: state.profileCompleteness,
          }),
        },
      ),
      { name: 'profile-store-test' },
    ),
  );

describe('profileStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('setProfile updates profile and loaded flag', () => {
    const store = createTestProfileStore();

    expect(store.getState().isProfileLoaded).toBe(false);

    const profile = { id: 'profile-1', display_name: 'Ada' } as unknown as ProfileStore['profile'];
    store.getState().setProfile(profile);

    expect(store.getState().profile).toBe(profile);
    expect(store.getState().isProfileLoaded).toBe(true);
  });

  it('setUserProfile extracts preferences and privacy settings when provided', () => {
    const store = createTestProfileStore();
    const preferences = { theme: 'dark' };
    const privacy = { collectAnalytics: true };

    const userProfile = {
      id: 'user-1',
      preferences,
      privacy_settings: privacy,
    } as unknown as ProfileStore['userProfile'];

    store.getState().setUserProfile(userProfile);

    expect(store.getState().userProfile).toBe(userProfile);
    expect(store.getState().preferences).toBe(preferences);
    expect(store.getState().privacySettings).toBe(privacy);
  });

  it('resetProfile clears persisted state', () => {
    const store = createTestProfileStore();
    const profile = { id: 'profile-1', display_name: 'Ada' } as unknown as ProfileStore['profile'];

    store.getState().setProfile(profile);
    store.getState().setUserProfile(profile as unknown as ProfileStore['userProfile']);
    store.getState().resetProfile();

    const state = store.getState();
    expect(state.profile).toBeNull();
    expect(state.userProfile).toBeNull();
    expect(state.preferences).toBeNull();
    expect(state.privacySettings).toBeNull();
    expect(state.isProfileLoaded).toBe(false);
    expect(state.missingFields).toEqual([]);
  });

  it('updateProfileCompleteness marks missing required fields', () => {
    const store = createTestProfileStore();
    const profile = {
      id: 'profile-1',
      display_name: 'Ada',
      email: 'ada@example.com',
    } as unknown as ProfileStore['profile'];

    store.getState().setProfile(profile);
    store.getState().updateProfileCompleteness();

    const { isProfileComplete, missingFields, profileCompleteness } = store.getState();
    expect(isProfileComplete).toBe(false);
    expect(missingFields).toContain('username');
    expect(profileCompleteness).toBeLessThan(100);
  });

  it('updatePreferences merges partial updates into existing preferences on success', async () => {
    const store = createTestProfileStore();
    store.setState((state) => {
      state.preferences = { theme: 'dark', showDashboardCards: true } as any;
    });

    // Mock fetch instead of updateProfile since updatePreferences uses fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { preferences: { theme: 'light', showDashboardCards: true } },
      }),
    });

    const result = await store.getState().updatePreferences({ theme: 'light' });

    expect(global.fetch).toHaveBeenCalledWith('/api/profile', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ preferences: { theme: 'light' } }),
    }));
    expect(result).toBe(true);
    expect(store.getState().preferences).toEqual({
      theme: 'light',
      showDashboardCards: true,
    });
    expect(store.getState().isUpdating).toBe(false);
    expect(store.getState().error).toBeNull();
  });

  it('updatePreferences records error state when service fails', async () => {
    const store = createTestProfileStore();
    
    // Mock fetch to return an error response
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({
        error: 'network error',
      }),
    });

    const result = await store.getState().updatePreferences({ theme: 'light' });

    expect(global.fetch).toHaveBeenCalledWith('/api/profile', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ preferences: { theme: 'light' } }),
    }));
    expect(result).toBe(false);
    expect(store.getState().preferences).toBeNull();
    expect(store.getState().isUpdating).toBe(false);
    expect(store.getState().error).toBe('network error');
  });
});


