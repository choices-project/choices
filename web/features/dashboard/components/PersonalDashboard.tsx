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
 *
 * FIXED: Infinite render loop - Applied React/Zustand best practices:
 * - All store subscriptions use useShallow for stable references
 * - Store actions stored in refs to prevent dependency issues
 * - Client-only logic guarded with isMounted
 * - useEffect dependencies carefully managed
 * - Memoized dashboardPreferences with specific property dependencies
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useProfile, useProfileErrorStates, useProfileLoadingStates } from '@/features/profile/hooks/use-profile';

import {
  useIsAuthenticated,
  useUserLoading,
  usePollsActions,
  usePollsStore,
  useAnalyticsStore,
} from '@/lib/stores';
import { useHashtagActions, useHashtagStore } from '@/lib/stores/hashtagStore';
import { useProfileStore } from '@/lib/stores/profileStore';
import {
  useGetUserRepresentatives,
  useRepresentativeStore,
  representativeSelectors,
} from '@/lib/stores/representativeStore';

import type { DashboardPreferences } from '@/types/profile';

const DEFAULT_DASHBOARD_PREFERENCES: DashboardPreferences = {
  showElectedOfficials: false,
  showQuickActions: true,
  showRecentActivity: true,
  showEngagementScore: true,
};

type PersonalDashboardProps = {
  userId?: string;
  className?: string;
};

/**
 * DIAGNOSTIC TRACKING
 *
 * Comprehensive instrumentation to understand component behavior:
 * - Render lifecycle tracking
 * - Hook execution tracking
 * - Store subscription changes
 * - Memoized value recalculations
 * - Dependency array comparisons
 */
function useDiagnosticTracking(componentName: string) {
  const renderCountRef = useRef(0);
  const hookExecutionsRef = useRef<Record<string, number>>({});
  const memoRecalculationsRef = useRef<Record<string, number>>({});

  // Track render count
  if (typeof window !== 'undefined') {
    renderCountRef.current += 1;
    const renderCount = renderCountRef.current;

    // Log render with comprehensive context
    console.log(JSON.stringify({
      location: `${componentName}:render`,
      message: 'Component render',
      data: {
        renderCount,
        timestamp: Date.now(),
        hasWindow: typeof window !== 'undefined',
        componentName,
      },
      sessionId: 'debug-session',
      runId: 'final-fix-diagnostic',
      hypothesisId: 'DIAGNOSTIC'
    }));
  }

  // Track hook execution
  const trackHookExecution = (hookName: string, data?: Record<string, unknown>) => {
    hookExecutionsRef.current[hookName] = (hookExecutionsRef.current[hookName] || 0) + 1;
    console.log(JSON.stringify({
      location: `${componentName}:${hookName}`,
      message: 'Hook execution',
      data: {
        hookName,
        executionCount: hookExecutionsRef.current[hookName],
        renderCount: renderCountRef.current,
        ...data,
      },
      sessionId: 'debug-session',
      runId: 'final-fix-diagnostic',
      hypothesisId: 'DIAGNOSTIC'
    }));
  };

  // Track memo recalculation
  const trackMemoRecalculation = (memoName: string, reason: string, data?: Record<string, unknown>) => {
    memoRecalculationsRef.current[memoName] = (memoRecalculationsRef.current[memoName] || 0) + 1;
    console.log(JSON.stringify({
      location: `${componentName}:useMemo:${memoName}`,
      message: 'Memo recalculation',
      data: {
        memoName,
        recalculationCount: memoRecalculationsRef.current[memoName],
        renderCount: renderCountRef.current,
        reason,
        ...data,
      },
      sessionId: 'debug-session',
      runId: 'final-fix-diagnostic',
      hypothesisId: 'DIAGNOSTIC'
    }));
  };

  return {
    renderCount: renderCountRef.current,
    trackHookExecution,
    trackMemoRecalculation,
  };
}

/**
 * CRITICAL FIX: Use useShallow for all store subscriptions to prevent infinite loops
 * Without useShallow, store subscriptions create new object references every render
 */
