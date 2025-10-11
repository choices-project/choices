/**
 * Analytics Store - Zustand Implementation
 * 
 * Comprehensive analytics state management including event tracking,
 * user behavior analytics, performance metrics, and analytics preferences.
 * Consolidates scattered analytics hooks and local state.
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { logger } from '@/lib/utils/logger';
import { withOptional } from '@/lib/utils/objects';

// Analytics data types
type AnalyticsEvent = {
  id: string;
  type: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: string;
  userId?: string;
  sessionId: string;
  metadata?: Record<string, any>;
  page?: string;
  userAgent?: string;
  referrer?: string;
}

type PerformanceMetrics = {
  pageLoadTime: number;
  timeToInteractive: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  totalBlockingTime: number;
  memoryUsage?: number;
  networkLatency?: number;
}

type UserBehaviorData = {
  sessionDuration: number;
  pageViews: number;
  interactions: number;
  bounceRate: number;
  conversionRate: number;
  userJourney: string[];
  engagementScore: number;
  lastActivity: string;
  deviceType: string;
  browser: string;
  os: string;
}

type AnalyticsPreferences = {
  trackingEnabled: boolean;
  performanceTracking: boolean;
  errorTracking: boolean;
  userBehaviorTracking: boolean;
  marketingTracking: boolean;
  dataRetention: number; // days
  anonymizeData: boolean;
  shareWithThirdParties: boolean;
}

type AnalyticsDashboard = {
  totalEvents: number;
  uniqueUsers: number;
  sessionCount: number;
  averageSessionDuration: number;
  topPages: Array<{ page: string; views: number }>;
  topActions: Array<{ action: string; count: number }>;
  userEngagement: number;
  conversionFunnel: Array<{ step: string; users: number; conversion: number }>;
}

// Analytics store state interface
type AnalyticsStore = {
  // Analytics data
  events: AnalyticsEvent[];
  performanceMetrics: PerformanceMetrics | null;
  userBehavior: UserBehaviorData | null;
  dashboard: AnalyticsDashboard | null;
  
  // Analytics settings
  preferences: AnalyticsPreferences;
  trackingEnabled: boolean;
  sessionId: string;
  
  // Loading states
  isLoading: boolean;
  isTracking: boolean;
  isSending: boolean;
  error: string | null;
  
  // Actions - Event tracking
  trackEvent: (event: Omit<AnalyticsEvent, 'id' | 'timestamp' | 'sessionId'>) => void;
  trackPageView: (page: string, metadata?: Record<string, any>) => void;
  trackUserAction: (action: string, category: string, label?: string, value?: number) => void;
  trackError: (error: Error, context?: Record<string, any>) => void;
  trackPerformance: (metrics: Partial<PerformanceMetrics>) => void;
  
  // Actions - Data management
  setEvents: (events: AnalyticsEvent[]) => void;
  addEvent: (event: AnalyticsEvent) => void;
  clearEvents: () => void;
  setPerformanceMetrics: (metrics: PerformanceMetrics) => void;
  updateUserBehavior: (behavior: Partial<UserBehaviorData>) => void;
  setDashboard: (dashboard: AnalyticsDashboard) => void;
  
  // Actions - Preferences
  updatePreferences: (preferences: Partial<AnalyticsPreferences>) => void;
  setTrackingEnabled: (enabled: boolean) => void;
  resetPreferences: () => void;
  
  // Actions - Data operations
  sendAnalytics: () => Promise<void>;
  exportAnalytics: () => Promise<AnalyticsEvent[]>;
  importAnalytics: (events: AnalyticsEvent[]) => void;
  generateReport: (startDate: string, endDate: string) => Promise<AnalyticsDashboard>;
  
  // Actions - Loading states
  setLoading: (loading: boolean) => void;
  setTracking: (tracking: boolean) => void;
  setSending: (sending: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Default analytics preferences
const defaultPreferences: AnalyticsPreferences = {
  trackingEnabled: true,
  performanceTracking: true,
  errorTracking: true,
  userBehaviorTracking: true,
  marketingTracking: false,
  dataRetention: 365, // 1 year
  anonymizeData: true,
  shareWithThirdParties: false,
};

// Create analytics store with middleware
export const useAnalyticsStore = create<AnalyticsStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        events: [],
        performanceMetrics: null,
        userBehavior: null,
        dashboard: null,
        preferences: defaultPreferences,
        trackingEnabled: true,
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        isLoading: false,
        isTracking: false,
        isSending: false,
        error: null,
        
        // Event tracking actions
        trackEvent: (event) => set((state) => {
          if (!state.trackingEnabled || !state.preferences.trackingEnabled) {
            return state;
          }
          
          const newEvent: AnalyticsEvent = withOptional(event, {
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            sessionId: state.sessionId,
          }) as AnalyticsEvent;
          
          const updatedEvents = [...state.events, newEvent];
          
          // Limit events to prevent memory issues
          const maxEvents = 1000;
          const eventsToKeep = updatedEvents.slice(-maxEvents);
          
          logger.info('Analytics event tracked', {
            type: event.type,
            category: event.category,
            action: event.action,
            sessionId: state.sessionId
          });
          
          return { events: eventsToKeep };
        }),
        
        trackPageView: (page, metadata) => {
          const { trackEvent } = get();
          trackEvent({
            type: 'page_view',
            category: 'navigation',
            action: 'page_view',
            label: page,
            value: 1,
            metadata: withOptional(metadata || {}, {
              page,
              userAgent: navigator.userAgent,
              referrer: document.referrer,
            }),
          });
        },
        
        trackUserAction: (action, category, label, value) => {
          const { trackEvent } = get();
          trackEvent({
            type: 'user_action',
            category,
            action,
            label: label || '',
            value: value || 0,
          });
        },
        
        trackError: (error, context) => {
          const { trackEvent } = get();
          trackEvent({
            type: 'error',
            category: 'error',
            action: 'error_occurred',
            label: error.message,
            metadata: {
              error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
              },
              context,
            },
          });
        },
        
        trackPerformance: (metrics) => set((state) => {
          if (!state.preferences.performanceTracking) {
            return state;
          }
          
          const updatedMetrics = state.performanceMetrics 
            ? withOptional(state.performanceMetrics, metrics)
            : withOptional(metrics) as PerformanceMetrics;
          
          logger.info('Performance metrics tracked', {
            pageLoadTime: updatedMetrics.pageLoadTime,
            timeToInteractive: updatedMetrics.timeToInteractive,
          });
          
          return { performanceMetrics: updatedMetrics };
        }),
        
        // Data management actions
        setEvents: (events) => set({ events }),
        
        addEvent: (event) => set((state) => ({
          events: [...state.events, event]
        })),
        
        clearEvents: () => set({ events: [] }),
        
        setPerformanceMetrics: (metrics) => set({ performanceMetrics: metrics }),
        
        updateUserBehavior: (behavior) => set((state) => ({
          userBehavior: state.userBehavior 
            ? withOptional(state.userBehavior, behavior)
            : withOptional(behavior) as UserBehaviorData
        })),
        
        setDashboard: (dashboard) => set({ dashboard }),
        
        // Preferences actions
        updatePreferences: (preferences) => set((state) => ({
          preferences: withOptional(state.preferences, preferences)
        })),
        
        setTrackingEnabled: (enabled) => set({ trackingEnabled: enabled }),
        
        resetPreferences: () => set({ preferences: defaultPreferences }),
        
        // Data operations
        sendAnalytics: async () => {
          const { setSending, setError } = get();
          
          try {
            setSending(true);
            setError(null);
            
            const state = get();
            const response = await fetch('/api/analytics/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                events: state.events,
                sessionId: state.sessionId,
                timestamp: new Date().toISOString(),
              }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to send analytics data');
            }
            
            // Clear sent events
            set({ events: [] });
            
            logger.info('Analytics data sent successfully', {
              eventCount: state.events.length,
              sessionId: state.sessionId
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to send analytics data:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setSending(false);
          }
        },
        
        exportAnalytics: async () => {
          const state = get();
          return state.events;
        },
        
        importAnalytics: (events) => set({ events }),
        
        generateReport: async (startDate, endDate) => {
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            const response = await fetch('/api/analytics/report', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ startDate, endDate }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to generate analytics report');
            }
            
            const dashboard = await response.json();
            set({ dashboard });
            
            logger.info('Analytics report generated', {
              startDate,
              endDate,
              totalEvents: dashboard.totalEvents
            });
            
            return dashboard;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to generate analytics report:', error instanceof Error ? error : new Error(errorMessage));
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        // Loading state actions
        setLoading: (loading) => set({ isLoading: loading }),
        setTracking: (tracking) => set({ isTracking: tracking }),
        setSending: (sending) => set({ isSending: sending }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
      }),
      {
        name: 'analytics-store',
        partialize: (state) => ({
          preferences: state.preferences,
          trackingEnabled: state.trackingEnabled,
          sessionId: state.sessionId,
        }),
      }
    ),
    { name: 'analytics-store' }
  )
);

// Store selectors for optimized re-renders
export const useAnalyticsEvents = () => useAnalyticsStore(state => state.events);
export const useAnalyticsMetrics = () => useAnalyticsStore(state => state.performanceMetrics);
export const useAnalyticsBehavior = () => useAnalyticsStore(state => state.userBehavior);
export const useAnalyticsDashboard = () => useAnalyticsStore(state => state.dashboard);
export const useAnalyticsPreferences = () => useAnalyticsStore(state => state.preferences);
export const useAnalyticsTracking = () => useAnalyticsStore(state => state.trackingEnabled);
export const useAnalyticsLoading = () => useAnalyticsStore(state => state.isLoading);
export const useAnalyticsError = () => useAnalyticsStore(state => state.error);

// Action selectors
export const useAnalyticsActions = () => useAnalyticsStore(state => ({
  trackEvent: state.trackEvent,
  trackPageView: state.trackPageView,
  trackUserAction: state.trackUserAction,
  trackError: state.trackError,
  trackPerformance: state.trackPerformance,
  setEvents: state.setEvents,
  addEvent: state.addEvent,
  clearEvents: state.clearEvents,
  setPerformanceMetrics: state.setPerformanceMetrics,
  updateUserBehavior: state.updateUserBehavior,
  setDashboard: state.setDashboard,
  updatePreferences: state.updatePreferences,
  setTrackingEnabled: state.setTrackingEnabled,
  resetPreferences: state.resetPreferences,
  sendAnalytics: state.sendAnalytics,
  exportAnalytics: state.exportAnalytics,
  importAnalytics: state.importAnalytics,
  generateReport: state.generateReport,
  setLoading: state.setLoading,
  setTracking: state.setTracking,
  setSending: state.setSending,
  setError: state.setError,
  clearError: state.clearError,
}));

// Computed selectors
export const useAnalyticsStats = () => useAnalyticsStore(state => ({
  totalEvents: state.events.length,
  sessionId: state.sessionId,
  trackingEnabled: state.trackingEnabled,
  preferences: state.preferences,
  hasPerformanceMetrics: !!state.performanceMetrics,
  hasUserBehavior: !!state.userBehavior,
  hasDashboard: !!state.dashboard,
}));

export const useAnalyticsSession = () => useAnalyticsStore(state => ({
  sessionId: state.sessionId,
  events: state.events,
  isTracking: state.isTracking,
  isSending: state.isSending,
}));

// Store utilities
export const analyticsStoreUtils = {
  /**
   * Get analytics summary
   */
  getAnalyticsSummary: () => {
    const state = useAnalyticsStore.getState();
    return {
      totalEvents: state.events.length,
      sessionId: state.sessionId,
      trackingEnabled: state.trackingEnabled,
      preferences: state.preferences,
      performanceMetrics: state.performanceMetrics,
      userBehavior: state.userBehavior,
    };
  },
  
  /**
   * Get events by type
   */
  getEventsByType: (type: string) => {
    const state = useAnalyticsStore.getState();
    return state.events.filter(event => event.type === type);
  },
  
  /**
   * Get events by category
   */
  getEventsByCategory: (category: string) => {
    const state = useAnalyticsStore.getState();
    return state.events.filter(event => event.category === category);
  },
  
  /**
   * Get recent events
   */
  getRecentEvents: (limit: number = 10) => {
    const state = useAnalyticsStore.getState();
    return state.events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  },
  
  /**
   * Check if tracking is enabled
   */
  isTrackingEnabled: () => {
    const state = useAnalyticsStore.getState();
    return state.trackingEnabled && state.preferences.trackingEnabled;
  },
  
  /**
   * Get analytics configuration
   */
  getAnalyticsConfig: () => {
    const state = useAnalyticsStore.getState();
    return {
      trackingEnabled: state.trackingEnabled,
      preferences: state.preferences,
      sessionId: state.sessionId,
    };
  }
};

