/**
 * @fileoverview Analytics Store - Zustand Implementation
 *
 * Modernized analytics state management with typed creators, middleware ordering,
 * memoized selectors, and consent-aware tracking helpers.
 */

import { useMemo } from 'react';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';

import type {
  AnalyticsAsyncState,
  AnalyticsDateRange,
  DemographicsData,
  PollHeatmapEntry,
  PollHeatmapFilters,
  TemporalAnalyticsData,
  TrendDataPoint,
  TrustTierComparisonData,
} from '@/features/analytics/types/analytics';

import {
  fetchAnalyticsDemographics,
  fetchAnalyticsPollHeatmap,
  fetchAnalyticsTemporal,
  fetchAnalyticsTrends,
  fetchAnalyticsTrustTiers,
  generateAnalyticsReport,
  sendAnalyticsEvents,
} from '@/lib/analytics/services/analyticsService';
import { logger } from '@/lib/utils/logger';

import { createBaseStoreActions } from './baseStoreActions';
import { createSafeStorage } from './storage';

import type { StateCreator } from 'zustand';


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AnalyticsEvent = {
  id: string;
  event_type: string;
  user_id?: string;
  session_id: string;
  event_data: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  timestamp: string;
  type: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
  analytics_event_data?: Array<{
    data_key: string;
    data_value: string;
    data_type: string;
  }>;
};

type ChartData = {
  name: string;
  value: number;
  color: string;
  confidence?: number;
  previousValue?: number;
};

type ChartConfig = {
  data: ChartData[];
  maxValue: number;
  showTrends: boolean;
  showConfidence: boolean;
  title?: string;
  subtitle?: string;
  type?: 'bar' | 'progress';
};

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
};

const DEFAULT_PERFORMANCE_METRICS: PerformanceMetrics = {
  pageLoadTime: 0,
  timeToInteractive: 0,
  firstContentfulPaint: 0,
  largestContentfulPaint: 0,
  cumulativeLayoutShift: 0,
  firstInputDelay: 0,
  totalBlockingTime: 0,
};

const DEFAULT_USER_BEHAVIOR: UserBehaviorData = {
  sessionDuration: 0,
  pageViews: 0,
  interactions: 0,
  bounceRate: 0,
  conversionRate: 0,
  userJourney: [],
  engagementScore: 0,
  lastActivity: '',
  deviceType: 'unknown',
  browser: 'unknown',
  os: 'unknown',
};

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
};

type AnalyticsPreferences = {
  trackingEnabled: boolean;
  performanceTracking: boolean;
  errorTracking: boolean;
  userBehaviorTracking: boolean;
  marketingTracking: boolean;
  dataRetention: number; // days
  anonymizeData: boolean;
  shareWithThirdParties: boolean;
};

export type AnalyticsDashboard = {
  totalEvents: number;
  uniqueUsers: number;
  sessionCount: number;
  averageSessionDuration: number;
  topPages: Array<{ page: string; views: number }>;
  topActions: Array<{ action: string; count: number }>;
  userEngagement: number;
  conversionFunnel: Array<{ step: string; users: number; conversion: number }>;
};

export type AnalyticsState = {
  events: AnalyticsEvent[];
  performanceMetrics: PerformanceMetrics | null;
  userBehavior: UserBehaviorData | null;
  dashboard: AnalyticsDashboard | null;
  chartConfig: ChartConfig | null;
  chartData: ChartData[];
  chartMaxValue: number;
  chartShowTrends: boolean;
  chartShowConfidence: boolean;
  preferences: AnalyticsPreferences;
  trackingEnabled: boolean;
  sessionId: string;
  isLoading: boolean;
  isTracking: boolean;
  isSending: boolean;
  error: string | null;
  demographics: AnalyticsAsyncState<DemographicsData | null, Record<string, never>>;
  trends: AnalyticsAsyncState<TrendDataPoint[], { range: AnalyticsDateRange }>;
  temporal: AnalyticsAsyncState<TemporalAnalyticsData | null, { range: AnalyticsDateRange }>;
  pollHeatmap: AnalyticsAsyncState<PollHeatmapEntry[], PollHeatmapFilters>;
  trustTiers: AnalyticsAsyncState<TrustTierComparisonData | null, Record<string, never>>;
};

