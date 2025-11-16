/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import type { ProfileEditProps } from '@/features/profile';
import ProfileEdit from '@/features/profile/components/ProfileEdit';
import { createInitialProfileState, useProfileStore } from '@/lib/stores/profileStore';
import { createInitialUserState, useUserStore } from '@/lib/stores/userStore';
 

const mockUpdateProfile = jest.fn();
const mockUploadAvatar = jest.fn();
/* eslint-disable no-restricted-syntax */
jest.mock('@/features/profile/hooks/use-profile', () => {
  const actual = jest.requireActual('@/features/profile/hooks/use-profile');

  return {
    ...actual,
    useProfileUpdate: () => ({
      updateProfile: mockUpdateProfile,
      isUpdating: false,
      error: null,
    }),
    useProfileAvatar: () => ({
      uploadAvatar: mockUploadAvatar,
      isUploading: false,
      error: null,
    }),
    useProfileDisplay: () => ({
      displayName: 'Ada Lovelace',
      initials: 'AL',
      trustTier: 'T1',
      trustTierDisplay: 'Verified',
      isAdmin: false,
    }),
  };
});
/* eslint-enable no-restricted-syntax */

const createProfile = (overrides: Partial<ProfileEditProps['profile']> = {}) =>
  ({
    id: 'profile-1',
    display_name: 'Ada Lovelace',
    bio: 'Mathematician and writer',
    username: 'adalovelace',
    avatar_url: 'https://example.com/avatar.png',
    primary_concerns: [] as string[],
    community_focus: [] as string[],
    participation_style: 'participant',
    privacy_settings: {
      show_email: false,
      show_activity: false,
      allow_messages: false,
    },
    demographics: {
      languages: ['English'],
    },
    ...(overrides as Record<string, unknown>),
  }) as ProfileEditProps['profile'];

const renderComponent = (props: ProfileEditProps = {}) => {
  const profile = props.profile === undefined ? createProfile() : props.profile;
  const onSave = props.onSave ?? jest.fn();
  const onCancel = props.onCancel ?? jest.fn();

  render(
    <ProfileEdit
      profile={profile}
      onSave={onSave}
      onCancel={onCancel}
      isLoading={props.isLoading ?? false}
      error={props.error ?? null}
    />,
  );

  return { profile, onSave, onCancel };
};

describe('ProfileEdit', () => {
  beforeEach(() => {
    useUserStore.setState(createInitialUserState());
    useProfileStore.setState(createInitialProfileState());
    mockUpdateProfile.mockReset();
    mockUploadAvatar.mockReset();
  });

  it('binds inputs to user store draft and submits typed payload', async () => {
    const { profile, onSave } = renderComponent();

    mockUpdateProfile.mockResolvedValue({
      success: true,
      data: { ...(profile ?? {}), display_name: 'Persisted Name' },
      error: null,
    });

    await waitFor(() => {
      expect(useUserStore.getState().profileEditData).not.toBeNull();
    });

    const nameInput = screen.getByLabelText(/display name/i);
    fireEvent.change(nameInput, { target: { value: 'Countess Ada' } });

    expect(useUserStore.getState().profileEditData?.display_name).toBe('Countess Ada');

    const climateButton = screen.getByRole('button', { name: 'Climate Change' });
    fireEvent.click(climateButton);

    expect(useUserStore.getState().profileEditData?.primary_concerns).toEqual(['Climate Change']);

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    expect(mockUpdateProfile).toHaveBeenLastCalledWith(
      expect.objectContaining({
        display_name: 'Countess Ada',
        primary_concerns: ['Climate Change'],
      }),
    );
    expect(onSave).toHaveBeenLastCalledWith(
      expect.objectContaining({
        display_name: 'Countess Ada',
        primary_concerns: ['Climate Change'],
      }),
    );

    await waitFor(() => {
      expect(useUserStore.getState().profileEditData?.display_name).toBe('Persisted Name');
    });

    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Temporary Name' },
    });

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(useUserStore.getState().profileEditData?.display_name).toBe(profile.display_name);
    });
  });
  it('hydrates from profile store when no profile prop is provided', async () => {
    const storeProfile = createProfile({ display_name: 'Store User', username: 'storeuser' });
    useProfileStore.setState({ profile: storeProfile });

    const onSave = jest.fn();

    renderComponent({ profile: null, onSave });

    await waitFor(() => {
      expect(screen.getByLabelText(/display name/i)).toHaveValue('Store User');
    });

    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Updated Store User' },
    });

    mockUpdateProfile.mockResolvedValue({
      success: true,
      data: storeProfile,
      error: null,
    });

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ display_name: 'Updated Store User' }),
      );
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ display_name: 'Updated Store User' }),
      );
    });
  });

  it('resets to store profile values when cancel is triggered without profile prop', async () => {
    const storeProfile = createProfile({ display_name: 'Persisted Store User' });
    useProfileStore.setState({ profile: storeProfile });

    renderComponent({ profile: null });

    await waitFor(() => {
      expect(screen.getByLabelText(/display name/i)).toHaveValue('Persisted Store User');
    });

    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Transient Name' },
    });

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/display name/i)).toHaveValue('Persisted Store User');
    });
  });
});

