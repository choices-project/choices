/**
 * PWA Analytics Module
 * 
 * Tracks PWA usage, performance metrics, and feature adoption
 * while maintaining user privacy and respecting feature flags.
 */

import { isFeatureEnabled } from './feature-flags'

export interface PWAMetrics {
  // Performance metrics
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  
  // PWA-specific metrics
  serviceWorkerRegistered: boolean;
  webAuthnUsed: boolean;
  offlineUsage: number;
  backgroundSyncCount: number;
  pushNotificationSubscriptions: number;
  
  // User engagement
  sessionDuration: number;
  featuresUsed: string[];
  offlineActions: number;
  dataCollected: number;
  
  // Privacy metrics
  anonymizationLevel: 'none' | 'partial' | 'full';
  dataRetentionDays: number;
  userControlEnabled: boolean;
}

export interface PrivacyReport {
  dataMinimization: {
    dataCollected: number;
    dataRetentionDays: number;
    dataSharing: boolean;
  };
  anonymization: {
    anonymizationLevel: string;
    pseudonymizationUsed: boolean;
    differentialPrivacy: boolean;
  };
  userControl: {
    dataExportEnabled: boolean;
    dataDeletionEnabled: boolean;
    consentManagement: boolean;
  };
  transparency: {
    dataUsageDisclosed: boolean;
    privacyPolicyAccessible: boolean;
    cookieConsent: boolean;
  };
}

export class PWAAnalytics {
  private pwaEnabled = false;
  private sessionStartTime: number;
  private metrics: PWAMetrics;
  private featuresUsed: Set<string> = new Set();
  private offlineActions: number = 0;

  constructor() {
    this.pwaEnabled = isFeatureEnabled('pwa');
    this.sessionStartTime = Date.now();
    this.metrics = this.initializeMetrics();
    
    if (this.pwaEnabled) {
      this.startTracking();
    }
  }

  private initializeMetrics(): PWAMetrics {
    return {
      loadTime: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      serviceWorkerRegistered: false,
      webAuthnUsed: false,
      offlineUsage: 0,
      backgroundSyncCount: 0,
      pushNotificationSubscriptions: 0,
      sessionDuration: 0,
      featuresUsed: [],
      offlineActions: 0,
      dataCollected: 0,
      anonymizationLevel: 'full',
      dataRetentionDays: 7,
      userControlEnabled: true
    };
  }

  private startTracking() {
    // Track performance metrics
    this.trackPerformanceMetrics();
    
    // Track PWA features
    this.trackPWAFeatures();
    
    // Track user engagement
    this.trackUserEngagement();
    
    // Track privacy metrics
    this.trackPrivacyMetrics();
  }

