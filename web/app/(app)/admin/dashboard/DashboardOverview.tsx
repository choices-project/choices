'use client';

import {
  TrendingUp,
  BarChart3,
  Activity,
  CheckCircle,
  AlertTriangle,
  Users,
  Zap,
  Clock
} from 'lucide-react';
import React from 'react';


import { useTrendingTopics, useGeneratedPolls, useSystemMetrics, useRealTimeSubscriptions } from '@/features/admin/lib/hooks';
import { mockChartData } from '@/features/admin/lib/mock-data';
import type { ActivityItem } from '@/features/admin/types';

import { Skeleton } from '@/components/ui/skeleton';

import { useActivityFeed } from '@/lib/stores';
import { devLog } from '@/lib/utils/logger';


import { MetricCard, BasicLineChart, BasicBarChart, ChartWrapper, ChartSkeleton } from '../charts/BasicCharts';

export const DashboardOverview: React.FC = () => {
  const activityFeed = useActivityFeed();

  // Initialize real-time subscriptions
  useRealTimeSubscriptions();

  // Fetch data using admin hooks
  const { data: topics, isLoading: topicsLoading } = useTrendingTopics();
  const { data: polls } = useGeneratedPolls();
  const { data: metrics, isLoading: metricsLoading } = useSystemMetrics();
  
  // Combined loading state for metrics
  const isMetricsLoading = metricsLoading || !metrics;

  // Debug logging
  devLog('DashboardOverview - Data loaded:', {
    topics: topics?.length ?? 0,
    polls: polls?.length ?? 0,
    metrics
  });

  // Use mock chart data
  const recentActivityData = mockChartData.recentActivity.map(item => ({
    name: item.month,
    value: item.count
  }));
  const topicCategoriesData = mockChartData.topicCategories.map(item => ({
    name: item.category,
    value: item.count
  }));

  const getSystemHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="h-6 w-6 text-red-600" />;
      default:
        return <CheckCircle className="h-6 w-6 text-green-600" />;
    }
  };

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'green';
      case 'warning':
        return 'yellow';
      case 'error':
        return 'red';
      default:
        return 'green';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard Overview</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor trending topics and system metrics
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isMetricsLoading ? (
          // Show skeleton loaders while metrics are loading
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </>
        ) : (
          // Show actual metrics when loaded
          <>
            <MetricCard
              title="Total Topics"
              value={metrics?.total_topics ?? 0}
              trend="+12%"
              trendValue={12}
              icon={<TrendingUp className="h-6 w-6" />}
              color="blue"
            />
            <MetricCard
              title="Generated Polls"
              value={metrics?.total_polls ?? 0}
              trend="+8%"
              trendValue={8}
              icon={<BarChart3 className="h-6 w-6" />}
              color="green"
            />
            <MetricCard
              title="Active Polls"
              value={metrics?.active_polls ?? 0}
              trend="+5%"
              trendValue={5}
              icon={<Activity className="h-6 w-6" />}
              color="yellow"
            />
            <MetricCard
              title="System Health"
              value={metrics?.system_health ?? 'healthy'}
              icon={getSystemHealthIcon(metrics?.system_health ?? 'healthy')}
              color={getSystemHealthColor(metrics?.system_health ?? 'healthy')}
            />
          </>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Chart */}
        <ChartWrapper title="Recent Activity (7 Days)">
          {topicsLoading ? (
            <ChartSkeleton height={300} />
          ) : (
            <BasicLineChart
              data={recentActivityData}
              dataKey="value"
              title=""
              height={300}
              color="#3B82F6"
            />
          )}
        </ChartWrapper>

        {/* Topic Categories Chart */}
        <ChartWrapper title="Topic Categories Distribution">
          {topicsLoading ? (
            <ChartSkeleton height={300} />
          ) : (
            <BasicBarChart
              data={topicCategoriesData}
              dataKey="value"
              title=""
              height={300}
              color="#10B981"
            />
          )}
        </ChartWrapper>
      </div>

      {/* Recent Activity Feed */}
      <ChartWrapper title="Recent Activity Feed">
        <div className="space-y-4">
          {activityFeed.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity</p>
              <p className="text-sm">Activity will appear here as you use the system</p>
            </div>
          ) : (
            activityFeed.slice(0, 10).map((activity: ActivityItem) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex-shrink-0">
                  {activity.type === 'topic_created' && (
                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  )}
                  {activity.type === 'poll_created' && (
                    <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  )}
                  {activity.type === 'poll_updated' && (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  )}
                  {activity.type === 'system_alert' && (
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ChartWrapper>

      {/* Quick Actions */}
      <ChartWrapper title="Quick Actions">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
            <Zap className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-900">
              Analyze Trending Topics
            </span>
          </button>
          <button className="flex items-center justify-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
            <BarChart3 className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-900">
              Generate Polls
            </span>
          </button>
          <button className="flex items-center justify-center p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
            <Users className="h-5 w-5 text-purple-600 mr-2" />
            <span className="text-sm font-medium text-purple-900">
              View Analytics
            </span>
          </button>
        </div>
      </ChartWrapper>
    </div>
  );
};
