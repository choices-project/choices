/**
 * Integration Monitoring System
 * 
 * Comprehensive monitoring system for external API integrations with
 * performance tracking, error monitoring, and alerting capabilities.
 */

import { logger } from '@/lib/utils/logger';

import type { CacheStats } from './caching';

export type IntegrationMetrics = {
  apiName: string;
  timestamp: Date;
  requests: {
    total: number;
    successful: number;
    failed: number;
    rateLimited: number;
  };
  performance: {
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
  };
  errors: {
    total: number;
    byType: Record<string, number>;
    byStatusCode: Record<number, number>;
  };
  cache: {
    hitRate: number;
    missRate: number;
    totalHits: number;
    totalMisses: number;
  };
  quota: {
    remaining: number;
    used: number;
    resetTime: Date;
    quotaExceeded: boolean;
  };
}

export type AlertRule = {
  id: string;
  name: string;
  apiName: string;
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldown: number; // milliseconds
  lastTriggered?: Date;
}

export type Alert = {
  id: string;
  ruleId: string;
  apiName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
}

export type HealthCheck = {
  apiName: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  responseTime: number;
  errorRate: number;
  lastError?: string;
  details: Record<string, string | number | boolean>;
}

/**
 * Integration monitoring system
 */
export class IntegrationMonitor {
  private metrics: Map<string, IntegrationMetrics[]> = new Map();
  private alerts: Alert[] = [];
  private alertRules: Map<string, AlertRule> = new Map();
  private healthChecks: Map<string, HealthCheck> = new Map();
  private responseTimes: Map<string, number[]> = new Map();
  private errorCounts: Map<string, Map<string, number>> = new Map();

  constructor() {
    this.initializeDefaultAlertRules();
  }

  /**
   * Record API request metrics
   */
  recordRequest(
    apiName: string,
    success: boolean,
    responseTime: number,
    errorType?: string,
    statusCode?: number
  ): void {
    // Record response time
    if (!this.responseTimes.has(apiName)) {
      this.responseTimes.set(apiName, []);
    }
    const responseTimesList = this.responseTimes.get(apiName);
    if (responseTimesList) {
      responseTimesList.push(responseTime);

      // Keep only last 1000 response times for performance
      if (responseTimesList.length > 1000) {
        responseTimesList.splice(0, responseTimesList.length - 1000);
      }
    }

    // Record errors
    if (!success) {
      if (!this.errorCounts.has(apiName)) {
        this.errorCounts.set(apiName, new Map());
      }
      
      const errorMap = this.errorCounts.get(apiName);
      if (errorMap) {
        if (errorType) {
          errorMap.set(errorType, (errorMap.get(errorType) ?? 0) + 1);
        }
        if (statusCode) {
          errorMap.set(`status_${statusCode}`, (errorMap.get(`status_${statusCode}`) ?? 0) + 1);
        }
      }
    }

    // Update metrics
    this.updateMetrics(apiName, success, responseTime, errorType, statusCode);
    
    // Check alert rules
    this.checkAlertRules(apiName);
  }

  /**
   * Record cache metrics
   */
  recordCacheMetrics(apiName: string, cacheStats: CacheStats): void {
    const metrics = this.getCurrentMetrics(apiName);
    if (metrics) {
      metrics.cache = {
        hitRate: cacheStats.hitRate,
        missRate: cacheStats.missRate,
        totalHits: cacheStats.totalHits,
        totalMisses: cacheStats.totalMisses
      };
    }
  }

  /**
   * Record quota metrics
   */
  recordQuotaMetrics(apiName: string, quotaInfo: {
    remaining: number;
    used: number;
    resetTime: Date;
    quotaExceeded: boolean;
  }): void {
    const metrics = this.getCurrentMetrics(apiName);
    if (metrics) {
      metrics.quota = quotaInfo;
    }
  }

