/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import ProfilePage from '@/features/profile/components/ProfilePage';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/features/profile/hooks/use-profile', () => ({
  useProfileData: jest.fn(),
  useProfileDisplay: jest.fn(),
  useProfileCompleteness: jest.fn(),
  useProfileLoadingStates: jest.fn(),
  useProfileExport: jest.fn(),
}));

jest.mock('@/lib/stores', () => ({
  useIsAuthenticated: jest.fn(),
  useUserLoading: jest.fn(),
}));

type ProfileHooksModule = typeof import('@/features/profile/hooks/use-profile');
type StoreModule = typeof import('@/lib/stores');
type NavigationModule = typeof import('next/navigation');

type MockedProfileHooks = { [K in keyof ProfileHooksModule]: jest.Mock };
type MockedStoreHooks = { [K in keyof StoreModule]: jest.Mock };
type MockedNavigation = { [K in keyof NavigationModule]: jest.Mock };

const mockedProfileHooks = jest.requireMock('@/features/profile/hooks/use-profile') as MockedProfileHooks;
const mockedStores = jest.requireMock('@/lib/stores') as MockedStoreHooks;
const mockedNavigation = jest.requireMock('next/navigation') as MockedNavigation;

const mockRouterPush = jest.fn();

const baseProfileData = {
  profile: null as Record<string, unknown> | null,
  isLoading: false,
  error: null as string | null,
  refetch: jest.fn(),
};

const baseDisplay = {
  displayName: 'Ada Lovelace',
  initials: 'AL',
  trustTier: 'T1',
  trustTierDisplay: 'Verified',
  isAdmin: false,
};

const baseCompleteness = {
  isComplete: true,
  missingFields: [] as string[],
  completionPercentage: 100,
};

const loadingStates = {
  isLoading: false,
  isUpdating: false,
  isUpdatingAvatar: false,
  isExporting: false,
  isAnyUpdating: false,
};

type MockOptions = {
  profile?: Record<string, unknown> | null;
  profileLoading?: boolean;
  profileError?: string | null;
  isAuthenticated?: boolean;
  userLoading?: boolean;
  exportOverrides?: Partial<ReturnType<typeof mockedProfileHooks.useProfileExport>>;
};

const setupMocks = (options: MockOptions = {}) => {
  const {
    profile = null,
    profileLoading = false,
    profileError = null,
    isAuthenticated = true,
    userLoading = false,
    exportOverrides = {},
  } = options;

  mockedProfileHooks.useProfileData.mockReturnValue({
    ...baseProfileData,
    profile,
    isLoading: profileLoading,
    error: profileError,
  });

  mockedProfileHooks.useProfileDisplay.mockReturnValue(baseDisplay);
  mockedProfileHooks.useProfileCompleteness.mockReturnValue(baseCompleteness);
  mockedProfileHooks.useProfileLoadingStates.mockReturnValue(loadingStates);
  mockedProfileHooks.useProfileExport.mockReturnValue({
    exportProfile: jest.fn().mockResolvedValue({
      profile: { id: 'profile-1' },
      preferences: {} as Record<string, unknown>,
      activity: [],
      votes: [],
      comments: [],
    }),
    isExporting: false,
    error: null,
    ...exportOverrides,
  });

  mockedStores.useIsAuthenticated.mockReturnValue(isAuthenticated);
  mockedStores.useUserLoading.mockReturnValue(userLoading);

  mockedNavigation.useRouter.mockReturnValue({
    push: mockRouterPush,
  });
};

describe('ProfilePage', () => {
  const originalCreateObjectURL = global.URL.createObjectURL;
  const originalRevokeObjectURL = global.URL.revokeObjectURL;

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    mockRouterPush.mockReset();
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    global.URL.createObjectURL = originalCreateObjectURL;
    global.URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('renders sign-in prompt when own profile is viewed unauthenticated', () => {
    setupMocks({ isAuthenticated: false, userLoading: false });

    render(<ProfilePage user={null as any} isOwnProfile />);

    expect(screen.getByText('Please sign in to view your profile.')).toBeInTheDocument();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('exports profile data and shows success message', async () => {
    const mockExport = jest.fn().mockResolvedValue({
      profile: { id: 'profile-1' },
      preferences: {},
      activity: [],
      votes: [],
      comments: [],
    });

    setupMocks({
      profile: {
        id: 'profile-1',
        username: 'adalovelace',
        email: 'ada@example.com',
        display_name: 'Ada Lovelace',
      },
      exportOverrides: {
        exportProfile: mockExport,
      },
    });

    render(<ProfilePage user={null as any} isOwnProfile />);

    fireEvent.click(screen.getByRole('button', { name: /export data/i }));

    const confirmButtons = screen.getAllByRole('button', { name: /export data/i });
    const confirmButton = confirmButtons.at(-1);
    if (!confirmButton) {
      throw new Error('Expected an export confirmation button');
    }
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockExport).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Your profile export has started downloading.')).toBeInTheDocument();
    });
  });

  it('navigates to edit profile when button is clicked', () => {
    setupMocks({
      profile: {
        id: 'profile-1',
        username: 'adalovelace',
        email: 'ada@example.com',
        display_name: 'Ada Lovelace',
      },
    });

    render(<ProfilePage user={null as any} isOwnProfile />);

    const editButtons = screen.getAllByRole('button', { name: /edit profile/i });
    const editButton = editButtons[0];
    if (!editButton) {
      throw new Error('Expected an edit profile button');
    }
    fireEvent.click(editButton);

    expect(mockRouterPush).toHaveBeenCalledWith('/profile/edit');
  });
});
