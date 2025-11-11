/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import PersonalDashboard from '@/features/dashboard/components/PersonalDashboard';
import type { DashboardPreferences } from '@/types/profile';
import type { Representative } from '@/types/representative';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/features/profile/hooks/use-profile', () => ({
  useProfile: jest.fn(),
  useProfileLoadingStates: jest.fn(),
  useProfileErrorStates: jest.fn(),
}));

jest.mock('@/lib/stores', () => ({
  useIsAuthenticated: jest.fn(),
  useUserLoading: jest.fn(),
  usePolls: jest.fn(),
  usePollsAnalytics: jest.fn(),
  usePollsLoading: jest.fn(),
  usePollsError: jest.fn(),
  usePollsStore: jest.fn(),
  usePollLastFetchedAt: jest.fn(),
  useAnalyticsEvents: jest.fn(),
  useAnalyticsBehavior: jest.fn(),
  useAnalyticsError: jest.fn(),
  useAnalyticsLoading: jest.fn(),
  useTrendingHashtags: jest.fn(),
  useHashtagActions: jest.fn(),
  useHashtagLoading: jest.fn(),
  useHashtagError: jest.fn(),
}));

jest.mock('@/lib/stores/profileStore', () => ({
  useProfileStore: jest.fn(),
}));

jest.mock('@/lib/stores/representativeStore', () => ({
  useGetUserRepresentatives: jest.fn(),
  useUserRepresentativeEntries: jest.fn(),
  useRepresentativeGlobalLoading: jest.fn(),
  useRepresentativeError: jest.fn(),
}));

type UseProfileHook = typeof import('@/features/profile/hooks/use-profile');
type StoresModule = typeof import('@/lib/stores');
type NavigationModule = typeof import('next/navigation');
type ProfileStoreModule = typeof import('@/lib/stores/profileStore');
type RepresentativeStoreModule = typeof import('@/lib/stores/representativeStore');

type MockedProfileModule = {
  [K in keyof UseProfileHook]: jest.Mock;
};

type MockedStoresModule = {
  [K in keyof StoresModule]: jest.Mock;
};

type MockedNavigationModule = {
  [K in keyof NavigationModule]: jest.Mock;
};

type MockedProfileStoreModule = {
  [K in keyof ProfileStoreModule]: jest.Mock;
};

type MockedRepresentativeStoreModule = {
  [K in keyof RepresentativeStoreModule]: jest.Mock;
};

const mockedProfileHooks = jest.requireMock('@/features/profile/hooks/use-profile') as MockedProfileModule;
const mockedStores = jest.requireMock('@/lib/stores') as MockedStoresModule;
const mockedNavigation = jest.requireMock('next/navigation') as MockedNavigationModule;
const mockedProfileStore = jest.requireMock('@/lib/stores/profileStore') as MockedProfileStoreModule;
const mockedRepresentativeStore = jest.requireMock('@/lib/stores/representativeStore') as MockedRepresentativeStoreModule;

const mockRouterReplace = jest.fn();
const mockLoadPolls = jest.fn().mockResolvedValue(undefined);
const mockGetTrendingHashtags = jest.fn().mockResolvedValue(undefined);
const mockGetUserRepresentatives = jest.fn().mockResolvedValue([]);

type ProfileValue = Record<string, unknown> | null;

type MockOptions = {
  profileOverrides?: ProfileValue;
  profileLoading?: boolean;
  profileError?: string | null;
  userLoading?: boolean;
  isAuthenticated?: boolean;
  representatives?: Representative[];
};

const baseProfileState = {
  profile: null as ProfileValue,
  isLoading: false,
  error: null as string | null,
  refetch: jest.fn(),
};

const baseLoadingStates = {
  isLoading: false,
  isUpdating: false,
  isUpdatingAvatar: false,
  isExporting: false,
  isAnyUpdating: false,
};

const baseErrorStates = {
  profileError: null as string | null,
  updateError: null,
  avatarError: null,
  exportError: null,
  hasAnyError: false,
};

