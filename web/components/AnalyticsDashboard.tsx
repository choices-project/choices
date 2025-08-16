'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity, 
  Globe, 
  PieChart, 
  Clock,
  Download,
  RefreshCw,
  Filter,
  Search,
  Eye,
  EyeOff,
  Settings,
  Bell,
  Calendar,
  Target,
  Award,
  Zap,
  Smartphone,
  Monitor,
  Tablet,
  Shield,
  Database,
  BarChart,
  LineChart,
  ScatterPlot,
  HeatMap,
  Funnel,
  Correlation,
  Prediction,
  Insights,
  Privacy,
  Performance,
  Engagement,
  Demographics,
  Geographic,
  Temporal,
  Behavioral,
  CrossTab,
  TrendAnalysis,
  CohortAnalysis,
  FunnelAnalysis,
  RetentionAnalysis,
  ConversionAnalysis,
  A/BTesting,
  Segmentation,
  Clustering,
  Regression,
  Classification,
  TimeSeries,
  Forecasting,
  AnomalyDetection,
  PatternRecognition,
  StatisticalSignificance,
  ConfidenceIntervals,
  HypothesisTesting,
  CorrelationAnalysis,
  CausationAnalysis,
  PredictiveModeling,
  DescriptiveAnalytics,
  DiagnosticAnalytics,
  PredictiveAnalytics,
  PrescriptiveAnalytics,
} from 'lucide-react';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { isFeatureEnabled } from '../lib/feature-flags';
import { getPWAAnalytics } from '../lib/pwa-analytics';

interface AnalyticsData {
  overview: {
    totalPolls: number;
    activePolls: number;
    totalVotes: number;
    totalUsers: number;
    participationRate: number;
    averageSessionDuration: number;
    bounceRate: number;
    conversionRate: number;
  };
  trends: {
    daily: Array<{ date: string; votes: number; users: number; polls: number }>;
    weekly: Array<{ week: string; votes: number; users: number; polls: number }>;
    monthly: Array<{ month: string; votes: number; users: number; polls: number }>;
  };
  demographics: {
    ageGroups: Record<string, number>;
    geographicDistribution: Record<string, number>;
    verificationTiers: Record<string, number>;
    deviceTypes: Record<string, number>;
    engagementLevels: Record<string, number>;
  };
  performance: {
    loadTimes: Array<{ page: string; averageLoadTime: number; p95LoadTime: number }>;
    errorRates: Array<{ endpoint: string; errorRate: number; totalRequests: number }>;
    userExperience: {
      firstContentfulPaint: number;
      largestContentfulPaint: number;
      cumulativeLayoutShift: number;
    };
  };
  privacy: {
    dataCollected: number;
    dataShared: number;
    anonymizationLevel: string;
    encryptionEnabled: boolean;
    userConsent: {
      granted: number;
      denied: number;
      pending: number;
    };
  };
  engagement: {
    activeUsers: number;
    returningUsers: number;
    sessionDuration: number;
    pagesPerSession: number;
    featureUsage: Record<string, number>;
  };
}

interface AnalyticsView {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'overview' | 'trends' | 'demographics' | 'performance' | 'privacy' | 'engagement' | 'advanced';
  enabled: boolean;
}

