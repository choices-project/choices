/**
 * @jest-environment jsdom
 */

import { act, renderHook } from '@testing-library/react';

import { useProfile, useProfileLoadingStates, useProfileUpdate } from '@/features/profile/hooks/use-profile';
import type { ProfileStore } from '@/lib/stores/profileStore';
import { initialProfileState, useProfileStore } from '@/lib/stores/profileStore';

const resetProfileStore = () => {
  const reset = useProfileStore.getState().resetProfile;
  act(() => {
    reset();
    useProfileStore.setState((state) => {
      state.isProfileLoading = initialProfileState.isProfileLoading;
      state.isUpdating = initialProfileState.isUpdating;
      state.isUploadingAvatar = initialProfileState.isUploadingAvatar;
      state.isExporting = initialProfileState.isExporting;
      state.error = initialProfileState.error;
    });
  });
};

describe('profile feature hooks', () => {
  beforeEach(() => {
    resetProfileStore();
  });

  it('useProfile returns hydrated profile data from the store', () => {
    const profile = {
      id: 'user-1',
      username: 'ada',
      email: 'ada@example.com',
    } as unknown as ProfileStore['profile'];

    act(() => {
      useProfileStore.getState().setProfile(profile);
    });

    const { result } = renderHook(() => useProfile());

    expect(result.current.profile?.id).toBe('user-1');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('useProfileUpdate delegates to store action', async () => {
    const updateProfileMock = jest.fn().mockResolvedValue({ success: true });

    act(() => {
      useProfileStore.setState((state) => {
        state.updateProfile = updateProfileMock;
      });
    });

    const { result } = renderHook(() => useProfileUpdate());

    await act(async () => {
      const response = await result.current.updateProfile({ display_name: 'Ada' });
      expect(response).toEqual({ success: true });
    });

    expect(updateProfileMock).toHaveBeenCalledWith({ display_name: 'Ada' });
  });

  it('useProfileLoadingStates reflects store loading flags', () => {
    act(() => {
      useProfileStore.setState((state) => {
        state.isProfileLoading = true;
        state.isUpdating = true;
        state.isUploadingAvatar = false;
        state.isExporting = true;
      });
    });

    const { result } = renderHook(() => useProfileLoadingStates());

    expect(result.current).toEqual(
      expect.objectContaining({
        isLoading: true,
        isUpdating: true,
        isUpdatingAvatar: false,
        isExporting: true,
        isAnyUpdating: true,
      }),
    );
  });
});


