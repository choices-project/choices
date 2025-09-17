/**
 * Red Dashboard System
 * 
 * Implements critical metrics dashboard for real-time system health monitoring
 * with enterprise-grade observability for the ranked choice democracy platform.
 */

import { logger } from '@/lib/logger';
import { sloMonitor } from './slos';

export interface CriticalMetrics {
  queueDepth: number;
  diffFanoutErrorRate: number;
  dpBudgetRemaining: number;
  rlsDenials: number;
  irvComputeLatency: number;
  realtimeLag: number;
  errorRate: number;
  availability: number;
  activeUsers: number;
  memoryUsage: number;
  cpuUsage: number;
  databaseConnections: number;
}

export interface MetricThresholds {
  critical: number;
  warning: number;
  healthy: number;
}

export interface DashboardConfig {
  refreshInterval: number;
  autoRefresh: boolean;
  showHistorical: boolean;
  alertThresholds: Record<string, MetricThresholds>;
}

export class RedDashboard {
  private static readonly DEFAULT_THRESHOLDS: Record<string, MetricThresholds> = {
    queueDepth: { critical: 10000, warning: 5000, healthy: 1000 },
    diffFanoutErrorRate: { critical: 5.0, warning: 2.0, healthy: 0.5 },
    dpBudgetRemaining: { critical: 10, warning: 25, healthy: 50 },
    rlsDenials: { critical: 10.0, warning: 5.0, healthy: 1.0 },
    irvComputeLatency: { critical: 40000, warning: 16000, healthy: 8000 },
    realtimeLag: { critical: 10000, warning: 4000, healthy: 2000 },
    errorRate: { critical: 1.0, warning: 0.5, healthy: 0.1 },
    availability: { critical: 99.0, warning: 99.5, healthy: 99.9 },
    activeUsers: { critical: 100000, warning: 50000, healthy: 10000 },
    memoryUsage: { critical: 90, warning: 80, healthy: 70 },
    cpuUsage: { critical: 90, warning: 80, healthy: 70 },
    databaseConnections: { critical: 80, warning: 60, healthy: 40 }
  };

