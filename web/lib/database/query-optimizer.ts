/**
 * Advanced Query Optimizer
 * 
 * Implements intelligent query optimization, caching, and performance monitoring
 * for database operations in the Choices platform.
 * 
 * Created: September 15, 2025
 * Agent D - Database Specialist
 */

import { logger } from '../logger'
import { getSupabaseServerClient } from '../../utils/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { QueryPlan } from '../types/database'

// Query optimization options
export interface QueryOptions {
  useCache?: boolean
  cacheTTL?: number
  cacheTags?: string[]
  timeout?: number
  retries?: number
  explain?: boolean
  analyze?: boolean
}

// Query performance metrics
export interface QueryMetrics {
  query: string
  executionTime: number
  rowsReturned: number
  cacheHit: boolean
  fromCache: boolean
  error?: string
  timestamp: number
}

// Query optimization result
export interface OptimizationResult {
  originalQuery: string
  optimizedQuery: string
  optimizations: string[]
  estimatedImprovement: number
  executionPlan?: QueryPlan
}

// Query cache entry
interface QueryCacheEntry<T = unknown> {
  query: string
  result: T
  timestamp: number
  ttl: number
  hitCount: number
}

/**
 * Advanced Query Optimizer
 * 
 * Provides intelligent query optimization, caching, and performance monitoring.
 */
export class AdvancedQueryOptimizer {
  private supabase!: SupabaseClient
  private queryCache: Map<string, QueryCacheEntry<unknown>> = new Map()
  private metrics: QueryMetrics[] = []
  private maxCacheSize: number = 1000
  private maxMetricsHistory: number = 10000

  constructor() {
    this.initializeSupabase()
    this.startCacheCleanup()
    this.startMetricsCleanup()
  }

  /**
   * Initialize Supabase client
   */
  private async initializeSupabase(): Promise<void> {
    try {
      this.supabase = await getSupabaseServerClient()
    } catch (error) {
      logger.error('Failed to initialize Supabase client', error instanceof Error ? error : new Error('Unknown error'))
      throw error
    }
  }

  /**
   * Execute optimized query
   */
  async executeQuery<T = unknown>(
    query: string,
    options: QueryOptions = {}
  ): Promise<{ data: T | null; metrics: QueryMetrics; fromCache: boolean }> {
    const {
      useCache = true,
      cacheTTL = 300,
      cacheTags = [],
      timeout = 30000,
      retries = 3,
      explain = false,
      analyze = false
    } = options

    const startTime = Date.now()
    const cacheKey = this.generateCacheKey(query, options)
    let fromCache = false
    let cacheHit = false

    try {
      // Check cache first
      if (useCache) {
        const cachedResult = this.getFromCache(cacheKey)
        if (cachedResult) {
          fromCache = true
          cacheHit = true
          
          const metrics: QueryMetrics = {
            query: this.sanitizeQuery(query),
            executionTime: Date.now() - startTime,
            rowsReturned: Array.isArray(cachedResult) ? cachedResult.length : 1,
            cacheHit: true,
            fromCache: true,
            timestamp: Date.now()
          }
          
          this.recordMetrics(metrics)
          
          return { data: cachedResult as T, metrics, fromCache: true }
        }
      }

      // Optimize query
      const optimizationResult = await this.optimizeQuery(query)
      const optimizedQuery = optimizationResult.optimizedQuery

      // Execute query with retries
      let result: T | null = null
      let lastError: Error | null = null

      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          if (explain || analyze) {
            result = await this.executeExplainQuery(optimizedQuery, explain, analyze)
          } else {
            result = await this.executeRegularQuery(optimizedQuery)
          }
          break
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown error')
          
          if (attempt < retries) {
            logger.warn('Query execution failed, retrying', lastError, { 
              attempt, 
              maxRetries: retries,
              query: this.sanitizeQuery(query)
            })
            await this.delay(1000 * attempt) // Exponential backoff
          }
        }
      }

      if (lastError) {
        throw lastError
      }

      // Cache result if successful
      if (useCache && result !== null) {
        this.setCache(cacheKey, result, cacheTTL, cacheTags)
      }

      const metrics: QueryMetrics = {
        query: this.sanitizeQuery(query),
        executionTime: Date.now() - startTime,
        rowsReturned: Array.isArray(result) ? result.length : (result ? 1 : 0),
        cacheHit: false,
        fromCache: false,
        timestamp: Date.now()
      }

      this.recordMetrics(metrics)

