/**
 * PWA Analytics Engine
 * 
 * Core analytics functionality for PWA features.
 * Integrates with the main analytics system for comprehensive tracking.
 * 
 * Created: October 11, 2025
 * Updated: October 11, 2025
 */

import { getAnalyticsEngine } from '@/features/analytics/lib/AnalyticsEngine';
import { logger } from '@/lib/utils/logger';

export interface AnalyticsEvent {
  name: string;
  properties: Record<string, any>;
  timestamp: Date;
}

export class PWAAnalyticsEngine {
  private events: AnalyticsEvent[] = [];
  private mainAnalyticsEngine = getAnalyticsEngine();
  private isEnabled: boolean = true;

  constructor() {
    this.setupEventListeners();
  }

  track(event: AnalyticsEvent): void {
    if (!this.isEnabled) return;

    // Store event locally for PWA-specific tracking
    this.events.push(event);
    
    // Track with main analytics engine
    this.mainAnalyticsEngine.track({
      type: 'pwa_event',
      category: 'pwa',
      action: event.name,
      properties: event.properties,
      timestamp: event.timestamp.getTime()
    });

    logger.info('PWA Analytics: Event tracked', {
      name: event.name,
      properties: event.properties,
      timestamp: event.timestamp
    });
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  clear(): void {
    this.events = [];
  }


  /**
   * Setup PWA-specific event listeners
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Installation events
    window.addEventListener('beforeinstallprompt', (event) => {
      this.track({
        name: 'pwa_install_prompt_shown',
        properties: {
          platform: this.getPlatform(),
          userAgent: navigator.userAgent,
          promptType: event.type,
          canInstall: true
        },
        timestamp: new Date()
      });
    });

    window.addEventListener('appinstalled', () => {
      this.track({
        name: 'pwa_app_installed',
        properties: {
          platform: this.getPlatform(),
          userAgent: navigator.userAgent,
          installSource: 'browser_prompt',
          installTime: Date.now()
        },
        timestamp: new Date()
      });
    });

    // Offline events
    window.addEventListener('online', () => {
      this.track({
        name: 'pwa_offline_exited',
        properties: {
          syncSuccess: true
        },
        timestamp: new Date()
      });
    });

    window.addEventListener('offline', () => {
      this.track({
        name: 'pwa_offline_entered',
        properties: {},
        timestamp: new Date()
      });
    });

    // Service worker events
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'CACHE_HIT') {
          this.track({
            name: 'pwa_cache_hit',
            properties: {
              cacheName: event.data.cacheName,
              hitRate: event.data.hitRate
            },
            timestamp: new Date()
          });
        } else if (event.data.type === 'CACHE_MISS') {
          this.track({
            name: 'pwa_cache_miss',
            properties: {
              cacheName: event.data.cacheName
            },
            timestamp: new Date()
          });
        }
      });
    }

    // Notification events
    if ('Notification' in window) {
      const originalRequestPermission = Notification.requestPermission;
      Notification.requestPermission = async () => {
        const result = await originalRequestPermission.call(Notification);
        
        this.track({
          name: result === 'granted' ? 'pwa_notification_permission_granted' : 'pwa_notification_permission_denied',
          properties: {
            permission: result
          },
          timestamp: new Date()
        });
        
        return result;
      };
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
   * Get PWA analytics dashboard data
   */
  getDashboardData() {
    return {
      events: this.events,
      totalEvents: this.events.length,
      enabled: this.isEnabled,
      mainAnalytics: this.mainAnalyticsEngine.getStatus()
    };
  }

  /**
   * Get analytics status
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      eventsQueued: this.events.length,
      mainAnalytics: this.mainAnalyticsEngine.getStatus()
    };
  }

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.mainAnalyticsEngine.setEnabled(enabled);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.mainAnalyticsEngine.destroy();
  }
}

// Create singleton instance
let pwaAnalyticsEngineInstance: PWAAnalyticsEngine | null = null;

export function getPWAAnalyticsEngine(): PWAAnalyticsEngine {
  if (!pwaAnalyticsEngineInstance) {
    pwaAnalyticsEngineInstance = new PWAAnalyticsEngine();
  }
  return pwaAnalyticsEngineInstance;
}

export const analyticsEngine = getPWAAnalyticsEngine();
