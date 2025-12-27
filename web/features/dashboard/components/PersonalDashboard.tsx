'use client';

/**
 * Personal Dashboard Component
 *
 * Zustand-aligned personal dashboard powered by shared stores:
 * - Profile store for personalization and preferences
 * - Polls, analytics, and hashtag stores for feature data
 * - User store for representative information
 *
 * Created: January 19, 2025
 * Status: ✅ ACTIVE
 */

// TEMPORARILY COMMENTED OUT: unused imports while testing infinite loop without hooks
// import {
//   Activity,
//   BarChart3,
//   Download,
//   Flame,
//   MapPin,
//   Plus,
//   Settings,
//   Shield,
// } from 'lucide-react';
// import { useRouter } from 'next/navigation';
// import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// import { useShallow } from 'zustand/react/shallow';

// import { useElectionCountdown } from '@/features/civics/utils/civicsCountdownUtils';
// import type { Poll } from '@/features/polls/types';
// import { useProfile, useProfileErrorStates, useProfileLoadingStates } from '@/features/profile/hooks/use-profile';

// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// import {
//   useAnalyticsBehavior,
//   useAnalyticsError,
//   useAnalyticsEvents,
//   useAnalyticsLoading,
//   useHashtagActions,
//   useHashtagError,
//   useHashtagLoading,
//   useIsAuthenticated,
//   usePollLastFetchedAt,
//   usePolls,
//   usePollsError,
//   usePollsLoading,
//   useTrendingHashtags,
//   useUserLoading,
//   usePollsActions,
//   useUserActions,
// } from '@/lib/stores';
// import { useProfileStore } from '@/lib/stores/profileStore';
// import {
//   useGetUserRepresentatives,
//   useRepresentativeError,
//   useRepresentativeGlobalLoading,
//   useUserRepresentativeEntries,
// } from '@/lib/stores/representativeStore';

import React from 'react';
// TEMPORARILY COMMENTED OUT: unused imports/constants/types while testing infinite loop without hooks
// import { logger } from '@/lib/utils/logger';
// import { useI18n } from '@/hooks/useI18n';
// import type { PersonalAnalytics } from '@/types/features/dashboard';
// import type { DashboardPreferences, ProfilePreferences } from '@/types/profile';

// const DEFAULT_DASHBOARD_PREFERENCES: DashboardPreferences = {
//   showElectedOfficials: false,
//   showQuickActions: true,
//   showRecentActivity: true,
//   showEngagementScore: true,
// };

// const HARNESS_DEFAULT_DASHBOARD_PREFERENCES: DashboardPreferences = {
//   ...DEFAULT_DASHBOARD_PREFERENCES,
//   showElectedOfficials: true,
// };

// const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// const IS_E2E_HARNESS = process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1';
// const HARNESS_PREFERENCES_STORAGE_KEY = 'dashboard-harness-preferences';

// const loadHarnessPreferences = (): DashboardPreferences | null => {
//   if (typeof window === 'undefined') {
//     return null;
//   }
//   try {
//     const raw = window.localStorage.getItem(HARNESS_PREFERENCES_STORAGE_KEY);
//     if (!raw) {
//       return null;
//     }
//     const parsed = JSON.parse(raw) as Partial<DashboardPreferences>;
//     return { ...HARNESS_DEFAULT_DASHBOARD_PREFERENCES, ...parsed };
//   } catch (error) {
//     logger.warn('Failed to load dashboard harness preferences', error);
//     return null;
//   }
// };

// const persistHarnessPreferences = (preferences: DashboardPreferences | null) => {
//   if (typeof window === 'undefined' || !preferences) {
//     return;
//   }
//   try {
//     window.localStorage.setItem(
//       HARNESS_PREFERENCES_STORAGE_KEY,
//       JSON.stringify(preferences),
//     );
//   } catch (error) {
//     logger.warn('Failed to persist dashboard harness preferences', error);
//   }
// };

type PersonalDashboardProps = {
  userId?: string;
  className?: string;
};

// const resolvePollTitle = (poll: Poll, fallback: string): string => {
//   const record = poll as Record<string, unknown>;
//   if (typeof record.title === 'string' && record.title.trim().length > 0) {
//     return record.title;
//   }
//   if (typeof record.question === 'string' && record.question.trim().length > 0) {
//     return record.question;
//   }
//   if (typeof record.name === 'string' && record.name.trim().length > 0) {
//     return record.name;
//   }
//   return fallback;
// };

// const resolvePollVotes = (poll: Poll): number => {
//   const record = poll as Record<string, unknown>;
//   if (typeof poll.total_votes === 'number') {
//     return poll.total_votes;
//   }
//   if (typeof record.totalVotes === 'number') {
//     return record.totalVotes as number;
//   }
//   return 0;
// };

