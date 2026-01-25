'use client';

import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  Database,
  Edit,
  MessageSquare,
  Plus,
  RefreshCw,
  Server,
  Trash2,
  Users,
  Zap,
  Flame,
} from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useSystemMetrics } from '@/features/admin/lib/hooks';
import { TrendingHashtagDisplay } from '@/features/hashtags/components/HashtagDisplay';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import {
  useAdminActions,
  useAdminDashboardStats,
  useAdminError,
  useAdminLoading,
  useAdminStats,
  useRecentActivity,
  useHashtagActions,
  useHashtagError,
  useHashtagLoading,
  useTrendingHashtags,
  useNotificationActions,
  useNotificationAdminNotifications,
} from '@/lib/stores';

import { NotificationContainer } from './NotificationSystem';
import ShareAnalyticsPanel from './ShareAnalyticsPanel';

type ComprehensiveAdminDashboardProps = {
  className?: string;
};

type NewSiteMessage = {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high' | 'critical';
  is_active: boolean;
};

export default function ComprehensiveAdminDashboard({ className = '' }: ComprehensiveAdminDashboardProps) {
  const dashboardStats = useAdminDashboardStats();
  const adminStats = useAdminStats();
  const notifications = useNotificationAdminNotifications();
  const recentActivity = useRecentActivity();
  const { data: systemMetrics, isLoading: systemMetricsLoading } = useSystemMetrics();
  const loading = useAdminLoading();
  const error = useAdminError();

  const { refreshData } = useAdminActions();
  const {
    addAdminNotification,
    markAdminNotificationAsRead,
    clearAllAdminNotifications,
  } = useNotificationActions();

  const trendingHashtags = useTrendingHashtags();
  const { isLoading: hashtagLoading } = useHashtagLoading();
  const { error: hashtagError } = useHashtagError();
  const { getTrendingHashtags } = useHashtagActions();

  // Refs for stable action callbacks
  const refreshDataRef = useRef(refreshData);
  useEffect(() => { refreshDataRef.current = refreshData; }, [refreshData]);
  const getTrendingHashtagsRef = useRef(getTrendingHashtags);
  useEffect(() => { getTrendingHashtagsRef.current = getTrendingHashtags; }, [getTrendingHashtags]);
  const addAdminNotificationRef = useRef(addAdminNotification);
  useEffect(() => { addAdminNotificationRef.current = addAdminNotification; }, [addAdminNotification]);
  const markAdminNotificationAsReadRef = useRef(markAdminNotificationAsRead);
  useEffect(() => { markAdminNotificationAsReadRef.current = markAdminNotificationAsRead; }, [markAdminNotificationAsRead]);
  const clearAllAdminNotificationsRef = useRef(clearAllAdminNotifications);
  useEffect(() => { clearAllAdminNotificationsRef.current = clearAllAdminNotifications; }, [clearAllAdminNotifications]);

  const [selectedTab, setSelectedTab] = useState<'overview' | 'messages' | 'performance' | 'system' | 'activity'>(
    'overview',
  );
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [newMessage, setNewMessage] = useState<NewSiteMessage>({
    title: '',
    message: '',
    type: 'info',
    priority: 'medium',
    is_active: true,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Combined loading state for metrics cards (initial load or refresh)
  const isMetricsLoading = loading || systemMetricsLoading || isRefreshing;

  useEffect(() => {
    void refreshDataRef.current();
    void getTrendingHashtagsRef.current(undefined, 6);
  }, []);  

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const start = performance.now();
    try {
      await Promise.all([refreshDataRef.current(), getTrendingHashtagsRef.current(undefined, 6)]);
      addAdminNotificationRef.current({
        type: 'success',
        title: 'Dashboard refreshed',
        message: `Latest data loaded in ${Math.round(performance.now() - start)}ms.`,
        read: false,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to refresh admin data.';
      addAdminNotificationRef.current({
        type: 'error',
        title: 'Refresh failed',
        message,
        read: false,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateMessage = () => {
    if (!newMessage.title.trim() || !newMessage.message.trim()) {
      return;
    }
    const timestamp = new Date().toISOString();
    addAdminNotificationRef.current({
      timestamp,
      created_at: timestamp,
      type: newMessage.type,
      title: newMessage.title,
      message: newMessage.message,
      read: !newMessage.is_active,
      metadata: {
        priority: newMessage.priority,
        status: newMessage.is_active ? 'active' : 'inactive',
      },
    });
    setNewMessage({
      title: '',
      message: '',
      type: 'info',
      priority: 'medium',
      is_active: true,
    });
    setShowMessageForm(false);
  };

  const analytics = useMemo(() => {
    const totalUsers = dashboardStats?.totalUsers ?? adminStats.totalUsers ?? 0;
    const totalPolls = dashboardStats?.activePolls ?? 0;
    const totalVotes = dashboardStats?.totalVotes ?? 0;
    const systemStatus = dashboardStats?.systemHealth ?? 'healthy';
    const uptime = systemMetrics?.system_uptime ?? 0;
    const responseTime = systemMetrics?.performance_metrics?.response_time_avg ?? 0;
    const errorRate = systemMetrics?.performance_metrics?.error_rate ?? 0;
    const participationRate = dashboardStats?.pollsCreatedLast7Days && totalUsers
      ? Math.min(100, (dashboardStats.pollsCreatedLast7Days / Math.max(totalUsers, 1)) * 100)
      : 0;

    return {
      totalUsers,
      totalPolls,
      totalVotes,
      systemHealth: {
        status: systemStatus,
        uptime: typeof uptime === 'number' ? uptime : 0,
        responseTime: typeof responseTime === 'number' ? responseTime : 0,
        errorRate: typeof errorRate === 'number' ? errorRate : 0,
      },
      engagement: {
        dailyActiveUsers: recentActivity.length,
        participationRate,
      },
    };
  }, [adminStats.totalUsers, dashboardStats, recentActivity.length, systemMetrics]);

  const siteMessages = useMemo(() => {
    return notifications.map((notification) => {
      const priorityMeta = notification.metadata?.priority;
      const statusMeta = notification.metadata?.status;
      const updatedMeta = notification.metadata?.updated_at;
      const createdAt =
        typeof notification.created_at === 'string'
          ? notification.created_at
          : notification.timestamp;
      const updatedAt =
        typeof updatedMeta === 'string'
          ? updatedMeta
          : typeof notification.created_at === 'string'
          ? notification.created_at
          : notification.timestamp;

      return {
        id: notification.id,
        title: notification.title ?? 'Untitled message',
        message: notification.message,
        type: notification.type ?? 'info',
        priority:
          typeof priorityMeta === 'string'
            ? (priorityMeta as NewSiteMessage['priority'])
            : 'medium',
        status:
          typeof statusMeta === 'string'
            ? (statusMeta as 'active' | 'inactive' | 'scheduled')
            : notification.read
            ? 'inactive'
            : 'active',
        is_active: !notification.read,
        created_at: createdAt,
        updated_at: updatedAt,
      };
    });
  }, [notifications]);

  if (loading) {
  return (
    <>
      <NotificationContainer />
      <div className={`space-y-6 ${className}`} data-testid="comprehensive-admin-dashboard">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <NotificationContainer />
        <Alert variant="destructive" className={className}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </>
    );
  }

  return (
    <>
      <NotificationContainer />
      <div className={`space-y-6 ${className}`} data-testid="comprehensive-admin-dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Comprehensive Admin Dashboard</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Unified oversight for analytics, messaging, system monitoring, and admin workflows
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/dashboard/overview" className="inline-flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Metrics overview
            </Link>
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as typeof selectedTab)}>
        <TabsList className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="messages">Site Messages</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {isMetricsLoading ? (
              // Show skeleton loaders while refreshing
              <>
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-5 w-24" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-9 w-20 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              // Show actual metrics when loaded
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Total Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{analytics.totalUsers.toLocaleString()}</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active platform accounts</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Poll Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{analytics.totalPolls}</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Polls currently live</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Feedback Volume
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{notifications.length}</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Admin messages and alerts</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Engagement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Daily active items</span>
                      <span className="font-medium">{analytics.engagement.dailyActiveUsers}</span>
                    </div>
                    <Progress 
                      value={analytics.engagement.participationRate}
                      aria-label={`Participation rate: ${analytics.engagement.participationRate.toFixed(1)}%`}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Participation rate {analytics.engagement.participationRate.toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Trending Topics
              </CardTitle>
              <CardDescription>Signals from the hashtag ecosystem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hashtagError && (
                <Alert variant="destructive">
                  <AlertDescription>{hashtagError}</AlertDescription>
                </Alert>
              )}
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
                  maxDisplay={4}
                  onHashtagClick={(hashtag) =>
                    window.open(`/hashtags/${hashtag.name}`, '_blank', 'noopener,noreferrer')
                  }
                />
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">No trending topics detected yet.</p>
              )}
              <div className="flex items-center gap-2">
                <Button variant="outline" className="flex-1" onClick={() => window.open('/feed', '_blank')}>
                  View Community Feed
                </Button>
                <Button variant="ghost" onClick={() => getTrendingHashtagsRef.current(undefined, 6)} disabled={hashtagLoading}>
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Health Snapshot
              </CardTitle>
              <CardDescription>Combined from dashboard metrics and system telemetry</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {loading || systemMetricsLoading ? (
                <>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Status</span>
                      <Badge variant={analytics.systemHealth.status === 'healthy' ? 'default' : 'secondary'}>
                        {analytics.systemHealth.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Uptime</span>
                      <span className="font-medium">{analytics.systemHealth.uptime.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={analytics.systemHealth.uptime}
                      aria-label={`System uptime: ${analytics.systemHealth.uptime.toFixed(1)}%`}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Response Time</span>
                      <span className="font-medium">{analytics.systemHealth.responseTime.toFixed(0)}ms</span>
                    </div>
                    <Progress 
                      value={Math.max(0, 100 - analytics.systemHealth.responseTime / 10)}
                      aria-label={`Response time performance: ${Math.max(0, 100 - analytics.systemHealth.responseTime / 10).toFixed(1)}%`}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Error Rate</span>
                      <span className="font-medium">{analytics.systemHealth.errorRate.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={analytics.systemHealth.errorRate}
                      aria-label={`System error rate: ${analytics.systemHealth.errorRate.toFixed(1)}%`}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Share Analytics */}
          <ShareAnalyticsPanel refreshInterval={60000} />
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Site Messages</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage announcements and broadcast notices</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => clearAllAdminNotificationsRef.current()}
                disabled={!notifications.length}
              >
                Clear All
              </Button>
              <Button onClick={() => setShowMessageForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Message
              </Button>
            </div>
          </div>

          {showMessageForm && (
            <Card>
              <CardHeader>
                <CardTitle>New Site Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="message-title">Title</Label>
                    <Input
                      id="message-title"
                      value={newMessage.title}
                      onChange={(event) =>
                        setNewMessage((prev) => ({
                          title: event.target.value,
                          message: prev.message,
                          type: prev.type,
                          priority: prev.priority,
                          is_active: prev.is_active,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="message-type">Type</Label>
                    <Select
                      value={newMessage.type}
                      onValueChange={(value) =>
                        setNewMessage((prev) => ({
                          title: prev.title,
                          message: prev.message,
                          type: value as NewSiteMessage['type'],
                          priority: prev.priority,
                          is_active: prev.is_active,
                        }))
                      }
                    >
                      <SelectTrigger id="message-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(['info', 'warning', 'error', 'success'] as const).map((option) => (
                          <SelectItem key={option} value={option}>
                            {option.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="message-priority">Priority</Label>
                    <Select
                      value={newMessage.priority}
                      onValueChange={(value) =>
                        setNewMessage((prev) => ({
                          title: prev.title,
                          message: prev.message,
                          type: prev.type,
                          priority: value as NewSiteMessage['priority'],
                          is_active: prev.is_active,
                        }))
                      }
                    >
                      <SelectTrigger id="message-priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(['low', 'medium', 'high', 'critical'] as const).map((option) => (
                          <SelectItem key={option} value={option}>
                            {option.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="message-active"
                      type="checkbox"
                      checked={newMessage.is_active}
                      onChange={(event) =>
                        setNewMessage((prev) => ({
                          title: prev.title,
                          message: prev.message,
                          type: prev.type,
                          priority: prev.priority,
                          is_active: event.target.checked,
                        }))
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor="message-active">Set active immediately</Label>
                  </div>
                </div>
                <div>
                  <Label htmlFor="message-body">Message</Label>
                  <Textarea
                    id="message-body"
                    value={newMessage.message}
                    onChange={(event) =>
                      setNewMessage((prev) => ({
                        title: prev.title,
                        message: event.target.value,
                        type: prev.type,
                        priority: prev.priority,
                        is_active: prev.is_active,
                      }))
                    }
                    rows={4}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={handleCreateMessage} disabled={!newMessage.title || !newMessage.message}>
                    Save Message
                  </Button>
                  <Button variant="ghost" onClick={() => setShowMessageForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4">
            {siteMessages.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">No site messages yet.</p>
            ) : (
              siteMessages.map((message) => (
                <Card key={message.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{message.title}</h4>
                          <Badge variant={message.is_active ? 'default' : 'secondary'}>
                            {message.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">{message.type}</Badge>
                          <Badge variant="outline">{message.priority}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{message.message}</p>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Created:{' '}
                          {message.created_at ? new Date(message.created_at).toLocaleString() : '—'}
                          {message.updated_at &&
                            message.updated_at !== message.created_at && (
                              <span>
                                {' '}
                                • Updated: {new Date(message.updated_at).toLocaleString()}
                              </span>
                            )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAdminNotificationAsReadRef.current(message.id)}
                          title="Archive message"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAdminNotificationAsReadRef.current(message.id)}
                          title="Mark as read"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAdminNotificationAsReadRef.current(message.id)}
                          title="Dismiss message"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Performance Monitoring
              </CardTitle>
              <CardDescription>
                Detailed performance metrics, alerts, and optimisation recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Access the dedicated performance dashboard for real-time monitoring.
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300 ml-2">
                  <li>Live system metrics and alerts</li>
                  <li>Slowest operations tracking</li>
                  <li>Optimisation recommendations</li>
                  <li>Historical performance windows (1h / 6h / 24h)</li>
                </ul>
                <div className="pt-4">
                  <a
                    href="/admin/performance"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Zap className="h-4 w-4" />
                    Open Performance Dashboard
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Platform Totals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                {systemMetricsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>Total topics</span>
                      <span className="font-medium">{systemMetrics?.total_topics ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total polls</span>
                      <span className="font-medium">{systemMetrics?.total_polls ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total votes</span>
                      <span className="font-medium">{systemMetrics?.total_votes ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active sessions</span>
                      <span className="font-medium">{systemMetrics?.active_sessions ?? 0}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Resource Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {systemMetricsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                        <Skeleton className="h-2 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>CPU</span>
                        <span className="font-medium">{systemMetrics?.cpu_usage ?? 0}%</span>
                      </div>
                      <Progress 
                        value={systemMetrics?.cpu_usage ?? 0}
                        aria-label={`CPU usage: ${systemMetrics?.cpu_usage ?? 0}%`}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Memory</span>
                        <span className="font-medium">{systemMetrics?.memory_usage ?? 0}%</span>
                      </div>
                      <Progress 
                        value={systemMetrics?.memory_usage ?? 0}
                        aria-label={`Memory usage: ${systemMetrics?.memory_usage ?? 0}%`}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Disk</span>
                        <span className="font-medium">{systemMetrics?.disk_usage ?? 0}%</span>
                      </div>
                      <Progress 
                        value={systemMetrics?.disk_usage ?? 0}
                        aria-label={`Disk usage: ${systemMetrics?.disk_usage ?? 0}%`}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                {systemMetricsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>Status</span>
                      <span className="font-medium">{systemMetrics?.system_health ?? 'unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Response time (avg)</span>
                      <span className="font-medium">
                        {systemMetrics?.performance_metrics?.response_time_avg?.toFixed(0) ?? '0'}ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Error rate</span>
                      <span className="font-medium">
                        {systemMetrics?.performance_metrics?.error_rate?.toFixed(1) ?? '0'}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Throughput</span>
                      <span className="font-medium">
                        {systemMetrics?.performance_metrics?.throughput?.toFixed(1) ?? '0'} rps
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last updated</span>
                      <span className="font-medium">
                        {systemMetrics?.last_updated
                          ? new Date(systemMetrics.last_updated).toLocaleString()
                          : '—'}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Platform Activity
              </CardTitle>
              <CardDescription>Latest actions captured by the admin event feed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.length ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        {activity.title ?? activity.type}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : ''}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{activity.description}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">No recent activity recorded.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </>
  );
}

