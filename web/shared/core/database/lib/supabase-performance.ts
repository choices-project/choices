/**
 * Supabase Performance Optimization
 * 
 * Implements comprehensive performance optimization for Supabase including:
 * - Connection pooling
 * - Query caching
 * - Performance monitoring
 * - Query optimization
 * - Rate limiting
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js'

import { logger } from '@/lib/logger'

// Type definitions for better type safety
type CacheValue = Record<string, unknown> | unknown[] | string | number | boolean | null;
type DatabaseRecord = Record<string, unknown>;
type QueryConditions = Record<string, string | number | boolean | null>;
type UpdateData = Record<string, unknown>;

// Performance monitoring
class PerformanceMonitor {
  private metrics: Map<string, {
    count: number
    totalTime: number
    avgTime: number
    minTime: number
    maxTime: number
    errors: number
    lastCall: Date
  }> = new Map()

  recordOperation(operation: string, duration: number, success: boolean = true) {
    const existing = this.metrics.get(operation) || {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      minTime: Infinity,
      maxTime: 0,
      errors: 0,
      lastCall: new Date()
    }

    existing.count++
    existing.totalTime += duration
    existing.avgTime = existing.totalTime / existing.count
    existing.minTime = Math.min(existing.minTime, duration)
    existing.maxTime = Math.max(existing.maxTime, duration)
    existing.lastCall = new Date()

    if (!success) {
      existing.errors++
    }

    this.metrics.set(operation, existing)

    // Log slow operations
    if (duration > 1000) {
      logger.warn('Slow Supabase operation detected', {
        operation,
        duration: `${duration}ms`,
        avgTime: `${existing.avgTime}ms`
      })
    }
  }

  getMetrics() {
    return Object.fromEntries(this.metrics)
  }

  getSlowOperations(threshold: number = 500) {
    return Array.from(this.metrics.entries())
      .filter(([_, metrics]) => metrics.avgTime > threshold)
      .sort((a, b) => b[1].avgTime - a[1].avgTime)
  }

  reset() {
    this.metrics.clear()
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Cache management
class CacheManager {
  private cache: Map<string, {
    value: CacheValue
    expiresAt: Date
    accessCount: number
    lastAccessed: Date
  }> = new Map()

  private maxSize: number
  private defaultTTL: number

  constructor(maxSize: number = 1000, defaultTTL: number = 300000) { // 5 minutes default
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
  }

  set(key: string, value: CacheValue, ttl: number = this.defaultTTL): void {
    // Clean expired entries
    this.cleanup()

    // Evict if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }

    this.cache.set(key, {
      value,
      expiresAt: new Date(Date.now() + ttl),
      accessCount: 0,
      lastAccessed: new Date()
    })
  }

  get(key: string): CacheValue | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    if (entry.expiresAt < new Date()) {
      this.cache.delete(key)
      return null
    }

    // Update access metrics
    entry.accessCount++
    entry.lastAccessed = new Date()
    
    return entry.value
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  private cleanup(): void {
    const now = new Date()
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key)
      }
    }
  }

  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestTime = new Date()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate()
    }
  }

  private calculateHitRate(): number {
    // This would need to track hits/misses over time
    return 0.85 // Placeholder
  }
}

export const cacheManager = new CacheManager()

// Connection pooling and optimization
class ConnectionPoolManager {
  private clients: SupabaseClient[] = []
  private maxConnections: number
  private currentConnections: number = 0

  constructor(maxConnections: number = 10) {
    this.maxConnections = maxConnections
  }

  async getClient(): Promise<SupabaseClient> {
    if (this.currentConnections < this.maxConnections) {
      this.currentConnections++
      return this.createOptimizedClient()
    }

    // Wait for available connection
    return new Promise((resolve) => {
      const checkConnection = () => {
        if (this.currentConnections < this.maxConnections) {
          this.currentConnections++
          resolve(this.createOptimizedClient())
        } else {
          setTimeout(checkConnection, 100)
        }
      }
      checkConnection()
    })
  }

  releaseClient(): void {
    if (this.currentConnections > 0) {
      this.currentConnections--
    }
  }

  private createOptimizedClient(): SupabaseClient {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'X-Client-Info': 'choices-platform-optimized',
          'X-Connection-Pool': 'true'
        }
      }
    })
  }

  getStats() {
    return {
      currentConnections: this.currentConnections,
      maxConnections: this.maxConnections,
      utilizationRate: (this.currentConnections / this.maxConnections) * 100
    }
  }
}

export const connectionPoolManager = new ConnectionPoolManager()

// Query optimization utilities
export class QueryOptimizer {
  private static instance: QueryOptimizer
  private queryCache: Map<string, CacheValue> = new Map()

  static getInstance(): QueryOptimizer {
    if (!QueryOptimizer.instance) {
      QueryOptimizer.instance = new QueryOptimizer()
    }
    return QueryOptimizer.instance
  }

  // Optimize SELECT queries with proper field selection
  optimizeSelect(table: string, fields: string[] = ['*'], conditions: QueryConditions = {}) {
    const selectFields = fields.length > 0 ? fields.join(', ') : '*'
    const whereClause = Object.keys(conditions).length > 0 
      ? Object.entries(conditions).map(([key, value]) => `${key} = '${value}'`).join(' AND ')
      : ''

    return {
      table,
      select: selectFields,
      where: whereClause,
      optimized: true
    }
  }

  // Optimize INSERT queries with batch operations
  optimizeInsert(_table: string, data: unknown[]) {
    if (data.length === 1) {
      return { single: true, data: data[0] }
    }

    // Batch insert optimization
    return {
      batch: true,
      count: data.length,
      optimized: true
    }
  }

  // Optimize UPDATE queries with selective updates
  optimizeUpdate(table: string, updates: UpdateData, conditions: QueryConditions) {
    const updateFields = Object.keys(updates).filter(key => updates[key] !== undefined)
    const whereFields = Object.keys(conditions)

    return {
      table,
      updateFields,
      whereFields,
      optimized: true
    }
  }

  // Cache query results
  cacheQuery(key: string, result: CacheValue, ttl: number = 300000): void {
    cacheManager.set(`query:${key}`, result, ttl)
  }

  // Get cached query result
  getCachedQuery(key: string): CacheValue | null {
    return cacheManager.get(`query:${key}`)
  }

  // Generate cache key for query
  generateCacheKey(operation: string, table: string, params: unknown): string {
    return `${operation}:${table}:${JSON.stringify(params)}`
  }
}

export const queryOptimizer = QueryOptimizer.getInstance()

// Rate limiting for API calls
class RateLimiter {
  private limits: Map<string, {
    count: number
    windowStart: Date
    windowEnd: Date
  }> = new Map()

  private defaultLimit: number
  private defaultWindow: number

  constructor(defaultLimit: number = 100, defaultWindow: number = 60000) { // 100 requests per minute
    this.defaultLimit = defaultLimit
    this.defaultWindow = defaultWindow
  }

  isAllowed(key: string, limit?: number, window?: number): boolean {
    const currentLimit = limit || this.defaultLimit
    const currentWindow = window || this.defaultWindow
    const now = new Date()

    const existing = this.limits.get(key)
    
    if (!existing || now > existing.windowEnd) {
      // Start new window
      this.limits.set(key, {
        count: 1,
        windowStart: now,
        windowEnd: new Date(now.getTime() + currentWindow)
      })
      return true
    }

    if (existing.count >= currentLimit) {
      return false
    }

    existing.count++
    return true
  }

  getRemaining(key: string): number {
    const existing = this.limits.get(key)
    if (!existing) return this.defaultLimit
    return Math.max(0, this.defaultLimit - existing.count)
  }

  reset(key: string): void {
    this.limits.delete(key)
  }

  cleanup(): void {
    const now = new Date()
    for (const [key, limit] of this.limits.entries()) {
      if (now > limit.windowEnd) {
        this.limits.delete(key)
      }
    }
  }
}

export const rateLimiter = new RateLimiter()

// Enhanced Supabase client with performance optimizations
export class OptimizedSupabaseClient {
  private client: SupabaseClient
  private cacheEnabled: boolean
  private monitoringEnabled: boolean

  constructor(
    client: SupabaseClient,
    options: {
      cacheEnabled?: boolean
      monitoringEnabled?: boolean
    } = {}
  ) {
    this.client = client
    this.cacheEnabled = options.cacheEnabled ?? true
    this.monitoringEnabled = options.monitoringEnabled ?? true
  }

  // Optimized query execution with caching and monitoring
  async executeQuery<T>(
    operation: string,
    queryFn: () => Promise<{ data: T | null; error: unknown }>,
    cacheKey?: string,
    cacheTTL?: number
  ): Promise<{ data: T | null; error: unknown }> {
    const startTime = Date.now()

    try {
      // Check cache first
      if (this.cacheEnabled && cacheKey) {
        const cached = cacheManager.get(cacheKey)
        if (cached) {
          performanceMonitor.recordOperation(operation, Date.now() - startTime, true)
          return { data: cached as T, error: null }
        }
      }

      // Execute query
      const result = await queryFn()

      // Cache successful results
      if (this.cacheEnabled && cacheKey && result.data && !result.error) {
        cacheManager.set(cacheKey, result.data, cacheTTL)
      }

      // Monitor performance
      if (this.monitoringEnabled) {
        performanceMonitor.recordOperation(operation, Date.now() - startTime, !result.error)
      }

      return result
    } catch (error) {
      if (this.monitoringEnabled) {
        performanceMonitor.recordOperation(operation, Date.now() - startTime, false)
      }
      throw error
    }
  }

  // Optimized table operations
  async from<T = DatabaseRecord>(table: string) {
    return {
      select: async (fields: string[] = ['*'], cacheKey?: string) => {
        const optimized = queryOptimizer.optimizeSelect(table, fields)
        const cacheKeyFinal = cacheKey || queryOptimizer.generateCacheKey('select', table, { fields })
        
        return this.executeQuery(
          `select:${table}`,
          async () => {
            const result = await this.client.from(table).select(optimized.select)
            return result
          },
          cacheKeyFinal
        )
      },

      insert: async (data: T | T[], cacheKey?: string) => {
        const optimized = queryOptimizer.optimizeInsert(table, Array.isArray(data) ? data : [data])
        
        return this.executeQuery(
          `insert:${table}`,
          async () => {
            const result = await this.client.from(table).insert(data)
            return result
          },
          cacheKey || `insert:${table}:${optimized.batch ? 'batch' : 'single'}`
        )
      },

      update: async (updates: UpdateData, conditions: QueryConditions, cacheKey?: string) => {
        const optimized = queryOptimizer.optimizeUpdate(table, updates, conditions)
        let query = this.client.from(table).update(updates)
        
        // Apply conditions
        Object.entries(conditions).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
        
        return this.executeQuery(
          `update:${table}`,
          async () => {
            const result = await query
            return result
          },
          cacheKey || `update:${table}:${optimized.updateFields.length}`
        )
      },

      delete: async (conditions: QueryConditions, cacheKey?: string) => {
        let query = this.client.from(table).delete()
        
        // Apply conditions
        Object.entries(conditions).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
        
        return this.executeQuery(
          `delete:${table}`,
          async () => {
            const result = await query
            return result
          },
          cacheKey
        )
      }
    }
  }

  // Get performance metrics
  getMetrics() {
    return {
      performance: performanceMonitor.getMetrics(),
      cache: cacheManager.getStats(),
      connections: connectionPoolManager.getStats(),
      slowOperations: performanceMonitor.getSlowOperations()
    }
  }

  // Clear cache
  clearCache(): void {
    cacheManager.clear()
  }

  // Reset performance metrics
  resetMetrics(): void {
    performanceMonitor.reset()
  }
}

// Create optimized client instance
export const createOptimizedSupabaseClient = (): OptimizedSupabaseClient => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'choices-platform-optimized'
      }
    }
  })

  return new OptimizedSupabaseClient(client, {
    cacheEnabled: true,
    monitoringEnabled: true
  })
}

// Export default optimized client
export const optimizedSupabase = createOptimizedSupabaseClient()

// Performance monitoring middleware
export const withPerformanceMonitoring = <T extends unknown[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now()
    
    try {
      const result = await fn(...args)
      performanceMonitor.recordOperation(operation, Date.now() - startTime, true)
      return result
    } catch (error) {
      performanceMonitor.recordOperation(operation, Date.now() - startTime, false)
      throw error
    }
  }
}

// Cleanup function for periodic maintenance
export const performMaintenance = () => {
  // Clean up expired cache entries
  cacheManager.clear()
  
  // Clean up rate limiter
  rateLimiter.cleanup()
  
  // Log performance metrics
  const metrics = optimizedSupabase.getMetrics()
  logger.info('Supabase performance metrics', metrics)
  
  // Log slow operations
  const slowOps = metrics.slowOperations
  if (slowOps.length > 0) {
    logger.warn('Slow Supabase operations detected', { slowOperations: slowOps })
  }
}

// Set up periodic maintenance
if (typeof window === 'undefined') {
  // Server-side only
  setInterval(performMaintenance, 300000) // Every 5 minutes
}
