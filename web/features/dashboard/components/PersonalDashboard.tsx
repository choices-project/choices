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

import {
  Activity,
  Award,
  BarChart3,
  Clock,
  Download,
  Flame,
  MapPin,
  Plus,
  RefreshCw,
  Settings,
  Shield,
  Target,
  Vote,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { FeatureWrapper } from '@/components/shared/FeatureWrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RepresentativeCard } from '@/components/representative/RepresentativeCard';
import { TrendingHashtagDisplay } from '@/features/hashtags/components/HashtagDisplay';
import { useProfile, useProfileErrorStates, useProfileLoadingStates } from '@/features/profile/hooks/use-profile';
import {
  useAnalyticsBehavior,
  useAnalyticsError,
  useAnalyticsEvents,
  useAnalyticsLoading,
  useHashtagActions,
  useHashtagError,
  useHashtagLoading,
  useIsAuthenticated,
  usePollLastFetchedAt,
  usePolls,
  usePollsAnalytics,
  usePollsError,
  usePollsLoading,
  usePollsStore,
  useTrendingHashtags,
  useUserLoading,
} from '@/lib/stores';
import { useProfileStore } from '@/lib/stores/profileStore';
import type { Poll } from '@/features/polls/types';
import type { PersonalAnalytics } from '@/types/features/dashboard';
import type { DashboardPreferences, ProfilePreferences } from '@/types/profile';
import { logger } from '@/lib/utils/logger';

import {
  useGetUserRepresentatives,
  useRepresentativeError,
  useRepresentativeGlobalLoading,
  useUserRepresentativeEntries,
} from '@/lib/stores/representativeStore';

const DEFAULT_DASHBOARD_PREFERENCES: DashboardPreferences = {
  showElectedOfficials: false,
  showQuickActions: true,
  showRecentActivity: true,
  showEngagementScore: true,
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type PersonalDashboardProps = {
  userId?: string;
  className?: string;
};

const resolvePollTitle = (poll: Poll): string => {
  const record = poll as Record<string, unknown>;
  if (typeof record.title === 'string' && record.title.trim().length > 0) {
    return record.title;
  }
  if (typeof record.question === 'string' && record.question.trim().length > 0) {
    return record.question;
  }
  if (typeof record.name === 'string' && record.name.trim().length > 0) {
    return record.name;
  }
  return 'Untitled poll';
};

const resolvePollVotes = (poll: Poll): number => {
  const record = poll as Record<string, unknown>;
  if (typeof poll.total_votes === 'number') {
    return poll.total_votes;
  }
  if (typeof record.totalVotes === 'number') {
    return record.totalVotes as number;
  }
  return 0;
};

export default function PersonalDashboard({ userId: fallbackUserId, className = '' }: PersonalDashboardProps) {
  const router = useRouter();
  const {
    profile,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useProfile();
  const { isAnyUpdating } = useProfileLoadingStates();
  const { hasAnyError } = useProfileErrorStates();

  const isAuthenticated = useIsAuthenticated();
  const isUserLoading = useUserLoading();

  const displayName = useProfileStore((state) => state.getDisplayName());
  const profilePreferences = useProfileStore((state) => state.preferences);
  const updatePreferences = useProfileStore((state) => state.updatePreferences);

  const polls = usePolls();
  const pollsAnalytics = usePollsAnalytics();
  const isPollsLoading = usePollsLoading();
  const pollsError = usePollsError();
  const loadPolls = usePollsStore((state) => state.loadPolls);
  const lastPollsFetchedAt = usePollLastFetchedAt();

  const analyticsEvents = useAnalyticsEvents();
  const userBehavior = useAnalyticsBehavior();
  const analyticsError = useAnalyticsError();
  const analyticsLoading = useAnalyticsLoading();

  const trendingHashtags = useTrendingHashtags();
  const hashtagLoading = useHashtagLoading().isLoading;
  const hashtagError = useHashtagError().error;
  const { getTrendingHashtags } = useHashtagActions();

  const [selectedTab, setSelectedTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasRequestedTrending = useRef(false);
  const hasRequestedRepresentatives = useRef(false);

  const representativeEntries = useUserRepresentativeEntries();
  const representativeLoading = useRepresentativeGlobalLoading();
  const representativeError = useRepresentativeError();
  const getUserRepresentatives = useGetUserRepresentatives();

  const resolvedDashboardPreferences = useMemo(() => {
    const stored = profilePreferences?.dashboard;
    return {
      showElectedOfficials: stored?.showElectedOfficials ?? DEFAULT_DASHBOARD_PREFERENCES.showElectedOfficials,
      showQuickActions: stored?.showQuickActions ?? DEFAULT_DASHBOARD_PREFERENCES.showQuickActions,
      showRecentActivity: stored?.showRecentActivity ?? DEFAULT_DASHBOARD_PREFERENCES.showRecentActivity,
      showEngagementScore: stored?.showEngagementScore ?? DEFAULT_DASHBOARD_PREFERENCES.showEngagementScore,
    } satisfies DashboardPreferences;
  }, [profilePreferences]);

  const [preferences, setPreferences] = useState<DashboardPreferences>(resolvedDashboardPreferences);
  const preferencesRef = useRef(resolvedDashboardPreferences);

  useEffect(() => {
    setPreferences(resolvedDashboardPreferences);
    preferencesRef.current = resolvedDashboardPreferences;
  }, [resolvedDashboardPreferences]);

  useEffect(() => {
    if (!isAuthenticated || hasRequestedTrending.current) {
      return;
    }
    hasRequestedTrending.current = true;
    void getTrendingHashtags(undefined, 6);
  }, [getTrendingHashtags, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || isUserLoading) {
      return;
    }
    if (hasRequestedRepresentatives.current) {
      return;
    }
    hasRequestedRepresentatives.current = true;
    void getUserRepresentatives();
  }, [getUserRepresentatives, isAuthenticated, isUserLoading]);

  useEffect(() => {
    if (!isUserLoading && !isAuthenticated) {
      router.replace('/auth?redirectTo=/dashboard');
    }
  }, [isAuthenticated, isUserLoading, router]);

  useEffect(() => {
    if (!isAuthenticated || lastPollsFetchedAt) {
      return;
    }
    loadPolls().catch((error) => {
      logger.error('Failed to load polls for dashboard', error as Error);
    });
  }, [isAuthenticated, lastPollsFetchedAt, loadPolls]);

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

  const userPolls = useMemo(() => {
    if (!userProfileId) {
      return [] as Poll[];
    }
    return polls.filter((poll) => {
      const record = poll as Record<string, unknown>;
      const createdBy = record.created_by ?? record.createdBy;
      return typeof createdBy === 'string' && createdBy === userProfileId;
    });
  }, [polls, userProfileId]);

  const sortedUserPolls = useMemo(() => {
    return [...userPolls].sort((a, b) => {
      const dateA = new Date((a as Record<string, unknown>).created_at as string ?? 0).getTime();
      const dateB = new Date((b as Record<string, unknown>).created_at as string ?? 0).getTime();
      return dateB - dateA;
    });
  }, [userPolls]);

  const voteEvents = useMemo(
    () => analyticsEvents.filter((event) => event.event_type === 'poll_voted'),
    [analyticsEvents],
  );

  const pollCreatedEvents = useMemo(
    () => analyticsEvents.filter((event) => event.event_type === 'poll_created'),
    [analyticsEvents],
  );

  const thirtyDaysAgo = useMemo(() => Date.now() - THIRTY_DAYS_MS, []);

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
        return {
          id: event.id,
          poll_id: typeof pollIdRaw === 'number' ? String(pollIdRaw) : (pollIdRaw ?? 'unknown'),
          created_at: event.created_at ?? event.timestamp ?? new Date().toISOString(),
        };
      });
  }, [voteEvents]);

  const recentPolls = useMemo<PersonalAnalytics['recent_polls']>(() => {
    return sortedUserPolls.slice(0, 2).map((poll) => {
      const record = poll as Record<string, unknown>;
      return {
        id: String(record.id ?? record.poll_id ?? crypto.randomUUID()),
        title: resolvePollTitle(poll),
        created_at: (record.created_at as string) ?? new Date().toISOString(),
        total_votes: resolvePollVotes(poll),
        status: (record.status as string) ?? 'draft',
      };
    });
  }, [sortedUserPolls]);

  const totalVotesOnUserPolls = useMemo(
    () => userPolls.reduce((sum, poll) => sum + resolvePollVotes(poll), 0),
    [userPolls],
  );

  const participationScore = useMemo(() => {
    const behaviorScore = userBehavior?.engagementScore ?? 0;
    const derivedScore = voteEvents.length * 5 + pollCreatedEvents.length * 10;
    return Math.min(100, Math.max(behaviorScore, derivedScore));
  }, [pollCreatedEvents.length, userBehavior?.engagementScore, voteEvents.length]);

  const analytics: PersonalAnalytics = useMemo(() => {
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

  const preferencesRefresher = useCallback(
    async (updates: Partial<DashboardPreferences>) => {
      const nextPreferences: DashboardPreferences = {
        ...preferencesRef.current,
        ...updates,
      };
      setPreferences(nextPreferences);
      preferencesRef.current = nextPreferences;

      try {
        await updatePreferences({
          dashboard: nextPreferences,
        } as Partial<ProfilePreferences>);
      } catch (error) {
        logger.error('Error saving dashboard preferences', error as Error);
      }
    },
    [updatePreferences],
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchProfile(),
        loadPolls(),
        getTrendingHashtags(undefined, 6),
        getUserRepresentatives(),
      ]);
    } catch (error) {
      logger.error('Error refreshing dashboard', error as Error);
    } finally {
      setIsRefreshing(false);
    }
  }, [getTrendingHashtags, getUserRepresentatives, loadPolls, refetchProfile]);

  const effectiveDisplayName =
    (displayName && displayName !== 'User' ? displayName : undefined) ??
    ((profileRecord?.display_name as string | undefined) ??
      (profileRecord?.fullName as string | undefined) ??
      (profileRecord?.username as string | undefined));

  const dashboardTitle = effectiveDisplayName
    ? `Welcome back, ${effectiveDisplayName}`
    : 'Your Dashboard';

  const dashboardSubtitle = profileRecord?.bio
    ? "Here's a snapshot of your civic activity."
    : 'Your personal civic engagement hub';

  const isLoading =
    isUserLoading || profileLoading || isPollsLoading || analyticsLoading;

  const errorMessage =
    profileError ??
    pollsError ??
    analyticsError ??
    representativeError ??
    (hasAnyError ? 'Something went wrong while loading your dashboard.' : null);

  const quickActions = useMemo(
    () => [
      {
        id: 'create-poll',
        label: 'Create Poll',
        icon: Plus,
        href: '/polls/create',
        description: 'Start a new poll',
      },
      {
        id: 'update-profile',
        label: 'Update Profile',
        icon: Settings,
        href: '/profile/edit',
        description: 'Edit your profile',
      },
      {
        id: 'privacy-settings',
        label: 'Privacy & Data',
        icon: Shield,
        href: '/account/privacy',
        description: 'Manage your privacy',
      },
      {
        id: 'set-location',
        label: 'Set Location',
        icon: MapPin,
        href: '/profile/preferences',
        description: 'Update your location',
      },
      {
        id: 'export-data',
        label: 'Export Data',
        icon: Download,
        href: '/account/privacy',
        description: 'Download your data',
      },
    ],
    [],
  );

  const representatives = useMemo(
    () => representativeEntries.map((entry) => entry.representative),
    [representativeEntries],
  );

  const visibleRepresentatives = useMemo(() => representatives.slice(0, 3), [representatives]);

  if (!isAuthenticated && !isUserLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className='space-y-4 p-6 text-center'>
            <h3 className='text-xl font-semibold text-gray-900'>Sign in to your account</h3>
            <p className='text-gray-600'>You need to be signed in to access your personal dashboard.</p>
            <Button variant='default' onClick={() => router.push('/auth')}>
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          <div className='space-y-6 lg:col-span-2'>
            <Skeleton className='h-32 w-full' />
            <Skeleton className='h-48 w-full' />
          </div>
          <div className='space-y-6'>
            <Skeleton className='h-32 w-full' />
            <Skeleton className='h-48 w-full' />
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className='space-y-4 p-6 text-center'>
            <div className='mx-auto mb-2 text-red-500'>
              <Activity className='h-12 w-12' />
            </div>
            <h3 className='text-lg font-semibold'>Error Loading Dashboard</h3>
            <p className='text-gray-600'>{errorMessage}</p>
            <Button onClick={handleRefresh}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { showQuickActions, showElectedOfficials, showRecentActivity, showEngagementScore } = preferences;

  return (
    <div className={`space-y-6 ${className}`} data-testid='personal-dashboard'>
      <div className='flex items-center justify-between' data-testid='dashboard-header'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900' data-testid='dashboard-title'>
            {dashboardTitle}
          </h1>
          <p className='mt-1 text-gray-600'>{dashboardSubtitle}</p>
        </div>
        <div className='flex items-center gap-3'>
          <Button
            variant='outline'
            size='sm'
            onClick={handleRefresh}
            disabled={isRefreshing || isAnyUpdating}
            className='flex items-center gap-2'
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Badge variant='outline' className='flex items-center gap-2' data-testid='participation-score'>
            <Activity className='h-4 w-4' />
            {analytics.participation_score} Engagement Score
          </Badge>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className='space-y-6'>
        <TabsList className='grid w-full grid-cols-2' data-testid='dashboard-nav'>
          <TabsTrigger value='overview' data-testid='overview-tab'>
            Overview
          </TabsTrigger>
          <TabsTrigger value='analytics' data-testid='analytics-tab'>
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-6'>
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
            <div className='space-y-6 lg:col-span-2'>
              <Card data-testid='personal-analytics'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <BarChart3 className='h-5 w-5' />
                    Personal Analytics
                  </CardTitle>
                  <CardDescription>Your civic engagement metrics and activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-blue-600'>{analytics.total_votes}</div>
                      <div className='text-sm text-gray-600'>Total Votes</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-green-600'>
                        {analytics.total_polls_created}
                      </div>
                      <div className='text-sm text-gray-600'>Polls Created</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-purple-600'>{analytics.active_polls}</div>
                      <div className='text-sm text-gray-600'>Active Polls</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-orange-600'>
                        {analytics.total_votes_on_user_polls}
                      </div>
                      <div className='text-sm text-gray-600'>Poll Votes</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {showEngagementScore && (
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Award className='h-5 w-5' />
                      Engagement Score
                    </CardTitle>
                    <CardDescription>Your overall civic participation level</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm font-medium'>Participation Level</span>
                        <span className='text-sm text-gray-600'>{analytics.participation_score}/100</span>
                      </div>
                      <Progress value={analytics.participation_score} className='h-2' />
                      <div className='text-xs text-gray-500'>
                        Based on your voting activity, poll creation, and engagement
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card data-testid='trending-polls-section'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Flame className='h-5 w-5 text-orange-500' />
                    Trending Topics
                  </CardTitle>
                  <CardDescription>What the community is discussing right now</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {hashtagError && (
                    <div className='rounded-md border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700'>
                      {hashtagError}
                    </div>
                  )}

                  {hashtagLoading && trendingHashtags.length === 0 ? (
                    <div className='space-y-3'>
                      <Skeleton className='h-16 w-full' />
                      <Skeleton className='h-16 w-full' />
                      <Skeleton className='h-16 w-full' />
                    </div>
                  ) : trendingHashtags.length > 0 ? (
                    <TrendingHashtagDisplay
                      trendingHashtags={trendingHashtags}
                      showGrowth
                      maxDisplay={4}
                      onHashtagClick={(hashtag) => router.push(`/hashtags/${hashtag.name}`)}
                    />
                  ) : (
                    <div className='rounded-md border border-dashed border-gray-200 p-4 text-sm text-gray-600'>
                      No trending topics yet. Check back soon or explore the feed to discover new conversations.
                    </div>
                  )}

                  <div className='flex items-center gap-2'>
                    <Button variant='outline' className='flex-1' onClick={() => router.push('/feed')}>
                      View Trending Feed
                    </Button>
                    <Button
                      variant='ghost'
                      onClick={() => getTrendingHashtags(undefined, 6)}
                      disabled={hashtagLoading}
                    >
                      Refresh
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className='space-y-6'>
              {showQuickActions && (
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Target className='h-5 w-5' />
                      Quick Actions
                    </CardTitle>
                    <CardDescription>Common tasks and shortcuts</CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    {quickActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <Button
                          key={action.id}
                          variant='outline'
                          className='h-auto w-full justify-start p-3'
                          onClick={() => router.push(action.href)}
                        >
                          <Icon className='mr-3 h-4 w-4' />
                          <div className='text-left'>
                            <div className='font-medium'>{action.label}</div>
                            <div className='text-xs text-gray-500'>{action.description}</div>
                          </div>
                        </Button>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {showElectedOfficials && (
                <Card data-testid='representatives-card'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <MapPin className='h-5 w-5' />
                      Your Representatives
                    </CardTitle>
                    <CardDescription>
                      Updates from officials connected to your address
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    {representativeLoading && visibleRepresentatives.length === 0 ? (
                      <div className='space-y-3' data-testid='representatives-loading'>
                        <Skeleton className='h-20 w-full rounded-lg' />
                        <Skeleton className='h-20 w-full rounded-lg' />
                        <Skeleton className='h-10 w-32' />
                      </div>
                    ) : visibleRepresentatives.length > 0 ? (
                      <div className='space-y-3'>
                        {visibleRepresentatives.map((representative) => (
                          <RepresentativeCard
                            key={representative.id}
                            representative={representative}
                            showActions={false}
                            showDetails={false}
                            className='border border-gray-100 hover:shadow-sm'
                            onClick={() => router.push(`/representatives/${representative.id}`)}
                          />
                        ))}
                        {representatives.length > visibleRepresentatives.length && (
                          <Button
                            variant='outline'
                            size='sm'
                            className='w-full'
                            onClick={() => router.push('/representatives/my')}
                          >
                            View all representatives
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className='space-y-3 text-sm text-gray-600'>
                        <p>No representatives found for your saved address.</p>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => router.push('/profile/preferences')}
                        >
                          Update your address
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <FeatureWrapper feature='DEMOGRAPHIC_FILTERING'>
                <Card data-testid='personalized-content-section'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <MapPin className='h-5 w-5' />
                      Personalized Content
                    </CardTitle>
                    <CardDescription>
                      Content tailored to your location and demographics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      <div className='text-sm text-gray-600'>
                        Demographic filtering is enabled! Your content will be personalized based on your
                        location and interests.
                      </div>
                      <Button variant='outline' className='w-full' onClick={() => router.push('/profile')}>
                        Update Your Preferences
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </FeatureWrapper>

              <Card data-testid='dashboard-settings'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2' data-testid='settings-title'>
                    <Settings className='h-5 w-5' />
                    Dashboard Settings
                  </CardTitle>
                  <CardDescription>Customize what you see on your dashboard</CardDescription>
                </CardHeader>
                <CardContent data-testid='settings-content'>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <div className='font-medium'>Show Quick Actions</div>
                        <div className='text-sm text-gray-600'>Display quick action buttons</div>
                      </div>
                      <input
                        type='checkbox'
                        checked={showQuickActions}
                        onChange={(event) =>
                          preferencesRefresher({ showQuickActions: event.target.checked })
                        }
                        className='rounded'
                        data-testid='show-quick-actions-toggle'
                      />
                    </div>
                    <div className='flex items-center justify-between'>
                      <div>
                        <div className='font-medium'>Show Elected Officials</div>
                        <div className='text-sm text-gray-600'>Display your representatives</div>
                      </div>
                      <input
                        type='checkbox'
                        checked={showElectedOfficials}
                        onChange={(event) =>
                          preferencesRefresher({ showElectedOfficials: event.target.checked })
                        }
                        className='rounded'
                        data-testid='show-elected-officials-toggle'
                      />
                    </div>
                    <div className='flex items-center justify-between'>
                      <div>
                        <div className='font-medium'>Show Recent Activity</div>
                        <div className='text-sm text-gray-600'>Display your recent actions</div>
                      </div>
                      <input
                        type='checkbox'
                        checked={showRecentActivity}
                        onChange={(event) =>
                          preferencesRefresher({ showRecentActivity: event.target.checked })
                        }
                        className='rounded'
                        data-testid='show-recent-activity-toggle'
                      />
                    </div>
                    <div className='flex items-center justify-between'>
                      <div>
                        <div className='font-medium'>Show Engagement Score</div>
                        <div className='text-sm text-gray-600'>Display your participation level</div>
                      </div>
                      <input
                        type='checkbox'
                        checked={showEngagementScore}
                        onChange={(event) =>
                          preferencesRefresher({ showEngagementScore: event.target.checked })
                        }
                        className='rounded'
                        data-testid='show-engagement-score-toggle'
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {showRecentActivity && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Clock className='h-5 w-5' />
                  Recent Activity
                </CardTitle>
                <CardDescription>Your latest civic engagement actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {analytics.recent_votes.map((vote) => (
                    <div key={vote.id} className='flex items-center gap-3 rounded-lg bg-gray-50 p-3'>
                      <Vote className='h-4 w-4 text-blue-600' />
                      <div className='flex-1'>
                        <div className='text-sm font-medium'>Voted on poll</div>
                        <div className='text-xs text-gray-500'>
                          {new Date(vote.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {analytics.recent_polls.map((poll) => (
                    <div key={poll.id} className='flex items-center gap-3 rounded-lg bg-gray-50 p-3'>
                      <Plus className='h-4 w-4 text-green-600' />
                      <div className='flex-1'>
                        <div className='text-sm font-medium'>Created: {poll.title}</div>
                        <div className='text-xs text-gray-500'>
                          {poll.total_votes} votes • {new Date(poll.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value='analytics' className='space-y-6'>
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
            <div className='space-y-6 lg:col-span-2'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <BarChart3 className='h-5 w-5' />
                    Detailed Analytics
                  </CardTitle>
                  <CardDescription>Comprehensive analytics and insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
                    <div className='text-center' data-testid='total-votes'>
                      <div className='text-2xl font-bold text-blue-600'>{analytics.total_votes}</div>
                      <div className='text-sm text-gray-600'>Total Votes</div>
                    </div>
                    <div className='text-center' data-testid='polls-created'>
                      <div className='text-2xl font-bold text-green-600'>
                        {analytics.total_polls_created}
                      </div>
                      <div className='text-sm text-gray-600'>Polls Created</div>
                    </div>
                    <div className='text-center' data-testid='active-polls'>
                      <div className='text-2xl font-bold text-purple-600'>{analytics.active_polls}</div>
                      <div className='text-sm text-gray-600'>Active Polls</div>
                    </div>
                    <div className='text-center' data-testid='votes-on-user-polls'>
                      <div className='text-2xl font-bold text-orange-600'>
                        {analytics.total_votes_on_user_polls}
                      </div>
                      <div className='text-sm text-gray-600'>Votes on Your Polls</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
