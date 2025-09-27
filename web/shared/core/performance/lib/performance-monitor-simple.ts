/**
 * Simplified Performance Monitoring System
 * Core functionality without complex type issues
 */

import { devLog } from '@/lib/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

// Basic types for performance monitoring
export type QueryPerformanceData = {
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

export type CachePerformanceData = {
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

export type PerformanceRecommendation = {
  recommendationType: string;
  recommendationText: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: number;
  implementationEffort: 'low' | 'medium' | 'high';
}

// Performance monitoring configuration
export type PerformanceConfig = {
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
 * Simplified Performance Monitor Class
 * Focuses on core functionality without complex type issues
 */
export class SimplePerformanceMonitor {
  private supabase: ReturnType<typeof getSupabaseServerClient>;
  private config: PerformanceConfig;
  private isInitialized = false;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = Object.assign({}, DEFAULT_CONFIG, config);
    this.supabase = getSupabaseServerClient();
  }

  /**
   * Initialize the performance monitor
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Verify database connection and tables exist
      const supabaseClient = await this.supabase
      const { error } = await supabaseClient
        .from('performance_metrics')
        .select('count')
        .limit(1);

      if (error && !error.message.includes('does not exist')) {
        throw new Error(`Performance monitoring tables not available: ${error.message}`);
      }

      this.isInitialized = true;
      devLog('✅ Performance monitor initialized');
    } catch (error) {
      devLog('❌ Failed to initialize performance monitor:', error instanceof Error ? error : new Error(String(error)));
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

      const supabaseClient = await this.supabase;
      const { data: result, error } = await supabaseClient.rpc('analyze_query_performance', {
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
        devLog('Failed to track query performance:', error);
        return null;
      }

      // Check for slow query alerts
      if (data.executionTimeMs > this.config.alertThresholds.slowQueryMs) {
        devLog(`🚨 Slow query detected: ${data.querySignature} (${data.executionTimeMs}ms)`);
      }

      return result as string | null;
    } catch (error) {
      devLog('Error tracking query performance:', error instanceof Error ? error : new Error(String(error)));
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

      const supabaseClient = await this.supabase;
      const { data: result, error } = await supabaseClient.rpc('update_cache_performance_metrics', {
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
        devLog('Failed to update cache performance:', error);
        return null;
      }

      // Check for low hit rate alerts
      const hitRate = (data.hitCount + data.missCount) > 0 ? data.hitCount / (data.hitCount + data.missCount) : 0;
      if (hitRate < this.config.alertThresholds.lowCacheHitRate) {
        devLog(`🚨 Low cache hit rate: ${data.cacheName} (${(hitRate * 100).toFixed(1)}%)`);
      }

      return result as string | null;
    } catch (error) {
      devLog('Error updating cache performance:', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  /**
   * Run maintenance job
   */
  async runMaintenanceJob(jobName: string, jobType: string): Promise<string | null> {
    if (!this.config.enabled) return null;

    try {
      await this.initialize();

      const supabaseClient = await this.supabase;
      const { data: result, error } = await supabaseClient.rpc('run_maintenance_job', {
        p_job_name: jobName,
        p_job_type: jobType,
      });

      if (error) {
        devLog('Failed to run maintenance job:', error);
        return null;
      }

      return result as string | null;
    } catch (error) {
      devLog('Error running maintenance job:', error instanceof Error ? error : new Error(String(error)));
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

      const supabaseClient = await this.supabase;
      const { data, error } = await supabaseClient.rpc('get_performance_recommendations');

      if (error) {
        devLog('Failed to get performance recommendations:', error);
        return [];
      }

      return (data as PerformanceRecommendation[]) || [];
    } catch (error) {
      devLog('Error getting performance recommendations:', error instanceof Error ? error : new Error(String(error)));
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

      const supabaseClient = await this.supabase;
      const { data, error } = await supabaseClient.rpc('cleanup_performance_data');

      if (error) {
        devLog('Failed to cleanup performance data:', error);
        return 0;
      }

      return (data as number) || 0;
    } catch (error) {
      devLog('Error cleaning up performance data:', error instanceof Error ? error : new Error(String(error)));
      return 0;
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

      const supabaseClient = await this.supabase;
      
      // Get query performance stats
      const { data: queryStats, error: queryError } = await supabaseClient
        .from('query_performance_log')
        .select('execution_time_ms, rows_affected, rows_scanned')
        .gte('created_at', timeFilter);

      if (queryError) {
        devLog('Failed to get query stats:', queryError);
        return null;
      }

      // Get cache performance stats
      const { data: cacheStats, error: cacheError } = await supabaseClient
        .from('cache_performance_log')
        .select('hit_rate, avg_response_time_ms, memory_usage_percent')
        .gte('updated_at', timeFilter);

      if (cacheError) {
        devLog('Failed to get cache stats:', cacheError);
        return null;
      }

      // Calculate statistics
      const stats = {
        queryPerformance: {
          totalQueries: queryStats.length || 0,
          avgExecutionTime: this.calculateAverage(queryStats, 'execution_time_ms'),
          slowQueries: queryStats.filter((q: any) => (q.execution_time_ms as number) > this.config.slowQueryThresholdMs).length || 0,
          totalRowsAffected: queryStats.reduce((sum: number, q: any) => sum + ((q.rows_affected as number) || 0), 0) || 0,
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
      devLog('Error getting performance stats:', error instanceof Error ? error : new Error(String(error)));
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
      await this.runMaintenanceJob('automated_cleanup', 'cleanup');

      // Run analyze job
      await this.runMaintenanceJob('automated_analyze', 'analyze');

      devLog('✅ Automated maintenance completed');
    } catch (error) {
      devLog('❌ Automated maintenance failed:', error instanceof Error ? error : new Error(String(error)));
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
}

// Global performance monitor instance
export const simplePerformanceMonitor = new SimplePerformanceMonitor();

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
    
    await simplePerformanceMonitor.trackQueryPerformance(Object.assign({
      queryHash,
      querySignature,
      queryType,
      executionTimeMs: executionTime,
    }, context));
    
    return result;
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    await simplePerformanceMonitor.trackQueryPerformance(Object.assign({
      queryHash,
      querySignature,
      queryType,
      executionTimeMs: executionTime,
    }, context));
    
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
    
    await simplePerformanceMonitor.updateCachePerformance(Object.assign({
      cacheName,
      cacheType,
      hitCount: 1,
      missCount: 0,
      avgResponseTimeMs: responseTime,
    }, context));
    
    return result;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    await simplePerformanceMonitor.updateCachePerformance(Object.assign({
      cacheName,
      cacheType,
      hitCount: 0,
      missCount: 1,
      avgResponseTimeMs: responseTime,
    }, context));
    
    throw error;
  }
}

/**
 * Initialize performance monitoring
 */
export async function initializeSimplePerformanceMonitoring(config?: Partial<PerformanceConfig>): Promise<void> {
  if (config) {
    Object.assign(simplePerformanceMonitor, config);
  }
  
  await simplePerformanceMonitor.initialize();
  
  // Schedule automated maintenance
  await simplePerformanceMonitor.scheduleMaintenance();
}

/**
 * Get performance recommendations
 */
export async function getSimplePerformanceRecommendations(): Promise<PerformanceRecommendation[]> {
  return simplePerformanceMonitor.getPerformanceRecommendations();
}

/**
 * Get performance statistics
 */
export async function getSimplePerformanceStats(timeRange?: '1h' | '24h' | '7d' | '30d') {
  return simplePerformanceMonitor.getPerformanceStats(timeRange);
}

export default simplePerformanceMonitor;



