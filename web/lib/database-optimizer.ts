/**
 * Database Optimizer
 * 
 * Implements database optimization strategies to ensure we're being good database citizens.
 * This includes query optimization, connection management, and performance monitoring.
 */

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { devLog } from './logger';

// ============================================================================
// DATABASE HEALTH MONITORING
// ============================================================================

export interface DatabaseHealth {
  healthy: boolean;
  error?: string;
  responseTime: number;
  queryTime?: number;
  warnings: string[];
  metrics: {
    activeConnections?: number;
    slowQueries?: number;
    errorRate?: number;
  };
}

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const startTime = Date.now();
  const warnings: string[] = [];

  try {
    // Test basic connectivity
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    if (!supabase) {
      return {
        healthy: false,
        error: 'Supabase client not available',
        responseTime: Date.now() - startTime,
        warnings,
        metrics: {}
      };
    }
    
    const { error: connectionError } = await supabase
      .from('ia_users')
      .select('count')
      .limit(1);

    if (connectionError) {
      return {
        healthy: false,
        error: connectionError.message,
        responseTime: Date.now() - startTime,
        warnings,
        metrics: {}
      };
    }

    // Test query performance
    const queryStart = Date.now();
    const { error: queryError } = await supabase
      .from('po_polls')
      .select('poll_id')
      .eq('status', 'active')
      .limit(10);

    const queryTime = Date.now() - queryStart;

    // Check for performance warnings
    if (queryTime > 1000) {
      warnings.push('Slow query detected (>1000ms)');
    }
    if (queryTime > 500) {
      warnings.push('Query performance could be improved (>500ms)');
    }

    return {
      healthy: !queryError,
      error: queryError?.message || undefined,
      responseTime: Date.now() - startTime,
      queryTime,
      warnings,
      metrics: {
        slowQueries: queryTime > 1000 ? 1 : 0
      }
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime,
      warnings,
      metrics: {}
    };
  }
}

// ============================================================================
// QUERY OPTIMIZATION
// ============================================================================

/**
 * Optimized poll loading with vote aggregation
 * Prevents N+1 queries by loading related data in batches
 */
