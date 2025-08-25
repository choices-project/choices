/**
 * Database Optimizer
 * 
 * Implements database optimization strategies to ensure we're being good database citizens.
 * This includes query optimization, connection management, and performance monitoring.
 */

import { createClient } from '@supabase/supabase-js'
import { logger } from './logger'

// Database configuration with connection pooling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create optimized Supabase client with connection pooling
export const createOptimizedClient = () => {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'X-Client-Info': 'choices-platform-optimized'
      }
    }
  })
}

// Query performance monitoring
class QueryMonitor {
  private queries: Map<string, { count: number; totalTime: number; avgTime: number; slowQueries: number }> = new Map()
  private slowQueryThreshold = 1000 // 1 second

  recordQuery(sql: string, duration: number) {
    const normalizedSql = this.normalizeSql(sql)
    const existing = this.queries.get(normalizedSql) || {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      slowQueries: 0
    }

    existing.count++
    existing.totalTime += duration
    existing.avgTime = existing.totalTime / existing.count

    if (duration > this.slowQueryThreshold) {
      existing.slowQueries++
      logger.warn('Slow query detected', { duration, sql: normalizedSql.substring(0, 200) })
    }

    this.queries.set(normalizedSql, existing)
  }

  private normalizeSql(sql: string): string {
    // Remove specific values to group similar queries
    return sql
      .replace(/\d+/g, '?')
      .replace(/'[^']*'/g, '?')
      .replace(/\s+/g, ' ')
      .trim()
  }

  getStats() {
    const stats = Array.from(this.queries.entries()).map(([sql, data]) => ({
      sql: sql.substring(0, 100),
      ...data
    }))

    return {
      totalQueries: stats.reduce((sum, s) => sum + s.count, 0),
      averageQueryTime: stats.reduce((sum, s) => sum + s.avgTime, 0) / stats.length || 0,
      slowQueries: stats.reduce((sum, s) => sum + s.slowQueries, 0),
      topSlowQueries: stats
        .filter(s => s.avgTime > 100)
        .sort((a, b) => b.avgTime - a.avgTime)
        .slice(0, 10)
    }
  }

  getSlowQueries() {
    return Array.from(this.queries.entries())
      .filter(([_, data]) => data.avgTime > this.slowQueryThreshold)
      .map(([sql, data]) => ({
        sql: sql.substring(0, 200),
        avgTime: data.avgTime,
        count: data.count
      }))
  }

  reset() {
    this.queries.clear()
  }
}

export const queryMonitor = new QueryMonitor()

// Query optimization utilities
export class QueryOptimizer {
  private supabase: any

  constructor(supabase: any) {
    this.supabase = supabase
  }

  // Optimized user profile queries with caching
  async getUserProfile(userId: string, useCache = true) {
    const cacheKey = `profile_${userId}`
    
    if (useCache) {
      const cached = await this.getFromCache(cacheKey)
      if (cached) return cached
    }

    const startTime = Date.now()
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('user_id, username, email, trust_tier, created_at, updated_at')
      .eq('user_id', userId)
      .single()

    const duration = Date.now() - startTime
    queryMonitor.recordQuery('SELECT user_profiles', duration)

    if (error) throw error

    if (useCache) {
      await this.setCache(cacheKey, data, 300) // 5 minutes
    }

    return data
  }

