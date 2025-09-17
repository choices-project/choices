/**
 * Bundle Monitor
 * 
 * Monitors bundle size and provides alerts when thresholds are exceeded.
 * Integrates with webpack bundle analyzer and provides real-time monitoring.
 */

type BundleMetrics = {
  name: string;
  size: number;
  gzipSize?: number;
  chunks: string[];
  dependencies: string[];
  timestamp: number;
}

type BundleThresholds = {
  maxBundleSize: number;
  maxChunkSize: number;
  warningBundleSize: number;
  warningChunkSize: number;
}

type BundleAlert = {
  type: 'error' | 'warning' | 'info';
  message: string;
  bundle: string;
  size: number;
  threshold: number;
  timestamp: number;
}

class BundleMonitor {
  private metrics: BundleMetrics[] = [];
  private thresholds: BundleThresholds;
  private alerts: BundleAlert[] = [];
  private observers: ((metrics: BundleMetrics[]) => void)[] = [];

  constructor(thresholds?: Partial<BundleThresholds>) {
    this.thresholds = {
      maxBundleSize: 512000, // 500KB
      maxChunkSize: 244000,  // 250KB
      warningBundleSize: 400000, // 400KB
      warningChunkSize: 200000,  // 200KB
      ...thresholds,
    };
  }

  /**
   * Add bundle metrics
   */
  addMetrics(metrics: Omit<BundleMetrics, 'timestamp'>): void {
    const bundleMetrics: BundleMetrics = {
      ...metrics,
      timestamp: Date.now(),
    };

    this.metrics.push(bundleMetrics);
    this.checkThresholds(bundleMetrics);
    this.notifyObservers();
  }

  /**
   * Check if bundle exceeds thresholds
   */
  private checkThresholds(metrics: BundleMetrics): void {
    const { name, size } = metrics;

    // Check bundle size
    if (size > this.thresholds.maxBundleSize) {
      this.addAlert({
        type: 'error',
        message: `Bundle "${name}" exceeds maximum size limit`,
        bundle: name,
        size,
        threshold: this.thresholds.maxBundleSize,
        timestamp: Date.now(),
      });
    } else if (size > this.thresholds.warningBundleSize) {
      this.addAlert({
        type: 'warning',
        message: `Bundle "${name}" is approaching size limit`,
        bundle: name,
        size,
        threshold: this.thresholds.warningBundleSize,
        timestamp: Date.now(),
      });
    }

    // Check individual chunks
    metrics.chunks.forEach((chunk) => {
      // This would need to be implemented with actual chunk size data
      // For now, we'll estimate based on bundle size
      const estimatedChunkSize = size / metrics.chunks.length;
      
      if (estimatedChunkSize > this.thresholds.maxChunkSize) {
        this.addAlert({
          type: 'error',
          message: `Chunk "${chunk}" in bundle "${name}" exceeds maximum size limit`,
          bundle: name,
          size: estimatedChunkSize,
          threshold: this.thresholds.maxChunkSize,
          timestamp: Date.now(),
        });
      } else if (estimatedChunkSize > this.thresholds.warningChunkSize) {
        this.addAlert({
          type: 'warning',
          message: `Chunk "${chunk}" in bundle "${name}" is approaching size limit`,
          bundle: name,
          size: estimatedChunkSize,
          threshold: this.thresholds.warningChunkSize,
          timestamp: Date.now(),
        });
      }
    });
  }

  /**
   * Add alert
   */
  private addAlert(alert: BundleAlert): void {
    this.alerts.push(alert);
    
    // Log alert
    const logMethod = alert.type === 'error' ? console.error : 
                     alert.type === 'warning' ? console.warn : console.info;
    
    logMethod(`[Bundle Monitor] ${alert.message} (${this.formatBytes(alert.size)} > ${this.formatBytes(alert.threshold)})`);
  }

  /**
   * Get current metrics
   */
  getMetrics(): BundleMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get alerts
   */
  getAlerts(): BundleAlert[] {
    return [...this.alerts];
  }

  /**
   * Get alerts by type
   */
  getAlertsByType(type: BundleAlert['type']): BundleAlert[] {
    return this.alerts.filter(alert => alert.type === type);
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Subscribe to metrics updates
   */
  subscribe(callback: (metrics: BundleMetrics[]) => void): () => void {
    this.observers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  /**
   * Notify observers
   */
  private notifyObservers(): void {
    this.observers.forEach(callback => callback(this.metrics));
  }

  /**
   * Get bundle size summary
   */
  getSummary(): {
    totalBundles: number;
    totalSize: number;
    averageSize: number;
    largestBundle: BundleMetrics | null;
    smallestBundle: BundleMetrics | null;
    alertsCount: number;
  } {
    const totalSize = this.metrics.reduce((sum, metric) => sum + metric.size, 0);
    const averageSize = this.metrics.length > 0 ? totalSize / this.metrics.length : 0;
    
    const largestBundle = this.metrics.reduce((largest, current) => 
      !largest || current.size > largest.size ? current : largest, null as BundleMetrics | null);
    
    const smallestBundle = this.metrics.reduce((smallest, current) => 
      !smallest || current.size < smallest.size ? current : smallest, null as BundleMetrics | null);

    return {
      totalBundles: this.metrics.length,
      totalSize,
      averageSize,
      largestBundle,
      smallestBundle,
      alertsCount: this.alerts.length,
    };
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Export metrics to JSON
   */
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      alerts: this.alerts,
      summary: this.getSummary(),
      thresholds: this.thresholds,
      timestamp: Date.now(),
    }, null, 2);
  }

  /**
   * Import metrics from JSON
   */
  importMetrics(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.metrics = parsed.metrics || [];
      this.alerts = parsed.alerts || [];
    } catch (error) {
      console.error('Failed to import metrics:', error);
    }
  }
}

// Create singleton instance
export const bundleMonitor = new BundleMonitor();

// Export types and class
export type { BundleMetrics, BundleThresholds, BundleAlert };
export { BundleMonitor };
