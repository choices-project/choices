/**
 * Simple Performance Monitor
 * 
 * This module provides basic performance monitoring functionality.
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class SimplePerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    if (typeof window === 'undefined') return;

    // Monitor navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.recordMetric({
              name: `navigation.${entry.name}`,
              value: entry.duration,
              timestamp: new Date(),
              metadata: {
                type: entry.entryType,
                startTime: entry.startTime
              }
            });
          });
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navObserver);
      } catch (error) {
        console.warn('Failed to initialize navigation observer:', error);
      }

      // Monitor resource timing
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.recordMetric({
              name: `resource.${entry.name}`,
              value: entry.duration,
              timestamp: new Date(),
              metadata: {
                type: entry.entryType,
                startTime: entry.startTime,
                transferSize: (entry as any).transferSize,
                encodedBodySize: (entry as any).encodedBodySize
              }
            });
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);
      } catch (error) {
        console.warn('Failed to initialize resource observer:', error);
      }
    }
  }

  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(metric => metric.name === name);
    }
    return [...this.metrics];
  }

  getAverageMetric(name: string, timeWindow?: number): number | null {
    const metrics = this.getMetrics(name);
    
    if (metrics.length === 0) return null;

    let filteredMetrics = metrics;
    if (timeWindow) {
      const cutoff = new Date(Date.now() - timeWindow);
      filteredMetrics = metrics.filter(metric => metric.timestamp >= cutoff);
    }

    if (filteredMetrics.length === 0) return null;

    const sum = filteredMetrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / filteredMetrics.length;
  }

  clearMetrics() {
    this.metrics = [];
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.metrics = [];
  }
}

// Singleton instance
export const performanceMonitor = new SimplePerformanceMonitor();



