/**
 * Performance Monitoring Dashboard
 * 
 * Real-time performance monitoring and visualization system for database
 * operations, query performance, and cache efficiency.
 */

import { logger } from '@/lib/logger';
import { smartCache } from '@/lib/database/smart-cache';
import { queryAnalyzer } from '@/lib/database/query-analyzer';

/**
 * Dashboard metrics for real-time monitoring
 */
export type DashboardMetrics = {
  /** Timestamp of the metrics */
  timestamp: number;
  /** Cache performance metrics */
  cache: {
    hitRate: number;
    missRate: number;
    totalEntries: number;
    totalSize: number;
    efficiencyScore: number;
    topPatterns: Array<{ pattern: string; count: number; hitRate: number }>;
  };
  /** Query performance metrics */
  queries: {
    totalQueries: number;
    averageExecutionTime: number;
    slowQueries: number;
    topSlowQueries: Array<{ pattern: string; avgTime: number; count: number }>;
    optimizationOpportunities: number;
  };
  /** System health metrics */
  system: {
    overallScore: number;
    status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    alerts: Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' | 'critical' }>;
    improvementOpportunities: string[];
  };
  /** Historical trends */
  trends: {
    cacheHitRate: Array<{ timestamp: number; value: number }>;
    averageQueryTime: Array<{ timestamp: number; value: number }>;
    totalQueries: Array<{ timestamp: number; value: number }>;
  };
}

/**
 * Dashboard configuration
 */
export type DashboardConfig = {
  /** Refresh interval in milliseconds */
  refreshInterval: number;
  /** Number of data points to keep in history */
  historySize: number;
  /** Alert thresholds */
  thresholds: {
    cacheHitRate: { warning: number; critical: number };
    averageQueryTime: { warning: number; critical: number };
    slowQueries: { warning: number; critical: number };
  };
  /** Whether to enable real-time updates */
  enableRealTime: boolean;
}

/**
 * Performance monitoring dashboard
 */
export class PerformanceDashboard {
  private config: DashboardConfig;
  private metricsHistory: DashboardMetrics[] = [];
  private subscribers: Array<(metrics: DashboardMetrics) => void> = [];
  private updateTimer?: NodeJS.Timeout;
  private isRunning = false;

  constructor(config: Partial<DashboardConfig> = {}) {
    this.config = {
      refreshInterval: 5000, // 5 seconds
      historySize: 100,
      thresholds: {
        cacheHitRate: { warning: 0.7, critical: 0.5 },
        averageQueryTime: { warning: 500, critical: 1000 },
        slowQueries: { warning: 10, critical: 25 },
      },
      enableRealTime: true,
      ...config,
    };
  }

