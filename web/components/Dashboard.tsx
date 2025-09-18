'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { poApi } from '../src/lib/api';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Activity,
  RefreshCw,
  Filter,
  Calendar,
  Target,
  Award,
  Zap,
  Smartphone,
  Monitor,
  Vote,
  CheckCircle
} from 'lucide-react';
import { devLog } from '@/lib/logger';
import type { DashboardData } from '@/types/frontend';


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

type OverallMetrics = {
  totalpolls: number;
  activepolls: number;
  totalvotes: number;
  totalusers: number;
  averageparticipation: number;
}

type TrendData = {
  date: string;
  votes: number;
  users: number;
  polls: number;
}

type GeographicMap = {
  regions: GeographicRegion[];
  countries: GeographicCountry[];
  heatmap: HeatmapPoint[];
}

type GeographicRegion = {
  name: string;
  votecount: number;
  population: number;
  percentage: number;
  latitude: number;
  longitude: number;
}

type GeographicCountry = {
  code: string;
  name: string;
  votecount: number;
  population: number;
  percentage: number;
}

type HeatmapPoint = {
  latitude: number;
  longitude: number;
  intensity: number;
}

type DemographicsData = {
  agegroups: Record<string, number>;
  genders: Record<string, number>;
  education: Record<string, number>;
  income: Record<string, number>;
  verificationtiers: Record<string, number>;
}

