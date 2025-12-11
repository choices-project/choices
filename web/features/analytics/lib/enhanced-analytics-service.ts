/**
 * Enhanced Analytics Service for Features
 * Integrates new schema capabilities with existing analytics
 * Created: 2025-10-27
 */


import { logger } from '@/lib/utils/logger';

import type { Database, Json } from '@/types/database';
import type { createClient } from '@supabase/supabase-js';

type SupabaseClient = ReturnType<typeof createClient<Database>>;

type UserSessionRow = Database['public']['Tables']['user_sessions']['Row'];
type FeatureUsageRow = Database['public']['Tables']['feature_usage']['Row'];
type PlatformAnalyticsRow = Database['public']['Tables']['platform_analytics']['Row'];
type SystemHealthRow = Database['public']['Tables']['system_health']['Row'];
type SiteMessageRow = Database['public']['Tables']['site_messages']['Row'];
// type SiteMessageInsert = Database['public']['Tables']['site_messages']['Insert'];
type FeedbackRow = Database['public']['Tables']['feedback']['Row'];

type AnalyticsRecord = Record<string, unknown>;
type JsonRecord = Record<string, Json | undefined>;
type DimensionsRecord = JsonRecord;
type AuthEventPayload = JsonRecord & {
  method?: string;
  success?: boolean;
  userId?: string;
};
type BotDetectionPayload = JsonRecord & {
  risk_score?: number;
  suspicious_patterns?: unknown[];
  confidence?: number;
};
type UserSessionPayload = {
  userId?: string;
  sessionId: string;
  deviceInfo?: Json | null;
  userAgent?: string;
  ipAddress?: string;
  currentPage?: string;
  action?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// const asRecord = (value: unknown): Record<string, unknown> => (isRecord(value) ? value : {});

const extractRecordField = (source: AnalyticsRecord, key: string): Record<string, unknown> => {
  const value = source[key];
  return isRecord(value) ? value : {};
};

export const toJsonValue = (value: unknown): Json => {
  if (value === undefined) {
    return null;
  }
  try {
    return JSON.parse(JSON.stringify(value)) as Json;
  } catch {
    return null;
  }
};

const getDeviceType = (deviceInfo: Json | null): string => {
  if (!isRecord(deviceInfo)) {
    return 'unknown';
  }

  const type = deviceInfo.type;
  return typeof type === 'string' ? type : 'unknown';
};

const ensureArray = <T>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : []);


