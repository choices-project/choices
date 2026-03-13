'use client';

import {
  Activity,
  BarChart3,
  Brain,
  RefreshCw,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { EnhancedErrorDisplay } from '@/components/shared/EnhancedErrorDisplay';
import { AnalyticsSkeleton } from '@/components/shared/Skeletons';
import { Button } from '@/components/ui/button';

import {
  useAnalyticsDashboard,
  useAnalyticsLoading,
  useAnalyticsError,
  useAnalyticsActions
} from '@/lib/stores';
import { useAppActions } from '@/lib/stores/appStore';

import { useFeatureFlags } from '@/hooks/useFeatureFlags';

type AnalyticsView = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'overview' | 'trends' | 'demographics' | 'performance' | 'privacy' | 'engagement' | 'advanced';
  enabled: boolean;
}

// Extended analytics data type for view components (matches AnalyticsDashboard structure)
type AnalyticsData = {
  totalEvents?: number;
  uniqueUsers?: number;
  sessionCount?: number;
  averageSessionDuration?: number;
  topPages?: Array<{ page: string; views: number }>;
  topActions?: Array<{ action: string; count: number }>;
  userEngagement?: number;
  conversionFunnel?: Array<{ step: string; users: number; conversion: number }>;
  overview?: {
    totalPolls?: number;
    activePolls?: number;
    totalUsers?: number;
    totalVotes?: number;
    averageEngagement?: number;
    participationRate?: number;
    averageSessionDuration?: number;
    bounceRate?: number;
    conversionRate?: number;
  };
  demographics?: {
    ageGroups?: Record<string, number>;
    locations?: Record<string, number>;
    genders?: Record<string, number>;
    deviceTypes?: Record<string, number>;
  };
  performance?: {
    loadTimes?: Array<{
      page: string;
      averageLoadTime: number;
      p95LoadTime: number;
    }>;
  };
  engagement?: {
    activeUsers?: number;
    returningUsers?: number;
    sessionDuration?: number;
    pagesPerSession?: number;
    featureUsage?: Record<string, number>;
  };
  privacy?: {
    dataRetention?: number;
    anonymizationEnabled?: boolean;
    dataCollected?: number;
    dataShared?: number;
    anonymizationLevel?: string;
    encryptionEnabled?: boolean;
    userConsent?: boolean;
  };
} | null

