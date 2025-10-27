/**
 * @fileoverview Analytics Store - Zustand Implementation
 * 
 * Analytics state management including event tracking,
 * user behavior analytics, performance metrics, and analytics preferences.
 * Consolidates scattered analytics hooks and local state.
 * 
 * @author Choices Platform Team
 * @created 2025-10-24
 * @version 2.0.0
 * @since 1.0.0
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { persist } from 'zustand/middleware';

import { logger } from '../logger';

// Sophisticated Analytics data types with advanced features
interface AnalyticsEvent {
  id: string;
  event_type: string;
  user_id?: string;
  session_id: string;
  event_data: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  timestamp: string;
  type: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
  analytics_event_data?: Array<{
    data_key: string;
    data_value: string;
    data_type: string;
  }>;
}

// Advanced analytics metrics
interface AnalyticsMetrics {
  totalEvents: number;
  uniqueUsers: number;
  sessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  engagementScore: number;
  trustScore: number;
  participationRate: number;
}

// Chart data types for analytics visualization
interface ChartData {
  name: string;
  value: number;
  color: string;
  confidence?: number;
  previousValue?: number;
}

interface ChartConfig {
  data: ChartData[];
  maxValue: number;
  showTrends: boolean;
  showConfidence: boolean;
  title?: string;
  subtitle?: string;
  type?: 'bar' | 'progress';
}

interface PerformanceMetrics {
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

interface UserBehaviorData {
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

interface AnalyticsPreferences {
  trackingEnabled: boolean;
  performanceTracking: boolean;
  errorTracking: boolean;
  userBehaviorTracking: boolean;
  marketingTracking: boolean;
  dataRetention: number; // days
  anonymizeData: boolean;
  shareWithThirdParties: boolean;
}

interface AnalyticsDashboard {
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
interface AnalyticsStore {
  // Analytics data
  events: AnalyticsEvent[];
  performanceMetrics: PerformanceMetrics | null;
  userBehavior: UserBehaviorData | null;
  dashboard: AnalyticsDashboard | null;
  
  // Chart data management
  chartConfig: ChartConfig | null;
  chartData: ChartData[];
  chartMaxValue: number;
  chartShowTrends: boolean;
  chartShowConfidence: boolean;
  
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
  
  // Actions - Chart data management
  setChartData: (data: ChartData[]) => void;
  setChartConfig: (config: ChartConfig) => void;
  updateChartConfig: (config: Partial<ChartConfig>) => void;
  setChartMaxValue: (maxValue: number) => void;
  setChartShowTrends: (showTrends: boolean) => void;
  setChartShowConfidence: (showConfidence: boolean) => void;
  clearChartData: () => void;
  
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
        chartConfig: null,
        chartData: [],
        chartMaxValue: 0,
        chartShowTrends: false,
        chartShowConfidence: false,
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
          
          const newEvent: AnalyticsEvent = {
            ...event,
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            sessionId: state.sessionId,
          } as AnalyticsEvent;
          
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
            event_type: 'page_view',
            session_id: get().sessionId,
            event_data: {},
            created_at: new Date().toISOString(),
            type: 'page_view',
            category: 'navigation',
            action: 'page_view',
            label: page,
            value: 1,
            metadata: {
              ...(metadata ?? {}),
              page,
              userAgent: navigator.userAgent,
              referrer: document.referrer,
            },
          });
        },
        
        trackUserAction: (action, category, label, value) => {
          const { trackEvent } = get();
          trackEvent({
            event_type: 'user_action',
            session_id: get().sessionId,
            event_data: {},
            created_at: new Date().toISOString(),
            type: 'user_action',
            category,
            action,
            label: label ?? '',
            value: value ?? 0,
          });
        },
        
        trackError: (error, context) => {
          const { trackEvent } = get();
          trackEvent({
            event_type: 'error',
            session_id: get().sessionId,
            event_data: {},
            created_at: new Date().toISOString(),
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
            ? { ...state.performanceMetrics, ...metrics }
            : metrics as PerformanceMetrics;
          
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
            ? { ...state.userBehavior, ...behavior }
            : behavior as UserBehaviorData
        })),
        
        setDashboard: (dashboard) => set({ dashboard }),
        
        // Chart data management actions
        setChartData: (data) => set({ chartData: data }),
        
        setChartConfig: (config) => set({ 
          chartConfig: config,
          chartData: config.data,
          chartMaxValue: config.maxValue,
          chartShowTrends: config.showTrends,
          chartShowConfidence: config.showConfidence
        }),
        
        updateChartConfig: (config) => set((state) => ({
          chartConfig: state.chartConfig 
            ? { ...state.chartConfig, ...config }
            : config as ChartConfig,
          chartData: config.data ?? state.chartData,
          chartMaxValue: config.maxValue ?? state.chartMaxValue,
          chartShowTrends: config.showTrends !== undefined ? config.showTrends : state.chartShowTrends,
          chartShowConfidence: config.showConfidence !== undefined ? config.showConfidence : state.chartShowConfidence
        })),
        
        setChartMaxValue: (maxValue) => set({ chartMaxValue: maxValue }),
        
        setChartShowTrends: (showTrends) => set({ chartShowTrends: showTrends }),
        
        setChartShowConfidence: (showConfidence) => set({ chartShowConfidence: showConfidence }),
        
        clearChartData: () => set({ 
          chartConfig: null,
          chartData: [],
          chartMaxValue: 0,
          chartShowTrends: false,
          chartShowConfidence: false
        }),
        
        // Preferences actions
        updatePreferences: (preferences) => set((state) => ({
          preferences: { ...state.preferences, ...preferences }
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
            const response = await fetch('/api/analytics/unified/events?methods=comprehensive&ai-provider=rule-based', {
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
            
            const response = await fetch('/api/analytics/unified/report?methods=comprehensive&ai-provider=rule-based', {
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

// Chart data selectors
export const useAnalyticsChartData = () => useAnalyticsStore(state => state.chartData);
export const useAnalyticsChartConfig = () => useAnalyticsStore(state => state.chartConfig);
export const useAnalyticsChartMaxValue = () => useAnalyticsStore(state => state.chartMaxValue);
export const useAnalyticsChartShowTrends = () => useAnalyticsStore(state => state.chartShowTrends);
export const useAnalyticsChartShowConfidence = () => useAnalyticsStore(state => state.chartShowConfidence);

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
  setChartData: state.setChartData,
  setChartConfig: state.setChartConfig,
  updateChartConfig: state.updateChartConfig,
  setChartMaxValue: state.setChartMaxValue,
  setChartShowTrends: state.setChartShowTrends,
  setChartShowConfidence: state.setChartShowConfidence,
  clearChartData: state.clearChartData,
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

// Chart data computed selectors
export const useAnalyticsChartContext = () => useAnalyticsStore(state => ({
  data: state.chartData,
  maxValue: state.chartMaxValue,
  showTrends: state.chartShowTrends,
  showConfidence: state.chartShowConfidence,
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
  getRecentEvents: (limit = 10) => {
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
          if (newEvent) {
            callback(newEvent);
          }
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
    logger.debug('Analytics Store State', {
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
    logger.debug('Analytics Summary', summary);
  },
  
  /**
   * Log recent events
   */
  logRecentEvents: (limit = 5) => {
    const events = analyticsStoreUtils.getRecentEvents(limit);
    logger.debug('Recent Analytics Events', { events });
  },
  
  /**
   * Reset analytics store
   */
  reset: () => {
    useAnalyticsStore.getState().clearEvents();
    useAnalyticsStore.getState().resetPreferences();
    logger.info('Analytics store reset');
  }
};
