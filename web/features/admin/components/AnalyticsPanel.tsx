/**
 * Analytics Panel Component - Store-Integrated Version
 * 
 * This component uses the analytics store for better state management
 * and integration with the enhanced analytics system.
 */

import React, { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalyticsStore } from '@/lib/stores/analyticsStore';
import { logger } from '@/lib/utils/logger';

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
  refreshInterval?: number;
}

export default function AnalyticsPanel({ 
  refreshInterval = 30000 
}: AnalyticsPanelProps) {
  const [selectedMetric, setSelectedMetric] = useState<'users' | 'polls' | 'votes' | 'performance'>('users');

  // Use analytics store instead of local state
  const {
    dashboard,
    performanceMetrics,
    userBehavior,
    isLoading: storeLoading,
    error: storeError,
    setDashboard,
    setPerformanceMetrics,
    updateUserBehavior
  } = useAnalyticsStore();

  // Fetch data when component mounts or metric changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch analytics data and update store
        const response = await fetch('/api/analytics?type=general');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update store with fetched data
        if (data.dashboard) {
          setDashboard(data.dashboard);
        }
        if (data.performanceMetrics) {
          setPerformanceMetrics(data.performanceMetrics);
        }
        if (data.userBehavior) {
          updateUserBehavior(data.userBehavior);
        }
        
        logger.info('Analytics data loaded and stored successfully');
      } catch (err) {
        logger.error('Analytics fetch error:', err);
      }
    };

    fetchData();

    // Set up refresh interval
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [selectedMetric, refreshInterval, setDashboard, setPerformanceMetrics, updateUserBehavior]);

  if (storeLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (storeError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Error Loading Analytics</h3>
            <p className="text-gray-600 mb-4">{storeError}</p>
            <Button onClick={async () => {
              try {
                const response = await fetch('/api/analytics?type=general');
                if (response.ok) {
                  const data = await response.json();
                  if (data.dashboard) setDashboard(data.dashboard);
                  if (data.performanceMetrics) setPerformanceMetrics(data.performanceMetrics);
                  if (data.userBehavior) updateUserBehavior(data.userBehavior);
                }
              } catch (err) {
                logger.error('Retry fetch error:', err);
              }
            }}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <Badge variant="outline" className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          Live Data
        </Badge>
      </div>

      {/* Metric Selection */}
      <div className="flex gap-2">
        {[
          { key: 'users', label: 'Users' },
          { key: 'polls', label: 'Polls' },
          { key: 'votes', label: 'Votes' },
          { key: 'performance', label: 'Performance' }
        ].map((metric) => (
          <Button
            key={metric.key}
            variant={selectedMetric === metric.key ? 'default' : 'outline'}
            onClick={() => setSelectedMetric(metric.key as any)}
            className="text-sm"
          >
            {metric.label}
          </Button>
        ))}
      </div>

      {/* Analytics Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Growth Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Growth</CardTitle>
            <CardDescription>New users over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {dashboard?.uniqueUsers || 0}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Total user registrations
            </p>
          </CardContent>
        </Card>

        {/* Poll Activity Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Poll Activity</CardTitle>
            <CardDescription>Recent poll activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {dashboard?.topPages?.length || 0}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Active polls
            </p>
          </CardContent>
        </Card>

        {/* System Performance Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Performance</CardTitle>
            <CardDescription>Current system metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Response Time:</span>
                <span className="text-sm font-medium">
                  {performanceMetrics?.pageLoadTime || 0}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Uptime:</span>
                <span className="text-sm font-medium">
                  {performanceMetrics?.timeToInteractive || 0}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Error Rate:</span>
                <span className="text-sm font-medium">
                  {performanceMetrics?.cumulativeLayoutShift || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button onClick={async () => {
          try {
            const response = await fetch('/api/analytics?type=general');
            if (response.ok) {
              const data = await response.json();
              if (data.dashboard) setDashboard(data.dashboard);
              if (data.performanceMetrics) setPerformanceMetrics(data.performanceMetrics);
              if (data.userBehavior) updateUserBehavior(data.userBehavior);
            }
          } catch (err) {
            logger.error('Refresh fetch error:', err);
          }
        }} variant="outline">
          Refresh Data
        </Button>
      </div>
    </div>
  );
}