function mockHooks(options: MockOptions = {}) {
  const {
    profileOverrides = null,
    profileLoading = false,
    profileError = null,
    userLoading = false,
    isAuthenticated = true,
    representatives: representativeOverrides = [],
  } = options;

  mockedProfileHooks.useProfile.mockReturnValue({
    ...baseProfileState,
    profile: profileOverrides,
    isLoading: profileLoading,
    error: profileError,
  });
  mockedProfileHooks.useProfileLoadingStates.mockReturnValue(baseLoadingStates);
  mockedProfileHooks.useProfileErrorStates.mockReturnValue({
     ...baseErrorStates,
     profileError,
     hasAnyError: !!profileError,
   });
 
   mockedStores.useIsAuthenticated.mockReturnValue(isAuthenticated);
   mockedStores.useUserLoading.mockReturnValue(userLoading);
   mockedStores.usePolls.mockReturnValue([]);
   mockedStores.usePollsAnalytics.mockReturnValue({
     total_votes: 0,
     total_polls_created: 0,
     active_polls: 0,
     total_votes_on_user_polls: 0,
   });
   mockedStores.usePollsLoading.mockReturnValue(false);
   mockedStores.usePollsError.mockReturnValue(null);
   mockedStores.usePollsStore.mockImplementation((selector: (state: { loadPolls: typeof mockLoadPolls }) => unknown) =>
     selector({ loadPolls: mockLoadPolls }),
   );
   mockedStores.usePollLastFetchedAt.mockReturnValue(null);
   mockedStores.useAnalyticsEvents.mockReturnValue([]);
   mockedStores.useAnalyticsBehavior.mockReturnValue(null);
   mockedStores.useAnalyticsError.mockReturnValue(null);
   mockedStores.useAnalyticsLoading.mockReturnValue(false);
   mockedStores.useTrendingHashtags.mockReturnValue([]);
   mockedStores.useHashtagActions.mockReturnValue({ getTrendingHashtags: mockGetTrendingHashtags });
   mockedStores.useHashtagLoading.mockReturnValue({ isLoading: false });
   mockedStores.useHashtagError.mockReturnValue({ error: null });
 
   mockedNavigation.useRouter.mockReturnValue({
     replace: mockRouterReplace,
   });

   mockedProfileStore.useProfileStore.mockImplementation((selector: (state: {
     getDisplayName: () => string;
     preferences: { dashboard?: DashboardPreferences } | null;
     updatePreferences: () => Promise<boolean>;
   }) => unknown) =>
     selector({
       getDisplayName: () =>
         (profileOverrides && typeof profileOverrides.display_name === 'string'
           ? (profileOverrides.display_name as string)
           : 'Your'),
       preferences: {
         dashboard: (profileOverrides as Record<string, unknown> | null)?.dashboard_preferences as
           | DashboardPreferences
           | undefined,
       },
       updatePreferences: () => Promise.resolve(true),
     }));

  mockedRepresentativeStore.useUserRepresentativeEntries.mockReturnValue(
    representativeOverrides.map((representative) => ({
      follow: {
        id: `${representative.id}-follow`,
        user_id: 'user-1',
        representative_id: representative.id,
        created_at: new Date(0).toISOString(),
        updated_at: new Date(0).toISOString(),
      },
      representative,
    })) as any,
  );
  mockedRepresentativeStore.useRepresentativeGlobalLoading.mockReturnValue(false);
  mockedRepresentativeStore.useRepresentativeError.mockReturnValue(null);
  mockedRepresentativeStore.useGetUserRepresentatives.mockReturnValue(mockGetUserRepresentatives);
}

describe('PersonalDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    mockRouterReplace.mockReset();
    mockLoadPolls.mockReset();
    mockLoadPolls.mockResolvedValue(undefined);
    mockGetTrendingHashtags.mockReset();
    mockGetTrendingHashtags.mockResolvedValue(undefined);
    mockGetUserRepresentatives.mockReset();
    mockGetUserRepresentatives.mockResolvedValue([]);
  });

  it('redirects unauthenticated users to the auth page and shows sign-in prompt', () => {
    mockHooks({ isAuthenticated: false, userLoading: false });

    render(<PersonalDashboard />);

    expect(mockRouterReplace).toHaveBeenCalledWith('/auth?redirectTo=/dashboard');
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
  });

  it('shows loading skeleton while auth/profile are loading', () => {
    mockHooks({ isAuthenticated: true, userLoading: true, profileLoading: true });

    const { queryByTestId } = render(<PersonalDashboard />);

    expect(queryByTestId('dashboard-header')).not.toBeInTheDocument();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it('renders personalized dashboard header after hydration', async () => {
     const profile: ProfileValue = {
       id: 'user-1',
       display_name: 'Ada Lovelace',
       bio: '',
       dashboard_preferences: {
         showElectedOfficials: false,
         showQuickActions: true,
         showRecentActivity: true,
         showEngagementScore: true,
       },
     };
 
     mockHooks({
       isAuthenticated: true,
       userLoading: false,
       profileOverrides: profile,
       profileError: null,
     });
 
     render(<PersonalDashboard />);
 
     await waitFor(() => {
       expect(screen.getByTestId('dashboard-title')).toHaveTextContent('Welcome back, Ada Lovelace');
     });

     expect(mockLoadPolls).toHaveBeenCalled();
     expect(mockGetTrendingHashtags).toHaveBeenCalled();
     expect(mockGetUserRepresentatives).toHaveBeenCalled();
   });
});
