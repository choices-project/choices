/**
 * Enhanced Analytics Service for Features
 * Integrates new schema capabilities with existing analytics
 * Created: 2025-10-27
 */

import type { createClient } from '@supabase/supabase-js';

import { logger } from '@/lib/utils/logger';
import type { Database } from '@/types/database';

type SupabaseClient = ReturnType<typeof createClient<Database>>;

export class EnhancedAnalyticsService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * ENHANCE EXISTING ANALYTICS WITH NEW SCHEMA CAPABILITIES
   * Integrates with your existing unified analytics API
   */
  async enhanceUnifiedAnalytics(pollId: string, existingAnalytics: any) {
    try {
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
      const enhancedAnalytics = {
        ...existingAnalytics,
        // Add new schema-powered insights
        enhancedInsights: {
          comprehensiveAnalysis: comprehensiveAnalytics.data,
          trustTierDistribution: trustTierAnalysis.data,
          botDetectionResults: botDetection.data,
          platformMetrics: platformMetrics
        },
        // Add session tracking data
        sessionAnalytics: await this.getSessionAnalytics(pollId),
        // Add feature usage data
        featureUsage: await this.getFeatureUsageAnalytics(pollId),
        // Add system health context
        systemHealth: await this.getSystemHealthContext(),
        // Enhanced metadata
        metadata: {
          ...existingAnalytics.metadata,
          enhancedWith: 'new_schema_capabilities',
          schemaVersion: 'enhanced_2025_10_27',
          integrationTimestamp: new Date().toISOString()
        }
      };

      // Track this enhancement in platform analytics
      await this.recordPlatformMetric('analytics_enhancement', {
        poll_id: pollId,
        enhancement_type: 'unified_analytics',
        data_points_added: Object.keys(enhancedAnalytics.enhancedInsights).length
      });

      return enhancedAnalytics;
    } catch (error) {
      logger.error('Analytics enhancement error:', error);
      // Return existing analytics if enhancement fails
      return existingAnalytics;
    }
  }

  /**
   * ENHANCE EXISTING ANALYTICS STORE WITH SESSION TRACKING
   * Integrates with your existing analyticsStore
   */
  async enhanceAnalyticsStore(storeData: any, sessionId: string) {
    try {
      // Get session data from our new user_sessions table
      const { data: sessionData } = await this.supabase
        .from('user_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      // Get feature usage for this session
      const { data: featureUsage } = await this.supabase
        .from('feature_usage')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: false });

      // Enhance store data with session insights
      const enhancedStoreData = {
        ...storeData,
        sessionInsights: {
          sessionData: sessionData ?? null,
          featureUsage: featureUsage ?? [],
          sessionMetrics: {
            totalActions: featureUsage?.length ?? 0,
            sessionDuration: sessionData ? 
              this.calculateSessionDuration(sessionData) : 0,
            deviceType: (sessionData?.device_info as any)?.type ?? 'unknown',
            pageViews: sessionData?.page_views ?? 0
          }
        },
        enhancedAt: new Date().toISOString()
      };

      return enhancedStoreData;
    } catch (error) {
      logger.error('Store enhancement error:', error);
      return storeData;
    }
  }

  /**
   * ENHANCE EXISTING ANALYTICS HOOK WITH REAL-TIME CAPABILITIES
   * Integrates with your existing useAnalytics hook
   */
  async enhanceAnalyticsHook(hookData: any, userId?: string) {
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
      const enhancedHookData = {
        ...hookData,
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
      return hookData;
    }
  }

  /**
   * INTEGRATE WITH EXISTING AUTH ANALYTICS
   * Enhances your existing auth analytics with session tracking
   */
  async enhanceAuthAnalytics(authEvent: any, sessionId: string) {
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
  private async getPlatformMetricsForPoll(pollId: string) {
    const { data } = await this.supabase
      .from('platform_analytics')
      .select('*')
      .eq('dimensions->poll_id', pollId)
      .order('timestamp', { ascending: false })
      .limit(10);

    return data ?? [];
  }

  private async getSessionAnalytics(pollId: string) {
    const { data } = await this.supabase
      .from('user_sessions')
      .select('*')
      .gte('last_activity', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('last_activity', { ascending: false });

    return data ?? [];
  }

  private async getFeatureUsageAnalytics(pollId: string) {
    const { data } = await this.supabase
      .from('feature_usage')
      .select('*')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false });

    return data ?? [];
  }

  async getSystemHealthContext() {
    const { data } = await this.supabase
      .from('system_health')
      .select('*')
      .order('last_check', { ascending: false });

    return data ?? [];
  }

  private async getUserSessions(userId?: string) {
    if (!userId) return [];
    
    const { data } = await this.supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(10);

    return data ?? [];
  }

  private async getUserFeatureUsage(userId?: string) {
    if (!userId) return [];
    
    const { data } = await this.supabase
      .from('feature_usage')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(20);

    return data ?? [];
  }

  private async getUserPlatformMetrics(userId?: string) {
    if (!userId) return [];
    
    const { data } = await this.supabase
      .from('platform_analytics')
      .select('*')
      .eq('dimensions->user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(10);

    return data ?? [];
  }

  private async getUserTrustTierProgression(userId?: string) {
    if (!userId) return null;
    
    const { data } = await this.supabase.rpc('get_trust_tier_progression', {
      p_user_id: userId
    });

    return data;
  }

  private async trackAuthEventInSession(authEvent: any, sessionId: string) {
    await this.supabase
      .from('user_sessions')
      .update({
        metadata: {
          auth_events: [authEvent],
          last_auth_event: new Date().toISOString()
        }
      })
      .eq('session_id', sessionId);
  }

  private async updateSessionWithAuth(sessionId: string, authEvent: any) {
    await this.supabase
      .from('user_sessions')
      .update({
        user_id: authEvent.userId ?? null,
        last_activity: new Date().toISOString(),
        metadata: {
          authenticated: authEvent.success,
          auth_method: authEvent.method
        }
      })
      .eq('session_id', sessionId);
  }

  async trackFeatureUsage(userId: string | null, featureName: string, context: any) {
    await this.supabase
      .from('feature_usage')
      .insert({
        user_id: userId,
        feature_name: featureName,
        action_type: 'interact',
        context,
        timestamp: new Date().toISOString(),
        success: true
      });
  }

  async recordPlatformMetric(metricName: string, dimensions: any) {
    await this.supabase
      .from('platform_analytics')
      .insert({
        metric_name: metricName,
        metric_value: 1,
        metric_type: 'counter',
        dimensions,
        category: 'integration',
        source: 'enhanced_analytics'
      });
  }

  async updateSystemHealth(checkName: string, status: 'ok' | 'warning' | 'critical', details?: any) {
    try {
      const { error } = await this.supabase.from('system_health').upsert({
        service_name: checkName,
        health_status: status,
        details: details,
        last_check: new Date().toISOString(),
        metadata: { check_name: checkName }
      }, { onConflict: 'service_name' });
      if (error) {
        logger.error('Error updating system health:', error);
      }
    } catch (error) {
      logger.error('System health update error:', error);
    }
  }

  private calculateSessionDuration(sessionData: any): number {
    if (!sessionData.started_at) return 0;
    
    const start = new Date(sessionData.started_at);
    const end = new Date(sessionData.last_activity ?? new Date());
    
    return Math.floor((end.getTime() - start.getTime()) / 1000); // seconds
  }

  // Additional methods for API compatibility
  async detectBotBehavior(pollId: string, userId: string) {
    try {
      const { data, error } = await this.supabase.rpc('detect_bot_behavior', {
        p_poll_id: pollId,
        p_time_window: '24 hours'
      });
      
      if (error) throw error;
      
      return {
        riskScore: (data as any)?.risk_score ?? 0,
        suspiciousPatterns: (data as any)?.suspicious_patterns ?? [],
        confidence: (data as any)?.confidence ?? 0,
        analysis: data
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

  async getActiveSiteMessages(targetAudience: string = 'all') {
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
      return data ?? [];
    } catch (error) {
      logger.error('Site messages fetch error:', error);
      return [];
    }
  }

  async trackUserSession(sessionData: any) {
    try {
      const { data, error } = await this.supabase
        .from('user_sessions')
        .insert({
          user_id: sessionData.userId,
          session_id: sessionData.sessionId,
          device_info: sessionData.deviceInfo,
          user_agent: sessionData.userAgent,
          ip_address: sessionData.ipAddress,
          metadata: {
            current_page: sessionData.currentPage,
            action: sessionData.action,
            timestamp: new Date().toISOString()
          }
        });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Session tracking error:', error);
      return null;
    }
  }

  // Additional methods for API compatibility
  async getAnalyticsDashboard(timeRange?: string) {
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

  async getTrustTierAnalysis(pollId: string, timeRange?: string) {
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

  async getComprehensiveAnalytics() {
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

      const totalEvents = analyticsEvents.data?.length ?? 0;
      const eventsByType = analyticsEvents.data?.reduce((acc: any, event: any) => {
        acc[event.event_name] = (acc[event.event_name] ?? 0) + 1;
        return acc;
      }, {}) ?? {};

      const activeSessions = userSessions.data?.length ?? 0;
      const totalSessionDuration = userSessions.data?.reduce((sum: number, session: any) => {
        if (session.session_start && session.session_end) {
          const start = new Date(session.session_start).getTime();
          const end = new Date(session.session_end).getTime();
          return sum + (end - start);
        }
        return sum;
      }, 0) ?? 0;

      const averageSessionDurationMs = activeSessions > 0 ? totalSessionDuration / activeSessions : 0;
      const averageSessionDuration = averageSessionDurationMs > 0
        ? `${(averageSessionDurationMs / 1000 / 60).toFixed(2)} minutes`
        : 'N/A';

      const featureAdoption = featureUsage.data?.reduce((acc: any, usage: any) => {
        acc[usage.feature_name] = (acc[usage.feature_name] ?? 0) + (usage.usage_count ?? 0);
        return acc;
      }, {}) ?? {};

      const systemHealthStatus = systemHealth.data?.reduce((acc: any, check: any) => {
        acc[check.check_name] = check.status ?? 'unknown';
        return acc;
      }, {}) ?? {};

      return {
        totalEvents,
        eventsByType,
        activeSessions,
        averageSessionDuration,
        featureAdoption,
        systemHealthStatus,
        recentFeedback: recentFeedback.data || [],
        activeSiteMessages: activeSiteMessages.data || []
      };
    } catch (error) {
      logger.error('Comprehensive analytics error:', error);
      throw error;
    }
  }
}
