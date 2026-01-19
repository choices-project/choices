/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import PersonalDashboard from '@/features/dashboard/components/PersonalDashboard';
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

const mockedProfileHooks = jest.requireMock('@/features/profile/hooks/use-profile') as {
  useProfile: jest.Mock;
  useProfileLoadingStates: jest.Mock;
  useProfileErrorStates: jest.Mock;
};
const mockedStores = jest.requireMock('@/lib/stores') as {
  useIsAuthenticated: jest.Mock;
  useUserLoading: jest.Mock;
  useProfile: jest.Mock;
  useProfileLoadingStates: jest.Mock;
  useProfileErrorStates: jest.Mock;
  usePolls: jest.Mock;
  usePollsAnalytics: jest.Mock;
  usePollsLoading: jest.Mock;
  usePollsError: jest.Mock;
  usePollsActions: jest.Mock;
  usePollLastFetchedAt: jest.Mock;
  useAnalyticsEvents: jest.Mock;
  useAnalyticsBehavior: jest.Mock;
  useAnalyticsError: jest.Mock;
  useAnalyticsLoading: jest.Mock;
  useAnalyticsActions: jest.Mock;
  useTrendingHashtags: jest.Mock;
  useHashtagActions: jest.Mock;
  useHashtagLoading: jest.Mock;
  useHashtagError: jest.Mock;
  useRepresentativeDivisions: jest.Mock;
  useUserActions: jest.Mock;
};
const mockedNavigation = jest.requireMock('next/navigation') as {
  useRouter: jest.Mock;
};
const mockedProfileStore = jest.requireMock('@/lib/stores/profileStore') as {
  useProfileStore: jest.Mock;
};
const mockedRepresentativeStore = jest.requireMock('@/lib/stores/representativeStore') as {
  useGetUserRepresentatives: jest.Mock;
  useUserRepresentativeEntries: jest.Mock;
  useRepresentativeGlobalLoading: jest.Mock;
  useRepresentativeError: jest.Mock;
  useRepresentativeDivisions: jest.Mock;
};
const mockedCountdownUtils = jest.requireMock('@/features/civics/utils/civicsCountdownUtils') as {
  useElectionCountdown: jest.Mock;
  formatElectionDate: jest.Mock;
};
const mockedI18n = jest.requireMock('@/hooks/useI18n') as {
  useI18n: jest.Mock;
};

// Use the real English catalogue so test expectations keep pace with i18n updates
const englishMessages = require('../../../../messages/en.json') as Record<string, unknown>;

const resolveMessage = (messages: Record<string, unknown>, key: string): string | undefined =>
  key.split('.').reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === 'object' && segment in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[segment];
    }
    return undefined;
  }, messages) as string | undefined;

const translate = (key: string, params?: Record<string, string | number>): string => {
  const raw = resolveMessage(englishMessages, key);
  if (typeof raw !== 'string') {
    return key;
  }
  if (!params) {
    return raw;
  }
  return raw.replace(/\{(\w+)\}/g, (_match, param: string) => {
    const value = params[param];
    return value === undefined || value === null ? '' : String(value);
  });
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
  preferences: {} as { dashboard?: DashboardPreferences },
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
  const dashboardPreferences = (profileOverrides as Record<string, unknown> | null)
    ?.dashboard_preferences as DashboardPreferences | undefined;
  profileStoreState.preferences = dashboardPreferences ? { dashboard: dashboardPreferences } : {};
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
      t: translate,
      currentLanguage: 'en',
      changeLanguage: jest.fn(),
      isReady: true,
    });
  });

  it('renders dashboard in harness mode even when not authenticated', () => {
    // Set up harness mode for this test
    const originalEnv = process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS;
    process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS = '1';
    
    mockHooks({ isAuthenticated: false, userLoading: false });

    render(<PersonalDashboard />);

    // In harness mode, component renders dashboard even if not authenticated
    // (authentication is mocked in E2E tests, so we allow rendering)
    expect(screen.getByTestId('personal-dashboard')).toBeInTheDocument();
    // Note: redirect logic was moved to dashboard page wrapper, so router.replace is not called here
    expect(mockRouterReplace).not.toHaveBeenCalled();
    
    // Restore original env
    if (originalEnv) {
      process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS = originalEnv;
    } else {
      delete process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS;
    }
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

  it('renders election countdown card for representatives when data is available', async () => {
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

    await waitFor(() => {
      expect(screen.getByText('Upcoming elections')).toBeInTheDocument();
      expect(screen.getAllByText('California Primary')[0]).toBeInTheDocument();
      expect(screen.getAllByText(/In 45 days/i)[0]).toBeInTheDocument();
    });
  });
});
