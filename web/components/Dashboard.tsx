'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { poApi } from '../src/lib/api';
import { 
  BarChart3, 
  Map, 
  Users, 
  TrendingUp, 
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
  Tablet
} from 'lucide-react';

interface DashboardData {
  polls: PollSummary[];
  overall_metrics: OverallMetrics;
  trends: TrendData[];
  geographic_map: GeographicMap;
  demographics: DemographicsData;
  engagement: EngagementMetrics;
}

interface PollSummary {
  id: string;
  title: string;
  status: string;
  total_votes: number;
  participation: number;
  created_at: string;
  ends_at: string;
  choices: Choice[];
}

interface Choice {
  id: string;
  text: string;
  votes: number;
}

interface OverallMetrics {
  total_polls: number;
  active_polls: number;
  total_votes: number;
  total_users: number;
  average_participation: number;
}

interface TrendData {
  date: string;
  votes: number;
  users: number;
  polls: number;
}

interface GeographicMap {
  regions: GeographicRegion[];
  countries: GeographicCountry[];
  heatmap: HeatmapPoint[];
}

interface GeographicRegion {
  name: string;
  vote_count: number;
  population: number;
  percentage: number;
  latitude: number;
  longitude: number;
}

interface GeographicCountry {
  code: string;
  name: string;
  vote_count: number;
  population: number;
  percentage: number;
}

interface HeatmapPoint {
  latitude: number;
  longitude: number;
  intensity: number;
}

interface DemographicsData {
  age_groups: Record<string, number>;
  genders: Record<string, number>;
  education: Record<string, number>;
  income: Record<string, number>;
  verification_tiers: Record<string, number>;
}

