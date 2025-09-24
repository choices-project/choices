import { useState, useEffect, useCallback } from 'react';
import { devLog } from '@/lib/logger';
// import { useFeatureFlags } from './useFeatureFlags';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { withOptional } from '@/lib/util/objects';

type AnalyticsData = {
  period: string;
  summary: {
    totalUsers: number;
    totalPolls: number;
    totalVotes: number;
    activeUsers: number;
    newPolls: number;
    newVotes: number;
  };
  trends: {
    userGrowth: Array<{ date: string; count: number }>;
    pollActivity: Array<{ date: string; count: number }>;
    voteActivity: Array<{ date: string; count: number }>;
  };
  generatedAt: string;
  performance: {
    queryOptimized: boolean;
    cacheEnabled: boolean;
  };
}

type AnalyticsFilters = {
  dateRange?: string;
  pollId?: string;
  userType?: string;
  deviceType?: string;
}

type UseAnalyticsOptions = {
  autoRefresh?: boolean;
  refreshInterval?: number;
  defaultFilters?: AnalyticsFilters;
}

type UseAnalyticsReturn = {
  // Data
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  // Feature flags
  analyticsEnabled: boolean;
  aiFeaturesEnabled: boolean;
  
  // Actions
  fetchData: (type?: string, filters?: AnalyticsFilters) => Promise<void>;
  refreshData: () => Promise<void>;
  clearError: () => void;
  
  // State
  autoRefresh: boolean;
  setAutoRefresh: (enabled: boolean) => void;
  filters: AnalyticsFilters;
  setFilters: (filters: AnalyticsFilters) => void;
  
  // Utilities
  exportData: (format?: 'json' | 'csv') => void;
  generateReport: (type: string) => void;
}

