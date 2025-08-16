/**
 * Admin Dashboard
 * 
 * Main admin dashboard with system overview, metrics, and quick actions.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BarChart3, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Settings,
  Database,
  Shield,
  FileText,
  Flag,
  RefreshCw,
  Eye,
  EyeOff,
  Zap,
  Server,
  Globe,
  Smartphone,
  Monitor
} from 'lucide-react';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalPolls: number;
  activePolls: number;
  totalVotes: number;
  systemHealth: 'healthy' | 'warning' | 'error';
  uptime: string;
  lastBackup: string;
  storageUsed: string;
  storageTotal: string;
}

interface RecentActivity {
  id: string;
  type: 'user_registration' | 'poll_created' | 'vote_cast' | 'system_alert' | 'backup_completed';
  message: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

interface QuickAction {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  featureFlag: string;
  color: string;
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { isEnabled } = useFeatureFlags();

  const quickActions: QuickAction[] = [
    {
      id: 'users',
      name: 'Manage Users',
      description: 'View and manage user accounts',
      icon: Users,
      href: '/admin/users',
      featureFlag: 'admin',
      color: 'blue'
    },
    {
      id: 'polls',
      name: 'Manage Polls',
      description: 'Create and manage polls',
      icon: Activity,
      href: '/admin/polls',
      featureFlag: 'admin',
      color: 'green'
    },
    {
      id: 'feature-flags',
      name: 'Feature Flags',
      description: 'Manage feature flags',
      icon: Flag,
      href: '/admin/feature-flags',
      featureFlag: 'admin',
      color: 'purple'
    },
    {
      id: 'analytics',
      name: 'Analytics',
      description: 'View detailed analytics',
      icon: BarChart3,
      href: '/admin/analytics',
      featureFlag: 'analytics',
      color: 'orange'
    },
    {
      id: 'audit',
      name: 'Audit Logs',
      description: 'View system audit logs',
      icon: FileText,
      href: '/admin/audit',
      featureFlag: 'audit',
      color: 'red'
    },
    {
      id: 'system',
      name: 'System Settings',
      description: 'Configure system settings',
      icon: Settings,
      href: '/admin/system',
      featureFlag: 'admin',
      color: 'gray'
    }
  ];

  // Mock data - replace with actual API calls
  useEffect(() => {
    const fetchData = () => {
      setMetrics({
        totalUsers: 1247,
        activeUsers: 89,
        totalPolls: 156,
        activePolls: 23,
        totalVotes: 8942,
        systemHealth: 'healthy' as const,
        uptime: '99.9%',
        lastBackup: '2 hours ago',
        storageUsed: '2.4 GB',
        storageTotal: '10 GB'
      });

      setRecentActivity([
        {
          id: '1',
          type: 'user_registration',
          message: 'New user registered: john.doe@example.com',
          timestamp: '2 minutes ago',
          severity: 'info'
        },
        {
          id: '2',
          type: 'poll_created',
          message: 'New poll created: "Favorite Programming Language 2024"',
          timestamp: '15 minutes ago',
          severity: 'success'
        },
        {
          id: '3',
          type: 'vote_cast',
          message: 'High voting activity detected on poll #123',
          timestamp: '1 hour ago',
          severity: 'info'
        },
        {
          id: '4',
          type: 'backup_completed',
          message: 'System backup completed successfully',
          timestamp: '2 hours ago',
          severity: 'success'
        },
        {
          id: '5',
          type: 'system_alert',
          message: 'Database connection pool at 80% capacity',
          timestamp: '3 hours ago',
          severity: 'warning'
        }
      ]);

      setLoading(false);
    };

    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
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
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">System overview and management</p>
        </div>
        <div className="flex items-center space-x-4">
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
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">System Health</h2>
          <div className="flex items-center space-x-2">
            {getHealthIcon(metrics?.systemHealth || 'healthy')}
            <span className="text-sm font-medium text-gray-700">
              {metrics?.systemHealth === 'healthy' ? 'All Systems Operational' : 'System Issues Detected'}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{metrics?.uptime}</div>
            <div className="text-sm text-gray-600">Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{metrics?.lastBackup}</div>
            <div className="text-sm text-gray-600">Last Backup</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{metrics?.storageUsed}</div>
            <div className="text-sm text-gray-600">Storage Used</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{metrics?.storageTotal}</div>
            <div className="text-sm text-gray-600">Total Storage</div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{metrics?.totalUsers?.toLocaleString()}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>+12% from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{metrics?.activeUsers}</p>
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
              <p className="text-sm font-medium text-gray-600">Total Polls</p>
              <p className="text-2xl font-bold text-gray-900">{metrics?.totalPolls}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>+8% from last week</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Votes</p>
              <p className="text-2xl font-bold text-gray-900">{metrics?.totalVotes?.toLocaleString()}</p>
            </div>
            <Activity className="h-8 w-8 text-orange-600" />
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>+23% from last month</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions
              .filter(action => isEnabled(action.featureFlag))
              .map(action => (
                <a
                  key={action.id}
                  href={action.href}
                  className={`p-4 rounded-lg border-2 border-transparent hover:border-${action.color}-200 transition-colors group`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-${action.color}-100 group-hover:bg-${action.color}-200 transition-colors`}>
                      <action.icon className={`h-5 w-5 text-${action.color}-600`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{action.name}</h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                  </div>
                </a>
              ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map(activity => (
              <div
                key={activity.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border ${getSeverityColor(activity.severity)}`}
              >
                <div className="flex-shrink-0 mt-1">
                  {activity.severity === 'success' && <CheckCircle className="h-4 w-4" />}
                  {activity.severity === 'warning' && <AlertTriangle className="h-4 w-4" />}
                  {activity.severity === 'error' && <AlertTriangle className="h-4 w-4" />}
                  {activity.severity === 'info' && <Clock className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs opacity-75">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Environment</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Server className="h-4 w-4" />
                <span>Production</span>
              </div>
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>PostgreSQL 14</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>Node.js 18</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Features</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Flag className="h-4 w-4" />
                <span>Feature Flags: {isEnabled('admin') ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Security: Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Audit Logs: {isEnabled('audit') ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Access</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <span>Web: Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <Smartphone className="h-4 w-4" />
                <span>Mobile: Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <Monitor className="h-4 w-4" />
                <span>API: Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
