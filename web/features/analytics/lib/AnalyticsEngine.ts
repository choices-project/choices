/**
 * Analytics Engine
 * 
 * Core analytics engine for tracking user interactions and system metrics.
 * Provides a unified interface for analytics across the application.
 * 
 * Created: January 9, 2025
 * Updated: January 9, 2025
 */

import { logger } from '@/lib/utils/logger';

/// <reference types="node" />

// Node.js types - Extend global ProcessEnv
declare global {
  type ProcessEnv = {
    NEXT_PUBLIC_ANALYTICS_ENABLED?: string;
    NEXT_PUBLIC_ANALYTICS_DEBUG?: string;
  }
}

export type AnalyticsEvent = {
  [key: string]: unknown;
  type: string;
  category: string;
  action: string;
  properties?: Record<string, unknown>;
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
  private sessionCount = 0;
  private featureUsage: Record<string, number> = {};
  private userRetentionRate = 0;
  private eventListenersInitialized = false;

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
      this.setupPWAEventListeners();
    }
  }

  /**
   * Setup PWA-specific event listeners (integrated from PWAAnalyticsEngine)
   * Tracks installation, offline/online, service worker, and notification events
   */
  private setupPWAEventListeners(): void {
    if (typeof window === 'undefined' || this.eventListenersInitialized) return;
    this.eventListenersInitialized = true;

    // Installation events
    window.addEventListener('beforeinstallprompt', (event) => {
      this.track({
        type: 'pwa_event',
        category: 'pwa',
        action: 'install_prompt_shown',
        properties: {
          platform: this.getPlatform(),
          userAgent: navigator.userAgent,
          promptType: event.type,
          canInstall: true
        }
      });
    });

    window.addEventListener('appinstalled', () => {
      this.track({
        type: 'pwa_event',
        category: 'pwa',
        action: 'app_installed',
        properties: {
          platform: this.getPlatform(),
          userAgent: navigator.userAgent,
          installSource: 'browser_prompt',
          installTime: Date.now()
        }
      });
    });

    // Offline events
    window.addEventListener('online', () => {
      this.track({
        type: 'pwa_event',
        category: 'pwa',
        action: 'offline_exited',
        properties: {
          syncSuccess: true
        }
      });
    });

    window.addEventListener('offline', () => {
      this.track({
        type: 'pwa_event',
        category: 'pwa',
        action: 'offline_entered',
        properties: {}
      });
    });

    // Service worker events
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'CACHE_HIT') {
          this.track({
            type: 'pwa_event',
            category: 'pwa',
            action: 'cache_hit',
            properties: {
              cacheName: event.data.cacheName,
              hitRate: event.data.hitRate
            }
          });
        } else if (event.data.type === 'CACHE_MISS') {
          this.track({
            type: 'pwa_event',
            category: 'pwa',
            action: 'cache_miss',
            properties: {
              cacheName: event.data.cacheName
            }
          });
        }
      });
    }

    // Notification events
    if ('Notification' in window) {
      const originalRequestPermission = Notification.requestPermission.bind(Notification);
      Notification.requestPermission = async () => {
        const result = await originalRequestPermission();
        
        this.track({
          type: 'pwa_event',
          category: 'pwa',
          action: result === 'granted' ? 'notification_permission_granted' : 'notification_permission_denied',
          properties: {
            permission: result
          }
        });
        
        return result;
      };
    }
  }

  /**
   * Get platform information (from PWAAnalyticsEngine)
   */
  private getPlatform(): string {
    if (typeof window === 'undefined') return 'server';
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome')) return 'chrome';
    if (userAgent.includes('firefox')) return 'firefox';
    if (userAgent.includes('safari')) return 'safari';
    if (userAgent.includes('edge')) return 'edge';
    return 'unknown';
  }

  /**
   * Track an analytics event
   */
  track(event: AnalyticsEvent): void {
    if (!this.config.enabled) return;

    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: event.timestamp ?? Date.now(),
      sessionId: event.sessionId ?? this.getSessionId()
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
    this.featureUsage[feature] = (this.featureUsage[feature] ?? 0) + count;
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
      
      // Send events to analytics backend
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events })
      });
    } catch (error) {
      logger.error('Analytics: Failed to send events to backend', error instanceof Error ? error : new Error(String(error)));
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