function StandardPersonalDashboard({ userId: _fallbackUserId }: PersonalDashboardProps) {
  const diagnostics = useDiagnosticTracking('StandardPersonalDashboard');

  // CRITICAL: Guard client-only logic with isMounted (like feed/polls pages)
  const [isMounted, setIsMounted] = useState(false);
  const isMountedPrevRef = useRef(false);

  diagnostics.trackHookExecution('useState:isMounted', {
    isMounted,
    prevIsMounted: isMountedPrevRef.current,
  });
  isMountedPrevRef.current = isMounted;

  useEffect(() => {
    diagnostics.trackHookExecution('useEffect:setIsMounted', {
      isMountedBefore: isMounted,
    });
    setIsMounted(true);
  }, []);

  // CRITICAL FIX: Use useShallow for store subscription to prevent new object references
  // This was the root cause - without useShallow, this creates a new object every render
  const profilePreferencesRef = useRef<unknown>(null);

  const { preferences: profilePreferences, updatePreferences } = useProfileStore(
    useShallow((state) => ({
      preferences: state.preferences,
      updatePreferences: state.updatePreferences,
    })),
  );

  // Track store subscription changes
  const preferencesChanged = profilePreferences !== profilePreferencesRef.current;
  if (preferencesChanged) {
    console.log(JSON.stringify({
      location: 'StandardPersonalDashboard:useProfileStore',
      message: 'Store subscription changed',
      data: {
        prevPreferences: profilePreferencesRef.current,
        newPreferences: profilePreferences,
        preferencesChanged: true,
        renderCount: diagnostics.renderCount,
      },
      sessionId: 'debug-session',
      runId: 'final-fix-diagnostic',
      hypothesisId: 'DIAGNOSTIC'
    }));
    profilePreferencesRef.current = profilePreferences;
  }

  // CRITICAL FIX: Store actions in refs to prevent dependency issues (like feed/polls pages)
  const updatePreferencesRefForCallback = useRef(updatePreferences);
  useEffect(() => {
    const changed = updatePreferences !== updatePreferencesRefForCallback.current;
    if (changed) {
      diagnostics.trackHookExecution('useEffect:updatePreferencesRef', {
        updatePreferencesChanged: true,
      });
      updatePreferencesRefForCallback.current = updatePreferences;
    }
  }, [updatePreferences]);

  // PHASE 4.1: Profile Hooks (incremental restoration)
  // Following established patterns: useShallow for store subscriptions, refs for actions
  const { profile, isLoading: profileLoading, error: profileError } = useProfile();
  const { hasAnyError: _hasAnyError } = useProfileErrorStates(); // Phase 4.1: Added but not used yet
  const { isAnyUpdating: _isProfileUpdating } = useProfileLoadingStates(); // Phase 4.1: Added but not used yet
  const isAuthenticated = useIsAuthenticated();
  const isUserLoading = useUserLoading();

  // Track profile hooks execution for diagnostics
  diagnostics.trackHookExecution('useProfile', {
    hasProfile: !!profile,
    isLoading: profileLoading,
    hasError: !!profileError,
    profileId: (profile as Record<string, unknown>)?.id ?? null,
  });

  diagnostics.trackHookExecution('useIsAuthenticated', {
    isAuthenticated,
  });

  diagnostics.trackHookExecution('useUserLoading', {
    isUserLoading,
  });

  // PHASE 4.2: Store Action Hooks (incremental restoration)
  // CRITICAL: All actions stored in refs to prevent dependency issues (like feed/polls pages)
  const { loadPolls } = usePollsActions();
  const { getTrendingHashtags } = useHashtagActions();
  const getUserRepresentatives = useGetUserRepresentatives();

  // Store all actions in refs (critical pattern from feed/polls pages)
  const loadPollsRef = useRef(loadPolls);
  const getTrendingHashtagsRef = useRef(getTrendingHashtags);
  const getUserRepresentativesRef = useRef(getUserRepresentatives);

  // Update refs individually to prevent unnecessary re-renders
  useEffect(() => {
    const changed = loadPolls !== loadPollsRef.current;
    if (changed) {
      diagnostics.trackHookExecution('useEffect:loadPollsRef', {
        actionChanged: true,
      });
      loadPollsRef.current = loadPolls;
    }
  }, [loadPolls]);

  useEffect(() => {
    const changed = getTrendingHashtags !== getTrendingHashtagsRef.current;
    if (changed) {
      diagnostics.trackHookExecution('useEffect:getTrendingHashtagsRef', {
        actionChanged: true,
      });
      getTrendingHashtagsRef.current = getTrendingHashtags;
    }
  }, [getTrendingHashtags]);

  useEffect(() => {
    const changed = getUserRepresentatives !== getUserRepresentativesRef.current;
    if (changed) {
      diagnostics.trackHookExecution('useEffect:getUserRepresentativesRef', {
        actionChanged: true,
      });
      getUserRepresentativesRef.current = getUserRepresentatives;
    }
  }, [getUserRepresentatives]);

  diagnostics.trackHookExecution('usePollsActions', {
    hasLoadPolls: !!loadPolls,
  });

  diagnostics.trackHookExecution('useHashtagActions', {
    hasGetTrendingHashtags: !!getTrendingHashtags,
  });

  diagnostics.trackHookExecution('useGetUserRepresentatives', {
    hasGetUserRepresentatives: !!getUserRepresentatives,
  });

  // PHASE 4.3: Data Hooks - FIXED with useShallow pattern (like useFilteredPollCards)
  // CRITICAL: useShallow ensures stable object references - arrays come from stable object
  // Pattern matches useFilteredPollCards: useShallow for subscription, useMemo only if computation needed

  // Polls data - useShallow pattern (useShallow handles array reference stability)
  const pollsStoreData = usePollsStore(
    useShallow((state) => ({
      polls: state.polls,
      isLoading: state.isLoading,
      error: state.error,
      lastFetchedAt: state.lastFetchedAt,
    }))
  );
  const polls = pollsStoreData.polls; // useShallow ensures stable reference
  const isPollsLoading = pollsStoreData.isLoading;
  const pollsError = pollsStoreData.error;
  const lastPollsFetchedAt = pollsStoreData.lastFetchedAt;

  // Analytics data - useShallow pattern
  const analyticsStoreData = useAnalyticsStore(
    useShallow((state) => ({
      events: state.events,
      userBehavior: state.userBehavior,
    }))
  );
  const analyticsEvents = analyticsStoreData.events; // useShallow ensures stable reference
  const userBehavior = analyticsStoreData.userBehavior;

  // Hashtags data - useShallow pattern
  const hashtagStoreData = useHashtagStore(
    useShallow((state) => ({
      trendingHashtags: state.trendingHashtags,
      isLoading: state.isLoading,
      error: state.error,
    }))
  );
  const trendingHashtags = hashtagStoreData.trendingHashtags; // useShallow ensures stable reference
  const hashtagLoadingState = { isLoading: hashtagStoreData.isLoading };
  const hashtagErrorState = { error: hashtagStoreData.error };

  // Representatives data - useShallow pattern
  const representativeStoreData = useRepresentativeStore(
    useShallow((state) => ({
      entries: representativeSelectors.userRepresentativeEntries(state),
      error: state.error,
    }))
  );
  const representativeEntries = representativeStoreData.entries; // useShallow ensures stable reference
  const representativeError = representativeStoreData.error;

  // Track data hooks execution for diagnostics
  diagnostics.trackHookExecution('usePolls', {
    pollsCount: polls?.length ?? 0,
    hasError: !!pollsError,
    lastFetchedAt: lastPollsFetchedAt ?? null,
  });

  diagnostics.trackHookExecution('usePollsLoading', {
    isPollsLoading,
  });

  diagnostics.trackHookExecution('useAnalyticsEvents', {
    eventsCount: analyticsEvents?.length ?? 0,
    hasUserBehavior: !!userBehavior,
  });

  diagnostics.trackHookExecution('useTrendingHashtags', {
    hashtagsCount: trendingHashtags?.length ?? 0,
    isLoading: hashtagLoadingState?.isLoading ?? false,
    hasError: !!hashtagErrorState?.error,
  });

  diagnostics.trackHookExecution('useUserRepresentativeEntries', {
    representativesCount: representativeEntries?.length ?? 0,
    hasError: !!representativeError,
  });

  // CRITICAL FIX: Extract preferences.dashboard with stable reference using useMemo
  // This prevents new object reference every render, which was causing infinite loops
  // The key is to memoize based on the actual nested values, not the parent object
  const dashboardPreferencesPrevRef = useRef<DashboardPreferences | null>(null);
  const dashboardPreferences = useMemo(() => {
    const reason = !profilePreferences?.dashboard
      ? 'no-profile-preferences'
      : dashboardPreferencesPrevRef.current === null
      ? 'first-calculation'
      : 'dependency-changed';

    diagnostics.trackMemoRecalculation('dashboardPreferences', reason, {
      hasProfilePreferences: !!profilePreferences?.dashboard,
      prevValue: dashboardPreferencesPrevRef.current,
    });

    if (!profilePreferences?.dashboard) {
      const result = DEFAULT_DASHBOARD_PREFERENCES;
      dashboardPreferencesPrevRef.current = result;
      return result;
    }

    // Return a new object only if the actual values changed
    const result = {
      showElectedOfficials: profilePreferences.dashboard.showElectedOfficials ?? DEFAULT_DASHBOARD_PREFERENCES.showElectedOfficials,
      showQuickActions: profilePreferences.dashboard.showQuickActions ?? DEFAULT_DASHBOARD_PREFERENCES.showQuickActions,
      showRecentActivity: profilePreferences.dashboard.showRecentActivity ?? DEFAULT_DASHBOARD_PREFERENCES.showRecentActivity,
      showEngagementScore: profilePreferences.dashboard.showEngagementScore ?? DEFAULT_DASHBOARD_PREFERENCES.showEngagementScore,
    };

    dashboardPreferencesPrevRef.current = result;
    return result;
  }, [
    profilePreferences?.dashboard?.showElectedOfficials,
    profilePreferences?.dashboard?.showQuickActions,
    profilePreferences?.dashboard?.showRecentActivity,
    profilePreferences?.dashboard?.showEngagementScore,
  ]);

  // CRITICAL FIX: NO useEffect that depends on profilePreferences
  // This was the root cause - profilePreferences changed reference every render
  // Instead, use the memoized dashboardPreferences directly

  // PHASE 5: Computed Values
  // CRITICAL: All Intl formatters must be created after mount to prevent hydration mismatches

  // 5.2: Intl Formatters (must be guarded by isMounted)
  const numberFormatter = useMemo(() => {
    if (!isMounted) return null;
    return new Intl.NumberFormat('en-US');
  }, [isMounted]);

  const dateFormatter = useMemo(() => {
    if (!isMounted) return null;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [isMounted]);

  // 5.1: Basic Computed Values (memoized with isMounted guard)
  // Filter polls by user (if we have user profile)
  const _userPolls = useMemo(() => {
    if (!isMounted || !polls || !profile) return [];
    const userId = (profile as Record<string, unknown>)?.id as string | undefined;
    if (!userId) return [];
    return polls.filter((poll) => {
      const pollCreatorId = (poll as Record<string, unknown>)?.creator_id as string | undefined;
      return pollCreatorId === userId;
    });
  }, [isMounted, polls, profile]);

  // Filter analytics events by type
  const voteEvents = useMemo(() => {
    if (!isMounted || !analyticsEvents) return [];
    return analyticsEvents.filter((event) => {
      const eventType = (event as Record<string, unknown>)?.event_type as string | undefined;
      return eventType === 'poll_voted';
    });
  }, [isMounted, analyticsEvents]);

  const pollCreatedEvents = useMemo(() => {
    if (!isMounted || !analyticsEvents) return [];
    return analyticsEvents.filter((event) => {
      const eventType = (event as Record<string, unknown>)?.event_type as string | undefined;
      return eventType === 'poll_created';
    });
  }, [isMounted, analyticsEvents]);

  // Date-based metrics (last 30 days)
  const thirtyDaysAgo = useMemo(() => {
    if (!isMounted) return null;
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }, [isMounted]);

  const votesLast30Days = useMemo(() => {
    if (!isMounted || !voteEvents || !thirtyDaysAgo) return 0;
    return voteEvents.filter((event) => {
      const createdAt = (event as Record<string, unknown>)?.created_at as string | undefined;
      if (!createdAt) return false;
      return new Date(createdAt) >= thirtyDaysAgo;
    }).length;
  }, [isMounted, voteEvents, thirtyDaysAgo]);

  const pollsCreatedLast30Days = useMemo(() => {
    if (!isMounted || !pollCreatedEvents || !thirtyDaysAgo) return 0;
    return pollCreatedEvents.filter((event) => {
      const createdAt = (event as Record<string, unknown>)?.created_at as string | undefined;
      if (!createdAt) return false;
      return new Date(createdAt) >= thirtyDaysAgo;
    }).length;
  }, [isMounted, pollCreatedEvents, thirtyDaysAgo]);

  // Track computed values for diagnostics (using all Phase 5 values)
  diagnostics.trackHookExecution('computedValues', {
    hasNumberFormatter: !!numberFormatter,
    hasDateFormatter: !!dateFormatter,
    userPollsCount: _userPolls.length, // Phase 5.1: Used in diagnostics
    voteEventsCount: voteEvents.length,
    pollCreatedEventsCount: pollCreatedEvents.length,
    votesLast30Days,
    pollsCreatedLast30Days,
  });

  // Diagnostic: Log final render state
  useEffect(() => {
    console.log(JSON.stringify({
      location: 'StandardPersonalDashboard:useEffect:render-summary',
      message: 'Render summary after mount',
      data: {
        renderCount: diagnostics.renderCount,
        isMounted,
        hasDashboardPreferences: !!dashboardPreferences,
        dashboardPreferencesValue: dashboardPreferences,
        hasProfilePreferences: !!profilePreferences,
        hasNumberFormatter: !!numberFormatter,
        hasDateFormatter: !!dateFormatter,
      },
      sessionId: 'debug-session',
      runId: 'final-fix-diagnostic',
      hypothesisId: 'DIAGNOSTIC'
    }));
  }, [isMounted, dashboardPreferences, profilePreferences, numberFormatter, dateFormatter, diagnostics]);

  // Phase 5: Computed values added - Ready for UI restoration
  return (
    <div className="space-y-6" data-testid='personal-dashboard'>
      <div className='p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'>
        <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>
          Phase 5: Computed Values Added
        </h2>
        <div className='space-y-1 text-sm text-gray-600 dark:text-gray-400'>
          <p>
            <span className='font-medium'>Render count:</span> {diagnostics.renderCount} |
            <span className='font-medium ml-2'>Mounted:</span> {String(isMounted)}
          </p>
          <p>
            <span className='font-medium'>Profile:</span> {profile ? `loaded (id: ${(profile as Record<string, unknown>)?.id ?? 'unknown'})` : 'loading'} |
            <span className='font-medium ml-2'>Auth:</span> {String(isAuthenticated)} |
            <span className='font-medium ml-2'>Loading:</span> {String(profileLoading)}
          </p>
          <p className='text-xs text-gray-500 dark:text-gray-500 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700'>
            ✅ Diagnostic tracking enabled | Phase 5: Computed values added | Polls: {polls?.length ?? 0} | Events: {analyticsEvents?.length ?? 0} | Votes (30d): {votesLast30Days} | Polls created (30d): {pollsCreatedLast30Days}
          </p>
        </div>
        </div>
      </div>
    );
  }

export default function PersonalDashboard(props: PersonalDashboardProps) {
  return <StandardPersonalDashboard {...props} />;
}
