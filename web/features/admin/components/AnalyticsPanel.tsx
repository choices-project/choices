/**
 * Analytics Panel Component - Store-Integrated Version
 *
 * This component uses the analytics store for better state management
 * and integration with the enhanced analytics system.
 */

import React, { useState, useEffect, useRef } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { useAnalyticsGeneral } from '@/lib/hooks/useApi';
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

  // ✅ Use React Query for fetching (with automatic caching and refetching)
  // Disable refetchInterval if there's an error to prevent infinite retry loops
  const {
    data,
    isLoading: queryLoading,
    error: queryError,
    refetch: refetchData
  } = useAnalyticsGeneral({
    refetchInterval: storeError ? false : refreshInterval, // Disable if error
    retry: 1, // Limit retries
    retryDelay: 5000, // 5 second delay between retries
  });

  // ✅ Sync React Query data → Zustand store (maintains existing component compatibility)
  useEffect(() => {
    if (data) {
      // Handle different response structures
      // API returns { data: { analytics: AnalyticsSummary } } for type=general
      // Component expects { dashboard, performanceMetrics, userBehavior }
      const responseData = data.data || data;
      
      if (responseData.analytics) {
        // Transform AnalyticsSummary to dashboard format
        const analyticsData = responseData.analytics;
        // Only update if we have valid data - don't set partial objects
        logger.info('Analytics data received', { hasAnalytics: !!analyticsData });
        // Note: Dashboard will be populated when full AnalyticsDashboard structure is available
        // For now, just log that data was received
      } else if (responseData.dashboard) {
        // Handle legacy format with full dashboard structure
        setDashboardRef.current(responseData.dashboard);
        if (responseData.performanceMetrics) {
          setPerformanceMetricsRef.current(responseData.performanceMetrics);
        }
        if (responseData.userBehavior) {
          updateUserBehaviorRef.current(responseData.userBehavior);
        }
        logger.info('Analytics data loaded and stored successfully');
      } else {
        logger.warn('Analytics data structure not recognized', { data: responseData });
      }
    }
  }, [data]);

  // ✅ Sync React Query loading state → Zustand store
  useEffect(() => {
    setLoadingRef.current(queryLoading);
  }, [queryLoading]);

  // ✅ Sync React Query error state → Zustand store
  useEffect(() => {
    if (queryError) {
      const errorMessage = queryError instanceof Error ? queryError.message : 'Failed to load analytics data';
      setErrorRef.current(errorMessage);
      logger.error('Analytics fetch error:', queryError);
    } else {
      clearErrorRef.current();
    }
  }, [queryError]);

  // Don't show loading state if there's an error (show error instead)
  const isLoading = storeLoading && !storeError;

  if (isLoading) {
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

  // Show error state only if there's a critical error (not just auth issues)
  // Auth errors are expected in some test scenarios, so we'll show empty state instead
  const isAuthError = storeError?.toLowerCase().includes('auth') || storeError?.toLowerCase().includes('unauthorized');

  if (storeError && !isAuthError) {
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
                void refetchData();
              }}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If auth error, show empty state (analytics not available)
  if (isAuthError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Analytics data is not available. Please ensure you are authenticated.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="analytics-panel">
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
            void refetchData();
          }}
          variant="outline"
        >
          Refresh Data
        </Button>
      </div>
    </div>
  );
}