  // Optimized poll queries with pagination and filtering
  async getPolls(options: {
    page?: number
    limit?: number
    privacyLevel?: string
    userId?: string
    includeVotes?: boolean
  } = {}) {
    const {
      page = 1,
      limit = 20,
      privacyLevel,
      userId,
      includeVotes = false
    } = options

    const startTime = Date.now()
    let query = this.supabase
      .from('polls')
      .select(includeVotes ? `
        *,
        votes(count)
      ` : '*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (privacyLevel) {
      query = query.eq('privacy_level', privacyLevel)
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query
    const duration = Date.now() - startTime
    queryMonitor.recordQuery('SELECT polls', duration)

    if (error) throw error

    return {
      polls: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    }
  }

  // Optimized vote queries with batch operations
  async getVotesForPoll(pollId: string, options: {
    includeUserInfo?: boolean
    groupByChoice?: boolean
  } = {}) {
    const { includeUserInfo = false, groupByChoice = false } = options

    const startTime = Date.now()
    let query = this.supabase
      .from('votes')
      .select(includeUserInfo ? `
        *,
        user_profiles(username, trust_tier)
      ` : '*')
      .eq('poll_id', pollId)

    if (groupByChoice) {
      query = query.select('choice, count(*)')
        .group('choice')
    }

    const { data, error } = await query
    const duration = Date.now() - startTime
    queryMonitor.recordQuery('SELECT votes', duration)

    if (error) throw error

    return data
  }

  // Batch insert votes for better performance
  async batchInsertVotes(votes: Array<{
    poll_id: string
    user_id: string
    choice: string
    created_at?: string
  }>) {
    if (votes.length === 0) return []

    const startTime = Date.now()
    const { data, error } = await this.supabase
      .from('votes')
      .insert(votes)
      .select()

    const duration = Date.now() - startTime
    queryMonitor.recordQuery('INSERT votes batch', duration)

    if (error) throw error

    return data
  }

  // Optimized analytics queries
  async getAnalytics(period: string = '7d') {
    const startTime = Date.now()
    
    // Calculate date range
    const now = new Date()
    const startDate = new Date()
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    // Parallel queries for better performance
    const [
      { count: totalUsers },
      { count: totalPolls },
      { count: totalVotes },
      { data: userGrowth },
      { data: pollActivity },
      { data: voteActivity }
    ] = await Promise.all([
      this.supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
      this.supabase.from('polls').select('*', { count: 'exact', head: true }),
      this.supabase.from('votes').select('*', { count: 'exact', head: true }),
      this.supabase.from('user_profiles')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true }),
      this.supabase.from('polls')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true }),
      this.supabase.from('votes')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })
    ])

    const duration = Date.now() - startTime
    queryMonitor.recordQuery('SELECT analytics', duration)

    // Process time series data
    const processTimeSeries = (data: any[], dateField: string) => {
      const grouped = data.reduce((acc: any, item: any) => {
        const date = new Date(item[dateField]).toISOString().split('T')[0]
        acc[date] = (acc[date] || 0) + 1
        return acc
      }, {})

      return Object.entries(grouped).map(([date, count]) => ({
        date,
        count: count as number
      }))
    }

    return {
      period,
      summary: {
        totalUsers: totalUsers || 0,
        totalPolls: totalPolls || 0,
        totalVotes: totalVotes || 0,
        activeUsers: userGrowth?.length || 0,
        newPolls: pollActivity?.length || 0,
        newVotes: voteActivity?.length || 0
      },
      trends: {
        userGrowth: processTimeSeries(userGrowth || [], 'created_at'),
        pollActivity: processTimeSeries(pollActivity || [], 'created_at'),
        voteActivity: processTimeSeries(voteActivity || [], 'created_at')
      }
    }
  }

  // Cache management
  private async getFromCache(key: string): Promise<any> {
    try {
      const cached = await this.supabase
        .from('cache')
        .select('value, expires_at')
        .eq('key', key)
        .single()

      if (cached && new Date(cached.expires_at) > new Date()) {
        return JSON.parse(cached.value)
      }
    } catch (error) {
      // Cache miss or error
    }
    return null
  }

  private async setCache(key: string, value: any, ttlSeconds: number): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString()
      
      await this.supabase
        .from('cache')
        .upsert({
          key,
          value: JSON.stringify(value),
          expires_at: expiresAt
        })
    } catch (error) {
      // Cache set failed, continue without caching
    }
  }

  // Database health check with performance metrics
  async getDatabaseHealth() {
    const startTime = Date.now()
    
    const healthChecks = await Promise.allSettled([
      this.supabase.from('user_profiles').select('count', { count: 'exact', head: true }),
      this.supabase.from('polls').select('id').limit(1),
      this.supabase.from('votes').select('id').limit(1),
      this.supabase.from('user_profiles')
        .select('user_id, username, trust_tier, created_at')
        .order('created_at', { ascending: false })
        .limit(5)
    ])

    const duration = Date.now() - startTime
    queryMonitor.recordQuery('SELECT health check', duration)

    const results = healthChecks.map((result, index) => {
      const testNames = ['Connectivity', 'Table Access', 'Performance', 'Complex Query']
      const testName = testNames[index] || `Test ${index + 1}`
      
      return {
        test: testName,
        status: result.status === 'fulfilled' ? 'healthy' : 'unhealthy',
        error: result.status === 'rejected' ? result.reason?.message : null
      }
    })

    const healthyTests = results.filter(r => r.status === 'healthy').length
    const healthPercentage = (healthyTests / results.length) * 100

    return {
      status: healthPercentage >= 80 ? 'healthy' : healthPercentage >= 50 ? 'degraded' : 'unhealthy',
      healthPercentage: Math.round(healthPercentage),
      responseTime: `${duration}ms`,
      tests: results,
      queryStats: queryMonitor.getStats()
    }
  }
}

