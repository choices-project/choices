/**
 * Redis Client Configuration and Management
 * 
 * Implements Redis caching layer with connection pooling, error handling,
 * and performance monitoring for the Choices platform.
 * 
 * Created: September 15, 2025
 * Agent D - Database Specialist
 */

import { logger } from '../logger'
import { withOptional } from '../util/objects'

// Redis client configuration interface
export type RedisConfig = {
  host: string
  port: number
  password?: string
  db?: number
  retryDelayOnFailover?: number
  maxRetriesPerRequest?: number
  lazyConnect?: boolean
  keepAlive?: number
  family?: number
  connectTimeout?: number
  commandTimeout?: number
  retryDelayOnClusterDown?: number
  enableOfflineQueue?: boolean
  maxMemoryPolicy?: string
  maxMemory?: string
}

// Cache entry interface
export type CacheEntry<T = any> = {
  data: T
  expiresAt: number
  createdAt: number
  hitCount: number
  tags: string[]
  metadata?: Record<string, any>
}

// Cache statistics interface
export type CacheStats = {
  hits: number
  misses: number
  hitRate: number
  totalKeys: number
  memoryUsage: string
  connectedClients: number
  uptime: number
  lastError?: string
}

// Cache invalidation options
export type InvalidationOptions = {
  pattern?: string
  tags?: string[]
  keys?: string[]
  reason?: string
}

/**
 * Redis Client Manager
 * 
 * Manages Redis connections, provides caching operations, and monitors performance.
 */
