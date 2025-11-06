/**
 * Enhanced Analytics Hook
 * Integrates new schema capabilities with existing analytics system
 * Created: 2025-10-27
 */

import { createClient } from '@supabase/supabase-js';
import { useState, useEffect, useCallback } from 'react';

import { logger } from '@/lib/utils/logger';
import type { Database } from '@/types/database';

import { EnhancedAnalyticsService } from '../lib/enhanced-analytics-service';


type _SupabaseClient = ReturnType<typeof createClient<Database>>;

type EnhancedAnalyticsData = {
  // Existing analytics data
  period: string;
  summary: {
    totalUsers: number;
    totalPolls: number;
    totalVotes: number;
    activeUsers: number;
    newPolls: number;
    newVotes: number;
    engagementScore: number;
    trustScore: number;
    participationRate: number;
    conversionRate: number;
    bounceRate: number;
    sessionDuration: number;
  };
  trends: {
    userGrowth: Array<{ date: string; count: number }>;
    pollActivity: Array<{ date: string; count: number }>;
    voteActivity: Array<{ date: string; count: number }>;
    engagementTrends: Array<{ date: string; score: number }>;
    trustTrends: Array<{ date: string; score: number }>;
    civicEngagement: Array<{ date: string; actions: number }>;
  };
  events: {
    pollCreated: number;
    pollVoted: number;
    civicActionCreated: number;
    notificationSent: number;
    userEngagement: number;
  };
  civicEngagement: {
    totalActions: number;
    activePetitions: number;
    completedActions: number;
    engagementRate: number;
  };
  
  // Enhanced capabilities
  enhancedInsights?: {
    comprehensiveAnalysis: any;
    trustTierDistribution: any;
    botDetectionResults: any;
    platformMetrics: any[];
  };
  sessionInsights?: {
    sessionData: any;
    featureUsage: any[];
    sessionMetrics: {
      totalActions: number;
      sessionDuration: number;
      deviceType: string;
      pageViews: number;
    };
  };
  userInsights?: {
    sessions: any[];
    featureUsage: any[];
    platformMetrics: any[];
    trustTierProgression: any;
  };
  systemHealth?: any[];
  realTimeCapabilities?: {
    sessionTracking: boolean;
    featureUsageTracking: boolean;
    platformMetricsTracking: boolean;
    systemHealthMonitoring: boolean;
  };
}

type UseEnhancedAnalyticsOptions = {
  pollId?: string;
  userId?: string;
  sessionId?: string;
  enableRealTime?: boolean;
  enableNewSchema?: boolean;
  refreshInterval?: number;
}

