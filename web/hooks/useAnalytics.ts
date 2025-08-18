import { useState, useEffect, useCallback } from 'react';
import { devLog } from '@/lib/logger';
import { useFeatureFlags } from './useFeatureFlags';
import { isFeatureEnabled } from '../lib/feature-flags';
import { PWAAnalytics } from '../lib/pwa-analytics';

interface AnalyticsData {
  overview: {
    totalPolls: number;
    activePolls: number;
    totalVotes: number;
    totalUsers: number;
    participationRate: number;
    averageSessionDuration: number;
    bounceRate: number;
    conversionRate: number;
  };
  trends: {
    daily: Array<{ date: string; votes: number; users: number; polls: number }>;
    weekly: Array<{ week: string; votes: number; users: number; polls: number }>;
    monthly: Array<{ month: string; votes: number; users: number; polls: number }>;
  };
  demographics: {
    ageGroups: Record<string, number>;
    geographicDistribution: Record<string, number>;
    verificationTiers: Record<string, number>;
    deviceTypes: Record<string, number>;
    engagementLevels: Record<string, number>;
  };
  performance: {
    loadTimes: Array<{ page: string; averageLoadTime: number; p95LoadTime: number }>;
    errorRates: Array<{ endpoint: string; errorRate: number; totalRequests: number }>;
    userExperience: {
      firstContentfulPaint: number;
      largestContentfulPaint: number;
      cumulativeLayoutShift: number;
    };
  };
  privacy: {
    dataCollected: number;
    dataShared: number;
    anonymizationLevel: string;
    encryptionEnabled: boolean;
    userConsent: {
      granted: number;
      denied: number;
      pending: number;
    };
  };
  engagement: {
    activeUsers: number;
    returningUsers: number;
    sessionDuration: number;
    pagesPerSession: number;
    featureUsage: Record<string, number>;
  };
}

interface AnalyticsFilters {
  dateRange?: string;
  pollId?: string;
  userType?: string;
  deviceType?: string;
}

interface UseAnalyticsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  defaultFilters?: AnalyticsFilters;
}

interface UseAnalyticsReturn {
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

  const featureFlags = useFeatureFlags();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(autoRefresh);
  const [filters, setFilters] = useState<AnalyticsFilters>(defaultFilters);

  // Check feature flags
  const analyticsEnabled = isFeatureEnabled('analytics');
  const aiFeaturesEnabled = isFeatureEnabled('aiFeatures');

