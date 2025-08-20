'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity, 
  RefreshCw,
  Bell,
  Zap,
  Shield,
  Brain
} from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';

interface AnalyticsView {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'overview' | 'trends' | 'demographics' | 'performance' | 'privacy' | 'engagement' | 'advanced';
  enabled: boolean;
}

export default function AnalyticsPage() {
  const {
    data: analyticsData,
    loading,
    error,
    analyticsEnabled,
    aiFeaturesEnabled,
    fetchData,
    refreshData,
    autoRefresh,
    setAutoRefresh,
    exportData
  } = useAnalytics({
    autoRefresh: true,
    refreshInterval: 30000
  });

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

  // Fetch data when view changes
  useEffect(() => {
    if (analyticsEnabled && selectedView !== 'overview') {
      fetchData(selectedView);
    }
  }, [selectedView, analyticsEnabled, fetchData]);

  if (!analyticsEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics Disabled</h1>
          <p className="text-gray-600 mb-4">
            The analytics feature is currently disabled. Please enable it through the feature flags system to access analytics data.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Feature Flag:</strong> analytics
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Loading Analytics...</h2>
          <p className="text-gray-500 mt-2">Gathering comprehensive data insights</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <Bell className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analyticsData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Comprehensive insights and data visualization
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="text-sm text-gray-600">
                  {autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off'}
                </span>
              </div>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {autoRefresh ? 'Disable' : 'Enable'} Auto-refresh
              </button>
              <button
                onClick={() => exportData('json')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Export Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Analytics tabs">
              {analyticsViews
                .filter(view => view.enabled)
                .map((view: any) => (
                  <button
                    key={view.id}
                    onClick={() => setSelectedView(view.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      selectedView === view.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {view.icon}
                    <span>{view.name}</span>
                  </button>
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
function OverviewView({ data }: { data: any }) {
  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Polls"
          value={data.overview?.totalPolls || 0}
          icon={<BarChart3 className="h-6 w-6" />}
          color="blue"
          trend="+12%"
          trendDirection="up"
        />
        <MetricCard
          title="Active Polls"
          value={data.overview?.activePolls || 0}
          icon={<Activity className="h-6 w-6" />}
          color="green"
          trend="+5%"
          trendDirection="up"
        />
        <MetricCard
          title="Total Votes"
          value={data.overview?.totalVotes || 0}
          icon={<Users className="h-6 w-6" />}
          color="purple"
          trend="+23%"
          trendDirection="up"
        />
        <MetricCard
          title="Participation Rate"
          value={`${data.overview?.participationRate || 0}%`}
          icon={<TrendingUp className="h-6 w-6" />}
          color="orange"
          trend="+8%"
          trendDirection="up"
        />
      </div>

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Indicators</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Session Duration</span>
              <span className="text-sm font-medium text-gray-900">
                {data.overview?.averageSessionDuration || 0} min
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Bounce Rate</span>
              <span className="text-sm font-medium text-gray-900">
                {data.overview?.bounceRate || 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Conversion Rate</span>
              <span className="text-sm font-medium text-gray-900">
                {data.overview?.conversionRate || 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Export Report
            </button>
            <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
              Generate Insights
            </button>
            <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
              Schedule Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Trends View Component
function TrendsView({ data: _data }: { data: any }) {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Voting Trends</h3>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Chart visualization will be implemented here</p>
        </div>
      </div>
    </div>
  );
}

// Demographics View Component
function DemographicsView({ data }: { data: any }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Age Distribution</h3>
          <div className="space-y-3">
            {Object.entries(data.demographics?.ageGroups || {}).map(([age, count]) => (
              <div key={age} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{age}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(Number(count) / Math.max(...Object.values(data.demographics?.ageGroups || {}).map(v => Number(v)))) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{String(count)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Types</h3>
          <div className="space-y-3">
            {Object.entries(data.demographics?.deviceTypes || {}).map(([device, percentage]) => (
              <div key={device} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{device}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{String(percentage)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Performance View Component
function PerformanceView({ data }: { data: any }) {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Page Load Times</h3>
        <div className="space-y-4">
          {data.performance?.loadTimes?.map((page: any) => (
            <div key={page.page} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{page.page}</span>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-900">{page.averageLoadTime}ms</span>
                <span className="text-sm text-gray-500">P95: {page.p95LoadTime}ms</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Privacy View Component
function PrivacyView({ data }: { data: any }) {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Data Collected</span>
              <span className="text-sm font-medium text-gray-900">{data.privacy?.dataCollected || 0} fields</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Data Shared</span>
              <span className="text-sm font-medium text-gray-900">{data.privacy?.dataShared || 0} fields</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Anonymization</span>
              <span className="text-sm font-medium text-gray-900 capitalize">{data.privacy?.anonymizationLevel || 'N/A'}</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Encryption</span>
              <span className="text-sm font-medium text-gray-900">
                {data.privacy?.encryptionEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Consent Granted</span>
              <span className="text-sm font-medium text-gray-900">{data.privacy?.userConsent?.granted || 0}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Engagement View Component
function EngagementView({ data }: { data: any }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Engagement</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Users</span>
              <span className="text-sm font-medium text-gray-900">{data.engagement?.activeUsers || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Returning Users</span>
              <span className="text-sm font-medium text-gray-900">{data.engagement?.returningUsers || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Session Duration</span>
              <span className="text-sm font-medium text-gray-900">{data.engagement?.sessionDuration || 0} min</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pages per Session</span>
              <span className="text-sm font-medium text-gray-900">{data.engagement?.pagesPerSession || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Usage</h3>
          <div className="space-y-3">
            {Object.entries(data.engagement?.featureUsage || {}).map(([feature, percentage]) => (
              <div key={feature} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{feature}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{String(percentage)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Advanced View Component
function AdvancedView({ data: _data }: { data: any }) {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Analytics</h3>
        <p className="text-gray-600 mb-4">
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
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
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
        <span className="text-sm text-gray-600 ml-1">from last month</span>
      </div>
    </div>
  );
}
