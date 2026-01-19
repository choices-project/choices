/**
 * @jest-environment jsdom
 */
import { render, waitFor } from '@testing-library/react';
import React from 'react';

import UserOnboarding from '@/features/onboarding/components/UserOnboarding';

jest.mock('@/lib/stores/profileStore', () => {
  const actual = jest.requireActual('@/lib/stores/profileStore');
  return {
    profileSelectors: actual.profileSelectors,
    useProfileStore: jest.fn(),
  };
});

jest.mock('@/lib/stores', () => ({
  useOnboardingStep: jest.fn(),
  useOnboardingActions: jest.fn(),
  useUserCurrentAddress: jest.fn(),
  useUserCurrentState: jest.fn(),
  useUserRepresentatives: jest.fn(),
  useUserAddressLoading: jest.fn(),
  useUserActions: jest.fn(),
  useNotificationActions: jest.fn(),
}));

const mockedProfileStore = jest.requireMock('@/lib/stores/profileStore') as {
  useProfileStore: jest.Mock;
  profileSelectors: {
    location: (state: unknown) => unknown;
  };
};

const mockedStores = jest.requireMock('@/lib/stores') as {
  useOnboardingStep: jest.Mock;
  useOnboardingActions: jest.Mock;
  useUserCurrentAddress: jest.Mock;
  useUserCurrentState: jest.Mock;
  useUserRepresentatives: jest.Mock;
  useUserAddressLoading: jest.Mock;
  useUserActions: jest.Mock;
  useNotificationActions: jest.Mock;
};

const createDefaultActions = () => ({
  updateFormData: jest.fn(),
  goToStep: jest.fn(),
  markStepCompleted: jest.fn(),
  markStepSkipped: jest.fn(),
  restartOnboarding: jest.fn(),
  skipOnboarding: jest.fn(),
  completeOnboarding: jest.fn(),
  clearAllData: jest.fn(),
});

const createUserActions = () => ({
  setCurrentAddress: jest.fn(),
  setCurrentState: jest.fn(),
  setRepresentatives: jest.fn(),
  setShowAddressForm: jest.fn(),
  setNewAddress: jest.fn(),
  setAddressLoading: jest.fn(),
  setSavedSuccessfully: jest.fn(),
});

const renderComponent = () => render(<UserOnboarding onComplete={jest.fn()} onSkip={jest.fn()} />);

describe('UserOnboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedStores.useOnboardingStep.mockReturnValue(1);
    mockedStores.useOnboardingActions.mockReturnValue(createDefaultActions());
    mockedStores.useUserCurrentAddress.mockReturnValue('');
    mockedStores.useUserCurrentState.mockReturnValue('');
    mockedStores.useUserRepresentatives.mockReturnValue([]);
    mockedStores.useUserAddressLoading.mockReturnValue(false);
    mockedStores.useUserActions.mockReturnValue(createUserActions());
    mockedStores.useNotificationActions.mockReturnValue({ addNotification: jest.fn() });
  });

  it('prefills user state from profile location', async () => {
    const mockUserActions = createUserActions();
    mockedStores.useUserActions.mockReturnValue(mockUserActions);

    mockedProfileStore.useProfileStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        profile: {
          demographics: {
            location: {
              state: 'NY',
              district: '12',
            },
          },
        },
        userProfile: null,
      }),
    );

    renderComponent();

    await waitFor(() => {
      expect(mockUserActions.setCurrentState).toHaveBeenCalledWith('NY');
    });
  });

  it('does not set state when profile location is unavailable', async () => {
    const mockUserActions = createUserActions();
    mockedStores.useUserActions.mockReturnValue(mockUserActions);

    mockedProfileStore.useProfileStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        profile: null,
        userProfile: null,
      }),
    );

    renderComponent();

    await waitFor(() => {
      expect(mockUserActions.setCurrentState).not.toHaveBeenCalled();
    });
  });
});

