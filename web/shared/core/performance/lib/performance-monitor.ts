/**
 * Performance Monitoring System
 * Integrates with database performance optimization tables and functions
 */

import { logger } from '@/lib/logger';

// Types for performance monitoring
export interface QueryPerformanceData {
  queryHash: string;
  querySignature: string;
  queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE' | 'ALTER' | 'DROP';
  executionTimeMs: number;
  planningTimeMs?: number;
  rowsAffected?: number;
  rowsScanned?: number;
  bufferReads?: number;
  bufferHits?: number;
  userId?: string;
  sessionId?: string;
  clientIp?: string;
  userAgent?: string;
}

export interface IndexUsageData {
  tableName: string;
  indexName: string;
  indexType: string;
  scansTotal: number;
  scansUserTuples: number;
  scansSystemTuples: number;
  tuplesRead: number;
  tuplesFetched: number;
  avgScanTimeMs?: number;
}

export interface ConnectionPoolData {
  poolName: string;
  poolType: 'database' | 'redis' | 'external';
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingConnections?: number;
  connectionWaitTimeMs?: number;
  avgConnectionTimeMs?: number;
  connectionErrors?: number;
}

export interface CachePerformanceData {
  cacheName: string;
  cacheType: 'memory' | 'redis' | 'database' | 'cdn';
  hitCount: number;
  missCount: number;
  avgResponseTimeMs?: number;
  maxResponseTimeMs?: number;
  minResponseTimeMs?: number;
  memoryUsageBytes?: number;
  memoryLimitBytes?: number;
  evictionCount?: number;
}

export interface MaintenanceJobData {
  jobName: string;
  jobType: 'cleanup' | 'vacuum' | 'analyze' | 'reindex' | 'backup' | 'optimization';
}

export interface PerformanceRecommendation {
  recommendationType: string;
  recommendationText: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: number;
  implementationEffort: 'low' | 'medium' | 'high';
}

export interface PerformanceMetrics {
  metricType: string;
  metricName: string;
  metricValue: number;
  metricUnit?: string;
  tableName?: string;
  indexName?: string;
  queryHash?: string;
  queryText?: string;
  executionTimeMs?: number;
  rowsAffected?: number;
  rowsScanned?: number;
  bufferReads?: number;
  bufferHits?: number;
}

// Performance monitoring configuration
export interface PerformanceConfig {
  enabled: boolean;
  sampleRate: number; // 0.0 to 1.0
  slowQueryThresholdMs: number;
  maxLogEntries: number;
  retentionDays: number;
  autoCleanup: boolean;
  alertThresholds: {
    slowQueryMs: number;
    lowCacheHitRate: number;
    highConnectionUtilization: number;
    lowIndexEfficiency: number;
  };
}

// Default configuration
const DEFAULT_CONFIG: PerformanceConfig = {
  enabled: true,
  sampleRate: 1.0,
  slowQueryThresholdMs: 1000,
  maxLogEntries: 10000,
  retentionDays: 30,
  autoCleanup: true,
  alertThresholds: {
    slowQueryMs: 5000,
    lowCacheHitRate: 0.8,
    highConnectionUtilization: 0.9,
    lowIndexEfficiency: 0.5,
  },
};

/**
 * Performance Monitor Class
 * Provides comprehensive performance monitoring and optimization
 */