export type AnalyticsActions = {
  trackEvent: (event: Omit<AnalyticsEvent, 'id' | 'timestamp' | 'sessionId'>) => void;
  trackPageView: (page: string, metadata?: Record<string, unknown>) => void;
  trackUserAction: (action: string, category: string, label?: string, value?: number) => void;
  trackError: (error: Error, context?: Record<string, unknown>) => void;
  trackPerformance: (metrics: Partial<PerformanceMetrics>) => void;
  setEvents: (events: AnalyticsEvent[]) => void;
  addEvent: (event: AnalyticsEvent) => void;
  clearEvents: () => void;
  setPerformanceMetrics: (metrics: PerformanceMetrics) => void;
  updateUserBehavior: (behavior: Partial<UserBehaviorData>) => void;
  setDashboard: (dashboard: AnalyticsDashboard) => void;
  setChartData: (data: ChartData[]) => void;
  setChartConfig: (config: ChartConfig) => void;
  updateChartConfig: (config: Partial<ChartConfig>) => void;
  setChartMaxValue: (maxValue: number) => void;
  setChartShowTrends: (showTrends: boolean) => void;
  setChartShowConfidence: (showConfidence: boolean) => void;
  clearChartData: () => void;
  updatePreferences: (preferences: Partial<AnalyticsPreferences>) => void;
  setTrackingEnabled: (enabled: boolean) => void;
  resetPreferences: () => void;
  resetChartState: () => void;
  resetAnalyticsState: () => void;
  sendAnalytics: () => Promise<void>;
  exportAnalytics: () => Promise<AnalyticsEvent[]>;
  importAnalytics: (events: AnalyticsEvent[]) => void;
  generateReport: (startDate: string, endDate: string) => Promise<AnalyticsDashboard>;
  setLoading: (loading: boolean) => void;
  setTracking: (tracking: boolean) => void;
  setSending: (sending: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  fetchDemographics: (options?: { fallback?: () => DemographicsData; force?: boolean }) => Promise<DemographicsData | null>;
  fetchTrends: (
    range?: AnalyticsDateRange,
    options?: { fallback?: (range: AnalyticsDateRange) => TrendDataPoint[]; force?: boolean }
  ) => Promise<TrendDataPoint[] | null>;
  fetchTemporal: (
    range?: AnalyticsDateRange,
    options?: { fallback?: (range: AnalyticsDateRange) => TemporalAnalyticsData; force?: boolean }
  ) => Promise<TemporalAnalyticsData | null>;
  fetchPollHeatmap: (
    filters?: Partial<PollHeatmapFilters>,
    options?: { fallback?: (filters: PollHeatmapFilters) => PollHeatmapEntry[]; force?: boolean }
  ) => Promise<PollHeatmapEntry[] | null>;
  fetchTrustTierComparison: (
    options?: { fallback?: () => TrustTierComparisonData; force?: boolean }
  ) => Promise<TrustTierComparisonData | null>;
};

export type AnalyticsStore = AnalyticsState & AnalyticsActions;

type AnalyticsStoreCreator = StateCreator<
  AnalyticsStore,
  [['zustand/devtools', never], ['zustand/persist', unknown], ['zustand/immer', never]]
>;

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const MAX_EVENTS = 1000;

// CRITICAL: Stable empty array reference for initial state
// This ensures the same array reference is used across all store instances
// Prevents infinite loops when components subscribe to empty events array
const EMPTY_EVENTS_ARRAY: AnalyticsEvent[] = [];

const createEventId = () =>
  `event_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

const createSessionId = (): string => {
  // Use cryptographically secure random number generator
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(9);
    crypto.getRandomValues(array);
    const randomPart = Array.from(array, byte => byte.toString(36)).join('').slice(0, 9);
    return `session_${Date.now()}_${randomPart}`;
  }
  // Fallback for environments without crypto (should not happen in browser/Node)
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
};

const createDefaultPreferences = (): AnalyticsPreferences => ({
  trackingEnabled: false,
  performanceTracking: false,
  errorTracking: true,
  userBehaviorTracking: false,
  marketingTracking: false,
  dataRetention: 365,
  anonymizeData: true,
  shareWithThirdParties: false,
});

const buildAnalyticsEvent = (
  event: Omit<AnalyticsEvent, 'id' | 'timestamp' | 'sessionId'>,
  sessionId: string,
): AnalyticsEvent => ({
  ...event,
    id: createEventId(),
    timestamp: new Date().toISOString(),
    session_id: sessionId,
});

const DEFAULT_TRENDS_RANGE: AnalyticsDateRange = '7d';
const DEFAULT_TEMPORAL_RANGE: AnalyticsDateRange = '30d';
const DEFAULT_POLL_HEATMAP_FILTERS: PollHeatmapFilters = {
  category: 'All Categories',
  limit: 20,
};

const applyChartState = (draft: AnalyticsState, config: ChartConfig | null) => {
  draft.chartConfig = config;
  if (config) {
    draft.chartData = config.data;
    draft.chartMaxValue = config.maxValue;
    draft.chartShowTrends = config.showTrends;
    draft.chartShowConfidence = config.showConfidence;
  } else {
    draft.chartData = [];
    draft.chartMaxValue = 0;
    draft.chartShowTrends = false;
    draft.chartShowConfidence = false;
  }
};

// ---------------------------------------------------------------------------
// Initial state & actions
// ---------------------------------------------------------------------------

export const createInitialAnalyticsState = (): AnalyticsState => ({
  events: EMPTY_EVENTS_ARRAY,
  performanceMetrics: null,
  userBehavior: null,
  dashboard: null,
  chartConfig: null,
  chartData: [],
  chartMaxValue: 0,
  chartShowTrends: false,
  chartShowConfidence: false,
  preferences: createDefaultPreferences(),
  trackingEnabled: false,
  sessionId: createSessionId(),
  isLoading: false,
  isTracking: false,
  isSending: false,
  error: null,
  demographics: {
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
    meta: {},
  },
  trends: {
    data: [],
    loading: false,
    error: null,
    lastUpdated: null,
    meta: {
      range: DEFAULT_TRENDS_RANGE,
    },
  },
  temporal: {
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
    meta: {
      range: DEFAULT_TEMPORAL_RANGE,
    },
  },
  pollHeatmap: {
    data: [],
    loading: false,
    error: null,
    lastUpdated: null,
    meta: { ...DEFAULT_POLL_HEATMAP_FILTERS },
  },
  trustTiers: {
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
    meta: {},
  },
});

export const createAnalyticsActions = (
  set: Parameters<AnalyticsStoreCreator>[0],
  get: Parameters<AnalyticsStoreCreator>[1],
): AnalyticsActions => {
  const setState = set as unknown as (recipe: (draft: AnalyticsState) => void) => void;
  const baseActions = createBaseStoreActions<AnalyticsState>(setState);

  const shouldTrack = () => {
    const state = get();
    return state.trackingEnabled && state.preferences.trackingEnabled;
  };

  const trackEventInternal: AnalyticsActions['trackEvent'] = (event) => {
    if (!shouldTrack()) {
      const state = get();
      logger.debug('Analytics tracking skipped - user has not opted in', {
        type: event.type,
        trackingEnabled: state.trackingEnabled,
        preferencesEnabled: state.preferences.trackingEnabled,
      });
      return;
    }

    const state = get();
    const newEvent = buildAnalyticsEvent(event, state.sessionId);

    setState((draft) => {
      draft.events.push(newEvent);
      if (draft.events.length > MAX_EVENTS) {
        draft.events.splice(0, draft.events.length - MAX_EVENTS);
      }
    });

    logger.debug('Analytics event tracked (user consented)', {
      type: event.type,
      category: event.category,
      action: event.action,
      sessionId: state.sessionId,
    });
  };

  const actions: AnalyticsActions = {
    ...baseActions,
    trackEvent: trackEventInternal,

    trackPageView: (page, metadata) => {
      const sessionId = get().sessionId;
      trackEventInternal({
        event_type: 'page_view',
        session_id: sessionId,
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
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          referrer: typeof document !== 'undefined' ? document.referrer : '',
        },
      });
    },

    trackUserAction: (action, category, label, value) => {
      const sessionId = get().sessionId;
      trackEventInternal({
        event_type: 'user_action',
        session_id: sessionId,
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
      const sessionId = get().sessionId;
      trackEventInternal({
        event_type: 'error',
        session_id: sessionId,
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

    trackPerformance: (metrics) => {
      const state = get();
      if (!state.preferences.performanceTracking) {
        return;
      }

      const baselineMetrics = state.performanceMetrics ?? DEFAULT_PERFORMANCE_METRICS;
      const updatedMetrics: PerformanceMetrics = {
        ...baselineMetrics,
        ...metrics,
      };

      setState((draft) => {
        draft.performanceMetrics = updatedMetrics;
      });

      logger.info('Performance metrics tracked', {
        pageLoadTime: updatedMetrics.pageLoadTime,
        timeToInteractive: updatedMetrics.timeToInteractive,
      });
    },

    setEvents: (events) => {
      setState((draft) => {
        // CRITICAL: Use splice to replace array in-place to maintain reference stability
        // This prevents immer from creating new array references when array is empty
        draft.events.splice(0, draft.events.length, ...events);
      });
    },

    addEvent: (event) => {
      setState((draft) => {
        draft.events.push(event);
        if (draft.events.length > MAX_EVENTS) {
          draft.events.splice(0, draft.events.length - MAX_EVENTS);
        }
      });
    },

    clearEvents: () => {
      setState((draft) => {
        // CRITICAL: Use splice to clear array in-place to maintain reference stability
        // This prevents immer from creating new empty array references
        draft.events.splice(0, draft.events.length);
      });
    },

    setPerformanceMetrics: (metrics) => {
      setState((draft) => {
        draft.performanceMetrics = metrics;
      });
    },

    updateUserBehavior: (behavior) => {
      setState((draft) => {
        const baselineBehavior = draft.userBehavior ?? DEFAULT_USER_BEHAVIOR;
        draft.userBehavior = {
          ...baselineBehavior,
          ...behavior,
        };
      });
    },

    setDashboard: (dashboard) => {
      setState((draft) => {
        draft.dashboard = dashboard;
      });
    },

    setChartData: (data) => {
      setState((draft) => {
        draft.chartData = data;
      });
    },

    setChartConfig: (config) => {
      setState((draft) => {
        applyChartState(draft, config);
      });
    },

    updateChartConfig: (config) => {
      setState((draft) => {
        const previous = draft.chartConfig ?? {
          data: [],
          maxValue: 0,
          showTrends: false,
          showConfidence: false,
        };
        const updatedConfig: ChartConfig = {
          ...previous,
          ...config,
        };
        draft.chartConfig = updatedConfig;
        draft.chartData = config.data ?? updatedConfig.data ?? draft.chartData;
        draft.chartMaxValue =
          typeof config.maxValue === 'number'
            ? config.maxValue
            : updatedConfig.maxValue ?? draft.chartMaxValue;
        draft.chartShowTrends =
          typeof config.showTrends === 'boolean'
            ? config.showTrends
            : updatedConfig.showTrends ?? draft.chartShowTrends;
        draft.chartShowConfidence =
          typeof config.showConfidence === 'boolean'
            ? config.showConfidence
            : updatedConfig.showConfidence ?? draft.chartShowConfidence;
      });
    },

    setChartMaxValue: (maxValue) => {
      setState((draft) => {
        draft.chartMaxValue = maxValue;
      });
    },

    setChartShowTrends: (showTrends) => {
      setState((draft) => {
        draft.chartShowTrends = showTrends;
      });
    },

    setChartShowConfidence: (showConfidence) => {
      setState((draft) => {
        draft.chartShowConfidence = showConfidence;
      });
    },

    clearChartData: () => {
      setState((draft) => {
        applyChartState(draft, null);
      });
    },

    updatePreferences: (preferences) => {
      setState((draft) => {
        draft.preferences = {
          ...draft.preferences,
          ...preferences,
        };
      });
    },

    setTrackingEnabled: (enabled) => {
      setState((draft) => {
        draft.trackingEnabled = enabled;
      });
    },

    resetPreferences: () => {
      setState((draft) => {
        draft.preferences = createDefaultPreferences();
      });
    },

    resetChartState: () => {
      setState((draft) => {
        applyChartState(draft, null);
      });
    },

    resetAnalyticsState: () => {
      setState((draft) => {
        Object.assign(draft, createInitialAnalyticsState());
      });
    },

    sendAnalytics: async () => {
      if (!shouldTrack()) {
        logger.info('Analytics send skipped - tracking disabled by user consent settings');
        return;
      }

      const pendingEvents = get().events;
      if (pendingEvents.length === 0) {
        logger.debug('Analytics send skipped - no events queued');
        return;
      }

      setState((draft) => {
        draft.isSending = true;
        draft.error = null;
      });

      const snapshot = get();

      try {
        const result = await sendAnalyticsEvents({
          events: snapshot.events,
          sessionId: snapshot.sessionId,
          timestamp: new Date().toISOString(),
        });

        if (!result.success) {
          setState((draft) => {
            draft.error = result.error;
          });
          logger.error('Failed to send analytics data:', new Error(result.error));
          return;
        }

        setState((draft) => {
          draft.events = [];
        });

        logger.info('Analytics data sent successfully', {
          eventCount: snapshot.events.length,
          sessionId: snapshot.sessionId,
        });
      } finally {
        setState((draft) => {
          draft.isSending = false;
        });
      }
    },

    exportAnalytics: async () => [...get().events],

    importAnalytics: (events) => {
      setState((draft) => {
        draft.events = [...events];
      });
    },

    generateReport: async (startDate, endDate) => {
      setState((draft) => {
        draft.isLoading = true;
        draft.error = null;
      });

      try {
        const result = await generateAnalyticsReport({ startDate, endDate });

        if (!result.success) {
          setState((draft) => {
            draft.error = result.error;
          });
          logger.error('Failed to generate analytics report:', new Error(result.error));
          throw new Error(result.error);
        }

        const dashboard = result.data;
        setState((draft) => {
          draft.dashboard = dashboard;
        });

        logger.info('Analytics report generated', {
          startDate,
          endDate,
          totalEvents: dashboard.totalEvents,
        });

        return dashboard;
      } finally {
        setState((draft) => {
          draft.isLoading = false;
        });
      }
    },

    setTracking: (tracking) => {
      setState((draft) => {
        draft.isTracking = tracking;
      });
    },

    setSending: (sending) => {
      setState((draft) => {
        draft.isSending = sending;
      });
    },

    fetchDemographics: async (options) => {
      setState((draft) => {
        draft.demographics.loading = true;
        draft.demographics.error = null;
      });

      const result = await fetchAnalyticsDemographics();

      if (!result.success) {
        const fallback = options?.fallback ? options.fallback() : null;
        setState((draft) => {
          draft.demographics.loading = false;
          draft.demographics.error = result.error;
          if (fallback) {
            draft.demographics.data = fallback;
            draft.demographics.lastUpdated = new Date().toISOString();
          }
        });

        logger.error('Failed to fetch demographics data', {
          error: new Error(result.error),
          message: result.error,
        });

        return fallback;
      }

      setState((draft) => {
        draft.demographics.data = result.data;
        draft.demographics.loading = false;
        draft.demographics.error = null;
        draft.demographics.lastUpdated = new Date().toISOString();
      });

      return result.data;
    },

    fetchTrends: async (range, options) => {
      const currentState = get();
      const targetRange = range ?? currentState.trends.meta.range ?? DEFAULT_TRENDS_RANGE;

      setState((draft) => {
        draft.trends.loading = true;
        draft.trends.error = null;
        draft.trends.meta.range = targetRange;
      });

      const result = await fetchAnalyticsTrends(targetRange);

      if (!result.success) {
        const fallback = options?.fallback ? options.fallback(targetRange) : null;

        setState((draft) => {
          draft.trends.loading = false;
          draft.trends.error = result.error;
          if (fallback) {
            draft.trends.data = fallback;
            draft.trends.lastUpdated = new Date().toISOString();
          }
        });

        logger.error('Failed to fetch trends data', {
          error: new Error(result.error),
          message: result.error,
          range: targetRange,
        });

        return fallback;
      }

      setState((draft) => {
        draft.trends.data = result.data;
        draft.trends.loading = false;
        draft.trends.error = null;
        draft.trends.lastUpdated = new Date().toISOString();
      });

      return result.data;
    },

    fetchTemporal: async (range, options) => {
      const currentState = get();
      const targetRange = range ?? currentState.temporal.meta.range ?? DEFAULT_TEMPORAL_RANGE;

      setState((draft) => {
        draft.temporal.loading = true;
        draft.temporal.error = null;
        draft.temporal.meta.range = targetRange;
      });

      const result = await fetchAnalyticsTemporal(targetRange);

      if (!result.success) {
        const fallback = options?.fallback ? options.fallback(targetRange) : null;

        setState((draft) => {
          draft.temporal.loading = false;
          draft.temporal.error = result.error;
          if (fallback) {
            draft.temporal.data = fallback;
            draft.temporal.lastUpdated = new Date().toISOString();
          }
        });

        logger.error('Failed to fetch temporal analytics', {
          error: new Error(result.error),
          message: result.error,
          range: targetRange,
        });

        return fallback;
      }

      setState((draft) => {
        draft.temporal.data = result.data;
        draft.temporal.loading = false;
        draft.temporal.error = null;
        draft.temporal.lastUpdated = new Date().toISOString();
      });

      return result.data;
    },


    fetchPollHeatmap: async (filters, options) => {
      const currentState = get();
      const mergedFilters: PollHeatmapFilters = {
        ...DEFAULT_POLL_HEATMAP_FILTERS,
        ...currentState.pollHeatmap.meta,
        ...(filters ?? {}),
      };

      setState((draft) => {
        draft.pollHeatmap.loading = true;
        draft.pollHeatmap.error = null;
        draft.pollHeatmap.meta = { ...mergedFilters };
      });

      const result = await fetchAnalyticsPollHeatmap(mergedFilters);

      if (!result.success) {
        const fallback = options?.fallback ? options.fallback(mergedFilters) : null;

        setState((draft) => {
          draft.pollHeatmap.loading = false;
          draft.pollHeatmap.error = result.error;
          if (fallback) {
            draft.pollHeatmap.data = fallback;
            draft.pollHeatmap.lastUpdated = new Date().toISOString();
          }
        });

        logger.error('Failed to fetch poll heatmap', {
          error: new Error(result.error),
          message: result.error,
          filters: mergedFilters,
        });

        return fallback;
      }

      setState((draft) => {
        draft.pollHeatmap.data = result.data;
        draft.pollHeatmap.loading = false;
        draft.pollHeatmap.error = null;
        draft.pollHeatmap.lastUpdated = new Date().toISOString();
      });

      return result.data;
    },

    fetchTrustTierComparison: async (options) => {
      setState((draft) => {
        draft.trustTiers.loading = true;
        draft.trustTiers.error = null;
      });

      const result = await fetchAnalyticsTrustTiers();

      if (!result.success) {
        const fallback = options?.fallback ? options.fallback() : null;

        setState((draft) => {
          draft.trustTiers.loading = false;
          draft.trustTiers.error = result.error;
          if (fallback) {
            draft.trustTiers.data = fallback;
            draft.trustTiers.lastUpdated = new Date().toISOString();
          }
        });

        logger.error('Failed to fetch trust tier analytics', {
          error: new Error(result.error),
          message: result.error,
        });

        return fallback;
      }

      setState((draft) => {
        draft.trustTiers.data = result.data;
        draft.trustTiers.loading = false;
        draft.trustTiers.error = null;
        draft.trustTiers.lastUpdated = new Date().toISOString();
      });

      return result.data;
    },

  };

  return actions;
};

export const analyticsStoreCreator: AnalyticsStoreCreator = (set, get) =>
  Object.assign(createInitialAnalyticsState(), createAnalyticsActions(set, get));

// ---------------------------------------------------------------------------
// Store instance
// ---------------------------------------------------------------------------

export const useAnalyticsStore = create<AnalyticsStore>()(
  devtools(
    persist(
      immer(analyticsStoreCreator),
      {
        name: 'analytics-store',
        storage: createSafeStorage(),
        partialize: (state) => ({
          preferences: state.preferences,
          trackingEnabled: state.trackingEnabled,
          sessionId: state.sessionId,
        }),
      },
    ),
    { name: 'analytics-store' },
  ),
);

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const useAnalyticsEvents = () => useAnalyticsStore((state) => state.events);
export const useAnalyticsMetrics = () => useAnalyticsStore((state) => state.performanceMetrics);
export const useAnalyticsBehavior = () => useAnalyticsStore((state) => state.userBehavior);
export const useAnalyticsDashboard = () => useAnalyticsStore((state) => state.dashboard);
export const useAnalyticsPreferences = () => useAnalyticsStore((state) => state.preferences);
export const useAnalyticsTracking = () => useAnalyticsStore((state) => state.trackingEnabled);
export const useAnalyticsLoading = () => useAnalyticsStore((state) => state.isLoading);
export const useAnalyticsError = () => useAnalyticsStore((state) => state.error);

export const useAnalyticsChartData = () => useAnalyticsStore((state) => state.chartData);
export const useAnalyticsChartConfig = () => useAnalyticsStore((state) => state.chartConfig);
export const useAnalyticsChartMaxValue = () => useAnalyticsStore((state) => state.chartMaxValue);
export const useAnalyticsChartShowTrends = () => useAnalyticsStore((state) => state.chartShowTrends);
export const useAnalyticsChartShowConfidence = () => useAnalyticsStore((state) => state.chartShowConfidence);
export const useAnalyticsDemographics = () => useAnalyticsStore((state) => state.demographics);
export const useAnalyticsTrends = () => useAnalyticsStore((state) => state.trends);
export const useAnalyticsTemporal = () => useAnalyticsStore((state) => state.temporal);
export const useAnalyticsPollHeatmap = () => useAnalyticsStore((state) => state.pollHeatmap);
export const useAnalyticsTrustTiers = () => useAnalyticsStore((state) => state.trustTiers);

export const useAnalyticsActions = () =>
  useMemo(() => {
    const state = useAnalyticsStore.getState();

    return {
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
      resetChartState: state.resetChartState,
      resetAnalyticsState: state.resetAnalyticsState,
      sendAnalytics: state.sendAnalytics,
      exportAnalytics: state.exportAnalytics,
      importAnalytics: state.importAnalytics,
      generateReport: state.generateReport,
      fetchDemographics: state.fetchDemographics,
      fetchTrends: state.fetchTrends,
      fetchTemporal: state.fetchTemporal,
      fetchPollHeatmap: state.fetchPollHeatmap,
      fetchTrustTierComparison: state.fetchTrustTierComparison,
      setLoading: state.setLoading,
      setTracking: state.setTracking,
      setSending: state.setSending,
      setError: state.setError,
      clearError: state.clearError,
    };
  }, []);

export const useAnalyticsStats = () => {
  const { totalEvents, sessionId, trackingEnabled, preferences, hasPerformanceMetrics, hasUserBehavior, hasDashboard } = useAnalyticsStore(
    useShallow((state) => ({
      totalEvents: state.events.length,
      sessionId: state.sessionId,
      trackingEnabled: state.trackingEnabled,
      preferences: state.preferences,
      hasPerformanceMetrics: !!state.performanceMetrics,
      hasUserBehavior: !!state.userBehavior,
      hasDashboard: !!state.dashboard,
    })),
  );
  return useMemo(
    () => ({
      totalEvents,
      sessionId,
      trackingEnabled,
      preferences,
      hasPerformanceMetrics,
      hasUserBehavior,
      hasDashboard,
    }),
    [totalEvents, sessionId, trackingEnabled, preferences, hasPerformanceMetrics, hasUserBehavior, hasDashboard],
  );
};

export const useAnalyticsSession = () => {
  const { sessionId, events, isTracking, isSending } = useAnalyticsStore(
    useShallow((state) => ({
      sessionId: state.sessionId,
      events: state.events,
      isTracking: state.isTracking,
      isSending: state.isSending,
    })),
  );
  return useMemo(
    () => ({
      sessionId,
      events,
      isTracking,
      isSending,
    }),
    [sessionId, events, isTracking, isSending],
  );
};

export const useAnalyticsChartContext = () => {
  const { data, maxValue, showTrends, showConfidence } = useAnalyticsStore(
    useShallow((state) => ({
      data: state.chartData,
      maxValue: state.chartMaxValue,
      showTrends: state.chartShowTrends,
      showConfidence: state.chartShowConfidence,
    })),
  );
  return useMemo(
    () => ({
      data,
      maxValue,
      showTrends,
      showConfidence,
    }),
    [data, maxValue, showTrends, showConfidence],
  );
};

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

export const analyticsStoreUtils = {
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

  getEventsByType: (type: string) => {
    const state = useAnalyticsStore.getState();
    return state.events.filter((event) => event.type === type);
  },

  getEventsByCategory: (category: string) => {
    const state = useAnalyticsStore.getState();
    return state.events.filter((event) => event.category === category);
  },

  getRecentEvents: (limit = 10) => {
    const state = useAnalyticsStore.getState();
    return [...state.events]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  },

  isTrackingEnabled: () => {
    const state = useAnalyticsStore.getState();
    return state.trackingEnabled && state.preferences.trackingEnabled;
  },

  getAnalyticsConfig: () => {
    const state = useAnalyticsStore.getState();
    return {
      trackingEnabled: state.trackingEnabled,
      preferences: state.preferences,
      sessionId: state.sessionId,
    };
  },
};

export const analyticsStoreSubscriptions = {
  onEventTracked: (callback: (event: AnalyticsEvent) => void) => {
    let prevEvents: AnalyticsEvent[] = [];
    return useAnalyticsStore.subscribe((state) => {
      const { events } = state;
      if (events.length > prevEvents.length) {
        const newEvent = events[events.length - 1];
        if (newEvent) {
          callback(newEvent);
        }
      }
      prevEvents = events;
      return events;
    });
  },

  onPerformanceMetricsChange: (callback: (metrics: PerformanceMetrics) => void) => {
    let prevMetrics: PerformanceMetrics | null = null;
    return useAnalyticsStore.subscribe((state) => {
      const metrics = state.performanceMetrics;
      if (metrics !== prevMetrics && metrics !== null) {
        callback(metrics);
      }
      prevMetrics = metrics;
      return metrics;
    });
  },

  onTrackingEnabledChange: (callback: (enabled: boolean) => void) => {
    let prevEnabled: boolean | null = null;
    return useAnalyticsStore.subscribe((state) => {
      const enabled = state.trackingEnabled;
      if (enabled !== prevEnabled) {
        callback(enabled);
      }
      prevEnabled = enabled;
      return enabled;
    });
  },
};

export const analyticsStoreDebug = {
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
      error: state.error,
    });
  },

  logSummary: () => {
    const summary = analyticsStoreUtils.getAnalyticsSummary();
    logger.debug('Analytics Summary', summary);
  },

  logRecentEvents: (limit = 5) => {
    const events = analyticsStoreUtils.getRecentEvents(limit);
    logger.debug('Recent Analytics Events', { events });
  },

  reset: () => {
    const state = useAnalyticsStore.getState();
    state.resetAnalyticsState();
    logger.info('Analytics store reset');
  },
};

// ---------------------------------------------------------------------------
// Selector modules
// ---------------------------------------------------------------------------

export const analyticsSelectors = {
  events: (state: AnalyticsStore) => state.events,
  performanceMetrics: (state: AnalyticsStore) => state.performanceMetrics,
  userBehavior: (state: AnalyticsStore) => state.userBehavior,
  dashboard: (state: AnalyticsStore) => state.dashboard,
  preferences: (state: AnalyticsStore) => state.preferences,
  trackingEnabled: (state: AnalyticsStore) => state.trackingEnabled,
  sessionId: (state: AnalyticsStore) => state.sessionId,
  error: (state: AnalyticsStore) => state.error,
  isLoading: (state: AnalyticsStore) => state.isLoading,
  isTracking: (state: AnalyticsStore) => state.isTracking,
  isSending: (state: AnalyticsStore) => state.isSending,
  demographics: (state: AnalyticsStore) => state.demographics,
  trends: (state: AnalyticsStore) => state.trends,
  temporal: (state: AnalyticsStore) => state.temporal,
  pollHeatmap: (state: AnalyticsStore) => state.pollHeatmap,
  trustTiers: (state: AnalyticsStore) => state.trustTiers,
};

export const analyticsChartSelectors = {
  config: (state: AnalyticsStore) => state.chartConfig,
  data: (state: AnalyticsStore) => state.chartData,
  maxValue: (state: AnalyticsStore) => state.chartMaxValue,
  showTrends: (state: AnalyticsStore) => state.chartShowTrends,
  showConfidence: (state: AnalyticsStore) => state.chartShowConfidence,
};

export const analyticsStatusSelectors = {
  hasDashboard: (state: AnalyticsStore) => !!state.dashboard,
  hasPerformanceMetrics: (state: AnalyticsStore) => !!state.performanceMetrics,
  hasUserBehavior: (state: AnalyticsStore) => !!state.userBehavior,
  totalEvents: (state: AnalyticsStore) => state.events.length,
};
