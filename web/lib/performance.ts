/**
 * Performance monitoring utilities
 * Provides tools for tracking and optimizing application performance
 */

import React from 'react';
import { logger } from './logger';

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface PerformanceThresholds {
  warning: number; // milliseconds
  error: number; // milliseconds
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private thresholds: Map<string, PerformanceThresholds> = new Map();
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development' || process.env.ENABLE_PERFORMANCE_MONITORING === 'true';
  }

  // Set performance thresholds for specific operations
  setThreshold(operation: string, thresholds: PerformanceThresholds): void {
    this.thresholds.set(operation, thresholds);
  }

  // Measure execution time of a function
  async measure<T>(
    name: string,
    fn: () => Promise<T> | T,
    metadata?: Record<string, any>
  ): Promise<T> {
    if (!this.isEnabled) {
      return await fn();
    }

    const startTime = performance.now();
    const startDate = new Date();

    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      
      this.recordMetric(name, duration, metadata);
      this.checkThresholds(name, duration);
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, { ...metadata, error: true });
      throw error;
    }
  }

  // Record a performance metric
  recordMetric(name: string, duration: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: new Date(),
      metadata
    };

    this.metrics.push(metric);
    logger.performance(name, duration, metadata);
  }

  // Check if performance exceeds thresholds
  private checkThresholds(name: string, duration: number): void {
    const threshold = this.thresholds.get(name);
    if (!threshold) return;

    if (duration >= threshold.error) {
      logger.error(`Performance error: ${name} took ${duration}ms`, undefined, {
        operation: name,
        duration,
        threshold: threshold.error
      });
    } else if (duration >= threshold.warning) {
      logger.warn(`Performance warning: ${name} took ${duration}ms`, {
        operation: name,
        duration,
        threshold: threshold.warning
      });
    }
  }

  // Get performance statistics
  getStats(operation?: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  } {
    const filteredMetrics = operation 
      ? this.metrics.filter(m => m.name === operation)
      : this.metrics;

    if (filteredMetrics.length === 0) {
      return { count: 0, average: 0, min: 0, max: 0, p95: 0, p99: 0 };
    }

    const durations = filteredMetrics.map(m => m.duration).sort((a, b) => a - b);
    const count = durations.length;
    const average = durations.reduce((sum: any, d: any) => sum + d, 0) / count;
    const min = durations[0];
    const max = durations[count - 1];
    const p95Index = Math.floor(count * 0.95);
    const p99Index = Math.floor(count * 0.99);

    return {
      count,
      average,
      min,
      max,
      p95: durations[p95Index] || 0,
      p99: durations[p99Index] || 0
    };
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics = [];
  }

  // Get all metrics
  getAllMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Convenience functions
export const measure = <T>(
  name: string,
  fn: () => Promise<T> | T,
  metadata?: Record<string, any>
) => {
  return performanceMonitor.measure(name, fn, metadata);
};

export const recordMetric = (name: string, duration: number, metadata?: Record<string, any>) => {
  performanceMonitor.recordMetric(name, duration, metadata);
};

export const getPerformanceStats = (operation?: string) => {
  return performanceMonitor.getStats(operation);
};

// React hook for measuring component render time
export const usePerformanceMeasure = (componentName: string) => {
  const startTime = React.useRef<number>(0);
  
  React.useEffect(() => {
    startTime.current = performance.now();
    
    return () => {
      const duration = performance.now() - startTime.current;
      recordMetric(`${componentName} render`, duration);
    };
  });
};

// API call performance wrapper
export const withPerformanceTracking = <T extends any[], R>(
  operationName: string,
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    return measure(operationName, () => fn(...args), { args: args.length });
  };
};

// Database query performance wrapper
export const withDbPerformanceTracking = <T extends any[], R>(
  table: string,
  operation: string,
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    return measure(`db_${operation}_${table}`, () => fn(...args), { 
      table, 
      operation,
      args: args.length 
    });
  };
};
