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
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { performanceMetrics } from '@/lib/performance/performance-metrics';
import { createAutoRefreshTimer, createPerformanceMonitor } from '@/lib/performance/performanceMonitorService';
import logger from '@/lib/utils/logger';

import { createBaseStoreActions } from './baseStoreActions';
import { createSafeStorage } from './storage';

import type { BaseStore } from './types';
import type { StateCreator } from 'zustand';
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
  lastSyncedAt: Date | null;
  isSyncing: boolean;
  syncEnabled: boolean;
  syncError: string | null;
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
  syncMetrics: () => Promise<void>;
  setSyncEnabled: (enabled: boolean) => void;
};

export type PerformanceStore = PerformanceState & PerformanceActions;

const METRIC_SYNC_INTERVAL_MS = 5 * 60 * 1000;
const MIN_SYNC_BATCH = 25;
const MAX_BUFFERED_METRICS = 200;

const shouldAutoSyncMetrics = (state: PerformanceStore): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  if (!state.syncEnabled || state.isSyncing) {
    return false;
  }

  if (state.metrics.length >= MAX_BUFFERED_METRICS) {
    return true;
  }

  if (!state.lastSyncedAt) {
    return state.metrics.length >= MIN_SYNC_BATCH;
  }

  return state.metrics.length >= MIN_SYNC_BATCH &&
    Date.now() - state.lastSyncedAt.getTime() >= METRIC_SYNC_INTERVAL_MS;
};

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
  lastSyncedAt: null,
  isSyncing: false,
  syncEnabled: true,
  syncError: null,
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

          const currentState = get();
          if (shouldAutoSyncMetrics(currentState)) {
            void currentState.syncMetrics();
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

        syncMetrics: async () => {
          if (typeof window === 'undefined') {
            return;
          }

          const state = get();
          if (!state.syncEnabled || state.isSyncing || state.metrics.length === 0) {
            return;
          }

          set((draft) => {
            draft.isSyncing = true;
            draft.syncError = null;
          });

          try {
            const payload = {
              document: performanceMetrics.exportMetrics(),
              page: window.location.pathname,
              sessionId: state.reports[state.reports.length - 1]?.id,
              meta: {
                bufferedMetrics: state.metrics.length,
                cacheStats: state.cacheStats,
                lastRefresh: state.lastRefresh?.toISOString() ?? null,
              },
            };

            const response = await fetch('/api/analytics/performance-metrics', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(payload),
            });

            if (!response.ok) {
              const message = await response.text().catch(() => null);
              throw new Error(message || `Failed to sync metrics (${response.status})`);
            }

            set((draft) => {
              draft.isSyncing = false;
              draft.syncError = null;
              draft.lastSyncedAt = new Date();
            });
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('performanceStore.syncMetrics failed', err);
            set((draft) => {
              draft.isSyncing = false;
              draft.syncError = err.message;
            });
          }
        },

        setSyncEnabled: (enabled: boolean) => {
          set((state) => {
            state.syncEnabled = enabled;
          });
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

            // Use API endpoint instead of direct Supabase query to respect RLS and add timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

            const response = await fetch('/api/admin/performance', {
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: response.statusText }));
              throw new Error(errorData.error || `Failed to fetch performance metrics: ${response.statusText}`);
            }

            const data = await response.json();

            // Transform API response to expected format
            const report = data.data?.report ?? {};

            // Convert performance report to database metrics format
            // PerformanceReport has: totalOperations, averageResponseTime, errorRate, slowestOperations
            const databaseMetrics: DatabasePerformanceMetric[] = [];

            // Add overall performance metrics
            if (typeof report.averageResponseTime === 'number') {
              databaseMetrics.push({
                metricName: 'average_response_time',
                avgValue: report.averageResponseTime,
                minValue: 0,
                maxValue: report.averageResponseTime,
                countMeasurements: report.totalOperations ?? 0,
                timestamp: new Date(),
              });
            }

            // Add slowest operations as individual metrics
            if (Array.isArray(report.slowestOperations)) {
              for (const op of report.slowestOperations.slice(0, 10)) {
                if (op && typeof op === 'object' && 'operation' in op && 'duration' in op) {
                  const opObj = op as { operation: string; duration: number };
                  databaseMetrics.push({
                    metricName: opObj.operation ?? 'unknown',
                    avgValue: opObj.duration ?? 0,
                    minValue: 0,
                    maxValue: opObj.duration ?? 0,
                    countMeasurements: 1,
                    timestamp: new Date(),
                  });
                }
              }
            }

            // Cache stats from report (with fallbacks)
            // If no data, check if this is a fresh system or if monitoring hasn't started
            const hasNoData = databaseMetrics.length === 0 && report.totalOperations === 0;
            const cacheStats: CacheStats = {
              size: 0, // Not available from performance monitor
              keys: [],
              memoryUsage: 0, // Not available from performance monitor
              hitRate: hasNoData ? 0 : 0, // Not available from performance monitor
            };

            // Log if no data is available (helpful for debugging)
            if (hasNoData) {
              logger.info('Performance dashboard: No performance data tracked yet. Operations will appear as they are tracked.');
            }

            setDatabaseMetrics(databaseMetrics);
            setCacheStats(cacheStats);
            setLastRefresh(new Date());
            scheduleAutoRefreshTimer();
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Failed to load database performance';
            // Handle abort/timeout errors specifically
            if (error instanceof Error && error.name === 'AbortError') {
              setError('Request timed out. Please try again.');
            } else {
              setError(errorMessage);
            }
            logger.error('Failed to load performance data', error);
          } finally {
            setLoading(false);
          }
        },

        refreshMaterializedViews: async () => {
          const { setLoading, setError, loadDatabasePerformance } = get();

          try {
            setLoading(true);
            setError(null);

            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

            const response = await fetch('/api/admin/refresh-materialized-views', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: response.statusText }));
              throw new Error(errorData.error || `Failed to refresh materialized views: ${response.statusText}`);
            }

            // Reload performance data after refresh
            await loadDatabasePerformance();
            scheduleAutoRefreshTimer();
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Failed to refresh materialized views';
            // Handle timeout specifically
            if (error instanceof Error && error.name === 'AbortError') {
              setError('Request timed out. The operation may still be processing.');
            } else {
              setError(errorMessage);
            }
            logger.error('Failed to refresh materialized views', error);
          } finally {
            setLoading(false);
          }
        },

        performDatabaseMaintenance: async () => {
          const { setLoading, setError, loadDatabasePerformance } = get();

          try {
            setLoading(true);
            setError(null);

            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout (maintenance can take longer)

            const response = await fetch('/api/admin/perform-database-maintenance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: response.statusText }));
              throw new Error(errorData.error || `Failed to perform database maintenance: ${response.statusText}`);
            }

            // Reload performance data after maintenance
            await loadDatabasePerformance();
            scheduleAutoRefreshTimer();
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Failed to perform database maintenance';
            // Handle timeout specifically
            if (error instanceof Error && error.name === 'AbortError') {
              setError('Request timed out. The operation may still be processing.');
            } else {
              setError(errorMessage);
            }
            logger.error('Failed to perform database maintenance', error);
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
  const syncMetrics = usePerformanceStore((state) => state.syncMetrics);
  const setSyncEnabled = usePerformanceStore((state) => state.setSyncEnabled);

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
      syncMetrics,
      setSyncEnabled,
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
      syncMetrics,
      setSyncEnabled,
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
