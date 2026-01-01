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

import { BarChart3, TrendingUp, Vote, Users, Settings2, Zap, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useProfile, useProfileErrorStates, useProfileLoadingStates } from '@/features/profile/hooks/use-profile';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

import {
  usePollsActions,
  usePollsStore,
  useAnalyticsStore,
} from '@/lib/stores';
import type { AnalyticsEvent } from '@/lib/stores/analyticsStore';
import { useHashtagActions } from '@/lib/stores/hashtagStore';
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

// CRITICAL: Module-level stable empty array reference to prevent infinite loops
// This ensures the same reference is used across all component instances and renders
// When analytics events are empty, we must use this stable reference, not create new arrays
type RecentActivityItem = { type: 'vote' | 'poll_created'; event: unknown; createdAt: Date };
const EMPTY_ANALYTICS_ARRAY: AnalyticsEvent[] = [];
const EMPTY_RECENT_ACTIVITY_ARRAY: RecentActivityItem[] = [];

type PersonalDashboardProps = {
  userId?: string;
  className?: string;
};

/**
 * CRITICAL FIX: Use useShallow for all store subscriptions to prevent infinite loops
 * Without useShallow, store subscriptions create new object references every render
 */
function StandardPersonalDashboard({ userId: _fallbackUserId }: PersonalDashboardProps) {
  // CRITICAL: Guard client-only logic with isMounted (like feed/polls pages)
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // CRITICAL: Stable empty array reference to prevent infinite loops
  // Defined as module-level constant to ensure same reference across all renders and instances

  // CRITICAL FIX: Use useShallow for store subscription to prevent new object references
  // This was the root cause - without useShallow, this creates a new object every render
  const profilePreferencesRef = useRef<unknown>(null);

  const { preferences: profilePreferences, updatePreferences } = useProfileStore(
    useShallow((state) => ({
      preferences: state.preferences,
      updatePreferences: state.updatePreferences,
    })),
  );

  // Track store subscription changes (for ref update only, no logging needed)
  const preferencesChanged = profilePreferences !== profilePreferencesRef.current;
  if (preferencesChanged) {
    profilePreferencesRef.current = profilePreferences;
  }

  // CRITICAL FIX: Store actions in refs to prevent dependency issues (like feed/polls pages)
  const updatePreferencesRefForCallback = useRef(updatePreferences);
  useEffect(() => {
    updatePreferencesRefForCallback.current = updatePreferences;
  }, [updatePreferences]);

  // PHASE 4.1: Profile Hooks (incremental restoration)
  // Following established patterns: useShallow for store subscriptions, refs for actions
  const { profile: _profile } = useProfile();
  const { hasAnyError: _hasAnyError } = useProfileErrorStates(); // Phase 4.1: Added but not used yet
  const { isAnyUpdating: _isProfileUpdating } = useProfileLoadingStates(); // Phase 4.1: Added but not used yet

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
    loadPollsRef.current = loadPolls;
  }, [loadPolls]);

  useEffect(() => {
    getTrendingHashtagsRef.current = getTrendingHashtags;
  }, [getTrendingHashtags]);

  useEffect(() => {
    getUserRepresentativesRef.current = getUserRepresentatives;
  }, [getUserRepresentatives]);

  // Load polls on mount to ensure data is available
  useEffect(() => {
    if (isMounted && loadPollsRef.current) {
      loadPollsRef.current();
    }
  }, [isMounted]);

  // PHASE 4.3: Data Hooks - FIXED with useShallow pattern (like useFilteredPollCards)
  // CRITICAL: useShallow ensures stable object references - arrays come from stable object
  // Pattern matches useFilteredPollCards: useShallow for subscription, useMemo only if computation needed

  // Polls data - useShallow pattern (EXACTLY like useFilteredPollCards)
  // CRITICAL FIX: Only select data properties, NOT loading/error states
  // Loading/error states change frequently and cause unnecessary re-renders
  // Pattern matches useFilteredPollCards: select only data, access error separately if needed
  const pollsStoreData = usePollsStore(
    useShallow((state) => ({
      polls: state.polls,
      // Don't include isLoading, error, lastFetchedAt - these change frequently
      // Access error separately if needed (but prefer not subscribing to it)
    }))
  );
  const polls = pollsStoreData.polls; // useShallow ensures stable reference

  // Access error separately - use useShallow for consistency even for primitive values
  // CRITICAL: This selector runs independently and won't cause unnecessary re-renders of the main component
  // Note: For primitive values like strings, useShallow isn't strictly necessary, but it's consistent with our pattern
  const pollsError = usePollsStore((state) => state.error);

  // Analytics data - useShallow pattern (EXACTLY like useFilteredPollCards)
  // CRITICAL: Select object with events array inside, not array directly
  // This matches the proven pattern from useFilteredPollCards that prevents infinite loops
  // useShallow ensures stable object reference when underlying data hasn't changed
  // CRITICAL FIX: Only select events, not isLoading/error - those change frequently and cause unnecessary re-renders
  // CRITICAL FIX: Use stable reference check - if events array reference hasn't changed, return previous value
  // Analytics data - useShallow pattern (EXACTLY like useFilteredPollCards)
  // CRITICAL: Select object with events array inside, not array directly
  // This matches the proven pattern from useFilteredPollCards that prevents infinite loops
  // useShallow ensures stable object reference when underlying data hasn't changed
  // CRITICAL FIX: Only select events, not isLoading/error - those change frequently and cause unnecessary re-renders
  // CRITICAL FIX: Don't access store until mounted to prevent hydration mismatches
  // CRITICAL FIX: Wrap in try-catch to prevent errors from causing infinite loops
  const analyticsStoreData = useAnalyticsStore(
    useShallow((state) => {
      try {
        // CRITICAL: Only return events - don't include isLoading/error as they change on every API call
        // This prevents the selector from being called on every store update (e.g., when setError/setLoading is called)
        return { events: state.events ?? EMPTY_ANALYTICS_ARRAY };
      } catch (error) {
        // If store access fails, return empty array to prevent infinite loops
        console.error('Analytics store access error:', error);
        return { events: EMPTY_ANALYTICS_ARRAY };
      }
    })
  );

  // Normalize to stable empty array when empty (like useFilteredPollCards normalizes in useMemo)
  // CRITICAL: Wrap in try-catch to prevent errors from causing infinite loops
  const analyticsEvents = useMemo(() => {
    try {
      if (!isMounted) return EMPTY_ANALYTICS_ARRAY;
      if (!Array.isArray(analyticsStoreData?.events) || analyticsStoreData.events.length === 0) {
        return EMPTY_ANALYTICS_ARRAY;
      }
      return analyticsStoreData.events;
    } catch (error) {
      // If processing fails, return empty array to prevent infinite loops
      console.error('Analytics events processing error:', error);
      return EMPTY_ANALYTICS_ARRAY;
    }
  }, [isMounted, analyticsStoreData?.events]);

  // Hashtags data - useShallow pattern (not currently used, but keeping structure for future use)
  // const hashtagStoreData = useHashtagStore(...);

  // Representatives data - useShallow pattern
  const representativeStoreData = useRepresentativeStore(
    useShallow((state) => {
      return {
        entries: representativeSelectors.userRepresentativeEntries(state),
      };
    })
  );
  const representativeEntries = representativeStoreData.entries; // useShallow ensures stable reference

  // CRITICAL FIX: Extract preferences.dashboard with stable reference using useMemo
  // This prevents new object reference every render, which was causing infinite loops
  // The key is to memoize based on the actual nested values, not the parent object
  const dashboardPreferencesPrevRef = useRef<DashboardPreferences | null>(null);
  const dashboardPreferences = useMemo(() => {
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

    // CRITICAL: Using specific property dependencies instead of profilePreferences.dashboard
    // to prevent re-renders when the parent object reference changes but values haven't
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
  // Filter analytics events by type
  // CRITICAL: Defensive checks to prevent infinite loops when analytics API fails
  // CRITICAL FIX: Return stable empty array references, not new arrays
  const voteEvents = useMemo(() => {
    if (!isMounted || !Array.isArray(analyticsEvents) || analyticsEvents.length === 0) {
      return EMPTY_ANALYTICS_ARRAY; // Return stable reference, not new []
    }
    return analyticsEvents.filter((event) => {
      const eventType = (event as Record<string, unknown>)?.event_type as string | undefined;
      return eventType === 'poll_voted';
    });
  }, [isMounted, analyticsEvents]);

  const pollCreatedEvents = useMemo(() => {
    if (!isMounted || !Array.isArray(analyticsEvents) || analyticsEvents.length === 0) {
      return EMPTY_ANALYTICS_ARRAY; // Return stable reference, not new []
    }
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

  // Combined and sorted recent activity (for display)
  // CRITICAL FIX: Return stable empty array when no activities
  const recentActivity = useMemo((): RecentActivityItem[] => {
    if (!isMounted) return EMPTY_RECENT_ACTIVITY_ARRAY;

    // If both event arrays are empty (stable references), return stable empty array
    if (voteEvents === EMPTY_ANALYTICS_ARRAY && pollCreatedEvents === EMPTY_ANALYTICS_ARRAY) {
      return EMPTY_RECENT_ACTIVITY_ARRAY;
    }

    const activities: RecentActivityItem[] = [];

    voteEvents.forEach((event) => {
      const createdAt = (event as Record<string, unknown>)?.created_at as string | undefined;
      if (createdAt) {
        activities.push({ type: 'vote', event, createdAt: new Date(createdAt) });
      }
    });

    pollCreatedEvents.forEach((event) => {
      const createdAt = (event as Record<string, unknown>)?.created_at as string | undefined;
      if (createdAt) {
        activities.push({ type: 'poll_created', event, createdAt: new Date(createdAt) });
      }
    });

    // If no activities found, return stable empty array
    if (activities.length === 0) {
      return EMPTY_RECENT_ACTIVITY_ARRAY;
    }

    // Sort by date (most recent first)
    return activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 10);
  }, [isMounted, voteEvents, pollCreatedEvents]);

  // Handler for preference updates
  const handlePreferenceChange = useCallback(
    (key: keyof DashboardPreferences, value: boolean) => {
      if (!updatePreferencesRefForCallback.current) return;

      updatePreferencesRefForCallback.current({
        dashboard: {
          ...dashboardPreferences,
          [key]: value,
        },
      }).catch((error) => {
        console.error('Failed to update preference:', error);
      });
    },
    [dashboardPreferences]
  );

  // PHASE 6: Complete Dashboard UI
    return (
    <div className="space-y-6" data-testid='personal-dashboard'>
      {/* Header - Enhanced with better visual hierarchy */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Dashboard
          </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your civic engagement overview and activity
        </p>
        </div>

      {/* Error Handling UI - Show when API calls fail */}
      {isMounted && pollsError && (
        <Card
          className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800"
          role="alert"
          aria-live="polite"
          data-testid="error-boundary"
        >
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900 dark:text-red-200 mb-1">
                  Unable to load data
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                  {typeof pollsError === 'string'
                    ? pollsError
                    : 'Error: Failed to load dashboard data. Please check your connection and try again.'}
                </p>
          <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (loadPollsRef.current) {
                      loadPollsRef.current();
                    }
                  }}
                  className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
          </Button>
        </div>
      </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Metrics Cards - Improved UX with graceful error handling */}
      {dashboardPreferences?.showEngagementScore && isMounted && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="region" aria-label="Engagement metrics">
          <Card className="hover:shadow-lg transition-all duration-200 border-gray-200 dark:border-gray-700" role="article" aria-label="Votes in the last 30 days">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Votes (30 days)
                  </CardTitle>
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <Vote className="h-5 w-5 text-blue-500 dark:text-blue-400" aria-hidden="true" />
                </div>
              </div>
                </CardHeader>
                <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100" aria-live="polite">
                {numberFormatter ? numberFormatter.format(votesLast30Days) : votesLast30Days}
                      </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Total votes cast this month
              </p>
                </CardContent>
              </Card>

          <Card className="hover:shadow-lg transition-all duration-200 border-gray-200 dark:border-gray-700" role="article" aria-label="Polls created in the last 30 days">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Polls Created (30 days)
                    </CardTitle>
                <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <BarChart3 className="h-5 w-5 text-green-500 dark:text-green-400" aria-hidden="true" />
                </div>
              </div>
                  </CardHeader>
                  <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100" aria-live="polite">
                {numberFormatter ? numberFormatter.format(pollsCreatedLast30Days) : pollsCreatedLast30Days}
                      </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Polls you&apos;ve created
              </p>
                  </CardContent>
                </Card>

          <Card className="hover:shadow-lg transition-all duration-200 border-gray-200 dark:border-gray-700" role="article" aria-label="Total polls available">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Polls
                  </CardTitle>
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <TrendingUp className="h-5 w-5 text-purple-500 dark:text-purple-400" aria-hidden="true" />
                </div>
              </div>
                </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100" aria-live="polite">
                {numberFormatter ? numberFormatter.format(polls?.length ?? 0) : (polls?.length ?? 0)}
                    </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                All available polls
              </p>
                </CardContent>
              </Card>
            </div>
      )}

      {/* Quick Actions Section */}
      {dashboardPreferences?.showQuickActions && isMounted && (
                <Card role="region" aria-label="Quick actions">
                  <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500 dark:text-yellow-400" aria-hidden="true" />
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            </div>
            <CardDescription>Fast access to common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Link href="/polls/create">
                <Button variant="outline" className="w-full justify-between group">
                  <span>Create Poll</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
              </Link>
              <Link href="/polls">
                <Button variant="outline" className="w-full justify-between group">
                  <span>Browse Polls</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/representatives">
                <Button variant="outline" className="w-full justify-between group">
                  <span>Find Representatives</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
                  </CardContent>
                </Card>
              )}

      {/* Recent Activity Section - Improved UX */}
      {dashboardPreferences?.showRecentActivity && isMounted && (
        <Card role="region" aria-label="Recent activity">
                  <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            <CardDescription>Your latest civic engagement actions</CardDescription>
                  </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                  <Vote className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  No recent activity
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Start voting or creating polls to see your activity here
                </p>
                <Link href="/polls">
                  <Button variant="outline" size="sm">
                    Browse Polls
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                        </div>
                      ) : (
              <div className="space-y-2" role="list" aria-label="Recent activity items">
                {recentActivity.map((activity, index) => {
                  const pollId = (activity.event as Record<string, unknown>)?.poll_id as string | undefined;
                  return (
                    <div
                      key={`activity-${activity.type}-${pollId ?? index}-${activity.createdAt.getTime()}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                      role="listitem"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            activity.type === 'vote' ? 'bg-blue-500 dark:bg-blue-400' : 'bg-green-500 dark:bg-green-400'
                          }`}
                          aria-hidden="true"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 block truncate">
                            {activity.type === 'vote' ? 'Voted on a poll' : 'Created a poll'}
                          </span>
                          {dateFormatter && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {dateFormatter.format(activity.createdAt)}
                            </p>
                      )}
                    </div>
                      </div>
                      </div>
                  );
                })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

      {/* Representatives Section - Improved UX */}
      {dashboardPreferences?.showElectedOfficials && isMounted && representativeEntries && representativeEntries.length > 0 && (
        <Card role="region" aria-label="Your representatives">
                  <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500 dark:text-indigo-400" aria-hidden="true" />
              <CardTitle className="text-lg font-semibold">Your Representatives</CardTitle>
            </div>
                    <CardDescription>
              {numberFormatter ? numberFormatter.format(representativeEntries.length) : representativeEntries.length}
              {' '}representative{representativeEntries.length !== 1 ? 's' : ''} you&apos;re following
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {representativeEntries.slice(0, 6).map((entry) => {
                const rep = entry.representative;
                const name = (rep as Record<string, unknown>)?.name as string | undefined;
                const office = (rep as Record<string, unknown>)?.office as string | undefined;
                const photoUrl = (rep as Record<string, unknown>)?.primary_photo_url as string | undefined;
                const party = (rep as Record<string, unknown>)?.party as string | undefined;
                const repId = (rep as Record<string, unknown>)?.id as number | undefined;

                return (
                  <Link
                    key={`rep-${repId ?? entry.follow.id}`}
                    href={repId ? `/representatives/${repId}` : '#'}
                    className="block"
                  >
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all bg-white dark:bg-gray-800">
                      {photoUrl ? (
                        <Image
                          src={photoUrl}
                          alt={name ?? 'Representative'}
                          width={48}
                          height={48}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                          <span className="text-indigo-600 dark:text-indigo-300 font-medium text-sm">
                            {name?.split(' ').map((n) => n[0]).join('').slice(0, 2) ?? '?'}
                          </span>
                    </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {name ?? 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {office ?? 'Representative'}
                        </p>
                        {party && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                            {party}
                          </p>
                        )}
                        </div>
                        </div>
                  </Link>
                );
              })}
                      </div>
            {representativeEntries.length > 6 && (
              <div className="mt-4 text-center">
                <Link href="/representatives">
                  <Button variant="outline" className="w-full sm:w-auto">
                    View All Representatives
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                    </div>
            )}
                </CardContent>
              </Card>
      )}

      {/* Dashboard Preferences Section - Improved UX */}
      {isMounted && (
            <Card role="region" aria-label="Dashboard preferences">
              <CardHeader>
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
              <CardTitle className="text-lg font-semibold">Dashboard Preferences</CardTitle>
            </div>
            <CardDescription>Customize what appears on your dashboard</CardDescription>
              </CardHeader>
              <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="show-engagement-score" className="text-base font-medium cursor-pointer">
                    Engagement Score
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Show analytics metrics and engagement statistics
                  </p>
                        </div>
                <Switch
                  id="show-engagement-score"
                  data-testid="show-engagement-score-toggle"
                  checked={dashboardPreferences?.showEngagementScore ?? true}
                  onCheckedChange={(checked) => handlePreferenceChange('showEngagementScore', checked)}
                />
                        </div>

              <Separator />

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="show-recent-activity" className="text-base font-medium cursor-pointer">
                    Recent Activity
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Display your recent votes and poll creations
                  </p>
                      </div>
                <Switch
                  id="show-recent-activity"
                  data-testid="show-recent-activity-toggle"
                  checked={dashboardPreferences?.showRecentActivity ?? true}
                  onCheckedChange={(checked) => handlePreferenceChange('showRecentActivity', checked)}
                />
                    </div>

              <Separator />

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="show-quick-actions" className="text-base font-medium cursor-pointer">
                    Quick Actions
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Show quick access buttons for common tasks
                  </p>
                        </div>
                <Switch
                  id="show-quick-actions"
                  data-testid="show-quick-actions-toggle"
                  checked={dashboardPreferences?.showQuickActions ?? true}
                  onCheckedChange={(checked) => handlePreferenceChange('showQuickActions', checked)}
                />
                        </div>

              <Separator />

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="show-elected-officials" className="text-base font-medium cursor-pointer">
                    Elected Officials
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Display representatives you&apos;re following
                  </p>
                      </div>
                <Switch
                  id="show-elected-officials"
                  data-testid="show-elected-officials-toggle"
                  checked={dashboardPreferences?.showElectedOfficials ?? false}
                  onCheckedChange={(checked) => handlePreferenceChange('showElectedOfficials', checked)}
                />
                    </div>
                </div>
              </CardContent>
            </Card>
          )}

    </div>
  );
  }

export default function PersonalDashboard(props: PersonalDashboardProps) {
  return <StandardPersonalDashboard {...props} />;
}
