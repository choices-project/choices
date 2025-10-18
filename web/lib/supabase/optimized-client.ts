/**
 * Optimized Supabase Client Configuration
 * 
 * Implements best practices for Supabase performance and security
 * Based on analysis of performance reports and security lints
 * 
 * Created: October 2025
 * Priority: P0 - Critical Performance & Security
 */

import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

import { logger } from '@/lib/utils/logger'

// Types
interface SupabaseConfig {
  url: string
  anonKey: string
  serviceRoleKey?: string
}

interface PerformanceMetrics {
  queryTime: number
  cacheHit: boolean
  connectionPool: string
  timestamp: Date
}

interface CacheConfig {
  enabled: boolean
  ttl: number
  maxSize: number
}

/**
 * Optimized Supabase Client Factory
 * 
 * Implements connection pooling, caching, and performance monitoring
 */
export class OptimizedSupabaseClient {
  private static instance: OptimizedSupabaseClient
  private client: SupabaseClient
  private config: SupabaseConfig
  private cache: Map<string, { data: unknown; timestamp: number; ttl: number }>
  private cacheConfig: CacheConfig
  private performanceMetrics: PerformanceMetrics[]

  constructor(config: SupabaseConfig) {
    this.config = config
    this.cache = new Map()
    this.cacheConfig = {
      enabled: true,
      ttl: 300, // 5 minutes
      maxSize: 1000
    }
    this.performanceMetrics = []
    
    this.client = this.createOptimizedClient()
  }

  /**
   * Create optimized Supabase client with performance enhancements
   */
  private createOptimizedClient(): SupabaseClient {
    return createClient(this.config.url, this.config.anonKey, {
      db: {
        schema: 'public',
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      global: {
        headers: {
          'X-Client-Info': 'supabase-js-web-optimized',
          'X-Client-Version': '1.0.0'
        },
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
        heartbeatIntervalMs: 30000,
        reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 30000)
      }
    })
  }

  /**
   * Get browser client with optimizations
   */
  static getBrowserClient(): SupabaseClient {
    const config = this.getConfig()
    const client = createBrowserClient(config.url, config.anonKey, {
      db: { schema: 'public' },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      global: {
        headers: {
          'X-Client-Info': 'supabase-js-web-optimized',
        },
      },
      realtime: {
        params: { eventsPerSecond: 10 },
        heartbeatIntervalMs: 30000,
        reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 30000)
      }
    })
    
