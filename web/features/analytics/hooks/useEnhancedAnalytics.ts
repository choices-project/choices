/**
 * Enhanced Analytics Hook
 * Integrates new schema capabilities with existing analytics system
 * Created: 2025-10-27
 */

import { createClient } from '@supabase/supabase-js';
import { useState, useEffect, useCallback, useMemo } from 'react';

import { useAnalyticsActions } from '@/lib/stores/analyticsStore';
import { logger } from '@/lib/utils/logger';
import type { Database, Json } from '@/types/database';

import { EnhancedAnalyticsService, toJsonValue } from '../lib/enhanced-analytics-service';

const IS_E2E_HARNESS = process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1';



// Supabase client type is inferred from createClient usage

type PlatformMetricRow = Database['public']['Tables']['platform_analytics']['Row'];
type UserSessionRow = Database['public']['Tables']['user_sessions']['Row'];
type FeatureUsageRow = Database['public']['Tables']['feature_usage']['Row'];
type SystemHealthRow = Database['public']['Tables']['system_health']['Row'];
type SiteMessageRow = Database['public']['Tables']['site_messages']['Row'];
type AuthEventPayload = Parameters<EnhancedAnalyticsService['enhanceAuthAnalytics']>[0];
type FeatureUsageContext = Parameters<EnhancedAnalyticsService['trackFeatureUsage']>[2];
type SessionMetadata = {
  deviceInfo?: Json;
  userAgent?: string;
  ipAddress?: string;
};

type BotDetectionSummary = {
  riskScore: number;
  confidence: number;
  suspiciousPatterns: unknown[];
};

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
    comprehensiveAnalysis: unknown;
    trustTierDistribution: unknown;
    botDetectionResults: BotDetectionSummary | null;
    platformMetrics: PlatformMetricRow[];
  };
  sessionInsights?: {
    sessionData: UserSessionRow | null;
    featureUsage: FeatureUsageRow[];
    sessionMetrics: {
      totalActions: number;
      sessionDuration: number;
      deviceType: string;
      pageViews: number;
    };
  };
  userInsights?: {
    sessions: UserSessionRow[];
    featureUsage: FeatureUsageRow[];
    platformMetrics: PlatformMetricRow[];
    trustTierProgression: unknown;
  };
  systemHealth?: SystemHealthRow[];
  realTimeCapabilities?: {
    sessionTracking: boolean;
    featureUsageTracking: boolean;
    platformMetricsTracking: boolean;
    systemHealthMonitoring: boolean;
  };
  metadata?: Record<string, unknown>;
}

