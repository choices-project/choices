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
*/
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

function StandardPersonalDashboard({ userId: _fallbackUserId }: PersonalDashboardProps) {
  // #region agent log - Render tracking
  // Track render count using a module-level counter (persists across renders but resets on reload)
  if (typeof window !== 'undefined') {
    (window as any).__dashboardRenderCount = ((window as any).__dashboardRenderCount || 0) + 1;
  }
  const renderCount = typeof window !== 'undefined' ? (window as any).__dashboardRenderCount : 0;
  console.log(JSON.stringify({
    location: 'PersonalDashboard.tsx:469',
    message: 'StandardPersonalDashboard render',
    data: {
      renderCount,
      timestamp: Date.now(),
      hasWindow: typeof window !== 'undefined',
    },
    sessionId: 'debug-session',
    runId: 'hook-isolation-test',
    hypothesisId: 'H1'
  }));
  // #endregion

  // HYPOTHESIS H1: Hooks are causing infinite render loop
  // TEST: Return static content without calling ANY hooks
  // EXPECTED: If hooks are the cause, render count should stabilize at 1-2 renders
  // ACTUAL: Will be measured in production test

    return (
    <div className="space-y-6" data-testid='personal-dashboard'>
      <div className='p-4 bg-gray-50 rounded'>
        <p className='text-gray-600'>Static content - no hooks, no conditionals, no computed values</p>
        <p className='text-sm text-gray-500 mt-2'>
          Render count: {renderCount} | Testing if hooks cause infinite render loop
        </p>
          </div>
    </div>
  );
}
