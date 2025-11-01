/**
 * Lazy-loaded Admin Dashboard Component
 * 
 * This component is loaded only when needed to reduce initial bundle size.
 * Includes comprehensive admin functionality with performance monitoring.
 */

import React, { Suspense, useState, useEffect } from 'react';

import { createLazyComponent } from '@/lib/performance/lazy-loading';
import { performanceMetrics } from '@/lib/performance/performance-metrics';

// Lazy load heavy admin components
const UserManagement = createLazyComponent(
  () => import('./UserManagement'),
  {
    fallback: <div className="p-4 bg-gray-100 rounded-lg animate-pulse">Loading user management...</div>,
    onLoad: () => performanceMetrics.addMetric('admin-user-management-loaded', 1),
  }
);

const AnalyticsPanel = createLazyComponent(
  () => import('./AnalyticsPanel'),
  {
    fallback: <div className="p-4 bg-gray-100 rounded-lg animate-pulse">Loading analytics...</div>,
    onLoad: () => performanceMetrics.addMetric('admin-analytics-loaded', 1),
  }
);

const SystemSettings = createLazyComponent(
  () => import('./SystemSettings'),
  {
    fallback: <div className="p-4 bg-gray-100 rounded-lg animate-pulse">Loading system settings...</div>,
    onLoad: () => performanceMetrics.addMetric('admin-system-settings-loaded', 1),
  }
);

const AuditLogs = createLazyComponent(
  () => import('./AuditLogs'),
  {
    fallback: <div className="p-4 bg-gray-100 rounded-lg animate-pulse">Loading audit logs...</div>,
    onLoad: () => performanceMetrics.addMetric('admin-audit-logs-loaded', 1),
  }
);

type AdminDashboardProps = {
  user: {
    id: string;
    email: string;
    role: 'admin' | 'moderator' | 'user';
  };
  onLogout: () => void;
}

type DashboardStats = {
  totalUsers: number;
  activePolls: number;
  totalVotes: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'analytics' | 'settings' | 'audit'>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Track admin dashboard load time
    const startTime = performance.now();
    
    // Simulate loading dashboard stats
    const loadStats = async () => {
      try {
        // This would typically fetch from an API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setStats({
          totalUsers: 1250,
          activePolls: 23,
          totalVotes: 15600,
          systemHealth: 'healthy',
        });
        
        const loadTime = performance.now() - startTime;
        performanceMetrics.addMetric('admin-dashboard-load', loadTime);
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
        performanceMetrics.addMetric('admin-dashboard-error', 1);
      } finally {
        setLoading(false);
      }
    };
    
    loadStats();
  }, []);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    performanceMetrics.addMetric('admin-tab-switch', 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user.email}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Role: {user.role}</span>
              <button
                onClick={onLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'users', label: 'Users' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'settings', label: 'Settings' },
              { id: 'audit', label: 'Audit Logs' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as typeof activeTab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
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
                    <p className="text-2xl font-semibold text-gray-900">{stats?.totalUsers.toLocaleString()}</p>
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
                    <p className="text-2xl font-semibold text-gray-900">{stats?.activePolls}</p>
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
                    <p className="text-2xl font-semibold text-gray-900">{stats?.totalVotes.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${
                    stats?.systemHealth === 'healthy' ? 'bg-green-100' :
                    stats?.systemHealth === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    <svg className={`w-6 h-6 ${
                      stats?.systemHealth === 'healthy' ? 'text-green-600' :
                      stats?.systemHealth === 'warning' ? 'text-yellow-600' : 'text-red-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">System Health</p>
                    <p className={`text-2xl font-semibold capitalize ${
                      stats?.systemHealth === 'healthy' ? 'text-green-600' :
                      stats?.systemHealth === 'warning' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {stats?.systemHealth}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                  <div className="text-center">
                    <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <p className="text-sm font-medium text-gray-600">Create New Poll</p>
                  </div>
                </button>
                <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                  <div className="text-center">
                    <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-600">Manage Users</p>
                  </div>
                </button>
                <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                  <div className="text-center">
                    <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-600">View Analytics</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <Suspense fallback={<div className="p-4 bg-gray-100 rounded-lg animate-pulse">Loading user management...</div>}>
            <UserManagement />
          </Suspense>
        )}

        {activeTab === 'analytics' && (
          <Suspense fallback={<div className="p-4 bg-gray-100 rounded-lg animate-pulse">Loading analytics...</div>}>
            <AnalyticsPanel />
          </Suspense>
        )}

        {activeTab === 'settings' && (
          <Suspense fallback={<div className="p-4 bg-gray-100 rounded-lg animate-pulse">Loading system settings...</div>}>
            <SystemSettings />
          </Suspense>
        )}

        {activeTab === 'audit' && (
          <Suspense fallback={<div className="p-4 bg-gray-100 rounded-lg animate-pulse">Loading audit logs...</div>}>
            <AuditLogs />
          </Suspense>
        )}
      </main>
    </div>
  );
}
