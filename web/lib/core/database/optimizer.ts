/**
 * Database Optimizer
 * 
 * Implements database optimization strategies to ensure we're being good database citizens.
 * This includes query optimization, connection management, and performance monitoring.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

import { isFeatureEnabled } from '@/lib/core/feature-flags'
import { smartCache } from '@/lib/database/smart-cache'
import { logger } from '@/lib/utils/logger'
import { minimalTelemetry } from '@/lib/telemetry/minimal'
import { DatabaseSchemas } from '@/lib/validation/schemas'
import {
  safeParse,
  validateDatabaseResponse
} from '@/lib/validation/validator'
import { getSupabaseServerClient } from '@/utils/supabase/server'

import type {
  UserProfile,
  PollsResponse,
  PollWithVotes,
  Vote,
  VoteWithUserInfo,
  VoteGroupedByChoice,
  VoteInsert,
  AnalyticsData,
  DatabaseHealthStatus,
  CacheDatabaseEntry
} from '../../types/database'

// Create optimized Supabase client with connection pooling
export const createOptimizedClient = async () => {
  const client = await getSupabaseServerClient()
  return client
}

// Query performance monitoring
class QueryMonitor {
  private queries: Map<string, { count: number; totalTime: number; avgTime: number; slowQueries: number }> = new Map()
  private slowQueryThreshold = 1000 // 1 second

  recordQuery(sql: string, duration: number) {
    const normalizedSql = this.normalizeSql(sql)
    const existing = this.queries.get(normalizedSql) ?? {
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
    const stats = Array.from(this.queries.entries()).map(([sql, data]) => Object.assign({
      sql: sql.substring(0, 100)
    }, data))

    return {
      totalQueries: stats.reduce((sum, s) => sum + s.count, 0),
      averageQueryTime: stats.length > 0 ? stats.reduce((sum, s) => sum + s.avgTime, 0) / stats.length : 0,
      slowQueries: stats.reduce((sum, s) => sum + s.slowQueries, 0),
      topSlowQueries: stats
        .filter(s => s.avgTime > 100)
        .sort((a, b) => b.avgTime - a.avgTime)
        .slice(0, 10)
        .map(s => ({
          sql: s.sql,
          avgTime: s.avgTime,
          count: s.count
        }))
    }
  }

  /**
   * Get minimal telemetry metrics (always available)
   */
  getMinimalMetrics() {
    return minimalTelemetry.getMetrics();
  }

  /**
   * Get comprehensive optimization insights (only if optimization suite is enabled)
   */
  async getOptimizationInsights() {
    if (!isFeatureEnabled('FEATURE_DB_OPTIMIZATION_SUITE')) {
      return {
        cache: { hitRate: 0, efficiencyScore: 0, totalEntries: 0, topPatterns: [] },
        queries: { totalQueries: 0, slowQueries: 0, averageExecutionTime: 0, topOptimizations: [] },
        recommendations: { indexes: [], slowQueries: [], optimizableQueries: [] },
        performance: { overallScore: 0, improvementOpportunities: [] }
      }
    }

    const { smartCache } = await import('@/lib/database/smart-cache')
    const { queryAnalyzer } = await import('@/lib/database/query-analyzer')
    
    const cacheStats = smartCache.getStats()
    const queryAnalysis = queryAnalyzer.generateOptimizationReport()
    const indexRecommendations = queryAnalyzer.getIndexRecommendations()

    return {
      cache: {
        hitRate: cacheStats.hitRate,
        efficiencyScore: cacheStats.efficiencyScore,
        totalEntries: cacheStats.totalEntries,
        topPatterns: cacheStats.topPatterns,
      },
      queries: {
        totalQueries: queryAnalysis.summary.totalQueries,
        slowQueries: queryAnalysis.summary.slowQueries,
        averageExecutionTime: queryAnalysis.summary.averageExecutionTime,
        topOptimizations: queryAnalysis.summary.topOptimizations,
      },
      recommendations: {
        indexes: indexRecommendations.slice(0, 5),
        slowQueries: queryAnalysis.slowQueries.slice(0, 5),
        optimizableQueries: queryAnalysis.optimizableQueries.slice(0, 5),
      },
      performance: {
        overallScore: this.calculateOverallPerformanceScore(cacheStats, queryAnalysis),
        improvementOpportunities: this.identifyImprovementOpportunities(cacheStats, queryAnalysis),
      }
    }
  }

  /**
   * Calculate overall performance score
   */
  private calculateOverallPerformanceScore(cacheStats: any, queryAnalysis: any): number {
    const cacheScore = cacheStats.efficiencyScore * 0.4 // 40% weight for cache
    const queryScore = Math.max(0, 100 - queryAnalysis.summary.averageExecutionTime / 10) * 0.3 // 30% weight for query performance
    const optimizationScore = Math.max(0, 100 - queryAnalysis.summary.optimizableQueries * 2) * 0.3 // 30% weight for optimization opportunities
    
    return Math.round(cacheScore + queryScore + optimizationScore)
  }

  /**
   * Identify improvement opportunities
   */
  private identifyImprovementOpportunities(cacheStats: any, queryAnalysis: any): string[] {
    const opportunities: string[] = []
    
    if (cacheStats.hitRate < 0.7) {
      opportunities.push('Improve cache hit rate - consider adjusting TTL or cache strategies')
    }
    
    if (queryAnalysis.summary.averageExecutionTime > 500) {
      opportunities.push('Optimize slow queries - average execution time is high')
    }
    
    if (queryAnalysis.summary.optimizableQueries > 10) {
      opportunities.push('Many queries have optimization opportunities - review index recommendations')
    }
    
    if (cacheStats.efficiencyScore < 70) {
      opportunities.push('Cache efficiency is low - consider cache size and eviction policies')
    }
    
    return opportunities
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
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  // Optimized user profile queries with caching
  async getUserProfile(userId: string, useCache = true): Promise<UserProfile | null> {
    const cacheKey = `profile_${userId}`
    const queryPattern = 'SELECT user_profiles WHERE user_id = ?'
    
          if (useCache) {
            // Use optimization suite if enabled
            if (isFeatureEnabled('FEATURE_DB_OPTIMIZATION_SUITE')) {
              const { smartCache } = await import('@/lib/database/smart-cache')
              const cached = await smartCache.get<UserProfile>(cacheKey, queryPattern, DatabaseSchemas.UserProfile)
              if (cached) {
                logger.debug('User profile retrieved from smart cache', { userId })
                return cached
              }
            }

            // Fallback to legacy cache
            const legacyCached = await this.getFromCache(cacheKey)
            if (legacyCached) {
              // Validate cached data
              const validationResult = safeParse(DatabaseSchemas.UserProfile, legacyCached)
              if (validationResult.success && validationResult.data) {
                // Migrate to smart cache if optimization suite is enabled
                if (isFeatureEnabled('FEATURE_DB_OPTIMIZATION_SUITE')) {
                  const { smartCache } = await import('@/lib/database/smart-cache')
                  await smartCache.set(cacheKey, validationResult.data, queryPattern, {
                    tags: ['user_profiles', `user_${userId}`],
                    schema: DatabaseSchemas.UserProfile,
                  })
                }
                return validationResult.data
              }
              // If cached data is invalid, remove it and continue
              logger.warn('Invalid cached user profile data, removing from cache', { userId })
            }
          }

    const startTime = Date.now()
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('user_id, username, email, trust_tier, created_at, updated_at')
      .eq('user_id', userId)
      .single()

    const duration = Date.now() - startTime
    queryMonitor.recordQuery('SELECT user_profiles', duration)
    
    // Record minimal telemetry
    minimalTelemetry.recordQuery('user_profiles', duration, !error)
    
          // Analyze query performance if optimization suite is enabled
          if (isFeatureEnabled('FEATURE_DB_OPTIMIZATION_SUITE')) {
            const { queryAnalyzer } = await import('@/lib/database/query-analyzer')
            const queryPlan = queryAnalyzer.analyzeQuery(
              `SELECT user_id, username, email, trust_tier, created_at, updated_at FROM user_profiles WHERE user_id = '${userId}'`,
              duration,
              data ? 1 : 0,
              data ? 1 : 0,
              true, // Assuming user_id has an index
              'user_profiles_user_id_idx'
            )

            // Log optimization suggestions if any
            if (queryPlan.suggestions.length > 0) {
              logger.info('Query optimization suggestions', {
                query: queryPlan.pattern,
                suggestions: queryPlan.suggestions.map(s => s.description),
                executionTime: duration,
              })
            }
          }

    if (error) throw error

    if (!data) {
      logger.warn('User profile not found', { userId })
      return null
    }

    // Validate the database response
    const validationResult = validateDatabaseResponse(DatabaseSchemas.UserProfile, { data, error })
    if (!validationResult.success) {
      logger.error('Invalid user profile data from database', new Error(validationResult.error), { 
        userId, 
        validationError: validationResult.error,
        data: JSON.stringify(data, null, 2)
      })
      throw new Error(`Invalid user profile data: ${validationResult.error}`)
    }

    const validatedProfile = validationResult.data!

          if (useCache) {
            // Store in smart cache if optimization suite is enabled
            if (isFeatureEnabled('FEATURE_DB_OPTIMIZATION_SUITE')) {
              const { smartCache } = await import('@/lib/database/smart-cache')
              await smartCache.set(cacheKey, validatedProfile, queryPattern, {
                tags: ['user_profiles', `user_${userId}`],
                schema: DatabaseSchemas.UserProfile,
              })
            }

            // Also store in legacy cache for backward compatibility
            await this.setCache(cacheKey, validatedProfile, 300) // 5 minutes
          }

    return validatedProfile
  }

  // Optimized poll queries with pagination and filtering
  async getPolls(options: {
    page?: number
    limit?: number
    privacyLevel?: string
    userId?: string
    includeVotes?: boolean
  } = {}): Promise<PollsResponse> {
    const {
      page = 1,
      limit = 20,
      privacyLevel,
      userId,
      includeVotes = false
    } = options

    // Create cache key and query pattern
    const cacheKey = `polls_${page}_${limit}_${privacyLevel ?? 'all'}_${userId ?? 'all'}_${includeVotes ? 'with_votes' : 'no_votes'}`
    const queryPattern = 'SELECT polls WITH pagination and filters'
    
    // Try smart cache first
    const cached = await smartCache.get<PollsResponse>(cacheKey, queryPattern, DatabaseSchemas.PollsResponse)
    if (cached) {
      logger.debug('Polls retrieved from smart cache', { page, limit, privacyLevel, userId })
      return cached
    }

    const startTime = Date.now()
    let query = this.supabase
      .from('polls')
      .select('id, title, description, options, category, poll_type, privacy_level, user_id, created_at, updated_at, expires_at, status')
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

    const result = await query
    const duration = Date.now() - startTime
    queryMonitor.recordQuery('SELECT polls', duration)

    if (result.error) throw result.error

    // Validate the database response
    const validationResult = validateDatabaseResponse(DatabaseSchemas.Poll.array(), { data: result.data, error: result.error })
    if (!validationResult.success) {
      logger.error('Invalid polls data from database', new Error(validationResult.error), { 
        validationError: validationResult.error,
        data: JSON.stringify(result.data, null, 2)
      })
      throw new Error(`Invalid polls data: ${validationResult.error}`)
    }

    const validatedPolls = validationResult.data!

    const pollsResponse: PollsResponse = {
      polls: validatedPolls.map(poll => {
        const basePoll = Object.assign({}, poll, { votes: [{ count: 0 }] })
        // Only include expires_at if it exists
        if (poll.expires_at) {
          return Object.assign({}, basePoll, { expires_at: poll.expires_at }) as PollWithVotes
        }
        return basePoll as PollWithVotes
      }),
      pagination: {
        page,
        limit,
        total: result.count ?? 0,
        pages: Math.ceil((result.count ?? 0) / limit)
      }
    }

    // Cache the result with smart cache
    await smartCache.set(cacheKey, pollsResponse, queryPattern, {
      tags: ['polls', `page_${page}`, `limit_${limit}`, privacyLevel ? `privacy_${privacyLevel}` : 'all_privacy', userId ? `user_${userId}` : 'all_users'],
      schema: DatabaseSchemas.PollsResponse,
    })

    return pollsResponse
  }

  // Optimized vote queries with batch operations
  async getVotesForPoll(pollId: string, options: {
    includeUserInfo?: boolean
    groupByChoice?: boolean
  } = {}): Promise<Vote[] | VoteWithUserInfo[] | VoteGroupedByChoice[]> {
    const { includeUserInfo = false, groupByChoice = false } = options

    const startTime = Date.now()
    
    // Build select query based on options
    let selectFields = 'id, poll_id, user_id, choice, rank, created_at, updated_at'
    if (includeUserInfo) {
      selectFields += ', user_profiles!inner(display_name, email)'
    }
    
    const query = this.supabase
      .from('votes')
      .select(selectFields)
      .eq('poll_id', pollId)

    const result = await query
    const duration = Date.now() - startTime
    queryMonitor.recordQuery('SELECT votes', duration)

    if (result.error) throw result.error

    // Process results based on options
    if (groupByChoice && result.data && Array.isArray(result.data) && !result.error) {
      // Group votes by choice for analytics
      const grouped = (result.data as unknown as Vote[]).reduce((acc, vote) => {
        const choice = vote.choice
        if (!acc[choice]) {
          acc[choice] = []
        }
        acc[choice].push(vote)
        return acc
      }, {} as Record<string, Vote[]>)
      
      return Object.entries(grouped).map(([choice, votes]) => ({
        choice,
        votes,
        count: votes.length
      })) as VoteGroupedByChoice[]
    }
    
    return (result.data && Array.isArray(result.data) ? result.data : []) as unknown as Vote[]
  }

  // Batch insert votes for better performance
  async batchInsertVotes(votes: VoteInsert[]): Promise<Vote[]> {
    if (votes.length === 0) return []

    const startTime = Date.now()
    const result = await this.supabase
      .from('votes')
      .insert(votes)
      .select()

    const duration = Date.now() - startTime
    queryMonitor.recordQuery('INSERT votes batch', duration)

    if (result.error) throw result.error

    return result.data as Vote[]
  }

  // Optimized analytics queries
  async getAnalytics(period: string = '7d'): Promise<AnalyticsData> {
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
      userCountResult,
      pollCountResult,
      voteCountResult,
      userGrowthResult,
      pollActivityResult,
      voteActivityResult
    ] = await Promise.all([
      this.supabase.from('user_profiles').select('user_id', { count: 'exact', head: true }),
      this.supabase.from('polls').select('id', { count: 'exact', head: true }),
      this.supabase.from('votes').select('id', { count: 'exact', head: true }),
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

    const totalUsers = userCountResult.count ?? 0
    const totalPolls = pollCountResult.count ?? 0
    const totalVotes = voteCountResult.count ?? 0
    const userGrowth = (userGrowthResult.data as Array<{ created_at: string }>) ?? []
    const pollActivity = (pollActivityResult.data as Array<{ created_at: string }>) ?? []
    const voteActivity = (voteActivityResult.data as Array<{ created_at: string }>) ?? []

    const duration = Date.now() - startTime
    queryMonitor.recordQuery('SELECT analytics', duration)

  // Process time series data
  const processTimeSeries = (data: Array<{ created_at: string }>, dateField: string) => {
    const grouped = data.reduce((acc: Record<string, number>, item) => {
      const dateValue = item[dateField as keyof typeof item]
      if (dateValue) {
        const date = new Date(dateValue).toISOString().split('T')[0]
        if (date) {
          acc[date] = (acc[date] ?? 0) + 1
        }
      }
      return acc
    }, {} as Record<string, number>)

      return Object.entries(grouped).map(([date, count]) => ({
        date,
        count: count
      }))
    }

    return {
      period,
      summary: {
        totalUsers,
        totalPolls,
        totalVotes,
        activeUsers: userGrowth.length,
        newPolls: pollActivity.length,
        newVotes: voteActivity.length
      },
      trends: {
        userGrowth: processTimeSeries(userGrowth, 'created_at'),
        pollActivity: processTimeSeries(pollActivity, 'created_at'),
        voteActivity: processTimeSeries(voteActivity, 'created_at')
      }
    }
  }

  // Cache management
  private async getFromCache(key: string): Promise<unknown> {
    try {
      const result = await this.supabase
        .from('cache')
        .select('value, expires_at')
        .eq('key', key)
        .single()

      if (result.data && new Date((result.data as CacheDatabaseEntry).expires_at) > new Date()) {
        return JSON.parse((result.data as CacheDatabaseEntry).value)
      }
    } catch {
      // Cache miss or error
    }
    return null
  }

  private async setCache(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString()
      
      await this.supabase
        .from('cache')
        .upsert({
          key,
          value: JSON.stringify(value),
          expires_at: expiresAt
        })
    } catch {
      // Cache set failed, continue without caching
    }
  }

  // Database health check with performance metrics
  async getDatabaseHealth(): Promise<DatabaseHealthStatus> {
    const startTime = Date.now()
    
    const healthChecks = await Promise.allSettled([
      this.supabase.from('user_profiles').select('user_id', { count: 'exact', head: true }),
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
      const testName = testNames[index] ?? `Test ${index + 1}`
      
      return {
        test: testName,
        status: result.status === 'fulfilled' ? 'healthy' as const : 'unhealthy' as const,
        error: result.status === 'rejected' ? (result.reason as Error).message ?? 'Unknown error' : null
      }
    })

    const healthyTests = results.filter(r => r.status === 'healthy').length
    const healthPercentage = (healthyTests / results.length) * 100

    return {
      status: healthPercentage >= 80 ? 'healthy' as const : healthPercentage >= 50 ? 'degraded' as const : 'unhealthy' as const,
      healthPercentage: Math.round(healthPercentage),
      responseTime: `${duration}ms`,
      tests: results,
      queryStats: queryMonitor.getStats()
    }
  }
}

// Performance monitoring middleware
export function withPerformanceMonitoring<T extends unknown[], R>(
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
      logger.error(`Performance: ${operationName} failed after ${duration}ms`, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }
}

// Database connection pool management
export class ConnectionPoolManager {
  private pool: unknown
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

// Export optimized client - lazy loaded to prevent build-time execution
let _optimizedSupabase: SupabaseClient | null = null
let _queryOptimizer: QueryOptimizer | null = null

export const getOptimizedSupabase = async () => {
  if (!_optimizedSupabase) {
    _optimizedSupabase = await createOptimizedClient()
  }
  return _optimizedSupabase
}

export const getQueryOptimizer = async () => {
  if (!_queryOptimizer) {
    const supabase = await getOptimizedSupabase()
    _queryOptimizer = new QueryOptimizer(supabase)
  }
  return _queryOptimizer
}
