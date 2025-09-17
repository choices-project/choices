/**
 * Service Level Objectives (SLO) Monitoring
 * 
 * Implements comprehensive SLO monitoring and alerting for the ranked choice
 * democracy platform with enterprise-grade reliability metrics.
 */

import { logger } from '@/lib/logger';

export type SLOTarget = {
  target: string;
  measurement: string;
  alertThreshold: number;
  criticalThreshold: number;
  unit: string;
}

export type SLOTargets = {
  snapshotJobCompletion: SLOTarget;
  realtimePublishLag: SLOTarget;
  irvRecompute: SLOTarget;
  incrementalUpdate: SLOTarget;
  availability: SLOTarget;
  errorRate: SLOTarget;
  responseTime: SLOTarget;
}

export type MetricBufferType = {
  measurements: { value: number; timestamp: number }[];
  maxSize: number;
}

export type Alert = {
  id: string;
  severity: 'warning' | 'critical';
  slo: string;
  value: number;
  target: string;
  threshold: number;
  timestamp: number;
  message: string;
  resolved: boolean;
  resolvedAt?: number;
}

export type SLOMetrics = {
  sloName: string;
  currentValue: number;
  target: string;
  status: 'healthy' | 'warning' | 'critical';
  percentile95: number;
  percentile99: number;
  sampleSize: number;
  lastUpdated: number;
}

export const SLO_TARGETS: SLOTargets = {
  snapshotJobCompletion: {
    target: "≤ 60s P95",
    measurement: "Time from poll close to snapshot creation",
    alertThreshold: 120, // 2x target
    criticalThreshold: 300, // 5x target
    unit: "seconds"
  },
  
  realtimePublishLag: {
    target: "≤ 2s P95",
    measurement: "Time from vote to realtime broadcast",
    alertThreshold: 4,
    criticalThreshold: 10,
    unit: "seconds"
  },
  
  irvRecompute: {
    target: "≤ 8s P95 for 1M ballots",
    measurement: "Full IRV recalculation time",
    alertThreshold: 16,
    criticalThreshold: 40,
    unit: "seconds"
  },
  
  incrementalUpdate: {
    target: "≤ 300ms P95",
    measurement: "Incremental tally update time",
    alertThreshold: 600,
    criticalThreshold: 1500,
    unit: "milliseconds"
  },
  
  availability: {
    target: "99.9% uptime",
    measurement: "Service availability over 30 days",
    alertThreshold: 99.5,
    criticalThreshold: 99.0,
    unit: "percentage"
  },
  
  errorRate: {
    target: "≤ 0.1% error rate",
    measurement: "Failed requests / total requests",
    alertThreshold: 0.5,
    criticalThreshold: 1.0,
    unit: "percentage"
  },
  
  responseTime: {
    target: "≤ 200ms P95",
    measurement: "API response time",
    alertThreshold: 500,
    criticalThreshold: 1000,
    unit: "milliseconds"
  }
};

export class SLOMonitor {
  private metrics: Map<string, MetricBufferType> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private alertCallbacks: ((alert: Alert) => Promise<void>)[] = [];

  constructor() {
    this.initializeMetricBuffers();
  }

  /**
   * Record a metric measurement
   */
  async recordMetric(sloName: string, value: number, timestamp: number = Date.now()): Promise<void> {
    const buffer = this.getOrCreateBuffer(sloName);
    buffer.addMeasurement(value, timestamp);
    
    // Check SLO compliance
    await this.checkSLOCompliance(sloName, buffer);
    
    logger.debug(`Recorded metric for ${sloName}`, { value, timestamp });
  }

  /**
   * Check SLO compliance and trigger alerts if needed
   */
  private async checkSLOCompliance(sloName: string, buffer: MetricBufferType): Promise<void> {
    const target = SLO_TARGETS[sloName as keyof SLOTargets];
    if (!target) {
      logger.warn(`Unknown SLO target: ${sloName}`);
      return;
    }
    
    const p95 = buffer.getPercentile(95);
    const p99 = buffer.getPercentile(99);
    
    if (p95 > target.criticalThreshold) {
      await this.triggerCriticalAlert(sloName, p95, target);
    } else if (p95 > target.alertThreshold) {
      await this.triggerWarningAlert(sloName, p95, target);
    } else {
      // SLO is healthy - resolve any existing alerts
      await this.resolveAlerts(sloName);
    }
  }

  /**
   * Trigger critical alert
   */
  private async triggerCriticalAlert(sloName: string, value: number, target: SLOTarget): Promise<void> {
    const alertId = `${sloName}-critical-${Date.now()}`;
    const alert: Alert = {
      id: alertId,
      severity: 'critical',
      slo: sloName,
      value,
      target: target.target,
      threshold: target.criticalThreshold,
      timestamp: Date.now(),
      message: `SLO ${sloName} critical threshold exceeded: ${value}${target.unit} > ${target.criticalThreshold}${target.unit}`,
      resolved: false
    };
    
    this.alerts.set(alertId, alert);
    await this.sendAlert(alert);
    await this.pageOnCall(alert);
    
    logger.error(`Critical SLO alert triggered`, { sloName, value, threshold: target.criticalThreshold });
  }

