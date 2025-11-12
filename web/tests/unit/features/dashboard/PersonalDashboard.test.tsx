/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import type * as NavigationModule from 'next/navigation';
import React from 'react';

import PersonalDashboard from '@/features/dashboard/components/PersonalDashboard';
import type * as ProfileHooksModule from '@/features/profile/hooks/use-profile';
import type * as StoresModule from '@/lib/stores';
import type * as ProfileStoreModule from '@/lib/stores/profileStore';
import type * as RepresentativeStoreModule from '@/lib/stores/representativeStore';
import type { DashboardPreferences } from '@/types/profile';
import type { Representative } from '@/types/representative';

jest.mock('@/components/shared/FeatureWrapper', () => ({
  FeatureWrapper: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  FeatureWrapperBatch: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  FeatureWrapperWithDependencies: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

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
  usePollsActions: jest.fn(),
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

type MockedProfileModule = {
  [K in keyof ProfileHooksModule]: jest.Mock;
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

const hashtagActionsState = {
  getTrendingHashtags: (...args: Parameters<typeof mockGetTrendingHashtags>) =>
    mockGetTrendingHashtags(...args),
};

const hashtagLoadingState = { isLoading: false };
const hashtagErrorState = { error: null };

const profileStoreState = {
  getDisplayName: () => 'Your',
  preferences: { dashboard: undefined as DashboardPreferences | undefined } as {
    dashboard?: DashboardPreferences;
  },
  updatePreferences: jest.fn(() => Promise.resolve(true)),
};

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
    profile: profileOverrides ?? null,
    isLoading: profileLoading,
    error: profileError ?? null,
    refetch: baseProfileState.refetch,
  });
  mockedProfileHooks.useProfileLoadingStates.mockReturnValue(baseLoadingStates);
  mockedProfileHooks.useProfileErrorStates.mockReturnValue({
    profileError: profileError ?? null,
    updateError: baseErrorStates.updateError,
    avatarError: baseErrorStates.avatarError,
    exportError: baseErrorStates.exportError,
    hasAnyError: Boolean(profileError),
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
  mockedStores.usePollsActions.mockReturnValue({ loadPolls: mockLoadPolls });
   mockedStores.usePollLastFetchedAt.mockReturnValue(null);
   mockedStores.useAnalyticsEvents.mockReturnValue([]);
   mockedStores.useAnalyticsBehavior.mockReturnValue(null);
   mockedStores.useAnalyticsError.mockReturnValue(null);
   mockedStores.useAnalyticsLoading.mockReturnValue(false);
  mockedStores.useTrendingHashtags.mockReturnValue([]);
  mockedStores.useHashtagActions.mockReturnValue(hashtagActionsState);
  mockedStores.useHashtagLoading.mockReturnValue(hashtagLoadingState);
  mockedStores.useHashtagError.mockReturnValue(hashtagErrorState);
 
   mockedNavigation.useRouter.mockReturnValue({
     replace: mockRouterReplace,
   });

  profileStoreState.getDisplayName = () =>
    (profileOverrides && typeof profileOverrides === 'object'
      && typeof (profileOverrides as Record<string, unknown>).display_name === 'string'
      ? ((profileOverrides as Record<string, unknown>).display_name as string)
      : 'Your');
  profileStoreState.preferences = {
    dashboard: (profileOverrides as Record<string, unknown> | null)?.dashboard_preferences as
      | DashboardPreferences
      | undefined,
  };
  mockedProfileStore.useProfileStore.mockImplementation((selector: (state: typeof profileStoreState) => unknown) =>
    selector(profileStoreState),
  );

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
    profileStoreState.updatePreferences.mockClear();
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
