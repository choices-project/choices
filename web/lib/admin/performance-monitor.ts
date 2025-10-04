// Advanced Performance Monitoring for Admin System
// Real-time performance tracking, alerts, and optimization recommendations
// Created: October 2, 2025

import { logger } from '@/lib/logger';

export type PerformanceMetric = {
  operation: string;
  duration: number;
  timestamp: string;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
};

export type SystemPerformanceAlert = {
  id: string;
  type: 'slow_query' | 'high_error_rate' | 'memory_usage' | 'database_connection';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
  metadata?: Record<string, any>;
};

export type PerformanceReport = {
  period: string;
  totalOperations: number;
  averageResponseTime: number;
  errorRate: number;
  slowestOperations: PerformanceMetric[];
  alerts: SystemPerformanceAlert[];
  recommendations: string[];
};

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private alerts: SystemPerformanceAlert[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics
  private readonly alertThresholds = {
    slowQuery: 2000, // 2 seconds
    highErrorRate: 0.05, // 5%
    memoryUsage: 0.8, // 80%
    databaseConnection: 0.9 // 90%
  };

  // Track a performance metric
  trackOperation(operation: string, duration: number, success: boolean, error?: string, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: new Date().toISOString(),
      success,
      error: error || '',
      metadata: metadata || {}
    };

    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Check for performance issues
    this.checkPerformanceIssues(metric);

    // Log performance data
    logger.info('Performance metric recorded', {
      operation,
      duration: `${duration.toFixed(2)}ms`,
      success,
      error
    });
  }

  // Check for performance issues and create alerts
  private checkPerformanceIssues(metric: PerformanceMetric) {
    // Check for slow queries
    if (metric.duration > this.alertThresholds.slowQuery) {
      this.createAlert({
        type: 'slow_query',
        severity: metric.duration > 5000 ? 'critical' : 'high',
        message: `Slow operation detected: ${metric.operation} took ${metric.duration.toFixed(2)}ms`,
        metadata: { operation: metric.operation, duration: metric.duration }
      });
    }

    // Check for high error rate
    const recentMetrics = this.getRecentMetrics(5 * 60 * 1000); // Last 5 minutes
    const errorRate = recentMetrics.filter(m => !m.success).length / recentMetrics.length;
    
    if (errorRate > this.alertThresholds.highErrorRate) {
      this.createAlert({
        type: 'high_error_rate',
        severity: errorRate > 0.1 ? 'critical' : 'high',
        message: `High error rate detected: ${(errorRate * 100).toFixed(1)}%`,
        metadata: { errorRate, recentMetrics: recentMetrics.length }
      });
    }
  }

  // Create a new alert
  private createAlert(alert: Omit<SystemPerformanceAlert, 'id' | 'timestamp' | 'resolved'>) {
    const newAlert: SystemPerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      resolved: false,
      ...(alert || {})
    };

    // Check if similar alert already exists
    const existingAlert = this.alerts.find(a => 
      a.type === alert.type && 
      !a.resolved && 
      (Date.now() - new Date(a.timestamp).getTime()) < 5 * 60 * 1000 // 5 minutes
    );

    if (!existingAlert) {
      this.alerts.push(newAlert);
      
      logger.warn('Performance alert created', {
        type: alert.type,
        severity: alert.severity,
        message: alert.message
      });
    }
  }

  // Get recent metrics within a time window
  private getRecentMetrics(timeWindowMs: number): PerformanceMetric[] {
    const cutoff = Date.now() - timeWindowMs;
    return this.metrics.filter(m => new Date(m.timestamp).getTime() > cutoff);
  }

  // Get performance report for a specific period
  getPerformanceReport(periodMs: number = 60 * 60 * 1000): PerformanceReport {
    const recentMetrics = this.getRecentMetrics(periodMs);
    const recentAlerts = this.alerts.filter(a => 
      new Date(a.timestamp).getTime() > (Date.now() - periodMs)
    );

    const totalOperations = recentMetrics.length;
    const averageResponseTime = totalOperations > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations 
      : 0;
    
    const errorRate = totalOperations > 0 
      ? recentMetrics.filter(m => !m.success).length / totalOperations 
      : 0;

    const slowestOperations = recentMetrics
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    const recommendations = this.generateRecommendations(recentMetrics, recentAlerts);

    return {
      period: `${Math.round(periodMs / 1000 / 60)} minutes`,
      totalOperations,
      averageResponseTime,
      errorRate,
      slowestOperations,
      alerts: recentAlerts,
      recommendations
    };
  }

  // Generate performance recommendations
  private generateRecommendations(metrics: PerformanceMetric[], alerts: SystemPerformanceAlert[]): string[] {
    const recommendations: string[] = [];

    // Check for slow operations
    const slowOperations = metrics.filter(m => m.duration > 1000);
    if (slowOperations.length > 0) {
      const operationCounts = slowOperations.reduce((acc, m) => {
        acc[m.operation] = (acc[m.operation] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const slowestOperation = Object.entries(operationCounts)
        .sort(([,a], [,b]) => b - a)[0];

      if (slowestOperation) {
        recommendations.push(`Consider optimizing "${slowestOperation[0]}" - it's slow ${slowestOperation[1]} times`);
      }
    }

    // Check for high error rates
    const errorRate = metrics.length > 0 ? metrics.filter(m => !m.success).length / metrics.length : 0;
    if (errorRate > 0.1) {
      recommendations.push(`High error rate detected (${(errorRate * 100).toFixed(1)}%) - investigate error patterns`);
    }

    // Check for database connection issues
    const dbAlerts = alerts.filter(a => a.type === 'database_connection');
    if (dbAlerts.length > 0) {
      recommendations.push('Database connection issues detected - check connection pool settings');
    }

    // Check for memory usage issues
    const memoryAlerts = alerts.filter(a => a.type === 'memory_usage');
    if (memoryAlerts.length > 0) {
      recommendations.push('High memory usage detected - consider implementing caching or memory optimization');
    }

    // General recommendations
    if (metrics.length > 100) {
      recommendations.push('Consider implementing database query caching for frequently accessed data');
    }

    if (alerts.length > 5) {
      recommendations.push('Multiple performance issues detected - consider a comprehensive system review');
    }

    return recommendations;
  }

  // Get all alerts
  getAlerts(): SystemPerformanceAlert[] {
    return this.alerts;
  }

  // Resolve an alert
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      logger.info('Performance alert resolved', { alertId, type: alert.type });
      return true;
    }
    return false;
  }

  // Clear old metrics and alerts
  cleanup() {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    // Keep only recent metrics
    this.metrics = this.metrics.filter(m => 
      new Date(m.timestamp).getTime() > oneDayAgo
    );

    // Keep only recent alerts
    this.alerts = this.alerts.filter(a => 
      new Date(a.timestamp).getTime() > oneDayAgo
    );

    logger.info('Performance monitor cleanup completed', {
      metricsCount: this.metrics.length,
      alertsCount: this.alerts.length
    });
  }

  // Get system health score (0-100)
  getSystemHealthScore(): number {
    const recentMetrics = this.getRecentMetrics(15 * 60 * 1000); // Last 15 minutes
    
    if (recentMetrics.length === 0) return 100;

    const errorRate = recentMetrics.filter(m => !m.success).length / recentMetrics.length;
    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;
    
    let score = 100;
    
    // Deduct points for errors
    score -= errorRate * 50;
    
    // Deduct points for slow responses
    if (averageResponseTime > 1000) {
      score -= Math.min(30, (averageResponseTime - 1000) / 100);
    }
    
    // Deduct points for recent alerts
    const recentAlerts = this.alerts.filter(a => 
      !a.resolved && new Date(a.timestamp).getTime() > (Date.now() - 15 * 60 * 1000)
    );
    score -= recentAlerts.length * 5;
    
    return Math.max(0, Math.round(score));
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export utility functions
export function trackPerformance<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const startTime = performance.now();
  
  return fn()
    .then(result => {
      const duration = performance.now() - startTime;
      performanceMonitor.trackOperation(operation, duration, true, undefined, metadata);
      return result;
    })
    .catch(error => {
      const duration = performance.now() - startTime;
      performanceMonitor.trackOperation(operation, duration, false, error.message, metadata);
      throw error;
    });
}