// Store subscriptions for external integrations
export const analyticsStoreSubscriptions = {
  /**
   * Subscribe to event tracking
   */
  onEventTracked: (callback: (event: AnalyticsEvent) => void) => {
    let prevEvents: AnalyticsEvent[] = [];
    return useAnalyticsStore.subscribe(
      (state) => {
        const events = state.events;
        if (events.length > prevEvents.length) {
          const newEvent = events[events.length - 1];
          callback(newEvent);
        }
        prevEvents = events;
        return events;
      }
    );
  },
  
  /**
   * Subscribe to performance metrics changes
   */
  onPerformanceMetricsChange: (callback: (metrics: PerformanceMetrics) => void) => {
    let prevMetrics: PerformanceMetrics | null = null;
    return useAnalyticsStore.subscribe(
      (state) => {
        const metrics = state.performanceMetrics;
        if (metrics !== prevMetrics && metrics !== null) {
          callback(metrics);
        }
        prevMetrics = metrics;
        return metrics;
      }
    );
  },
  
  /**
   * Subscribe to tracking enabled changes
   */
  onTrackingEnabledChange: (callback: (enabled: boolean) => void) => {
    let prevEnabled: boolean | null = null;
    return useAnalyticsStore.subscribe(
      (state) => {
        const enabled = state.trackingEnabled;
        if (enabled !== prevEnabled) {
          callback(enabled);
        }
        prevEnabled = enabled;
        return enabled;
      }
    );
  }
};

// Store debugging utilities
export const analyticsStoreDebug = {
  /**
   * Log current analytics state
   */
  logState: () => {
    const state = useAnalyticsStore.getState();
    console.log('Analytics Store State:', {
      totalEvents: state.events.length,
      sessionId: state.sessionId,
      trackingEnabled: state.trackingEnabled,
      preferences: state.preferences,
      hasPerformanceMetrics: !!state.performanceMetrics,
      hasUserBehavior: !!state.userBehavior,
      isLoading: state.isLoading,
      error: state.error
    });
  },
  
  /**
   * Log analytics summary
   */
  logSummary: () => {
    const summary = analyticsStoreUtils.getAnalyticsSummary();
    console.log('Analytics Summary:', summary);
  },
  
  /**
   * Log recent events
   */
  logRecentEvents: (limit: number = 5) => {
    const events = analyticsStoreUtils.getRecentEvents(limit);
    console.log('Recent Analytics Events:', events);
  },
  
  /**
   * Reset analytics store
   */
  reset: () => {
    useAnalyticsStore.getState().clearEvents();
    useAnalyticsStore.getState().resetPreferences();
    console.log('Analytics store reset');
  }
};
