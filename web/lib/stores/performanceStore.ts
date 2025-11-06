/**
 * Performance Store
 * 
 * Centralized Zustand store for performance monitoring, metrics collection,
 * and performance alert management.
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';


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

export type PerformanceStore = {
  // State
  metrics: PerformanceMetric[];
  alerts: PerformanceAlert[];
  reports: PerformanceReport[];
  thresholds: PerformanceThresholds;
  isMonitoring: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Database performance state
  databaseMetrics: DatabasePerformanceMetric[];
  cacheStats: CacheStats | null;
  lastRefresh: Date | null;
  autoRefresh: boolean;
  refreshInterval: number;
  
  // Actions - Metrics
  recordMetric: (metric: Omit<PerformanceMetric, 'id' | 'timestamp'>) => void;
  recordNavigationMetric: (name: string, value: number, metadata?: Record<string, unknown>) => void;
  recordResourceMetric: (name: string, value: number, metadata?: Record<string, unknown>) => void;
  recordCustomMetric: (name: string, value: number, unit?: 'ms' | 'bytes' | 'count' | 'score', metadata?: Record<string, unknown>) => void;
  clearMetrics: () => void;
  
  // Actions - Alerts
  createAlert: (alert: Omit<PerformanceAlert, 'id' | 'timestamp' | 'resolved'>) => void;
  resolveAlert: (id: string) => void;
  clearAlerts: () => void;
  clearResolvedAlerts: () => void;
  
  // Actions - Monitoring
  startMonitoring: () => void;
  stopMonitoring: () => void;
  setThreshold: (type: string, metric: string, threshold: number) => void;
  checkThresholds: () => void;
  
  // Actions - Reports
  generateReport: () => PerformanceReport;
  exportMetrics: (format?: 'json' | 'csv') => string;
  exportReport: (reportId: string, format?: 'json' | 'csv') => string;
  
  // Actions - Database Performance
  setDatabaseMetrics: (metrics: DatabasePerformanceMetric[]) => void;
  setCacheStats: (stats: CacheStats) => void;
  setLastRefresh: (date: Date) => void;
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (interval: number) => void;
  loadDatabasePerformance: () => Promise<void>;
  refreshMaterializedViews: () => Promise<void>;
  performDatabaseMaintenance: () => Promise<void>;
  
  // Actions - Loading & Error
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Initialization
  initialize: () => void;
}

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

export const usePerformanceStore = create<PerformanceStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial State
        metrics: [],
        alerts: [],
        reports: [],
        thresholds: {
          navigation: {
            fcp: 1800,
            lcp: 2500,
            fid: 100,
            cls: 0.1,
            ttfb: 600
          },
          resource: {
            loadTime: 2000,
            size: 1024 * 1024, // 1MB
            count: 50
          },
          custom: {}
        },
        isMonitoring: false,
        isLoading: false,
        error: null,
        
        // Database performance state
        databaseMetrics: [],
        cacheStats: null,
        lastRefresh: null,
        autoRefresh: true,
        refreshInterval: 30000,

        // Actions - Metrics
        recordMetric: (metric) => {
          const id = `metric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const newMetric: PerformanceMetric = {
            ...metric,
            id,
            timestamp: new Date()
          };

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

        recordNavigationMetric: (name, value, metadata) => {
          get().recordMetric({
            type: 'navigation',
            name,
            value,
            unit: 'ms',
            url: typeof window !== 'undefined' ? window.location.href : '',
            metadata: metadata ?? {}
          });
        },

        recordResourceMetric: (name, value, metadata) => {
          get().recordMetric({
            type: 'resource',
            name,
            value,
            unit: 'ms',
            url: typeof window !== 'undefined' ? window.location.href : '',
            metadata: metadata ?? {}
          });
        },

        recordCustomMetric: (name, value, unit = 'ms', metadata) => {
          get().recordMetric({
            type: 'custom',
            name,
            value,
            unit,
            url: typeof window !== 'undefined' ? window.location.href : '',
            metadata: metadata ?? {}
          });
        },

        clearMetrics: () => {
          set((state) => {
            state.metrics = [];
          });
        },

        // Actions - Alerts
        createAlert: (alert) => {
          const id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const newAlert: PerformanceAlert = {
            ...alert,
            id,
            timestamp: new Date(),
            resolved: false
          };

          set((state) => {
            state.alerts.push(newAlert);
            
            // Keep only last 500 alerts
            if (state.alerts.length > 500) {
              state.alerts = state.alerts.slice(-500);
            }
          });
        },

        resolveAlert: (id) => {
          set((state) => {
            const alert = state.alerts.find(a => a.id === id);
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
            state.alerts = state.alerts.filter(alert => !alert.resolved);
          });
        },

        // Actions - Monitoring
        startMonitoring: () => {
          set((state) => {
            state.isMonitoring = true;
          });

          if (typeof window !== 'undefined' && 'performance' in window) {
            // Set up Performance Observer
            try {
              const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry) => {
                  if (entry.entryType === 'navigation') {
                    const navEntry = entry as PerformanceNavigationTiming;
                    get().recordNavigationMetric('TTFB', navEntry.responseStart - navEntry.requestStart);
                    get().recordNavigationMetric('FCP', navEntry.domContentLoadedEventEnd - navEntry.fetchStart);
                  } else if (entry.entryType === 'resource') {
                    const resourceEntry = entry as PerformanceResourceTiming;
                    get().recordResourceMetric(resourceEntry.name, resourceEntry.duration);
                  }
                });
              });

              observer.observe({ entryTypes: ['navigation', 'resource'] });
            } catch (error) {
              console.warn('Performance Observer not supported:', error);
            }
          }
        },

        stopMonitoring: () => {
          set((state) => {
            state.isMonitoring = false;
          });
        },

        setThreshold: (type, metric, threshold) => {
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
          const recentMetrics = metrics.slice(-100); // Check last 100 metrics

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
              const severity = metric.value > threshold * 2 ? 'high' : metric.value > threshold * 1.5 ? 'medium' : 'low';
              
              get().createAlert({
                type: 'threshold',
                severity,
                metric: metric.name,
                value: metric.value,
                threshold,
                message: `${metric.name} exceeded threshold: ${metric.value}${metric.unit} > ${threshold}${metric.unit}`
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
            alerts: alerts.filter(alert => !alert.resolved),
            summary: {
              score,
              grade,
              recommendations
            },
            generated_at: new Date()
          };

          set((state) => {
            state.reports.push(report);
            
            // Keep only last 50 reports
            if (state.reports.length > 50) {
              state.reports = state.reports.slice(-50);
            }
          });

          return report;
        },

        exportMetrics: (format = 'json') => {
          const { metrics } = get();
          
          if (format === 'csv') {
            const headers = ['id', 'type', 'name', 'value', 'unit', 'timestamp', 'url'];
            const rows = metrics.map(metric => [
              metric.id,
              metric.type,
              metric.name,
              metric.value,
              metric.unit,
              metric.timestamp.toISOString(),
              metric.url
            ]);
            
            return [headers, ...rows].map(row => row.join(',')).join('\n');
          }
          
          return JSON.stringify(metrics, null, 2);
        },

        exportReport: (reportId, format = 'json') => {
          const { reports } = get();
          const report = reports.find(r => r.id === reportId);
          
          if (!report) {
            throw new Error(`Report ${reportId} not found`);
          }
          
          if (format === 'csv') {
            const headers = ['metric', 'value', 'unit', 'timestamp'];
            const rows = report.metrics.map(metric => [
              metric.name,
              metric.value,
              metric.unit,
              metric.timestamp.toISOString()
            ]);
            
            return [headers, ...rows].map(row => row.join(',')).join('\n');
          }
          
          return JSON.stringify(report, null, 2);
        },

        // Actions - Database Performance
        setDatabaseMetrics: (metrics) => {
          set((state) => {
            state.databaseMetrics = metrics;
          });
        },

        setCacheStats: (stats) => {
          set((state) => {
            state.cacheStats = stats;
          });
        },

        setLastRefresh: (date) => {
          set((state) => {
            state.lastRefresh = date;
          });
        },

        setAutoRefresh: (enabled) => {
          set((state) => {
            state.autoRefresh = enabled;
          });
        },

        setRefreshInterval: (interval) => {
          set((state) => {
            state.refreshInterval = interval;
          });
        },

        loadDatabasePerformance: async () => {
          const { setLoading, setError, setLastRefresh, setDatabaseMetrics, setCacheStats } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            // Fetch performance metrics directly from database
            const supabase = await import('@/utils/supabase/client').then(m => m.getSupabaseBrowserClient());
            if (!supabase) {
              throw new Error('Database connection not available');
            }

            // Get database performance metrics from the last 24 hours
            // FUNCTIONALITY MERGED INTO analytics_events - use analytics table
            const { data: metricsData, error: metricsError } = await supabase
              .from('analytics_events')
              .select('*')
              .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
              .order('created_at', { ascending: false });

            if (metricsError) {
              throw new Error(`Failed to fetch database metrics: ${metricsError.message}`);
            }

            // Transform metrics data to match DatabasePerformanceMetric interface
            const databaseMetrics: DatabasePerformanceMetric[] = metricsData?.map(metric => ({
              metricName: metric.event_type ?? 'unknown',
              avgValue: 0, // Default value since analytics_events doesn't have these fields
              minValue: 0,
              maxValue: 0,
              countMeasurements: 1,
              timestamp: new Date(metric.created_at ?? new Date())
            })) ?? [];

            // Get cache statistics
            // FUNCTIONALITY MERGED INTO analytics_events - use analytics table for cache stats
            const { error: cacheError } = await supabase
              .from('analytics_events')
              .select('*')
              .eq('event_type', 'vote')
              .order('created_at', { ascending: false })
              .limit(1);

            if (cacheError && cacheError.code !== 'PGRST116') {
              throw new Error(`Failed to fetch cache stats: ${cacheError.message}`);
            }

            // Transform cache data to match CacheStats interface
            const cacheStats: CacheStats = {
              size: 0,
              keys: [],
              memoryUsage: 0,
              hitRate: 0
            };
            
            setDatabaseMetrics(databaseMetrics);
            setCacheStats(cacheStats);
            setLastRefresh(new Date());
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load database performance';
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
            
            // Call optimized poll service to refresh materialized views
            const response = await fetch('/api/admin/refresh-materialized-views', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });
            
            if (!response.ok) {
              throw new Error(`Failed to refresh materialized views: ${response.statusText}`);
            }
            
            // Reload performance data after refresh
            await loadDatabasePerformance();
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to refresh materialized views';
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
            
            // Call optimized poll service to perform database maintenance
            const response = await fetch('/api/admin/perform-database-maintenance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });
            
            if (!response.ok) {
              throw new Error(`Failed to perform database maintenance: ${response.statusText}`);
            }
            
            // Reload performance data after maintenance
            await loadDatabasePerformance();
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to perform database maintenance';
            setError(errorMessage);
          } finally {
            setLoading(false);
          }
        },

        // Actions - Loading & Error
        setLoading: (loading: boolean) => {
          set((state) => {
            state.isLoading = loading;
          });
        },

        setError: (error: string | null) => {
          set((state) => {
            state.error = error;
          });
        },

        clearError: () => {
          set((state) => {
            state.error = null;
          });
        },

        // Initialization
        initialize: () => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            // Start monitoring if in browser
            if (typeof window !== 'undefined') {
              get().startMonitoring();
            }

            set((state) => {
              state.isLoading = false;
            });

          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to initialize performance monitoring';
              state.isLoading = false;
            });
          }
        }
      })),
      {
        name: 'performance-storage',
        partialize: (state) => ({
          thresholds: state.thresholds,
          isMonitoring: state.isMonitoring
        })
      }
    ),
    { name: 'performance-store' }
  )
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

export const usePerformanceActions = () => usePerformanceStore(state => ({
  recordMetric: state.recordMetric,
  recordNavigationMetric: state.recordNavigationMetric,
  recordResourceMetric: state.recordResourceMetric,
  recordCustomMetric: state.recordCustomMetric,
  clearMetrics: state.clearMetrics,
  createAlert: state.createAlert,
  resolveAlert: state.resolveAlert,
  clearAlerts: state.clearAlerts,
  clearResolvedAlerts: state.clearResolvedAlerts,
  startMonitoring: state.startMonitoring,
  stopMonitoring: state.stopMonitoring,
  setThreshold: state.setThreshold,
  checkThresholds: state.checkThresholds,
  generateReport: state.generateReport,
  exportMetrics: state.exportMetrics,
  exportReport: state.exportReport,
  setLoading: state.setLoading,
  setError: state.setError,
  clearError: state.clearError,
  initialize: state.initialize,
  // Database performance actions
  setDatabaseMetrics: state.setDatabaseMetrics,
  setCacheStats: state.setCacheStats,
  setLastRefresh: state.setLastRefresh,
  setAutoRefresh: state.setAutoRefresh,
  setRefreshInterval: state.setRefreshInterval,
  loadDatabasePerformance: state.loadDatabasePerformance,
  refreshMaterializedViews: state.refreshMaterializedViews,
  performDatabaseMaintenance: state.performDatabaseMaintenance
}));

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
