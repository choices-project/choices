/**
 * Database Performance Monitor
 * 
 * Implements comprehensive database performance monitoring, alerting,
 * and optimization recommendations for the Choices platform.
 * 
 * Created: September 15, 2025
 * Agent D - Database Specialist
 */

import { logger } from '@/lib/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

// Performance metrics interfaces
export type DatabaseMetrics = {
  connectionCount: number
  activeConnections: number
  idleConnections: number
  queryCount: number
  averageQueryTime: number
  slowQueries: number
  errorCount: number
  cacheHitRate: number
  memoryUsage: number
  diskUsage: number
  cpuUsage: number
  timestamp: number
}

export type QueryPerformanceMetrics = {
  query: string
  executionTime: number
  rowsReturned: number
  cacheHit: boolean
  error?: string
  timestamp: number
}

export type PerformanceAlert = {
  id: string
  type: 'warning' | 'error' | 'critical'
  message: string
  metric: string
  value: number
  threshold: number
  timestamp: number
  resolved: boolean
}

export type PerformanceRecommendation = {
  id: string
  type: 'index' | 'query' | 'configuration' | 'maintenance'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  impact: string
  effort: 'low' | 'medium' | 'high'
  estimatedImprovement: number
  timestamp: number
}

// Performance thresholds
export type PerformanceThresholds = {
  slowQueryThreshold: number // milliseconds
  errorRateThreshold: number // percentage
  connectionUtilizationThreshold: number // percentage
  memoryUsageThreshold: number // percentage
  diskUsageThreshold: number // percentage
  cacheHitRateThreshold: number // percentage
}

/**
 * Database Performance Monitor
 * 
 * Monitors database performance, generates alerts, and provides optimization recommendations.
 */
export class DatabasePerformanceMonitor {
  private supabase!: SupabaseClient
  private metrics: DatabaseMetrics[] = []
  private queryMetrics: QueryPerformanceMetrics[] = []
  private alerts: PerformanceAlert[] = []
  private recommendations: PerformanceRecommendation[] = []
  
  private thresholds: PerformanceThresholds = {
    slowQueryThreshold: 1000, // 1 second
    errorRateThreshold: 5, // 5%
    connectionUtilizationThreshold: 80, // 80%
    memoryUsageThreshold: 85, // 85%
    diskUsageThreshold: 90, // 90%
    cacheHitRateThreshold: 80 // 80%
  }
  
