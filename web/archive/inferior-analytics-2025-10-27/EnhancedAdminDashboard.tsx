/**
 * Enhanced Admin Dashboard Component
 * Leverages our comprehensive schema for powerful admin capabilities
 * Created: 2025-10-27
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEnhancedAnalytics } from '@/lib/services/enhanced-analytics';

interface DashboardData {
  platformMetrics: any;
  systemHealth: any[];
  activeSessions: number;
  featureUsage: [string, number][];
  siteMessages: any[];
  generatedAt: string;
}

interface SystemHealthItem {
  service_name: string;
  health_status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  response_time?: number;
  error_rate?: number;
  uptime_percentage?: number;
  last_check: string;
}

export function EnhancedAdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7 days');

  const analytics = useEnhancedAnalytics();

  useEffect(() => {
    loadDashboardData();
  }, [selectedTimeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/analytics/enhanced?type=dashboard&time_range=${selectedTimeRange}`);
      const result = await response.json();
      
      if (result.success) {
        setDashboardData(result.data);
      } else {
        setError(result.error || 'Failed to load dashboard data');
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'unhealthy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getHealthStatusText = (status: string) => {
    switch (status) {
      case 'healthy': return 'Healthy';
      case 'degraded': return 'Degraded';
      case 'unhealthy': return 'Unhealthy';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!dashboardData) {
    return (
      <Alert className="m-4">
        <AlertDescription>No dashboard data available</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Enhanced Admin Dashboard</h1>
        <div className="flex gap-2">
          <select 
            value={selectedTimeRange} 
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="1 hour">Last Hour</option>
            <option value="24 hours">Last 24 Hours</option>
            <option value="7 days">Last 7 Days</option>
            <option value="30 days">Last 30 Days</option>
          </select>
          <Button onClick={loadDashboardData} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="messages">Site Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <div className="h-4 w-4 text-muted-foreground">👥</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.activeSessions}</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 minutes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <div className="h-4 w-4 text-muted-foreground">🏥</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.systemHealth.filter(h => h.health_status === 'healthy').length}/
                  {dashboardData.systemHealth.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Services healthy
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Messages</CardTitle>
                <div className="h-4 w-4 text-muted-foreground">📢</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.siteMessages.length}</div>
                <p className="text-xs text-muted-foreground">
                  Site messages active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Feature</CardTitle>
                <div className="h-4 w-4 text-muted-foreground">⭐</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.featureUsage[0]?.[0] || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.featureUsage[0]?.[1] || 0} uses
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Features ({selectedTimeRange})</CardTitle>
                <CardDescription>Most used features by users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboardData.featureUsage.map(([feature, count], index) => (
                    <div key={feature} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{feature}</span>
                      <Badge variant="secondary">{count} uses</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboardData.platformMetrics && (
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>Total Value:</span>
                        <span>{dashboardData.platformMetrics.total_value || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Value:</span>
                        <span>{dashboardData.platformMetrics.avg_value || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Record Count:</span>
                        <span>{dashboardData.platformMetrics.count_records || 'N/A'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Health Status</CardTitle>
              <CardDescription>Real-time system monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.systemHealth.map((service: SystemHealthItem) => (
                  <div key={service.service_name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getHealthStatusColor(service.health_status)}`}></div>
                      <div>
                        <div className="font-medium">{service.service_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Last checked: {new Date(service.last_check).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={service.health_status === 'healthy' ? 'default' : 'destructive'}>
                        {getHealthStatusText(service.health_status)}
                      </Badge>
                      {service.response_time && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {service.response_time}ms
                        </div>
                      )}
                      {service.uptime_percentage && (
                        <div className="text-sm text-muted-foreground">
                          {service.uptime_percentage}% uptime
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>Comprehensive platform analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Advanced analytics features coming soon...
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  This will include poll analytics, trust tier analysis, and bot detection insights.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Site Messages</CardTitle>
              <CardDescription>Current announcements and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.siteMessages.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No active site messages
                  </p>
                ) : (
                  dashboardData.siteMessages.map((message) => (
                    <div key={message.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{message.title}</h3>
                        <Badge variant={message.priority === 'urgent' ? 'destructive' : 'secondary'}>
                          {message.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{message.message}</p>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Target: {message.target_audience}</span>
                        <span>Created: {new Date(message.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-xs text-muted-foreground text-center">
        Dashboard generated at: {new Date(dashboardData.generatedAt).toLocaleString()}
      </div>
    </div>
  );
}