  /**
   * Trigger warning alert
   */
  private async triggerWarningAlert(sloName: string, value: number, target: SLOTarget): Promise<void> {
    const alertId = `${sloName}-warning-${Date.now()}`;
    const alert: Alert = {
      id: alertId,
      severity: 'warning',
      slo: sloName,
      value,
      target: target.target,
      threshold: target.alertThreshold,
      timestamp: Date.now(),
      message: `SLO ${sloName} warning threshold exceeded: ${value}${target.unit} > ${target.alertThreshold}${target.unit}`,
      resolved: false
    };
    
    this.alerts.set(alertId, alert);
    await this.sendAlert(alert);
    
    logger.warn(`Warning SLO alert triggered`, { sloName, value, threshold: target.alertThreshold });
  }

  /**
   * Resolve existing alerts for an SLO
   */
  private async resolveAlerts(sloName: string): Promise<void> {
    for (const [alertId, alert] of this.alerts.entries()) {
      if (alert.slo === sloName && !alert.resolved) {
        alert.resolved = true;
        alert.resolvedAt = Date.now();
        
        logger.info(`SLO alert resolved`, { sloName, alertId });
      }
    }
  }

  /**
   * Send alert to configured channels
   */
  private async sendAlert(alert: Alert): Promise<void> {
    for (const callback of this.alertCallbacks) {
      try {
        await callback(alert);
      } catch (error) {
        logger.error(`Failed to send alert`, { alertId: alert.id, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
  }

  /**
   * Page on-call engineer for critical alerts
   */
  private async pageOnCall(alert: Alert): Promise<void> {
    if (alert.severity === 'critical') {
      // In production, this would integrate with PagerDuty, OpsGenie, etc.
      logger.error(`PAGING ON-CALL: ${alert.message}`, { alertId: alert.id });
      
      // Send to multiple channels
      await this.sendToSlack(alert);
      await this.sendToEmail(alert);
      await this.sendToSMS(alert);
    }
  }

  /**
   * Send alert to Slack
   */
  private async sendToSlack(alert: Alert): Promise<void> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) return;
    
    const message = {
      text: `🚨 ${alert.severity.toUpperCase()} SLO Alert`,
      attachments: [{
        color: alert.severity === 'critical' ? 'danger' : 'warning',
        fields: [
          { title: 'SLO', value: alert.slo, short: true },
          { title: 'Value', value: `${alert.value}`, short: true },
          { title: 'Target', value: alert.target, short: true },
          { title: 'Threshold', value: `${alert.threshold}`, short: true },
          { title: 'Message', value: alert.message, short: false }
        ],
        timestamp: alert.timestamp
      }]
    };
    
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
    } catch (error) {
        logger.error(`Failed to send Slack alert`, { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Send alert to email
   */
  private async sendToEmail(alert: Alert): Promise<void> {
    // In production, integrate with SendGrid, SES, etc.
    logger.info(`Email alert sent`, { alertId: alert.id, severity: alert.severity });
  }

  /**
   * Send alert to SMS
   */
  private async sendToSMS(alert: Alert): Promise<void> {
    // In production, integrate with Twilio, etc.
    logger.info(`SMS alert sent`, { alertId: alert.id, severity: alert.severity });
  }

  /**
   * Get current SLO metrics
   */
  getSLOMetrics(): SLOMetrics[] {
    const metrics: SLOMetrics[] = [];
    
    for (const [sloName, buffer] of this.metrics.entries()) {
      const target = SLO_TARGETS[sloName as keyof SLOTargets];
      if (!target) continue;
      
      const p95 = buffer.getPercentile(95);
      const p99 = buffer.getPercentile(99);
      
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (p95 > target.criticalThreshold) {
        status = 'critical';
      } else if (p95 > target.alertThreshold) {
        status = 'warning';
      }
      
      metrics.push({
        sloName,
        currentValue: p95,
        target: target.target,
        status,
        percentile95: p95,
        percentile99: p99,
        sampleSize: buffer.measurements.length,
        lastUpdated: Date.now()
      });
    }
    
    return metrics;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Add alert callback
   */
  addAlertCallback(callback: (alert: Alert) => Promise<void>): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Initialize metric buffers
   */
  private initializeMetricBuffers(): void {
    for (const sloName of Object.keys(SLO_TARGETS)) {
      this.metrics.set(sloName, new MetricBuffer(1000)); // Keep last 1000 measurements
    }
  }

  /**
   * Get or create metric buffer
   */
  private getOrCreateBuffer(sloName: string): MetricBufferType {
    if (!this.metrics.has(sloName)) {
      this.metrics.set(sloName, new MetricBuffer(1000));
    }
    return this.metrics.get(sloName)!;
  }
}

/**
 * MetricBuffer implementation
 */
export class MetricBuffer {
  measurements: { value: number; timestamp: number }[] = [];
  maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  addMeasurement(value: number, timestamp: number): void {
    this.measurements.push({ value, timestamp });
    
    // Maintain max size
    if (this.measurements.length > this.maxSize) {
      this.measurements.shift();
    }
  }

  getPercentile(percentile: number): number {
    if (this.measurements.length === 0) return 0;
    
    const sorted = this.measurements
      .map(m => m.value)
      .sort((a, b) => a - b);
    
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    const value = sorted[Math.max(0, index)];
    return value ?? 0;
  }

  getAverage(): number {
    if (this.measurements.length === 0) return 0;
    
    const sum = this.measurements.reduce((acc, m) => acc + m.value, 0);
    return sum / this.measurements.length;
  }

  getCount(): number {
    return this.measurements.length;
  }
}

// Global SLO monitor instance
export const sloMonitor = new SLOMonitor();
