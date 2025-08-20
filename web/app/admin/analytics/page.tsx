/**
 * Analytics Page
 * 
 * Admin interface for detailed analytics and insights.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity, 
  Calendar,
  Download,
  RefreshCw,
  PieChart,
  LineChart,
  Map,
  Clock,
  Target,
  Award
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalPolls: number;
    activePolls: number;
    totalVotes: number;
    averageParticipation: number;
  };
  trends: {
    date: string;
    users: number;
    polls: number;
    votes: number;
  }[];
  demographics: {
    ageGroups: { age: string; count: number; percentage: number }[];
    locations: { location: string; count: number; percentage: number }[];
    devices: { device: string; count: number; percentage: number }[];
  };
  topPolls: {
    id: string;
    title: string;
    votes: number;
    participants: number;
    category: string;
  }[];
  userActivity: {
    timeSlot: string;
    activeUsers: number;
    newRegistrations: number;
  }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const fetchAnalytics = () => {
      const mockData: AnalyticsData = {
        overview: {
          totalUsers: 1247,
          activeUsers: 89,
          totalPolls: 156,
          activePolls: 23,
          totalVotes: 8942,
          averageParticipation: 78.5
        },
        trends: [
          { date: '2024-12-13', users: 120, polls: 5, votes: 234 },
          { date: '2024-12-14', users: 135, polls: 8, votes: 345 },
          { date: '2024-12-15', users: 142, polls: 12, votes: 456 },
          { date: '2024-12-16', users: 156, polls: 15, votes: 567 },
          { date: '2024-12-17', users: 168, polls: 18, votes: 678 },
          { date: '2024-12-18', users: 175, polls: 22, votes: 789 },
          { date: '2024-12-19', users: 189, polls: 23, votes: 892 }
        ],
        demographics: {
          ageGroups: [
            { age: '18-24', count: 234, percentage: 18.8 },
            { age: '25-34', count: 456, percentage: 36.6 },
            { age: '35-44', count: 345, percentage: 27.7 },
            { age: '45-54', count: 156, percentage: 12.5 },
            { age: '55+', count: 56, percentage: 4.5 }
          ],
          locations: [
            { location: 'United States', count: 567, percentage: 45.5 },
            { location: 'United Kingdom', count: 234, percentage: 18.8 },
            { location: 'Canada', count: 123, percentage: 9.9 },
            { location: 'Germany', count: 89, percentage: 7.1 },
            { location: 'Other', count: 234, percentage: 18.8 }
          ],
          devices: [
            { device: 'Desktop', count: 678, percentage: 54.4 },
            { device: 'Mobile', count: 445, percentage: 35.7 },
            { device: 'Tablet', count: 124, percentage: 9.9 }
          ]
        },
        topPolls: [
          { id: '1', title: 'Favorite Programming Language 2024', votes: 1247, participants: 892, category: 'Technology' },
          { id: '2', title: 'Best Pizza Topping', votes: 567, participants: 445, category: 'Food' },
          { id: '3', title: 'Climate Change Awareness', votes: 2341, participants: 1892, category: 'Environment' },
          { id: '4', title: 'Remote Work Preferences', votes: 234, participants: 189, category: 'Work' },
          { id: '5', title: 'Mobile App Usage', votes: 892, participants: 567, category: 'Technology' }
        ],
        userActivity: [
          { timeSlot: '00:00', activeUsers: 12, newRegistrations: 2 },
          { timeSlot: '04:00', activeUsers: 8, newRegistrations: 1 },
          { timeSlot: '08:00', activeUsers: 45, newRegistrations: 8 },
          { timeSlot: '12:00', activeUsers: 78, newRegistrations: 12 },
          { timeSlot: '16:00', activeUsers: 92, newRegistrations: 15 },
          { timeSlot: '20:00', activeUsers: 67, newRegistrations: 9 }
        ]
      };

      setData(mockData);
      setLoading(false);
    };

    fetchAnalytics();

    if (autoRefresh) {
      const interval = setInterval(fetchAnalytics, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [autoRefresh, timeRange]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_: any, i: any) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Detailed insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              autoRefresh 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            <span>Auto-refresh {autoRefresh ? 'ON' : 'OFF'}</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{data?.overview.totalUsers.toLocaleString()}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>+12% from last period</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{data?.overview.activeUsers}</p>
            </div>
            <Activity className="h-8 w-8 text-green-600" />
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>+5% from yesterday</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Votes</p>
              <p className="text-2xl font-bold text-gray-900">{data?.overview.totalVotes.toLocaleString()}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>+23% from last period</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Participation</p>
              <p className="text-2xl font-bold text-gray-900">{data?.overview.averageParticipation}%</p>
            </div>
            <Target className="h-8 w-8 text-orange-600" />
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>+8% from last period</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Trends Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Activity Trends</h2>
            <LineChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {data?.trends.map((trend: any, index: any) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">{trend.date}</span>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <span className="text-blue-600">{trend.users} users</span>
                  <span className="text-green-600">{trend.polls} polls</span>
                  <span className="text-purple-600">{trend.votes} votes</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Polls */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Top Performing Polls</h2>
            <Award className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {data?.topPolls.map((poll: any) => (
              <div key={poll.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900 truncate">{poll.title}</h3>
                  <p className="text-xs text-gray-500">{poll.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{poll.votes.toLocaleString()} votes</p>
                  <p className="text-xs text-gray-500">{poll.participants} participants</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Demographics - Age */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Age Distribution</h2>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {data?.demographics.ageGroups.map((group: any, index: any) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{group.age}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${group.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{group.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demographics - Location */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Geographic Distribution</h2>
            <Map className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {data?.demographics.locations.map((location: any, index: any) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{location.location}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${location.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{location.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demographics - Devices */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Device Usage</h2>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {data?.demographics.devices.map((device: any, index: any) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{device.device}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${device.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{device.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Activity Timeline */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">User Activity Timeline</h2>
          <Clock className="h-5 w-5 text-gray-400" />
        </div>
        <div className="grid grid-cols-6 gap-4">
          {data?.userActivity.map((activity: any, index: any) => (
            <div key={index} className="text-center">
              <div className="bg-blue-100 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900">{activity.timeSlot}</p>
                <p className="text-lg font-bold text-blue-600">{activity.activeUsers}</p>
                <p className="text-xs text-gray-500">active users</p>
                <p className="text-xs text-green-600 mt-1">+{activity.newRegistrations} new</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
