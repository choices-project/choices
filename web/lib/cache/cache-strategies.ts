/**
 * Cache Strategies and Patterns
 * 
 * Implements various caching strategies including write-through, write-behind,
 * cache-aside, and read-through patterns for optimal performance.
 * 
 * Created: September 15, 2025
 * Agent D - Database Specialist
 */

import { logger } from '@/lib/utils/logger'

import { type RedisClient } from './redis-client'
import type { CacheStats } from './redis-client'

// Cache strategy types
export type CacheStrategy = 'write-through' | 'write-behind' | 'cache-aside' | 'read-through'

// Cache operation options
export interface CacheOptions {
  ttl?: number
  tags?: string[]
  strategy?: CacheStrategy
  fallbackToDatabase?: boolean
  metadata?: Record<string, any>
}

// Cache operation result
export interface CacheResult<T> {
  data: T | null
  fromCache: boolean
  cacheHit: boolean
  error?: string
}

// Cache strategy configuration
export interface StrategyConfig {
  defaultTTL: number
  maxTTL: number
  minTTL: number
  writeThroughDelay: number
  writeBehindBatchSize: number
  readThroughTimeout: number
}

/**
 * Cache Strategy Manager
 * 
 * Manages different caching strategies and provides a unified interface
 * for cache operations.
 */
export class CacheStrategyManager {
  private redisClient: RedisClient
  private config: StrategyConfig
  private writeBehindQueue: Map<string, any> = new Map()
  private writeThroughQueue: Map<string, any> = new Map()

  constructor(redisClient: RedisClient, config?: Partial<StrategyConfig>) {
    this.redisClient = redisClient
    this.config = Object.assign({}, {
      defaultTTL: 300, // 5 minutes
      maxTTL: 3600, // 1 hour
      minTTL: 60, // 1 minute
      writeThroughDelay: 100, // 100ms
      writeBehindBatchSize: 100,
      readThroughTimeout: 5000, // 5 seconds
    }, config)

    // Start background processes
    this.startWriteBehindProcessor()
    this.startWriteThroughProcessor()
  }

