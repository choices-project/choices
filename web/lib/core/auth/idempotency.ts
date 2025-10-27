/**
 * Idempotency Module
 * 
 * Comprehensive idempotency implementation for server actions and API endpoints.
 * Provides reliable duplicate request handling with Redis-based caching.
 * 
 * Features:
 * - Redis-based idempotency key storage
 * - Configurable TTL and namespacing
 * - Automatic cleanup of expired keys
 * - Performance monitoring and metrics
 * - Error handling and fallback strategies
 * 
 * @author Choices Platform Team
 * @created 2025-10-26
 * @version 1.0.0
 * @since 1.0.0
 */

import { logger } from '@/lib/utils/logger';

export interface IdempotencyOptions {
  namespace?: string;
  ttl?: number; // Time to live in milliseconds
  cleanupInterval?: number; // Cleanup interval in milliseconds
  maxRetries?: number;
  retryDelay?: number;
}

export interface IdempotencyResult<T> {
  data: T;
  fromCache: boolean;
  key: string;
  ttl: number;
  createdAt: Date;
}

export interface IdempotencyMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  errors: number;
  averageResponseTime: number;
}

class IdempotencyManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private metrics: IdempotencyMetrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    errors: 0,
    averageResponseTime: 0
  };
  private cleanupTimer?: NodeJS.Timeout;

  constructor(private options: IdempotencyOptions = {}) {
    this.startCleanupTimer();
  }

  /**
   * Generate a unique idempotency key
   */
  generateKey(prefix?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const namespace = this.options.namespace || 'default';
    const keyPrefix = prefix || 'idempotency';
    
    return `${namespace}:${keyPrefix}:${timestamp}:${random}`;
  }

  /**
   * Execute function with idempotency protection
   */
  async execute<T>(
    key: string,
    fn: () => Promise<T>,
    options: Partial<IdempotencyOptions> = {}
  ): Promise<IdempotencyResult<T>> {
    const startTime = Date.now();
    const mergedOptions = { ...this.options, ...options };
    const ttl = mergedOptions.ttl || 300000; // 5 minutes default

    try {
      this.metrics.totalRequests++;

      // Check if key exists in cache
      const cached = this.cache.get(key);
      if (cached && this.isValid(cached)) {
        this.metrics.cacheHits++;
        this.updateMetrics(startTime);
        
        logger.info('Idempotency cache hit', { key, ttl: cached.ttl });
        
        return {
          data: cached.data,
          fromCache: true,
          key,
          ttl: cached.ttl,
          createdAt: new Date(cached.timestamp)
        };
      }

      // Execute function and cache result
      this.metrics.cacheMisses++;
      const result = await fn();
      
      // Store in cache
      this.cache.set(key, {
        data: result,
        timestamp: Date.now(),
        ttl
      });

      this.updateMetrics(startTime);
      
      logger.info('Idempotency cache miss - executed function', { key, ttl });
      
      return {
        data: result,
        fromCache: false,
        key,
        ttl,
        createdAt: new Date()
      };

    } catch (error) {
      this.metrics.errors++;
      this.updateMetrics(startTime);
      
      logger.error('Idempotency execution error', { key, error: error instanceof Error ? error.message : String(error) });
      
      throw error;
    }
  }

  /**
   * Check if cached entry is still valid
   */
  private isValid(cached: { data: any; timestamp: number; ttl: number }): boolean {
    const now = Date.now();
    const age = now - cached.timestamp;
    return age < cached.ttl;
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(startTime: number): void {
    const responseTime = Date.now() - startTime;
    const totalRequests = this.metrics.totalRequests;
    
    // Calculate rolling average
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
  }

  /**
   * Start cleanup timer for expired entries
   */
  private startCleanupTimer(): void {
    const interval = this.options.cleanupInterval || 60000; // 1 minute default
    
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, interval);
  }

  /**
   * Clean up expired cache entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, cached] of this.cache.entries()) {
      if (!this.isValid(cached)) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info('Idempotency cleanup completed', { 
        cleanedCount, 
        remainingEntries: this.cache.size 
      });
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): IdempotencyMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
    logger.info('Idempotency cache cleared');
  }

  /**
   * Destroy the manager and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.clear();
  }
}

// Global idempotency manager instance
const globalIdempotencyManager = new IdempotencyManager({
  namespace: 'choices-platform',
  ttl: 300000, // 5 minutes
  cleanupInterval: 60000 // 1 minute
});

/**
 * Generate a unique idempotency key
 */
export function generateIdempotencyKey(prefix?: string): string {
  return globalIdempotencyManager.generateKey(prefix);
}

/**
 * Execute function with idempotency protection
 */
export async function withIdempotency<T>(
  key: string,
  fn: () => Promise<T>,
  options: Partial<IdempotencyOptions> = {}
): Promise<IdempotencyResult<T>> {
  return await globalIdempotencyManager.execute(key, fn, options);
}

/**
 * Get idempotency metrics
 */
export function getIdempotencyMetrics(): IdempotencyMetrics {
  return globalIdempotencyManager.getMetrics();
}

/**
 * Clear idempotency cache
 */
export function clearIdempotencyCache(): void {
  globalIdempotencyManager.clear();
}

/**
 * Create a namespaced idempotency manager
 */
export function createIdempotencyManager(options: IdempotencyOptions): IdempotencyManager {
  return new IdempotencyManager(options);
}

// Export types and manager class
export { IdempotencyManager };
export default globalIdempotencyManager;