  /**
   * Perform health check for an API
   */
  async performHealthCheck(apiName: string, healthCheckFn: () => Promise<boolean>): Promise<HealthCheck> {
    const startTime = Date.now();
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let lastError: string | undefined;
    let errorRate = 0;

    try {
      const isHealthy = await healthCheckFn();
      const responseTime = Date.now() - startTime;
      
      if (!isHealthy) {
        status = 'unhealthy';
      } else if (responseTime > 5000) { // 5 seconds
        status = 'degraded';
      }

      // Calculate error rate from recent metrics
      const recentMetrics = this.getRecentMetrics(apiName, 1); // Last hour
      if (recentMetrics.length > 0) {
        const totalRequests = recentMetrics.reduce((sum, m) => sum + m.requests.total, 0);
        const totalErrors = recentMetrics.reduce((sum, m) => sum + m.requests.failed, 0);
        errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;
      }

      const healthCheck: HealthCheck = {
        apiName,
        status,
        timestamp: new Date(),
        responseTime,
        errorRate,
        details: {
          responseTime,
          errorRate,
          isHealthy
        },
        ...(lastError ? { lastError } : {})
      };

      this.healthChecks.set(apiName, healthCheck);
      
      logger.debug('Health check completed', { apiName, status, responseTime });
      return healthCheck;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      lastError = error instanceof Error ? error.message : 'Unknown error';
      status = 'unhealthy';
      errorRate = 1;

      const healthCheck: HealthCheck = {
        apiName,
        status,
        timestamp: new Date(),
        responseTime,
        errorRate,
        lastError,
        details: {
          responseTime,
          error: lastError
        }
      };

      this.healthChecks.set(apiName, healthCheck);
      
      logger.error('Health check failed', { apiName, error: lastError, responseTime });
      return healthCheck;
    }
  }

  /**
   * Get current metrics for an API
   */
  getCurrentMetrics(apiName: string): IntegrationMetrics | null {
    const metricsList = this.metrics.get(apiName);
    return metricsList && metricsList.length > 0 ? metricsList[metricsList.length - 1] ?? null : null;
  }