  /**
   * Get critical metrics for dashboard
   */
  static async getCriticalMetrics(): Promise<CriticalMetrics> {
    try {
      const [
        queueDepth,
        diffFanoutErrorRate,
        dpBudgetRemaining,
        rlsDenials,
        irvComputeLatency,
        realtimeLag,
        errorRate,
        availability,
        activeUsers,
        memoryUsage,
        cpuUsage,
        databaseConnections
      ] = await Promise.all([
        this.getQueueDepth(),
        this.getDiffErrorRate(),
        this.getDPBudgetRemaining(),
        this.getRLSDenials(),
        this.getIRVLatency(),
        this.getRealtimeLag(),
        this.getErrorRate(),
        this.getAvailability(),
        this.getActiveUsers(),
        this.getMemoryUsage(),
        this.getCPUUsage(),
        this.getDatabaseConnections()
      ]);

      return {
        queueDepth,
        diffFanoutErrorRate,
        dpBudgetRemaining,
        rlsDenials,
        irvComputeLatency,
        realtimeLag,
        errorRate,
        availability,
        activeUsers,
        memoryUsage,
        cpuUsage,
        databaseConnections
      };
    } catch (error) {
      logger.error('Failed to get critical metrics', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Get queue depth across all systems
   */
  static async getQueueDepth(): Promise<number> {
    try {
      // In production, this would query actual queue systems (Redis, RabbitMQ, etc.)
      const queues = await this.getAllQueues();
      return queues.reduce((total, queue) => total + queue.length, 0);
    } catch (error) {
      logger.error('Failed to get queue depth', { error: error instanceof Error ? error.message : 'Unknown error' });
      return 0;
    }
  }

  /**
   * Get diff fanout error rate
   */
  static async getDiffErrorRate(): Promise<number> {
    try {
      const totalDiffs = await this.getTotalDiffCount();
      const failedDiffs = await this.getFailedDiffCount();
      return totalDiffs > 0 ? (failedDiffs / totalDiffs) * 100 : 0;
    } catch (error) {
      logger.error('Failed to get diff error rate', { error: error instanceof Error ? error.message : 'Unknown error' });
      return 0;
    }
  }

  /**
   * Get differential privacy budget remaining
   */
  static async getDPBudgetRemaining(): Promise<number> {
    try {
      const budgets = await this.getAllEpsilonBudgets();
      const totalBudget = budgets.reduce((sum, budget) => sum + budget.total, 0);
      const usedBudget = budgets.reduce((sum, budget) => sum + budget.used, 0);
      return totalBudget > 0 ? ((totalBudget - usedBudget) / totalBudget) * 100 : 100;
    } catch (error) {
      logger.error('Failed to get DP budget remaining', { error: error instanceof Error ? error.message : 'Unknown error' });
      return 100;
    }
  }

  /**
   * Get RLS denial rate
   */
  static async getRLSDenials(): Promise<number> {
    try {
      const denials = await this.getRLSDenialCount();
      const totalRequests = await this.getTotalRequestCount();
      return totalRequests > 0 ? (denials / totalRequests) * 100 : 0;
    } catch (error) {
      logger.error('Failed to get RLS denials', { error: error instanceof Error ? error.message : 'Unknown error' });
      return 0;
    }
  }

  /**
   * Get IRV compute latency
   */
  static async getIRVLatency(): Promise<number> {
    try {
      const sloMetrics = sloMonitor.getSLOMetrics();
      const irvMetric = sloMetrics.find(m => m.sloName === 'irvRecompute');
      return irvMetric ? irvMetric.percentile95 : 0;
    } catch (error) {
      logger.error('Failed to get IRV latency', { error: error instanceof Error ? error.message : 'Unknown error' });
      return 0;
    }
  }

  /**
   * Get realtime lag
   */
  static async getRealtimeLag(): Promise<number> {
    try {
      const sloMetrics = sloMonitor.getSLOMetrics();
      const realtimeMetric = sloMetrics.find(m => m.sloName === 'realtimePublishLag');
      return realtimeMetric ? realtimeMetric.percentile95 * 1000 : 0; // Convert to ms
    } catch (error) {
      logger.error('Failed to get realtime lag', { error: error instanceof Error ? error.message : 'Unknown error' });
      return 0;
    }
  }

  /**
   * Get overall error rate
   */
  static async getErrorRate(): Promise<number> {
    try {
      const sloMetrics = sloMonitor.getSLOMetrics();
      const errorMetric = sloMetrics.find(m => m.sloName === 'errorRate');
      return errorMetric ? errorMetric.currentValue : 0;
    } catch (error) {
      logger.error('Failed to get error rate', { error: error instanceof Error ? error.message : 'Unknown error' });
      return 0;
    }
  }

  /**
   * Get system availability
   */
  static async getAvailability(): Promise<number> {
    try {
      const sloMetrics = sloMonitor.getSLOMetrics();
      const availabilityMetric = sloMetrics.find(m => m.sloName === 'availability');
      return availabilityMetric ? availabilityMetric.currentValue : 99.9;
    } catch (error) {
      logger.error('Failed to get availability', { error: error instanceof Error ? error.message : 'Unknown error' });
      return 99.9;
    }
  }

  /**
   * Get active users count
   */
  static async getActiveUsers(): Promise<number> {
    try {
      // In production, this would query user session store
      return Math.floor(Math.random() * 10000) + 1000; // Mock data
    } catch (error) {
      logger.error('Failed to get active users', { error: error instanceof Error ? error.message : 'Unknown error' });
      return 0;
    }
  }

  /**
   * Get memory usage percentage
   */
  static async getMemoryUsage(): Promise<number> {
    try {
      // In production, this would query system metrics
      return Math.floor(Math.random() * 30) + 50; // Mock data: 50-80%
    } catch (error) {
      logger.error('Failed to get memory usage', { error: error instanceof Error ? error.message : 'Unknown error' });
      return 0;
    }
  }

  /**
   * Get CPU usage percentage
   */
  static async getCPUUsage(): Promise<number> {
    try {
      // In production, this would query system metrics
      return Math.floor(Math.random() * 40) + 30; // Mock data: 30-70%
    } catch (error) {
      logger.error('Failed to get CPU usage', { error: error instanceof Error ? error.message : 'Unknown error' });
      return 0;
    }
  }

  /**
   * Get database connections count
   */
  static async getDatabaseConnections(): Promise<number> {
    try {
      // In production, this would query database connection pool
      return Math.floor(Math.random() * 20) + 10; // Mock data: 10-30
    } catch (error) {
      logger.error('Failed to get database connections', { error: error instanceof Error ? error.message : 'Unknown error' });
      return 0;
    }
  }

  /**
   * Generate dashboard HTML
   */
  static async generateDashboardHTML(): Promise<string> {
    const metrics = await this.getCriticalMetrics();
    const timestamp = new Date().toISOString();
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Choices Platform - Red Dashboard</title>
          <meta http-equiv="refresh" content="30">
          <meta charset="utf-8">
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              background: #000; 
              color: #fff; 
              margin: 0; 
              padding: 20px;
              line-height: 1.4;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #333; 
              padding-bottom: 20px;
            }
            .timestamp { 
              color: #666; 
              font-size: 12px; 
              margin-top: 10px;
            }
            .metrics-grid { 
              display: grid; 
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
              gap: 20px; 
              margin-bottom: 30px;
            }
            .metric { 
              margin: 0; 
              padding: 15px; 
              border: 1px solid #333; 
              border-radius: 4px;
              position: relative;
            }
            .metric-title { 
              font-weight: bold; 
              margin-bottom: 8px; 
              font-size: 14px;
            }
            .metric-value { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 5px;
            }
            .metric-unit { 
              font-size: 12px; 
              color: #999; 
              margin-left: 5px;
            }
            .critical { 
              background: #ff0000; 
              border-color: #ff6666;
              animation: pulse 2s infinite;
            }
            .warning { 
              background: #ffaa00; 
              border-color: #ffcc66;
            }
            .healthy { 
              background: #00aa00; 
              border-color: #66cc66;
            }
            .unknown { 
              background: #666; 
              border-color: #999;
            }
            @keyframes pulse {
              0% { opacity: 1; }
              50% { opacity: 0.7; }
              100% { opacity: 1; }
            }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              padding-top: 20px; 
              border-top: 1px solid #333; 
              color: #666; 
              font-size: 12px;
            }
            .status-indicator {
              position: absolute;
              top: 10px;
              right: 10px;
              width: 12px;
              height: 12px;
              border-radius: 50%;
            }
            .status-critical { background: #ff0000; }
            .status-warning { background: #ffaa00; }
            .status-healthy { background: #00aa00; }
            .status-unknown { background: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🚨 Choices Platform - Red Dashboard</h1>
            <div class="timestamp">Last Updated: ${timestamp}</div>
          </div>
          
          <div class="metrics-grid">
            ${this.generateMetricHTML('Queue Depth', metrics.queueDepth, '', 'queueDepth')}
            ${this.generateMetricHTML('Diff Error Rate', metrics.diffFanoutErrorRate, '%', 'diffFanoutErrorRate')}
            ${this.generateMetricHTML('DP Budget Remaining', metrics.dpBudgetRemaining, '%', 'dpBudgetRemaining')}
            ${this.generateMetricHTML('RLS Denials', metrics.rlsDenials, '%', 'rlsDenials')}
            ${this.generateMetricHTML('IRV Compute Latency', metrics.irvComputeLatency, 'ms', 'irvComputeLatency')}
            ${this.generateMetricHTML('Realtime Lag', metrics.realtimeLag, 'ms', 'realtimeLag')}
            ${this.generateMetricHTML('Error Rate', metrics.errorRate, '%', 'errorRate')}
            ${this.generateMetricHTML('Availability', metrics.availability, '%', 'availability')}
            ${this.generateMetricHTML('Active Users', metrics.activeUsers, '', 'activeUsers')}
            ${this.generateMetricHTML('Memory Usage', metrics.memoryUsage, '%', 'memoryUsage')}
            ${this.generateMetricHTML('CPU Usage', metrics.cpuUsage, '%', 'cpuUsage')}
            ${this.generateMetricHTML('DB Connections', metrics.databaseConnections, '', 'databaseConnections')}
          </div>
          
          <div class="footer">
            <p>Choices Platform - Democratic Revolution Monitoring</p>
            <p>Auto-refresh every 30 seconds | Last check: ${timestamp}</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate HTML for a single metric
   */
  private static generateMetricHTML(title: string, value: number, unit: string, metricKey: string): string {
    const status = this.getMetricStatus(metricKey, value);
    const statusClass = this.getMetricClass(status);
    const formattedValue = this.formatValue(value, unit);
    
    return `
      <div class="metric ${statusClass}">
        <div class="status-indicator status-${status}"></div>
        <div class="metric-title">${title}</div>
        <div class="metric-value">
          ${formattedValue}
          <span class="metric-unit">${unit}</span>
        </div>
      </div>
    `;
  }

  /**
   * Get metric status based on thresholds
   */
  private static getMetricStatus(metricKey: string, value: number): 'critical' | 'warning' | 'healthy' | 'unknown' {
    const thresholds = this.DEFAULT_THRESHOLDS[metricKey];
    if (!thresholds) return 'unknown';
    
    if (value >= thresholds.critical) return 'critical';
    if (value >= thresholds.warning) return 'warning';
    return 'healthy';
  }

  /**
   * Get CSS class for metric status
   */
  private static getMetricClass(status: string): string {
    switch (status) {
      case 'critical': return 'critical';
      case 'warning': return 'warning';
      case 'healthy': return 'healthy';
      default: return 'unknown';
    }
  }

  /**
   * Format value for display
   */
  private static formatValue(value: number, unit: string): string {
    if (unit === '%') {
      return value.toFixed(1);
    } else if (unit === 'ms') {
      return value.toFixed(0);
    } else {
      return value.toLocaleString();
    }
  }

  // Mock data methods - in production these would query actual systems
  private static async getAllQueues(): Promise<Array<{ length: number }>> {
    return [
      { length: Math.floor(Math.random() * 1000) },
      { length: Math.floor(Math.random() * 500) },
      { length: Math.floor(Math.random() * 200) }
    ];
  }

  private static async getTotalDiffCount(): Promise<number> {
    return Math.floor(Math.random() * 10000) + 1000;
  }

  private static async getFailedDiffCount(): Promise<number> {
    return Math.floor(Math.random() * 50);
  }

  private static async getAllEpsilonBudgets(): Promise<Array<{ total: number; used: number }>> {
    return [
      { total: 100, used: Math.floor(Math.random() * 50) },
      { total: 100, used: Math.floor(Math.random() * 30) }
    ];
  }

  private static async getRLSDenialCount(): Promise<number> {
    return Math.floor(Math.random() * 100);
  }

  private static async getTotalRequestCount(): Promise<number> {
    return Math.floor(Math.random() * 10000) + 1000;
  }
}
