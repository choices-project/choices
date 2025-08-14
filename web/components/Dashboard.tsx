'use client';

import React, { useState, useEffect } from 'react';
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
  RefreshCw
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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8082/api/v1/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await response.json();
      setDashboardData(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading && !dashboardData) {
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Real-Time Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Live voting analytics and insights
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="text-sm font-medium text-gray-900">
                  {lastUpdated.toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={fetchDashboardData}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                title="Refresh Data"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Polls"
            value={dashboardData.overall_metrics.total_polls}
            icon={<BarChart3 className="h-6 w-6" />}
            color="blue"
          />
          <MetricCard
            title="Active Polls"
            value={dashboardData.overall_metrics.active_polls}
            icon={<Activity className="h-6 w-6" />}
            color="green"
          />
          <MetricCard
            title="Total Votes"
            value={dashboardData.overall_metrics.total_votes.toLocaleString()}
            icon={<Users className="h-6 w-6" />}
            color="purple"
          />
          <MetricCard
            title="Avg Participation"
            value={`${dashboardData.overall_metrics.average_participation.toFixed(1)}%`}
            icon={<TrendingUp className="h-6 w-6" />}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Poll Results */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Active Polls</h2>
              <Globe className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {dashboardData.polls.map((poll) => (
                <PollCard key={poll.id} poll={poll} />
              ))}
            </div>
          </div>

          {/* Demographics */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Demographics</h2>
              <PieChart className="h-5 w-5 text-gray-400" />
            </div>
            <DemographicsChart data={dashboardData.demographics} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Geographic Data */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Geographic Distribution</h2>
              <Map className="h-5 w-5 text-gray-400" />
            </div>
            <GeographicChart data={dashboardData.geographic_map} />
          </div>

          {/* Engagement Metrics */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Engagement</h2>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            <EngagementChart data={dashboardData.engagement} />
          </div>
        </div>

        {/* Trends */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Voting Trends</h2>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          <TrendsChart data={dashboardData.trends} />
        </div>
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

// Trends Chart Component
function TrendsChart({ data }: { data: TrendData[] }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
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
