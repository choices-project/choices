/**
 * Smart Query Caching System
 * 
 * Intelligent caching system that learns from query patterns and optimizes
 * cache strategies automatically. Builds on our validation system for
 * type-safe cache operations.
 */

import { logger } from '@/lib/utils/logger';
import { safeParse } from '@/lib/validation/validator';

/**
 * Cache entry with metadata for intelligent management
 */
export interface SmartCacheEntry<T = unknown> {
  /** The cached data */
  data: T;
  /** Timestamp when cached */
  timestamp: number;
  /** Time to live in milliseconds */
  ttl: number;
  /** Number of times this entry has been accessed */
  accessCount: number;
  /** Last access timestamp */
  lastAccessed: number;
  /** Query pattern that generated this cache entry */
  queryPattern: string;
  /** Cache priority (higher = more important) */
  priority: number;
  /** Tags for cache invalidation */
  tags: string[];
  /** Size of the cached data in bytes */
  size: number;
}

/**
 * Cache statistics for monitoring and optimization
 */
export interface CacheStats {
  /** Total number of cache entries */
  totalEntries: number;
  /** Total cache size in bytes */
  totalSize: number;
  /** Cache hit rate (0-1) */
  hitRate: number;
  /** Cache miss rate (0-1) */
  missRate: number;
  /** Average access time in milliseconds */
  averageAccessTime: number;
  /** Most frequently accessed patterns */
  topPatterns: Array<{ pattern: string; count: number; hitRate: number }>;
  /** Cache efficiency score (0-100) */
  efficiencyScore: number;
}

/**
 * Query pattern analysis for intelligent caching
 */
export interface QueryPattern {
  /** Normalized query pattern */
  pattern: string;
  /** Frequency of this pattern */
  frequency: number;
  /** Average execution time */
  averageExecutionTime: number;
  /** Cache hit rate for this pattern */
  hitRate: number;
  /** Recommended TTL for this pattern */
  recommendedTtl: number;
  /** Whether this pattern should be cached */
  shouldCache: boolean;
  /** Priority level for this pattern */
  priority: number;
}

/**
 * Cache configuration for different data types
 */
export interface CacheConfig {
  /** Default TTL for different data types */
  defaultTtl: {
    userProfiles: number;
    polls: number;
    votes: number;
    analytics: number;
    [key: string]: number;
  };
  /** Maximum cache size in bytes */
  maxCacheSize: number;
  /** Maximum number of cache entries */
  maxEntries: number;
  /** Cache cleanup interval in milliseconds */
  cleanupInterval: number;
  /** Whether to enable pattern learning */
  enablePatternLearning: boolean;
  /** Minimum frequency for pattern caching */
  minPatternFrequency: number;
}

/**
 * Smart cache manager with intelligent optimization
 */
export class SmartCacheManager {
  private cache = new Map<string, SmartCacheEntry>();
  private queryPatterns = new Map<string, QueryPattern>();
  private accessLog: Array<{ pattern: string; timestamp: number; hit: boolean }> = [];
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = Object.assign({
      defaultTtl: {
        userProfiles: 5 * 60 * 1000, // 5 minutes
        polls: 2 * 60 * 1000, // 2 minutes
        votes: 30 * 1000, // 30 seconds
        analytics: 10 * 60 * 1000, // 10 minutes
      },
      maxCacheSize: 100 * 1024 * 1024, // 100MB
      maxEntries: 10000,
      cleanupInterval: 60 * 1000, // 1 minute
      enablePatternLearning: true,
      minPatternFrequency: 5,
    }, config);

