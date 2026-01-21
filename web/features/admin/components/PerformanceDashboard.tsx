'use client'

import React, { useEffect, useCallback, useRef } from 'react';

import {
  useDatabaseMetrics,
  useCacheStats,
  useLastRefresh,
  useAutoRefresh,
  usePerformanceActions,
  usePerformanceLoading,
  usePerformanceError
} from '@/lib/stores';
import logger from '@/lib/utils/logger';

export default function PerformanceDashboard() {
  // Get state from performanceStore
  const performanceStats = useDatabaseMetrics();
  const cacheStats = useCacheStats();
  const lastRefresh = useLastRefresh();
  const autoRefresh = useAutoRefresh();
  const loading = usePerformanceLoading();
  const error = usePerformanceError();
  const {
    loadDatabasePerformance,
    refreshMaterializedViews,
    performDatabaseMaintenance,
    setAutoRefresh,
    initialize,
  } = usePerformanceActions();

  // Refs for stable action callbacks
  const loadDatabasePerformanceRef = useRef(loadDatabasePerformance);
  useEffect(() => { loadDatabasePerformanceRef.current = loadDatabasePerformance; }, [loadDatabasePerformance]);
  const refreshMaterializedViewsRef = useRef(refreshMaterializedViews);
  useEffect(() => { refreshMaterializedViewsRef.current = refreshMaterializedViews; }, [refreshMaterializedViews]);
  const performDatabaseMaintenanceRef = useRef(performDatabaseMaintenance);
  useEffect(() => { performDatabaseMaintenanceRef.current = performDatabaseMaintenance; }, [performDatabaseMaintenance]);
  const initializeRef = useRef(initialize);
  useEffect(() => { initializeRef.current = initialize; }, [initialize]);

  // Load performance statistics
  const loadPerformanceStats = useCallback(async () => {
    await loadDatabasePerformanceRef.current();
  }, [])


  // Refresh materialized views
  const handleRefreshMaterializedViews = useCallback(async () => {
    await refreshMaterializedViewsRef.current();
  }, [])

  // Perform database maintenance
  const handleDatabaseMaintenance = useCallback(async () => {
    await performDatabaseMaintenanceRef.current();
  }, [])

  // Load data on mount with error handling and timeout
  useEffect(() => {
    const hasLoadedRef = { current: false };

    const loadData = async () => {
      // Prevent multiple simultaneous loads
      if (hasLoadedRef.current) {
        return;
      }
      hasLoadedRef.current = true;

      try {
        initializeRef.current();
        await loadPerformanceStats();
      } catch (err) {
        logger.error('Failed to load performance data:', err);
        // Reset on error so user can retry
        hasLoadedRef.current = false;
      }
    };

    loadData();
  }, []); // Empty deps - only load once on mount

  // Calculate performance insights
  const performanceInsights = {
    avgQueryTime: performanceStats.find((s: any) => s.metricName.includes('query_time'))?.avgValue ?? 0,
    maxQueryTime: performanceStats.find((s: any) => s.metricName.includes('query_time'))?.maxValue ?? 0,
    totalQueries: performanceStats.find((s: any) => s.metricName.includes('query_time'))?.countMeasurements ?? 0,
    cacheHitRate: cacheStats?.hitRate ?? 0
  }

  // Performance status
  const getPerformanceStatus = (avgTime: number) => {
    if (avgTime < 100) return { status: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' }
    if (avgTime < 500) return { status: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' }
    if (avgTime < 1000) return { status: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
    return { status: 'Poor', color: 'text-red-600', bgColor: 'bg-red-100' }
  }

  const performanceStatus = getPerformanceStatus(performanceInsights.avgQueryTime)

  if (loading) {
    return (
      <div className="space-y-4" role="status" aria-live="polite" aria-busy="true">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          Loading performance metrics...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-red-600 dark:text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-lg font-medium text-red-800 dark:text-red-300">Error Loading Performance Data</h3>
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={() => {
                loadPerformanceStats();
              }}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
          <p className="text-gray-600">Monitor and optimize system performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="autoRefresh" className="text-sm text-gray-700">
              Auto-refresh
            </label>
          </div>
          <button
            onClick={() => {
              loadPerformanceStats()
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Info message when no data */}
      {performanceStats.length === 0 && performanceInsights.totalQueries === 0 && !loading && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">No Performance Data Yet</h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                <p className="mb-2">
                  The performance dashboard tracks system operations as they occur. This dashboard shows:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Query Performance:</strong> Average and maximum database query times, total query count</li>
                  <li><strong>Cache Efficiency:</strong> Cache hit rates and memory usage</li>
                  <li><strong>System Health:</strong> Overall performance status and response times</li>
                  <li><strong>Operation Metrics:</strong> Detailed metrics for tracked operations</li>
                </ul>
                <p className="mt-2">
                  Data will appear here once operations are tracked. Try using the application normally, and performance metrics will be recorded automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Query Time</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{performanceInsights.avgQueryTime.toFixed(2)}ms</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Max Query Time</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{performanceInsights.maxQueryTime.toFixed(2)}ms</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Queries</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{performanceInsights.totalQueries}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cache Hit Rate</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{performanceInsights.cacheHitRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Status</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${performanceStatus.bgColor} ${performanceStatus.color}`}>
              {performanceStatus.status}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Last updated: {lastRefresh?.toLocaleTimeString() ?? 'Never'}
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleRefreshMaterializedViews}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh Views'}
            </button>
            <button
              onClick={handleDatabaseMaintenance}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Maintaining...' : 'DB Maintenance'}
            </button>
          </div>
        </div>
      </div>

      {/* Cache Statistics */}
      {cacheStats && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Cache Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cache Size</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{cacheStats.size} items</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cache Keys</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{cacheStats.keys.length}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Memory Usage</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {(cacheStats.memoryUsage / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
          {cacheStats.keys.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Recent Cache Keys:</p>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {cacheStats.keys.slice(0, 10).map((key: string, index: number) => (
                    <div key={index} className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate">
                      {key}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Performance Metrics */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Performance Metrics</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metric
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Average
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Min
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Max
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Count
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {performanceStats.map((metric: any) => (
                <tr key={metric.metricName}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {metric.metricName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.avgValue.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.minValue.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.maxValue.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.countMeasurements}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