  /**
   * Start the dashboard monitoring
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    if (this.config.enableRealTime) {
      this.updateTimer = setInterval(() => {
        this.updateMetrics();
      }, this.config.refreshInterval);
    }
    
    logger.info('Performance dashboard started', {
      refreshInterval: this.config.refreshInterval,
      enableRealTime: this.config.enableRealTime,
    });
  }

  /**
   * Stop the dashboard monitoring
   */
  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      delete this.updateTimer;
    }
    
    logger.info('Performance dashboard stopped');
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): DashboardMetrics {
    return this.updateMetrics();
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(): DashboardMetrics[] {
    return [...this.metricsHistory];
  }

  /**
   * Get metrics for a specific time range
   */
  getMetricsForTimeRange(startTime: number, endTime: number): DashboardMetrics[] {
    return this.metricsHistory.filter(
      metrics => metrics.timestamp >= startTime && metrics.timestamp <= endTime
    );
  }

  /**
   * Subscribe to metrics updates
   */
  subscribe(callback: (metrics: DashboardMetrics) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    overallScore: number;
    status: string;
    keyMetrics: {
      cacheHitRate: number;
      averageQueryTime: number;
      totalQueries: number;
      slowQueries: number;
    };
    alerts: Array<{ type: string; message: string; severity: string }>;
    recommendations: string[];
  } {
    const currentMetrics = this.getCurrentMetrics();
    
    return {
      overallScore: currentMetrics.system.overallScore,
      status: currentMetrics.system.status,
      keyMetrics: {
        cacheHitRate: currentMetrics.cache.hitRate,
        averageQueryTime: currentMetrics.queries.averageExecutionTime,
        totalQueries: currentMetrics.queries.totalQueries,
        slowQueries: currentMetrics.queries.slowQueries,
      },
      alerts: currentMetrics.system.alerts,
      recommendations: currentMetrics.system.improvementOpportunities,
    };
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): Array<{
    type: string;
    priority: number;
    description: string;
    expectedImprovement: number;
    implementation: string;
  }> {
    const recommendations: Array<{
      type: string;
      priority: number;
      description: string;
      expectedImprovement: number;
      implementation: string;
    }> = [];
    
    const currentMetrics = this.getCurrentMetrics();
    
    // Cache optimization recommendations
    if (currentMetrics.cache.hitRate < this.config.thresholds.cacheHitRate.warning) {
      recommendations.push({
        type: 'cache',
        priority: 4,
        description: 'Improve cache hit rate',
        expectedImprovement: 30,
        implementation: 'Adjust cache TTL settings and implement smarter cache strategies',
      });
    }
    
    // Query optimization recommendations
    if (currentMetrics.queries.averageExecutionTime > this.config.thresholds.averageQueryTime.warning) {
      recommendations.push({
        type: 'query',
        priority: 5,
        description: 'Optimize slow queries',
        expectedImprovement: 50,
        implementation: 'Review and optimize query patterns, add missing indexes',
      });
    }
    
    // Index optimization recommendations
    const indexRecommendations = queryAnalyzer.getIndexRecommendations();
    for (const rec of indexRecommendations.slice(0, 3)) {
      recommendations.push({
        type: 'index',
        priority: rec.priority,
        description: `Add index on ${rec.table}.${rec.columns.join(', ')}`,
        expectedImprovement: rec.expectedImprovement,
        implementation: `CREATE INDEX idx_${rec.table}_${rec.columns.join('_')} ON ${rec.table} (${rec.columns.join(', ')});`,
      });
    }
    
    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Export metrics data
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    const metrics = this.getMetricsHistory();
    
    if (format === 'csv') {
      const headers = [
        'timestamp',
        'cache_hit_rate',
        'cache_miss_rate',
        'cache_total_entries',
        'cache_efficiency_score',
        'queries_total',
        'queries_avg_execution_time',
        'queries_slow_count',
        'system_overall_score',
        'system_status'
      ];
      
      const rows = metrics.map(m => [
        new Date(m.timestamp).toISOString(),
        m.cache.hitRate,
        m.cache.missRate,
        m.cache.totalEntries,
        m.cache.efficiencyScore,
        m.queries.totalQueries,
        m.queries.averageExecutionTime,
        m.queries.slowQueries,
        m.system.overallScore,
        m.system.status
      ]);
      
      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }
    
    return JSON.stringify(metrics, null, 2);
  }

  /**
   * Clear metrics history
   */
  clearHistory(): void {
    this.metricsHistory = [];
    logger.info('Performance dashboard history cleared');
  }

  // Private methods

  private updateMetrics(): DashboardMetrics {
    const timestamp = Date.now();
    
    // Get cache statistics
    const cacheStats = smartCache.getStats();
    
    // Get query analysis
    const queryAnalysis = queryAnalyzer.generateOptimizationReport();
    
    // Calculate system health
    const overallScore = this.calculateOverallScore(cacheStats, queryAnalysis);
    const status = this.determineSystemStatus(overallScore, cacheStats, queryAnalysis);
    const alerts = this.generateAlerts(cacheStats, queryAnalysis);
    const improvementOpportunities = this.identifyImprovementOpportunities(cacheStats, queryAnalysis);
    
    // Get historical trends
    const trends = this.calculateTrends();
    
    const metrics: DashboardMetrics = {
      timestamp,
      cache: {
        hitRate: cacheStats.hitRate,
        missRate: cacheStats.missRate,
        totalEntries: cacheStats.totalEntries,
        totalSize: cacheStats.totalSize,
        efficiencyScore: cacheStats.efficiencyScore,
        topPatterns: cacheStats.topPatterns,
      },
      queries: {
        totalQueries: queryAnalysis.summary.totalQueries,
        averageExecutionTime: queryAnalysis.summary.averageExecutionTime,
        slowQueries: queryAnalysis.summary.slowQueries,
        topSlowQueries: queryAnalysis.slowQueries.map(q => ({
          pattern: q.pattern,
          avgTime: q.executionTime,
          count: 1, // Simplified for dashboard
        })),
        optimizationOpportunities: queryAnalysis.summary.optimizableQueries,
      },
      system: {
        overallScore,
        status,
        alerts,
        improvementOpportunities,
      },
      trends,
    };
    
    // Add to history
    this.metricsHistory.push(metrics);
    
    // Keep only recent history
    if (this.metricsHistory.length > this.config.historySize) {
      this.metricsHistory = this.metricsHistory.slice(-this.config.historySize);
    }
    
    // Notify subscribers
    this.notifySubscribers(metrics);
    
    return metrics;
  }

  private calculateOverallScore(cacheStats: { efficiencyScore: number }, queryAnalysis: { summary: { averageExecutionTime: number; optimizableQueries: number } }): number {
    const cacheScore = cacheStats.efficiencyScore * 0.4;
    const queryScore = Math.max(0, 100 - queryAnalysis.summary.averageExecutionTime / 10) * 0.3;
    const optimizationScore = Math.max(0, 100 - queryAnalysis.summary.optimizableQueries * 2) * 0.3;
    
    return Math.round(cacheScore + queryScore + optimizationScore);
  }

  private determineSystemStatus(
    overallScore: number,
    _cacheStats: any,
    _queryAnalysis: any
  ): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    if (overallScore >= 90) return 'excellent';
    if (overallScore >= 80) return 'good';
    if (overallScore >= 70) return 'fair';
    if (overallScore >= 60) return 'poor';
    return 'critical';
  }

  private generateAlerts(cacheStats: any, queryAnalysis: any): Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }> {
    const alerts: Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' | 'critical' }> = [];
    
    // Cache alerts
    if (cacheStats.hitRate < this.config.thresholds.cacheHitRate.critical) {
      alerts.push({
        type: 'cache',
        message: `Critical: Cache hit rate is very low (${(cacheStats.hitRate * 100).toFixed(1)}%)`,
        severity: 'critical',
      });
    } else if (cacheStats.hitRate < this.config.thresholds.cacheHitRate.warning) {
      alerts.push({
        type: 'cache',
        message: `Warning: Cache hit rate is low (${(cacheStats.hitRate * 100).toFixed(1)}%)`,
        severity: 'high',
      });
    }
    
    // Query performance alerts
    if (queryAnalysis.summary.averageExecutionTime > this.config.thresholds.averageQueryTime.critical) {
      alerts.push({
        type: 'query',
        message: `Critical: Average query time is very high (${queryAnalysis.summary.averageExecutionTime.toFixed(0)}ms)`,
        severity: 'critical',
      });
    } else if (queryAnalysis.summary.averageExecutionTime > this.config.thresholds.averageQueryTime.warning) {
      alerts.push({
        type: 'query',
        message: `Warning: Average query time is high (${queryAnalysis.summary.averageExecutionTime.toFixed(0)}ms)`,
        severity: 'high',
      });
    }
    
    // Slow queries alerts
    if (queryAnalysis.summary.slowQueries > this.config.thresholds.slowQueries.critical) {
      alerts.push({
        type: 'slow_queries',
        message: `Critical: Too many slow queries (${queryAnalysis.summary.slowQueries})`,
        severity: 'critical',
      });
    } else if (queryAnalysis.summary.slowQueries > this.config.thresholds.slowQueries.warning) {
      alerts.push({
        type: 'slow_queries',
        message: `Warning: Many slow queries detected (${queryAnalysis.summary.slowQueries})`,
        severity: 'medium',
      });
    }
    
    return alerts;
  }

  private identifyImprovementOpportunities(cacheStats: any, queryAnalysis: any): string[] {
    const opportunities: string[] = [];
    
    if (cacheStats.hitRate < 0.8) {
      opportunities.push('Optimize cache strategies to improve hit rate');
    }
    
    if (queryAnalysis.summary.averageExecutionTime > 200) {
      opportunities.push('Review and optimize slow query patterns');
    }
    
    if (queryAnalysis.summary.optimizableQueries > 5) {
      opportunities.push('Implement recommended index optimizations');
    }
    
    if (cacheStats.efficiencyScore < 80) {
      opportunities.push('Adjust cache size and eviction policies');
    }
    
    return opportunities;
  }

  private calculateTrends(): {
    cacheHitRate: Array<{ timestamp: number; value: number }>;
    averageQueryTime: Array<{ timestamp: number; value: number }>;
    totalQueries: Array<{ timestamp: number; value: number }>;
  } {
    const recentMetrics = this.metricsHistory.slice(-20); // Last 20 data points
    
    return {
      cacheHitRate: recentMetrics.map(m => ({ timestamp: m.timestamp, value: m.cache.hitRate })),
      averageQueryTime: recentMetrics.map(m => ({ timestamp: m.timestamp, value: m.queries.averageExecutionTime })),
      totalQueries: recentMetrics.map(m => ({ timestamp: m.timestamp, value: m.queries.totalQueries })),
    };
  }

  private notifySubscribers(metrics: DashboardMetrics): void {
    for (const subscriber of this.subscribers) {
      try {
        subscriber(metrics);
      } catch (error) {
        logger.error('Error notifying dashboard subscriber', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }
}

// Global performance dashboard instance
export const performanceDashboard = new PerformanceDashboard();