type UseEnhancedAnalyticsOptions = {
  pollId?: string;
  userId?: string;
  sessionId?: string;
  enableRealTime?: boolean;
  enableNewSchema?: boolean;
  refreshInterval?: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getNumber = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const getString = (value: unknown, fallback: string): string =>
  typeof value === 'string' && value.length > 0 ? value : fallback;

const getBoolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback;

const normalizeDateCountSeries = (
  value: unknown,
  fallback: Array<{ date: string; count: number }>
): Array<{ date: string; count: number }> => {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const series: Array<{ date: string; count: number }> = [];
  value.forEach((entry) => {
    if (isRecord(entry)) {
      const date = getString(entry.date, '');
      const count = getNumber(entry.count, 0);
      if (date) {
        series.push({ date, count });
      }
    }
  });

  return series.length > 0 ? series : fallback;
};

const normalizeDateScoreSeries = (
  value: unknown,
  fallback: Array<{ date: string; score: number }>
): Array<{ date: string; score: number }> => {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const series: Array<{ date: string; score: number }> = [];
  value.forEach((entry) => {
    if (isRecord(entry)) {
      const date = getString(entry.date, '');
      const score = getNumber(entry.score, 0);
      if (date) {
        series.push({ date, score });
      }
    }
  });

  return series.length > 0 ? series : fallback;
};

const normalizeCivicSeries = (
  value: unknown,
  fallback: Array<{ date: string; actions: number }>
): Array<{ date: string; actions: number }> => {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const series: Array<{ date: string; actions: number }> = [];
  value.forEach((entry) => {
    if (isRecord(entry)) {
      const date = getString(entry.date, '');
      const actions = getNumber(entry.actions, 0);
      if (date) {
        series.push({ date, actions });
      }
    }
  });

  return series.length > 0 ? series : fallback;
};

const parseBotDetectionResults = (value: unknown): BotDetectionSummary | null => {
  if (!isRecord(value)) {
    return null;
  }

  const riskScore =
    typeof value.riskScore === 'number'
      ? value.riskScore
      : typeof value.risk_score === 'number'
        ? value.risk_score
        : 0;

  const confidence =
    typeof value.confidence === 'number'
      ? value.confidence
      : typeof value.confidence_level === 'number'
        ? value.confidence_level
        : 0;

  const suspiciousPatterns = Array.isArray(value.suspiciousPatterns)
    ? value.suspiciousPatterns
    : Array.isArray(value.suspicious_patterns)
      ? value.suspicious_patterns
      : [];

  return {
    riskScore,
    confidence,
    suspiciousPatterns
  };
};

const createDefaultAnalyticsData = (): EnhancedAnalyticsData => ({
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
});

const cloneAnalyticsData = (source: EnhancedAnalyticsData): EnhancedAnalyticsData => {
  const clone: EnhancedAnalyticsData = {
    period: source.period,
    summary: { ...source.summary },
    trends: {
      userGrowth: [...source.trends.userGrowth],
      pollActivity: [...source.trends.pollActivity],
      voteActivity: [...source.trends.voteActivity],
      engagementTrends: [...source.trends.engagementTrends],
      trustTrends: [...source.trends.trustTrends],
      civicEngagement: [...source.trends.civicEngagement]
    },
    events: { ...source.events },
    civicEngagement: { ...source.civicEngagement }
  };

  if (source.enhancedInsights) {
    clone.enhancedInsights = {
      comprehensiveAnalysis: source.enhancedInsights.comprehensiveAnalysis,
      trustTierDistribution: source.enhancedInsights.trustTierDistribution,
      botDetectionResults: source.enhancedInsights.botDetectionResults
        ? { ...source.enhancedInsights.botDetectionResults }
        : null,
      platformMetrics: [...source.enhancedInsights.platformMetrics]
    };
  }

  if (source.sessionInsights) {
    clone.sessionInsights = {
      sessionData: source.sessionInsights.sessionData,
      featureUsage: [...source.sessionInsights.featureUsage],
      sessionMetrics: { ...source.sessionInsights.sessionMetrics }
    };
  }

  if (source.userInsights) {
    clone.userInsights = {
      sessions: [...source.userInsights.sessions],
      featureUsage: [...source.userInsights.featureUsage],
      platformMetrics: [...source.userInsights.platformMetrics],
      trustTierProgression: source.userInsights.trustTierProgression
    };
  }

  if (source.systemHealth) {
    clone.systemHealth = [...source.systemHealth];
  }

  if (source.realTimeCapabilities) {
    clone.realTimeCapabilities = { ...source.realTimeCapabilities };
  }

  if (source.metadata) {
    clone.metadata = { ...source.metadata };
  }

  return clone;
};

const normalizeAnalyticsData = (
  raw: unknown,
  fallback?: EnhancedAnalyticsData
): EnhancedAnalyticsData => {
  const data = fallback ? cloneAnalyticsData(fallback) : createDefaultAnalyticsData();
  const record = isRecord(raw) ? raw : {};

  data.period = getString(record.period, data.period);

  if (isRecord(record.summary)) {
    const summary = record.summary;
    data.summary.totalUsers = getNumber(summary.totalUsers, data.summary.totalUsers);
    data.summary.totalPolls = getNumber(summary.totalPolls, data.summary.totalPolls);
    data.summary.totalVotes = getNumber(summary.totalVotes, data.summary.totalVotes);
    data.summary.activeUsers = getNumber(summary.activeUsers, data.summary.activeUsers);
    data.summary.newPolls = getNumber(summary.newPolls, data.summary.newPolls);
    data.summary.newVotes = getNumber(summary.newVotes, data.summary.newVotes);
    data.summary.engagementScore = getNumber(summary.engagementScore, data.summary.engagementScore);
    data.summary.trustScore = getNumber(summary.trustScore, data.summary.trustScore);
    data.summary.participationRate = getNumber(summary.participationRate, data.summary.participationRate);
    data.summary.conversionRate = getNumber(summary.conversionRate, data.summary.conversionRate);
    data.summary.bounceRate = getNumber(summary.bounceRate, data.summary.bounceRate);
    data.summary.sessionDuration = getNumber(summary.sessionDuration, data.summary.sessionDuration);
  }

  if (isRecord(record.trends)) {
    const trends = record.trends;
    data.trends.userGrowth = normalizeDateCountSeries(trends.userGrowth, data.trends.userGrowth);
    data.trends.pollActivity = normalizeDateCountSeries(trends.pollActivity, data.trends.pollActivity);
    data.trends.voteActivity = normalizeDateCountSeries(trends.voteActivity, data.trends.voteActivity);
    data.trends.engagementTrends = normalizeDateScoreSeries(trends.engagementTrends, data.trends.engagementTrends);
    data.trends.trustTrends = normalizeDateScoreSeries(trends.trustTrends, data.trends.trustTrends);
    data.trends.civicEngagement = normalizeCivicSeries(trends.civicEngagement, data.trends.civicEngagement);
  }

  if (isRecord(record.events)) {
    const events = record.events;
    data.events.pollCreated = getNumber(events.pollCreated, data.events.pollCreated);
    data.events.pollVoted = getNumber(events.pollVoted, data.events.pollVoted);
    data.events.civicActionCreated = getNumber(events.civicActionCreated, data.events.civicActionCreated);
    data.events.notificationSent = getNumber(events.notificationSent, data.events.notificationSent);
    data.events.userEngagement = getNumber(events.userEngagement, data.events.userEngagement);
  }

  if (isRecord(record.civicEngagement)) {
    const civic = record.civicEngagement;
    data.civicEngagement.totalActions = getNumber(civic.totalActions, data.civicEngagement.totalActions);
    data.civicEngagement.activePetitions = getNumber(civic.activePetitions, data.civicEngagement.activePetitions);
    data.civicEngagement.completedActions = getNumber(civic.completedActions, data.civicEngagement.completedActions);
    data.civicEngagement.engagementRate = getNumber(civic.engagementRate, data.civicEngagement.engagementRate);
  }

  if (isRecord(record.enhancedInsights)) {
    const insights = record.enhancedInsights;
    const platformMetrics = Array.isArray(insights.platformMetrics)
      ? (insights.platformMetrics as PlatformMetricRow[])
      : [];

    data.enhancedInsights = {
      comprehensiveAnalysis: isRecord(insights.comprehensiveAnalysis)
        ? insights.comprehensiveAnalysis
        : data.enhancedInsights?.comprehensiveAnalysis ?? null,
      trustTierDistribution:
        insights.trustTierDistribution ?? data.enhancedInsights?.trustTierDistribution ?? null,
      botDetectionResults: parseBotDetectionResults(
        insights.botDetectionResults ?? insights.bot_detection_results ?? null
      ),
      platformMetrics
    };
  } else if (data.enhancedInsights) {
    delete data.enhancedInsights;
  }

  if (isRecord(record.sessionInsights)) {
    const session = record.sessionInsights;
    const metrics = isRecord(session.sessionMetrics) ? session.sessionMetrics : {};

    data.sessionInsights = {
      sessionData: isRecord(session.sessionData)
        ? (session.sessionData as UserSessionRow)
        : null,
      featureUsage: Array.isArray(session.featureUsage)
        ? (session.featureUsage as FeatureUsageRow[])
        : [],
      sessionMetrics: {
        totalActions: getNumber(metrics.totalActions, 0),
        sessionDuration: getNumber(metrics.sessionDuration, 0),
        deviceType: getString(metrics.deviceType, 'unknown'),
        pageViews: getNumber(metrics.pageViews, 0)
      }
    };
  } else if (data.sessionInsights) {
    delete data.sessionInsights;
  }

  if (isRecord(record.userInsights)) {
    const user = record.userInsights;
    data.userInsights = {
      sessions: Array.isArray(user.sessions) ? (user.sessions as UserSessionRow[]) : [],
      featureUsage: Array.isArray(user.featureUsage) ? (user.featureUsage as FeatureUsageRow[]) : [],
      platformMetrics: Array.isArray(user.platformMetrics)
        ? (user.platformMetrics as PlatformMetricRow[])
        : [],
      trustTierProgression: user.trustTierProgression ?? null
    };
  } else if (data.userInsights) {
    delete data.userInsights;
  }

  if (Array.isArray(record.systemHealth)) {
    data.systemHealth = record.systemHealth as SystemHealthRow[];
  } else if (data.systemHealth) {
    delete data.systemHealth;
  }

  if (isRecord(record.realTimeCapabilities)) {
    const capabilities = record.realTimeCapabilities;
    data.realTimeCapabilities = {
      sessionTracking: getBoolean(capabilities.sessionTracking, true),
      featureUsageTracking: getBoolean(capabilities.featureUsageTracking, true),
      platformMetricsTracking: getBoolean(capabilities.platformMetricsTracking, true),
      systemHealthMonitoring: getBoolean(capabilities.systemHealthMonitoring, true)
    };
  } else if (data.realTimeCapabilities) {
    delete data.realTimeCapabilities;
  }

  if (isRecord(record.metadata)) {
    data.metadata = { ...record.metadata };
  } else if (data.metadata) {
    delete data.metadata;
  }

  return data;
};

const buildFeatureUsageContext = (entries: Record<string, unknown>): FeatureUsageContext => {
  const context: FeatureUsageContext = {};
  Object.entries(entries).forEach(([key, value]) => {
    const jsonValue = toJsonValue(value);
    if (jsonValue !== null) {
      context[key] = jsonValue;
    }
  });
  return context;
};

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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase =
    supabaseUrl && supabaseAnonKey
      ? createClient<Database>(supabaseUrl, supabaseAnonKey)
      : null;

  const enhancedAnalytics = useMemo(
    () => (supabase ? new EnhancedAnalyticsService(supabase) : null),
    [supabase],
  );

  const {
    setDashboard: setAnalyticsDashboard,
    updateUserBehavior,
    setLoading: setAnalyticsLoading,
    setError: setAnalyticsError,
  } = useAnalyticsActions();

  // Fetch enhanced analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setAnalyticsLoading(true);
      setAnalyticsError(null);

      let analyticsData: EnhancedAnalyticsData;
      let rawAnalytics: unknown;

      if (IS_E2E_HARNESS) {
        rawAnalytics = cloneAnalyticsData(HARNESS_ANALYTICS_DATA);
      } else if (pollId) {
        // Get poll-specific analytics
        const response = await fetch(`/api/analytics/unified/${pollId}?methods=comprehensive`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error ?? 'Failed to fetch analytics');
        }

        const canEnhance = enableNewSchema && !!enhancedAnalytics;

        // Enhance with new schema capabilities if enabled and service available
        if (canEnhance && enhancedAnalytics) {
          rawAnalytics = await enhancedAnalytics.enhanceUnifiedAnalytics(pollId, result.analytics);
        } else {
          rawAnalytics = result.analytics;
        }
      } else {
        // Get general platform analytics
        rawAnalytics = await getGeneralAnalytics();
      }

      analyticsData = normalizeAnalyticsData(rawAnalytics);

      const canEnhance = enableNewSchema && !!enhancedAnalytics;

      // Enhance with session data if sessionId provided
      if (!IS_E2E_HARNESS && sessionId && canEnhance && enhancedAnalytics) {
        const sessionEnhanced = await enhancedAnalytics.enhanceAnalyticsStore(
          analyticsData as unknown as Record<string, unknown>,
          sessionId
        );
        analyticsData = normalizeAnalyticsData(sessionEnhanced, analyticsData);
      }

      // Enhance with user data if userId provided
      if (!IS_E2E_HARNESS && userId && canEnhance && enhancedAnalytics) {
        const userEnhanced = await enhancedAnalytics.enhanceAnalyticsHook(
          analyticsData as unknown as Record<string, unknown>,
          userId
        );
        analyticsData = normalizeAnalyticsData(userEnhanced, analyticsData);
      }

      const dashboardSummary = {
        totalEvents: analyticsData.summary.totalVotes,
        uniqueUsers: analyticsData.summary.totalUsers,
        sessionCount: analyticsData.summary.activeUsers,
        averageSessionDuration: analyticsData.summary.sessionDuration,
        topPages: analyticsData.trends.userGrowth.slice(-5).map(({ date, count }) => ({
          page: date,
          views: count
        })),
        topActions: analyticsData.trends.engagementTrends.slice(-5).map(({ date, score }) => ({
          action: date,
          count: Math.round(score)
        })),
        userEngagement: analyticsData.summary.engagementScore,
        conversionFunnel: [
          {
            step: 'Participation',
            users: analyticsData.summary.totalUsers,
            conversion: analyticsData.summary.conversionRate
          }
        ]
      };
      setAnalyticsDashboard(dashboardSummary);

      if (analyticsData.sessionInsights) {
        const metrics = analyticsData.sessionInsights.sessionMetrics;
        updateUserBehavior({
          sessionDuration: metrics.sessionDuration,
          pageViews: metrics.pageViews,
          interactions: metrics.totalActions,
          bounceRate: analyticsData.summary.bounceRate,
          conversionRate: analyticsData.summary.conversionRate,
          userJourney: analyticsData.trends.userGrowth.map(({ date }) => date).slice(-10),
          engagementScore: analyticsData.summary.engagementScore,
          lastActivity: new Date().toISOString(),
          deviceType: metrics.deviceType,
          browser: 'unknown',
          os: 'unknown'
        });
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
      setAnalyticsError(errorMessage);
      logger.error('Enhanced analytics fetch error:', err);
    } finally {
      setLoading(false);
      setAnalyticsLoading(false);
    }
  }, [
    pollId,
    userId,
    sessionId,
    enableNewSchema,
    enhancedAnalytics,
    setAnalyticsDashboard,
    updateUserBehavior,
    setAnalyticsLoading,
    setAnalyticsError,
  ]);

  // Track feature usage
  const trackFeatureUsage = useCallback(async (
    featureName: string,
    action: string = 'interact',
    context: Record<string, unknown> = {}
  ) => {
    try {
      if (IS_E2E_HARNESS) {
        return;
      }
      const extras: Record<string, unknown> = {
        action,
        context,
        timestamp: new Date().toISOString()
      };

      if (sessionId) {
        extras.session_id = sessionId;
      }

      const contextPayload: FeatureUsageContext = buildFeatureUsageContext(extras);
      if (!enhancedAnalytics) return;
      await enhancedAnalytics.trackFeatureUsage(userId ?? null, featureName, contextPayload);
    } catch (err) {
      logger.error('Feature usage tracking error:', err);
    }
  }, [userId, sessionId, enhancedAnalytics]);

  // Track session activity
  const trackSessionActivity = useCallback(
    async (action: string, page: string, metadata: SessionMetadata = {}) => {
      try {
        if (IS_E2E_HARNESS || !enhancedAnalytics) {
          return;
        }
        if (!sessionId) return;

        const payload: Parameters<EnhancedAnalyticsService['trackUserSession']>[0] = {
          sessionId,
          deviceInfo: metadata.deviceInfo ?? null,
          currentPage: page,
          action
        };

        if (userId) {
          payload.userId = userId;
        }

        const userAgent = metadata.userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : undefined);
        if (userAgent) {
          payload.userAgent = userAgent;
        }

        if (metadata.ipAddress) {
          payload.ipAddress = metadata.ipAddress;
        }

        await enhancedAnalytics.trackUserSession(payload);
      } catch (err) {
        logger.error('Session activity tracking error:', err);
      }
    },
    [userId, sessionId, enhancedAnalytics]
  );

  // Track auth events
  const trackAuthEvent = useCallback(
    async (authEvent: AuthEventPayload) => {
      try {
        if (IS_E2E_HARNESS || !enhancedAnalytics) {
          return;
        }
        if (!sessionId) return;
      
        await enhancedAnalytics.enhanceAuthAnalytics(authEvent, sessionId);
      } catch (err) {
        logger.error('Auth event tracking error:', err);
      }
    },
    [sessionId, enhancedAnalytics]
  );

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
      if (IS_E2E_HARNESS) {
        return HARNESS_SYSTEM_HEALTH.map((entry) => ({ ...entry }));
      }
      if (!supabase) {
        logger.error('System health fetch error: Supabase not configured');
        return [];
      }
      const { data: healthData, error } = await supabase
        .from('system_health')
        .select('*')
        .order('last_check', { ascending: false })
        .returns<SystemHealthRow[]>();

      if (error) throw error;
      return healthData ?? [];
    } catch (err) {
      logger.error('System health fetch error:', err);
      return [];
    }
  }, [supabase]);

  // Get active site messages
  const getActiveSiteMessages = useCallback(async (targetAudience: string = 'all') => {
    try {
      if (IS_E2E_HARNESS) {
        return HARNESS_SITE_MESSAGES.map((entry) => ({ ...entry }));
      }
      if (!supabase) {
        logger.error('Site messages fetch error: Supabase not configured');
        return [];
      }
      const { data: messages, error } = await supabase
        .from('site_messages')
        .select('*')
        .eq('is_active', true)
        .eq('target_audience', targetAudience)
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString())
        .order('priority', { ascending: false })
        .returns<SiteMessageRow[]>();

      if (error) throw error;
      return messages ?? [];
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
const HARNESS_SYSTEM_HEALTH: SystemHealthRow[] = [
  {
    id: 'analytics-health-api',
    component: 'api',
    status: 'operational',
    status_text: 'All systems nominal',
    last_check: '2025-11-13T12:00:00.000Z',
    response_time_ms: 180,
    region: 'us-east-1',
    created_at: '2025-11-01T00:00:00.000Z',
    updated_at: '2025-11-13T12:00:00.000Z',
    metadata: {
      source: 'e2e-harness',
    },
  } as unknown as SystemHealthRow,
  {
    id: 'analytics-health-realtime',
    component: 'realtime',
    status: 'degraded',
    status_text: 'Recovering from spike',
    last_check: '2025-11-13T11:55:00.000Z',
    response_time_ms: 420,
    region: 'us-west-2',
    created_at: '2025-10-28T00:00:00.000Z',
    updated_at: '2025-11-13T11:55:00.000Z',
    metadata: {
      source: 'e2e-harness',
    },
  } as unknown as SystemHealthRow,
];

const HARNESS_SITE_MESSAGES: SiteMessageRow[] = [
  {
    id: 'analytics-message-maintenance',
    title: 'Scheduled maintenance',
    body: 'Analytics refresh will pause Saturday 01:00–02:00 UTC.',
    is_active: true,
    start_date: '2025-11-14T00:00:00.000Z',
    end_date: '2025-11-15T02:00:00.000Z',
    target_audience: 'all',
    priority: 10,
    created_at: '2025-11-10T09:00:00.000Z',
    updated_at: '2025-11-12T17:30:00.000Z',
    dismissible: true,
    metadata: {
      source: 'e2e-harness',
    },
  } as unknown as SiteMessageRow,
  {
    id: 'analytics-message-digest',
    title: 'Weekly insight digest',
    body: 'Engagement up 12% week-over-week. Review highlights in the summary table.',
    is_active: true,
    start_date: '2025-11-11T00:00:00.000Z',
    end_date: '2025-11-18T00:00:00.000Z',
    target_audience: 'admin',
    priority: 5,
    created_at: '2025-11-11T08:15:00.000Z',
    updated_at: '2025-11-13T08:15:00.000Z',
    dismissible: false,
    metadata: {
      source: 'e2e-harness',
    },
  } as unknown as SiteMessageRow,
];

const HARNESS_ANALYTICS_DATA: EnhancedAnalyticsData = (() => {
  const data = createDefaultAnalyticsData();

  data.period = 'Last 30 days';
  data.summary = {
    totalUsers: 1450,
    totalPolls: 58,
    totalVotes: 9820,
    activeUsers: 910,
    newPolls: 18,
    newVotes: 1830,
    engagementScore: 74,
    trustScore: 82,
    participationRate: 62,
    conversionRate: 39,
    bounceRate: 19,
    sessionDuration: 312,
  };

  data.trends.userGrowth = [
    { date: '2025-11-07', count: 140 },
    { date: '2025-11-08', count: 155 },
    { date: '2025-11-09', count: 160 },
    { date: '2025-11-10', count: 172 },
    { date: '2025-11-11', count: 180 },
    { date: '2025-11-12', count: 188 },
    { date: '2025-11-13', count: 194 },
  ];
  data.trends.pollActivity = [
    { date: '2025-11-07', count: 12 },
    { date: '2025-11-08', count: 9 },
    { date: '2025-11-09', count: 10 },
    { date: '2025-11-10', count: 15 },
    { date: '2025-11-11', count: 14 },
    { date: '2025-11-12', count: 13 },
    { date: '2025-11-13', count: 16 },
  ];
  data.trends.voteActivity = [
    { date: '2025-11-07', count: 420 },
    { date: '2025-11-08', count: 460 },
    { date: '2025-11-09', count: 510 },
    { date: '2025-11-10', count: 540 },
    { date: '2025-11-11', count: 560 },
    { date: '2025-11-12', count: 590 },
    { date: '2025-11-13', count: 620 },
  ];
  data.trends.engagementTrends = [
    { date: '2025-11-07', score: 68 },
    { date: '2025-11-08', score: 70 },
    { date: '2025-11-09', score: 71 },
    { date: '2025-11-10', score: 73 },
    { date: '2025-11-11', score: 74 },
    { date: '2025-11-12', score: 75 },
    { date: '2025-11-13', score: 76 },
  ];
  data.trends.trustTrends = [
    { date: '2025-11-07', score: 79 },
    { date: '2025-11-08', score: 80 },
    { date: '2025-11-09', score: 81 },
    { date: '2025-11-10', score: 82 },
    { date: '2025-11-11', score: 82 },
    { date: '2025-11-12', score: 83 },
    { date: '2025-11-13', score: 84 },
  ];
  data.trends.civicEngagement = [
    { date: '2025-11-07', actions: 210 },
    { date: '2025-11-08', actions: 195 },
    { date: '2025-11-09', actions: 205 },
    { date: '2025-11-10', actions: 230 },
    { date: '2025-11-11', actions: 240 },
    { date: '2025-11-12', actions: 250 },
    { date: '2025-11-13', actions: 265 },
  ];

  data.events = {
    pollCreated: 24,
    pollVoted: 740,
    civicActionCreated: 88,
    notificationSent: 1120,
    userEngagement: 540,
  };

  data.civicEngagement = {
    totalActions: 2470,
    activePetitions: 34,
    completedActions: 980,
    engagementRate: 64,
  };

  data.enhancedInsights = {
    comprehensiveAnalysis: {
      summary: 'Engagement trending upward with strong trust-signal correlations.',
      focus: ['resiliency', 'retention', 'moderation'],
    },
    trustTierDistribution: [
      { tier: 'T0', count: 420, percentage: 29 },
      { tier: 'T1', count: 360, percentage: 25 },
      { tier: 'T2', count: 310, percentage: 21 },
      { tier: 'T3', count: 260, percentage: 18 },
      { tier: 'Flagged', count: 100, percentage: 7 },
    ],
    botDetectionResults: {
      riskScore: 0.22,
      confidence: 0.78,
      suspiciousPatterns: [
        { type: 'velocity', description: '17 accounts exceeded normal vote velocity.' },
        { type: 'geo', description: '5 accounts show unexpected geo drift.' },
      ],
    },
    platformMetrics: [
      {
        id: 'metric-1',
        metric_name: 'avg_response_ms',
        metric_value: 245,
        captured_at: '2025-11-13T11:50:00.000Z',
      },
      {
        id: 'metric-2',
        metric_name: 'error_rate',
        metric_value: 0.014,
        captured_at: '2025-11-13T11:50:00.000Z',
      },
    ] as unknown as PlatformMetricRow[],
  };

  data.sessionInsights = {
    sessionData: null,
    featureUsage: [],
    sessionMetrics: {
      totalActions: 184,
      sessionDuration: 42,
      deviceType: 'desktop',
      pageViews: 68,
    },
  };

  data.userInsights = {
    sessions: [],
    featureUsage: [],
    platformMetrics: [],
    trustTierProgression: null,
  };

  data.systemHealth = HARNESS_SYSTEM_HEALTH;
  data.realTimeCapabilities = {
    sessionTracking: true,
    featureUsageTracking: true,
    platformMetricsTracking: false,
    systemHealthMonitoring: true,
  };
  data.metadata = {
    source: 'e2e-harness',
    seededAt: '2025-11-13T12:05:00.000Z',
  };

  return data;
})();

async function getGeneralAnalytics(): Promise<EnhancedAnalyticsData> {
  if (IS_E2E_HARNESS) {
    return cloneAnalyticsData(HARNESS_ANALYTICS_DATA);
  }
  return createDefaultAnalyticsData();
}
