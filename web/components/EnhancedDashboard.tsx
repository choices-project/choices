'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Activity,
  RefreshCw,
  Calendar,
  Target,
  Award,
  Zap,
  Vote,
  Play
} from 'lucide-react';
import { devLog } from '@/lib/logger';
import PlatformTour from './PlatformTour';
import FirstTimeUserGuide from './FirstTimeUserGuide';

type DashboardData = {
  userPolls: PollSummary[];
  userMetrics: UserMetrics;
  userTrends: TrendData[];
  userEngagement: EngagementMetrics;
  userInsights: UserInsights;
}

type PollSummary = {
  id: string;
  title: string;
  status: string;
  totalvotes: number;
  participation: number;
  createdat: string;
  endsat: string;
  choices: Choice[];
}

type Choice = {
  id: string;
  text: string;
  votes: number;
}

type UserMetrics = {
  pollsCreated: number;
  pollsActive: number;
  votesCast: number;
  participationRate: number;
  averageSessionTime: number;
  trustScore: number;
}

type TrendData = {
  date: string;
  votesCast: number;
  pollsCreated: number;
  sessionTime: number;
}

type UserInsights = {
  topCategories: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  votingPatterns: Array<{
    timeOfDay: string;
    activity: number;
  }>;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    earned: boolean;
    progress: number;
  }>;
}

type EngagementMetrics = {
  weeklyActivity: number;
  monthlyActivity: number;
  streakDays: number;
  favoriteCategories: string[];
}

