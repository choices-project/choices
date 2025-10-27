/**
 * PWA Analytics System
 * 
 * Comprehensive analytics for Progressive Web App features including:
 * - Installation tracking and conversion rates
 * - Offline usage patterns and engagement
 * - Service worker performance metrics
 * - Push notification effectiveness
 * - Cache hit rates and performance
 * 
 * Created: October 10, 2025
 * Updated: October 10, 2025
 */

import { type AnalyticsEngine } from '@/features/analytics/lib/AnalyticsEngine';
import { logger } from '@/lib/utils/logger';

// Track PWA events using existing analytics system
export async function trackPWAEvent(
  eventType: 'pwa_install' | 'pwa_uninstall' | 'pwa_offline_access' | 'pwa_online_access' | 'pwa_service_worker_registered',
  properties: Record<string, any> = {}
): Promise<void> {
  try {
    const supabase = await import('@/utils/supabase/client').then(m => m.getSupabaseClient());
    if (!supabase) return;

    await supabase.from('analytics_events').insert({
      event_type: 'user_registered', // Use existing event type
      event_category: 'pwa',
      event_data: {
        pwa_event_type: eventType,
        ...properties,
        platform: navigator.platform,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.warn('Failed to track PWA event:', error);
  }
}

// Track PWA performance metrics using existing analytics system
export async function trackPWAPerformance(
  metricType: 'load_time' | 'cache_hit_rate' | 'offline_usage_time' | 'service_worker_performance',
  value: number,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    const supabase = await import('@/utils/supabase/client').then(m => m.getSupabaseClient());
    if (!supabase) return;

    await supabase.from('analytics_events').insert({
      event_type: 'poll_created', // Use existing event type
      event_category: 'pwa',
      event_data: {
        pwa_performance_type: metricType,
        metric_value: value,
        metadata,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.warn('Failed to track PWA performance:', error);
  }
}

export interface PWAInstallationEvent {
  [key: string]: unknown;
  eventType: 'install_prompt_shown' | 'install_prompt_accepted' | 'install_prompt_dismissed' | 'app_installed' | 'app_uninstalled';
  platform: string;
  userAgent: string;
  installSource: 'browser_prompt' | 'manual_install' | 'app_store';
  installTime?: number;
  sessionDuration?: number;
  previousVisits?: number;
}

export interface PWAOfflineEvent {
  [key: string]: unknown;
  eventType: 'offline_entered' | 'offline_exited' | 'offline_action_queued' | 'offline_action_synced' | 'offline_vote_cast';
  actionType?: 'vote' | 'comment' | 'like' | 'share' | 'create_poll';
  offlineDuration?: number;
  queuedActions?: number;
  syncSuccess?: boolean;
  dataSize?: number;
}

export interface PWAPerformanceEvent {
  [key: string]: unknown;
  eventType: 'service_worker_registered' | 'service_worker_updated' | 'cache_hit' | 'cache_miss' | 'background_sync';
  cacheName?: string;
  cacheSize?: number;
  hitRate?: number;
  loadTime?: number;
  networkStatus?: 'online' | 'offline' | 'slow';
}

export interface PWANotificationEvent {
  [key: string]: unknown;
  eventType: 'notification_permission_requested' | 'notification_permission_granted' | 'notification_permission_denied' | 'notification_sent' | 'notification_clicked' | 'notification_dismissed';
  notificationType?: 'poll_created' | 'poll_closed' | 'vote_cast' | 'representative_update' | 'system_announcement';
  clickAction?: string;
  deliveryTime?: number;
  engagementRate?: number;
}

export interface PWAEngagementMetrics {
  totalInstallations: number;
  installationRate: number;
  offlineUsageRate: number;
  averageOfflineSessionDuration: number;
  cacheHitRate: number;
  notificationClickRate: number;
  userRetentionRate: number;
  featureAdoptionRate: Record<string, number>;
}

export interface PWAPlatformMetrics {
  platform: string;
  installRate: number;
  offlineUsage: number;
  performanceScore: number;
  userSatisfaction: number;
  errorRate: number;
}

class PWAAnalytics {
  private analyticsEngine: AnalyticsEngine;
  private pwaEvents: Array<PWAInstallationEvent | PWAOfflineEvent | PWAPerformanceEvent | PWANotificationEvent> = [];
  private engagementMetrics: PWAEngagementMetrics | null = null;
  private platformMetrics: Map<string, PWAPlatformMetrics> = new Map();
  private isEnabled = true;
  private flushInterval = 60000; // 1 minute
  private flushTimer?: NodeJS.Timeout;

  constructor(analyticsEngine: AnalyticsEngine) {
    this.analyticsEngine = analyticsEngine;
    this.startFlushTimer();
    this.setupPWAEventListeners();
  }

  /**
   * Track PWA installation events
   */
  trackInstallation(event: PWAInstallationEvent): void {
    if (!this.isEnabled) return;

    this.pwaEvents.push(event);
    
    // Track with main analytics engine
    this.analyticsEngine.track({
      type: 'pwa_installation',
      category: 'feature',
      action: event.eventType,
      properties: {
        platform: event.platform,
        installSource: event.installSource,
        installTime: event.installTime,
        sessionDuration: event.sessionDuration,
        previousVisits: event.previousVisits
      }
    });

    logger.info('PWA Analytics: Installation event tracked', event);
  }

  /**
   * Track offline usage patterns
   */
  trackOfflineUsage(event: PWAOfflineEvent): void {
    if (!this.isEnabled) return;

    this.pwaEvents.push(event);
    
    this.analyticsEngine.track({
      type: 'pwa_offline',
      category: 'feature',
      action: event.eventType,
      properties: {
        actionType: event.actionType,
        offlineDuration: event.offlineDuration,
        queuedActions: event.queuedActions,
        syncSuccess: event.syncSuccess,
        dataSize: event.dataSize
      }
    });

    logger.info('PWA Analytics: Offline event tracked', event);
  }

  /**
   * Track service worker and cache performance
   */
  trackPerformance(event: PWAPerformanceEvent): void {
    if (!this.isEnabled) return;

    this.pwaEvents.push(event);
    
    this.analyticsEngine.track({
      type: 'pwa_performance',
      category: 'performance',
      action: event.eventType,
      properties: {
        cacheName: event.cacheName,
        cacheSize: event.cacheSize,
        hitRate: event.hitRate,
        loadTime: event.loadTime,
        networkStatus: event.networkStatus
      }
    });

    logger.info('PWA Analytics: Performance event tracked', event);
  }

  /**
   * Track push notification events
   */
  trackNotification(event: PWANotificationEvent): void {
    if (!this.isEnabled) return;

    this.pwaEvents.push(event);
    
    this.analyticsEngine.track({
      type: 'pwa_notification',
      category: 'feature',
      action: event.eventType,
      properties: {
        notificationType: event.notificationType,
        clickAction: event.clickAction,
        deliveryTime: event.deliveryTime,
        engagementRate: event.engagementRate
      }
    });

    logger.info('PWA Analytics: Notification event tracked', event);
  }

  /**
   * Calculate engagement metrics
   */
  calculateEngagementMetrics(): PWAEngagementMetrics {
    const installationEvents = this.pwaEvents.filter(e => 'installSource' in e);
    const offlineEvents = this.pwaEvents.filter(e => 'actionType' in e) as PWAOfflineEvent[];
    const performanceEvents = this.pwaEvents.filter(e => 'cacheName' in e) as PWAPerformanceEvent[];
    const notificationEvents = this.pwaEvents.filter(e => 'notificationType' in e) as PWANotificationEvent[];

    const totalInstallations = installationEvents.filter(e => e.eventType === 'app_installed').length;
    const totalPrompts = installationEvents.filter(e => e.eventType === 'install_prompt_shown').length;
    const installationRate = totalPrompts > 0 ? totalInstallations / totalPrompts : 0;

    const offlineSessions = offlineEvents.filter(e => e.eventType === 'offline_entered').length;
    const totalSessions = this.analyticsEngine.getSessionCount();
    const offlineUsageRate = totalSessions > 0 ? offlineSessions / totalSessions : 0;

    const offlineDurations = offlineEvents
      .filter(e => e.offlineDuration)
      .map(e => e.offlineDuration!);
    const averageOfflineSessionDuration = offlineDurations.length > 0 
      ? offlineDurations.reduce((a, b) => a + b, 0) / offlineDurations.length 
      : 0;

    const cacheHits = performanceEvents.filter(e => e.eventType === 'cache_hit').length;
    const cacheMisses = performanceEvents.filter(e => e.eventType === 'cache_miss').length;
    const cacheHitRate = (cacheHits + cacheMisses) > 0 ? cacheHits / (cacheHits + cacheMisses) : 0;

    const notificationClicks = notificationEvents.filter(e => e.eventType === 'notification_clicked').length;
    const notificationsSent = notificationEvents.filter(e => e.eventType === 'notification_sent').length;
    const notificationClickRate = notificationsSent > 0 ? notificationClicks / notificationsSent : 0;

    const featureAdoptionRate: Record<string, number> = {};
    const featureCounts = this.analyticsEngine.getFeatureUsage();
    Object.entries(featureCounts).forEach(([feature, count]) => {
      featureAdoptionRate[feature] = (count) / totalSessions;
    });

    this.engagementMetrics = {
      totalInstallations,
      installationRate,
      offlineUsageRate,
      averageOfflineSessionDuration,
      cacheHitRate,
      notificationClickRate,
      userRetentionRate: this.analyticsEngine.getUserRetentionRate(),
      featureAdoptionRate
    };

    return this.engagementMetrics;
  }

  /**
   * Calculate platform-specific metrics
   */
  calculatePlatformMetrics(): Map<string, PWAPlatformMetrics> {
    const platformData = new Map<string, {
      installations: number;
      prompts: number;
      offlineSessions: number;
      totalSessions: number;
      cacheHits: number;
      cacheMisses: number;
      errors: number;
      satisfaction: number[];
    }>();

    // Aggregate data by platform
    this.pwaEvents.forEach(event => {
      const platform = 'platform' in event ? String(event.platform) : 'unknown';
      if (!platformData.has(platform)) {
        platformData.set(platform, {
          installations: 0,
          prompts: 0,
          offlineSessions: 0,
          totalSessions: 0,
          cacheHits: 0,
          cacheMisses: 0,
          errors: 0,
          satisfaction: []
        });
      }

      const data = platformData.get(platform)!;

      if ('installSource' in event) {
        if (event.eventType === 'app_installed') data.installations++;
        if (event.eventType === 'install_prompt_shown') data.prompts++;
      }

      if ('actionType' in event && event.eventType === 'offline_entered') {
        data.offlineSessions++;
      }

      if ('cacheName' in event) {
        if (event.eventType === 'cache_hit') data.cacheHits++;
        if (event.eventType === 'cache_miss') data.cacheMisses++;
      }
    });

    // Calculate metrics for each platform
    platformData.forEach((data, platform) => {
      const installRate = data.prompts > 0 ? data.installations / data.prompts : 0;
      const offlineUsage = data.totalSessions > 0 ? data.offlineSessions / data.totalSessions : 0;
      const performanceScore = this.calculatePerformanceScore(data);
      const userSatisfaction = data.satisfaction.length > 0 
        ? data.satisfaction.reduce((a, b) => a + b, 0) / data.satisfaction.length 
        : 0;
      const errorRate = data.totalSessions > 0 ? data.errors / data.totalSessions : 0;

      this.platformMetrics.set(platform, {
        platform,
        installRate,
        offlineUsage,
        performanceScore,
        userSatisfaction,
        errorRate
      });
    });

    return this.platformMetrics;
  }

  /**
   * Get PWA engagement dashboard data
   */
  async getDashboardData(): Promise<{
    engagement: PWAEngagementMetrics;
    platforms: PWAPlatformMetrics[];
    trends: {
      installations: Array<{ date: string; count: number }>;
      offlineUsage: Array<{ date: string; rate: number }>;
      performance: Array<{ date: string; score: number }>;
    };
  }> {
    const engagement = this.calculateEngagementMetrics();
    const platforms = Array.from(this.platformMetrics.values());
    
    // Generate trend data (last 30 days)
    const trends = await this.generateTrendData();

    return {
      engagement,
      platforms,
      trends
    };
  }

  /**
   * Setup PWA-specific event listeners
   */
  private setupPWAEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Installation events
    window.addEventListener('beforeinstallprompt', () => {
      this.trackInstallation({
        eventType: 'install_prompt_shown',
        platform: this.getPlatform(),
        userAgent: navigator.userAgent,
        installSource: 'browser_prompt'
      });
    });

    window.addEventListener('appinstalled', () => {
      this.trackInstallation({
        eventType: 'app_installed',
        platform: this.getPlatform(),
        userAgent: navigator.userAgent,
        installSource: 'browser_prompt',
        installTime: Date.now()
      });
    });

    // Offline events
    window.addEventListener('online', () => {
      this.trackOfflineUsage({
        eventType: 'offline_exited',
        syncSuccess: true
      });
    });

    window.addEventListener('offline', () => {
      this.trackOfflineUsage({
        eventType: 'offline_entered'
      });
    });

    // Service worker events
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'CACHE_HIT') {
          this.trackPerformance({
            eventType: 'cache_hit',
            cacheName: event.data.cacheName,
            hitRate: event.data.hitRate
          });
        } else if (event.data.type === 'CACHE_MISS') {
          this.trackPerformance({
            eventType: 'cache_miss',
            cacheName: event.data.cacheName
          });
        }
      });
    }

    // Notification events
    if ('Notification' in window) {
      // Track permission changes
      const originalRequestPermission = Notification.requestPermission.bind(Notification);
      Notification.requestPermission = async () => {
        const result = await originalRequestPermission();
        
        this.trackNotification({
          eventType: result === 'granted' ? 'notification_permission_granted' : 'notification_permission_denied'
        });
        
        return result;
      };
    }
  }

  /**
   * Start flush timer for batch processing
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Flush analytics data
   */
  private flush(): void {
    if (this.pwaEvents.length === 0) return;

    // Send to analytics backend
    this.sendToBackend(this.pwaEvents);
    
    // Clear processed events
    this.pwaEvents = [];
  }

  /**
   * Send data to analytics backend
   */
  private sendToBackend(events: any[]): Promise<void> {
    try {
      // This would integrate with your analytics backend
      // For now, just log the events
      return Promise.resolve();
      logger.info('PWA Analytics: Flushing events', { count: events.length });
    } catch (error) {
      logger.error('PWA Analytics: Failed to send data to backend', error instanceof Error ? error : new Error(String(error)));
      return Promise.resolve();
    }
  }

  /**
   * Get platform information
   */
  private getPlatform(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome')) return 'chrome';
    if (userAgent.includes('firefox')) return 'firefox';
    if (userAgent.includes('safari')) return 'safari';
    if (userAgent.includes('edge')) return 'edge';
    return 'unknown';
  }

  /**
   * Calculate performance score
   */
  private calculatePerformanceScore(data: any): number {
    const cacheHits = (data.cacheHits as number) ?? 0;
    const cacheMisses = (data.cacheMisses as number) ?? 0;
    const totalSessions = (data.totalSessions as number) ?? 0;
    const errors = (data as { errors?: number }).errors ?? 0;
    
    const cacheHitRate = (cacheHits + cacheMisses) > 0 
      ? cacheHits / (cacheHits + cacheMisses) 
      : 0;
    
    const errorRate = totalSessions > 0 ? errors / totalSessions : 0;
    
    // Performance score based on cache hit rate and error rate
    return Math.max(0, Math.min(100, (cacheHitRate * 100) - (errorRate * 100)));
  }

  /**
   * Generate trend data for dashboard
   */
  private async generateTrendData(): Promise<{
    installations: Array<{ date: string; count: number }>;
    offlineUsage: Array<{ date: string; rate: number }>;
    performance: Array<{ date: string; score: number }>;
  }> {
    try {
      // Get real analytics data from the analytics service
      await import('@/features/analytics/lib/analytics-service');
      
      // Get PWA installation events from the last 30 days
      const installations = await this.getInstallationTrends();
      
      // Get offline usage patterns
      const offlineUsage = await this.getOfflineUsageTrends();
      
      // Get performance metrics
      const performance = await this.getPerformanceTrends();

      return {
        installations,
        offlineUsage,
        performance
      };
    } catch (error) {
      logger.error('Error getting PWA analytics trends:', error instanceof Error ? error : new Error(String(error)));
      // Fallback to empty data structure if analytics service is unavailable
      return {
        installations: [],
        offlineUsage: [],
        performance: []
      };
    }
  }

  private async getInstallationTrends(): Promise<Array<{ date: string; count: number }>> {
    try {
      const supabase = await import('@/utils/supabase/client').then(m => m.getSupabaseClient());
      if (!supabase) return [];

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Use existing analytics_events table for PWA analytics
      const { data, error } = await supabase
        .from('analytics_events')
        .select('created_at')
        .eq('event_type', 'user_registered')
        .eq('event_category', 'pwa')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('PWA analytics error:', error.message);
        return [];
      }

      // Group by date and count installations
      const dailyCounts = new Map<string, number>();
      data?.forEach(event => {
        const eventData = event as any;
        const date = new Date(eventData.created_at).toISOString().split('T')[0];
        if (date) {
          dailyCounts.set(date, (dailyCounts.get(date) ?? 0) + 1);
        }
      });

      // Fill in missing dates with 0 counts
      const result: Array<{ date: string; count: number }> = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        if (date) {
          result.push({
            date,
            count: dailyCounts.get(date) || 0
          });
        }
      }

      return result;
    } catch (error) {
      logger.error('Error getting installation trends:', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  private async getOfflineUsageTrends(): Promise<Array<{ date: string; rate: number }>> {
    try {
      const supabase = await import('@/utils/supabase/client').then(m => m.getSupabaseClient());
      if (!supabase) return [];

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Use existing analytics_events table for offline analytics
      const { data, error } = await supabase
        .from('analytics_events')
        .select('created_at, event_data')
        .eq('event_type', 'poll_created')
        .eq('event_category', 'pwa')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('PWA offline analytics error:', error.message);
        return [];
      }

      // Calculate offline usage rate by date
      const dailyStats = new Map<string, { offline: number; total: number }>();
      data?.forEach(event => {
        const eventData = event as any;
        const date = new Date(eventData.created_at).toISOString().split('T')[0];
        if (date && eventData.event_data?.pwa_performance_type) {
          const stats = dailyStats.get(date) ?? { offline: 0, total: 0 };
          stats.total++;
          if (eventData.event_data.pwa_performance_type === 'offline_usage_time') {
            stats.offline++;
          }
          dailyStats.set(date, stats);
        }
      });

      // Calculate rates
      const result: Array<{ date: string; rate: number }> = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        if (date) {
          const stats = dailyStats.get(date);
          const rate = stats && stats.total > 0 ? stats.offline / stats.total : 0;
          result.push({ date, rate });
        }
      }

      return result;
    } catch (error) {
      logger.error('Error getting offline usage trends:', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  private async getPerformanceTrends(): Promise<Array<{ date: string; score: number }>> {
    try {
      const supabase = await import('@/utils/supabase/client').then(m => m.getSupabaseClient());
      if (!supabase) return [];

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('analytics_events')
        .select('created_at, event_data')
        .eq('event_type', 'poll_created')
        .eq('event_category', 'pwa')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) return [];

      // Calculate average performance score by date
      const dailyScores = new Map<string, number[]>();
      data?.forEach(event => {
        const eventData = event as any;
        const date = new Date(eventData.created_at).toISOString().split('T')[0];
        if (date && eventData.event_data?.metric_value) {
          const score = eventData.event_data.metric_value ?? 0;
          const scores = dailyScores.get(date) ?? [];
          scores.push(score);
          dailyScores.set(date, scores);
        }
      });

      // Calculate average scores
      const result: Array<{ date: string; score: number }> = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        if (date) {
          const scores = dailyScores.get(date) ?? [];
          const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
          result.push({ date, score: avgScore });
        }
      }

      return result;
    } catch (error) {
      console.error('Error getting performance trends:', error);
      return [];
    }
  }

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Get current analytics status
   */
  getStatus(): {
    enabled: boolean;
    eventsQueued: number;
    engagementMetrics: PWAEngagementMetrics | null;
    platformCount: number;
  } {
    return {
      enabled: this.isEnabled,
      eventsQueued: this.pwaEvents.length,
      engagementMetrics: this.engagementMetrics,
      platformCount: this.platformMetrics.size
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
  }
}

// Singleton instance removed - function was unused

export default PWAAnalytics;