export function useEnhancedAnalytics(options: UseEnhancedAnalyticsOptions = {}) {
  const {
    pollId,
    userId,
    sessionId,
    enableRealTime = true,
    enableNewSchema = true,
    refreshInterval = 30000 // 30 seconds
  } = options;

  const [data, setData] = useState<EnhancedAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Initialize Supabase client and enhanced analytics service
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const enhancedAnalytics = new EnhancedAnalyticsService(supabase);

  // Fetch enhanced analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let analyticsData: EnhancedAnalyticsData;

      if (pollId) {
        // Get poll-specific analytics
        const response = await fetch(`/api/analytics/unified/${pollId}?methods=comprehensive`);
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error ?? 'Failed to fetch analytics');
        }

        // Enhance with new schema capabilities if enabled
        if (enableNewSchema) {
          analyticsData = await enhancedAnalytics.enhanceUnifiedAnalytics(pollId, result.analytics);
        } else {
          analyticsData = result.analytics;
        }
      } else {
        // Get general platform analytics
        analyticsData = await getGeneralAnalytics();
      }

      // Enhance with session data if sessionId provided
      if (sessionId && enableNewSchema) {
        analyticsData = await enhancedAnalytics.enhanceAnalyticsStore(analyticsData, sessionId);
      }

      // Enhance with user data if userId provided
      if (userId && enableNewSchema) {
        analyticsData = await enhancedAnalytics.enhanceAnalyticsHook(analyticsData, userId);
      }

      setData(analyticsData);
      setLastUpdated(new Date());
      
      logger.info('Enhanced analytics data fetched', {
        pollId,
        userId,
        sessionId,
        enableNewSchema,
        dataPoints: Object.keys(analyticsData).length
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      logger.error('Enhanced analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [pollId, userId, sessionId, enableNewSchema, enhancedAnalytics]);

  // Track feature usage
  const trackFeatureUsage = useCallback(async (
    featureName: string,
    action: string = 'interact',
    context: any = {}
  ) => {
    try {
      await enhancedAnalytics.trackFeatureUsage(userId ?? null, featureName, {
        action,
        context,
        session_id: sessionId,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      logger.error('Feature usage tracking error:', err);
    }
  }, [userId, sessionId, enhancedAnalytics]);

  // Track session activity
  const trackSessionActivity = useCallback(async (
    action: string,
    page: string,
    metadata: any = {}
  ) => {
    try {
      if (!sessionId) return;

      await enhancedAnalytics.trackUserSession({
        userId,
        sessionId,
        deviceInfo: metadata.deviceInfo || {},
        userAgent: metadata.userAgent || navigator.userAgent,
        ipAddress: metadata.ipAddress || 'unknown',
        currentPage: page,
        action
      });
    } catch (err) {
      logger.error('Session activity tracking error:', err);
    }
  }, [userId, sessionId, enhancedAnalytics]);

  // Track auth events
  const trackAuthEvent = useCallback(async (
    authEvent: any
  ) => {
    try {
      if (!sessionId) return;

      await enhancedAnalytics.enhanceAuthAnalytics(authEvent, sessionId);
    } catch (err) {
      logger.error('Auth event tracking error:', err);
    }
  }, [sessionId, enhancedAnalytics]);

  // Set up real-time updates
  useEffect(() => {
    if (!enableRealTime || !refreshInterval) return;

    const interval = setInterval(() => {
      fetchAnalytics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [enableRealTime, refreshInterval, fetchAnalytics]);

  // Initial fetch
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Get system health status
  const getSystemHealth = useCallback(async () => {
    try {
      const { data: healthData, error } = await supabase
        .from('system_health')
        .select('*')
        .order('last_check', { ascending: false });

      if (error) throw error;
      return healthData || [];
    } catch (err) {
      logger.error('System health fetch error:', err);
      return [];
    }
  }, [supabase]);

  // Get active site messages
  const getActiveSiteMessages = useCallback(async (targetAudience: string = 'all') => {
    try {
      const { data: messages, error } = await supabase
        .from('site_messages')
        .select('*')
        .eq('is_active', true)
        .eq('target_audience', targetAudience)
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString())
        .order('priority', { ascending: false });

      if (error) throw error;
      return messages || [];
    } catch (err) {
      logger.error('Site messages fetch error:', err);
      return [];
    }
  }, [supabase]);

  return {
    // Data
    data,
    loading,
    error,
    lastUpdated,
    
    // Actions
    fetchAnalytics,
    trackFeatureUsage,
    trackSessionActivity,
    trackAuthEvent,
    getSystemHealth,
    getActiveSiteMessages,
    
    // Utilities
    refresh: fetchAnalytics,
    clearError: () => setError(null)
  };
}

// Helper function for general analytics
async function getGeneralAnalytics(): Promise<EnhancedAnalyticsData> {
  // This would integrate with your existing analytics service
  // For now, return a basic structure
  return {
    period: '7 days',
    summary: {
      totalUsers: 0,
      totalPolls: 0,
      totalVotes: 0,
      activeUsers: 0,
      newPolls: 0,
      newVotes: 0,
      engagementScore: 0,
      trustScore: 0,
      participationRate: 0,
      conversionRate: 0,
      bounceRate: 0,
      sessionDuration: 0
    },
    trends: {
      userGrowth: [],
      pollActivity: [],
      voteActivity: [],
      engagementTrends: [],
      trustTrends: [],
      civicEngagement: []
    },
    events: {
      pollCreated: 0,
      pollVoted: 0,
      civicActionCreated: 0,
      notificationSent: 0,
      userEngagement: 0
    },
    civicEngagement: {
      totalActions: 0,
      activePetitions: 0,
      completedActions: 0,
      engagementRate: 0
    }
  };
}