  /**
   * Get recent metrics for an API
   */
  getRecentMetrics(apiName: string, hours: number = 24): IntegrationMetrics[] {
    const metricsList = this.metrics.get(apiName) ?? [];
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    
    return metricsList.filter(metrics => metrics.timestamp.getTime() > cutoff);
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): Alert[] {
    return this.alerts.filter(alert => alert.severity === severity && !alert.resolved);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      logger.info('Alert acknowledged', { alertId, apiName: alert.apiName });
      return true;
    }
    return false;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      logger.info('Alert resolved', { alertId, apiName: alert.apiName });
      return true;
    }
    return false;
  }

  /**
   * Get health status for all APIs
   */
  getAllHealthChecks(): HealthCheck[] {
    return Array.from(this.healthChecks.values());
  }

  /**
   * Get health status for a specific API
   */
  getHealthCheck(apiName: string): HealthCheck | null {
    return this.healthChecks.get(apiName) ?? null;
  }

  /**
   * Add alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    logger.info('Alert rule added', { ruleId: rule.id, apiName: rule.apiName });
  }

  /**
   * Remove alert rule
   */
  removeAlertRule(ruleId: string): boolean {
    const removed = this.alertRules.delete(ruleId);
    if (removed) {
      logger.info('Alert rule removed', { ruleId });
    }
    return removed;
  }

  /**
   * Get all alert rules
   */
  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  /**
   * Update metrics for an API
   */
  private updateMetrics(
    apiName: string,
    success: boolean,
    responseTime: number,
    errorType?: string,
    statusCode?: number
  ): void {
    if (!this.metrics.has(apiName)) {
      this.metrics.set(apiName, []);
    }

    const metricsList = this.metrics.get(apiName);
    if (!metricsList) return;
    
    let currentMetrics = metricsList[metricsList.length - 1];

    // Create new metrics entry if none exists or if it's been more than 1 hour
    if (!currentMetrics || Date.now() - currentMetrics.timestamp.getTime() > 60 * 60 * 1000) {
      currentMetrics = this.createNewMetrics(apiName);
      metricsList.push(currentMetrics);
      
      // Keep only last 168 entries (1 week of hourly metrics)
      if (metricsList.length > 168) {
        metricsList.splice(0, metricsList.length - 168);
      }
    }

    // Update current metrics with response time and error type
    currentMetrics.requests.total++;
    if (responseTime > 0) {
      currentMetrics.responseTime.total += responseTime;
      currentMetrics.responseTime.count++;
      currentMetrics.responseTime.avg = currentMetrics.responseTime.total / currentMetrics.responseTime.count;
      if (responseTime > currentMetrics.responseTime.max) {
        currentMetrics.responseTime.max = responseTime;
      }
      if (currentMetrics.responseTime.min === 0 || responseTime < currentMetrics.responseTime.min) {
        currentMetrics.responseTime.min = responseTime;
      }
    }
    
    if (success) {
      currentMetrics.requests.successful++;
    } else {
      currentMetrics.requests.failed++;
      // Track error type for failed requests
      if (errorType) {
        if (!currentMetrics.errors) {
          currentMetrics.errors = {};
        }
        currentMetrics.errors[errorType] = (currentMetrics.errors[errorType] || 0) + 1;
      }
      if (statusCode === 429) {
        currentMetrics.requests.rateLimited++;
      }
    }

    // Update performance metrics
    const responseTimes = this.responseTimes.get(apiName) ?? [];
    if (responseTimes.length > 0) {
      const sorted = [...responseTimes].sort((a, b) => a - b);
      const p95Index = Math.floor(sorted.length * 0.95);
      const p99Index = Math.floor(sorted.length * 0.99);
      const maxIndex = sorted.length - 1;
      
      currentMetrics.performance = {
        averageResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
        p95ResponseTime: sorted[p95Index] ?? 0,
        p99ResponseTime: sorted[p99Index] ?? 0,
        minResponseTime: sorted[0] ?? 0,
        maxResponseTime: sorted[maxIndex] ?? 0
      };
    }

    // Update error metrics
    const errorMap = this.errorCounts.get(apiName);
    if (errorMap) {
      currentMetrics.errors.total = Array.from(errorMap.values()).reduce((sum, count) => sum + count, 0);
      currentMetrics.errors.byType = Object.fromEntries(
        Array.from(errorMap.entries()).filter(([key]) => !key.startsWith('status_'))
      );
      currentMetrics.errors.byStatusCode = Object.fromEntries(
        Array.from(errorMap.entries())
          .filter(([key]) => key.startsWith('status_'))
          .map(([key, count]) => [parseInt(key.replace('status_', '')), count])
      );
    }
  }

  /**
   * Create new metrics entry
   */
  private createNewMetrics(apiName: string): IntegrationMetrics {
    return {
      apiName,
      timestamp: new Date(),
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        rateLimited: 0
      },
      performance: {
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0
      },
      errors: {
        total: 0,
        byType: {},
        byStatusCode: {}
      },
      cache: {
        hitRate: 0,
        missRate: 0,
        totalHits: 0,
        totalMisses: 0
      },
      quota: {
        remaining: 0,
        used: 0,
        resetTime: new Date(),
        quotaExceeded: false
      }
    };
  }

  /**
   * Check alert rules for an API
   */
  private checkAlertRules(apiName: string): void {
    const currentMetrics = this.getCurrentMetrics(apiName);
    if (!currentMetrics) return;

    for (const rule of Array.from(this.alertRules.values())) {
      if (rule.apiName !== apiName || !rule.enabled) continue;

      // Check cooldown
      if (rule.lastTriggered && Date.now() - rule.lastTriggered.getTime() < rule.cooldown) {
        continue;
      }

      const value = this.getMetricValue(currentMetrics, rule.metric);
      if (value === null) continue;

      const shouldAlert = this.evaluateCondition(value, rule.operator, rule.threshold);
      
      if (shouldAlert) {
        this.createAlert(rule, value);
        rule.lastTriggered = new Date();
      }
    }
  }

  /**
   * Get metric value from metrics object
   */
  private getMetricValue(metrics: IntegrationMetrics, metric: string): number | null {
    const parts = metric.split('.');
    let value: unknown = metrics;
    
    for (const part of parts) {
      value = (value as Record<string, unknown>)[part];
      if (value === undefined) return null;
    }
    
    return typeof value === 'number' ? value : null;
  }

  /**
   * Evaluate alert condition
   */
  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'eq': return value === threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      default: return false;
    }
  }

  /**
   * Create alert
   */
  private createAlert(rule: AlertRule, value: number): void {
    const alert: Alert = {
      id: `${rule.id}-${Date.now()}`,
      ruleId: rule.id,
      apiName: rule.apiName,
      severity: rule.severity,
      message: `${rule.name}: ${rule.metric} is ${value} (threshold: ${rule.threshold})`,
      value,
      threshold: rule.threshold,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false
    };

    this.alerts.push(alert);
    
    logger.warn('Alert triggered', {
      alertId: alert.id,
      apiName: alert.apiName,
      severity: alert.severity,
      message: alert.message
    });
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        apiName: '*',
        metric: 'requests.failed',
        operator: 'gt',
        threshold: 10,
        severity: 'high',
        enabled: true,
        cooldown: 5 * 60 * 1000 // 5 minutes
      },
      {
        id: 'slow-response-time',
        name: 'Slow Response Time',
        apiName: '*',
        metric: 'performance.averageResponseTime',
        operator: 'gt',
        threshold: 10000, // 10 seconds
        severity: 'medium',
        enabled: true,
        cooldown: 10 * 60 * 1000 // 10 minutes
      },
      {
        id: 'quota-exceeded',
        name: 'Quota Exceeded',
        apiName: '*',
        metric: 'quota.quotaExceeded',
        operator: 'eq',
        threshold: 1,
        severity: 'critical',
        enabled: true,
        cooldown: 60 * 60 * 1000 // 1 hour
      }
    ];

    for (const rule of defaultRules) {
      this.addAlertRule(rule);
    }
  }
}

/**
 * Global integration monitor instance
 */
export const integrationMonitor = new IntegrationMonitor();
