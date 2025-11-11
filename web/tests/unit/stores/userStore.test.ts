import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type { UserStore } from '@/lib/stores/userStore';
import { createInitialUserState, createUserActions } from '@/lib/stores/userStore';

const createTestUserStore = () =>
  create<UserStore>()(
    immer((set, get, _api) =>
      Object.assign(createInitialUserState(), createUserActions(set, get))
    )
  );

describe('userStore', () => {
  const originalFetch = global.fetch;

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('setUserAndAuth updates user state and authentication flag', () => {
    const store = createTestUserStore();
    const user = { id: 'user-123' } as unknown as Parameters<UserStore['setUser']>[0];

    store.getState().setUserAndAuth(user, true);

    expect(store.getState().user).toBe(user);
    expect(store.getState().isAuthenticated).toBe(true);
  });

  it('updateProfileField initializes profileEditData when missing', () => {
    const store = createTestUserStore();

    store.getState().updateProfileField('display_name', 'Ada Lovelace');

    expect(store.getState().profileEditData).toMatchObject({ display_name: 'Ada Lovelace' });
  });

  it('updateArrayField toggles array membership', () => {
    const store = createTestUserStore();

    store.getState().updateArrayField('primary_concerns', 'climate');
    expect(store.getState().profileEditData?.primary_concerns).toEqual(['climate']);

    store.getState().updateArrayField('primary_concerns', 'climate');
    expect(store.getState().profileEditData?.primary_concerns).toEqual([]);
  });

  it('updatePrivacySetting creates nested privacy structure', () => {
    const store = createTestUserStore();

    store.getState().updatePrivacySetting('collectAnalytics', true);

    expect(store.getState().profileEditData?.privacy_settings).toMatchObject({
      collectAnalytics: true,
    });
  });

  it('handleAddressUpdate stores address when user has consented', async () => {
    jest.useFakeTimers();
    const store = createTestUserStore();
    const representatives = [{ id: 'rep-1' }];

    store.getState().setProfile({
      id: 'profile-1',
      privacy_settings: {
        collectLocationData: true,
      },
    } as unknown as UserStore['profile']);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: representatives }),
    }) as unknown as typeof global.fetch;

    await store.getState().handleAddressUpdate('123 Main St');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/civics/address-lookup?address=123%20Main%20St'
    );
    expect(store.getState().currentAddress).toBe('123 Main St');
    expect(store.getState().representatives).toEqual(representatives);
    expect(store.getState().savedSuccessfully).toBe(true);

    jest.advanceTimersByTime(3000);
    expect(store.getState().savedSuccessfully).toBe(false);

    jest.useRealTimers();
  });

  it('handleAddressUpdate avoids storing address without consent', async () => {
    jest.useFakeTimers();
    const store = createTestUserStore();

    store.getState().setProfile({
      id: 'profile-1',
      privacy_settings: {
        collectLocationData: false,
      },
    } as unknown as UserStore['profile']);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    }) as unknown as typeof global.fetch;

    await store.getState().handleAddressUpdate('456 Market St');

    expect(store.getState().currentAddress).toBe('');
    expect(store.getState().representatives).toEqual([]);

    jest.useRealTimers();
  });

  it('clearUser resets session, profile editing, and address state', () => {
    const store = createTestUserStore();

    store.getState().setUserAndAuth({ id: 'user-1' } as any, true);
    store.getState().setSession({ access_token: 'token' } as any);
    store.getState().setProfile({ id: 'profile-1' } as any);
    store.getState().setProfileEditData({ display_name: 'Ada' } as any);
    store.getState().setProfileEditing(true);
    store.getState().setProfileEditError('display_name', 'Required');
    store.getState().setCurrentAddress('123 Main St');
    store.getState().setCurrentState('CA');
    store.getState().setRepresentatives([{ id: 'rep-1' }] as any);
    store.getState().setShowAddressForm(true);
    store.getState().setNewAddress('456 Market St');
    store.getState().setAddressLoading(true);
    store.getState().setSavedSuccessfully(true);
    store.getState().setAvatarFile({} as File);
    store.getState().setAvatarPreview('preview');
    store.getState().setUploadingAvatar(true);
    store.getState().setBiometricSupported(true);
    store.getState().setBiometricAvailable(true);
    store.getState().setBiometricCredentials(true);
    store.getState().setBiometricRegistering(true);
    store.getState().setBiometricError('err');
    store.getState().setBiometricSuccess(true);
    store.getState().setError('problem');
    store.getState().setLoading(true);
    store.getState().setProfileLoading(true);
    store.getState().setUpdating(true);

    store.getState().clearUser();

    const state = store.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.profile).toBeNull();
    expect(state.profileEditData).toBeNull();
    expect(state.isProfileEditing).toBe(false);
    expect(state.profileEditErrors).toEqual({});
    expect(state.currentAddress).toBe('');
    expect(state.currentState).toBe('');
    expect(state.representatives).toEqual([]);
    expect(state.showAddressForm).toBe(false);
    expect(state.newAddress).toBe('');
    expect(state.addressLoading).toBe(false);
    expect(state.savedSuccessfully).toBe(false);
    expect(state.avatarFile).toBeNull();
    expect(state.avatarPreview).toBeNull();
    expect(state.isUploadingAvatar).toBe(false);
    expect(state.biometric).toEqual({
      isSupported: null,
      isAvailable: null,
      hasCredentials: null,
      isRegistering: false,
      error: null,
      success: false,
    });
    expect(state.error).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.isProfileLoading).toBe(false);
    expect(state.isUpdating).toBe(false);
  });

  it('setSessionAndDerived clears state when session is removed', () => {
    const store = createTestUserStore();

    store.getState().setSessionAndDerived({
      access_token: 'token',
      user: { id: 'user-1' } as any,
    } as any);

    expect(store.getState().isAuthenticated).toBe(true);
    expect(store.getState().user?.id).toBe('user-1');

    store.getState().setSessionAndDerived(null);

    const state = store.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.profileEditData).toBeNull();
    expect(state.representatives).toEqual([]);
  });
});