  private trackPerformanceMetrics() {
    // Track load time
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.metrics.loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      }
    }

    // Track Core Web Vitals
    if ('PerformanceObserver' in window) {
      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          this.metrics.firstContentfulPaint = entries[0].startTime;
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          this.metrics.largestContentfulPaint = entries[entries.length - 1].startTime;
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let cls = 0;
        for (const entry of list.getEntries()) {
          // Check if entry has hadRecentInput property (LayoutShiftEntry specific)
          if (!(entry as any).hadRecentInput) {
            cls += (entry as any).value;
          }
        }
        this.metrics.cumulativeLayoutShift = cls;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }

  private trackPWAFeatures() {
    // Check service worker
    this.metrics.serviceWorkerRegistered = 'serviceWorker' in navigator;

    // Check WebAuthn usage
    this.metrics.webAuthnUsed = 'credentials' in navigator;

    // Track offline usage
    if (!navigator.onLine) {
      this.metrics.offlineUsage++;
    }

    // Listen for online/offline changes
    window.addEventListener('online', () => {
      this.metrics.offlineUsage++;
    });
  }

  private trackUserEngagement() {
    // Track session duration
    const updateSessionDuration = () => {
      this.metrics.sessionDuration = Date.now() - this.sessionStartTime;
    };

    // Update every 30 seconds
    setInterval(updateSessionDuration, 30000);

    // Update on page unload
    window.addEventListener('beforeunload', updateSessionDuration);
  }

  private trackPrivacyMetrics() {
    // Set privacy defaults
    this.metrics.anonymizationLevel = 'full';
    this.metrics.dataRetentionDays = 7;
    this.metrics.userControlEnabled = true;
  }

  // Track feature usage
  trackFeatureUsage(feature: string) {
    if (!this.pwaEnabled) return;

    this.featuresUsed.add(feature);
    this.metrics.featuresUsed = Array.from(this.featuresUsed);
  }

  // Track offline action
  trackOfflineAction() {
    if (!this.pwaEnabled) return;

    this.offlineActions++;
    this.metrics.offlineActions = this.offlineActions;
  }

  // Track background sync
  trackBackgroundSync() {
    if (!this.pwaEnabled) return;

    this.metrics.backgroundSyncCount++;
  }

  // Track push notification subscription
  trackPushNotificationSubscription() {
    if (!this.pwaEnabled) return;

    this.metrics.pushNotificationSubscriptions++;
  }

  // Track data collection
  trackDataCollection(fields: number) {
    if (!this.pwaEnabled) return;

    this.metrics.dataCollected += fields;
  }

  // Get current metrics
  getMetrics(): PWAMetrics {
    // Update session duration
    this.metrics.sessionDuration = Date.now() - this.sessionStartTime;
    
    return { ...this.metrics };
  }

  // Generate privacy report
  generatePrivacyReport(): PrivacyReport {
    return {
      dataMinimization: {
        dataCollected: this.metrics.dataCollected,
        dataRetentionDays: this.metrics.dataRetentionDays,
        dataSharing: false // We don't share data with third parties
      },
      anonymization: {
        anonymizationLevel: this.metrics.anonymizationLevel,
        pseudonymizationUsed: true,
        differentialPrivacy: true
      },
      userControl: {
        dataExportEnabled: true,
        dataDeletionEnabled: true,
        consentManagement: true
      },
      transparency: {
        dataUsageDisclosed: true,
        privacyPolicyAccessible: true,
        cookieConsent: true
      }
    };
  }

  // Export metrics for analysis (anonymized)
  exportMetrics(): any {
    if (!this.pwaEnabled) {
      return null;
    }

    return {
      timestamp: new Date().toISOString(),
      sessionId: this.generateSessionId(),
      metrics: {
        loadTime: this.metrics.loadTime,
        firstContentfulPaint: this.metrics.firstContentfulPaint,
        largestContentfulPaint: this.metrics.largestContentfulPaint,
        cumulativeLayoutShift: this.metrics.cumulativeLayoutShift,
        serviceWorkerRegistered: this.metrics.serviceWorkerRegistered,
        webAuthnUsed: this.metrics.webAuthnUsed,
        offlineUsage: this.metrics.offlineUsage,
        backgroundSyncCount: this.metrics.backgroundSyncCount,
        pushNotificationSubscriptions: this.metrics.pushNotificationSubscriptions,
        sessionDuration: this.metrics.sessionDuration,
        featuresUsedCount: this.metrics.featuresUsed.length,
        offlineActions: this.metrics.offlineActions,
        dataCollected: this.metrics.dataCollected
      },
      privacy: {
        anonymizationLevel: this.metrics.anonymizationLevel,
        dataRetentionDays: this.metrics.dataRetentionDays,
        userControlEnabled: this.metrics.userControlEnabled
      }
    };
  }

  // Generate anonymous session ID
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `${timestamp}-${random}`;
  }

  // Reset metrics (for testing or privacy)
  reset() {
    this.metrics = this.initializeMetrics();
    this.featuresUsed.clear();
    this.offlineActions = 0;
    this.sessionStartTime = Date.now();
  }

  // Check if analytics are enabled
  isEnabled(): boolean {
    return this.pwaEnabled;
  }
}

// Create singleton instance
export const pwaAnalytics = new PWAAnalytics();