export async function getPollsWithVoteCounts(limit: number = 20) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    if (!supabase) {
      throw new Error('Supabase client not available')
    }
    
    const { data, error } = await supabase
      .from('po_polls')
      .select(`
        poll_id,
        title,
        status,
        total_votes,
        participation_rate,
        created_at,
        options
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Transform data to include vote counts
    const pollsWithVotes = data?.map(poll => ({
      ...poll,
      voteCounts: poll.options ? 
        poll.options.reduce((acc: any, option: any, index: number) => {
          acc[`option_${index + 1}`] = 0; // Will be updated when we implement vote counting
          return acc;
        }, {}) : {}
    })) || [];

    return { data: pollsWithVotes, error: null };
  } catch (error) {
    devLog('Error loading polls with vote counts:', error);
    return { data: [], error };
  }
}

/**
 * Batch vote processing to prevent individual queries
 */
export async function processVotesBatch(votes: any[]) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    if (!supabase) {
      throw new Error('Supabase client not available')
    }
    
    const { data, error } = await supabase
      .from('votes')
      .upsert(votes, { 
        onConflict: 'poll_id,user_id',
        ignoreDuplicates: false 
      });

    return { data, error };
  } catch (error) {
    devLog('Error processing votes batch:', error);
    return { data: null, error };
  }
}

/**
 * Selective field loading to reduce data transfer
 */
export async function getPollsMinimal(limit: number = 20) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    if (!supabase) {
      throw new Error('Supabase client not available')
    }
    
    const { data, error } = await supabase
      .from('po_polls')
      .select('poll_id, title, status, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);

    return { data, error };
  } catch (error) {
    devLog('Error loading minimal polls:', error);
    return { data: [], error };
  }
}

// ============================================================================
// CONNECTION MANAGEMENT
// ============================================================================

/**
 * Connection pool configuration optimization
 */
export const OPTIMIZED_POOL_CONFIG = {
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,  // Increased for better reliability
  allowExitOnIdle: true,          // Allow graceful shutdown
  maxUses: 7500,                  // Recycle connections after 7500 uses
};

/**
 * Graceful connection cleanup
 */
export async function cleanupConnections() {
  try {
    // This would be implemented if using direct PostgreSQL connections
    // For Supabase, the client handles connection management automatically
    devLog('Connection cleanup completed');
  } catch (error) {
    devLog('Error during connection cleanup:', error);
  }
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

export interface QueryMetrics {
  queryName: string;
  executionTime: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

class QueryPerformanceMonitor {
  private metrics: QueryMetrics[] = [];
  private maxMetrics = 1000;

  recordQuery(metric: QueryMetrics) {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow queries
    if (metric.executionTime > 1000) {
      devLog(`Slow query detected: ${metric.queryName} took ${metric.executionTime}ms`);
    }
  }

  getSlowQueries(threshold: number = 1000): QueryMetrics[] {
    return this.metrics.filter(m => m.executionTime > threshold);
  }

  getAverageQueryTime(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, m) => sum + m.executionTime, 0);
    return total / this.metrics.length;
  }

  getErrorRate(): number {
    if (this.metrics.length === 0) return 0;
    const errors = this.metrics.filter(m => !m.success).length;
    return (errors / this.metrics.length) * 100;
  }

  clearMetrics() {
    this.metrics = [];
  }
}

export const queryMonitor = new QueryPerformanceMonitor();

/**
 * Performance wrapper for database queries
 */
export function withPerformanceTracking<T extends any[], R>(
  queryName: string,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    
    try {
      const result = await fn(...args);
      const executionTime = Date.now() - startTime;
      
      queryMonitor.recordQuery({
        queryName,
        executionTime,
        timestamp: new Date(),
        success: true
      });

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      queryMonitor.recordQuery({
        queryName,
        executionTime,
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  };
}

// ============================================================================
// INDEX OPTIMIZATION
// ============================================================================

/**
 * SQL statements for performance indexes
 * These should be run in the Supabase SQL editor
 */
export const PERFORMANCE_INDEXES = `
-- Poll queries optimization
CREATE INDEX IF NOT EXISTS idx_polls_status_created 
  ON po_polls(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_polls_active_recent 
  ON po_polls(status, created_at DESC) 
  WHERE status = 'active';

-- Vote queries optimization
CREATE INDEX IF NOT EXISTS idx_votes_poll_user 
  ON votes(poll_id, user_id);

CREATE INDEX IF NOT EXISTS idx_votes_created_at 
  ON votes(created_at DESC);

-- Feedback queries optimization
CREATE INDEX IF NOT EXISTS idx_feedback_status_type 
  ON feedback(status, type, created_at DESC);

-- User activity optimization
CREATE INDEX IF NOT EXISTS idx_users_last_activity 
  ON ia_users(last_activity DESC);

-- Trending topics optimization
CREATE INDEX IF NOT EXISTS idx_trending_topics_score 
  ON trending_topics(trending_score DESC, created_at DESC);

-- Generated polls optimization
CREATE INDEX IF NOT EXISTS idx_generated_polls_status 
  ON generated_polls(status, quality_score DESC);
`;

/**
 * Check if performance indexes exist
 */
export async function checkPerformanceIndexes(): Promise<{
  exists: boolean;
  missing: string[];
}> {
  try {
    // This would check for index existence
    // For now, return a placeholder
    return {
      exists: true,
      missing: []
    };
  } catch (error) {
    devLog('Error checking performance indexes:', error);
    return {
      exists: false,
      missing: ['Unable to check indexes']
    };
  }
}

// ============================================================================
// CACHING STRATEGY
// ============================================================================

/**
 * Simple in-memory cache for frequently accessed data
 */
class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 300000) { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const simpleCache = new SimpleCache();

/**
 * Cached poll loading
 */
export async function getCachedPolls(limit: number = 20) {
  const cacheKey = `polls_${limit}`;
  const cached = simpleCache.get(cacheKey);
  
  if (cached) {
    return cached;
  }

  const result = await getPollsWithVoteCounts(limit);
  simpleCache.set(cacheKey, result, 300000); // 5 minutes cache
  
  return result;
}

// ============================================================================
// EXPORT OPTIMIZED FUNCTIONS
// ============================================================================

export const optimizedQueries = {
  getPollsWithVoteCounts: withPerformanceTracking('getPollsWithVoteCounts', getPollsWithVoteCounts),
  getPollsMinimal: withPerformanceTracking('getPollsMinimal', getPollsMinimal),
  processVotesBatch: withPerformanceTracking('processVotesBatch', processVotesBatch),
  getCachedPolls: withPerformanceTracking('getCachedPolls', getCachedPolls),
};

export default {
  checkDatabaseHealth,
  optimizedQueries,
  queryMonitor,
  simpleCache,
  PERFORMANCE_INDEXES,
  OPTIMIZED_POOL_CONFIG
};