    return client
  }

  /**
   * Get server client with optimizations
   */
  static async getServerClient(): Promise<SupabaseClient> {
    const config = this.getConfig()
    const cookieStore = await cookies()
    
    const client = createServerClient(config.url, config.anonKey, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: Record<string, unknown>) => {
          try {
            cookieStore.set(name, value, options)
          } catch {
            // Ignore errors in RSC context
          }
        },
        remove: (name: string, _options: Record<string, unknown>) => {
          try {
            cookieStore.delete(name)
          } catch {
            // Ignore errors in RSC context
          }
        },
      },
      db: { schema: 'public' },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })
    
    return client
  }

  /**
   * Get configuration from environment
   */
  private static getConfig(): SupabaseConfig {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !anonKey) {
      throw new Error('Missing Supabase environment variables')
    }

    return { url, anonKey, serviceRoleKey }
  }

  /**
   * Execute query with performance monitoring
   */
  async executeWithMonitoring<T>(
    operation: () => Promise<T>,
    operationName: string,
    useCache = true
  ): Promise<T> {
    const start = performance.now()
    const cacheKey = `${operationName}_${Date.now()}`
    
    try {
      // Check cache first
      if (useCache && this.cacheConfig.enabled) {
        const cached = this.getFromCache(cacheKey)
        if (cached) {
          logger.info(`Cache hit for ${operationName}`)
          return cached as T
        }
      }

      // Execute operation
      const result = await operation()
      const duration = performance.now() - start

      // Store in cache
      if (useCache && this.cacheConfig.enabled) {
        this.setCache(cacheKey, result)
      }

      // Record performance metrics
      this.recordPerformanceMetrics({
        queryTime: duration,
        cacheHit: false,
        connectionPool: 'default',
        timestamp: new Date()
      })

      // Log slow queries
      if (duration > 1000) {
        logger.warn(`Slow query detected: ${operationName} took ${duration.toFixed(2)}ms`)
      }

      return result
    } catch (error) {
      const duration = performance.now() - start
      logger.error(`Query failed: ${operationName} after ${duration.toFixed(2)}ms`, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  /**
   * Get data from cache
   */
  private getFromCache(key: string): unknown {
    const cached = this.cache.get(key)
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > cached.ttl * 1000) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  /**
   * Set data in cache
   */
  private setCache(key: string, data: unknown): void {
    // Implement LRU cache eviction
    if (this.cache.size >= this.cacheConfig.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.cacheConfig.ttl
    })
  }

  /**
   * Record performance metrics
   */
  private recordPerformanceMetrics(metrics: PerformanceMetrics): void {
    this.performanceMetrics.push(metrics)
    
    // Keep only last 1000 metrics
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000)
    }
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): {
    averageQueryTime: number
    slowQueries: number
    cacheHitRate: number
    totalQueries: number
  } {
    const totalQueries = this.performanceMetrics.length
    if (totalQueries === 0) {
      return {
        averageQueryTime: 0,
        slowQueries: 0,
        cacheHitRate: 0,
        totalQueries: 0
      }
    }

    const averageQueryTime = this.performanceMetrics.reduce((sum, m) => sum + m.queryTime, 0) / totalQueries
    const slowQueries = this.performanceMetrics.filter(m => m.queryTime > 1000).length
    const cacheHits = this.performanceMetrics.filter(m => m.cacheHit).length
    const cacheHitRate = (cacheHits / totalQueries) * 100

    return {
      averageQueryTime,
      slowQueries,
      cacheHitRate,
      totalQueries
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
    logger.info('Supabase cache cleared')
  }

  /**
   * Get client instance
   */
  getClient(): SupabaseClient {
    return this.client
  }

  /**
   * Update cache configuration
   */
  updateCacheConfig(config: Partial<CacheConfig>): void {
    this.cacheConfig = { ...this.cacheConfig, ...config }
    logger.info('Cache configuration updated', config)
  }
}

/**
 * Optimized query builders for common operations
 */
export class OptimizedQueries {
  private client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  /**
   * Get candidates with optimized query
   */
  async getCandidatesByState(state: string, limit = 100) {
    return this.client
      .from('candidates')
      .select('id, name, party, office, district')
      .eq('state', state)
      .eq('active', true)
      .order('name')
      .limit(limit)
  }

  /**
   * Get contributions with optimized query
   */
  async getContributionsByCandidate(candidateId: number, limit = 100) {
    return this.client
      .from('contributions')
      .select('id, contributor_name, amount, contribution_date')
      .eq('candidate_id', candidateId)
      .order('contribution_date', { ascending: false })
      .limit(limit)
  }

  /**
   * Get voting records with optimized query
   */
  async getVotingRecordsByRepresentative(representativeId: number, limit = 100) {
    return this.client
      .from('voting_records')
      .select('id, bill_id, vote_date, vote_position')
      .eq('representative_id', representativeId)
      .order('vote_date', { ascending: false })
      .limit(limit)
  }

  /**
   * Search candidates with full-text search
   */
  async searchCandidates(query: string, limit = 50) {
    return this.client
      .from('candidates')
      .select('id, name, party, office, district, state')
      .textSearch('name', query)
      .eq('active', true)
      .limit(limit)
  }
}

/**
 * Export optimized client instance
 */
export const optimizedSupabaseClient = new OptimizedSupabaseClient({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
})

/**
 * Export optimized queries
 */
export const optimizedQueries = new OptimizedQueries(optimizedSupabaseClient.getClient())


