/**
 * Lazy-loaded Admin Dashboard Component
 *
 * This component is loaded only when needed to reduce initial bundle size.
 * Includes comprehensive admin functionality with performance monitoring.
 */

import {
  Bell,
  Activity,
  TrendingUp,
  Share2,
  Sparkles,
  Target,
  Award,
  Flame,
} from 'lucide-react';
import React, { Suspense, useEffect, useState } from 'react';

import { createLazyComponent } from '@/lib/performance/lazy-loading';
import { performanceMetrics } from '@/lib/performance/performance-metrics';
import {
  useAdminActiveTab,
  useAdminDashboardStats,
  useAdminDashboardActions,
  useAdminLoading,
  useAdminError,
  useAdminStats,
  useAdminNotifications,
  useTrendingTopics,
  useRecentActivity,
} from '@/lib/stores';
import {
  useHashtagActions,
  useHashtagError,
  useHashtagLoading,
  useTrendingHashtags,
} from '@/lib/stores';
import { useFeedsActions, useFeeds, useFeedsLoading, useFeedsError } from '@/lib/stores/feedsStore';
import { TrendingHashtagDisplay } from '@/features/hashtags/components/HashtagDisplay';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';


// Lazy load heavy admin components
const UserManagement = createLazyComponent(
  () => import('./UserManagement'),
  {
    fallback: <div className="p-4 bg-gray-100 rounded-lg animate-pulse">Loading user management...</div>,
    onLoad: () => performanceMetrics.addMetric('admin-user-management-loaded', 1),
  }
);

const AnalyticsPanel = createLazyComponent(
  () => import('./AnalyticsPanel'),
  {
    fallback: <div className="p-4 bg-gray-100 rounded-lg animate-pulse">Loading analytics...</div>,
    onLoad: () => performanceMetrics.addMetric('admin-analytics-loaded', 1),
  }
);

const SystemSettings = createLazyComponent(
  () => import('./SystemSettings'),
  {
    fallback: <div className="p-4 bg-gray-100 rounded-lg animate-pulse">Loading system settings...</div>,
    onLoad: () => performanceMetrics.addMetric('admin-system-settings-loaded', 1),
  }
);

const AuditLogs = createLazyComponent(
  () => import('./AuditLogs'),
  {
    fallback: <div className="p-4 bg-gray-100 rounded-lg animate-pulse">Loading audit logs...</div>,
    onLoad: () => performanceMetrics.addMetric('admin-audit-logs-loaded', 1),
  }
);

