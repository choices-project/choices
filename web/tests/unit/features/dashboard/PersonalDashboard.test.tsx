/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import type * as NavigationModule from 'next/navigation';
import React from 'react';

import type * as CountdownUtilsModule from '@/features/civics/utils/civicsCountdownUtils';
import PersonalDashboard from '@/features/dashboard/components/PersonalDashboard';
import type * as ProfileHooksModule from '@/features/profile/hooks/use-profile';
import type * as StoresModule from '@/lib/stores';
import type * as ProfileStoreModule from '@/lib/stores/profileStore';
import type * as RepresentativeStoreModule from '@/lib/stores/representativeStore';
import type { DashboardPreferences } from '@/types/profile';
import type { Representative } from '@/types/representative';

jest.mock('@/hooks/useI18n', () => ({
  useI18n: jest.fn(),
}));

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

jest.mock('@/lib/stores', () => {
  const trackEventMock = jest.fn();
  return {
    useIsAuthenticated: jest.fn(),
    useUserLoading: jest.fn(),
    useProfile: jest.fn(),
    useProfileLoadingStates: jest.fn(),
    useProfileErrorStates: jest.fn(),
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
    useAnalyticsActions: jest.fn(() => ({ trackEvent: trackEventMock })),
    useTrendingHashtags: jest.fn(),
    useHashtagActions: jest.fn(),
    useHashtagLoading: jest.fn(),
    useHashtagError: jest.fn(),
    useRepresentativeDivisions: jest.fn(() => []),
    useUserActions: jest.fn(),
  };
});

jest.mock('@/lib/stores/profileStore', () => ({
  useProfileStore: jest.fn(),
}));

jest.mock('@/lib/stores/representativeStore', () => ({
  useGetUserRepresentatives: jest.fn(),
  useUserRepresentativeEntries: jest.fn(),
  useRepresentativeGlobalLoading: jest.fn(),
  useRepresentativeError: jest.fn(),
  useRepresentativeDivisions: jest.fn(() => []),
}));

jest.mock('@/features/civics/utils/civicsCountdownUtils', () => ({
  useElectionCountdown: jest.fn(),
  formatElectionDate: jest.fn((iso: string) => iso),
}));

jest.mock('@/hooks/useFollowRepresentative', () => ({
  useFollowRepresentative: jest.fn().mockReturnValue({
    following: false,
    loading: false,
    error: null,
    toggle: jest.fn(),
  }),
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

type MockedCountdownUtilsModule = {
  [K in keyof CountdownUtilsModule]: jest.Mock;
};

type MockedI18nModule = {
  useI18n: jest.Mock;
};

const mockedProfileHooks = jest.requireMock('@/features/profile/hooks/use-profile') as MockedProfileModule;
const mockedStores = jest.requireMock('@/lib/stores') as MockedStoresModule;
const mockedNavigation = jest.requireMock('next/navigation') as MockedNavigationModule;
const mockedProfileStore = jest.requireMock('@/lib/stores/profileStore') as MockedProfileStoreModule;
const mockedRepresentativeStore = jest.requireMock('@/lib/stores/representativeStore') as MockedRepresentativeStoreModule;
const mockedCountdownUtils = jest.requireMock('@/features/civics/utils/civicsCountdownUtils') as MockedCountdownUtilsModule;
const mockedI18n = jest.requireMock('@/hooks/useI18n') as MockedI18nModule;

const translationMap: Record<string, string> = {
  'dashboard.personal.signIn.title': 'Sign in to your account',
  'dashboard.personal.signIn.description': 'You need to be signed in to access your personal dashboard.',
  'dashboard.personal.signIn.button': 'Go to Sign In',
  'dashboard.personal.header.titleWithName': 'Welcome back, {name}',
  'dashboard.personal.header.subtitleDefault': 'Here’s what’s happening today',
  'dashboard.personal.common.refresh': 'Refresh',
  'dashboard.personal.header.engagementBadge': 'Harness',
  'dashboard.personal.tabs.overview': 'Overview',
  'dashboard.personal.tabs.analytics': 'Analytics',
  'dashboard.personal.metrics.totalVotes': 'Total votes',
  'dashboard.personal.metrics.pollsCreated': 'Polls created',
  'dashboard.personal.metrics.activePolls': 'Active polls',
  'dashboard.personal.metrics.pollVotes': 'Votes on polls',
  'dashboard.personal.representatives.title': 'Upcoming elections',
  'dashboard.personal.representatives.description': 'Track key election dates and contacts in your area.',
  'dashboard.personal.representatives.countdown.description': 'In {days} days',
  'dashboard.personal.trending.title': 'Trending topics',
};

const mockRouterReplace = jest.fn();
const mockLoadPolls = jest.fn().mockResolvedValue(undefined);
const mockGetTrendingHashtags = jest.fn().mockResolvedValue(undefined);
const mockGetUserRepresentatives = jest.fn().mockResolvedValue([]);
const mockSignOut = jest.fn();

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
  mockedStores.useUserActions.mockReturnValue({ signOut: mockSignOut });
 
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

  mockedCountdownUtils.useElectionCountdown.mockReturnValue({
    divisionIds: [],
    elections: [],
    nextElection: null,
    daysUntilNextElection: null,
    loading: false,
    error: null,
  });
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
    mockSignOut.mockReset();
    mockedI18n.useI18n.mockReturnValue({
      t: (key: string, params?: Record<string, string | number>) => {
        const template = translationMap[key];
        if (!template) {
          return key;
        }
        if (!params) {
          return template;
        }
        return template.replace(/\{(\w+)\}/g, (match, param) =>
          params[param] !== undefined ? String(params[param]) : match,
        );
      },
      currentLanguage: 'en',
      changeLanguage: jest.fn(),
      isReady: true,
    });
  });

  it('redirects unauthenticated users to the auth page and shows sign-in prompt', () => {
    mockHooks({ isAuthenticated: false, userLoading: false });

    render(<PersonalDashboard />);

    expect(mockRouterReplace).toHaveBeenCalledWith('/auth?redirectTo=/dashboard');
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(mockSignOut).toHaveBeenCalled();
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

  it('renders election countdown card for representatives when data is available', () => {
    const profile: ProfileValue = {
      id: 'user-1',
      display_name: 'Sam Civic',
      dashboard_preferences: {
        showElectedOfficials: true,
        showQuickActions: false,
        showRecentActivity: false,
        showEngagementScore: false,
      },
    };

    const representative: Representative = {
      id: 101,
      name: 'Alex Official',
      party: 'Independent',
      office: 'Mayor',
      state: 'CA',
      division_ids: ['ocd-division/country:us/state:ca'],
    } as Representative;

    mockHooks({
      profileOverrides: profile,
      representatives: [representative],
    });

    mockedCountdownUtils.useElectionCountdown.mockReturnValue({
      divisionIds: ['ocd-division/country:us/state:ca'],
      elections: [
        {
          election_id: '2026-ca-primary',
          election_day: '2026-06-05',
          name: 'California Primary',
        },
      ],
      nextElection: {
        election_id: '2026-ca-primary',
        election_day: '2026-06-05',
        name: 'California Primary',
      },
      daysUntilNextElection: 45,
      loading: false,
      error: null,
    });

    render(<PersonalDashboard />);

    expect(screen.getByText('Upcoming elections')).toBeInTheDocument();
    expect(screen.getAllByText('California Primary')[0]).toBeInTheDocument();
    expect(screen.getAllByText(/In 45 days/i)[0]).toBeInTheDocument();
  });
});