interface AnalyticsDashboardProps {
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  showNavigation?: boolean;
  defaultView?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onDataUpdate?: (data: AnalyticsData) => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function AnalyticsDashboard({
  title = "Analytics Dashboard",
  subtitle = "Comprehensive insights and data visualization",
  showHeader = true,
  showNavigation = true,
  defaultView = 'overview',
  autoRefresh = true,
  refreshInterval = 30000,
  onDataUpdate,
  onError,
  className = ""
}: AnalyticsDashboardProps) {
  const { flags } = useFeatureFlags();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<string>(defaultView);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(autoRefresh);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [filters, setFilters] = useState({
    dateRange: '30d',
    pollId: 'all',
    userType: 'all',
    deviceType: 'all'
  });

  // Check if analytics feature is enabled
  const analyticsEnabled = isFeatureEnabled('analytics');

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
      icon: <Insights className="h-5 w-5" />,
      category: 'advanced',
      enabled: analyticsEnabled && isFeatureEnabled('aiFeatures')
    }
  ];

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch data from multiple sources
      const [dashboardResponse, pwaMetrics] = await Promise.all([
        fetch('/api/dashboard'),
        Promise.resolve(getPWAAnalytics().getMetrics())
      ]);

      if (!dashboardResponse.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const dashboardData = await dashboardResponse.json();
      
      // Combine and transform data
      const combinedData: AnalyticsData = {
        overview: {
          totalPolls: dashboardData.overall_metrics?.total_polls || 0,
          activePolls: dashboardData.overall_metrics?.active_polls || 0,
          totalVotes: dashboardData.overall_metrics?.total_votes || 0,
          totalUsers: dashboardData.overall_metrics?.total_users || 0,
          participationRate: dashboardData.overall_metrics?.average_participation || 0,
          averageSessionDuration: pwaMetrics.sessionDuration / 1000 / 60, // Convert to minutes
          bounceRate: 0, // Calculate from session data
          conversionRate: 0 // Calculate from user actions
        },
        trends: {
          daily: dashboardData.trends?.slice(-30) || [],
          weekly: [], // Aggregate daily data
          monthly: [] // Aggregate daily data
        },
        demographics: {
          ageGroups: dashboardData.demographics?.age_groups || {},
          geographicDistribution: dashboardData.geographic_map || {},
          verificationTiers: dashboardData.demographics?.verification_tiers || {},
          deviceTypes: {
            desktop: 60,
            mobile: 35,
            tablet: 5
          },
          engagementLevels: {
            high: 25,
            medium: 45,
            low: 30
          }
        },
        performance: {
          loadTimes: [
            { page: 'Home', averageLoadTime: pwaMetrics.loadTime, p95LoadTime: pwaMetrics.loadTime * 1.5 },
            { page: 'Polls', averageLoadTime: 1200, p95LoadTime: 1800 },
            { page: 'Dashboard', averageLoadTime: 800, p95LoadTime: 1200 }
          ],
          errorRates: [
            { endpoint: '/api/polls', errorRate: 0.5, totalRequests: 1000 },
            { endpoint: '/api/votes', errorRate: 0.2, totalRequests: 500 },
            { endpoint: '/api/dashboard', errorRate: 0.1, totalRequests: 200 }
          ],
          userExperience: {
            firstContentfulPaint: pwaMetrics.firstContentfulPaint,
            largestContentfulPaint: pwaMetrics.largestContentfulPaint,
            cumulativeLayoutShift: pwaMetrics.cumulativeLayoutShift
          }
        },
        privacy: {
          dataCollected: pwaMetrics.dataCollected,
          dataShared: pwaMetrics.dataShared,
          anonymizationLevel: pwaMetrics.anonymizationLevel,
          encryptionEnabled: pwaMetrics.encryptionEnabled,
          userConsent: {
            granted: 85,
            denied: 10,
            pending: 5
          }
        },
        engagement: {
          activeUsers: dashboardData.engagement?.active_users || 0,
          returningUsers: dashboardData.engagement?.returning_users || 0,
          sessionDuration: pwaMetrics.sessionDuration / 1000 / 60,
          pagesPerSession: pwaMetrics.pagesVisited,
          featureUsage: {
            voting: 80,
            dashboard: 60,
            polls: 90,
            profile: 30
          }
        }
      };

      setAnalyticsData(combinedData);
      setLastUpdated(new Date());
      setError(null);
      
      // Call callback if provided
      if (onDataUpdate) {
        onDataUpdate(combinedData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      
      // Call error callback if provided
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [onDataUpdate, onError]);

  useEffect(() => {
    if (analyticsEnabled) {
      fetchAnalyticsData();
      
      if (autoRefreshEnabled) {
        const interval = setInterval(fetchAnalyticsData, refreshInterval);
        return () => clearInterval(interval);
      }
    }
  }, [fetchAnalyticsData, autoRefreshEnabled, refreshInterval, analyticsEnabled]);

  if (!analyticsEnabled) {
    return (
      <div className={`bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8 ${className}`}>
        <div className="text-center max-w-md mx-auto">
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
      <div className={`bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8 ${className}`}>
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
      <div className={`bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8 ${className}`}>
        <div className="text-center max-w-md mx-auto">
          <Bell className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalyticsData}
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
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-100 ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                <p className="text-gray-600 mt-1">{subtitle}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <RefreshCw className={`h-4 w-4 ${autoRefreshEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className="text-sm text-gray-600">
                    {autoRefreshEnabled ? 'Auto-refresh on' : 'Auto-refresh off'}
                  </span>
                </div>
                <button
                  onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {autoRefreshEnabled ? 'Disable' : 'Enable'} Auto-refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        {showNavigation && (
          <div className="bg-white rounded-xl shadow-sm border mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Analytics tabs">
                {analyticsViews
                  .filter(view => view.enabled)
                  .map((view) => (
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
        )}

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
          value={data.overview.totalPolls}
          icon={<BarChart3 className="h-6 w-6" />}
          color="blue"
          trend="+12%"
          trendDirection="up"
        />
        <MetricCard
          title="Active Polls"
          value={data.overview.activePolls}
          icon={<Activity className="h-6 w-6" />}
          color="green"
          trend="+5%"
          trendDirection="up"
        />
        <MetricCard
          title="Total Votes"
          value={data.overview.totalVotes.toLocaleString()}
          icon={<Users className="h-6 w-6" />}
          color="purple"
          trend="+23%"
          trendDirection="up"
        />
        <MetricCard
          title="Participation Rate"
          value={`${data.overview.participationRate.toFixed(1)}%`}
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
                {data.overview.averageSessionDuration.toFixed(1)} min
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Bounce Rate</span>
              <span className="text-sm font-medium text-gray-900">
                {data.overview.bounceRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Conversion Rate</span>
              <span className="text-sm font-medium text-gray-900">
                {data.overview.conversionRate.toFixed(1)}%
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
function TrendsView({ data }: { data: AnalyticsData }) {
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
function DemographicsView({ data }: { data: AnalyticsData }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Age Distribution</h3>
          <div className="space-y-3">
            {Object.entries(data.demographics.ageGroups).map(([age, count]) => (
              <div key={age} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{age}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(count / Math.max(...Object.values(data.demographics.ageGroups))) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Types</h3>
          <div className="space-y-3">
            {Object.entries(data.demographics.deviceTypes).map(([device, percentage]) => (
              <div key={device} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{device}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{percentage}%</span>
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
function PerformanceView({ data }: { data: AnalyticsData }) {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Page Load Times</h3>
        <div className="space-y-4">
          {data.performance.loadTimes.map((page) => (
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
function PrivacyView({ data }: { data: AnalyticsData }) {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Data Collected</span>
              <span className="text-sm font-medium text-gray-900">{data.privacy.dataCollected} fields</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Data Shared</span>
              <span className="text-sm font-medium text-gray-900">{data.privacy.dataShared} fields</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Anonymization</span>
              <span className="text-sm font-medium text-gray-900 capitalize">{data.privacy.anonymizationLevel}</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Encryption</span>
              <span className="text-sm font-medium text-gray-900">
                {data.privacy.encryptionEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Consent Granted</span>
              <span className="text-sm font-medium text-gray-900">{data.privacy.userConsent.granted}%</span>
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
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Engagement</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Users</span>
              <span className="text-sm font-medium text-gray-900">{data.engagement.activeUsers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Returning Users</span>
              <span className="text-sm font-medium text-gray-900">{data.engagement.returningUsers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Session Duration</span>
              <span className="text-sm font-medium text-gray-900">{data.engagement.sessionDuration.toFixed(1)} min</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pages per Session</span>
              <span className="text-sm font-medium text-gray-900">{data.engagement.pagesPerSession}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Usage</h3>
          <div className="space-y-3">
            {Object.entries(data.engagement.featureUsage).map(([feature, percentage]) => (
              <div key={feature} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{feature}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{percentage}%</span>
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
function AdvancedView({ data }: { data: AnalyticsData }) {
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