  private monitoringInterval: NodeJS.Timeout | null = null
  private alertCheckInterval: NodeJS.Timeout | null = null
  private recommendationInterval: NodeJS.Timeout | null = null
  private isMonitoring: boolean = false

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    this.thresholds = { ...this.thresholds, ...thresholds }
    this.initializeSupabase()
  }

  /**
   * Initialize Supabase client
   */
  private async initializeSupabase(): Promise<void> {
    try {
      this.supabase = await getSupabaseServerClient()
    } catch (error) {
      logger.error('Failed to initialize Supabase client for performance monitoring', error instanceof Error ? error : new Error('Unknown error'))
      throw error
    }
  }

  /**
   * Start performance monitoring
   */
  async startMonitoring(intervalMs: number = 60000): Promise<void> {
    if (this.isMonitoring) {
      logger.warn('Performance monitoring already started')
      return
    }

    this.isMonitoring = true
    
    // Start metrics collection
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectMetrics()
      } catch (error) {
        logger.error('Error collecting performance metrics', error instanceof Error ? error : new Error('Unknown error'))
      }
    }, intervalMs)
    
    // Start alert checking
    this.alertCheckInterval = setInterval(() => {
      this.checkAlerts()
    }, 30000) // Check every 30 seconds
    
    // Start recommendation generation
    this.recommendationInterval = setInterval(() => {
      this.generateRecommendations()
    }, 300000) // Generate every 5 minutes
    
    // Collect initial metrics
    await this.collectMetrics()
    
    logger.info('Database performance monitoring started', { intervalMs })
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return
    }

    this.isMonitoring = false
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    
    if (this.alertCheckInterval) {
      clearInterval(this.alertCheckInterval)
      this.alertCheckInterval = null
    }
    
    if (this.recommendationInterval) {
      clearInterval(this.recommendationInterval)
      this.recommendationInterval = null
    }
    
    logger.info('Database performance monitoring stopped')
  }

  /**
   * Collect performance metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      const startTime = Date.now()
      
      // Collect database metrics
      const dbMetrics = await this.getDatabaseMetrics()
      
      // Collect query performance metrics
      const queryMetrics = await this.getQueryPerformanceMetrics()
      
      // Collect system metrics
      const systemMetrics = await this.getSystemMetrics()
      
      const metrics: DatabaseMetrics = {
        connectionCount: dbMetrics.connectionCount || 0,
        activeConnections: dbMetrics.activeConnections || 0,
        idleConnections: dbMetrics.idleConnections || 0,
        queryCount: dbMetrics.queryCount || 0,
        averageQueryTime: dbMetrics.averageQueryTime || 0,
        slowQueries: dbMetrics.slowQueries || 0,
        errorCount: dbMetrics.errorCount || 0,
        cacheHitRate: dbMetrics.cacheHitRate || 0,
        memoryUsage: systemMetrics.memoryUsage || 0,
        diskUsage: systemMetrics.diskUsage || 0,
        cpuUsage: systemMetrics.cpuUsage || 0,
        timestamp: Date.now()
      }
      
      this.metrics.push(metrics)
      
      // Keep only last 24 hours of metrics
      const cutoff = Date.now() - (24 * 60 * 60 * 1000)
      this.metrics = this.metrics.filter(m => m.timestamp > cutoff)
      
      // Add query metrics
      this.queryMetrics.push(...queryMetrics)
      this.queryMetrics = this.queryMetrics.filter(m => m.timestamp > cutoff)
      
      const collectionTime = Date.now() - startTime
      logger.debug('Performance metrics collected', { 
        collectionTime,
        metricsCount: this.metrics.length,
        queryMetricsCount: this.queryMetrics.length
      })
      
    } catch (error) {
      logger.error('Error collecting performance metrics', error instanceof Error ? error : new Error('Unknown error'))
    }
  }

  /**
   * Get database-specific metrics
   */
  private async getDatabaseMetrics(): Promise<Partial<DatabaseMetrics>> {
    try {
      // Get connection metrics
      const { data: connectionData } = await this.supabase
        .rpc('get_connection_metrics')
        .single()
      
      // Get query metrics
      const { data: queryData } = await this.supabase
        .rpc('get_query_metrics')
        .single()
      
      // Get cache metrics
      const { data: cacheData } = await this.supabase
        .rpc('get_cache_metrics')
        .single()
      
      return {
        connectionCount: (connectionData as { total_connections?: number }).total_connections || 0,
        activeConnections: (connectionData as { active_connections?: number }).active_connections || 0,
        idleConnections: (connectionData as { idle_connections?: number }).idle_connections || 0,
        queryCount: (queryData as { total_queries?: number }).total_queries || 0,
        averageQueryTime: (queryData as { avg_query_time?: number }).avg_query_time || 0,
        slowQueries: (queryData as { slow_queries?: number }).slow_queries || 0,
        errorCount: (queryData as { error_count?: number }).error_count || 0,
        cacheHitRate: (cacheData as { hit_rate?: number }).hit_rate || 0
      }
    } catch (error) {
      logger.warn('Failed to get database metrics', error instanceof Error ? error : new Error('Unknown error'))
      return {}
    }
  }

  /**
   * Get query performance metrics
   */
  private async getQueryPerformanceMetrics(): Promise<QueryPerformanceMetrics[]> {
    try {
      const { data } = await this.supabase
        .rpc('get_slow_queries', { threshold_ms: this.thresholds.slowQueryThreshold })
        .limit(10)
      
      return (data || []).map((query: Record<string, unknown>) => ({
        query: query.query_text as string,
        executionTime: query.mean_time as number,
        rowsReturned: query.rows as number,
        cacheHit: (query.cache_hit as boolean) || false,
        timestamp: Date.now()
      }))
    } catch (error) {
      logger.warn('Failed to get query performance metrics', error instanceof Error ? error : new Error('Unknown error'))
      return []
    }
  }

  /**
   * Get system metrics
   */
  private async getSystemMetrics(): Promise<Partial<DatabaseMetrics>> {
    try {
      // Get system information
      const { data } = await this.supabase
        .rpc('get_system_metrics')
        .single()
      
      return {
        memoryUsage: (data as { memory_usage?: number }).memory_usage || 0,
        diskUsage: (data as { disk_usage?: number }).disk_usage || 0,
        cpuUsage: (data as { cpu_usage?: number }).cpu_usage || 0
      }
    } catch (error) {
      logger.warn('Failed to get system metrics', error instanceof Error ? error : new Error('Unknown error'))
      return {}
    }
  }

  /**
   * Check for performance alerts
   */
  private checkAlerts(): void {
    if (this.metrics.length === 0) {
      return
    }

    const latestMetrics = this.metrics[this.metrics.length - 1]
    if (!latestMetrics) return
    
    // Check slow queries
    if (latestMetrics.slowQueries > 0) {
      this.createAlert('slow_queries', 'warning', 
        `Found ${latestMetrics.slowQueries} slow queries`, 
        latestMetrics.slowQueries, 0)
    }
    
    // Check error rate
    const errorRate = latestMetrics.queryCount > 0 
      ? (latestMetrics.errorCount / latestMetrics.queryCount) * 100 
      : 0
    
    if (errorRate > this.thresholds.errorRateThreshold) {
      this.createAlert('error_rate', 'error',
        `High error rate: ${errorRate.toFixed(2)}%`,
        errorRate, this.thresholds.errorRateThreshold)
    }
    
    // Check connection utilization
    const connectionUtilization = latestMetrics.connectionCount > 0
      ? (latestMetrics.activeConnections / latestMetrics.connectionCount) * 100
      : 0
    
    if (connectionUtilization > this.thresholds.connectionUtilizationThreshold) {
      this.createAlert('connection_utilization', 'warning',
        `High connection utilization: ${connectionUtilization.toFixed(2)}%`,
        connectionUtilization, this.thresholds.connectionUtilizationThreshold)
    }
    
    // Check memory usage
    if (latestMetrics.memoryUsage > this.thresholds.memoryUsageThreshold) {
      this.createAlert('memory_usage', 'critical',
        `High memory usage: ${latestMetrics.memoryUsage.toFixed(2)}%`,
        latestMetrics.memoryUsage, this.thresholds.memoryUsageThreshold)
    }
    
    // Check disk usage
    if (latestMetrics.diskUsage > this.thresholds.diskUsageThreshold) {
      this.createAlert('disk_usage', 'critical',
        `High disk usage: ${latestMetrics.diskUsage.toFixed(2)}%`,
        latestMetrics.diskUsage, this.thresholds.diskUsageThreshold)
    }
    
    // Check cache hit rate
    if (latestMetrics.cacheHitRate < this.thresholds.cacheHitRateThreshold) {
      this.createAlert('cache_hit_rate', 'warning',
        `Low cache hit rate: ${latestMetrics.cacheHitRate.toFixed(2)}%`,
        latestMetrics.cacheHitRate, this.thresholds.cacheHitRateThreshold)
    }
  }

  /**
   * Create performance alert
   */
  private createAlert(
    metric: string,
    type: 'warning' | 'error' | 'critical',
    message: string,
    value: number,
    threshold: number
  ): void {
    const alertId = `${metric}_${Date.now()}`
    
    // Check if similar alert already exists
    const existingAlert = this.alerts.find(alert => 
      alert.metric === metric && 
      !alert.resolved && 
      Date.now() - alert.timestamp < 300000 // 5 minutes
    )
    
    if (existingAlert) {
      return // Don't create duplicate alerts
    }
    
    const alert: PerformanceAlert = {
      id: alertId,
      type,
      message,
      metric,
      value,
      threshold,
      timestamp: Date.now(),
      resolved: false
    }
    
    this.alerts.push(alert)
    
    logger.warn('Performance alert created', alert)
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(): void {
    if (this.metrics.length < 2) {
      return // Need at least 2 data points for trends
    }

    const latestMetrics = this.metrics[this.metrics.length - 1]
    const previousMetrics = this.metrics[this.metrics.length - 2]
    if (!latestMetrics) return
    
    // Analyze trends and generate recommendations
    this.analyzeSlowQueries()
    this.analyzeConnectionUsage()
    this.analyzeCachePerformance()
    this.analyzeMemoryUsage()
    this.analyzeQueryPatterns()
  }

  /**
   * Analyze slow queries and generate recommendations
   */
  private analyzeSlowQueries(): void {
    const slowQueries = this.queryMetrics.filter(m => m.executionTime > this.thresholds.slowQueryThreshold)
    
    if (slowQueries.length > 0) {
      const avgSlowQueryTime = slowQueries.reduce((sum, q) => sum + q.executionTime, 0) / slowQueries.length
      
      this.addRecommendation({
        type: 'query',
        priority: 'high',
        title: 'Optimize Slow Queries',
        description: `Found ${slowQueries.length} slow queries with average execution time of ${avgSlowQueryTime.toFixed(2)}ms`,
        impact: 'Improved response times and reduced database load',
        effort: 'medium',
        estimatedImprovement: 30
      })
    }
  }

  /**
   * Analyze connection usage
   */
  private analyzeConnectionUsage(): void {
    const latestMetrics = this.metrics[this.metrics.length - 1]
    if (!latestMetrics) return
    const connectionUtilization = latestMetrics.connectionCount > 0
      ? (latestMetrics.activeConnections / latestMetrics.connectionCount) * 100
      : 0
    
    if (connectionUtilization > 70) {
      this.addRecommendation({
        type: 'configuration',
        priority: 'medium',
        title: 'Optimize Connection Pool',
        description: `Connection utilization is at ${connectionUtilization.toFixed(2)}%`,
        impact: 'Better connection management and reduced connection wait times',
        effort: 'low',
        estimatedImprovement: 15
      })
    }
  }

  /**
   * Analyze cache performance
   */
  private analyzeCachePerformance(): void {
    const latestMetrics = this.metrics[this.metrics.length - 1]
    if (!latestMetrics) return
    
    if (latestMetrics.cacheHitRate < 70) {
      this.addRecommendation({
        type: 'configuration',
        priority: 'medium',
        title: 'Improve Cache Performance',
        description: `Cache hit rate is at ${latestMetrics.cacheHitRate.toFixed(2)}%`,
        impact: 'Reduced database load and improved response times',
        effort: 'medium',
        estimatedImprovement: 25
      })
    }
  }

  /**
   * Analyze memory usage
   */
  private analyzeMemoryUsage(): void {
    const latestMetrics = this.metrics[this.metrics.length - 1]
    if (!latestMetrics) return
    
    if (latestMetrics.memoryUsage > 80) {
      this.addRecommendation({
        type: 'maintenance',
        priority: 'high',
        title: 'Optimize Memory Usage',
        description: `Memory usage is at ${latestMetrics.memoryUsage.toFixed(2)}%`,
        impact: 'Prevent memory-related performance issues',
        effort: 'high',
        estimatedImprovement: 20
      })
    }
  }

  /**
   * Analyze query patterns
   */
  private analyzeQueryPatterns(): void {
    const recentQueries = this.queryMetrics.filter(m => 
      Date.now() - m.timestamp < 3600000 // Last hour
    )
    
    if (recentQueries.length > 100) {
      // Check for repeated queries that could benefit from caching
      const queryCounts = new Map<string, number>()
      
      recentQueries.forEach(q => {
        const normalizedQuery = q.query.toLowerCase().replace(/\s+/g, ' ').trim()
        queryCounts.set(normalizedQuery, (queryCounts.get(normalizedQuery) || 0) + 1)
      })
      
      const repeatedQueries = Array.from(queryCounts.entries())
        .filter(([_, count]) => count > 5)
        .sort((a, b) => b[1] - a[1])
      
      if (repeatedQueries.length > 0) {
        this.addRecommendation({
          type: 'query',
          priority: 'medium',
          title: 'Implement Query Caching',
          description: `Found ${repeatedQueries.length} frequently repeated queries`,
          impact: 'Reduced database load and improved response times',
          effort: 'medium',
          estimatedImprovement: 40
        })
      }
    }
  }

  /**
   * Add performance recommendation
   */
  private addRecommendation(recommendation: Omit<PerformanceRecommendation, 'id' | 'timestamp'>): void {
    const rec: PerformanceRecommendation = {
      ...recommendation,
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }
    
    // Check if similar recommendation already exists
    const existingRec = this.recommendations.find(r => 
      r.type === rec.type && 
      r.title === rec.title &&
      Date.now() - r.timestamp < 3600000 // 1 hour
    )
    
    if (!existingRec) {
      this.recommendations.push(rec)
      logger.info('Performance recommendation generated', rec)
    }
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): DatabaseMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] ?? null : null
  }

  /**
   * Get performance metrics history
   */
  getMetricsHistory(hours: number = 24): DatabaseMetrics[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000)
    return this.metrics.filter(m => m.timestamp > cutoff)
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.resolved)
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): PerformanceAlert[] {
    return [...this.alerts]
  }

  /**
   * Get performance recommendations
   */
  getRecommendations(priority?: 'low' | 'medium' | 'high' | 'critical'): PerformanceRecommendation[] {
    let recs = [...this.recommendations]
    
    if (priority) {
      recs = recs.filter(r => r.priority === priority)
    }
    
    return recs.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
      logger.info('Performance alert resolved', { alertId })
      return true
    }
    return false
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    status: 'excellent' | 'good' | 'fair' | 'poor'
    score: number
    activeAlerts: number
    recommendations: number
    trends: {
      queryTime: 'improving' | 'stable' | 'degrading'
      errorRate: 'improving' | 'stable' | 'degrading'
      cacheHitRate: 'improving' | 'stable' | 'degrading'
    }
  } {
    const currentMetrics = this.getCurrentMetrics()
    const activeAlerts = this.getActiveAlerts()
    const recommendations = this.getRecommendations()
    
    if (!currentMetrics) {
      return {
        status: 'poor',
        score: 0,
        activeAlerts: 0,
        recommendations: 0,
        trends: {
          queryTime: 'stable',
          errorRate: 'stable',
          cacheHitRate: 'stable'
        }
      }
    }
    
    // Calculate performance score (0-100)
    let score = 100
    
    // Deduct points for issues
    if (currentMetrics.slowQueries > 0) score -= 10
    if (currentMetrics.errorCount > 0) score -= 15
    if (currentMetrics.cacheHitRate < 80) score -= 10
    if (currentMetrics.memoryUsage > 85) score -= 20
    if (activeAlerts.length > 0) score -= activeAlerts.length * 5
    
    // Determine status
    let status: 'excellent' | 'good' | 'fair' | 'poor'
    if (score >= 90) status = 'excellent'
    else if (score >= 75) status = 'good'
    else if (score >= 60) status = 'fair'
    else status = 'poor'
    
    // Analyze trends (simplified)
    const trends = {
      queryTime: 'stable' as const,
      errorRate: 'stable' as const,
      cacheHitRate: 'stable' as const
    }
    
    return {
      status,
      score: Math.max(0, score),
      activeAlerts: activeAlerts.length,
      recommendations: recommendations.length,
      trends
    }
  }

  /**
   * Update performance thresholds
   */
  updateThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds }
    logger.info('Performance thresholds updated', this.thresholds)
  }
}

// Global performance monitor instance
let performanceMonitor: DatabasePerformanceMonitor | null = null

/**
 * Get or create performance monitor instance
 */
export function getPerformanceMonitor(thresholds?: Partial<PerformanceThresholds>): DatabasePerformanceMonitor {
  if (!performanceMonitor) {
    performanceMonitor = new DatabasePerformanceMonitor(thresholds)
  }
  return performanceMonitor
}

export default DatabasePerformanceMonitor