interface EngagementMetrics {
  active_users: number;
  new_users: number;
  returning_users: number;
  session_duration: number;
  bounce_rate: number;
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
      console.log('Fetching dashboard data...');
      const data = await poApi.getDashboardData();
      console.log('Dashboard data received:', data);
      setDashboardData(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
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
            <div>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Poll</label>
                <select
                  value={selectedPoll}
                  onChange={(e) => setSelectedPoll(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Polls</option>
                  {dashboardData.polls.map((poll) => (
                    <option key={poll.id} value={poll.id}>{poll.title}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <EnhancedMetricCard
            title="Total Polls"
            value={dashboardData.overall_metrics.total_polls}
            icon={<BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />}
            color="blue"
            trend="+12%"
            trendDirection="up"
          />
          <EnhancedMetricCard
            title="Active Polls"
            value={dashboardData.overall_metrics.active_polls}
            icon={<Activity className="h-5 w-5 sm:h-6 sm:w-6" />}
            color="green"
            trend="+5%"
            trendDirection="up"
          />
          <EnhancedMetricCard
            title="Total Votes"
            value={dashboardData.overall_metrics.total_votes.toLocaleString()}
            icon={<Users className="h-5 w-5 sm:h-6 sm:w-6" />}
            color="purple"
            trend="+23%"
            trendDirection="up"
          />
          <EnhancedMetricCard
            title="Avg Participation"
            value={`${dashboardData.overall_metrics.average_participation.toFixed(1)}%`}
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

// Metric Card Component
function MetricCard({ title, value, icon, color }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center">
        <div className={`${colorClasses[color as keyof typeof colorClasses]} p-3 rounded-lg`}>
          <div className="text-white">{icon}</div>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
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

// Poll Card Component
function PollCard({ poll }: { poll: PollSummary }) {
  const totalVotes = poll.choices.reduce((sum, choice) => sum + choice.votes, 0);
  
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{poll.title}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          poll.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {poll.status}
        </span>
      </div>
      
      <div className="space-y-2">
        {poll.choices.map((choice) => {
          const percentage = totalVotes > 0 ? (choice.votes / totalVotes) * 100 : 0;
          return (
            <div key={choice.id} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{choice.text}</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
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

// Enhanced Poll Card Component
function EnhancedPollCard({ poll }: { poll: PollSummary }) {
  const totalVotes = poll.choices.reduce((sum, choice) => sum + choice.votes, 0);
  const timeRemaining = new Date(poll.ends_at).getTime() - new Date().getTime();
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
        {poll.choices.map((choice) => {
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

// Demographics Chart Component
function DemographicsChart({ data }: { data: DemographicsData }) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-gray-900 mb-2">Age Groups</h4>
        <div className="space-y-2">
          {Object.entries(data.age_groups).map(([age, count]) => (
            <div key={age} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{age}</span>
              <span className="text-sm font-medium text-gray-900">{count}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h4 className="font-medium text-gray-900 mb-2">Verification Tiers</h4>
        <div className="space-y-2">
          {Object.entries(data.verification_tiers).map(([tier, count]) => (
            <div key={tier} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tier {tier}</span>
              <span className="text-sm font-medium text-gray-900">{count}</span>
            </div>
          ))}
        </div>
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
          {Object.entries(data.age_groups).map(([age, count]) => (
            <div key={age} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{age}</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(count / Math.max(...Object.values(data.age_groups))) * 100}%` }}
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
          {Object.entries(data.verification_tiers).map(([tier, count]) => (
            <div key={tier} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tier {tier}</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${(count / Math.max(...Object.values(data.verification_tiers))) * 100}%` }}
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

// Geographic Chart Component
function GeographicChart({ data }: { data: GeographicMap }) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-gray-900 mb-2">Top Regions</h4>
        <div className="space-y-2">
          {data.regions.slice(0, 5).map((region) => (
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
                  {region.vote_count} ({region.percentage.toFixed(1)}%)
                </span>
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
          {data.regions.slice(0, 5).map((region) => (
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
                  {region.vote_count} ({region.percentage.toFixed(1)}%)
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

// Engagement Chart Component
function EngagementChart({ data }: { data: EngagementMetrics }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">{data.active_users}</p>
          <p className="text-sm text-gray-600">Active Users</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-600">{data.new_users}</p>
          <p className="text-sm text-gray-600">New Users</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Session Duration</span>
          <span className="text-sm font-medium text-gray-900">{data.session_duration} min</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Bounce Rate</span>
          <span className="text-sm font-medium text-gray-900">{data.bounce_rate}%</span>
        </div>
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
          <p className="text-2xl font-bold text-blue-600">{data.active_users}</p>
          <p className="text-sm text-gray-600">Active Users</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-600">{data.new_users}</p>
          <p className="text-sm text-gray-600">New Users</p>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Session Duration</span>
          <span className="text-sm font-medium text-gray-900">{data.session_duration} min</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Bounce Rate</span>
          <span className="text-sm font-medium text-gray-900">{data.bounce_rate}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Returning Users</span>
          <span className="text-sm font-medium text-gray-900">{data.returning_users}</span>
        </div>
      </div>
    </div>
  );
}

// Trends Chart Component
function TrendsChart({ data }: { data: TrendData[] }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {data.slice(-3).map((trend, index) => (
          <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-lg font-bold text-gray-900">{trend.votes}</p>
            <p className="text-sm text-gray-600">Votes</p>
            <p className="text-xs text-gray-500">
              {new Date(trend.date).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Enhanced Trends Chart Component
function EnhancedTrendsChart({ data }: { data: TrendData[] }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.slice(-3).map((trend, index) => (
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Enhanced Poll Results */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Active Polls</h2>
            <Globe className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {data.polls.map((poll) => (
              <EnhancedPollCard key={poll.id} poll={poll} />
            ))}
          </div>
        </div>

        {/* Enhanced Demographics */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Demographics</h2>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <EnhancedDemographicsChart data={data.demographics} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Enhanced Geographic Data */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Geographic Distribution</h2>
            <Map className="h-5 w-5 text-gray-400" />
          </div>
          <EnhancedGeographicChart data={data.geographic_map} />
        </div>

        {/* Enhanced Engagement Metrics */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Engagement</h2>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <EnhancedEngagementChart data={data.engagement} />
        </div>
      </div>

      {/* Enhanced Trends */}
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Voting Trends</h2>
          <Clock className="h-5 w-5 text-gray-400" />
        </div>
        <EnhancedTrendsChart data={data.trends} />
      </div>
    </div>
  );
}

// Detailed View Component
function DetailedView({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Detailed Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{data.overall_metrics.total_votes.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Total Votes Cast</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Award className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{data.overall_metrics.total_users.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Unique Users</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">{data.overall_metrics.active_polls}</p>
            <p className="text-sm text-gray-600">Active Polls</p>
          </div>
        </div>
      </div>
      
      {/* Add more detailed components here */}
    </div>
  );
}

// Analytics View Component
function AnalyticsView({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Advanced Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Participation Rate</h3>
            <div className="flex items-center">
              <div className="flex-1 bg-gray-200 rounded-full h-2 mr-4">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${data.overall_metrics.average_participation}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900">
                {data.overall_metrics.average_participation.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">User Engagement</h3>
            <div className="flex items-center">
              <div className="flex-1 bg-gray-200 rounded-full h-2 mr-4">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${(data.engagement.active_users / data.overall_metrics.total_users) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900">
                {((data.engagement.active_users / data.overall_metrics.total_users) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add more analytics components here */}
    </div>
  );
}