export class PerformanceMonitor {
  private supabase: any; // Will be initialized in constructor
  private config: PerformanceConfig;
  private isInitialized = false;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    // Initialize supabase in constructor using dynamic import
    this.initializeSupabase();
  }

  private async initializeSupabase() {
    const { createClient } = await import('@supabase/supabase-js');
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Initialize the performance monitor
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Verify database connection and tables exist
      const { error } = await this.supabase
        .from('performance_metrics')
        .select('count')
        .limit(1);

      if (error && !error.message.includes('does not exist')) {
        throw new Error(`Performance monitoring tables not available: ${error.message}`);
      }

      this.isInitialized = true;
      logger.info('✅ Performance monitor initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize performance monitor:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Track query performance
   */
  async trackQueryPerformance(data: QueryPerformanceData): Promise<string | null> {
    if (!this.config.enabled || Math.random() > this.config.sampleRate) {
      return null;
    }

    try {
      await this.initialize();

      const { data: result, error } = await this.supabase.rpc('analyze_query_performance', {
        p_query_hash: data.queryHash,
        p_query_signature: data.querySignature,
        p_query_type: data.queryType,
        p_execution_time_ms: data.executionTimeMs,
        p_planning_time_ms: data.planningTimeMs,
        p_rows_affected: data.rowsAffected,
        p_rows_scanned: data.rowsScanned,
        p_buffer_reads: data.bufferReads,
        p_buffer_hits: data.bufferHits,
        p_user_id: data.userId,
        p_session_id: data.sessionId,
        p_client_ip: data.clientIp,
        p_user_agent: data.userAgent,
      });

      if (error) {
        logger.error('Failed to track query performance:', error);
        return null;
      }

      // Check for slow query alerts
      if (data.executionTimeMs > this.config.alertThresholds.slowQueryMs) {
        await this.alertSlowQuery(data);
      }

      return result as string | null;
    } catch (error) {
      logger.error('Error tracking query performance:', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  /**
   * Update index usage analytics
   */
  async updateIndexUsage(data: IndexUsageData): Promise<string | null> {
    if (!this.config.enabled) return null;

    try {
      await this.initialize();

      const { data: result, error } = await this.supabase.rpc('update_index_usage_analytics', {
        p_table_name: data.tableName,
        p_index_name: data.indexName,
        p_index_type: data.indexType,
        p_scans_total: data.scansTotal,
        p_scans_user_tuples: data.scansUserTuples,
        p_scans_system_tuples: data.scansSystemTuples,
        p_tuples_read: data.tuplesRead,
        p_tuples_fetched: data.tuplesFetched,
        p_avg_scan_time_ms: data.avgScanTimeMs,
      });

      if (error) {
        logger.error('Failed to update index usage:', error);
        return null;
      }

      // Check for low efficiency alerts
      const efficiency = data.tuplesRead > 0 ? data.tuplesFetched / data.tuplesRead : 1;
      if (efficiency < this.config.alertThresholds.lowIndexEfficiency) {
        await this.alertLowIndexEfficiency(data, efficiency);
      }

      return result as string | null;
    } catch (error) {
      logger.error('Error updating index usage:', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  /**
   * Update connection pool metrics
   */
  async updateConnectionPoolMetrics(data: ConnectionPoolData): Promise<string | null> {
    if (!this.config.enabled) return null;

    try {
      await this.initialize();

      const { data: result, error } = await this.supabase.rpc('update_connection_pool_metrics', {
        p_pool_name: data.poolName,
        p_pool_type: data.poolType,
        p_total_connections: data.totalConnections,
        p_active_connections: data.activeConnections,
        p_idle_connections: data.idleConnections,
        p_waiting_connections: data.waitingConnections,
        p_connection_wait_time_ms: data.connectionWaitTimeMs,
        p_avg_connection_time_ms: data.avgConnectionTimeMs,
        p_connection_errors: data.connectionErrors,
      });

      if (error) {
        logger.error('Failed to update connection pool metrics:', error);
        return null;
      }

      // Check for high utilization alerts
      const utilization = data.totalConnections > 0 ? data.activeConnections / data.totalConnections : 0;
      if (utilization > this.config.alertThresholds.highConnectionUtilization) {
        await this.alertHighConnectionUtilization(data, utilization);
      }

      return result as string | null;
    } catch (error) {
      logger.error('Error updating connection pool metrics:', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  /**
   * Update cache performance metrics
   */
  async updateCachePerformance(data: CachePerformanceData): Promise<string | null> {
    if (!this.config.enabled) return null;

    try {
      await this.initialize();

      const { data: result, error } = await this.supabase.rpc('update_cache_performance_metrics', {
        p_cache_name: data.cacheName,
        p_cache_type: data.cacheType,
        p_hit_count: data.hitCount,
        p_miss_count: data.missCount,
        p_avg_response_time_ms: data.avgResponseTimeMs,
        p_max_response_time_ms: data.maxResponseTimeMs,
        p_min_response_time_ms: data.minResponseTimeMs,
        p_memory_usage_bytes: data.memoryUsageBytes,
        p_memory_limit_bytes: data.memoryLimitBytes,
        p_eviction_count: data.evictionCount,
      });

      if (error) {
        logger.error('Failed to update cache performance:', error);
        return null;
      }

      // Check for low hit rate alerts
      const hitRate = (data.hitCount + data.missCount) > 0 ? data.hitCount / (data.hitCount + data.missCount) : 0;
      if (hitRate < this.config.alertThresholds.lowCacheHitRate) {
        await this.alertLowCacheHitRate(data, hitRate);
      }

      return result as string | null;
    } catch (error) {
      logger.error('Error updating cache performance:', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  /**
   * Run maintenance job
   */
  async runMaintenanceJob(data: MaintenanceJobData): Promise<string | null> {
    if (!this.config.enabled) return null;

    try {
      await this.initialize();

      const { data: result, error } = await this.supabase.rpc('run_maintenance_job', {
        p_job_name: data.jobName,
        p_job_type: data.jobType,
      });

      if (error) {
        logger.error('Failed to run maintenance job:', error);
        return null;
      }

      return result as string | null;
    } catch (error) {
      logger.error('Error running maintenance job:', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  /**
   * Get performance recommendations
   */
  async getPerformanceRecommendations(): Promise<PerformanceRecommendation[]> {
    if (!this.config.enabled) return [];

    try {
      await this.initialize();

      const { data, error } = await this.supabase.rpc('get_performance_recommendations');

      if (error) {
        logger.error('Failed to get performance recommendations:', error);
        return [];
      }

      return (data as PerformanceRecommendation[]) || [];
    } catch (error) {
      logger.error('Error getting performance recommendations:', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  /**
   * Cleanup old performance data
   */
  async cleanupPerformanceData(): Promise<number> {
    if (!this.config.enabled) return 0;

    try {
      await this.initialize();

      const { data, error } = await this.supabase.rpc('cleanup_performance_data');

      if (error) {
        logger.error('Failed to cleanup performance data:', error);
        return 0;
      }

      return (data as number) || 0;
    } catch (error) {
      logger.error('Error cleaning up performance data:', error instanceof Error ? error : new Error(String(error)));
      return 0;
    }
  }

  /**
   * Add custom performance metric
   */
  async addPerformanceMetric(metric: PerformanceMetrics): Promise<string | null> {
    if (!this.config.enabled) return null;

    try {
      await this.initialize();

      const { data, error } = await this.supabase
        .from('performance_metrics')
        .insert({
          metric_type: metric.metricType,
          metric_name: metric.metricName,
          metric_value: metric.metricValue,
          metric_unit: metric.metricUnit,
          table_name: metric.tableName,
          index_name: metric.indexName,
          query_hash: metric.queryHash,
          query_text: metric.queryText,
          execution_time_ms: metric.executionTimeMs,
          rows_affected: metric.rowsAffected,
          rows_scanned: metric.rowsScanned,
          buffer_reads: metric.bufferReads,
          buffer_hits: metric.bufferHits,
        })
        .select('id')
        .single();

      if (error) {
        logger.error('Failed to add performance metric:', error);
        return null;
      }

      return (data?.id as string) || null;
    } catch (error) {
      logger.error('Error adding performance metric:', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  /**
   * Get performance statistics
   */
  async getPerformanceStats(timeRange: '1h' | '24h' | '7d' | '30d' = '24h') {
    if (!this.config.enabled) return null;

    try {
      await this.initialize();

      const timeFilter = this.getTimeFilter(timeRange);

      // Get query performance stats
      const { data: queryStats, error: queryError } = await this.supabase
        .from('query_performance_log')
        .select('execution_time_ms, rows_affected, rows_scanned')
        .gte('created_at', timeFilter);

      if (queryError) {
        logger.error('Failed to get query stats:', queryError);
        return null;
      }

      // Get cache performance stats
      const { data: cacheStats, error: cacheError } = await this.supabase
        .from('cache_performance_log')
        .select('hit_rate, avg_response_time_ms, memory_usage_percent')
        .gte('updated_at', timeFilter);

      if (cacheError) {
        logger.error('Failed to get cache stats:', cacheError);
        return null;
      }

      // Calculate statistics
      const stats = {
        queryPerformance: {
          totalQueries: queryStats?.length || 0,
          avgExecutionTime: this.calculateAverage(queryStats, 'execution_time_ms'),
          slowQueries: queryStats?.filter((q: any) => (q.execution_time_ms as number) > this.config.slowQueryThresholdMs).length || 0,
          totalRowsAffected: queryStats?.reduce((sum: number, q: any) => sum + ((q.rows_affected as number) || 0), 0) || 0,
        },
        cachePerformance: {
          avgHitRate: this.calculateAverage(cacheStats, 'hit_rate'),
          avgResponseTime: this.calculateAverage(cacheStats, 'avg_response_time_ms'),
          avgMemoryUsage: this.calculateAverage(cacheStats, 'memory_usage_percent'),
        },
        recommendations: await this.getPerformanceRecommendations(),
      };

      return stats;
    } catch (error) {
      logger.error('Error getting performance stats:', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  /**
   * Schedule automated maintenance
   */
  async scheduleMaintenance(): Promise<void> {
    if (!this.config.enabled || !this.config.autoCleanup) return;

    try {
      // Run cleanup job
      await this.runMaintenanceJob({
        jobName: 'automated_cleanup',
        jobType: 'cleanup',
      });

      // Run analyze job
      await this.runMaintenanceJob({
        jobName: 'automated_analyze',
        jobType: 'analyze',
      });

      logger.info('✅ Automated maintenance completed');
    } catch (error) {
      logger.error('❌ Automated maintenance failed:', error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Private helper methods

  private getTimeFilter(timeRange: string): string {
    const now = new Date();
    switch (timeRange) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    }
  }

  private calculateAverage(data: any[], field: string): number {
    if (!data || data.length === 0) return 0;
    const sum = data.reduce((acc, item) => acc + ((item[field] as number) || 0), 0);
    return sum / data.length;
  }

  private async alertSlowQuery(data: QueryPerformanceData): Promise<void> {
    logger.warn(`🚨 Slow query detected: ${data.querySignature} (${data.executionTimeMs}ms)`);
    // In production, this would send to your alerting system
  }

  private async alertLowIndexEfficiency(data: IndexUsageData, efficiency: number): Promise<void> {
    logger.warn(`🚨 Low index efficiency: ${data.indexName} on ${data.tableName} (${(efficiency * 100).toFixed(1)}%)`);
    // In production, this would send to your alerting system
  }

  private async alertHighConnectionUtilization(data: ConnectionPoolData, utilization: number): Promise<void> {
    logger.warn(`🚨 High connection utilization: ${data.poolName} (${(utilization * 100).toFixed(1)}%)`);
    // In production, this would send to your alerting system
  }

  private async alertLowCacheHitRate(data: CachePerformanceData, hitRate: number): Promise<void> {
    logger.warn(`🚨 Low cache hit rate: ${data.cacheName} (${(hitRate * 100).toFixed(1)}%)`);
    // In production, this would send to your alerting system
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Helper functions for easy integration

/**
 * Track query performance with automatic timing
 */
export async function trackQuery<T>(
  queryFn: () => Promise<T>,
  queryHash: string,
  querySignature: string,
  queryType: QueryPerformanceData['queryType'] = 'SELECT',
  context?: Partial<QueryPerformanceData>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await queryFn();
    const executionTime = Date.now() - startTime;
    
    await performanceMonitor.trackQueryPerformance({
      queryHash,
      querySignature,
      queryType,
      executionTimeMs: executionTime,
      ...context,
    });
    
    return result;
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    await performanceMonitor.trackQueryPerformance({
      queryHash,
      querySignature,
      queryType,
      executionTimeMs: executionTime,
      ...context,
    });
    
    throw error;
  }
}

/**
 * Track cache performance
 */
export async function trackCache<T>(
  cacheFn: () => Promise<T>,
  cacheName: string,
  cacheType: CachePerformanceData['cacheType'] = 'memory',
  context?: Partial<CachePerformanceData>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await cacheFn();
    const responseTime = Date.now() - startTime;
    
    await performanceMonitor.updateCachePerformance({
      cacheName,
      cacheType,
      hitCount: 1,
      missCount: 0,
      avgResponseTimeMs: responseTime,
      ...context,
    });
    
    return result;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    await performanceMonitor.updateCachePerformance({
      cacheName,
      cacheType,
      hitCount: 0,
      missCount: 1,
      avgResponseTimeMs: responseTime,
      ...context,
    });
    
    throw error;
  }
}

/**
 * Initialize performance monitoring
 */
export async function initializePerformanceMonitoring(config?: Partial<PerformanceConfig>): Promise<void> {
  if (config) {
    Object.assign(performanceMonitor, config);
  }
  
  await performanceMonitor.initialize();
  
  // Schedule automated maintenance
  await performanceMonitor.scheduleMaintenance();
}

/**
 * Get performance recommendations
 */
export async function getPerformanceRecommendations(): Promise<PerformanceRecommendation[]> {
  return performanceMonitor.getPerformanceRecommendations();
}

/**
 * Get performance statistics
 */
export async function getPerformanceStats(timeRange?: '1h' | '24h' | '7d' | '30d') {
  return performanceMonitor.getPerformanceStats(timeRange);
}

export default performanceMonitor;