    this.startCleanupTimer();
  }

  /**
   * Get data from cache with intelligent pattern analysis
   */
  async get<T>(
    key: string,
    queryPattern: string,
    schema?: any
  ): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      const entry = this.cache.get(key);
      
      if (!entry) {
        this.recordAccess(queryPattern, false, Date.now() - startTime);
        return null;
      }

      // Check if entry has expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        this.recordAccess(queryPattern, false, Date.now() - startTime);
        return null;
      }

      // Update access statistics
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      
      // Validate cached data if schema provided
      if (schema) {
        const validationResult = safeParse(schema, entry.data, { logErrors: false });
        if (!validationResult.success) {
          logger.warn('Invalid cached data, removing from cache', {
            key,
            error: validationResult.error,
            pattern: queryPattern,
          });
          this.cache.delete(key);
          this.recordAccess(queryPattern, false, Date.now() - startTime);
          return null;
        }
        entry.data = validationResult.data;
      }

      this.recordAccess(queryPattern, true, Date.now() - startTime);
      return entry.data as T;
    } catch (error) {
      logger.error('Error retrieving from cache', error instanceof Error ? error : new Error('Unknown error'));
      this.recordAccess(queryPattern, false, Date.now() - startTime);
      return null;
    }
  }

  /**
   * Set data in cache with intelligent TTL calculation
   */
  async set<T>(
    key: string,
    data: T,
    queryPattern: string,
    options: {
      ttl?: number;
      tags?: string[];
      priority?: number;
      schema?: any;
    } = {}
  ): Promise<void> {
    try {
      // Validate data if schema provided
      if (options.schema) {
        const validationResult = safeParse(options.schema, data, { logErrors: false });
        if (!validationResult.success) {
          logger.warn('Invalid data provided to cache', {
            key,
            error: validationResult.error,
            pattern: queryPattern,
          });
          return;
        }
        data = validationResult.data as T;
      }

      // Calculate intelligent TTL
      const ttl = this.calculateIntelligentTtl(queryPattern, options.ttl);
      
      // Calculate data size
      const size = this.calculateDataSize(data);
      
      // Check if we need to evict entries
      await this.evictIfNeeded(size);

      const entry: SmartCacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        accessCount: 0,
        lastAccessed: Date.now(),
        queryPattern,
        priority: options.priority || this.calculatePriority(queryPattern),
        tags: options.tags || [],
        size,
      };

      this.cache.set(key, entry);
      
      // Update query pattern statistics
      this.updateQueryPattern(queryPattern, ttl);
      
      logger.debug('Data cached successfully', {
        key,
        pattern: queryPattern,
        ttl,
        size,
        priority: entry.priority,
      });
    } catch (error) {
      logger.error('Error setting cache', error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * Invalidate cache entries by tags
   */
  invalidateByTags(tags: string[]): number {
    let invalidatedCount = 0;
    
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }
    
    logger.info('Cache invalidated by tags', { tags, invalidatedCount });
    return invalidatedCount;
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidateByPattern(pattern: string): number {
    let invalidatedCount = 0;
    
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.queryPattern === pattern) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }
    
    logger.info('Cache invalidated by pattern', { pattern, invalidatedCount });
    return invalidatedCount;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalEntries = this.cache.size;
    const totalSize = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0);
    
    // Calculate hit/miss rates
    const totalAccesses = this.accessLog.length;
    const hits = this.accessLog.filter(log => log.hit).length;
    const hitRate = totalAccesses > 0 ? hits / totalAccesses : 0;
    const missRate = 1 - hitRate;
    
    // Calculate average access time
    const averageAccessTime = this.accessLog.length > 0 
      ? this.accessLog.reduce((sum, log) => sum + (log.timestamp || 0), 0) / this.accessLog.length
      : 0;
    
    // Get top patterns
    const patternStats = new Map<string, { count: number; hits: number }>();
    for (const log of this.accessLog) {
      const stats = patternStats.get(log.pattern) || { count: 0, hits: 0 };
      stats.count++;
      if (log.hit) stats.hits++;
      patternStats.set(log.pattern, stats);
    }
    
    const topPatterns = Array.from(patternStats.entries())
      .map(([pattern, stats]) => ({
        pattern,
        count: stats.count,
        hitRate: stats.count > 0 ? stats.hits / stats.count : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Calculate efficiency score
    const efficiencyScore = this.calculateEfficiencyScore(hitRate, totalSize, totalEntries);
    
    return {
      totalEntries,
      totalSize,
      hitRate,
      missRate,
      averageAccessTime,
      topPatterns,
      efficiencyScore,
    };
  }

  /**
   * Get query pattern analysis
   */
  getQueryPatterns(): QueryPattern[] {
    return Array.from(this.queryPatterns.values())
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Optimize cache configuration based on patterns
   */
  optimizeConfiguration(): void {
    const patterns = this.getQueryPatterns();
    
    // Update TTL recommendations based on access patterns
    for (const pattern of patterns) {
      if (pattern.frequency >= this.config.minPatternFrequency) {
        const currentTtl = this.config.defaultTtl[this.getDataTypeFromPattern(pattern.pattern)] || 300000;
        const recommendedTtl = this.calculateOptimalTtl(pattern);
        
        if (Math.abs(recommendedTtl - currentTtl) > currentTtl * 0.2) {
          logger.info('TTL optimization recommendation', {
            pattern: pattern.pattern,
            currentTtl,
            recommendedTtl,
            frequency: pattern.frequency,
            hitRate: pattern.hitRate,
          });
        }
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.queryPatterns.clear();
    this.accessLog = [];
    logger.info('Cache cleared');
  }

  /**
   * Destroy the cache manager and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }

  // Private methods

  private recordAccess(pattern: string, hit: boolean, accessTime: number): void {
    this.accessLog.push({
      pattern,
      timestamp: accessTime,
      hit,
    });
    
    // Keep only last 10000 access logs
    if (this.accessLog.length > 10000) {
      this.accessLog = this.accessLog.slice(-10000);
    }
  }

  private calculateIntelligentTtl(pattern: string, providedTtl?: number): number {
    if (providedTtl) return providedTtl;
    
    const dataType = this.getDataTypeFromPattern(pattern);
    const baseTtl = this.config.defaultTtl[dataType] || 300000; // 5 minutes default
    
    // Adjust TTL based on pattern frequency and hit rate
    const patternStats = this.queryPatterns.get(pattern);
    if (patternStats && patternStats.frequency >= this.config.minPatternFrequency) {
      // Increase TTL for frequently accessed patterns with good hit rates
      if (patternStats.hitRate > 0.7) {
        return Math.min(baseTtl * 2, 3600000); // Max 1 hour
      }
      // Decrease TTL for patterns with low hit rates
      if (patternStats.hitRate < 0.3) {
        return Math.max(baseTtl * 0.5, 30000); // Min 30 seconds
      }
    }
    
    return baseTtl;
  }

  private calculatePriority(pattern: string): number {
    const dataType = this.getDataTypeFromPattern(pattern);
    const priorityMap: Record<string, number> = {
      userProfiles: 10,
      polls: 8,
      votes: 6,
      analytics: 4,
    };
    
    return priorityMap[dataType] || 5;
  }

  private calculateDataSize(data: unknown): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate (UTF-16)
    } catch {
      return 1024; // Default size if serialization fails
    }
  }

  private async evictIfNeeded(newEntrySize: number): Promise<void> {
    const currentSize = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0);
    
    if (currentSize + newEntrySize > this.config.maxCacheSize || 
        this.cache.size >= this.config.maxEntries) {
      
      // Evict least recently used entries with lowest priority
      const entries = Array.from(this.cache.entries())
        .map(([key, entry]) => ({ key, entry }))
        .sort((a, b) => {
          // Sort by priority (descending), then by last accessed (ascending)
          if (a.entry.priority !== b.entry.priority) {
            return b.entry.priority - a.entry.priority;
          }
          return a.entry.lastAccessed - b.entry.lastAccessed;
        });
      
      // Remove entries until we have enough space
      let removedSize = 0;
      const targetSize = this.config.maxCacheSize * 0.8; // Remove to 80% capacity
      
      for (const { key, entry } of entries) {
        if (currentSize - removedSize <= targetSize && 
            this.cache.size - (removedSize / 1024) <= this.config.maxEntries * 0.8) {
          break;
        }
        
        this.cache.delete(key);
        removedSize += entry.size;
      }
      
      logger.debug('Cache eviction completed', {
        removedEntries: Math.floor(removedSize / 1024),
        removedSize,
        remainingEntries: this.cache.size,
      });
    }
  }

  private updateQueryPattern(pattern: string, ttl: number): void {
    if (!this.config.enablePatternLearning) return;
    
    const existing = this.queryPatterns.get(pattern);
    if (existing) {
      existing.frequency++;
      existing.recommendedTtl = ttl;
    } else {
      this.queryPatterns.set(pattern, {
        pattern,
        frequency: 1,
        averageExecutionTime: 0,
        hitRate: 0,
        recommendedTtl: ttl,
        shouldCache: true,
        priority: this.calculatePriority(pattern),
      });
    }
  }

  private getDataTypeFromPattern(pattern: string): string {
    if (pattern.includes('user_profiles')) return 'userProfiles';
    if (pattern.includes('polls')) return 'polls';
    if (pattern.includes('votes')) return 'votes';
    if (pattern.includes('analytics')) return 'analytics';
    return 'default';
  }

  private calculateOptimalTtl(pattern: QueryPattern): number {
    // Base TTL calculation on frequency and hit rate
    const baseTtl = 300000; // 5 minutes
    
    if (pattern.frequency > 100 && pattern.hitRate > 0.8) {
      return Math.min(baseTtl * 3, 1800000); // Up to 30 minutes
    }
    
    if (pattern.frequency > 50 && pattern.hitRate > 0.6) {
      return Math.min(baseTtl * 2, 900000); // Up to 15 minutes
    }
    
    if (pattern.frequency < 10 || pattern.hitRate < 0.3) {
      return Math.max(baseTtl * 0.5, 60000); // Down to 1 minute
    }
    
    return baseTtl;
  }

  private calculateEfficiencyScore(hitRate: number, totalSize: number, totalEntries: number): number {
    // Efficiency score based on hit rate, size utilization, and entry count
    const hitRateScore = hitRate * 50; // 50% weight for hit rate
    const sizeScore = Math.max(0, 25 - (totalSize / this.config.maxCacheSize) * 25); // 25% weight for size
    const entryScore = Math.max(0, 25 - (totalEntries / this.config.maxEntries) * 25); // 25% weight for entries
    
    return Math.round(hitRateScore + sizeScore + entryScore);
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      logger.debug('Cache cleanup completed', { cleanedCount });
    }
  }
}

// Global smart cache instance
export const smartCache = new SmartCacheManager();