// TEMPORARILY COMMENTED OUT: HarnessPersonalDashboard while testing infinite loop
/*
function HarnessPersonalDashboard({ className = '' }: PersonalDashboardProps) {
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => { routerRef.current = router; }, [router]);
  const { t } = useI18n();
  const isAuthenticated = useIsAuthenticated();
  const { signOut: signOutUser } = useUserActions();
  const signOutUserRef = useRef(signOutUser);
  useEffect(() => { signOutUserRef.current = signOutUser; }, [signOutUser]);
  // CRITICAL: Never use isMounted in useMemo for render logic - it changes after mount causing hydration mismatch
  // Use useState instead, set in useEffect after mount
  const [shouldBypassAuth, setShouldBypassAuth] = useState<boolean>(
    process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1'
  );

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1') {
      return; // Already set to true
    }
    // Check localStorage after mount
    if (typeof window !== 'undefined' && window.localStorage.getItem('e2e-dashboard-bypass') === '1') {
      setShouldBypassAuth(true);
    }
  }, []);
  // CRITICAL: Use useState instead of useMemo to prevent hydration mismatch
  // Initialize to false (same on server and client), then check localStorage in useEffect
  const [fallbackAuthenticated, setFallbackAuthenticated] = useState(false);

  useEffect(() => {
    if (!shouldBypassAuth || typeof window === 'undefined') {
      setFallbackAuthenticated(false);
      return;
    }
    try {
      const raw = window.localStorage.getItem('user-store');
      if (!raw) {
        setFallbackAuthenticated(false);
        return;
      }
      const parsed = JSON.parse(raw);
      setFallbackAuthenticated(Boolean(parsed.state?.isAuthenticated));
    } catch {
      setFallbackAuthenticated(false);
    }
  }, [shouldBypassAuth]);

  const effectiveIsAuthenticated = isAuthenticated || fallbackAuthenticated;
  const dashboardPreferences = useProfileStore(
    (state) => state.preferences?.dashboard ?? HARNESS_DEFAULT_DASHBOARD_PREFERENCES,
  );

  // Get updatePreferences from store for harness mode
  const { updatePreferences } = useProfileStore(
    useShallow((state) => ({
      updatePreferences: state.updatePreferences,
    })),
  );
  const updatePreferencesRef = useRef(updatePreferences);
  useEffect(() => { updatePreferencesRef.current = updatePreferences; }, [updatePreferences]);

  // Define handlePreferenceToggle for harness mode
  const handlePreferenceToggle = useCallback(
    (key: keyof DashboardPreferences) => async (event: React.ChangeEvent<HTMLInputElement>) => {
      const checked = event.target.checked;
      let nextDashboardPrefs: DashboardPreferences | null = null;
      useProfileStore.setState((state) => {
        const currentPreferences = state.preferences ?? ({} as ProfilePreferences);
        const nextDashboard = {
          ...(currentPreferences.dashboard ?? HARNESS_DEFAULT_DASHBOARD_PREFERENCES),
          [key]: checked,
        };
        const updated = {
          ...currentPreferences,
          dashboard: nextDashboard,
        } as ProfilePreferences;
        state.preferences = updated;
        nextDashboardPrefs = nextDashboard;
      });
      // Persist to localStorage in harness mode
      if (IS_E2E_HARNESS && nextDashboardPrefs) {
        persistHarnessPreferences(nextDashboardPrefs);
      }
      // Also persist to API if authenticated
      if (effectiveIsAuthenticated && updatePreferencesRef.current && nextDashboardPrefs) {
        try {
          await updatePreferencesRef.current({ dashboard: nextDashboardPrefs } as Partial<ProfilePreferences>);
        } catch (error) {
          logger.error('Error saving dashboard preferences via toggle', error as Error);
        }
      }
    },
    [effectiveIsAuthenticated]
  );

  const handleHarnessLogout = useCallback(() => {
    signOutUserRef.current();
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        'user-store',
        JSON.stringify({
          state: { isAuthenticated: false, user: null, profile: null },
          version: 0,
        }),
      );
      window.localStorage.setItem(
        'profile-store',
        JSON.stringify({
          state: { profile: null, userProfile: null },
          version: 0,
        }),
      );
      window.localStorage.setItem(
        'admin-store',
        JSON.stringify({
          state: { activeTab: 'overview' },
          version: 0,
        }),
      );
      window.localStorage.removeItem('e2e-dashboard-bypass');
      window.sessionStorage.clear();
      document.cookie = 'e2e-dashboard-bypass=; Max-Age=0; path=/';
    }
    routerRef.current.push('/auth');
  }, []);
  const profileName = useProfileStore(
    (state) => state.profile?.display_name ?? state.profile?.username ?? null,
  );

  useEffect(() => {
    if (!IS_E2E_HARNESS) {
      return;
    }
    const stored = loadHarnessPreferences();
    if (stored) {
      useProfileStore.setState((state) => {
        const currentPreferences = state.preferences ?? ({} as ProfilePreferences);
        state.preferences = {
          ...currentPreferences,
          dashboard: stored,
        } as ProfilePreferences;
      });
    }
  }, []);

  // CRITICAL: Never return early based on shouldBypassAuth - it changes after mount causing hydration mismatch
  // Always render the same component structure, conditionally show content within
  // The dashboard page wrapper handles auth checks, so we should always render dashboard content

  return (
    <div className={`space-y-6 ${className}`} data-testid='personal-dashboard'>
      <div className='flex items-center justify-between' data-testid='dashboard-header'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900' data-testid='dashboard-title'>
            {profileName
              ? t('dashboard.personal.harness.header.titleWithName', { name: profileName })
              : t('dashboard.personal.harness.header.titleFallback')}
          </h1>
          <p className='mt-1 text-gray-600'>
            {t('dashboard.personal.harness.header.subtitle')}
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => routerRef.current.push('/feed')}
            className='flex items-center gap-2'
          >
            <Flame className='h-4 w-4' /> {t('dashboard.personal.harness.header.trendingButton')}
          </Button>
          <Badge variant='outline' className='flex items-center gap-2' data-testid='participation-score'>
            <Activity className='h-4 w-4' /> {t('dashboard.personal.harness.header.badge')}
          </Badge>
          <Button variant='outline' size='sm' onClick={handleHarnessLogout}>
            Logout
          </Button>
        </div>
      </div>

      <Card data-testid='personal-analytics'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <BarChart3 className='h-5 w-5' /> {t('dashboard.personal.harness.analytics.title')}
          </CardTitle>
          <CardDescription>
            {t('dashboard.personal.harness.analytics.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>3</div>
              <div className='text-sm text-gray-600'>
                {t('dashboard.personal.metrics.totalVotes')}
              </div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>2</div>
              <div className='text-sm text-gray-600'>
                {t('dashboard.personal.metrics.pollsCreated')}
              </div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-purple-600'>1</div>
              <div className='text-sm text-gray-600'>
                {t('dashboard.personal.metrics.activePolls')}
              </div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-orange-600'>8</div>
              <div className='text-sm text-gray-600'>
                {t('dashboard.personal.metrics.pollVotes')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {dashboardPreferences.showElectedOfficials && (
        <Card data-testid='representatives-card'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <MapPin className='h-5 w-5' /> {t('dashboard.personal.harness.representatives.title')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.personal.harness.representatives.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-gray-600'>
              {t('dashboard.personal.harness.representatives.empty')}
            </p>
          </CardContent>
        </Card>
      )}

      <Card data-testid='dashboard-settings'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Settings className='h-5 w-5' /> {t('dashboard.personal.harness.settings.title')}
          </CardTitle>
          <CardDescription>
            {t('dashboard.personal.harness.settings.description')}
          </CardDescription>
        </CardHeader>
        <CardContent data-testid='settings-content'>
          <div className='space-y-4'>
            <label className='flex items-center justify-between'>
              <span className='text-sm font-medium'>
                {t('dashboard.personal.harness.settings.fields.quickActions')}
              </span>
              <input
                type='checkbox'
                className='rounded'
                checked={dashboardPreferences.showQuickActions}
                onChange={handlePreferenceToggle('showQuickActions')}
                data-testid='show-quick-actions-toggle'
              />
            </label>
            <label className='flex items-center justify-between'>
              <span className='text-sm font-medium'>
                {t('dashboard.personal.harness.settings.fields.electedOfficials')}
              </span>
              <input
                type='checkbox'
                className='rounded'
                checked={dashboardPreferences.showElectedOfficials}
                onChange={handlePreferenceToggle('showElectedOfficials')}
                data-testid='show-elected-officials-toggle'
              />
            </label>
            <label className='flex items-center justify-between'>
              <span className='text-sm font-medium'>
                {t('dashboard.personal.harness.settings.fields.recentActivity')}
              </span>
              <input
                type='checkbox'
                className='rounded'
                checked={dashboardPreferences.showRecentActivity}
                onChange={handlePreferenceToggle('showRecentActivity')}
                data-testid='show-recent-activity-toggle'
              />
            </label>
            <label className='flex items-center justify-between'>
              <span className='text-sm font-medium'>
                {t('dashboard.personal.harness.settings.fields.engagementScore')}
              </span>
              <input
                type='checkbox'
                className='rounded'
                checked={dashboardPreferences.showEngagementScore}
                onChange={handlePreferenceToggle('showEngagementScore')}
                data-testid='show-engagement-score-toggle'
              />
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PersonalDashboard(props: PersonalDashboardProps) {
  // TEMPORARY: Always render StandardPersonalDashboard while testing infinite loop
  // #region agent log
  console.log('[DEBUG-HYP-B] PersonalDashboard function entry', { typeofWindow: typeof window !== 'undefined', timestamp: Date.now() });
  // #endregion
  // #region agent log
  console.log('[DEBUG-HYP-B] Returning StandardPersonalDashboard', { typeofWindow: typeof window !== 'undefined', timestamp: Date.now() });
  // #endregion
  return <StandardPersonalDashboard {...props} />;
}

function StandardPersonalDashboard({ userId: fallbackUserId }: PersonalDashboardProps) {
  // #region agent log
  console.log('[DEBUG-HYP-B] StandardPersonalDashboard function entry - RETURNING IMMEDIATELY', { typeofWindow: typeof window !== 'undefined', timestamp: Date.now() });
  // #endregion

  // TEMPORARY: Return immediately without calling ANY hooks to test if hooks cause infinite render loop
  // This will help us isolate if the infinite loop is caused by hooks or something else
  // #region agent log
  console.log('[DEBUG-HYP-B] StandardPersonalDashboard RETURN - about to return static div (NO HOOKS)', { typeofWindow: typeof window !== 'undefined', timestamp: Date.now() });
  // #endregion
  return (
    <div className="space-y-6" data-testid='personal-dashboard'>
      <div className='p-4 bg-gray-50 rounded'>
        <p className='text-gray-600'>Static content - no hooks called, no conditionals or computed values</p>
        <p className='text-sm text-gray-500 mt-2'>Testing if hooks cause infinite render loop</p>
      </div>
    </div>
  );

  // BELOW CODE IS TEMPORARILY UNREACHABLE - all hooks commented out to test infinite loop
  /*
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => { routerRef.current = router; }, [router]);
  const { t, currentLanguage } = useI18n();

  // Use ref for stable t function
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);

  // StandardPersonalDashboard uses preferencesRefresher instead of handlePreferenceToggle
  // (defined later in the component)

  // CRITICAL: Follow polls page pattern - only create formatters after mount
  // This prevents hydration mismatches from Intl formatters using different locales
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Only create formatters after mount to prevent hydration mismatch
  const numberFormatter = useMemo(() => {
    if (!isMounted) return null;
    return new Intl.NumberFormat(currentLanguage ?? undefined);
  }, [isMounted, currentLanguage]);

  // @ts-expect-error - Temporarily unused in simplified component for debugging
  const dateFormatter = useMemo(() => {
    if (!isMounted) return null;
    return new Intl.DateTimeFormat(currentLanguage ?? undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [isMounted, currentLanguage]);

  // @ts-expect-error - Temporarily unused in simplified component for debugging
  const formatNumber = useCallback(
    (value: number) => {
      if (!isMounted || !numberFormatter) {
        return String(value); // Fallback during SSR
      }
      return numberFormatter.format(value);
    },
    [isMounted, numberFormatter],
  );

  const {
    profile,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useProfile();
  const { isAnyUpdating: _isAnyUpdating2 } = useProfileLoadingStates();
  const { hasAnyError } = useProfileErrorStates();

  const isAuthenticated = useIsAuthenticated();
  const isUserLoading = useUserLoading();

  // Optimize store subscriptions with useShallow
  // #region agent log
  console.log('[DEBUG-HYP-B] BEFORE calling useProfileStore', { typeofWindow: typeof window !== 'undefined', timestamp: Date.now() });
  // #endregion
  const { displayName, profilePreferences, updatePreferences } = useProfileStore(
    useShallow((state) => ({
      displayName: state.getDisplayName(),
      profilePreferences: state.preferences,
      updatePreferences: state.updatePreferences,
    })),
  );
  // #region agent log
  console.log('[DEBUG-HYP-B] AFTER calling useProfileStore', { typeofWindow: typeof window !== 'undefined', hasProfilePreferences: !!profilePreferences, timestamp: Date.now() });
  // #endregion

  // Use ref for stable updatePreferences callback
  const updatePreferencesRef = useRef(updatePreferences);
  useEffect(() => { updatePreferencesRef.current = updatePreferences; }, [updatePreferences]);

  // StandardPersonalDashboard uses preferencesRefresher (defined later) instead of handlePreferenceToggle

  const polls = usePolls();
  const isPollsLoading = usePollsLoading();
  const pollsError = usePollsError();
  const { loadPolls } = usePollsActions();
  const lastPollsFetchedAt = usePollLastFetchedAt();

  const analyticsEvents = useAnalyticsEvents();
  const userBehavior = useAnalyticsBehavior();
  const analyticsError = useAnalyticsError();
  const analyticsLoading = useAnalyticsLoading();
  // REMOVED: resetUserState - no longer needed since we removed auth redirect logic
  // Dashboard page wrapper handles all auth checks and redirects
  // CRITICAL: Never use isMounted in useMemo for render logic - it changes after mount causing hydration mismatch
  // Use useState instead, set in useEffect after mount
  const [shouldBypassAuth, setShouldBypassAuth] = useState<boolean>(
    process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1'
  );

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1') {
      return; // Already set to true
    }
    // Check localStorage after mount
    if (typeof window !== 'undefined' && window.localStorage.getItem('e2e-dashboard-bypass') === '1') {
      setShouldBypassAuth(true);
    }
  }, []);
  // CRITICAL: Use useState instead of useMemo to prevent hydration mismatch
  // Initialize to false (same on server and client), then check localStorage in useEffect
  const [fallbackAuthenticated, setFallbackAuthenticated] = useState(false);

  useEffect(() => {
    if (!shouldBypassAuth || typeof window === 'undefined') {
      setFallbackAuthenticated(false);
      return;
    }
    try {
      const raw = window.localStorage.getItem('user-store');
      if (!raw) {
        setFallbackAuthenticated(false);
        return;
      }
      const parsed = JSON.parse(raw);
      setFallbackAuthenticated(Boolean(parsed.state?.isAuthenticated));
    } catch {
      setFallbackAuthenticated(false);
    }
  }, [shouldBypassAuth]);

  const effectiveIsAuthenticated = isAuthenticated || fallbackAuthenticated;

  // @ts-expect-error - Temporarily unused in simplified component for debugging
  const _trendingHashtags = useTrendingHashtags();
  const hashtagLoadingState = useHashtagLoading();
  // @ts-expect-error - Temporarily unused in simplified component for debugging
  const _hashtagLoading = hashtagLoadingState.isLoading;
  const hashtagErrorState = useHashtagError();
  const hashtagError = hashtagErrorState.error;
  const { getTrendingHashtags } = useHashtagActions();

  const [_selectedTab, _setSelectedTab] = useState('overview');
  const [_isRefreshing, setIsRefreshing] = useState(false);
  const hasRequestedTrending = useRef(false);
  const hasRequestedRepresentatives = useRef(false);

  // Optimize representative store subscriptions
  const representativeEntries = useUserRepresentativeEntries();
  // @ts-expect-error - Temporarily unused in simplified component for debugging
  const _representativeLoading3 = useRepresentativeGlobalLoading();
  const representativeError = useRepresentativeError();
  const getUserRepresentatives = useGetUserRepresentatives(); // This is a hook, not a selector

  // CRITICAL: Initialize preferences with consistent defaults to prevent hydration mismatch
  // Zustand persist storage may not be available during SSR, causing different initial values
  // Always use DEFAULT_DASHBOARD_PREFERENCES initially, then update from store after mount
  // This ensures consistent initial render on both server and client
  const [preferences, setPreferences] = useState<DashboardPreferences>(DEFAULT_DASHBOARD_PREFERENCES);
  const preferencesRef = useRef<DashboardPreferences>(DEFAULT_DASHBOARD_PREFERENCES);

  // Update preferences from store after mount (store hydration happens automatically)
  // We don't need to wait for store hydration explicitly - Zustand will handle it
  // The key is using consistent defaults during SSR/initial render
  useEffect(() => {
    if (!isMounted) {
      return; // Don't update until after mount
    }
    const stored = profilePreferences?.dashboard;
    const resolved: DashboardPreferences = {
      showElectedOfficials: stored?.showElectedOfficials ?? DEFAULT_DASHBOARD_PREFERENCES.showElectedOfficials,
      showQuickActions: stored?.showQuickActions ?? DEFAULT_DASHBOARD_PREFERENCES.showQuickActions,
      showRecentActivity: stored?.showRecentActivity ?? DEFAULT_DASHBOARD_PREFERENCES.showRecentActivity,
      showEngagementScore: stored?.showEngagementScore ?? DEFAULT_DASHBOARD_PREFERENCES.showEngagementScore,
    };
    setPreferences(resolved);
    preferencesRef.current = resolved;
  }, [isMounted, profilePreferences]);

  const { showQuickActions: _showQuickActions, showElectedOfficials, showRecentActivity: _showRecentActivity, showEngagementScore: _showEngagementScore } = preferences;

  // Refs for stable action callbacks
  const getTrendingHashtagsRef = useRef(getTrendingHashtags);
  useEffect(() => { getTrendingHashtagsRef.current = getTrendingHashtags; }, [getTrendingHashtags]);
  const getUserRepresentativesRef = useRef(getUserRepresentatives);
  useEffect(() => { getUserRepresentativesRef.current = getUserRepresentatives; }, [getUserRepresentatives]);
  const loadPollsRef = useRef(loadPolls);
  useEffect(() => { loadPollsRef.current = loadPolls; }, [loadPolls]);

  useEffect(() => {
    if (!effectiveIsAuthenticated || hasRequestedTrending.current) {
      return;
    }
    hasRequestedTrending.current = true;
    void getTrendingHashtagsRef.current(undefined, 6);
  }, [effectiveIsAuthenticated]); // Removed getTrendingHashtags

  useEffect(() => {
    if (!effectiveIsAuthenticated || isUserLoading) {
      return;
    }
    if (hasRequestedRepresentatives.current) {
      return;
    }
    hasRequestedRepresentatives.current = true;
    void getUserRepresentativesRef.current();
  }, [effectiveIsAuthenticated, isUserLoading]); // Removed getUserRepresentatives

  // REMOVED: Auth redirect logic from PersonalDashboard component
  // Dashboard page wrapper handles all auth checks and redirects
  // PersonalDashboard should just render content (like feed/polls components)
  // Trust middleware and page wrapper have already validated authentication
  // This matches the pattern used by feed and polls pages which work correctly

  useEffect(() => {
    if (!effectiveIsAuthenticated) {
      hasRequestedTrending.current = false;
      hasRequestedRepresentatives.current = false;
    }
  }, [effectiveIsAuthenticated]);

  useEffect(() => {
    if (!effectiveIsAuthenticated || lastPollsFetchedAt) {
      return;
    }
    loadPollsRef.current().catch((error) => {
      logger.error('Failed to load polls for dashboard', error as Error);
    });
  }, [effectiveIsAuthenticated, lastPollsFetchedAt]); // Removed loadPolls

  const profileRecord = profile as Record<string, unknown> | null;
  const userProfileId =
    (() => {
      if (profileRecord && typeof profileRecord.id === 'string') {
        return profileRecord.id;
      }
      if (profileRecord && typeof profileRecord.user_id === 'string') {
        return profileRecord.user_id;
      }
      return fallbackUserId;
    })() ?? null;

  // CRITICAL: Guard all store-dependent computations with isMounted to prevent hydration mismatch
  // Store values may differ between server and client during initial render
  const userPolls = useMemo(() => {
    if (!isMounted) {
      return [] as Poll[]; // Consistent default during SSR
    }
    if (!userProfileId) {
      return [] as Poll[];
    }
    return polls.filter((poll) => {
      const record = poll as Record<string, unknown>;
      const createdBy = record.created_by ?? record.createdBy;
      return typeof createdBy === 'string' && createdBy === userProfileId;
    });
  }, [isMounted, polls, userProfileId]);

  const sortedUserPolls = useMemo(() => {
    if (!isMounted) {
      return [] as Poll[]; // Consistent default during SSR
    }
    return [...userPolls].sort((a, b) => {
      const dateA = new Date((a as Record<string, unknown>).created_at as string ?? 0).getTime();
      const dateB = new Date((b as Record<string, unknown>).created_at as string ?? 0).getTime();
      return dateB - dateA;
    });
  }, [isMounted, userPolls]);

  const voteEvents = useMemo(() => {
    if (!isMounted) {
      return []; // Consistent default during SSR
    }
    return analyticsEvents.filter((event) => event.event_type === 'poll_voted');
  }, [isMounted, analyticsEvents]);

  const pollCreatedEvents = useMemo(() => {
    if (!isMounted) {
      return []; // Consistent default during SSR
    }
    return analyticsEvents.filter((event) => event.event_type === 'poll_created');
  }, [isMounted, analyticsEvents]);

  // CRITICAL: Initialize to 0 to ensure consistent filtering during SSR/initial render
  // All events will pass the filter (createdAt >= 0), then after mount we update to actual timestamp
  // This prevents hydration mismatch while still allowing accurate filtering after hydration
  // CRITICAL: Initialize thirtyDaysAgo to a consistent value to prevent hydration mismatch
  // Use -1 (no events match) for initial render on both server and client
  // Then update to actual value after mount via useEffect
  // This ensures consistent filtering logic during SSR/initial render
  const [thirtyDaysAgo, setThirtyDaysAgo] = useState(-1);

  useEffect(() => {
    // Update to actual value after mount (client-side only)
    setThirtyDaysAgo(Date.now() - THIRTY_DAYS_MS);
  }, []);

  const votesLast30Days = useMemo(
    () =>
      voteEvents.filter((event) => {
        const createdAt = new Date(event.created_at ?? event.timestamp ?? 0).getTime();
        return createdAt >= thirtyDaysAgo;
      }).length,
    [thirtyDaysAgo, voteEvents],
  );

  const pollsCreatedLast30Days = useMemo(
    () =>
      pollCreatedEvents.filter((event) => {
        const createdAt = new Date(event.created_at ?? event.timestamp ?? 0).getTime();
        return createdAt >= thirtyDaysAgo;
      }).length,
    [pollCreatedEvents, thirtyDaysAgo],
  );

  const recentVotes = useMemo<PersonalAnalytics['recent_votes']>(() => {
    if (!isMounted) {
      return []; // Consistent default during SSR
    }
    return voteEvents
      .slice()
      .sort(
        (a, b) =>
          new Date(b.created_at ?? b.timestamp ?? 0).getTime() -
          new Date(a.created_at ?? a.timestamp ?? 0).getTime(),
      )
      .slice(0, 3)
      .map((event) => {
        const pollIdRaw = (event.event_data?.poll_id ??
          event.event_data?.pollId ??
          event.label ??
          '') as string | number | undefined;
        // CRITICAL: Use consistent fallback to prevent hydration mismatch
        const eventTimestamp = event.created_at ?? event.timestamp;
        return {
          id: event.id,
          poll_id: typeof pollIdRaw === 'number' ? String(pollIdRaw) : (pollIdRaw ?? 'unknown'),
          created_at: eventTimestamp ?? '1970-01-01T00:00:00.000Z', // Consistent fallback instead of Date.now()
        };
      });
  }, [isMounted, voteEvents]);

  const recentPolls = useMemo<PersonalAnalytics['recent_polls']>(() => {
    if (!isMounted) {
      return []; // Consistent default during SSR
    }
    return sortedUserPolls.slice(0, 2).map((poll) => {
      const record = poll as Record<string, unknown>;
      // CRITICAL: Use consistent fallback to prevent hydration mismatch
      // Only use fallback if data is truly missing (shouldn't happen in production)
      const pollId = record.id ?? record.poll_id;
      const createdAt = record.created_at as string | undefined;
      return {
        id: pollId ? String(pollId) : 'unknown',
        title: resolvePollTitle(poll, tRef.current('dashboard.personal.polls.untitled')),
        created_at: createdAt ?? '1970-01-01T00:00:00.000Z', // Consistent fallback instead of Date.now()
        total_votes: resolvePollVotes(poll),
        status: (record.status as string) ?? 'draft',
      };
    });
  }, [isMounted, sortedUserPolls]); // Removed t from deps - using tRef

  const totalVotesOnUserPolls = useMemo(() => {
    if (!isMounted) {
      return 0; // Consistent default during SSR
    }
    return userPolls.reduce((sum, poll) => sum + resolvePollVotes(poll), 0);
  }, [isMounted, userPolls]);

  const participationScore = useMemo(() => {
    if (!isMounted) {
      return 0; // Consistent default during SSR
    }
    const behaviorScore = userBehavior?.engagementScore ?? 0;
    const derivedScore = voteEvents.length * 5 + pollCreatedEvents.length * 10;
    return Math.min(100, Math.max(behaviorScore, derivedScore));
  }, [isMounted, pollCreatedEvents.length, userBehavior?.engagementScore, voteEvents.length]);

  // Analytics - computed from store values (safe after mount check)
  // CRITICAL: Only compute analytics after mount to prevent hydration mismatch
  // Store values may differ between server and client during initial render
  // @ts-expect-error - Temporarily unused in simplified component for debugging
  const _analytics: PersonalAnalytics = useMemo(() => {
    if (!isMounted) {
      // Return consistent default analytics during SSR to prevent hydration mismatch
      return {
        user_id: 'anonymous',
        total_votes: 0,
        total_polls_created: 0,
        active_polls: 0,
        total_votes_on_user_polls: 0,
        participation_score: 0,
        recent_activity: {
          votes_last_30_days: 0,
          polls_created_last_30_days: 0,
        },
        recent_votes: [],
        recent_polls: [],
      } satisfies PersonalAnalytics;
    }
    return {
      user_id: userProfileId ?? 'anonymous',
      total_votes: voteEvents.length,
      total_polls_created: pollCreatedEvents.length,
      active_polls: userPolls.filter((poll) => (poll as Record<string, unknown>).status === 'active').length,
      total_votes_on_user_polls: totalVotesOnUserPolls,
      participation_score: participationScore,
      recent_activity: {
        votes_last_30_days: votesLast30Days,
        polls_created_last_30_days: pollsCreatedLast30Days,
      },
      recent_votes: recentVotes,
      recent_polls: recentPolls,
    } satisfies PersonalAnalytics;
  }, [
    isMounted,
    participationScore,
    pollCreatedEvents.length,
    pollsCreatedLast30Days,
    recentPolls,
    recentVotes,
    totalVotesOnUserPolls,
    userPolls,
    userProfileId,
    voteEvents.length,
    votesLast30Days,
  ]);

  // @ts-expect-error - Temporarily unused in simplified component for debugging
  const _preferencesRefresher = useCallback(
    async (updates: Partial<DashboardPreferences>) => {
      if (!isAuthenticated) {
        logger.warn('Dashboard preferences update skipped for unauthenticated user');
        return;
      }
      const nextPreferences = { ...preferencesRef.current, ...updates };
      setPreferences(nextPreferences);
      preferencesRef.current = nextPreferences;

      try {
        await updatePreferencesRef.current({ dashboard: nextPreferences } as Partial<ProfilePreferences>);
      } catch (error) {
        logger.error('Error saving dashboard preferences', error as Error);
      }
    },
    [isAuthenticated], // Removed updatePreferences - using updatePreferencesRef
  );

  const refetchProfileRef = useRef(refetchProfile);
  useEffect(() => { refetchProfileRef.current = refetchProfile; }, [refetchProfile]);

  // @ts-expect-error - Temporarily unused in simplified component for debugging
  const _handleRefresh = useCallback(async () => {
    if (!isAuthenticated) {
      logger.warn('Dashboard refresh skipped for unauthenticated user');
      return;
    }
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchProfileRef.current(),
        loadPollsRef.current(),
        getTrendingHashtagsRef.current(undefined, 6),
        getUserRepresentativesRef.current().catch((error) => {
          logger.warn('Failed to refresh user representatives (non-critical):', error);
        }),
      ]);
    } catch (error) {
      logger.error('Error refreshing dashboard', error as Error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isAuthenticated]);

  // Display name and title/subtitle - computed from profile/store (safe after mount check)
  // CRITICAL: Only compute these after mount to prevent hydration mismatch
  // Store values may differ between server and client during initial render
  const effectiveDisplayName = isMounted
    ? ((displayName && displayName !== 'User' ? displayName : undefined) ??
        ((profileRecord?.display_name as string | undefined) ??
          (profileRecord?.fullName as string | undefined) ??
          (profileRecord?.username as string | undefined)))
    : undefined;

  // @ts-expect-error - Temporarily unused in simplified component for debugging
  const _dashboardTitle = useMemo(() => {
    if (!isMounted) {
      return tRef.current('dashboard.personal.header.titleFallback'); // Consistent default during SSR
    }
    return effectiveDisplayName
      ? tRef.current('dashboard.personal.header.titleWithName', { name: effectiveDisplayName })
      : tRef.current('dashboard.personal.header.titleFallback');
  }, [isMounted, effectiveDisplayName]);

  // @ts-expect-error - Temporarily unused in simplified component for debugging
  const _dashboardSubtitle = useMemo(() => {
    if (!isMounted) {
      return tRef.current('dashboard.personal.header.subtitleDefault'); // Consistent default during SSR
    }
    return profileRecord?.bio
      ? tRef.current('dashboard.personal.header.subtitleWithBio')
      : tRef.current('dashboard.personal.header.subtitleDefault');
  }, [isMounted, profileRecord?.bio]);

  // Loading and error states - computed from store values (safe after mount check)
  // @ts-expect-error - Temporarily unused in simplified component for debugging
  const _isLoading = isUserLoading || profileLoading || isPollsLoading || analyticsLoading;

  // @ts-expect-error - Temporarily unused in simplified component for debugging
  const _errorMessage = useMemo(() => {
    return (
      profileError ??
      pollsError ??
      analyticsError ??
      hashtagError ??
      representativeError ??
      (hasAnyError ? tRef.current('dashboard.personal.errors.generic') : null)
    );
  }, [profileError, pollsError, analyticsError, hashtagError, representativeError, hasAnyError]);

  // @ts-expect-error - Temporarily unused in simplified component for debugging
  const _quickActions = useMemo(
    () => [
      {
        id: 'create-poll',
        label: tRef.current('dashboard.personal.quickActions.createPoll.label'),
        icon: Plus,
        href: '/polls/create',
        description: tRef.current('dashboard.personal.quickActions.createPoll.description'),
      },
      {
        id: 'update-profile',
        label: tRef.current('dashboard.personal.quickActions.updateProfile.label'),
        icon: Settings,
        href: '/profile/edit',
        description: tRef.current('dashboard.personal.quickActions.updateProfile.description'),
      },
      {
        id: 'privacy-settings',
        label: tRef.current('dashboard.personal.quickActions.privacy.label'),
        icon: Shield,
        href: '/account/privacy',
        description: tRef.current('dashboard.personal.quickActions.privacy.description'),
      },
      {
        id: 'set-location',
        label: tRef.current('dashboard.personal.quickActions.location.label'),
        icon: MapPin,
        href: '/profile/preferences',
        description: tRef.current('dashboard.personal.quickActions.location.description'),
      },
      {
        id: 'export-data',
        label: tRef.current('dashboard.personal.quickActions.export.label'),
        icon: Download,
        href: '/account/privacy',
        description: tRef.current('dashboard.personal.quickActions.export.description'),
      },
    ],
    [], // Removed t from deps - using tRef
  );

  // CRITICAL: Guard all representative computations with isMounted to prevent hydration mismatch
  // Store values may differ between server and client during initial render
  const representatives = useMemo(() => {
    if (!isMounted) {
      return []; // Consistent default during SSR
    }
    return representativeEntries.map((entry) => entry.representative);
  }, [isMounted, representativeEntries]);

  // @ts-expect-error - Temporarily unused in simplified component for debugging
  const _visibleRepresentatives = useMemo(() => {
    if (!isMounted) {
      return []; // Consistent default during SSR
    }
    return representatives.slice(0, 3);
  }, [isMounted, representatives]);

  const representativeDivisionIds = useMemo(() => {
    if (!isMounted) {
      return []; // Consistent default during SSR
    }
    const divisions = new Set<string>();
    representativeEntries.forEach((entry) => {
      const candidate =
        entry?.representative?.division_ids ??
        entry?.representative?.ocdDivisionIds ??
        [];
      if (!Array.isArray(candidate)) {
        return;
      }
      candidate.forEach((division) => {
        if (typeof division === 'string') {
          const value = division.trim();
          if (value.length > 0) {
            divisions.add(value);
          }
        }
      });
    });
    return Array.from(divisions);
  }, [isMounted, representativeEntries]);

  const representativeNames = useMemo(() => {
    if (!isMounted) {
      return []; // Consistent default during SSR
    }
    return representativeEntries
      .map((entry) => entry.representative?.name?.trim())
      .filter((value): value is string => Boolean(value));
  }, [isMounted, representativeEntries]);

  // CRITICAL: Only call useElectionCountdown after mount to prevent hydration mismatch
  // This hook depends on representativeDivisionIds and representativeNames which are computed from store values
  // @ts-expect-error - Temporarily unused in simplified component for debugging
  const _electionCountdownResult2 = useElectionCountdown(isMounted ? representativeDivisionIds : [], {
    autoFetch: showElectedOfficials,
    clearOnEmpty: true,
    notify: showElectedOfficials,
    notificationSource: 'dashboard',
    notificationThresholdDays: 7,
    representativeNames,
    analytics: {
      surface: 'dashboard_personal_representatives',
      metadata: {
        representativeCount: representativeEntries.length,
        hasRepresentatives: representativeEntries.length > 0,
      },
    },
  });

  // REMOVED: Auth check that blocked rendering
  // Dashboard page wrapper handles all auth checks and redirects
  // PersonalDashboard should just render content (like feed/polls components)
  // Trust middleware and page wrapper have already validated authentication
  // If we're rendering this component, user is authenticated (page wrapper checked)
  // This matches the pattern used by feed and polls pages which work correctly

  // CRITICAL: Always render the same component structure to prevent hydration mismatches
  // Never use conditional returns - always render the same tree structure
  // Use conditional rendering inside JSX instead
  // This ensures component tree structure is always consistent between SSR and client render

  // TEMPORARY: Return completely static content to isolate hydration mismatch
  // No conditionals, no computed values, just a static div
  */
}