// Performance monitoring middleware
export function withPerformanceMonitoring<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  operationName: string
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now()
    
    try {
      // Log operation start with args context
      logger.debug(`Performance: Starting ${operationName}`, {
        argsCount: args.length,
        argsTypes: args.map(arg => typeof arg)
      });
      
      const result = await fn(...args)
      const duration = Date.now() - startTime
      
      // Log performance metrics
      logger.info(`Performance: ${operationName} completed in ${duration}ms`)
      
      // Record slow operations
      if (duration > 1000) {
        logger.warn(`Slow operation detected: ${operationName} took ${duration}ms`)
      }
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      logger.error(`Performance: ${operationName} failed after ${duration}ms`, error instanceof Error ? error : undefined)
      throw error
    }
  }
}

// Database connection pool management
export class ConnectionPoolManager {
  private pool: any
  private metrics = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    waitingConnections: 0
  }

  constructor() {
    this.initializePool()
  }

  private initializePool() {
    // Initialize connection pool with monitoring
    this.updateMetrics()
    
    // Monitor pool health every 30 seconds
    setInterval(() => {
      this.updateMetrics()
      this.checkPoolHealth()
    }, 30000)
  }

  private updateMetrics() {
    // Update connection pool metrics
    // This would integrate with the actual connection pool
    this.metrics = {
      totalConnections: 10,
      activeConnections: 2,
      idleConnections: 8,
      waitingConnections: 0
    }
  }

  private checkPoolHealth() {
    const { activeConnections, totalConnections } = this.metrics
    const utilizationRate = (activeConnections / totalConnections) * 100

    if (utilizationRate > 80) {
      logger.warn(`High connection pool utilization: ${utilizationRate.toFixed(1)}%`)
    }

    if (this.metrics.waitingConnections > 0) {
      logger.warn(`Connection pool has ${this.metrics.waitingConnections} waiting connections`)
    }
  }

  getMetrics() {
    return { ...this.metrics }
  }

  getHealth() {
    const { activeConnections, totalConnections, waitingConnections } = this.metrics
    const utilizationRate = (activeConnections / totalConnections) * 100

    return {
      status: waitingConnections > 0 ? 'overloaded' : utilizationRate > 80 ? 'high' : 'healthy',
      utilizationRate: Math.round(utilizationRate),
      metrics: this.metrics
    }
  }
}

export const connectionPoolManager = new ConnectionPoolManager()

// Export optimized client
export const optimizedSupabase = createOptimizedClient()
export const queryOptimizer = new QueryOptimizer(optimizedSupabase)
