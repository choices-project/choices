/**
 * Comprehensive Analytics and Monitoring Service
 * Leverages our enhanced schema with built-in functions for optimal performance
 * Created: 2025-10-27
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

type SupabaseClient = ReturnType<typeof createClient<Database>>;

export class EnhancedAnalyticsService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * COMPREHENSIVE POLL ANALYTICS
   * Uses our built-in functions for sophisticated analysis
   */
  async getComprehensivePollAnalytics(pollId: string, analysisWindow?: string) {
    try {
      // Use our built-in comprehensive analytics function
      const { data: analytics, error } = await this.supabase.rpc(
        'get_comprehensive_analytics',
        {
          p_poll_id: pollId,
          p_analysis_window: analysisWindow || '7 days'
        }
      );

      if (error) throw error;

      // Enhance with platform metrics
      const platformMetrics = await this.getPlatformMetrics('poll_engagement', pollId);
      
      return {
        ...analytics,
        platformMetrics,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Comprehensive analytics error:', error);
      throw error;
    }
  }

  /**
   * TRUST TIER ANALYSIS
   * Leverages our trust tier system for sophisticated filtering
   */
  async getTrustTierAnalysis(pollId: string, trustTier?: number) {
    try {
      // Use built-in trust tier filtering
      const { data: filteredVotes, error } = await this.supabase.rpc(
        'calculate_trust_filtered_votes',
        {
          p_poll_id: pollId,
          p_trust_tier_filter: trustTier
        }
      );

      if (error) throw error;

      // Get trust tier progression data
      const { data: progression } = await this.supabase.rpc(
        'get_trust_tier_progression',
        { p_user_id: 'system' }
      );

      return {
        filteredVotes,
        progression,
        trustTierDistribution: await this.calculateTrustTierDistribution(pollId)
      };
    } catch (error) {
      console.error('Trust tier analysis error:', error);
      throw error;
    }
  }

  /**
   * BOT DETECTION AND SECURITY
   * Uses our sophisticated bot detection algorithms
   */
  async detectBotBehavior(pollId: string, userId?: string) {
    try {
      let botAnalysis;
      
      if (userId) {
        // User-specific bot detection
        const { data, error } = await this.supabase.rpc('detect_bot_behavior', {
          p_user_id: userId
        });
        if (error) throw error;
        botAnalysis = data;
      } else {
        // Poll-specific bot detection
        const { data, error } = await this.supabase.rpc('detect_bot_behavior', {
          p_poll_id: pollId,
          p_time_window: '24 hours'
        });
        if (error) throw error;
        botAnalysis = data;
      }

      // Store bot detection results in platform analytics
      await this.recordPlatformMetric('bot_detection', {
        poll_id: pollId,
        user_id: userId,
        risk_score: botAnalysis?.risk_score || 0,
        detection_method: botAnalysis?.method || 'unknown'
      });

      return botAnalysis;
    } catch (error) {
      console.error('Bot detection error:', error);
      throw error;
    }
  }

  /**
   * SESSION TRACKING AND USER JOURNEY
   * Leverages our user_sessions table for comprehensive tracking
   */
  async trackUserSession(sessionData: {
    userId?: string;
    sessionId: string;
    deviceInfo: any;
    userAgent: string;
    ipAddress: string;
    currentPage: string;
    action: string;
  }) {
    try {
      // Update or create session
      const { data: session, error } = await this.supabase
        .from('user_sessions')
        .upsert({
          user_id: sessionData.userId || null,
          session_id: sessionData.sessionId,
          device_info: sessionData.deviceInfo,
          user_agent: sessionData.userAgent,
          ip_address: sessionData.ipAddress,
          last_activity: new Date().toISOString(),
          page_views: 1, // Increment handled by trigger
          actions_count: 1, // Increment handled by trigger
          metadata: {
            current_page: sessionData.currentPage,
            last_action: sessionData.action,
            session_start: new Date().toISOString()
          }
        }, {
          onConflict: 'session_id'
        })
        .select()
        .single();

      if (error) throw error;

      // Track feature usage
      await this.trackFeatureUsage(sessionData.userId, sessionData.action, {
        session_id: sessionData.sessionId,
        page: sessionData.currentPage,
        device_type: sessionData.deviceInfo?.type
      });

      return session;
    } catch (error) {
      console.error('Session tracking error:', error);
      throw error;
    }
  }

  /**
   * FEATURE USAGE ANALYTICS
   * Comprehensive feature adoption tracking
   */
  async trackFeatureUsage(
    userId: string | null,
    featureName: string,
    context: any = {}
  ) {
    try {
      const { data, error } = await this.supabase
        .from('feature_usage')
        .insert({
          user_id: userId,
          feature_name: featureName,
          action_type: 'interact',
          context,
          timestamp: new Date().toISOString(),
          success: true
        });

      if (error) throw error;

      // Update platform metrics
      await this.recordPlatformMetric('feature_usage', {
        feature: featureName,
        user_id: userId,
        action: 'interact'
      });

      return data;
    } catch (error) {
      console.error('Feature usage tracking error:', error);
      throw error;
    }
  }

  /**
   * PLATFORM METRICS AND KPIs
   * Uses our platform_analytics table for comprehensive metrics
   */
  async recordPlatformMetric(metricName: string, dimensions: any = {}) {
    try {
      const { data, error } = await this.supabase
        .from('platform_analytics')
        .insert({
          metric_name: metricName,
          metric_value: 1,
          metric_type: 'counter',
          dimensions,
          category: this.categorizeMetric(metricName),
          subcategory: dimensions.feature || dimensions.action || 'general',
          source: 'api'
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Platform metric recording error:', error);
      throw error;
    }
  }

  /**
   * SYSTEM HEALTH MONITORING
   * Real-time system health tracking
   */
  async updateSystemHealth(serviceName: string, healthData: {
    status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    responseTime?: number;
    errorRate?: number;
    uptime?: number;
    details?: any;
  }) {
    try {
      const { data, error } = await this.supabase
        .from('system_health')
        .upsert({
          service_name: serviceName,
          health_status: healthData.status,
          response_time: healthData.responseTime,
          error_rate: healthData.errorRate,
          uptime_percentage: healthData.uptime,
          last_check: new Date().toISOString(),
          next_check: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
          details: healthData.details || {}
        }, {
          onConflict: 'service_name'
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('System health update error:', error);
      throw error;
    }
  }

  /**
   * SITE MESSAGES MANAGEMENT
   * Leverages our site_messages table for admin communications
   */
  async getActiveSiteMessages(targetAudience: string = 'all') {
    try {
      const { data, error } = await this.supabase
        .from('site_messages')
        .select('*')
        .eq('is_active', true)
        .eq('target_audience', targetAudience)
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString())
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Site messages retrieval error:', error);
      throw error;
    }
  }

  /**
   * COMPREHENSIVE ANALYTICS DASHBOARD DATA
   * Aggregates all our analytics for admin dashboard
   */
  async getAnalyticsDashboard(timeRange: string = '7 days') {
    try {
      const [
        platformMetrics,
        systemHealth,
        activeSessions,
        featureUsage,
        siteMessages
      ] = await Promise.all([
        this.getAggregatedPlatformMetrics(timeRange),
        this.getSystemHealthStatus(),
        this.getActiveSessionsCount(),
        this.getTopFeatures(timeRange),
        this.getActiveSiteMessages()
      ]);

      return {
        platformMetrics,
        systemHealth,
        activeSessions,
        featureUsage,
        siteMessages,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Analytics dashboard error:', error);
      throw error;
    }
  }

  // Helper methods
  private async getAggregatedPlatformMetrics(timeRange: string) {
    const { data, error } = await this.supabase.rpc(
      'aggregate_platform_metrics',
      {
        metric_name_param: 'poll_engagement',
        start_time: new Date(Date.now() - this.parseTimeRange(timeRange)).toISOString(),
        end_time: new Date().toISOString()
      }
    );

    if (error) throw error;
    return data;
  }

  private async getSystemHealthStatus() {
    const { data, error } = await this.supabase
      .from('system_health')
      .select('*')
      .order('last_check', { ascending: false });

    if (error) throw error;
    return data;
  }

  private async getActiveSessionsCount() {
    const { count, error } = await this.supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .gte('last_activity', new Date(Date.now() - 30 * 60 * 1000).toISOString()); // Last 30 minutes

    if (error) throw error;
    return count || 0;
  }

  private async getTopFeatures(timeRange: string) {
    const { data, error } = await this.supabase
      .from('feature_usage')
      .select('feature_name')
      .gte('timestamp', new Date(Date.now() - this.parseTimeRange(timeRange)).toISOString())
      .order('timestamp', { ascending: false })
      .limit(10);

    if (error) throw error;
    
    // Count feature usage
    const featureCounts = data?.reduce((acc: any, item) => {
      acc[item.feature_name] = (acc[item.feature_name] || 0) + 1;
      return acc;
    }, {}) || {};

    return Object.entries(featureCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5);
  }

  private async calculateTrustTierDistribution(pollId: string) {
    const { data, error } = await this.supabase
      .from('votes')
      .select('trust_tier')
      .eq('poll_id', pollId);

    if (error) throw error;

    const distribution = data?.reduce((acc: any, vote) => {
      const tier = vote.trust_tier || 'T0';
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {}) || {};

    return distribution;
  }

  private categorizeMetric(metricName: string): string {
    if (metricName.includes('poll')) return 'polls';
    if (metricName.includes('user')) return 'users';
    if (metricName.includes('feature')) return 'features';
    if (metricName.includes('bot')) return 'security';
    if (metricName.includes('session')) return 'sessions';
    return 'general';
  }

  private parseTimeRange(timeRange: string): number {
    const ranges: { [key: string]: number } = {
      '1 hour': 60 * 60 * 1000,
      '24 hours': 24 * 60 * 60 * 1000,
      '7 days': 7 * 24 * 60 * 60 * 1000,
      '30 days': 30 * 24 * 60 * 60 * 1000
    };
    return ranges[timeRange] || ranges['7 days'];
  }
}

/**
 * Enhanced Analytics Hook for React Components
 */
export function useEnhancedAnalytics() {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const analytics = new EnhancedAnalyticsService(supabase);

  return {
    // Poll Analytics
    getComprehensivePollAnalytics: analytics.getComprehensivePollAnalytics.bind(analytics),
    getTrustTierAnalysis: analytics.getTrustTierAnalysis.bind(analytics),
    
    // Security & Bot Detection
    detectBotBehavior: analytics.detectBotBehavior.bind(analytics),
    
    // Session & Feature Tracking
    trackUserSession: analytics.trackUserSession.bind(analytics),
    trackFeatureUsage: analytics.trackFeatureUsage.bind(analytics),
    
    // Platform Metrics
    recordPlatformMetric: analytics.recordPlatformMetric.bind(analytics),
    updateSystemHealth: analytics.updateSystemHealth.bind(analytics),
    
    // Admin Features
    getActiveSiteMessages: analytics.getActiveSiteMessages.bind(analytics),
    getAnalyticsDashboard: analytics.getAnalyticsDashboard.bind(analytics)
  };
}