      return { data: result, metrics, fromCache: false }

    } catch (error) {
      const metrics: QueryMetrics = {
        query: this.sanitizeQuery(query),
        executionTime: Date.now() - startTime,
        rowsReturned: 0,
        cacheHit: false,
        fromCache: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      }

      this.recordMetrics(metrics)
      
      logger.error('Query execution failed', error instanceof Error ? error : new Error('Unknown error'), {
        query: this.sanitizeQuery(query),
        options
      })

      throw error
    }
  }

  /**
   * Execute regular query
   */
  private async executeRegularQuery<T = unknown>(query: string): Promise<T> {
    const { data, error } = await this.supabase.rpc('execute_query', { query_text: query })
    
    if (error) {
      throw new Error(`Query execution failed: ${error.message}`)
    }
    
    return data
  }

  /**
   * Execute EXPLAIN query
   */
  private async executeExplainQuery<T = unknown>(
    query: string,
    explain: boolean,
    analyze: boolean
  ): Promise<T> {
    const explainQuery = `EXPLAIN ${analyze ? 'ANALYZE' : ''} ${query}`
    const { data, error } = await this.supabase.rpc('execute_query', { query_text: explainQuery })
    
    if (error) {
      throw new Error(`EXPLAIN query failed: ${error.message}`)
    }
    
    return data
  }

  /**
   * Optimize query
   */
  private async optimizeQuery(query: string): Promise<OptimizationResult> {
    const optimizations: string[] = []
    let optimizedQuery = query
    let estimatedImprovement = 0

    // Remove unnecessary whitespace
    if (query !== query.trim()) {
      optimizedQuery = optimizedQuery.trim()
      optimizations.push('Removed unnecessary whitespace')
      estimatedImprovement += 1
    }

    // Optimize SELECT statements
    if (optimizedQuery.toLowerCase().startsWith('select')) {
      // Remove unnecessary DISTINCT if not needed
      if (optimizedQuery.includes('DISTINCT') && !this.isDistinctNeeded(optimizedQuery)) {
        optimizedQuery = optimizedQuery.replace(/\bDISTINCT\b/gi, '')
        optimizations.push('Removed unnecessary DISTINCT')
        estimatedImprovement += 5
      }

      // Optimize LIMIT placement
      if (optimizedQuery.includes('LIMIT') && !optimizedQuery.includes('ORDER BY')) {
        optimizations.push('Consider adding ORDER BY before LIMIT for consistent results')
        estimatedImprovement += 2
      }

      // Optimize JOIN conditions
      if (optimizedQuery.includes('JOIN')) {
        const joinOptimizations = this.optimizeJoins(optimizedQuery)
        if (joinOptimizations.length > 0) {
          optimizations.push(...joinOptimizations)
          estimatedImprovement += 10
        }
      }
    }

    // Optimize WHERE clauses
    if (optimizedQuery.includes('WHERE')) {
      const whereOptimizations = this.optimizeWhereClause(optimizedQuery)
      if (whereOptimizations.length > 0) {
        optimizations.push(...whereOptimizations)
        estimatedImprovement += 8
      }
    }

    // Optimize ORDER BY clauses
    if (optimizedQuery.includes('ORDER BY')) {
      const orderOptimizations = this.optimizeOrderBy(optimizedQuery)
      if (orderOptimizations.length > 0) {
        optimizations.push(...orderOptimizations)
        estimatedImprovement += 3
      }
    }

    return {
      originalQuery: query,
      optimizedQuery,
      optimizations,
      estimatedImprovement
    }
  }

  /**
   * Check if DISTINCT is needed
   */
  private isDistinctNeeded(query: string): boolean {
    // Simple heuristic - if query has GROUP BY, DISTINCT might not be needed
    return !query.toLowerCase().includes('group by')
  }

  /**
   * Optimize JOIN conditions
   */
  private optimizeJoins(query: string): string[] {
    const optimizations: string[] = []
    
    // Check for missing indexes on JOIN columns
    const joinMatches = query.match(/JOIN\s+\w+\s+ON\s+([^=]+)\s*=\s*([^=]+)/gi)
    if (joinMatches) {
      optimizations.push('Consider adding indexes on JOIN columns for better performance')
    }

    // Check for cartesian products
    if (query.match(/FROM\s+\w+\s*,\s*\w+/i)) {
      optimizations.push('Consider using explicit JOINs instead of comma-separated tables')
    }

    return optimizations
  }

  /**
   * Optimize WHERE clause
   */
  private optimizeWhereClause(query: string): string[] {
    const optimizations: string[] = []
    
    // Check for functions in WHERE clause
    if (query.match(/WHERE\s+.*\w+\(/i)) {
      optimizations.push('Consider avoiding functions in WHERE clause for better index usage')
    }

    // Check for OR conditions
    if (query.match(/WHERE\s+.*\bOR\b/i)) {
      optimizations.push('Consider using UNION instead of OR for better performance')
    }

    // Check for LIKE with leading wildcard
    if (query.match(/WHERE\s+.*LIKE\s+['"]%[^%]/i)) {
      optimizations.push('Avoid leading wildcards in LIKE patterns for better performance')
    }

    return optimizations
  }

  /**
   * Optimize ORDER BY clause
   */
  private optimizeOrderBy(query: string): string[] {
    const optimizations: string[] = []
    
    // Check for multiple ORDER BY columns
    const orderByMatch = query.match(/ORDER BY\s+([^LIMIT]+)/i)
    if (orderByMatch?.[1]) {
      const orderColumns = orderByMatch[1].split(',').length
      if (orderColumns > 3) {
        optimizations.push('Consider reducing ORDER BY columns for better performance')
      }
    }

    return optimizations
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(query: string, options: QueryOptions): string {
    const normalizedQuery = query.toLowerCase().replace(/\s+/g, ' ').trim()
    const optionsHash = JSON.stringify({
      timeout: options.timeout,
      explain: options.explain,
      analyze: options.analyze
    })
    
    return `query_${Buffer.from(normalizedQuery + optionsHash).toString('base64')}`
  }

  /**
   * Get from cache
   */
  private getFromCache(key: string): unknown | null {
    const entry = this.queryCache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl * 1000) {
      this.queryCache.delete(key)
      return null
    }

    // Update hit count
    entry.hitCount++
    
    return entry.result
  }

  /**
   * Set cache
   */
  private setCache(key: string, result: unknown, ttl: number, tags: string[]): void {
    // Clean up cache if it's getting too large
    if (this.queryCache.size >= this.maxCacheSize) {
      this.cleanupCache()
    }

    this.queryCache.set(key, {
      query: key,
      result,
      timestamp: Date.now(),
      ttl,
      hitCount: 0
    })
  }

  /**
   * Clean up cache
   */
  private cleanupCache(): void {
    const entries = Array.from(this.queryCache.entries())
    
    // Sort by hit count (ascending) and timestamp (ascending)
    entries.sort((a, b) => {
      if (a[1].hitCount !== b[1].hitCount) {
        return a[1].hitCount - b[1].hitCount
      }
      return a[1].timestamp - b[1].timestamp
    })

    // Remove bottom 20% of entries
    const toRemove = Math.floor(entries.length * 0.2)
    for (let i = 0; i < toRemove; i++) {
      const entry = entries[i]
      if (entry) {
        this.queryCache.delete(entry[0])
      }
    }
  }

  /**
   * Record query metrics
   */
  private recordMetrics(metrics: QueryMetrics): void {
    this.metrics.push(metrics)
    
    // Clean up old metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory)
    }
  }

  /**
   * Start cache cleanup process
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      this.cleanupCache()
    }, 300000) // Every 5 minutes
  }

  /**
   * Start metrics cleanup process
   */
  private startMetricsCleanup(): void {
    setInterval(() => {
      // Keep only last 24 hours of metrics
      const cutoff = Date.now() - (24 * 60 * 60 * 1000)
      this.metrics = this.metrics.filter(m => m.timestamp > cutoff)
    }, 3600000) // Every hour
  }

  /**
   * Get query performance statistics
   */
  getPerformanceStats(): {
    totalQueries: number
    averageExecutionTime: number
    cacheHitRate: number
    slowQueries: number
    errorRate: number
    topSlowQueries: QueryMetrics[]
  } {
    const totalQueries = this.metrics.length
    const cacheHits = this.metrics.filter(m => m.cacheHit).length
    const errors = this.metrics.filter(m => m.error).length
    const slowQueries = this.metrics.filter(m => m.executionTime > 1000).length

    const averageExecutionTime = totalQueries > 0 
      ? this.metrics.reduce((sum, m) => sum + m.executionTime, 0) / totalQueries 
      : 0

    const cacheHitRate = totalQueries > 0 ? (cacheHits / totalQueries) * 100 : 0
    const errorRate = totalQueries > 0 ? (errors / totalQueries) * 100 : 0

    const topSlowQueries = this.metrics
      .filter(m => m.executionTime > 1000)
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10)

    return {
      totalQueries,
      averageExecutionTime: Math.round(averageExecutionTime),
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      slowQueries,
      errorRate: Math.round(errorRate * 100) / 100,
      topSlowQueries
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number
    hitRate: number
    totalHits: number
    averageHitCount: number
  } {
    const entries = Array.from(this.queryCache.values())
    const totalHits = entries.reduce((sum, entry) => sum + entry.hitCount, 0)
    const averageHitCount = entries.length > 0 ? totalHits / entries.length : 0

    return {
      size: this.queryCache.size,
      hitRate: 0, // Would need to track cache misses separately
      totalHits,
      averageHitCount: Math.round(averageHitCount * 100) / 100
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.queryCache.clear()
    logger.info('Query cache cleared')
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics = []
    logger.info('Query metrics cleared')
  }

  /**
   * Utility function for delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Sanitize query for logging
   */
  private sanitizeQuery(query: string): string {
    // Remove sensitive data and limit length
    return query
      .replace(/password\s*=\s*['"][^'"]*['"]/gi, "password='***'")
      .replace(/token\s*=\s*['"][^'"]*['"]/gi, "token='***'")
      .substring(0, 200) + (query.length > 200 ? '...' : '')
  }
}

// Global query optimizer instance
let queryOptimizer: AdvancedQueryOptimizer | null = null

/**
 * Get or create query optimizer instance
 */
export function getQueryOptimizer(): AdvancedQueryOptimizer {
  if (!queryOptimizer) {
    queryOptimizer = new AdvancedQueryOptimizer()
  }
  return queryOptimizer
}

export default AdvancedQueryOptimizer