export function useAnalytics(options: UseAnalyticsOptions = {}): UseAnalyticsReturn {
  const {
    autoRefresh = true,
    refreshInterval = 30000,
    defaultFilters = {}
  } = options;

  // const featureFlags = useFeatureFlags();
  const _featureFlags = { flags: {}, isLoading: false };
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(autoRefresh);
  const [filters, setFilters] = useState<AnalyticsFilters>(defaultFilters);

  // Check feature flags
  const analyticsEnabled = isFeatureEnabled('analytics');
  const aiFeaturesEnabled = isFeatureEnabled('aiFeatures');

  const fetchData = useCallback(async (_type: string = 'overview', customFilters?: AnalyticsFilters) => {
    if (!analyticsEnabled) {
      setError('Analytics feature is disabled');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const requestFilters = { ...filters, ...customFilters };
      const queryParams = new URLSearchParams({
        period: requestFilters.dateRange || '7d'
      });

      const response = await fetch(`/api/analytics?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // The API returns the data directly, not wrapped in a success/error structure
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      devLog('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [analyticsEnabled, filters]);

  const refreshData = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (analyticsEnabled && autoRefreshEnabled) {
      fetchData();
      
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [analyticsEnabled, autoRefreshEnabled, refreshInterval, fetchData]);

  // Initial data fetch
  useEffect(() => {
    if (analyticsEnabled && !data) {
      fetchData();
    }
  }, [analyticsEnabled, fetchData, data]);

  const exportData = useCallback((format: 'json' | 'csv' = 'json') => {
    if (!data) {
      devLog('No data to export');
      return;
    }

    if (format === 'json') {
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${data.period}-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      // Convert data to CSV format
      const csvData = convertToCSV(data);
      const dataBlob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${data.period}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }
  }, [data]);

  const generateReport = useCallback((type: string) => {
    if (!data) {
      devLog('No data to generate report');
      return;
    }

    // Generate a comprehensive report based on the data
    const report = {
      generatedAt: new Date().toISOString(),
      type,
      summary: generateReportSummary(data, type),
      recommendations: generateRecommendations(data, type),
      data: data
    };

    const reportStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([reportStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-report-${type}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [data]);

  return {
    // Data
    data,
    loading,
    error,
    lastUpdated,
    
    // Feature flags
    analyticsEnabled,
    aiFeaturesEnabled,
    
    // Actions
    fetchData,
    refreshData,
    clearError,
    
    // State
    autoRefresh: autoRefreshEnabled,
    setAutoRefresh: setAutoRefreshEnabled,
    filters,
    setFilters,
    
    // Utilities
    exportData,
    generateReport
  };
}

// Helper functions

function convertToCSV(data: AnalyticsData): string {
  const lines: string[] = [];
  
  // Summary section
  lines.push('Section,Metric,Value');
  lines.push('Summary,Total Users,' + data.summary.totalUsers);
  lines.push('Summary,Total Polls,' + data.summary.totalPolls);
  lines.push('Summary,Total Votes,' + data.summary.totalVotes);
  lines.push('Summary,Active Users,' + data.summary.activeUsers);
  lines.push('Summary,New Polls,' + data.summary.newPolls);
  lines.push('Summary,New Votes,' + data.summary.newVotes);
  
  // Trends section
  lines.push('Trends,User Growth,');
  data.trends.userGrowth.forEach(trend => {
    lines.push(`Trends,User Growth ${trend.date},${trend.count}`);
  });
  
  lines.push('Trends,Poll Activity,');
  data.trends.pollActivity.forEach(trend => {
    lines.push(`Trends,Poll Activity ${trend.date},${trend.count}`);
  });
  
  lines.push('Trends,Vote Activity,');
  data.trends.voteActivity.forEach(trend => {
    lines.push(`Trends,Vote Activity ${trend.date},${trend.count}`);
  });
  
  return lines.join('\n');
}

function generateReportSummary(data: AnalyticsData, type: string): string {
  switch (type) {
    case 'overview':
      return `Platform Overview (${data.period}): ${data.summary.totalPolls} total polls with ${data.summary.totalVotes} votes from ${data.summary.totalUsers} users. ${data.summary.activeUsers} active users.`;
    
    case 'trends':
      const totalUserGrowth = data.trends.userGrowth.reduce((sum, trend) => sum + trend.count, 0);
      const totalPollActivity = data.trends.pollActivity.reduce((sum, trend) => sum + trend.count, 0);
      return `Trends Summary (${data.period}): ${totalUserGrowth} new users, ${totalPollActivity} new polls.`;
    
    case 'performance':
      return `Performance Summary: Query optimized: ${data.performance.queryOptimized}, Cache enabled: ${data.performance.cacheEnabled}.`;
    
    default:
      return `Analytics report generated for ${type} on ${new Date().toLocaleDateString()}.`;
  }
}

function generateRecommendations(data: AnalyticsData, type: string): string[] {
  const recommendations: string[] = [];
  
  switch (type) {
    case 'overview':
      if (data.summary.totalVotes / data.summary.totalUsers < 2) {
        recommendations.push('Consider implementing engagement campaigns to increase participation rate');
      }
      if (data.summary.activeUsers / data.summary.totalUsers < 0.3) {
        recommendations.push('Low active user ratio - review user engagement strategies');
      }
      break;
    
    case 'trends':
      const recentUserGrowth = data.trends.userGrowth.slice(-7).reduce((sum, trend) => sum + trend.count, 0);
      if (recentUserGrowth < 10) {
        recommendations.push('Low recent user growth - consider marketing campaigns');
      }
      break;
    
    case 'performance':
      if (!data.performance.queryOptimized) {
        recommendations.push('Enable query optimization for better performance');
      }
      if (!data.performance.cacheEnabled) {
        recommendations.push('Enable caching for improved response times');
      }
      break;
  }
  
  return recommendations;
}

// Specialized hooks for different analytics types

export function useOverviewAnalytics(options?: UseAnalyticsOptions) {
  const analytics = useAnalytics(options);
  
  const fetchOverview = useCallback(() => {
    return analytics.fetchData('overview');
  }, [analytics.fetchData]);
  
  return {
    ...withOptional(analytics),
    fetchOverview
  };
}

export function useTrendsAnalytics(options?: UseAnalyticsOptions) {
  const analytics = useAnalytics(options);
  
  const fetchTrends = useCallback((dateRange?: string) => {
    return analytics.fetchData('trends', withOptional({}, { dateRange }));
  }, [analytics.fetchData]);
  
  return {
    ...withOptional(analytics),
    fetchTrends
  };
}

export function usePerformanceAnalytics(options?: UseAnalyticsOptions) {
  const analytics = useAnalytics(options);
  
  const fetchPerformance = useCallback(() => {
    return analytics.fetchData('performance');
  }, [analytics.fetchData]);
  
  return {
    ...withOptional(analytics),
    fetchPerformance
  };
}
