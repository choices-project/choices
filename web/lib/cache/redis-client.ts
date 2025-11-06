/**
 * Redis Client Configuration and Management
 * 
 * Implements Redis caching layer with connection pooling, error handling,
 * and performance monitoring for the Choices platform.
 * 
 * Created: September 15, 2025
 * Agent D - Database Specialist
 */

import { logger } from '@/lib/utils/logger'

// Redis client types
type RedisClientInterface = {
  get(key: string): Promise<string | null>
  set(key: string, value: string, options?: { ex?: number }): Promise<string>
  del(key: string): Promise<number>
  exists(key: string): Promise<number>
  mget(keys: string[]): Promise<(string | null)[]>
  keys(pattern: string): Promise<string[]>
  incr(key: string): Promise<number>
  ttl(key: string): Promise<number>
  lpush(key: string, value: string): Promise<number>
  lrange(key: string, start: number, stop: number): Promise<string[]>
  expire(key: string, seconds: number): Promise<number>
  flushAll(): Promise<string>
  quit(): Promise<string>
  connect(): Promise<void>
  on(event: string, callback: (...args: unknown[]) => void): void
  configSet(key: string, value: string): Promise<string>
  multi(): {
    set(key: string, value: string): unknown
    sAdd(key: string, member: string): unknown
    exec(): Promise<unknown[]>
  }
  sMembers(key: string): Promise<string[]>
  sRem(key: string, member: string): Promise<number>
  sAdd(key: string, member: string): Promise<number>
  info(section?: string): Promise<string>
}

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
export type CacheEntry<T = unknown> = {
  data: T
  expiresAt: number
  createdAt: number
  hitCount: number
  tags: string[]
  metadata?: Record<string, unknown>
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
  private client: RedisClientInterface | null = null
  private config: RedisConfig
  private isConnected = false
  private connectionAttempts = 0
  private readonly maxConnectionAttempts = 5
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
      // Check if we're using Upstash REST API
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        // Use Upstash REST API
        const { Redis } = await import('@upstash/redis')
        
        this.client = Redis.fromEnv() as unknown as RedisClientInterface
        this.isConnected = true
        
        logger.info('Upstash Redis client connected via REST API', { 
          url: process.env.UPSTASH_REDIS_REST_URL 
        })
        return
      }
      
      // Fallback to standard Redis client
      const Redis = await import('redis')
      
      this.client = Redis.createClient({
        socket: {
          host: this.config.host,
          port: this.config.port,
          keepAlive: this.config.keepAlive ? true : false,
          ...(this.config.connectTimeout !== undefined ? { connectTimeout: this.config.connectTimeout } : {}),
          ...(this.config.family !== undefined ? { family: this.config.family } : {})
        },
        ...(this.config.password ? { password: this.config.password } : {}),
        ...(this.config.db !== undefined ? { database: this.config.db } : {})
      }) as unknown as RedisClientInterface

      // Set up event listeners
      this.client.on('connect', () => {
        this.isConnected = true
        this.connectionAttempts = 0
        logger.info('Redis client connected', { 
          host: this.config.host, 
          port: this.config.port 
        })
      })

      this.client.on('error', (...args: unknown[]) => {
        const error = args[0] as Error
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
    if (!this.client) {
      throw new Error('Redis client not initialized')
    }
    
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
      logger.warn('Failed to configure Redis settings', { error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  /**
   * Get value from cache
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.client) {
      this.stats.misses++
      return null
    }

    try {
      const value = await this.client.get(key)
      
      if (value === null) {
        this.stats.misses++
        return null
      }

      // Handle both JSON strings and objects from Upstash Redis
      let entry: CacheEntry<T>;
      if (typeof value === 'string') {
        entry = JSON.parse(value) as CacheEntry<T>;
      } else {
        entry = value as CacheEntry<T>;
      }
      
      // Check if entry has expired
      if (entry.expiresAt < Date.now()) {
        await this.del(key)
        this.stats.misses++
        return null
      }

      // Update hit count
      entry.hitCount++
      await this.client.set(key, JSON.stringify(entry), { ex: Math.ceil((entry.expiresAt - Date.now()) / 1000) })
      
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
  async set<T = unknown>(
    key: string, 
    value: T, 
    ttlSeconds = 300,
    tags: string[] = [],
    metadata?: Record<string, unknown>
  ): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false
    }

    try {
      const entry: CacheEntry<T> = {
        data: value,
        expiresAt: Date.now() + (ttlSeconds * 1000),
        createdAt: Date.now(),
        hitCount: 0,
        tags,
        ...metadata
      }

      await this.client.set(key, JSON.stringify(entry), { ex: ttlSeconds })
      
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
    if (!this.isConnected || !this.client) {
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
    if (!this.isConnected || !this.client) {
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
  async mget<T = unknown>(keys: string[]): Promise<Array<T | null>> {
    if (!this.isConnected || !this.client || keys.length === 0) {
      return keys.map(() => null)
    }

    try {
      const values = await this.client.mget(keys)
      
      return values.map((value: string | null, index: number) => {
        if (value === null) {
          this.stats.misses++
          return null
        }

        try {
          const entry: CacheEntry<T> = JSON.parse(value) as CacheEntry<T>
          
          // Check if entry has expired
          if (entry.expiresAt < Date.now()) {
            const key = keys[index]
            if (key) {
              void this.del(key)
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
  async mset<T = unknown>(
    entries: Array<{ key: string; value: T; ttlSeconds?: number; tags?: string[] }>
  ): Promise<boolean> {
    if (!this.isConnected || !this.client || entries.length === 0) {
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

        pipeline.set(key, JSON.stringify(entry))
        
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
    if (!this.isConnected || !this.client) {
      return 0
    }

    try {
      const keys = await this.client.keys(pattern)
      
      if (keys.length === 0) {
        return 0
      }

      let result = 0
      for (const key of keys) {
        result += await this.client.del(key)
      }
      
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
    if (!this.isConnected || !this.client || tags.length === 0) {
      return 0
    }

    try {
      let totalDeleted = 0
      
      for (const tag of tags) {
        const keys = await this.client.sMembers(`tag:${tag}`)
        
        if (keys.length > 0) {
          let deleted = 0
          for (const key of keys) {
            deleted += await this.client.del(key)
          }
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
    if (!this.client) return
    
    try {
      for (const tag of tags) {
        await this.client.sAdd(`tag:${tag}`, key)
      }
    } catch (error) {
      logger.warn('Failed to store tag mappings', { error: error instanceof Error ? error.message : 'Unknown error', key, tags })
    }
  }

  /**
   * Clean up tag mappings
   */
  private async cleanupTagMappings(key: string): Promise<void> {
    if (!this.client) return
    
    try {
      // Get all tags for this key
      const tagKeys = await this.client.keys(`tag:*`)
      
      for (const tagKey of tagKeys) {
        await this.client.sRem(tagKey, key)
      }
    } catch (error) {
      logger.warn('Failed to cleanup tag mappings', { error: error instanceof Error ? error.message : 'Unknown error', key })
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
    if (!this.isConnected || !this.client) {
      return this.stats
    }

    try {
      const info = await this.client.info('memory')
      const keyspace = await this.client.info('keyspace')
      const clients = await this.client.info('clients')
      const server = await this.client.info('server')
      
      // Parse memory usage
      const memoryMatch = info?.match(/used_memory_human:([^\r\n]+)/)
      this.stats.memoryUsage = memoryMatch?.[1]?.trim() ?? '0B'
      
      // Parse connected clients
      const clientsMatch = clients?.match(/connected_clients:(\d+)/)
      this.stats.connectedClients = clientsMatch?.[1] ? parseInt(clientsMatch[1]) : 0
      
      // Parse uptime
      const uptimeMatch = server?.match(/uptime_in_seconds:(\d+)/)
      this.stats.uptime = uptimeMatch?.[1] ? parseInt(uptimeMatch[1]) : 0
      
      // Count total keys
      const dbMatch = keyspace?.match(/db\d+:keys=(\d+)/)
      this.stats.totalKeys = dbMatch?.[1] ? parseInt(dbMatch[1]) : 0
      
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
    if (!this.isConnected || !this.client) {
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
        this.client = null
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
   * Increment a key by 1
   */
  async incr(key: string): Promise<number> {
    if (!this.isConnected || !this.client) {
      throw new Error('Redis client not connected')
    }
    return await this.client.incr(key)
  }

  /**
   * Get TTL of a key
   */
  async ttl(key: string): Promise<number> {
    if (!this.isConnected || !this.client) {
      throw new Error('Redis client not connected')
    }
    return await this.client.ttl(key)
  }

  /**
   * Push to list
   */
  async lpush(key: string, value: string): Promise<number> {
    if (!this.isConnected || !this.client) {
      throw new Error('Redis client not connected')
    }
    return await this.client.lpush(key, value)
  }

  /**
   * Set expiration
   */
  async expire(key: string, seconds: number): Promise<number> {
    if (!this.isConnected || !this.client) {
      throw new Error('Redis client not connected')
    }
    return await this.client.expire(key, seconds)
  }

  /**
   * Get keys by pattern
   */
  async keys(pattern: string): Promise<string[]> {
    if (!this.isConnected || !this.client) {
      throw new Error('Redis client not connected')
    }
    return await this.client.keys(pattern)
  }

  /**
   * Get range from list
   */
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    if (!this.isConnected || !this.client) {
      throw new Error('Redis client not connected')
    }
    return await this.client.lrange(key, start, stop)
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
const defaultRedisConfig: RedisConfig = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379'),
  db: parseInt(process.env.REDIS_DB ?? '0'),
  maxMemoryPolicy: 'allkeys-lru',
  maxMemory: '256mb',
  ...(process.env.REDIS_PASSWORD ? { password: process.env.REDIS_PASSWORD } : {})
}

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