type AdminDashboardProps = {
  user: {
    id: string;
    email: string;
    role: 'admin' | 'moderator' | 'user';
  };
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  // Get state from adminStore
  const activeTab = useAdminActiveTab();
  const stats = useAdminDashboardStats();
  const loading = useAdminLoading();
  const error = useAdminError();
  const adminStats = useAdminStats();
  const notifications = useAdminNotifications();
  const trendingTopics = useTrendingTopics();
  const recentActivity = useRecentActivity();
  const { setActiveTab, loadDashboardStats } = useAdminDashboardActions();
  const trendingHashtags = useTrendingHashtags();
  const { isLoading: hashtagLoading } = useHashtagLoading();
  const { error: hashtagError } = useHashtagError();
  const { getTrendingHashtags } = useHashtagActions();
  const [hasLoadedTrendingHashtags, setHasLoadedTrendingHashtags] = useState(false);

  const unreadNotifications = adminStats.unreadNotifications ?? 0;
  const firstUnreadNotification = notifications.find((notification) => !notification.read);
  const topTrendingTopic = trendingTopics?.[0];
  const latestActivity = recentActivity?.[0];
  const systemHealthStatus = stats?.systemHealth ?? 'healthy';

  const totalUsers = stats?.totalUsers ?? 0;
  const activePollsCount = stats?.activePolls ?? 0;
  const totalVotesCount = stats?.totalVotes ?? 0;
  const pollsCreatedLast7Days = stats?.pollsCreatedLast7Days ?? 0;
  const pollsCreatedToday = stats?.pollsCreatedToday ?? 0;
  const milestoneAlertsLast7Days = stats?.milestoneAlertsLast7Days ?? 0;
  const shareActionsLast24h = stats?.shareActionsLast24h ?? 0;
  const topShareChannel = stats?.topShareChannel ?? null;
  const latestMilestone = stats?.latestMilestone ?? null;

  const formatShareChannel = (channel: string) => {
    const normalized = channel.toLowerCase();
    if (normalized === 'x' || normalized === 'share_x') return 'X / Twitter';
    if (normalized === 'copy_link' || normalized === 'detail_copy_link') return 'Copied link';
    if (normalized === 'email_link' || normalized === 'email') return 'Email';
    if (normalized === 'share_modal_opened') return 'Share modal';
    return channel.replace(/_/g, ' ');
  };

  const shareSummary =
    shareActionsLast24h > 0 && topShareChannel
      ? `${formatShareChannel(topShareChannel.channel)} is leading with ${topShareChannel.count} share action${
          topShareChannel.count === 1 ? '' : 's'
        } in the last 24 hours.`
      : 'Share activity is quiet in the last day.';

  const milestoneSummary =
    milestoneAlertsLast7Days > 0
      ? `${milestoneAlertsLast7Days} milestone alert${milestoneAlertsLast7Days === 1 ? '' : 's'} fired in the last 7 days.`
      : 'No milestone alerts triggered this week.';

  const latestMilestoneText = latestMilestone
    ? `Poll ${latestMilestone.pollId ?? 'unknown'} crossed ${
        typeof latestMilestone.milestone === 'number'
          ? latestMilestone.milestone.toLocaleString()
          : 'a milestone'
      } votes on ${new Date(latestMilestone.occurredAt).toLocaleString()}.`
    : null;

  const latestMilestoneShort = latestMilestone
    ? `${latestMilestone.pollId ?? 'unknown'} · ${
        typeof latestMilestone.milestone === 'number'
          ? `${latestMilestone.milestone.toLocaleString()} votes`
          : 'milestone reached'
      }`
    : null;

  useEffect(() => {
    if (hasLoadedTrendingHashtags) {
      return;
    }
    setHasLoadedTrendingHashtags(true);
    void getTrendingHashtags(undefined, 6);
  }, [getTrendingHashtags, hasLoadedTrendingHashtags]);

  useEffect(() => {
    // Track admin dashboard load time
    const startTime = performance.now();

    const loadStats = async () => {
      try {
        await loadDashboardStats();

        const loadTime = performance.now() - startTime;
        performanceMetrics.addMetric('admin-dashboard-load', loadTime);
      } catch (error) {
        // Error loading dashboard stats - use existing error handling
        performanceMetrics.addMetric('admin-dashboard-error', 1);
        throw error; // Let error boundary handle it
      }
    };

    loadStats();
  }, [loadDashboardStats]);

  const handleTabChange = (tab: 'overview' | 'users' | 'analytics' | 'settings' | 'audit') => {
    setActiveTab(tab);
    performanceMetrics.addMetric('admin-tab-switch', 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-8 bg-gray-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h2>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user.email}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Role: {user.role}</span>
              <button
                onClick={onLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'users', label: 'Users' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'settings', label: 'Settings' },
              { id: 'audit', label: 'Audit Logs' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as 'overview' | 'users' | 'analytics' | 'settings' | 'audit')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Insight Highlights */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-5 flex items-start gap-3">
                <span className="p-2 bg-white/80 rounded-lg shadow-sm">
                  <Bell className="h-6 w-6 text-blue-600" />
                </span>
                <div className="text-sm text-blue-900">
                  <p className="font-semibold">Alerts & Notifications</p>
                  <p className="mt-1">
                    {unreadNotifications > 0
                      ? `You have ${unreadNotifications} unread admin alert${unreadNotifications === 1 ? '' : 's'}.`
                      : 'All caught up! We will surface new alerts here.'}
                  </p>
                  {firstUnreadNotification && (
                    <p className="mt-3 text-xs text-blue-700 line-clamp-2">
                      {firstUnreadNotification.title || firstUnreadNotification.message}
                    </p>
                  )}
                  <p className={`mt-3 text-xs ${milestoneAlertsLast7Days > 0 ? 'text-blue-700' : 'text-blue-600'}`}>
                    {milestoneSummary}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-purple-100 rounded-lg p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-purple-50 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-purple-900">Engagement Focus</p>
                      <p className="text-xs text-purple-600">
                        Cross-store trending signals to monitor in analytics
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => getTrendingHashtags(undefined, 6)}
                    disabled={hashtagLoading}
                    className="text-xs"
                  >
                    Refresh
                  </Button>
                </div>

                <div className="mt-4 space-y-3">
                  {hashtagLoading && trendingHashtags.length === 0 ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, idx) => (
                        <Skeleton key={idx} className="h-14 w-full" />
                      ))}
                    </div>
                  ) : trendingHashtags.length > 0 ? (
                    <TrendingHashtagDisplay
                      trendingHashtags={trendingHashtags}
                      showGrowth
                      maxDisplay={3}
                      onHashtagClick={(hashtag) =>
                        window.open(`/hashtags/${hashtag.name}`, '_blank', 'noopener,noreferrer')
                      }
                    />
                  ) : (
                    <div className="rounded-md border border-dashed border-purple-200 p-4 text-xs text-purple-700">
                      {topTrendingTopic
                        ? `${topTrendingTopic.title} · Score ${Math.round(
                            topTrendingTopic.trending_score ?? 0,
                          )}. Monitor analytics for deeper insights.`
                        : 'No hashtag trends detected yet. Keep an eye on the analytics tab for emerging activity.'}
                    </div>
                  )}

                  {hashtagError && (
                    <div className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-700">
                      {hashtagError}
                    </div>
                  )}

                  <p className="text-xs text-purple-700">{shareSummary}</p>
                  {latestMilestoneShort && (
                    <p className="text-xs text-purple-600">
                      Latest milestone: {latestMilestoneShort}
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleTabChange('analytics')}
                    className="inline-flex items-center text-xs font-medium text-purple-700 hover:text-purple-800"
                  >
                    View analytics
                    <svg className="ml-1 h-3 w-3" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Button>
                </div>
              </div>

              <div
                className={`rounded-lg p-5 flex items-start gap-3 shadow-sm border ${
                  systemHealthStatus === 'healthy'
                    ? 'border-emerald-200 bg-emerald-50'
                    : systemHealthStatus === 'warning'
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <span className="p-2 bg-white/80 rounded-lg shadow-sm">
                  <Activity
                    className={`h-6 w-6 ${
                      systemHealthStatus === 'healthy'
                        ? 'text-emerald-600'
                        : systemHealthStatus === 'warning'
                        ? 'text-amber-600'
                        : 'text-red-600'
                    }`}
                  />
                </span>
                <div className="text-sm text-gray-900">
                  <p className="font-semibold">System Health</p>
                  <p
                    className={`mt-1 capitalize ${
                      systemHealthStatus === 'healthy'
                        ? 'text-emerald-700'
                        : systemHealthStatus === 'warning'
                        ? 'text-amber-700'
                        : 'text-red-700'
                    }`}
                  >
                    {systemHealthStatus === 'healthy'
                      ? 'All systems operational.'
                      : systemHealthStatus === 'warning'
                      ? 'We are seeing elevated load. Monitor analytics closely.'
                      : 'Immediate attention required. Review system performance metrics.'}
                  </p>
                  {latestActivity && (
                    <p className="mt-3 text-xs text-gray-600 line-clamp-2">
                      Latest activity: {latestActivity.title}
                    </p>
                  )}
                  {latestMilestoneText && (
                    <p className="mt-2 text-xs text-gray-600 line-clamp-2">{latestMilestoneText}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-semibold text-gray-900">{totalUsers.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Polls</p>
                    <p className="text-2xl font-semibold text-gray-900">{activePollsCount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Votes</p>
                    <p className="text-2xl font-semibold text-gray-900">{totalVotesCount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Sparkles className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Polls Created (7d)</p>
                    <p className="text-2xl font-semibold text-gray-900">{pollsCreatedLast7Days.toLocaleString()}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {pollsCreatedToday > 0 ? `${pollsCreatedToday} published today.` : 'No new polls today.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-start">
                  <div className="p-2 bg-sky-100 rounded-lg">
                    <Target className="w-6 h-6 text-sky-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Polls Published Today</p>
                    <p className="text-2xl font-semibold text-gray-900">{pollsCreatedToday.toLocaleString()}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {pollsCreatedLast7Days > 0
                        ? `${pollsCreatedLast7Days.toLocaleString()} launched this week.`
                        : 'No launches this week yet.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-start">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Award className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Milestone Alerts (7d)</p>
                    <p className="text-2xl font-semibold text-gray-900">{milestoneAlertsLast7Days.toLocaleString()}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {latestMilestoneShort ?? 'Awaiting the next milestone.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-start">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <Share2 className="w-6 h-6 text-teal-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Share Actions (24h)</p>
                    <p className="text-2xl font-semibold text-gray-900">{shareActionsLast24h.toLocaleString()}</p>
                    <p className="mt-1 text-xs text-gray-500">{shareSummary}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <Suspense fallback={<div className="p-4 bg-gray-100 rounded-lg animate-pulse">Loading user management...</div>}>
            <UserManagement />
          </Suspense>
        )}

        {activeTab === 'analytics' && (
          <Suspense fallback={<div className="p-4 bg-gray-100 rounded-lg animate-pulse">Loading analytics...</div>}>
            <AnalyticsPanel />
          </Suspense>
        )}

        {activeTab === 'settings' && (
          <Suspense fallback={<div className="p-4 bg-gray-100 rounded-lg animate-pulse">Loading system settings...</div>}>
            <SystemSettings />
          </Suspense>
        )}

        {activeTab === 'audit' && (
          <Suspense fallback={<div className="p-4 bg-gray-100 rounded-lg animate-pulse">Loading audit logs...</div>}>
            <AuditLogs />
          </Suspense>
        )}
      </main>
    </div>
  );
}