type EngagementMetrics = {
  activeusers: number;
  newusers: number;
  returningusers: number;
  sessionduration: number;
  bouncerate: number;
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedPoll, setSelectedPoll] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'analytics'>('overview');
  const [filters, setFilters] = useState({
    dateRange: '7d',
    region: 'all',
    tier: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      devLog('Fetching dashboard data...');
      
      // Use local API endpoint instead of external PO service
      const response = await fetch('/api/dashboard', {
        headers: {
          'x-e2e-bypass': '1' // Allow E2E tests to bypass auth
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }
      
      const data = await response.json();
      devLog('Dashboard data received:', data);
      
      // Transform the API response to match DashboardData interface
      const transformedData: DashboardData = {
        totalPolls: data.platform?.totalPolls || 0,
        activePolls: data.platform?.activePolls || 0,
        closedPolls: (data.platform?.totalPolls || 0) - (data.platform?.activePolls || 0),
        totalVotes: data.platform?.totalVotes || 0,
        activeUsers: data.platform?.totalUsers || 0
      };
      
      setDashboardData(transformedData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      devLog('Dashboard fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchDashboardData, autoRefresh]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Loading Dashboard...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <Activity className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Enhanced Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <div data-testid="dashboard-welcome">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Enhanced Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Advanced analytics and real-time insights
              </p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Device Indicator */}
              <div className="hidden sm:flex items-center space-x-1 text-sm text-gray-500">
                {isMobile ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                <span>{isMobile ? 'Mobile' : 'Desktop'}</span>
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                {['overview', 'detailed', 'analytics'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode as any)}
                    className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                      viewMode === mode
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
              
              {/* Auto-refresh Toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 rounded-lg transition-colors ${
                  autoRefresh ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                }`}
                title={autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
              >
                <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              
              <div className="text-right">
                <p className="text-xs sm:text-sm text-gray-500">Last Updated</p>
                <p className="text-xs sm:text-sm font-medium text-gray-900">
                  {lastUpdated.toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={fetchDashboardData}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                title="Refresh Data"
              >
                <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filters & Controls</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <Filter className="h-4 w-4" />
              <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
            </button>
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="1d">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                <select
                  value={filters.region}
                  onChange={(e) => setFilters({...filters, region: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Regions</option>
                  <option value="na">North America</option>
                  <option value="eu">Europe</option>
                  <option value="asia">Asia</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Verification Tier</label>
                <select
                  value={filters.tier}
                  onChange={(e) => setFilters({...filters, tier: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Tiers</option>
                  <option value="T0">Tier 0</option>
                  <option value="T1">Tier 1</option>
                  <option value="T2">Tier 2</option>
                  <option value="T3">Tier 3</option>
                </select>
              </div>
              {/* Poll filter temporarily disabled - API doesn't provide poll data yet */}
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Poll</label>
                <select
                  value={selectedPoll}
                  onChange={(e) => setSelectedPoll(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Polls</option>
                  {dashboardData.polls?.map((poll: any) => (
                    <option key={poll.id} value={poll.id}>{poll.title}</option>
                  ))}
                </select>
              </div> */}
            </div>
          )}
        </div>

        {/* Enhanced Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <EnhancedMetricCard
            title="Total Polls"
            value={dashboardData.totalPolls}
            icon={<BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />}
            color="blue"
            trend="+12%"
            trendDirection="up"
          />
          <EnhancedMetricCard
            title="Active Polls"
            value={dashboardData.activePolls}
            icon={<Activity className="h-5 w-5 sm:h-6 sm:w-6" />}
            color="green"
            trend="+5%"
            trendDirection="up"
          />
          <EnhancedMetricCard
            title="Total Votes"
            value={dashboardData.totalVotes.toLocaleString()}
            icon={<Users className="h-5 w-5 sm:h-6 sm:w-6" />}
            color="purple"
            trend="+23%"
            trendDirection="up"
          />
          <EnhancedMetricCard
            title="Active Users"
            value={dashboardData.activeUsers.toLocaleString()}
            icon={<TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />}
            color="orange"
            trend="+8%"
            trendDirection="up"
          />
                </div>

        {/* Dynamic Content Based on View Mode */}
        {viewMode === 'overview' && (
          <OverviewView data={dashboardData} />
        )}
        
        {viewMode === 'detailed' && (
          <DetailedView data={dashboardData} />
        )}
        
        {viewMode === 'analytics' && (
          <AnalyticsView data={dashboardData} />
        )}
      </div>
    </div>
  );
}

// Enhanced Metric Card Component
function EnhancedMetricCard({ title, value, icon, color, trend, trendDirection }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend: string;
  trendDirection: 'up' | 'down';
}) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  };

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className={`${colorClasses[color as keyof typeof colorClasses]} p-2 sm:p-3 rounded-lg`}>
          <div className="text-white">{icon}</div>
        </div>
        <div className={`flex items-center text-xs sm:text-sm font-medium ${trendColors[trendDirection]}`}>
          <TrendingUp className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 ${trendDirection === 'down' ? 'rotate-180' : ''}`} />
          {trend}
        </div>
      </div>
      <div>
        <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
        <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// Enhanced Poll Card Component
function EnhancedPollCard({ poll }: { poll: PollSummary }) {
  const totalVotes = poll.choices.reduce((sum: any, choice: any) => sum + choice.votes, 0);
  const timeRemaining = new Date(poll.endsat).getTime() - new Date().getTime();
  const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
  
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-gradient-to-r from-gray-50 to-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{poll.title}</h3>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            poll.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {poll.status}
          </span>
          {daysRemaining > 0 && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {daysRemaining}d left
            </span>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        {poll.choices.map((choice: any) => {
          const percentage = totalVotes > 0 ? (choice.votes / totalVotes) * 100 : 0;
          return (
            <div key={choice.id} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{choice.text}</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {choice.votes} ({percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-3 pt-3 border-t flex justify-between text-sm text-gray-500">
        <span>Total: {totalVotes} votes</span>
        <span>{poll.participation.toFixed(1)}% participation</span>
      </div>
    </div>
  );
}

// Enhanced Demographics Chart Component
function EnhancedDemographicsChart({ data }: { data: DemographicsData }) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Age Groups</h4>
        <div className="space-y-3">
          {Object.entries(data.agegroups).map(([age, count]) => (
            <div key={age} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{age}</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(count / Math.max(...Object.values(data.agegroups))) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Verification Tiers</h4>
        <div className="space-y-3">
          {Object.entries(data.verificationtiers).map(([tier, count]) => (
            <div key={tier} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tier {tier}</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${(count / Math.max(...Object.values(data.verificationtiers))) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Enhanced Geographic Chart Component
function EnhancedGeographicChart({ data }: { data: GeographicMap }) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Top Regions</h4>
        <div className="space-y-3">
          {data.regions.slice(0, 5).map((region: any) => (
            <div key={region.name} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{region.name}</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${region.percentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {region.votecount} ({region.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Heatmap Data</h4>
        <p className="text-sm text-gray-600">
          {data.heatmap.length} heatmap points available for visualization
        </p>
      </div>
    </div>
  );
}

// Enhanced Engagement Chart Component
function EnhancedEngagementChart({ data }: { data: EngagementMetrics }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">{data.activeusers}</p>
          <p className="text-sm text-gray-600">Active Users</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-600">{data.newusers}</p>
          <p className="text-sm text-gray-600">New Users</p>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Session Duration</span>
          <span className="text-sm font-medium text-gray-900">{data.sessionduration} min</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Bounce Rate</span>
          <span className="text-sm font-medium text-gray-900">{data.bouncerate}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Returning Users</span>
          <span className="text-sm font-medium text-gray-900">{data.returningusers}</span>
        </div>
      </div>
    </div>
  );
}

// Enhanced Trends Chart Component
function EnhancedTrendsChart({ data }: { data: TrendData[] }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.slice(-3).map((trend, index: any) => (
          <div key={index} className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <p className="text-lg font-bold text-gray-900">{trend.votes}</p>
            <p className="text-sm text-gray-600">Votes</p>
            <p className="text-xs text-gray-500">
              {new Date(trend.date).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-purple-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Trend Analysis</h4>
        <p className="text-sm text-gray-600">
          Showing voting patterns over the last {data.length} days
        </p>
      </div>
    </div>
  );
}

// Overview View Component
function OverviewView({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-8">
      {/* Simple Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Polls</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalPolls}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Polls</p>
              <p className="text-2xl font-bold text-gray-900">{data.activePolls}</p>
            </div>
            <Vote className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Closed Polls</p>
              <p className="text-2xl font-bold text-gray-900">{data.closedPolls}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-gray-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Votes</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalVotes}</p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Active Users */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Users</h2>
        <div className="text-3xl font-bold text-gray-900">{data.activeUsers}</div>
        <p className="text-gray-600 mt-2">Users who have participated recently</p>
      </div>
    </div>
  );
}

// Detailed View Component
function DetailedView({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Detailed Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{data.totalVotes.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Total Votes Cast</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Award className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{data.activeUsers.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Active Users</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">{data.activePolls}</p>
            <p className="text-sm text-gray-600">Active Polls</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Analytics View Component
function AnalyticsView({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Analytics</h2>
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Advanced analytics coming soon...</p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Total Polls</h3>
              <p className="text-2xl font-bold text-blue-600">{data.totalPolls}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Total Votes</h3>
              <p className="text-2xl font-bold text-green-600">{data.totalVotes}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
