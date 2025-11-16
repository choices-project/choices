/**
 * Performance Store
 *
 * Centralized Zustand store for performance monitoring, metrics collection,
 * and performance alert management.
 *
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

import { useMemo } from 'react';
import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { createAutoRefreshTimer, createPerformanceMonitor } from '@/lib/performance/performanceMonitorService';

import { createBaseStoreActions } from './baseStoreActions';
import { createSafeStorage } from './storage';
import type { BaseStore } from './types';
// ============================================================================
// TYPES
// ============================================================================
export type PerformanceMetric = {
  id: string;
  type: 'navigation' | 'resource' | 'measure' | 'custom' | 'database';
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'score' | 'percentage';
  timestamp: Date;
  url: string;
  metadata?: Record<string, unknown>;
}

export type DatabasePerformanceMetric = {
  metricName: string;
  avgValue: number;
  minValue: number;
  maxValue: number;
  countMeasurements: number;
  timestamp: Date;
}

export type CacheStats = {
  size: number;
  keys: string[];
  memoryUsage: number;
  hitRate: number;
}

export type PerformanceAlert = {
  id: string;
  type: 'threshold' | 'anomaly' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: Date;
  resolved: boolean;
  metadata?: Record<string, unknown>;
}

export type PerformanceThresholds = {
  navigation: {
    fcp: number; // First Contentful Paint
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
    ttfb: number; // Time to First Byte
  };
  resource: {
    loadTime: number;
    size: number;
    count: number;
  };
  custom: {
    [key: string]: number;
  };
}

export type PerformanceReport = {
  id: string;
  timestamp: Date;
  url: string;
  metrics: PerformanceMetric[];
  alerts: PerformanceAlert[];
  summary: {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    recommendations: string[];
  };
  generated_at: Date;
}

export type PerformanceState = {
  metrics: PerformanceMetric[];
  alerts: PerformanceAlert[];
  reports: PerformanceReport[];
  thresholds: PerformanceThresholds;
  isMonitoring: boolean;
  isLoading: boolean;
  error: string | null;
  databaseMetrics: DatabasePerformanceMetric[];
  cacheStats: CacheStats | null;
  lastRefresh: Date | null;
  autoRefresh: boolean;
  refreshInterval: number;
};

export type PerformanceActions = Pick<BaseStore, 'setLoading' | 'setError' | 'clearError'> & {
  recordMetric: (metric: Omit<PerformanceMetric, 'id' | 'timestamp'>) => void;
  recordNavigationMetric: (name: string, value: number, metadata?: Record<string, unknown>) => void;
  recordResourceMetric: (name: string, value: number, metadata?: Record<string, unknown>) => void;
  recordCustomMetric: (name: string, value: number, unit?: 'ms' | 'bytes' | 'count' | 'score', metadata?: Record<string, unknown>) => void;
  clearMetrics: () => void;
  createAlert: (alert: Omit<PerformanceAlert, 'id' | 'timestamp' | 'resolved'>) => void;
  resolveAlert: (id: string) => void;
  clearAlerts: () => void;
  clearResolvedAlerts: () => void;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  setThreshold: (type: 'navigation' | 'resource' | 'custom', metric: string, threshold: number) => void;
  checkThresholds: () => void;
  generateReport: () => PerformanceReport;
  exportMetrics: (format?: 'json' | 'csv') => string;
  exportReport: (reportId: string, format?: 'json' | 'csv') => string;
  setDatabaseMetrics: (metrics: DatabasePerformanceMetric[]) => void;
  setCacheStats: (stats: CacheStats) => void;
  setLastRefresh: (date: Date) => void;
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (interval: number) => void;
  loadDatabasePerformance: () => Promise<void>;
  refreshMaterializedViews: () => Promise<void>;
  performDatabaseMaintenance: () => Promise<void>;
  initialize: () => void;
  resetPerformanceState: () => void;
};

export type PerformanceStore = PerformanceState & PerformanceActions;

const defaultPerformanceThresholds: PerformanceThresholds = {
  navigation: {
    fcp: 1800,
    lcp: 2500,
    fid: 100,
    cls: 0.1,
    ttfb: 600,
  },
  resource: {
    loadTime: 2000,
    size: 1024 * 1024,
    count: 50,
  },
  custom: {},
};

const createDefaultPerformanceThresholds = (): PerformanceThresholds => ({
  navigation: { ...defaultPerformanceThresholds.navigation },
  resource: { ...defaultPerformanceThresholds.resource },
  custom: { ...defaultPerformanceThresholds.custom },
});

export const createInitialPerformanceState = (): PerformanceState => ({
  metrics: [],
  alerts: [],
  reports: [],
  thresholds: createDefaultPerformanceThresholds(),
  isMonitoring: false,
  isLoading: false,
  error: null,
  databaseMetrics: [],
  cacheStats: null,
  lastRefresh: null,
  autoRefresh: true,
  refreshInterval: 30000,
});

export const initialPerformanceState: PerformanceState = createInitialPerformanceState();

let stopPerformanceMonitor: (() => void) | null = null;
let stopAutoRefreshTimer: (() => void) | null = null;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const calculatePerformanceScore = (metrics: PerformanceMetric[]): { score: number; grade: 'A' | 'B' | 'C' | 'D' | 'F' } => {
  const navigationMetrics = metrics.filter(m => m.type === 'navigation');
  const fcp = navigationMetrics.find(m => m.name === 'FCP')?.value ?? 0;
  const lcp = navigationMetrics.find(m => m.name === 'LCP')?.value ?? 0;
  const fid = navigationMetrics.find(m => m.name === 'FID')?.value ?? 0;
  const cls = navigationMetrics.find(m => m.name === 'CLS')?.value ?? 0;
  const ttfb = navigationMetrics.find(m => m.name === 'TTFB')?.value ?? 0;

  // Calculate score based on Core Web Vitals
  let score = 100;

  // FCP scoring (0-3000ms)
  if (fcp > 3000) score -= 20;
  else if (fcp > 1800) score -= 10;

  // LCP scoring (0-4000ms)
  if (lcp > 4000) score -= 25;
  else if (lcp > 2500) score -= 15;

  // FID scoring (0-300ms)
  if (fid > 300) score -= 20;
  else if (fid > 100) score -= 10;

  // CLS scoring (0-0.25)
  if (cls > 0.25) score -= 20;
  else if (cls > 0.1) score -= 10;

  // TTFB scoring (0-800ms)
  if (ttfb > 800) score -= 15;
  else if (ttfb > 600) score -= 5;

  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';

  return { score: Math.max(0, score), grade };
};

const generateRecommendations = (metrics: PerformanceMetric[]): string[] => {
  const recommendations: string[] = [];
  const navigationMetrics = metrics.filter(m => m.type === 'navigation');

  const fcp = navigationMetrics.find(m => m.name === 'FCP')?.value ?? 0;
  const lcp = navigationMetrics.find(m => m.name === 'LCP')?.value ?? 0;
  const fid = navigationMetrics.find(m => m.name === 'FID')?.value ?? 0;
  const cls = navigationMetrics.find(m => m.name === 'CLS')?.value ?? 0;
  const ttfb = navigationMetrics.find(m => m.name === 'TTFB')?.value ?? 0;

  if (fcp > 1800) recommendations.push('Optimize First Contentful Paint by reducing render-blocking resources');
  if (lcp > 2500) recommendations.push('Improve Largest Contentful Paint by optimizing images and fonts');
  if (fid > 100) recommendations.push('Reduce First Input Delay by minimizing JavaScript execution time');
  if (cls > 0.1) recommendations.push('Minimize Cumulative Layout Shift by setting image dimensions');
  if (ttfb > 600) recommendations.push('Improve Time to First Byte by optimizing server response time');

  return recommendations;
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

type PerformanceStoreCreator = StateCreator<
  PerformanceStore,
  [['zustand/devtools', never], ['zustand/persist', unknown], ['zustand/immer', never]]
>;

export const performanceStoreCreator: PerformanceStoreCreator = (set, get) => {
  const immerSet = set as unknown as (recipe: (draft: PerformanceStore) => void) => void;
  const baseActions = createBaseStoreActions<PerformanceStore>(immerSet);

  const scheduleAutoRefreshTimer = () => {
    if (typeof window === 'undefined') {
      return;
    }

    stopAutoRefreshTimer?.();
    stopAutoRefreshTimer = null;

    const state = get();
    if (!state.autoRefresh) {
      return;
    }

    stopAutoRefreshTimer = createAutoRefreshTimer(() => {
      return get().loadDatabasePerformance();
    }, state.refreshInterval);
  };

  const initialState = createInitialPerformanceState();

  return Object.assign({}, initialState, baseActions, {

        // Actions - Metrics
        recordMetric: (metric: Omit<PerformanceMetric, 'id' | 'timestamp'>) => {
          const id = `metric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const sanitizedMetric = Object.fromEntries(
            Object.entries(metric).filter(([, v]) => v !== undefined)
          ) as typeof metric;
          const newMetric = Object.assign({}, sanitizedMetric, {
            id,
            timestamp: new Date(),
          }) as PerformanceMetric;

          set((state) => {
            state.metrics.push(newMetric);

            // Keep only last 1000 metrics to prevent memory issues
            if (state.metrics.length > 1000) {
              state.metrics = state.metrics.slice(-1000);
            }
          });

          // Check thresholds (debounced to prevent excessive calls)
          const { checkThresholds } = get();
          if (checkThresholds) {
            checkThresholds();
          }
        },

        recordNavigationMetric: (
          name: string,
          value: number,
          metadata?: Record<string, unknown>,
        ) => {
          const payload = {
              type: 'navigation',
              name,
              value,
              unit: 'ms',
              url: typeof window !== 'undefined' ? window.location.href : '',
              ...(metadata ? { metadata } : {}),
            } as Omit<PerformanceMetric, 'id' | 'timestamp'>;

          get().recordMetric(payload);
        },

        recordResourceMetric: (
          name: string,
          value: number,
          metadata?: Record<string, unknown>,
        ) => {
          const payload = {
              type: 'resource',
              name,
              value,
              unit: 'ms',
              url: typeof window !== 'undefined' ? window.location.href : '',
              ...(metadata ? { metadata } : {}),
            } as Omit<PerformanceMetric, 'id' | 'timestamp'>;

          get().recordMetric(payload);
        },

        recordCustomMetric: (
          name: string,
          value: number,
          unit: PerformanceMetric['unit'] = 'ms',
          metadata?: Record<string, unknown>,
        ) => {
          const payload = {
              type: 'custom',
              name,
              value,
              unit,
              url: typeof window !== 'undefined' ? window.location.href : '',
              ...(metadata ? { metadata } : {}),
            } as Omit<PerformanceMetric, 'id' | 'timestamp'>;

          get().recordMetric(payload);
        },

        clearMetrics: () => {
          set((state) => {
            state.metrics = [];
          });
        },

        // Actions - Alerts
        createAlert: (alert: Omit<PerformanceAlert, 'id' | 'timestamp' | 'resolved'>) => {
          const id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const sanitizedAlert = Object.fromEntries(
            Object.entries(alert).filter(([, v]) => v !== undefined)
          ) as typeof alert;
          const newAlert = Object.assign({}, sanitizedAlert, {
            id,
            timestamp: new Date(),
            resolved: false,
          }) as PerformanceAlert;

          set((state) => {
            state.alerts.push(newAlert);

            // Keep only last 500 alerts
            if (state.alerts.length > 500) {
              state.alerts = state.alerts.slice(-500);
            }
          });
        },

        resolveAlert: (id: string) => {
          set((state) => {
      const alert = state.alerts.find((a) => a.id === id);
            if (alert) {
              alert.resolved = true;
            }
          });
        },

        clearAlerts: () => {
          set((state) => {
            state.alerts = [];
          });
        },

        clearResolvedAlerts: () => {
          set((state) => {
      state.alerts = state.alerts.filter((alert) => !alert.resolved);
          });
        },

        // Actions - Monitoring
        startMonitoring: () => {
          set((state) => {
            state.isMonitoring = true;
          });

          stopPerformanceMonitor?.();
          stopPerformanceMonitor = createPerformanceMonitor({
            recordNavigationMetric: (name, value, metadata) => {
              get().recordNavigationMetric(name, value, metadata);
            },
            recordResourceMetric: (name, value, metadata) => {
              get().recordResourceMetric(name, value, metadata);
            },
          });
        },

        stopMonitoring: () => {
          set((state) => {
            state.isMonitoring = false;
          });

          stopPerformanceMonitor?.();
          stopPerformanceMonitor = null;
        },

        setThreshold: (type: 'navigation' | 'resource' | 'custom', metric: string, threshold: number) => {
          set((state) => {
            if (type === 'navigation' && metric in state.thresholds.navigation) {
              (state.thresholds.navigation as Record<string, number>)[metric] = threshold;
            } else if (type === 'resource' && metric in state.thresholds.resource) {
              (state.thresholds.resource as Record<string, number>)[metric] = threshold;
            } else if (type === 'custom') {
              state.thresholds.custom[metric] = threshold;
            }
          });
        },

        checkThresholds: () => {
          const { metrics, thresholds } = get();
    const recentMetrics = metrics.slice(-100);

          recentMetrics.forEach((metric) => {
            let threshold = 0;

            if (metric.type === 'navigation' && metric.name in thresholds.navigation) {
              threshold = (thresholds.navigation as Record<string, number>)[metric.name] ?? 0;
            } else if (metric.type === 'resource' && metric.name in thresholds.resource) {
              threshold = (thresholds.resource as Record<string, number>)[metric.name] ?? 0;
            } else if (metric.type === 'custom' && metric.name in thresholds.custom) {
              threshold = thresholds.custom[metric.name] ?? 0;
            }

            if (threshold > 0 && metric.value > threshold) {
        const severity =
          metric.value > threshold * 2 ? 'high' : metric.value > threshold * 1.5 ? 'medium' : 'low';

              get().createAlert({
                type: 'threshold',
                severity,
                metric: metric.name,
                value: metric.value,
                threshold,
          message: `${metric.name} exceeded threshold: ${metric.value}${metric.unit} > ${threshold}${metric.unit}`,
              });
            }
          });
        },

        // Actions - Reports
        generateReport: () => {
          const { metrics, alerts } = get();
          const id = `report-${Date.now()}`;
          const { score, grade } = calculatePerformanceScore(metrics);
          const recommendations = generateRecommendations(metrics);

          const report: PerformanceReport = {
            id,
            timestamp: new Date(),
            url: typeof window !== 'undefined' ? window.location.href : '',
            metrics: [...metrics],
      alerts: alerts.filter((alert) => !alert.resolved),
            summary: {
              score,
              grade,
        recommendations,
            },
      generated_at: new Date(),
          };

          set((state) => {
            state.reports.push(report);

            if (state.reports.length > 50) {
              state.reports = state.reports.slice(-50);
            }
          });

          return report;
        },

        exportMetrics: (format: 'json' | 'csv' = 'json') => {
          const { metrics } = get();

          if (format === 'csv') {
            const headers = ['id', 'type', 'name', 'value', 'unit', 'timestamp', 'url'];
      const rows = metrics.map((metric) => [
              metric.id,
              metric.type,
              metric.name,
              metric.value,
              metric.unit,
              metric.timestamp.toISOString(),
        metric.url,
            ]);

      return [headers, ...rows].map((row) => row.join(',')).join('\n');
          }

          return JSON.stringify(metrics, null, 2);
        },

        exportReport: (reportId: string, format: 'json' | 'csv' = 'json') => {
          const { reports } = get();
    const report = reports.find((r) => r.id === reportId);

          if (!report) {
            throw new Error(`Report ${reportId} not found`);
          }

          if (format === 'csv') {
            const headers = ['metric', 'value', 'unit', 'timestamp'];
      const rows = report.metrics.map((metric) => [
              metric.name,
              metric.value,
              metric.unit,
        metric.timestamp.toISOString(),
            ]);

      return [headers, ...rows].map((row) => row.join(',')).join('\n');
          }

          return JSON.stringify(report, null, 2);
        },

        // Actions - Database Performance
        setDatabaseMetrics: (metrics: DatabasePerformanceMetric[]) => {
          set((state) => {
            state.databaseMetrics = metrics;
          });
        },

        setCacheStats: (stats: CacheStats) => {
          set((state) => {
            state.cacheStats = stats;
          });
        },

        setLastRefresh: (date: Date) => {
          set((state) => {
            state.lastRefresh = date;
          });
        },

        setAutoRefresh: (enabled: boolean) => {
          set((state) => {
            state.autoRefresh = enabled;
          });

          if (enabled) {
            scheduleAutoRefreshTimer();
          } else {
            stopAutoRefreshTimer?.();
            stopAutoRefreshTimer = null;
          }
        },

        setRefreshInterval: (interval: number) => {
          set((state) => {
            state.refreshInterval = interval;
          });

          if (get().autoRefresh) {
            scheduleAutoRefreshTimer();
          }
        },

        loadDatabasePerformance: async () => {
          const { setLoading, setError, setLastRefresh, setDatabaseMetrics, setCacheStats } = get();

          try {
            setLoading(true);
            setError(null);

      const supabase = await import('@/utils/supabase/client').then((m) => m.getSupabaseBrowserClient());
            if (!supabase) {
              throw new Error('Database connection not available');
            }

            const { data: metricsData, error: metricsError } = await supabase
              .from('analytics_events')
              .select('*')
              .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
              .order('created_at', { ascending: false });

            if (metricsError) {
              throw new Error(`Failed to fetch database metrics: ${metricsError.message}`);
            }

      const databaseMetrics: DatabasePerformanceMetric[] =
        metricsData?.map((metric) => ({
              metricName: metric.event_type ?? 'unknown',
          avgValue: 0,
              minValue: 0,
              maxValue: 0,
              countMeasurements: 1,
          timestamp: new Date(metric.created_at ?? new Date()),
            })) ?? [];

            const { error: cacheError } = await supabase
              .from('analytics_events')
              .select('*')
              .eq('event_type', 'vote')
              .order('created_at', { ascending: false })
              .limit(1);

            if (cacheError && cacheError.code !== 'PGRST116') {
              throw new Error(`Failed to fetch cache stats: ${cacheError.message}`);
            }

            const cacheStats: CacheStats = {
              size: 0,
              keys: [],
              memoryUsage: 0,
        hitRate: 0,
            };

            setDatabaseMetrics(databaseMetrics);
            setCacheStats(cacheStats);
            setLastRefresh(new Date());
            scheduleAutoRefreshTimer();
          } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load database performance';
            setError(errorMessage);
          } finally {
            setLoading(false);
          }
        },

        refreshMaterializedViews: async () => {
          const { setLoading, setError, loadDatabasePerformance } = get();

          try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/admin/refresh-materialized-views', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
              throw new Error(`Failed to refresh materialized views: ${response.statusText}`);
            }

            await loadDatabasePerformance();
            scheduleAutoRefreshTimer();
          } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to refresh materialized views';
            setError(errorMessage);
          } finally {
            setLoading(false);
          }
        },

        performDatabaseMaintenance: async () => {
          const { setLoading, setError, loadDatabasePerformance } = get();

          try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/admin/perform-database-maintenance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
              throw new Error(`Failed to perform database maintenance: ${response.statusText}`);
            }

            await loadDatabasePerformance();
            scheduleAutoRefreshTimer();
          } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to perform database maintenance';
            setError(errorMessage);
          } finally {
            setLoading(false);
          }
        },

        // Actions - Loading & Error
        // Initialization
        initialize: () => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            if (typeof window !== 'undefined') {
              get().startMonitoring();
              scheduleAutoRefreshTimer();
            }

            set((state) => {
              state.isLoading = false;
            });
          } catch (error) {
            set((state) => {
        state.error =
          error instanceof Error ? error.message : 'Failed to initialize performance monitoring';
              state.isLoading = false;
            });
          }
        },

        resetPerformanceState: () => {
          stopPerformanceMonitor?.();
          stopPerformanceMonitor = null;
          stopAutoRefreshTimer?.();
          stopAutoRefreshTimer = null;
          set((state) => {
            Object.assign(state, createInitialPerformanceState());
          });
        },
  });
};

export const usePerformanceStore = create<PerformanceStore>()(
  devtools(
    persist(
      immer(performanceStoreCreator),
      {
        name: 'performance-storage',
        storage: createSafeStorage(),
        partialize: (state) => ({
          thresholds: state.thresholds,
          isMonitoring: state.isMonitoring,
        }),
      },
    ),
    { name: 'performance-store' },
  ),
);

// ============================================================================
// SELECTORS
// ============================================================================

export const usePerformance = () => usePerformanceStore();

// Metrics Selectors
export const usePerformanceMetrics = () => usePerformanceStore(state => state.metrics);
export const useNavigationMetrics = () => usePerformanceStore(state =>
  state.metrics.filter(m => m.type === 'navigation')
);
export const useResourceMetrics = () => usePerformanceStore(state =>
  state.metrics.filter(m => m.type === 'resource')
);
export const useCustomMetrics = () => usePerformanceStore(state =>
  state.metrics.filter(m => m.type === 'custom')
);

// Alerts Selectors
export const usePerformanceAlerts = () => usePerformanceStore(state => state.alerts);
export const useActiveAlerts = () => usePerformanceStore(state =>
  state.alerts.filter(a => !a.resolved)
);
export const useAlertsBySeverity = (severity: 'low' | 'medium' | 'high' | 'critical') =>
  usePerformanceStore(state =>
    state.alerts.filter(a => a.severity === severity && !a.resolved)
  );

// Reports Selectors
export const usePerformanceReports = () => usePerformanceStore(state => state.reports);
export const useLatestReport = () => usePerformanceStore(state =>
  state.reports[state.reports.length - 1]
);

// Thresholds Selectors
export const usePerformanceThresholds = () => usePerformanceStore(state => state.thresholds);
export const useNavigationThresholds = () => usePerformanceStore(state => state.thresholds.navigation);
export const useResourceThresholds = () => usePerformanceStore(state => state.thresholds.resource);
export const useCustomThresholds = () => usePerformanceStore(state => state.thresholds.custom);

// Monitoring Selectors
export const useIsMonitoring = () => usePerformanceStore(state => state.isMonitoring);
export const usePerformanceLoading = () => usePerformanceStore(state => state.isLoading);
export const usePerformanceError = () => usePerformanceStore(state => state.error);

// Database Performance Selectors
export const useDatabaseMetrics = () => usePerformanceStore(state => state.databaseMetrics);
export const useCacheStats = () => usePerformanceStore(state => state.cacheStats);
export const useLastRefresh = () => usePerformanceStore(state => state.lastRefresh);
export const useAutoRefresh = () => usePerformanceStore(state => state.autoRefresh);
export const useRefreshInterval = () => usePerformanceStore(state => state.refreshInterval);

// ============================================================================
// ACTIONS
// ============================================================================

export const usePerformanceActions = () => {
  const recordMetric = usePerformanceStore((state) => state.recordMetric);
  const recordNavigationMetric = usePerformanceStore((state) => state.recordNavigationMetric);
  const recordResourceMetric = usePerformanceStore((state) => state.recordResourceMetric);
  const recordCustomMetric = usePerformanceStore((state) => state.recordCustomMetric);
  const clearMetrics = usePerformanceStore((state) => state.clearMetrics);
  const createAlert = usePerformanceStore((state) => state.createAlert);
  const resolveAlert = usePerformanceStore((state) => state.resolveAlert);
  const clearAlerts = usePerformanceStore((state) => state.clearAlerts);
  const clearResolvedAlerts = usePerformanceStore((state) => state.clearResolvedAlerts);
  const startMonitoring = usePerformanceStore((state) => state.startMonitoring);
  const stopMonitoring = usePerformanceStore((state) => state.stopMonitoring);
  const setThreshold = usePerformanceStore((state) => state.setThreshold);
  const checkThresholds = usePerformanceStore((state) => state.checkThresholds);
  const generateReport = usePerformanceStore((state) => state.generateReport);
  const exportMetrics = usePerformanceStore((state) => state.exportMetrics);
  const exportReport = usePerformanceStore((state) => state.exportReport);
  const setLoading = usePerformanceStore((state) => state.setLoading);
  const setError = usePerformanceStore((state) => state.setError);
  const clearError = usePerformanceStore((state) => state.clearError);
  const initialize = usePerformanceStore((state) => state.initialize);
  const setDatabaseMetrics = usePerformanceStore((state) => state.setDatabaseMetrics);
  const setCacheStats = usePerformanceStore((state) => state.setCacheStats);
  const setLastRefresh = usePerformanceStore((state) => state.setLastRefresh);
  const setAutoRefresh = usePerformanceStore((state) => state.setAutoRefresh);
  const setRefreshInterval = usePerformanceStore((state) => state.setRefreshInterval);
  const loadDatabasePerformance = usePerformanceStore((state) => state.loadDatabasePerformance);
  const refreshMaterializedViews = usePerformanceStore((state) => state.refreshMaterializedViews);
  const performDatabaseMaintenance = usePerformanceStore((state) => state.performDatabaseMaintenance);
  const resetPerformanceState = usePerformanceStore((state) => state.resetPerformanceState);

  return useMemo(
    () => ({
      recordMetric,
      recordNavigationMetric,
      recordResourceMetric,
      recordCustomMetric,
      clearMetrics,
      createAlert,
      resolveAlert,
      clearAlerts,
      clearResolvedAlerts,
      startMonitoring,
      stopMonitoring,
      setThreshold,
      checkThresholds,
      generateReport,
      exportMetrics,
      exportReport,
      setLoading,
      setError,
      clearError,
      initialize,
      setDatabaseMetrics,
      setCacheStats,
      setLastRefresh,
      setAutoRefresh,
      setRefreshInterval,
      loadDatabasePerformance,
      refreshMaterializedViews,
      performDatabaseMaintenance,
      resetPerformanceState,
    }),
    [
      recordMetric,
      recordNavigationMetric,
      recordResourceMetric,
      recordCustomMetric,
      clearMetrics,
      createAlert,
      resolveAlert,
      clearAlerts,
      clearResolvedAlerts,
      startMonitoring,
      stopMonitoring,
      setThreshold,
      checkThresholds,
      generateReport,
      exportMetrics,
      exportReport,
      setLoading,
      setError,
      clearError,
      initialize,
      setDatabaseMetrics,
      setCacheStats,
      setLastRefresh,
      setAutoRefresh,
      setRefreshInterval,
      loadDatabasePerformance,
      refreshMaterializedViews,
      performDatabaseMaintenance,
    resetPerformanceState,
    ],
  );
};

// ============================================================================
// UTILITIES
// ============================================================================

export const usePerformanceScore = () => {
  const metrics = useNavigationMetrics();
  return calculatePerformanceScore(metrics);
};

export const usePerformanceRecommendations = () => {
  const metrics = usePerformanceMetrics();
  return generateRecommendations(metrics);
};
