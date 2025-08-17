'use client';

import React from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  Activity, 
  CheckCircle,
  AlertTriangle,
  Clock,
  Users,
  Zap
} from 'lucide-react';
import { MetricCard, BasicLineChart, BasicBarChart, ChartWrapper, ChartSkeleton } from '../charts/BasicCharts';
import { useTrendingTopics, useGeneratedPolls, useSystemMetrics, useRealTimeSubscriptions } from '../../../lib/admin-hooks';
import { useAdminStore } from '../../../lib/admin-store';

export const DashboardOverview: React.FC = () => {
  const { systemMetrics, activityFeed } = useAdminStore();
  
  // Initialize real-time subscriptions
  useRealTimeSubscriptions();
  
  // Fetch data
  const { data: topics, isLoading: topicsLoading } = useTrendingTopics();
  const { data: polls, isLoading: pollsLoading } = useGeneratedPolls();
  const { data: metrics, isLoading: metricsLoading } = useSystemMetrics();

  // Mock data for charts (replace with real data later)
  const recentActivityData = [
    { name: 'Mon', value: 12 },
    { name: 'Tue', value: 19 },
    { name: 'Wed', value: 15 },
    { name: 'Thu', value: 25 },
    { name: 'Fri', value: 22 },
    { name: 'Sat', value: 18 },
    { name: 'Sun', value: 24 },
  ];

  const topicCategoriesData = [
    { name: 'Politics', value: 35 },
    { name: 'Technology', value: 25 },
    { name: 'Entertainment', value: 20 },
    { name: 'Sports', value: 15 },
    { name: 'Other', value: 5 },
  ];

  const pollPerformanceData = [
    { name: 'Jan', value: 65 },
    { name: 'Feb', value: 78 },
    { name: 'Mar', value: 82 },
    { name: 'Apr', value: 75 },
    { name: 'May', value: 88 },
    { name: 'Jun', value: 92 },
  ];

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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">
            Monitor your automated polls system and trending topics
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Topics"
          value={metrics?.total_topics || 0}
          trend="+12%"
          trendValue={12}
          icon={<TrendingUp className="h-6 w-6" />}
          color="blue"
        />
        <MetricCard
          title="Generated Polls"
          value={metrics?.total_polls || 0}
          trend="+8%"
          trendValue={8}
          icon={<BarChart3 className="h-6 w-6" />}
          color="green"
        />
        <MetricCard
          title="Active Polls"
          value={metrics?.active_polls || 0}
          trend="+5%"
          trendValue={5}
          icon={<Activity className="h-6 w-6" />}
          color="yellow"
        />
        <MetricCard
          title="System Health"
          value={metrics?.system_health || 'healthy'}
          icon={getSystemHealthIcon(metrics?.system_health || 'healthy')}
          color={getSystemHealthColor(metrics?.system_health || 'healthy')}
        />
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
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity</p>
              <p className="text-sm">Activity will appear here as you use the system</p>
            </div>
          ) : (
            activityFeed.slice(0, 10).map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-shrink-0">
                  {activity.type === 'topic_created' && (
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  )}
                  {activity.type === 'poll_generated' && (
                    <BarChart3 className="h-5 w-5 text-green-600" />
                  )}
                  {activity.type === 'poll_approved' && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  {activity.type === 'system_alert' && (
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
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
