'use client';

/**
 * Comprehensive Admin Dashboard Component
 * 
 * Unified admin command center featuring:
 * - Real-time platform analytics and metrics
 * - Site messages management and preview
 * - User management and activity monitoring
 * - System health and performance metrics
 * - Quick actions for common admin tasks
 * 
 * Created: January 19, 2025
 * Updated: October 19, 2025
 * Status: ✅ ACTIVE
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Users,
  BarChart3,
  MessageSquare,
  Activity,
  Settings,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Upload,
  Bell,
  Globe,
  Database,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Lock,
  Unlock
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logger } from '@/lib/utils/logger';

interface PlatformAnalytics {
  totalUsers: number;
  totalPolls: number;
  totalVotes: number;
  activePolls: number;
  totalFeedback: number;
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    responseTime: number;
    errorRate: number;
  };
  engagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    participationRate: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'user_registration' | 'poll_created' | 'vote_cast' | 'feedback_submitted';
    description: string;
    timestamp: string;
    user_id?: string;
  }>;
}

interface SiteMessage {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high' | 'critical';
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

interface SystemMetrics {
  database: {
    connections: number;
    queryTime: number;
    cacheHitRate: number;
  };
  server: {
    cpu: number;
    memory: number;
    disk: number;
    uptime: number;
  };
  performance: {
    avgResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
  };
}

interface ComprehensiveAdminDashboardProps {
  className?: string;
}

export default function ComprehensiveAdminDashboard({ className = '' }: ComprehensiveAdminDashboardProps) {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [siteMessages, setSiteMessages] = useState<SiteMessage[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Admin dashboard preferences
  const [showSystemHealth, setShowSystemHealth] = useState(true);
  const [showUserManagement, setShowUserManagement] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [showSiteMessages, setShowSiteMessages] = useState(true);

  // Load platform analytics with optimized API
  const loadPlatformAnalytics = useCallback(async () => {
    try {
      console.log('🌐 Fetching optimized admin dashboard data...');
      const startTime = Date.now();
      const response = await fetch('/api/admin/dashboard?include=overview,analytics,health,activity');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      const loadTime = Date.now() - startTime;
      console.log(`⚡ Admin dashboard loaded in ${loadTime}ms`);
      
      // Transform optimized data to match existing interface
      const transformedAnalytics: PlatformAnalytics = {
        totalUsers: data.overview?.total_users || 0,
        totalPolls: data.overview?.total_polls || 0,
        totalVotes: data.overview?.total_votes || 0,
        activePolls: data.overview?.active_polls || 0,
        totalFeedback: 0, // Would need separate query
        systemHealth: {
          status: data.system_health?.status === 'operational' ? 'healthy' : 'warning',
          uptime: data.system_health?.uptime_percentage || 0,
          responseTime: data.system_health?.database_latency_ms || 0,
          errorRate: 0 // Would need calculation
        },
        engagement: {
          dailyActiveUsers: 0, // Would need separate query
          weeklyActiveUsers: 0, // Would need separate query
          monthlyActiveUsers: 0, // Would need separate query
          participationRate: data.overview?.engagement_rate || 0
        },
        recentActivity: data.recent_activity?.recent_votes?.map((vote: any) => ({
          id: vote.id,
          type: 'vote_cast' as const,
          description: `User voted on poll ${vote.poll_id}`,
          timestamp: vote.created_at,
          user_id: vote.user_id
        })) || []
      };
      
      setAnalytics(transformedAnalytics);
      logger.info('Platform analytics loaded', { 
        analytics: transformedAnalytics,
        loadTime,
        fromCache: data.fromCache
      });
    } catch (error) {
      logger.error('Error loading platform analytics:', error as Error);
      setError('Failed to load platform analytics');
    }
  }, []);

  // Load site messages
  const loadSiteMessages = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/site-messages');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSiteMessages(data || []);
      logger.info('Site messages loaded', { count: data?.length || 0 });
            } catch (error) {
              logger.error('Error loading site messages:', error as Error);
            }
  }, []);

  // Load system metrics
  const loadSystemMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/health?type=status');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSystemMetrics(data);
      logger.info('System metrics loaded', { metrics: data });
            } catch (error) {
              logger.error('Error loading system metrics:', error as Error);
            }
  }, []);

  // Load dashboard data once on mount - no auto-refresh
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      
      // Load analytics first (most important)
      try {
        await loadPlatformAnalytics();
        setIsLoading(false); // Show dashboard as soon as analytics load
      } catch (error) {
        logger.error('Error loading platform analytics:', error as Error);
        setError('Failed to load platform analytics');
        setIsLoading(false);
      }
      
      // Load other data in background (non-blocking)
      loadSiteMessages().catch(error => {
        logger.error('Error loading site messages:', error as Error);
        // Don't set error state for site messages - it's not critical
      });
      
      loadSystemMetrics().catch(error => {
        logger.error('Error loading system metrics:', error as Error);
        // Don't set error state for system metrics - it's not critical
      });
    };

    loadDashboardData();
  }, []); // Only run once on mount

  // Auto-refresh effect (only when enabled)
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(async () => {
      setIsRefreshing(true);
      try {
        await Promise.all([
          loadPlatformAnalytics(),
          loadSiteMessages(),
          loadSystemMetrics()
        ]);
      } catch (error) {
        logger.error('Error in auto-refresh:', error as Error);
      } finally {
        setIsRefreshing(false);
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, loadPlatformAnalytics, loadSiteMessages, loadSystemMetrics]);

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadPlatformAnalytics(),
        loadSiteMessages(),
        loadSystemMetrics()
      ]);
    } catch (error) {
      logger.error('Error refreshing dashboard:', error as Error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Quick actions
  const quickActions = [
    {
      id: 'create-message',
      label: 'Create Site Message',
      icon: Plus,
      action: () => setShowMessageForm(true),
      description: 'Create a new site-wide message'
    },
    {
      id: 'view-users',
      label: 'Manage Users',
      icon: Users,
      href: '/admin/users',
      description: 'View and manage user accounts'
    },
    {
      id: 'view-feedback',
      label: 'Review Feedback',
      icon: MessageSquare,
      href: '/admin/feedback',
      description: 'Review user feedback and suggestions'
    },
    {
      id: 'system-status',
      label: 'System Status',
      icon: Server,
      href: '/admin/system',
      description: 'Monitor system health and performance'
    }
  ];

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Platform management and monitoring</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto-refresh
            </label>
            {autoRefresh && (
              <Badge variant="outline" className="text-xs">
                Every 30s
              </Badge>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Badge 
            variant={analytics?.systemHealth.status === 'healthy' ? 'default' : 'destructive'}
            className="flex items-center gap-2"
          >
            {analytics?.systemHealth.status === 'healthy' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            System {analytics?.systemHealth.status || 'unknown'}
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="messages">Site Messages</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{analytics?.engagement.dailyActiveUsers || 0} today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Polls</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalPolls || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.activePolls || 0} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalVotes || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.engagement.participationRate || 0}% participation
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                {analytics?.systemHealth.status === 'healthy' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">
                  {analytics?.systemHealth.status || 'unknown'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.systemHealth.uptime || 0}% uptime
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common administrative tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.id}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center gap-2"
                      onClick={action.action || (() => window.location.href = action.href!)}
                    >
                      <Icon className="h-6 w-6" />
                      <div className="text-center">
                        <div className="font-medium">{action.label}</div>
                        <div className="text-xs text-gray-500">{action.description}</div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest platform activity and events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.recentActivity?.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{activity.description}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
                <CardDescription>User activity and participation metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Daily Active Users</span>
                    <span className="font-medium">{analytics?.engagement.dailyActiveUsers || 0}</span>
                  </div>
                  <Progress value={(analytics?.engagement.dailyActiveUsers || 0) / 100 * 100} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Weekly Active Users</span>
                    <span className="font-medium">{analytics?.engagement.weeklyActiveUsers || 0}</span>
                  </div>
                  <Progress value={(analytics?.engagement.weeklyActiveUsers || 0) / 100 * 100} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Participation Rate</span>
                    <span className="font-medium">{analytics?.engagement.participationRate || 0}%</span>
                  </div>
                  <Progress value={analytics?.engagement.participationRate || 0} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>Platform performance and health metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uptime</span>
                    <span className="font-medium">{analytics?.systemHealth.uptime || 0}%</span>
                  </div>
                  <Progress value={analytics?.systemHealth.uptime || 0} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Response Time</span>
                    <span className="font-medium">{analytics?.systemHealth.responseTime || 0}ms</span>
                  </div>
                  <Progress value={100 - (analytics?.systemHealth.responseTime || 0) / 10} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Error Rate</span>
                    <span className="font-medium">{analytics?.systemHealth.errorRate || 0}%</span>
                  </div>
                  <Progress value={100 - (analytics?.systemHealth.errorRate || 0)} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Site Messages Tab */}
        <TabsContent value="messages" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Site Messages</h3>
              <p className="text-sm text-gray-600">Manage site-wide messages and announcements</p>
            </div>
            <Button onClick={() => setShowMessageForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Message
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {siteMessages.map((message) => (
              <Card key={message.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{message.title}</h4>
                        <Badge variant={message.is_active ? 'default' : 'secondary'}>
                          {message.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">{message.type}</Badge>
                        <Badge variant="outline">{message.priority}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{message.content}</p>
                      <div className="text-xs text-gray-500">
                        Created: {new Date(message.created_at).toLocaleString()}
                        {message.updated_at !== message.created_at && (
                          <span> • Updated: {new Date(message.updated_at).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active Connections</span>
                    <span className="font-medium">{systemMetrics?.database.connections || 0}</span>
                  </div>
                  <Progress value={(systemMetrics?.database.connections || 0) / 100 * 100} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Query Time</span>
                    <span className="font-medium">{systemMetrics?.database.queryTime || 0}ms</span>
                  </div>
                  <Progress value={100 - (systemMetrics?.database.queryTime || 0) / 10} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Cache Hit Rate</span>
                    <span className="font-medium">{systemMetrics?.database.cacheHitRate || 0}%</span>
                  </div>
                  <Progress value={systemMetrics?.database.cacheHitRate || 0} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Server Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>CPU Usage</span>
                    <span className="font-medium">{systemMetrics?.server.cpu || 0}%</span>
                  </div>
                  <Progress value={systemMetrics?.server.cpu || 0} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Memory Usage</span>
                    <span className="font-medium">{systemMetrics?.server.memory || 0}%</span>
                  </div>
                  <Progress value={systemMetrics?.server.memory || 0} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Disk Usage</span>
                    <span className="font-medium">{systemMetrics?.server.disk || 0}%</span>
                  </div>
                  <Progress value={systemMetrics?.server.disk || 0} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