  const fetchData = useCallback(async (type: string = 'overview', customFilters?: AnalyticsFilters) => {
    if (!analyticsEnabled) {
      setError('Analytics feature is disabled');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const requestFilters = { ...filters, ...customFilters };
      const queryParams = new URLSearchParams({
        type,
        ...Object.fromEntries(
          Object.entries(requestFilters).filter(([_, value]) => value !== undefined)
        )
      });

      const response = await fetch(`/api/analytics?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch analytics data');
      }

      setData(result.data);
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
      link.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      // Convert data to CSV format
      const csvData = convertToCSV(data);
      const dataBlob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
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
  
  // Overview section
  lines.push('Section,Metric,Value');
  lines.push('Overview,Total Polls,' + data.overview.totalPolls);
  lines.push('Overview,Active Polls,' + data.overview.activePolls);
  lines.push('Overview,Total Votes,' + data.overview.totalVotes);
  lines.push('Overview,Total Users,' + data.overview.totalUsers);
  lines.push('Overview,Participation Rate,' + data.overview.participationRate + '%');
  lines.push('Overview,Average Session Duration,' + data.overview.averageSessionDuration + ' min');
  lines.push('Overview,Bounce Rate,' + data.overview.bounceRate + '%');
  lines.push('Overview,Conversion Rate,' + data.overview.conversionRate + '%');
  
  // Demographics section
  Object.entries(data.demographics.ageGroups).forEach(([age, count]) => {
    lines.push(`Demographics,Age ${age},${count}`);
  });
  
  Object.entries(data.demographics.deviceTypes).forEach(([device, percentage]) => {
    lines.push(`Demographics,Device ${device},${percentage}%`);
  });
  
  // Performance section
  data.performance.loadTimes.forEach(page => {
    lines.push(`Performance,${page.page} Load Time,${page.averageLoadTime}ms`);
  });
  
  return lines.join('\n');
}

function generateReportSummary(data: AnalyticsData, type: string): string {
  switch (type) {
    case 'overview':
      return `Platform Overview: ${data.overview.totalPolls} total polls with ${data.overview.totalVotes} votes from ${data.overview.totalUsers} users. Participation rate is ${data.overview.participationRate}%.`;
    
    case 'performance':
      const avgLoadTime = data.performance.loadTimes.reduce((sum, page) => sum + page.averageLoadTime, 0) / data.performance.loadTimes.length;
      return `Performance Summary: Average page load time is ${avgLoadTime.toFixed(0)}ms. ${data.performance.loadTimes.length} pages monitored.`;
    
    case 'engagement':
      return `Engagement Summary: ${data.engagement.activeUsers} active users with ${data.engagement.sessionDuration.toFixed(1)} minute average session duration.`;
    
    default:
      return `Analytics report generated for ${type} on ${new Date().toLocaleDateString()}.`;
  }
}

function generateRecommendations(data: AnalyticsData, type: string): string[] {
  const recommendations: string[] = [];
  
  switch (type) {
    case 'overview':
      if (data.overview.participationRate < 50) {
        recommendations.push('Consider implementing engagement campaigns to increase participation rate');
      }
      if (data.overview.bounceRate > 50) {
        recommendations.push('High bounce rate detected - review landing page optimization');
      }
      break;
    
    case 'performance':
      const slowPages = data.performance.loadTimes.filter(page => page.averageLoadTime > 1000);
      if (slowPages.length > 0) {
        recommendations.push(`Optimize load times for: ${slowPages.map(p => p.page).join(', ')}`);
      }
      break;
    
    case 'engagement':
      if (data.engagement.sessionDuration < 3) {
        recommendations.push('Short session duration - consider improving content engagement');
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
    ...analytics,
    fetchOverview
  };
}

export function useTrendsAnalytics(options?: UseAnalyticsOptions) {
  const analytics = useAnalytics(options);
  
  const fetchTrends = useCallback((dateRange?: string) => {
    return analytics.fetchData('trends', { dateRange });
  }, [analytics.fetchData]);
  
  return {
    ...analytics,
    fetchTrends
  };
}

export function useDemographicsAnalytics(options?: UseAnalyticsOptions) {
  const analytics = useAnalytics(options);
  
  const fetchDemographics = useCallback(() => {
    return analytics.fetchData('demographics');
  }, [analytics.fetchData]);
  
  return {
    ...analytics,
    fetchDemographics
  };
}

export function usePerformanceAnalytics(options?: UseAnalyticsOptions) {
  const analytics = useAnalytics(options);
  
  const fetchPerformance = useCallback(() => {
    return analytics.fetchData('performance');
  }, [analytics.fetchData]);
  
  return {
    ...analytics,
    fetchPerformance
  };
}

export function usePrivacyAnalytics(options?: UseAnalyticsOptions) {
  const analytics = useAnalytics(options);
  
  const fetchPrivacy = useCallback(() => {
    return analytics.fetchData('privacy');
  }, [analytics.fetchData]);
  
  return {
    ...analytics,
    fetchPrivacy
  };
}

export function useEngagementAnalytics(options?: UseAnalyticsOptions) {
  const analytics = useAnalytics(options);
  
  const fetchEngagement = useCallback(() => {
    return analytics.fetchData('engagement');
  }, [analytics.fetchData]);
  
  return {
    ...analytics,
    fetchEngagement
  };
}

export function useAdvancedAnalytics(options?: UseAnalyticsOptions) {
  const analytics = useAnalytics(options);
  
  const fetchAdvanced = useCallback(() => {
    return analytics.fetchData('advanced');
  }, [analytics.fetchData]);
  
  return {
    ...analytics,
    fetchAdvanced
  };
}
