/**
 * API Response Caching System
 * 
 * Intelligent caching system for external API responses with TTL management,
 * cache invalidation, and storage optimization for government data.
 */

import { logger } from '@/lib/logger';

export interface CacheConfig {
  defaultTTL: number; // milliseconds
  maxSize: number; // maximum number of entries
  cleanupInterval: number; // milliseconds
  enableCompression: boolean;
  enablePersistence: boolean;
}

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  source: string;
  metadata?: Record<string, any>;
}

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  totalRequests: number;
  memoryUsage: number;
  oldestEntry: number;
  newestEntry: number;
}

export interface CacheMetrics {
  apiName: string;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
  averageResponseTime: number;
  dataFreshness: number; // hours
  storageEfficiency: number;
}

/**
 * In-memory cache implementation for API responses
 */
export class ApiResponseCache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    requests: 0
  };
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: CacheConfig) {
    this.config = config;
    this.startCleanupTimer();
  }

  /**
   * Get cached data by key
   */
  get(key: string): T | null {
    this.stats.requests++;
    
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      logger.debug('Cache miss', { key });
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      logger.debug('Cache entry expired', { key, age: Date.now() - entry.timestamp });
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    
    logger.debug('Cache hit', { 
      key, 
      age: Date.now() - entry.timestamp,
      accessCount: entry.accessCount 
    });

    return entry.data;
  }

  /**
   * Set cached data with TTL
   */
  set(key: string, data: T, ttl?: number, source?: string, metadata?: Record<string, any>): void {
    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      accessCount: 0,
      lastAccessed: Date.now(),
      source: source || 'unknown',
      metadata
    };

    // Check cache size limit
    if (this.cache.size >= this.config.maxSize) {
      this.evictLeastUsed();
    }

    this.cache.set(key, entry);
    
    logger.debug('Cache entry set', { 
      key, 
      ttl: entry.ttl,
      source: entry.source,
      cacheSize: this.cache.size 
    });
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry ? !this.isExpired(entry) : false;
  }

  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug('Cache entry deleted', { key });
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.info('Cache cleared', { entriesCleared: size });
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.requests;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    const missRate = totalRequests > 0 ? this.stats.misses / totalRequests : 0;

    let oldestEntry = Date.now();
    let newestEntry = 0;
    let memoryUsage = 0;

    for (const entry of this.cache.values()) {
      oldestEntry = Math.min(oldestEntry, entry.timestamp);
      newestEntry = Math.max(newestEntry, entry.timestamp);
      memoryUsage += this.estimateEntrySize(entry);
    }

    return {
      totalEntries: this.cache.size,
      hitRate,
      missRate,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      totalRequests,
      memoryUsage,
      oldestEntry: oldestEntry === Date.now() ? 0 : oldestEntry,
      newestEntry
    };
  }

  /**
   * Get cache metrics for an API
   */
  getApiMetrics(apiName: string): CacheMetrics {
    const apiEntries = Array.from(this.cache.values())
      .filter(entry => entry.source === apiName);

    const totalApiRequests = apiEntries.reduce((sum, entry) => sum + entry.accessCount, 0);
    const cacheHits = apiEntries.reduce((sum, entry) => sum + entry.accessCount, 0);
    const cacheMisses = this.stats.misses; // This is approximate
    const cacheHitRate = totalApiRequests > 0 ? cacheHits / (cacheHits + cacheMisses) : 0;

    const averageAge = apiEntries.length > 0 
      ? apiEntries.reduce((sum, entry) => sum + (Date.now() - entry.timestamp), 0) / apiEntries.length
      : 0;

    const dataFreshness = averageAge / (1000 * 60 * 60); // Convert to hours

    return {
      apiName,
      cacheHits,
      cacheMisses,
      cacheHitRate,
      averageResponseTime: 0, // Would need to track response times
      dataFreshness,
      storageEfficiency: this.calculateStorageEfficiency(apiEntries)
    };
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern: string | RegExp): number {
    let invalidated = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    for (const [key, entry] of this.cache) {
      if (regex.test(key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    logger.info('Cache entries invalidated by pattern', { pattern, invalidated });
    return invalidated;
  }

  /**
   * Invalidate cache entries by source
   */
  invalidateBySource(source: string): number {
    let invalidated = 0;

    for (const [key, entry] of this.cache) {
      if (entry.source === source) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    logger.info('Cache entries invalidated by source', { source, invalidated });
    return invalidated;
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUp(warmUpData: Array<{ key: string; data: T; ttl?: number; source?: string }>): Promise<void> {
    logger.info('Warming up cache', { entries: warmUpData.length });

    for (const item of warmUpData) {
      this.set(item.key, item.data, item.ttl, item.source);
    }

    logger.info('Cache warm-up completed', { 
      entries: warmUpData.length,
      cacheSize: this.cache.size 
    });
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Evict least recently used entry
   */
  private evictLeastUsed(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      logger.debug('Evicted least used cache entry', { key: oldestKey });
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const beforeSize = this.cache.size;
    let cleaned = 0;

    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Cache cleanup completed', { 
        entriesCleaned: cleaned,
        beforeSize,
        afterSize: this.cache.size 
      });
    }
  }

  /**
   * Estimate memory usage of cache entry
   */
  private estimateEntrySize(entry: CacheEntry<T>): number {
    // Rough estimation - in practice, you'd use a more sophisticated method
    return JSON.stringify(entry).length * 2; // 2 bytes per character (UTF-16)
  }

  /**
   * Calculate storage efficiency
   */
  private calculateStorageEfficiency(entries: CacheEntry<T>[]): number {
    if (entries.length === 0) return 0;
    
    const totalSize = entries.reduce((sum, entry) => sum + this.estimateEntrySize(entry), 0);
    const averageSize = totalSize / entries.length;
    const maxSize = this.config.maxSize * averageSize;
    
    return Math.min(1, totalSize / maxSize);
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
    logger.info('Cache destroyed');
  }
}

/**
 * Cache configuration for different APIs
 */
export const CACHE_CONFIGS: Record<string, CacheConfig> = {
  'google-civic': {
    defaultTTL: 24 * 60 * 60 * 1000, // 24 hours - civic data changes slowly
    maxSize: 10000,
    cleanupInterval: 60 * 60 * 1000, // 1 hour
    enableCompression: true,
    enablePersistence: false
  },
  'propublica': {
    defaultTTL: 6 * 60 * 60 * 1000, // 6 hours - congressional data changes more frequently
    maxSize: 5000,
    cleanupInterval: 30 * 60 * 1000, // 30 minutes
    enableCompression: true,
    enablePersistence: false
  }
};

/**
 * Create cache for specific API
 */
export function createApiCache<T = any>(apiName: string): ApiResponseCache<T> {
  const config = CACHE_CONFIGS[apiName] || CACHE_CONFIGS['google-civic'];
  return new ApiResponseCache<T>(config);
}

/**
 * Global cache instances
 */
export const googleCivicCache = createApiCache('google-civic');
export const proPublicaCache = createApiCache('propublica');
