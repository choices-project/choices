/**
 * Enhanced Analytics Hook
 * Integrates new schema capabilities with existing analytics system
 * Created: 2025-10-27
 */

import { createClient } from '@supabase/supabase-js';
import { useState, useEffect, useCallback } from 'react';

import { useAnalyticsActions } from '@/lib/stores/analyticsStore';
import { logger } from '@/lib/utils/logger';
import type { Database, Json } from '@/types/database';

import { EnhancedAnalyticsService, toJsonValue } from '../lib/enhanced-analytics-service';


type _SupabaseClient = ReturnType<typeof createClient<Database>>;

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
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const enhancedAnalytics = new EnhancedAnalyticsService(supabase);

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

      if (pollId) {
        // Get poll-specific analytics
        const response = await fetch(`/api/analytics/unified/${pollId}?methods=comprehensive`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error ?? 'Failed to fetch analytics');
        }

        // Enhance with new schema capabilities if enabled
        if (enableNewSchema) {
          rawAnalytics = await enhancedAnalytics.enhanceUnifiedAnalytics(pollId, result.analytics);
        } else {
          rawAnalytics = result.analytics;
        }
      } else {
        // Get general platform analytics
        rawAnalytics = await getGeneralAnalytics();
      }

      analyticsData = normalizeAnalyticsData(rawAnalytics);

      // Enhance with session data if sessionId provided
      if (sessionId && enableNewSchema) {
        const sessionEnhanced = await enhancedAnalytics.enhanceAnalyticsStore(
          analyticsData as unknown as Record<string, unknown>,
          sessionId
        );
        analyticsData = normalizeAnalyticsData(sessionEnhanced, analyticsData);
      }

      // Enhance with user data if userId provided
      if (userId && enableNewSchema) {
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
  }, [pollId, userId, sessionId, enableNewSchema, enhancedAnalytics]);

  // Track feature usage
  const trackFeatureUsage = useCallback(async (
    featureName: string,
    action: string = 'interact',
    context: Record<string, unknown> = {}
  ) => {
    try {
      const extras: Record<string, unknown> = {
        action,
        context,
        timestamp: new Date().toISOString()
      };

      if (sessionId) {
        extras.session_id = sessionId;
      }

      const contextPayload: FeatureUsageContext = buildFeatureUsageContext(extras);
      await enhancedAnalytics.trackFeatureUsage(userId ?? null, featureName, contextPayload);
    } catch (err) {
      logger.error('Feature usage tracking error:', err);
    }
  }, [userId, sessionId, enhancedAnalytics]);

  // Track session activity
  const trackSessionActivity = useCallback(
    async (action: string, page: string, metadata: SessionMetadata = {}) => {
      try {
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
async function getGeneralAnalytics(): Promise<EnhancedAnalyticsData> {
  return createDefaultAnalyticsData();
}