export class RedisClient {
  private client: any = null
  private config: RedisConfig
  private isConnected: boolean = false
  private connectionAttempts: number = 0
  private maxConnectionAttempts: number = 5
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalKeys: 0,
    memoryUsage: '0B',
    connectedClients: 0,
    uptime: 0
  }

  constructor(config: Partial<RedisConfig> = {}) {
    this.config = Object.assign({}, {
      host: 'localhost',
      port: 6379,
      db: 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      family: 4,
      connectTimeout: 10000,
      commandTimeout: 5000,
      retryDelayOnClusterDown: 300,
      enableOfflineQueue: false,
      maxMemoryPolicy: 'allkeys-lru',
      maxMemory: '256mb'
    }, config)
  }

  /**
   * Initialize Redis client connection
   */
  async connect(): Promise<void> {
    try {
      // Dynamic import to avoid build-time dependency
      const Redis = await import('redis')
      
      this.client = Redis.createClient(withOptional({
        socket: withOptional({
          host: this.config.host,
          port: this.config.port,
          keepAlive: this.config.keepAlive ? true : false
        }, {
          connectTimeout: this.config.connectTimeout,
          family: this.config.family
        })
      }, {
        password: this.config.password,
        database: this.config.db
      }))

      // Set up event listeners
      this.client.on('connect', () => {
        this.isConnected = true
        this.connectionAttempts = 0
        logger.info('Redis client connected', { 
          host: this.config.host, 
          port: this.config.port 
        })
      })

      this.client.on('error', (error: Error) => {
        this.isConnected = false
        this.stats.lastError = error.message
        logger.error('Redis client error', error, { 
          host: this.config.host, 
          port: this.config.port 
        })
      })

      this.client.on('end', () => {
        this.isConnected = false
        logger.warn('Redis client connection ended')
      })

      this.client.on('reconnecting', () => {
        this.connectionAttempts++
        logger.info('Redis client reconnecting', { 
          attempt: this.connectionAttempts 
        })
      })

      // Connect to Redis
      await this.client.connect()
      
      // Configure Redis settings
      await this.configureRedis()
      
    } catch (error) {
      logger.error('Failed to connect to Redis', error instanceof Error ? error : new Error('Unknown error'))
      throw error
    }
  }

  /**
   * Configure Redis settings for optimal performance
   */
  private async configureRedis(): Promise<void> {
    try {
      // Set memory policy
      await this.client.configSet('maxmemory-policy', this.config.maxMemoryPolicy!)
      
      // Set max memory
      await this.client.configSet('maxmemory', this.config.maxMemory!)
      
      // Enable keyspace notifications for cache invalidation
      await this.client.configSet('notify-keyspace-events', 'Ex')
      
      logger.info('Redis configuration applied', {
        maxMemoryPolicy: this.config.maxMemoryPolicy,
        maxMemory: this.config.maxMemory
      })
    } catch (error) {
      logger.warn('Failed to configure Redis settings', error instanceof Error ? error : new Error('Unknown error'))
    }
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.isConnected) {
      this.stats.misses++
      return null
    }

    try {
      const value = await this.client.get(key)
      
      if (value === null) {
        this.stats.misses++
        return null
      }

      const entry: CacheEntry<T> = JSON.parse(value)
      
      // Check if entry has expired
      if (entry.expiresAt < Date.now()) {
        await this.del(key)
        this.stats.misses++
        return null
      }

      // Update hit count
      entry.hitCount++
      await this.client.setEx(key, Math.ceil((entry.expiresAt - Date.now()) / 1000), JSON.stringify(entry))
      
      this.stats.hits++
      this.updateHitRate()
      
      return entry.data
    } catch (error) {
      logger.error('Redis get error', error instanceof Error ? error : new Error('Unknown error'), { key })
      this.stats.misses++
      return null
    }
  }

  /**
   * Set value in cache
   */
  async set<T = any>(
    key: string, 
    value: T, 
    ttlSeconds: number = 300,
    tags: string[] = [],
    metadata?: Record<string, any>
  ): Promise<boolean> {
    if (!this.isConnected) {
      return false
    }

    try {
      const entry: CacheEntry<T> = withOptional({
        data: value,
        expiresAt: Date.now() + (ttlSeconds * 1000),
        createdAt: Date.now(),
        hitCount: 0,
        tags
      }, {
        metadata
      })

      await this.client.setEx(key, ttlSeconds, JSON.stringify(entry))
      
      // Store tag mappings for invalidation
      if (tags.length > 0) {
        await this.storeTagMappings(key, tags)
      }
      
      return true
    } catch (error) {
      logger.error('Redis set error', error instanceof Error ? error : new Error('Unknown error'), { key })
      return false
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<boolean> {
    if (!this.isConnected) {
      return false
    }

    try {
      const result = await this.client.del(key)
      
      // Clean up tag mappings
      await this.cleanupTagMappings(key)
      
      return result > 0
    } catch (error) {
      logger.error('Redis delete error', error instanceof Error ? error : new Error('Unknown error'), { key })
      return false
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) {
      return false
    }

    try {
      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      logger.error('Redis exists error', error instanceof Error ? error : new Error('Unknown error'), { key })
      return false
    }
  }

  /**
   * Get multiple values from cache
   */
  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    if (!this.isConnected || keys.length === 0) {
      return keys.map(() => null)
    }

    try {
      const values = await this.client.mGet(keys)
      
      return values.map((value: string | null, index: number) => {
        if (value === null) {
          this.stats.misses++
          return null
        }

        try {
          const entry: CacheEntry<T> = JSON.parse(value)
          
          // Check if entry has expired
          if (entry.expiresAt < Date.now()) {
            const key = keys[index]
            if (key) {
              this.del(key)
            }
            this.stats.misses++
            return null
          }

          this.stats.hits++
          return entry.data
        } catch {
          this.stats.misses++
          return null
        }
      })
    } catch (error) {
      logger.error('Redis mget error', error instanceof Error ? error : new Error('Unknown error'), { keys })
      return keys.map(() => null)
    }
  }

  /**
   * Set multiple values in cache
   */
  async mset<T = any>(
    entries: Array<{ key: string; value: T; ttlSeconds?: number; tags?: string[] }>
  ): Promise<boolean> {
    if (!this.isConnected || entries.length === 0) {
      return false
    }

    try {
      const pipeline = this.client.multi()
      
      for (const { key, value, ttlSeconds = 300, tags = [] } of entries) {
        const entry: CacheEntry<T> = {
          data: value,
          expiresAt: Date.now() + (ttlSeconds * 1000),
          createdAt: Date.now(),
          hitCount: 0,
          tags
        }

        pipeline.setEx(key, ttlSeconds, JSON.stringify(entry))
        
        // Store tag mappings
        if (tags.length > 0) {
          for (const tag of tags) {
            pipeline.sAdd(`tag:${tag}`, key)
          }
        }
      }
      
      await pipeline.exec()
      return true
    } catch (error) {
      logger.error('Redis mset error', error instanceof Error ? error : new Error('Unknown error'))
      return false
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    if (!this.isConnected) {
      return 0
    }

    try {
      const keys = await this.client.keys(pattern)
      
      if (keys.length === 0) {
        return 0
      }

      const result = await this.client.del(keys)
      
      // Clean up tag mappings for deleted keys
      for (const key of keys) {
        await this.cleanupTagMappings(key)
      }
      
      logger.info('Cache invalidated by pattern', { pattern, deletedCount: result })
      return result
    } catch (error) {
      logger.error('Redis pattern invalidation error', error instanceof Error ? error : new Error('Unknown error'), { pattern })
      return 0
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    if (!this.isConnected || tags.length === 0) {
      return 0
    }

    try {
      let totalDeleted = 0
      
      for (const tag of tags) {
        const keys = await this.client.sMembers(`tag:${tag}`)
        
        if (keys.length > 0) {
          const deleted = await this.client.del(keys)
          totalDeleted += deleted
          
          // Clean up tag mappings
          for (const key of keys) {
            await this.cleanupTagMappings(key)
          }
        }
        
        // Remove the tag set
        await this.client.del(`tag:${tag}`)
      }
      
      logger.info('Cache invalidated by tags', { tags, deletedCount: totalDeleted })
      return totalDeleted
    } catch (error) {
      logger.error('Redis tag invalidation error', error instanceof Error ? error : new Error('Unknown error'), { tags })
      return 0
    }
  }

  /**
   * Store tag mappings for invalidation
   */
  private async storeTagMappings(key: string, tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        await this.client.sAdd(`tag:${tag}`, key)
      }
    } catch (error) {
      logger.warn('Failed to store tag mappings', error instanceof Error ? error : new Error('Unknown error'), { key, tags })
    }
  }

  /**
   * Clean up tag mappings
   */
  private async cleanupTagMappings(key: string): Promise<void> {
    try {
      // Get all tags for this key
      const tagKeys = await this.client.keys(`tag:*`)
      
      for (const tagKey of tagKeys) {
        await this.client.sRem(tagKey, key)
      }
    } catch (error) {
      logger.warn('Failed to cleanup tag mappings', error instanceof Error ? error : new Error('Unknown error'), { key })
    }
  }

  /**
   * Update hit rate calculation
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    if (!this.isConnected) {
      return this.stats
    }

    try {
      const info = await this.client.info('memory')
      const keyspace = await this.client.info('keyspace')
      const clients = await this.client.info('clients')
      const server = await this.client.info('server')
      
      // Parse memory usage
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/)
      this.stats.memoryUsage = memoryMatch ? memoryMatch[1].trim() : '0B'
      
      // Parse connected clients
      const clientsMatch = clients.match(/connected_clients:(\d+)/)
      this.stats.connectedClients = clientsMatch ? parseInt(clientsMatch[1]) : 0
      
      // Parse uptime
      const uptimeMatch = server.match(/uptime_in_seconds:(\d+)/)
      this.stats.uptime = uptimeMatch ? parseInt(uptimeMatch[1]) : 0
      
      // Count total keys
      const dbMatch = keyspace.match(/db\d+:keys=(\d+)/)
      this.stats.totalKeys = dbMatch ? parseInt(dbMatch[1]) : 0
      
      this.updateHitRate()
      
      return { ...this.stats }
    } catch (error) {
      logger.error('Failed to get Redis stats', error instanceof Error ? error : new Error('Unknown error'))
      return this.stats
    }
  }

  /**
   * Flush all cache data
   */
  async flushAll(): Promise<boolean> {
    if (!this.isConnected) {
      return false
    }

    try {
      await this.client.flushAll()
      this.stats.hits = 0
      this.stats.misses = 0
      this.stats.hitRate = 0
      this.stats.totalKeys = 0
      
      logger.info('Redis cache flushed')
      return true
    } catch (error) {
      logger.error('Redis flush error', error instanceof Error ? error : new Error('Unknown error'))
      return false
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit()
        this.isConnected = false
        logger.info('Redis client disconnected')
      } catch (error) {
        logger.error('Error disconnecting Redis client', error instanceof Error ? error : new Error('Unknown error'))
      }
    }
  }

  /**
   * Check if client is connected
   */
  isClientConnected(): boolean {
    return this.isConnected
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { connected: boolean; host: string; port: number } {
    return {
      connected: this.isConnected,
      host: this.config.host,
      port: this.config.port
    }
  }
}

// Default Redis configuration
const defaultRedisConfig: RedisConfig = withOptional({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  db: parseInt(process.env.REDIS_DB || '0'),
  maxMemoryPolicy: 'allkeys-lru',
  maxMemory: '256mb'
}, {
  password: process.env.REDIS_PASSWORD
})

// Global Redis client instance
let redisClient: RedisClient | null = null

/**
 * Get or create Redis client instance
 */
export async function getRedisClient(config?: Partial<RedisConfig>): Promise<RedisClient> {
  if (!redisClient) {
    const finalConfig = Object.assign({}, defaultRedisConfig, config)
    redisClient = new RedisClient(finalConfig)
    await redisClient.connect()
  }
  
  return redisClient
}

/**
 * Close Redis client connection
 */
export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.disconnect()
    redisClient = null
  }
}

export default RedisClient
