/**
 * Analytics Panel Component - Store-Integrated Version
 *
 * This component uses the analytics store for better state management
 * and integration with the enhanced analytics system.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import {
  useAnalyticsActions,
  useAnalyticsDashboard,
  useAnalyticsError,
  useAnalyticsLoading,
  useAnalyticsMetrics,
} from '@/lib/stores/analyticsStore';
import { logger } from '@/lib/utils/logger';

// Analytics data types are defined in the analytics hooks and stores

type AnalyticsPanelProps = {
  refreshInterval?: number;
}

export default function AnalyticsPanel({
  refreshInterval = 30000
}: AnalyticsPanelProps) {
  const [selectedMetric, setSelectedMetric] = useState<'users' | 'polls' | 'votes' | 'performance'>('users');

  const dashboard = useAnalyticsDashboard();
  const performanceMetrics = useAnalyticsMetrics();
  const storeLoading = useAnalyticsLoading();
  const storeError = useAnalyticsError();
  const {
    setDashboard,
    setPerformanceMetrics,
    updateUserBehavior,
    setLoading,
    setError,
    clearError,
  } = useAnalyticsActions();

  // Refs for stable store actions
  const setDashboardRef = useRef(setDashboard);
  useEffect(() => { setDashboardRef.current = setDashboard; }, [setDashboard]);
  const setPerformanceMetricsRef = useRef(setPerformanceMetrics);
  useEffect(() => { setPerformanceMetricsRef.current = setPerformanceMetrics; }, [setPerformanceMetrics]);
  const updateUserBehaviorRef = useRef(updateUserBehavior);
  useEffect(() => { updateUserBehaviorRef.current = updateUserBehavior; }, [updateUserBehavior]);
  const setLoadingRef = useRef(setLoading);
  useEffect(() => { setLoadingRef.current = setLoading; }, [setLoading]);
  const setErrorRef = useRef(setError);
  useEffect(() => { setErrorRef.current = setError; }, [setError]);
  const clearErrorRef = useRef(clearError);
  useEffect(() => { clearErrorRef.current = clearError; }, [clearError]);

  // Fetch data when component mounts or metric changes
  const fetchData = useCallback(async () => {
    setLoadingRef.current(true);
    clearErrorRef.current();

    try {
      const response = await fetch('/api/analytics?type=general');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // CRITICAL: Explicitly handle JSON parsing errors to prevent infinite loops
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        const jsonErrorMessage = jsonError instanceof SyntaxError
          ? 'Invalid JSON response from analytics API'
          : jsonError instanceof Error ? jsonError.message : 'Failed to parse analytics data';
        throw new Error(jsonErrorMessage);
      }

      if (data.dashboard) {
        setDashboardRef.current(data.dashboard);
      }
      if (data.performanceMetrics) {
        setPerformanceMetricsRef.current(data.performanceMetrics);
      }
      if (data.userBehavior) {
        updateUserBehaviorRef.current(data.userBehavior);
      }

      logger.info('Analytics data loaded and stored successfully');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load analytics data';
      setErrorRef.current(errorMessage);
      logger.error('Analytics fetch error:', err);
    } finally {
      setLoadingRef.current(false);
    }
  }, []);  

  useEffect(() => {
    void fetchData();

    const interval = setInterval(() => {
      void fetchData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [selectedMetric, refreshInterval, fetchData]);

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
            <Button
              onClick={() => {
                void fetchData();
              }}
            >
              Try Again
            </Button>
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
              {dashboard?.uniqueUsers ?? 0}
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
              {dashboard?.topPages?.length ?? 0}
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
                  {performanceMetrics?.pageLoadTime ?? 0}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Uptime:</span>
                <span className="text-sm font-medium">
                  {performanceMetrics?.timeToInteractive ?? 0}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Error Rate:</span>
                <span className="text-sm font-medium">
                  {performanceMetrics?.cumulativeLayoutShift ?? 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => {
            void fetchData();
          }}
          variant="outline"
        >
          Refresh Data
        </Button>
      </div>
    </div>
  );
}
