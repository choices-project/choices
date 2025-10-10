/**
 * Analytics Engine
 * 
 * Core analytics engine for tracking user interactions and system metrics.
 * Provides a unified interface for analytics across the application.
 * 
 * Created: January 9, 2025
 * Updated: January 9, 2025
 */

import { logger } from '@/lib/logger';

export type AnalyticsEvent = {
  type: string;
  category: string;
  action: string;
  properties?: Record<string, any>;
  timestamp?: number;
  userId?: string;
  sessionId?: string;
}

export type AnalyticsConfig = {
  enabled: boolean;
  debug: boolean;
  batchSize: number;
  flushInterval: number;
}

export class AnalyticsEngine {
  private events: AnalyticsEvent[] = [];
  private config: AnalyticsConfig;
  private flushTimer?: NodeJS.Timeout | undefined;
  private sessionCount: number = 0;
  private featureUsage: Record<string, number> = {};
  private userRetentionRate: number = 0;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      enabled: true,
      debug: false,
      batchSize: 50,
      flushInterval: 60000, // 1 minute
      ...config
    };

    if (this.config.enabled) {
      this.startFlushTimer();
    }
  }

  /**
   * Track an analytics event
   */
  track(event: AnalyticsEvent): void {
    if (!this.config.enabled) return;

    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: event.timestamp || Date.now(),
      sessionId: event.sessionId || this.getSessionId()
    };

    this.events.push(fullEvent);

    if (this.config.debug) {
      logger.info('Analytics: Event tracked', fullEvent);
    }

    // Auto-flush if batch size reached
    if (this.events.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.sessionCount;
  }

  /**
   * Get feature usage statistics
   */
  getFeatureUsage(): Record<string, number> {
    return { ...this.featureUsage };
  }

  /**
   * Get user retention rate
   */
  getUserRetentionRate(): number {
    return this.userRetentionRate;
  }

  /**
   * Set session count
   */
  setSessionCount(count: number): void {
    this.sessionCount = count;
  }

  /**
   * Update feature usage
   */
  updateFeatureUsage(feature: string, count: number): void {
    this.featureUsage[feature] = (this.featureUsage[feature] || 0) + count;
  }

  /**
   * Set user retention rate
   */
  setUserRetentionRate(rate: number): void {
    this.userRetentionRate = rate;
  }

  /**
   * Flush events to backend
   */
  flush(): void {
    if (this.events.length === 0) return;

    const eventsToFlush = [...this.events];
    this.events = [];

    // Send to backend (implement actual backend integration)
    this.sendToBackend(eventsToFlush);
  }

  /**
   * Send events to analytics backend
   */
  private async sendToBackend(events: AnalyticsEvent[]): Promise<void> {
    try {
      // This would integrate with your analytics backend
      // For now, just log the events
      logger.info('Analytics: Flushing events', { count: events.length });
      
      // TODO: Implement actual backend integration
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ events })
      // });
    } catch (error) {
      logger.error('Analytics: Failed to send events to backend', error);
    }
  }

  /**
   * Start automatic flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Get current session ID
   */
  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server-session';
    
    let sessionId = sessionStorage.getItem('analytics-session-id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics-session-id', sessionId);
    }
    return sessionId;
  }

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    
    if (enabled && !this.flushTimer) {
      this.startFlushTimer();
    } else if (!enabled && this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  /**
   * Get analytics status
   */
  getStatus(): {
    enabled: boolean;
    eventsQueued: number;
    sessionCount: number;
    featureUsage: Record<string, number>;
    userRetentionRate: number;
  } {
    return {
      enabled: this.config.enabled,
      eventsQueued: this.events.length,
      sessionCount: this.sessionCount,
      featureUsage: this.featureUsage,
      userRetentionRate: this.userRetentionRate
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// Create singleton instance
let analyticsEngineInstance: AnalyticsEngine | null = null;

export function getAnalyticsEngine(): AnalyticsEngine {
  if (!analyticsEngineInstance) {
    analyticsEngineInstance = new AnalyticsEngine();
  }
  return analyticsEngineInstance;
}

// Export singleton instance
export const analyticsEngine = getAnalyticsEngine();

export default AnalyticsEngine;