  /**
   * Cache-Aside Strategy
   * 
   * Application manages cache explicitly. Cache is checked first,
   * if miss, data is fetched from source and stored in cache.
   */
  async cacheAside<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<CacheResult<T>> {
    const { ttl = this.config.defaultTTL, tags = [], metadata } = options

    try {
      // Try to get from cache first
      const cachedData = await this.redisClient.get<T>(key)
      
      if (cachedData !== null) {
        logger.debug('Cache hit (cache-aside)', { key })
        return {
          data: cachedData,
          fromCache: true,
          cacheHit: true
        }
      }

      // Cache miss - fetch from source
      logger.debug('Cache miss (cache-aside)', { key })
      const data = await fetchFunction()
      
      // Store in cache
      await this.redisClient.set(key, data, ttl, tags, metadata)
      
      return {
        data,
        fromCache: false,
        cacheHit: false
      }
    } catch (error) {
      logger.error('Cache-aside strategy error', error instanceof Error ? error : new Error('Unknown error'), { key })
      return {
        data: null,
        fromCache: false,
        cacheHit: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Read-Through Strategy
   * 
   * Cache automatically loads data from source when cache miss occurs.
   * Application only reads from cache.
   */
  async readThrough<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<CacheResult<T>> {
    const { ttl = this.config.defaultTTL, tags = [], metadata } = options

    try {
      // Try to get from cache
      const cachedData = await this.redisClient.get<T>(key)
      
      if (cachedData !== null) {
        return {
          data: cachedData,
          fromCache: true,
          cacheHit: true
        }
      }

      // Cache miss - fetch and store automatically
      const data = await fetchFunction()
      await this.redisClient.set(key, data, ttl, tags, metadata)
      
      return {
        data,
        fromCache: false,
        cacheHit: false
      }
    } catch (error) {
      logger.error('Read-through strategy error', error instanceof Error ? error : new Error('Unknown error'), { key })
      return {
        data: null,
        fromCache: false,
        cacheHit: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Write-Through Strategy
   * 
   * Data is written to both cache and source simultaneously.
   * Ensures consistency but may be slower.
   */
  async writeThrough<T>(
    key: string,
    data: T,
    writeFunction: (data: T) => Promise<void>,
    options: CacheOptions = {}
  ): Promise<CacheResult<T>> {
    const { ttl = this.config.defaultTTL, tags = [], metadata } = options

    try {
      // Write to source first
      await writeFunction(data)
      
      // Then write to cache
      await this.redisClient.set(key, data, ttl, tags, metadata)
      
      logger.debug('Write-through completed', { key })
      
      return {
        data,
        fromCache: false,
        cacheHit: false
      }
    } catch (error) {
      logger.error('Write-through strategy error', error instanceof Error ? error : new Error('Unknown error'), { key })
      return {
        data: null,
        fromCache: false,
        cacheHit: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Write-Behind Strategy
   * 
   * Data is written to cache immediately and to source asynchronously.
   * Faster writes but potential data loss if cache fails.
   */
  async writeBehind<T>(
    key: string,
    data: T,
    writeFunction: (data: T) => Promise<void>,
    options: CacheOptions = {}
  ): Promise<CacheResult<T>> {
    const { ttl = this.config.defaultTTL, tags = [], metadata } = options

    try {
      // Write to cache immediately
      await this.redisClient.set(key, data, ttl, tags, metadata)
      
      // Queue for background write to source
      this.writeBehindQueue.set(key, { data, writeFunction, timestamp: Date.now() })
      
      logger.debug('Write-behind queued', { key })
      
      return {
        data,
        fromCache: false,
        cacheHit: false
      }
    } catch (error) {
      logger.error('Write-behind strategy error', error instanceof Error ? error : new Error('Unknown error'), { key })
      return {
        data: null,
        fromCache: false,
        cacheHit: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Multi-Get with Cache-Aside Strategy
   * 
   * Efficiently retrieves multiple keys, fetching missing ones from source.
   */
  async multiGet<T>(
    keys: string[],
    fetchFunction: (missingKeys: string[]) => Promise<Record<string, T>>,
    options: CacheOptions = {}
  ): Promise<Record<string, CacheResult<T>>> {
    const { ttl = this.config.defaultTTL, tags = [], metadata } = options
    
    // Log metadata for cache analytics if provided
    if (metadata) {
      console.log('Cache multiGet with metadata:', metadata)
    }
    const results: Record<string, CacheResult<T>> = {}

    try {
      // Get all keys from cache
      const cachedValues = await this.redisClient.mget<T>(keys)
      const missingKeys: string[] = []
      const missingIndices: number[] = []

      // Identify missing keys
      cachedValues.forEach((value, index) => {
        const key = keys[index]
        if (key && value === null) {
          missingKeys.push(key)
          missingIndices.push(index)
        } else if (key) {
          results[key] = {
            data: value,
            fromCache: true,
            cacheHit: true
          }
        }
      })

      // Fetch missing keys from source
      if (missingKeys.length > 0) {
        const fetchedData = await fetchFunction(missingKeys)
        
        // Store fetched data in cache and add to results
        const cacheEntries = Object.entries(fetchedData).map(([key, value]) => ({
          key,
          value,
          ttlSeconds: ttl,
          tags
        }))
        
        await this.redisClient.mset(cacheEntries)
        
        // Add to results
        Object.entries(fetchedData).forEach(([key, value]) => {
          results[key] = {
            data: value,
            fromCache: false,
            cacheHit: false
          }
        })
      }

      return results
    } catch (error) {
      logger.error('Multi-get strategy error', error instanceof Error ? error : new Error('Unknown error'), { keys })
      
      // Return error results for all keys
      keys.forEach(key => {
        if (!results[key]) {
          results[key] = {
            data: null,
            fromCache: false,
            cacheHit: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })
      
      return results
    }
  }

  /**
   * Cache Warming Strategy
   * 
   * Pre-loads frequently accessed data into cache.
   */
  async warmCache<T>(
    keys: string[],
    fetchFunction: (keys: string[]) => Promise<Record<string, T>>,
    options: CacheOptions = {}
  ): Promise<{ warmed: number; failed: number }> {
    const { ttl = this.config.defaultTTL, tags = [], metadata } = options
    
    // Log metadata for cache warming analytics if provided
    if (metadata) {
      console.log('Cache warming with metadata:', metadata)
    }
    let warmed = 0
    let failed = 0

    try {
      // Check which keys are already in cache
      const existingKeys = await Promise.all(
        keys.map(async key => ({ key, exists: await this.redisClient.exists(key) }))
      )
      
      const missingKeys = existingKeys
        .filter(({ exists }) => !exists)
        .map(({ key }) => key)

      if (missingKeys.length === 0) {
        logger.info('Cache warming skipped - all keys already cached', { totalKeys: keys.length })
        return { warmed: 0, failed: 0 }
      }

      // Fetch missing data
      const fetchedData = await fetchFunction(missingKeys)
      
      // Store in cache
      const cacheEntries = Object.entries(fetchedData).map(([key, value]) => ({
        key,
        value,
        ttlSeconds: ttl,
        tags
      }))
      
      const success = await this.redisClient.mset(cacheEntries)
      
      if (success) {
        warmed = Object.keys(fetchedData).length
        failed = missingKeys.length - warmed
      } else {
        failed = missingKeys.length
      }

      logger.info('Cache warming completed', { 
        totalKeys: keys.length, 
        warmed, 
        failed,
        missingKeys: missingKeys.length 
      })

      return { warmed, failed }
    } catch (error) {
      logger.error('Cache warming error', error instanceof Error ? error : new Error('Unknown error'), { keys })
      return { warmed: 0, failed: keys.length }
    }
  }

  /**
   * Cache Invalidation Strategy
   * 
   * Invalidates cache entries based on various patterns.
   */
  async invalidate(
    pattern: string | string[],
    options: { reason?: string; tags?: string[] } = {}
  ): Promise<{ invalidated: number; errors: string[] }> {
    const { reason = 'manual_invalidation', tags } = options
    let invalidated = 0
    const errors: string[] = []

    try {
      if (Array.isArray(pattern)) {
        // Invalidate by tags
        const result = await this.redisClient.invalidateByTags(pattern)
        invalidated = result
      } else if (tags && tags.length > 0) {
        // Invalidate by tags
        const result = await this.redisClient.invalidateByTags(tags)
        invalidated = result
      } else {
        // Invalidate by pattern
        const result = await this.redisClient.invalidateByPattern(pattern)
        invalidated = result
      }

      logger.info('Cache invalidation completed', { 
        pattern, 
        invalidated, 
        reason 
      })

      return { invalidated, errors }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errors.push(errorMessage)
      logger.error('Cache invalidation error', error instanceof Error ? error : new Error('Unknown error'), { 
        pattern, 
        reason 
      })
      
      return { invalidated, errors }
    }
  }

  /**
   * Background processor for write-behind operations
   */
  private startWriteBehindProcessor(): void {
    setInterval(async () => {
      if (this.writeBehindQueue.size === 0) {
        return
      }

      const batchSize = Math.min(this.config.writeBehindBatchSize, this.writeBehindQueue.size)
      const entries = Array.from(this.writeBehindQueue.entries()).slice(0, batchSize)
      
      for (const [key, { data, writeFunction, timestamp }] of entries) {
        try {
          await writeFunction(data)
          this.writeBehindQueue.delete(key)
          
          logger.debug('Write-behind completed', { key, age: Date.now() - timestamp })
        } catch (error) {
          logger.error('Write-behind failed', error instanceof Error ? error : new Error('Unknown error'), { key })
          
          // Remove failed entries after 5 minutes
          if (Date.now() - timestamp > 300000) {
            this.writeBehindQueue.delete(key)
          }
        }
      }
    }, 1000) // Process every second
  }

  /**
   * Background processor for write-through operations
   */
  private startWriteThroughProcessor(): void {
    setInterval(async () => {
      if (this.writeThroughQueue.size === 0) {
        return
      }

      const entries = Array.from(this.writeThroughQueue.entries())
      
      for (const [key, { data, writeFunction, timestamp }] of entries) {
        try {
          // Check if enough time has passed
          if (Date.now() - timestamp >= this.config.writeThroughDelay) {
            await writeFunction(data)
            this.writeThroughQueue.delete(key)
            
            logger.debug('Write-through completed', { key })
          }
        } catch (error) {
          logger.error('Write-through failed', error instanceof Error ? error : new Error('Unknown error'), { key })
          this.writeThroughQueue.delete(key)
        }
      }
    }, 100) // Process every 100ms
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats & { 
    writeBehindQueueSize: number
    writeThroughQueueSize: number
  }> {
    const stats = await this.redisClient.getStats()
    
    return Object.assign({}, stats, {
      writeBehindQueueSize: this.writeBehindQueue.size,
      writeThroughQueueSize: this.writeThroughQueue.size
    })
  }

  /**
   * Clear all queues
   */
  clearQueues(): void {
    this.writeBehindQueue.clear()
    this.writeThroughQueue.clear()
    logger.info('Cache strategy queues cleared')
  }
}

/**
 * Cache Strategy Factory
 * 
 * Creates appropriate cache strategy instances based on configuration.
 */
export class CacheStrategyFactory {
  private static instances: Map<string, CacheStrategyManager> = new Map()

  static create(
    name: string,
    redisClient: RedisClient,
    config?: Partial<StrategyConfig>
  ): CacheStrategyManager {
    if (!this.instances.has(name)) {
      const strategy = new CacheStrategyManager(redisClient, config)
      this.instances.set(name, strategy)
    }
    
    return this.instances.get(name)!
  }

  static get(name: string): CacheStrategyManager | undefined {
    return this.instances.get(name)
  }

  static remove(name: string): boolean {
    return this.instances.delete(name)
  }

  static clear(): void {
    this.instances.clear()
  }
}

export default CacheStrategyManager
