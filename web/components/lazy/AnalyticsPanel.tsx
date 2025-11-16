/**
 * Lazy-loaded Analytics Panel Component
 * 
 * This component provides comprehensive analytics and reporting functionality.
 * It's loaded only when needed to reduce initial bundle size.
 */

import React, { useState, useEffect, Suspense } from 'react';
import { 
  ResponsiveContainer,
  LineChart,
  BarChart,
  PieChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  Bar,
  Pie
} from 'recharts';

import { performanceMetrics } from '@/lib/performance/performance-metrics';
import logger from '@/lib/utils/logger';

type AnalyticsData = {
  userGrowth: Array<{ date: string; users: number }>;
  pollActivity: Array<{ date: string; polls: number; votes: number }>;
  votingMethods: Array<{ method: string; count: number; percentage: number }>;
  systemPerformance: {
    averageResponseTime: number;
    uptime: number;
    errorRate: number;
  };
}

type AnalyticsPanelProps = {
  dateRange?: {
    start: Date;
    end: Date;
  };
  refreshInterval?: number;
}

export default function AnalyticsPanel({ 
  refreshInterval = 30000 
}: AnalyticsPanelProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'users' | 'polls' | 'votes' | 'performance'>('users');

  useEffect(() => {
    const startTime = performance.now();
    
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data - in real implementation, this would come from an API
        const mockData: AnalyticsData = {
          userGrowth: [
            { date: '2025-01-01', users: 1000 },
            { date: '2025-01-02', users: 1050 },
            { date: '2025-01-03', users: 1100 },
            { date: '2025-01-04', users: 1150 },
            { date: '2025-01-05', users: 1200 },
            { date: '2025-01-06', users: 1250 },
            { date: '2025-01-07', users: 1300 },
          ],
          pollActivity: [
            { date: '2025-01-01', polls: 5, votes: 150 },
            { date: '2025-01-02', polls: 8, votes: 200 },
            { date: '2025-01-03', polls: 12, votes: 300 },
            { date: '2025-01-04', polls: 15, votes: 400 },
            { date: '2025-01-05', polls: 18, votes: 500 },
            { date: '2025-01-06', polls: 20, votes: 600 },
            { date: '2025-01-07', polls: 23, votes: 700 },
          ],
          votingMethods: [
            { method: 'Single Choice', count: 45, percentage: 35 },
            { method: 'Approval', count: 30, percentage: 23 },
            { method: 'Ranked', count: 25, percentage: 19 },
            { method: 'Quadratic', count: 20, percentage: 15 },
            { method: 'Range', count: 10, percentage: 8 },
          ],
          systemPerformance: {
            averageResponseTime: 120,
            uptime: 99.9,
            errorRate: 0.1,
          },
        };
        
        setData(mockData);
        
        const loadTime = performance.now() - startTime;
        performanceMetrics.addMetric('analytics-panel-load', loadTime);
      } catch (err) {
        setError('Failed to load analytics data');
        performanceMetrics.addMetric('analytics-panel-error', 1);
        logger.error('Analytics load error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadAnalytics();
    
    // Set up auto-refresh
    const interval = setInterval(loadAnalytics, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const handleMetricChange = (metric: typeof selectedMetric) => {
    setSelectedMetric(metric);
    performanceMetrics.addMetric('analytics-metric-switch', 1);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-8 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-lg font-medium text-red-800">Error Loading Analytics</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Last updated:</span>
          <span className="text-sm font-medium text-gray-900">
            {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Metric Selector */}
      <div className="flex space-x-4">
        {[
          { id: 'users', label: 'User Growth' },
          { id: 'polls', label: 'Poll Activity' },
          { id: 'votes', label: 'Voting Methods' },
          { id: 'performance', label: 'System Performance' },
        ].map((metric) => (
          <button
            key={metric.id}
            onClick={() => handleMetricChange(metric.id as typeof selectedMetric)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedMetric === metric.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {metric.label}
          </button>
        ))}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.userGrowth[data.userGrowth.length - 1]?.users.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Polls</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.pollActivity[data.pollActivity.length - 1]?.polls}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Votes</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.pollActivity[data.pollActivity.length - 1]?.votes.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.systemPerformance.averageResponseTime}ms
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        {selectedMetric === 'users' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
            <Suspense fallback={<div className="h-64 bg-gray-100 rounded animate-pulse" />}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.userGrowth}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Users"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Suspense>
          </div>
        )}

        {/* Poll Activity Chart */}
        {selectedMetric === 'polls' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Poll Activity</h3>
            <Suspense fallback={<div className="h-64 bg-gray-100 rounded animate-pulse" />}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.pollActivity}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="polls" fill="#10B981" name="Polls" />
                  <Bar dataKey="votes" fill="#8B5CF6" name="Votes" />
                </BarChart>
              </ResponsiveContainer>
            </Suspense>
          </div>
        )}

        {/* Voting Methods Chart */}
        {selectedMetric === 'votes' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Voting Methods Distribution</h3>
            <Suspense fallback={<div className="h-64 bg-gray-100 rounded animate-pulse" />}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.votingMethods}
                    dataKey="count"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label={({ method, percentage }: { method: string; percentage: number }) => `${method}: ${percentage}%`}
                  />
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Suspense>
          </div>
        )}

        {/* System Performance */}
        {selectedMetric === 'performance' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Performance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">Average Response Time</span>
                <span className="text-lg font-semibold text-gray-900">
                  {data.systemPerformance.averageResponseTime}ms
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">Uptime</span>
                <span className="text-lg font-semibold text-green-600">
                  {data.systemPerformance.uptime}%
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">Error Rate</span>
                <span className="text-lg font-semibold text-red-600">
                  {data.systemPerformance.errorRate}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