type EnhancedDashboardProps = {
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  showNavigation?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onDataUpdate?: (data: DashboardData) => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function EnhancedDashboard({
  title = "Enhanced Dashboard",
  subtitle = "Advanced analytics and insights",
  showHeader = true,
  showNavigation = true,
  autoRefresh = true,
  refreshInterval = 30000,
  onDataUpdate,
  onError,
  className = ""
}: EnhancedDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<string>('overview');
  const [autoRefreshEnabled, _setAutoRefreshEnabled] = useState(autoRefresh);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [_filters, _setFilters] = useState({
    dateRange: '30d',
    pollId: 'all',
    userType: 'all',
    deviceType: 'all'
  });

  // Tour and guide state
  const [showPlatformTour, setShowPlatformTour] = useState(false);
  const [showFirstTimeGuide, setShowFirstTimeGuide] = useState(false);

  const dashboardViews = [
    {
      id: 'overview',
      name: 'My Activity',
      description: 'Your polls, votes, and participation',
      icon: <BarChart3 className="h-5 w-5" />,
      enabled: true
    },
    {
      id: 'trends',
      name: 'My Trends',
      description: 'Your activity patterns over time',
      icon: <TrendingUp className="h-5 w-5" />,
      enabled: true
    },
    {
      id: 'insights',
      name: 'My Insights',
      description: 'Personal insights and achievements',
      icon: <Target className="h-5 w-5" />,
      enabled: true
    },
    {
      id: 'engagement',
      name: 'My Engagement',
      description: 'Your participation and activity levels',
      icon: <Activity className="h-5 w-5" />,
      enabled: true
    }
  ];

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API call - replace with actual API endpoint
      const response = await fetch('/api/dashboard/data', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load dashboard data: ${response.statusText}`);
      }

      const data: DashboardData = await response.json();
      setDashboardData(data);
      setLastUpdated(new Date());
      onDataUpdate?.(data);

      devLog('Dashboard data loaded successfully:', data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(errorMessage);
      onError?.(errorMessage);
      devLog('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [onDataUpdate, onError]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      loadDashboardData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, refreshInterval, loadDashboardData]);

  const handleRefresh = () => {
    loadDashboardData();
  };

  const _handleFilterChange = (key: string, value: string) => {
    _setFilters(prev => ({ ...prev, [key]: value }));
  };

  const renderOverviewView = () => {
    if (!dashboardData) return null;

    const { userMetrics, userPolls } = dashboardData;

    return (
      <div className="space-y-6">
        {/* Personal Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border" data-testid="polls-created-metric">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Polls Created</p>
                <p className="text-3xl font-bold text-gray-900">{userMetrics.pollsCreated}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border" data-testid="active-polls-metric">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Polls</p>
                <p className="text-3xl font-bold text-gray-900">{userMetrics.pollsActive}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border" data-testid="votes-cast-metric">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Votes Cast</p>
                <p className="text-3xl font-bold text-gray-900">{userMetrics.votesCast}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Vote className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border" data-testid="trust-score-metric">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Trust Score</p>
                <p className="text-3xl font-bold text-gray-900">{userMetrics.trustScore}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Award className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* My Recent Polls */}
        <div className="bg-white p-6 rounded-lg shadow-sm border" data-testid="recent-polls-section">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">My Recent Polls</h3>
          <div className="space-y-4">
            {userPolls.slice(0, 5).map((poll) => (
              <div key={poll.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{poll.title}</h4>
                  <p className="text-sm text-gray-600">
                    {poll.totalvotes} votes • {poll.participation}% participation
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    poll.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {poll.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTrendsView = () => {
    if (!dashboardData) return null;

    const { userTrends } = dashboardData;

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">My Activity Trends</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-2" />
              <p>Your activity trends over time</p>
              <p className="text-sm">Data points: {userTrends.length}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderInsightsView = () => {
    if (!dashboardData) return null;

    const { userInsights } = dashboardData;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categories</h3>
            <div className="space-y-2">
              {userInsights.topCategories.map((category) => (
                <div key={category.category} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{category.category}</span>
                  <span className="font-medium">{category.count} ({category.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h3>
            <div className="space-y-2">
              {userInsights.achievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center space-x-3" data-testid="achievement-item">
                  <div className={`w-4 h-4 rounded-full ${
                    achievement.earned ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{achievement.name}</p>
                    <p className="text-xs text-gray-600">{achievement.description}</p>
                    {!achievement.earned && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${achievement.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };


  const renderEngagementView = () => {
    if (!dashboardData) return null;

    const { userEngagement } = dashboardData;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Weekly Activity</p>
                <p className="text-2xl font-bold text-gray-900">{userEngagement.weeklyActivity}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Activity</p>
                <p className="text-2xl font-bold text-gray-900">{userEngagement.monthlyActivity}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Streak Days</p>
                <p className="text-2xl font-bold text-gray-900">{userEngagement.streakDays}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Favorite Categories</p>
                <p className="text-2xl font-bold text-gray-900">{userEngagement.favoriteCategories.length}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Favorite Categories</h3>
          <div className="flex flex-wrap gap-2">
            {userEngagement.favoriteCategories.map((category) => (
              <span key={category} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {category}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentView = () => {
    switch (selectedView) {
      case 'overview':
        return renderOverviewView();
      case 'trends':
        return renderTrendsView();
      case 'insights':
        return renderInsightsView();
      case 'engagement':
        return renderEngagementView();
      default:
        return renderOverviewView();
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Activity className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`} data-testid="enhanced-dashboard">
      {showHeader && (
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-gray-600">{subtitle}</p>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowPlatformTour(true)}
                    className="flex items-center space-x-1 px-3 py-1 text-blue-600 hover:text-blue-800 transition-colors"
                    data-testid="platform-tour-button"
                  >
                    <Play className="h-4 w-4" />
                    <span className="text-sm">Take a Tour</span>
                  </button>
                  <button
                    onClick={() => setShowFirstTimeGuide(true)}
                    className="flex items-center space-x-1 px-3 py-1 text-green-600 hover:text-green-800 transition-colors"
                    data-testid="first-time-guide-button"
                  >
                    <Vote className="h-4 w-4" />
                    <span className="text-sm">Get Started</span>
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    data-testid="refresh-button"
                  >
                    <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <span className="text-xs text-gray-500">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNavigation && (
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              {dashboardViews.map((view) => (
                <button
                  key={view.id}
                  onClick={() => setSelectedView(view.id)}
                  disabled={!view.enabled}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    selectedView === view.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } ${!view.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center space-x-2">
                    {view.icon}
                    <span>{view.name}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentView()}
      </div>

      {/* Tour Components */}
      <PlatformTour 
        isOpen={showPlatformTour}
        onClose={() => setShowPlatformTour(false)}
        onComplete={() => {
          devLog('Platform tour completed');
        }}
      />
      
      <FirstTimeUserGuide
        isOpen={showFirstTimeGuide}
        onClose={() => setShowFirstTimeGuide(false)}
        onComplete={() => {
          devLog('First time user guide completed');
        }}
      />
    </div>
  );
}