export default function AnalyticsPage() {
  const analyticsData = useAnalyticsDashboard();
  const loading = useAnalyticsLoading();
  const error = useAnalyticsError();
  const analyticsActions = useAnalyticsActions();
  const { trackEvent, sendAnalytics, exportAnalytics } = analyticsActions;
  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions();

  // Feature flags from hook
  const { isEnabled } = useFeatureFlags();
  const analyticsEnabled = isEnabled('analytics');
  const aiFeaturesEnabled = isEnabled('aiFeatures');

  const [selectedView, setSelectedView] = useState<string>('overview');

  const analyticsViews: AnalyticsView[] = [
    {
      id: 'overview',
      name: 'Overview',
      description: 'Key metrics and performance indicators',
      icon: <BarChart3 className="h-5 w-5" />,
      category: 'overview',
      enabled: true
    },
    {
      id: 'trends',
      name: 'Trends',
      description: 'Temporal analysis and patterns',
      icon: <TrendingUp className="h-5 w-5" />,
      category: 'trends',
      enabled: analyticsEnabled
    },
    {
      id: 'demographics',
      name: 'Demographics',
      description: 'User demographic analysis',
      icon: <Users className="h-5 w-5" />,
      category: 'demographics',
      enabled: analyticsEnabled
    },
    {
      id: 'performance',
      name: 'Performance',
      description: 'System performance metrics',
      icon: <Zap className="h-5 w-5" />,
      category: 'performance',
      enabled: analyticsEnabled
    },
    {
      id: 'privacy',
      name: 'Privacy',
      description: 'Privacy and data protection metrics',
      icon: <Shield className="h-5 w-5" />,
      category: 'privacy',
      enabled: analyticsEnabled
    },
    {
      id: 'engagement',
      name: 'Engagement',
      description: 'User engagement and behavior',
      icon: <Activity className="h-5 w-5" />,
      category: 'engagement',
      enabled: analyticsEnabled
    },
    {
      id: 'advanced',
      name: 'Advanced Analytics',
      description: 'Advanced statistical analysis and predictions',
      icon: <Brain className="h-5 w-5" />,
      category: 'advanced',
      enabled: analyticsEnabled && aiFeaturesEnabled
    }
  ];

  useEffect(() => {
    setCurrentRoute('/analytics');
    setSidebarActiveSection('analytics');
    setBreadcrumbs([
      { label: 'Home', href: '/' },
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Analytics', href: '/analytics' },
    ]);

    return () => {
      setSidebarActiveSection(null);
      setBreadcrumbs([]);
    };
  }, [setBreadcrumbs, setCurrentRoute, setSidebarActiveSection]);

  // Track page view when component mounts
  useEffect(() => {
    trackEvent({
      event_type: 'page_view',
      type: 'page_view',
      category: 'analytics',
      action: 'view_analytics_page',
      label: 'Analytics Dashboard',
      session_id: '', // Will be filled by trackEvent
      event_data: {
        type: 'page_view',
        category: 'analytics',
        action: 'view_analytics_page',
        label: 'Analytics Dashboard'
      },
      created_at: new Date().toISOString()
    });
  }, [trackEvent]);

  if (!analyticsEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Analytics Disabled</h1>
          <p className="text-muted-foreground mb-4">
            The analytics feature is currently disabled. Please enable it through the feature flags system to access analytics data.
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>Feature Flag:</strong> analytics
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800" aria-label="Loading analytics" aria-busy="true">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AnalyticsSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
        <EnhancedErrorDisplay
          title="Analytics Error"
          message={error}
          details="We encountered an issue while loading analytics data. This might be a temporary network problem."
          tip="Check your internet connection and try again. If the problem persists, the analytics service may be temporarily unavailable."
          canRetry={true}
          onRetry={() => sendAnalytics()}
          primaryAction={{
            label: 'Retry',
            onClick: () => sendAnalytics(),
            icon: <RefreshCw className="h-4 w-4" />,
          }}
          secondaryAction={{
            label: 'Go to Dashboard',
            href: '/dashboard',
          }}
        />
      </div>
    );
  }

  if (!analyticsData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Comprehensive insights and data visualization
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Auto-refresh off
                </span>
              </div>
              <Button
                onClick={() => trackEvent({
                  event_type: 'user_action',
                  type: 'user_action',
                  category: 'analytics',
                  action: 'toggle_auto_refresh',
                  session_id: '', // Will be filled by trackEvent
                  event_data: {
                    action: 'toggle_auto_refresh'
                  },
                  created_at: new Date().toISOString()
                })}
                className="bg-primary hover:bg-primary/90"
                aria-label="Enable auto-refresh for analytics"
              >
                Enable Auto-refresh
              </Button>
              <Button
                onClick={() => exportAnalytics()}
                className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                aria-label="Export analytics data"
              >
                Export Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="bg-card rounded-xl shadow-sm border border-border mb-8">
          <div className="border-b border-border">
            <nav className="flex space-x-8 px-6" aria-label="Analytics tabs">
              {analyticsViews
                .filter(view => view.enabled)
                .map((view) => (
                  <Button
                    key={view.id}
                    variant="ghost"
                    onClick={() => setSelectedView(view.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 rounded-none ${
                      selectedView === view.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground/80 hover:border-border'
                    }`}
                  >
                    {view.icon}
                    <span>{view.name}</span>
                  </Button>
                ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="space-y-8">
          {selectedView === 'overview' && (
            <OverviewView data={analyticsData} />
          )}

          {selectedView === 'trends' && (
            <TrendsView data={analyticsData} />
          )}

          {selectedView === 'demographics' && (
            <DemographicsView data={analyticsData} />
          )}

          {selectedView === 'performance' && (
            <PerformanceView data={analyticsData} />
          )}

          {selectedView === 'privacy' && (
            <PrivacyView data={analyticsData} />
          )}

          {selectedView === 'engagement' && (
            <EngagementView data={analyticsData} />
          )}

          {selectedView === 'advanced' && (
            <AdvancedView data={analyticsData} />
          )}
        </div>
      </div>
    </div>
  );
}

// Overview View Component
function OverviewView({ data }: { data: AnalyticsData }) {
  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Polls"
          value={data?.overview?.totalPolls ?? 0}
          icon={<BarChart3 className="h-6 w-6" />}
          color="blue"
          trend="+12%"
          trendDirection="up"
        />
        <MetricCard
          title="Active Polls"
          value={data?.overview?.activePolls ?? 0}
          icon={<Activity className="h-6 w-6" />}
          color="green"
          trend="+5%"
          trendDirection="up"
        />
        <MetricCard
          title="Total Votes"
          value={data?.overview?.totalVotes ?? 0}
          icon={<Users className="h-6 w-6" />}
          color="purple"
          trend="+23%"
          trendDirection="up"
        />
        <MetricCard
          title="Participation Rate"
          value={`${data?.overview?.participationRate ?? 0}%`}
          icon={<TrendingUp className="h-6 w-6" />}
          color="orange"
          trend="+8%"
          trendDirection="up"
        />
      </div>

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Performance Indicators</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Session Duration</span>
              <span className="text-sm font-medium text-foreground">
                {data?.overview?.averageSessionDuration ?? 0} min
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Bounce Rate</span>
              <span className="text-sm font-medium text-foreground">
                {data?.overview?.bounceRate ?? 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Conversion Rate</span>
              <span className="text-sm font-medium text-foreground">
                {data?.overview?.conversionRate ?? 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button className="w-full bg-primary hover:bg-primary/90">
              Export Report
            </Button>
            <Button className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700">
              Generate Insights
            </Button>
            <Button className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700">
              Schedule Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Trends View Component
function TrendsView({ data: _data }: { data: AnalyticsData }) {
  return (
    <div className="space-y-8">
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Voting Trends</h3>
        <div className="h-64 bg-muted rounded-lg flex flex-col items-center justify-center gap-2">
          <BarChart3 className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Trend data will appear here as you vote on polls</p>
        </div>
      </div>
    </div>
  );
}

// Demographics View Component
function DemographicsView({ data }: { data: AnalyticsData }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Age Distribution</h3>
          <div className="space-y-3">
            {Object.entries(data?.demographics?.ageGroups ?? {}).map(([age, count]) => (
              <div key={age} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{age}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${(Number(count) / Math.max(...Object.values(data?.demographics?.ageGroups ?? {}).map(v => Number(v)))) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground">{String(count)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Device Types</h3>
          <div className="space-y-3">
            {Object.entries(data?.demographics?.deviceTypes ?? {}).map(([device, percentage]) => {
              const percentageValue = typeof percentage === 'number' ? percentage : 0;
              return (
                <div key={device} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground capitalize">{device}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-muted rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${percentageValue}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground">{percentageValue}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Performance View Component
function PerformanceView({ data }: { data: AnalyticsData }) {
  return (
    <div className="space-y-8">
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Page Load Times</h3>
        <div className="space-y-4">
          {data?.performance?.loadTimes?.map((page: { page: string; averageLoadTime: number; p95LoadTime: number }) => (
            <div key={page.page} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{page.page}</span>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-foreground">{page.averageLoadTime}ms</span>
                <span className="text-sm text-muted-foreground">P95: {page.p95LoadTime}ms</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Privacy View Component
function PrivacyView({ data }: { data: AnalyticsData }) {
  return (
    <div className="space-y-8">
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Privacy Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Data Collected</span>
              <span className="text-sm font-medium text-foreground">{data?.privacy?.dataCollected ?? 0} fields</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Data Shared</span>
              <span className="text-sm font-medium text-foreground">{data?.privacy?.dataShared ?? 0} fields</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Anonymization</span>
              <span className="text-sm font-medium text-foreground capitalize">{data?.privacy?.anonymizationLevel ?? 'N/A'}</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Encryption</span>
              <span className="text-sm font-medium text-foreground">
                {data?.privacy?.encryptionEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Consent Granted</span>
              <span className="text-sm font-medium text-foreground">{data?.privacy?.userConsent ? 'Granted' : 'Pending'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Engagement View Component
function EngagementView({ data }: { data: AnalyticsData }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">User Engagement</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Users</span>
              <span className="text-sm font-medium text-foreground">{data?.engagement?.activeUsers ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Returning Users</span>
              <span className="text-sm font-medium text-foreground">{data?.engagement?.returningUsers ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Session Duration</span>
              <span className="text-sm font-medium text-foreground">{data?.engagement?.sessionDuration ?? 0} min</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pages per Session</span>
              <span className="text-sm font-medium text-foreground">{data?.engagement?.pagesPerSession ?? 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Feature Usage</h3>
          <div className="space-y-3">
            {Object.entries(data?.engagement?.featureUsage ?? {}).map(([feature, percentage]) => {
              const percentageValue = typeof percentage === 'number' ? percentage : 0;
              return (
                <div key={feature} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground capitalize">{feature}</span>
                  <div className="flex items-center space-x-2">
<div className="w-16 bg-muted rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${percentageValue}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground">{percentageValue}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Advanced View Component
function AdvancedView({ data: _data }: { data: AnalyticsData }) {
  return (
    <div className="space-y-8">
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Advanced Analytics</h3>
        <p className="text-muted-foreground mb-4">
          Advanced analytics features including predictive modeling, statistical analysis, and AI-powered insights are available when the AI features flag is enabled.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Predictive Analytics</h4>
            <p className="text-sm text-blue-700">Forecast voting patterns and user behavior</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Statistical Analysis</h4>
            <p className="text-sm text-green-700">Advanced statistical modeling and significance testing</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">AI Insights</h4>
            <p className="text-sm text-purple-700">Machine learning powered insights and recommendations</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ title, value, icon, color, trend, trendDirection }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend: string;
  trendDirection: 'up' | 'down';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center">
        <span className={`text-sm font-medium ${
          trendDirection === 'up' ? 'text-green-600' : 'text-red-600'
        }`}>
          {trend}
        </span>
        <span className="text-sm text-muted-foreground ml-1">from last month</span>
      </div>
    </div>
  );
}