export class EnhancedAnalyticsService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * ENHANCE EXISTING ANALYTICS WITH NEW SCHEMA CAPABILITIES
   * Integrates with your existing unified analytics API
   */
  async enhanceUnifiedAnalytics(pollId: string, existingAnalytics: AnalyticsRecord | null = null): Promise<AnalyticsRecord> {
    try {
      // Prefer precomputed demographic insights when available
      const { data: insights } = await this.supabase
        .from('poll_demographic_insights')
        .select('*')
        .eq('poll_id', pollId)
        .maybeSingle();

      const precomputed = insights ?? null;

      // Use our new built-in functions to enhance existing analytics
      const [
        comprehensiveAnalytics,
        trustTierAnalysis,
        botDetection,
        platformMetrics
      ] = await Promise.all([
        this.supabase.rpc('get_comprehensive_analytics', {
          p_poll_id: pollId,
          p_analysis_window: '7 days'
        }),
        this.supabase.rpc('calculate_trust_filtered_votes', {
          p_poll_id: pollId
        }),
        this.supabase.rpc('detect_bot_behavior', {
          p_poll_id: pollId,
          p_time_window: '24 hours'
        }),
        this.getPlatformMetricsForPoll(pollId)
      ]);

      // Enhance existing analytics with new data
      const enhancedInsights = {
        comprehensiveAnalysis: comprehensiveAnalytics.data,
        trustTierDistribution: trustTierAnalysis.data,
        botDetectionResults: botDetection.data,
        platformMetrics,
        demographicInsights: precomputed
      };

      const baseAnalytics: AnalyticsRecord = existingAnalytics ?? {};
      const baseMetadata = extractRecordField(baseAnalytics, 'metadata');

      const enhancedMetadata = {
        ...baseMetadata,
        enhancedWith: 'new_schema_capabilities',
        schemaVersion: 'enhanced_2025_10_27',
        integrationTimestamp: new Date().toISOString()
      };

      const enhancedAnalytics = {
        ...baseAnalytics,
        enhancedInsights,
        sessionAnalytics: await this.getSessionAnalytics(pollId),
        featureUsage: await this.getFeatureUsageAnalytics(pollId),
        systemHealth: await this.getSystemHealthContext(),
        metadata: enhancedMetadata
      };

      // Track this enhancement in platform analytics
      await this.recordPlatformMetric('analytics_enhancement', {
        poll_id: pollId,
        enhancement_type: 'unified_analytics',
        data_points_added: Object.keys(enhancedInsights).length
      });

      return enhancedAnalytics;
    } catch (error) {
      logger.error('Analytics enhancement error:', error);
      // Return existing analytics if enhancement fails
      return existingAnalytics ?? {};
    }
  }

  /**
   * ENHANCE EXISTING ANALYTICS STORE WITH SESSION TRACKING
   * Integrates with your existing analyticsStore
   */
  async enhanceAnalyticsStore(storeData: AnalyticsRecord | null, sessionId: string): Promise<AnalyticsRecord> {
    try {
      // Get session data from our new user_sessions table
      const { data: sessionData } = await this.supabase
        .from('user_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single<UserSessionRow>();

      // Get feature usage for this session
      const { data: featureUsage } = await this.supabase
        .from('feature_usage')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: false });

      // Enhance store data with session insights
      const baseStore: AnalyticsRecord = storeData ?? {};
      const features = ensureArray(featureUsage as FeatureUsageRow[] | null | undefined);

      const enhancedStoreData = {
        ...baseStore,
        sessionInsights: {
          sessionData: sessionData ?? null,
          featureUsage: features,
          sessionMetrics: {
            totalActions: features.length,
            sessionDuration: sessionData ? this.calculateSessionDuration(sessionData) : 0,
            deviceType: getDeviceType(sessionData?.device_info ?? null),
            pageViews: sessionData?.page_views ?? 0
          }
        },
        enhancedAt: new Date().toISOString()
      };

      return enhancedStoreData;
    } catch (error) {
      logger.error('Store enhancement error:', error);
      return storeData ?? {};
    }
  }

  /**
   * ENHANCE EXISTING ANALYTICS HOOK WITH REAL-TIME CAPABILITIES
   * Integrates with your existing useAnalytics hook
   */
  async enhanceAnalyticsHook(hookData: AnalyticsRecord | null, userId?: string): Promise<AnalyticsRecord> {
    try {
      // Get user-specific analytics from our new tables
      const [
        userSessions,
        userFeatureUsage,
        userPlatformMetrics
      ] = await Promise.all([
        this.getUserSessions(userId),
        this.getUserFeatureUsage(userId),
        this.getUserPlatformMetrics(userId)
      ]);

      // Enhance hook data with user-specific insights
      const baseHook: AnalyticsRecord = hookData ?? {};
      const enhancedHookData = {
        ...baseHook,
        userInsights: {
          sessions: userSessions,
          featureUsage: userFeatureUsage,
          platformMetrics: userPlatformMetrics,
          trustTierProgression: await this.getUserTrustTierProgression(userId)
        },
        realTimeCapabilities: {
          sessionTracking: true,
          featureUsageTracking: true,
          platformMetricsTracking: true,
          systemHealthMonitoring: true
        }
      };

      return enhancedHookData;
    } catch (error) {
      logger.error('Hook enhancement error:', error);
      return hookData ?? {};
    }
  }

  /**
   * INTEGRATE WITH EXISTING AUTH ANALYTICS
   * Enhances your existing auth analytics with session tracking
   */
  async enhanceAuthAnalytics(authEvent: AuthEventPayload, sessionId: string): Promise<AuthEventPayload> {
    try {
      // Track auth event in our new session system
      await this.trackAuthEventInSession(authEvent, sessionId);

      // Update session with auth data
      await this.updateSessionWithAuth(sessionId, authEvent);

      // Track feature usage for auth
      await this.trackFeatureUsage(null, 'authentication', {
        auth_method: authEvent.method,
        success: authEvent.success,
        session_id: sessionId
      });

      return {
        ...authEvent,
        sessionEnhanced: true,
        trackedInNewSchema: true
      };
    } catch (error) {
      logger.error('Auth analytics enhancement error:', error);
      return authEvent;
    }
  }

  // Helper methods for integration
  private async getPlatformMetricsForPoll(pollId: string): Promise<PlatformAnalyticsRow[]> {
    const { data } = await this.supabase
      .from('platform_analytics')
      .select('*')
      .eq('dimensions->poll_id', pollId)
      .order('timestamp', { ascending: false })
      .limit(10);

    return (data ?? []) as PlatformAnalyticsRow[];
  }

  private async getSessionAnalytics(_pollId: string): Promise<UserSessionRow[]> {
    const { data } = await this.supabase
      .from('user_sessions')
      .select('*')
      .gte('last_activity', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('last_activity', { ascending: false });

    return (data ?? []) as UserSessionRow[];
  }

  private async getFeatureUsageAnalytics(_pollId: string): Promise<FeatureUsageRow[]> {
    const { data } = await this.supabase
      .from('feature_usage')
      .select('*')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false });

    return (data ?? []) as FeatureUsageRow[];
  }

  async getSystemHealthContext(): Promise<SystemHealthRow[]> {
    const { data } = await this.supabase
      .from('system_health')
      .select('*')
      .order('last_check', { ascending: false });

    return (data ?? []) as SystemHealthRow[];
  }

  private async getUserSessions(userId?: string): Promise<UserSessionRow[]> {
    if (!userId) return [];

    const { data } = await this.supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(10);

    return (data ?? []) as UserSessionRow[];
  }

  private async getUserFeatureUsage(userId?: string): Promise<FeatureUsageRow[]> {
    if (!userId) return [];

    const { data } = await this.supabase
      .from('feature_usage')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(20);

    return (data ?? []) as FeatureUsageRow[];
  }

  private async getUserPlatformMetrics(userId?: string): Promise<PlatformAnalyticsRow[]> {
    if (!userId) return [];

    const { data } = await this.supabase
      .from('platform_analytics')
      .select('*')
      .eq('dimensions->user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(10);

    return (data ?? []) as PlatformAnalyticsRow[];
  }

  private async getUserTrustTierProgression(userId?: string): Promise<unknown> {
    if (!userId) return null;

    const { data } = await this.supabase.rpc('get_trust_tier_progression', {
      p_user_id: userId
    });

    return data;
  }

  private async trackAuthEventInSession(authEvent: AuthEventPayload, sessionId: string): Promise<void> {
    const sanitizedEvent = toJsonValue(authEvent);
    const metadataPayload = toJsonValue({
      auth_events: [sanitizedEvent],
      last_auth_event: new Date().toISOString()
    });

    await this.supabase
      .from('user_sessions')
      .update({
        metadata: metadataPayload
      })
      .eq('session_id', sessionId);
  }

  private async updateSessionWithAuth(sessionId: string, authEvent: AuthEventPayload): Promise<void> {
    const metadataPayload = toJsonValue({
      authenticated: authEvent.success ?? null,
      auth_method: authEvent.method ?? null
    });

    await this.supabase
      .from('user_sessions')
      .update({
        user_id: authEvent.userId ?? null,
        last_activity: new Date().toISOString(),
        metadata: metadataPayload
      })
      .eq('session_id', sessionId);
  }

  async trackFeatureUsage(userId: string | null, featureName: string, context: DimensionsRecord): Promise<void> {
    const contextPayload = toJsonValue(context);

    await this.supabase
      .from('feature_usage')
      .insert({
        user_id: userId,
        feature_name: featureName,
        action_type: 'interact',
        context: contextPayload,
        timestamp: new Date().toISOString(),
        success: true
      });
  }

  async recordPlatformMetric(metricName: string, dimensions: DimensionsRecord): Promise<void> {
    const dimensionsPayload = toJsonValue(dimensions);

    await this.supabase
      .from('platform_analytics')
      .insert({
        metric_name: metricName,
        metric_value: 1,
        metric_type: 'counter',
        dimensions: dimensionsPayload,
        category: 'integration',
        source: 'enhanced_analytics'
      });
  }

  async updateSystemHealth(checkName: string, status: 'ok' | 'warning' | 'critical', details?: DimensionsRecord): Promise<void> {
    try {
      const detailsPayload = details ? toJsonValue(details) : null;
      const metadataPayload = toJsonValue({ check_name: checkName });

      const { error } = await this.supabase.from('system_health').upsert({
        service_name: checkName,
        health_status: status,
        details: detailsPayload,
        last_check: new Date().toISOString(),
        metadata: metadataPayload
      }, { onConflict: 'service_name' });
      if (error) {
        logger.error('Error updating system health:', error);
      }
    } catch (error) {
      logger.error('System health update error:', error);
    }
  }

  private calculateSessionDuration(sessionData: UserSessionRow): number {
    if (!sessionData.started_at) return 0;

    const start = new Date(sessionData.started_at);
    const end = new Date(sessionData.last_activity ?? new Date());

    return Math.floor((end.getTime() - start.getTime()) / 1000); // seconds
  }

  // Additional methods for API compatibility
  async detectBotBehavior(pollId: string, _userId: string) {
    try {
      const { data, error } = await this.supabase.rpc('detect_bot_behavior', {
        p_poll_id: pollId,
        p_time_window: '24 hours'
      });

      if (error) throw error;

      const payloadCandidate = Array.isArray(data) ? data[0] : data;
      const payload: BotDetectionPayload = isRecord(payloadCandidate) ? payloadCandidate as BotDetectionPayload : {};

      const riskScore = typeof payload.risk_score === 'number' ? payload.risk_score : 0;
      const suspiciousPatterns = Array.isArray(payload.suspicious_patterns) ? payload.suspicious_patterns : [];
      const confidence = typeof payload.confidence === 'number' ? payload.confidence : 0;

      return {
        riskScore,
        suspiciousPatterns,
        confidence,
        analysis: payloadCandidate
      };
    } catch (error) {
      logger.error('Bot detection error:', error);
      return {
        riskScore: 0,
        suspiciousPatterns: [],
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getActiveSiteMessages(targetAudience: string = 'all'): Promise<SiteMessageRow[]> {
    try {
      const { data, error } = await this.supabase
        .from('site_messages')
        .select('*')
        .eq('is_active', true)
        .contains('target_audience', [targetAudience])
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString())
        .order('priority', { ascending: false });

      if (error) throw error;
      return (data ?? []) as SiteMessageRow[];
    } catch (error) {
      logger.error('Site messages fetch error:', error);
      return [];
    }
  }

  async trackUserSession(sessionData: UserSessionPayload): Promise<UserSessionRow[] | null> {
    try {
      const metadataRecord: DimensionsRecord = {
        timestamp: new Date().toISOString()
      };

      if (typeof sessionData.currentPage === 'string') {
        metadataRecord.current_page = sessionData.currentPage;
      }

      if (typeof sessionData.action === 'string') {
        metadataRecord.action = sessionData.action;
      }

      const metadataPayload = toJsonValue(metadataRecord);
      const deviceInfoPayload = sessionData.deviceInfo !== undefined ? toJsonValue(sessionData.deviceInfo) : null;

      const payload: Database['public']['Tables']['user_sessions']['Insert'] = {
        user_id: sessionData.userId ?? null,
        session_id: sessionData.sessionId,
        device_info: deviceInfoPayload,
        user_agent: sessionData.userAgent ?? null,
        ip_address: sessionData.ipAddress ?? null,
        metadata: metadataPayload
      };

      const { data, error } = await this.supabase
        .from('user_sessions')
        .insert(payload)
        .select();

      if (error) throw error;
      return (data ?? null) as UserSessionRow[] | null;
    } catch (error) {
      logger.error('Session tracking error:', error);
      return null;
    }
  }

  // Additional methods for API compatibility
  async getAnalyticsDashboard(_timeRange?: string) {
    try {
      const analyticsSummary = await this.getComprehensiveAnalytics();
      return analyticsSummary;
    } catch (error) {
      logger.error('Analytics dashboard error:', error);
      return {
        totalEvents: 0,
        eventsByType: {},
        activeSessions: 0,
        averageSessionDuration: 'N/A',
        featureAdoption: {},
        systemHealthStatus: {},
        recentFeedback: [],
        activeSiteMessages: []
      };
    }
  }

  async getComprehensivePollAnalytics(pollId: string, timeRange?: string) {
    try {
      const { data, error } = await this.supabase.rpc('get_comprehensive_analytics', {
        p_poll_id: pollId,
        p_analysis_window: timeRange ?? '7 days'
      });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Comprehensive poll analytics error:', error);
      return null;
    }
  }

  async getTrustTierAnalysis(pollId: string, _timeRange?: string) {
    try {
      const { data, error } = await this.supabase.rpc('calculate_trust_filtered_votes', {
        p_poll_id: pollId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Trust tier analysis error:', error);
      return null;
    }
  }

  async getComprehensiveAnalytics(): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    activeSessions: number;
    averageSessionDuration: string;
    featureAdoption: Record<string, number>;
    systemHealthStatus: Record<string, string>;
    recentFeedback: FeedbackRow[];
    activeSiteMessages: SiteMessageRow[];
  }> {
    try {
      const [
        analyticsEvents,
        userSessions,
        featureUsage,
        systemHealth,
        recentFeedback,
        activeSiteMessages
      ] = await Promise.all([
        this.supabase.from('platform_analytics').select('*'),
        this.supabase.from('user_sessions').select('*').eq('is_active', true),
        this.supabase.from('feature_usage').select('*'),
        this.supabase.from('system_health').select('*'),
        this.supabase.from('feedback').select('*').order('created_at', { ascending: false }).limit(5),
        this.supabase.from('site_messages').select('*').eq('is_active', true)
      ]);

      const eventRows = (analyticsEvents.data ?? []) as PlatformAnalyticsRow[];
      const totalEvents = eventRows.length;
      const eventsByType = eventRows.reduce<Record<string, number>>((acc, event) => {
        const key = event.metric_name ?? 'unknown';
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {});

      const sessionRows = (userSessions.data ?? []) as UserSessionRow[];
      const activeSessions = sessionRows.length;
      const totalSessionDurationMs = sessionRows.reduce((sum, session) => {
        const start = session.started_at ? Date.parse(session.started_at) : NaN;
        const end = session.ended_at ? Date.parse(session.ended_at) : NaN;
        if (!Number.isNaN(start) && !Number.isNaN(end) && end >= start) {
          return sum + (end - start);
        }
        return sum;
      }, 0);

      const averageSessionDuration = activeSessions > 0 && totalSessionDurationMs > 0
        ? `${(totalSessionDurationMs / activeSessions / 1000 / 60).toFixed(2)} minutes`
        : 'N/A';

      const featureRows = (featureUsage.data ?? []) as FeatureUsageRow[];
      const featureAdoption = featureRows.reduce<Record<string, number>>((acc, usage) => {
        const name = usage.feature_name ?? 'unknown';
        acc[name] = (acc[name] ?? 0) + 1;
        return acc;
      }, {});

      const healthRows = (systemHealth.data ?? []) as SystemHealthRow[];
      const systemHealthStatus = healthRows.reduce<Record<string, string>>((acc, check) => {
        const name = check.service_name ?? 'unknown';
        const status = check.health_status ?? 'unknown';
        acc[name] = status;
        return acc;
      }, {});

      return {
        totalEvents,
        eventsByType,
        activeSessions,
        averageSessionDuration,
        featureAdoption,
        systemHealthStatus,
        recentFeedback: (recentFeedback.data ?? []) as FeedbackRow[],
        activeSiteMessages: (activeSiteMessages.data ?? []) as SiteMessageRow[]
      };
    } catch (error) {
      logger.error('Comprehensive analytics error:', error);
      throw error;
    }
  }
}
