/**
 * Performance Monitoring Utilities
 * 
 * Provides utilities for monitoring and optimizing performance metrics
 * including Core Web Vitals, memory usage, and bundle analysis.
 * 
 * Created: January 27, 2025
 * Status: ✅ ACTIVE
 */

// Import React for the hook
import React from 'react';

export type PerformanceMetrics = {
  // Core Web Vitals
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  
  // Loading Performance
  fcp: number; // First Contentful Paint
  tti: number; // Time to Interactive
  tbt: number; // Total Blocking Time
  
  // Resource Performance
  jsBundleSize: number;
  cssBundleSize: number;
  imageCount: number;
  totalRequests: number;
  
  // Memory Performance
  memoryUsage: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

export type PerformanceThresholds = {
  lcp: number; // 2.5s
  fid: number; // 100ms
  cls: number; // 0.1
  fcp: number; // 1.8s
  tti: number; // 3.8s
  tbt: number; // 200ms
  jsBundleSize: number; // 500KB
  cssBundleSize: number; // 100KB
  memoryGrowth: number; // 50MB
}

export const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  lcp: 2500, // 2.5 seconds
  fid: 100,  // 100 milliseconds
  cls: 0.1,  // 0.1
  fcp: 1800, // 1.8 seconds
  tti: 3800, // 3.8 seconds
  tbt: 200,  // 200 milliseconds
  jsBundleSize: 500000, // 500KB
  cssBundleSize: 100000, // 100KB
  memoryGrowth: 52428800, // 50MB
};

/**
 * Performance Monitor Class
 */
export class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;

  constructor() {
    this.initializeObservers();
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers(): void {
    if (typeof window === 'undefined') return;

    // LCP Observer
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry?.startTime || 0;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // FID Observer
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.processingStart && entry.startTime) {
            this.metrics.fid = entry.processingStart - entry.startTime;
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // CLS Observer
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.metrics.cls = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);

      // FCP Observer
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime;
          }
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(fcpObserver);
    }
  }

  /**
   * Start monitoring performance
   */
  startMonitoring(): void {
    this.isMonitoring = true;
    this.initializeObservers();
  }

  /**
   * Stop monitoring performance
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): Partial<PerformanceMetrics> {
    if (typeof window === 'undefined') return {};

    // Get memory usage
    if ('memory' in performance) {
      this.metrics.memoryUsage = {
        usedJSHeapSize: (performance.memory as any).usedJSHeapSize,
        totalJSHeapSize: (performance.memory as any).totalJSHeapSize,
        jsHeapSizeLimit: (performance.memory as any).jsHeapSizeLimit,
      };
    }

    // Get resource metrics
    const resources = performance.getEntriesByType('resource');
    let jsSize = 0;
    let cssSize = 0;
    let imageCount = 0;

    resources.forEach((resource: any) => {
      if (resource.name.includes('.js')) {
        jsSize += resource.transferSize || 0;
      } else if (resource.name.includes('.css')) {
        cssSize += resource.transferSize || 0;
      } else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
        imageCount++;
      }
    });

    this.metrics.jsBundleSize = jsSize;
    this.metrics.cssBundleSize = cssSize;
    this.metrics.imageCount = imageCount;
    this.metrics.totalRequests = resources.length;

    return { ...this.metrics };
  }

  /**
   * Validate performance metrics against thresholds
   */
  validateMetrics(thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS): {
    passed: boolean;
    failures: string[];
    score: number;
  } {
    const metrics = this.getMetrics();
    const failures: string[] = [];
    let score = 100;

    // Check each metric
    if (metrics.lcp && metrics.lcp > thresholds.lcp) {
      failures.push(`LCP ${metrics.lcp}ms exceeds threshold ${thresholds.lcp}ms`);
      score -= 20;
    }

    if (metrics.fid && metrics.fid > thresholds.fid) {
      failures.push(`FID ${metrics.fid}ms exceeds threshold ${thresholds.fid}ms`);
      score -= 20;
    }

    if (metrics.cls && metrics.cls > thresholds.cls) {
      failures.push(`CLS ${metrics.cls} exceeds threshold ${thresholds.cls}`);
      score -= 20;
    }

    if (metrics.fcp && metrics.fcp > thresholds.fcp) {
      failures.push(`FCP ${metrics.fcp}ms exceeds threshold ${thresholds.fcp}ms`);
      score -= 10;
    }

    if (metrics.tti && metrics.tti > thresholds.tti) {
      failures.push(`TTI ${metrics.tti}ms exceeds threshold ${thresholds.tti}ms`);
      score -= 10;
    }

    if (metrics.tbt && metrics.tbt > thresholds.tbt) {
      failures.push(`TBT ${metrics.tbt}ms exceeds threshold ${thresholds.tbt}ms`);
      score -= 10;
    }

    if (metrics.jsBundleSize && metrics.jsBundleSize > thresholds.jsBundleSize) {
      failures.push(`JS Bundle ${metrics.jsBundleSize} bytes exceeds threshold ${thresholds.jsBundleSize} bytes`);
      score -= 5;
    }

    if (metrics.cssBundleSize && metrics.cssBundleSize > thresholds.cssBundleSize) {
      failures.push(`CSS Bundle ${metrics.cssBundleSize} bytes exceeds threshold ${thresholds.cssBundleSize} bytes`);
      score -= 5;
    }

    return {
      passed: failures.length === 0,
      failures,
      score: Math.max(0, score)
    };
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const metrics = this.getMetrics();
    const validation = this.validateMetrics();

    return `
# Performance Report

## Core Web Vitals
- **LCP (Largest Contentful Paint):** ${metrics.lcp ? `${metrics.lcp}ms` : 'N/A'}
- **FID (First Input Delay):** ${metrics.fid ? `${metrics.fid}ms` : 'N/A'}
- **CLS (Cumulative Layout Shift):** ${metrics.cls ? metrics.cls.toFixed(3) : 'N/A'}

## Loading Performance
- **FCP (First Contentful Paint):** ${metrics.fcp ? `${metrics.fcp}ms` : 'N/A'}
- **TTI (Time to Interactive):** ${metrics.tti ? `${metrics.tti}ms` : 'N/A'}
- **TBT (Total Blocking Time):** ${metrics.tbt ? `${metrics.tbt}ms` : 'N/A'}

## Resource Performance
- **JavaScript Bundle Size:** ${metrics.jsBundleSize ? `${(metrics.jsBundleSize / 1024).toFixed(2)}KB` : 'N/A'}
- **CSS Bundle Size:** ${metrics.cssBundleSize ? `${(metrics.cssBundleSize / 1024).toFixed(2)}KB` : 'N/A'}
- **Image Count:** ${metrics.imageCount || 'N/A'}
- **Total Requests:** ${metrics.totalRequests || 'N/A'}

## Memory Performance
- **Used JS Heap:** ${metrics.memoryUsage ? `${(metrics.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB` : 'N/A'}
- **Total JS Heap:** ${metrics.memoryUsage ? `${(metrics.memoryUsage.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB` : 'N/A'}

## Performance Score
- **Score:** ${validation.score}/100
- **Status:** ${validation.passed ? '✅ PASSED' : '❌ FAILED'}

## Issues
${validation.failures.length > 0 ? validation.failures.map(f => `- ${f}`).join('\n') : '- ✅ All metrics within acceptable ranges'}

## Recommendations
${this.generateRecommendations(metrics)}
`;
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(metrics: Partial<PerformanceMetrics>): string {
    const recommendations: string[] = [];

    if (metrics.lcp && metrics.lcp > 2500) {
      recommendations.push('- Optimize Largest Contentful Paint (LCP) by reducing image sizes and improving server response times');
    }

    if (metrics.fid && metrics.fid > 100) {
      recommendations.push('- Reduce First Input Delay (FID) by optimizing JavaScript execution and reducing main thread blocking');
    }

    if (metrics.cls && metrics.cls > 0.1) {
      recommendations.push('- Minimize Cumulative Layout Shift (CLS) by setting explicit dimensions for images and avoiding dynamic content insertion');
    }

    if (metrics.jsBundleSize && metrics.jsBundleSize > 500000) {
      recommendations.push('- Optimize JavaScript bundle size by code splitting, tree shaking, and removing unused dependencies');
    }

    if (metrics.cssBundleSize && metrics.cssBundleSize > 100000) {
      recommendations.push('- Optimize CSS bundle size by removing unused styles and using CSS-in-JS solutions');
    }

    if (metrics.totalRequests && metrics.totalRequests > 50) {
      recommendations.push('- Reduce number of network requests by combining resources and using HTTP/2 server push');
    }

    if (recommendations.length === 0) {
      return '- ✅ All performance metrics are within acceptable ranges';
    }

    return recommendations.join('\n');
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook for using performance monitoring in React components
 */
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = React.useState<Partial<PerformanceMetrics>>({});
  const [isMonitoring, setIsMonitoring] = React.useState(false);

  const startMonitoring = React.useCallback(() => {
    performanceMonitor.startMonitoring();
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = React.useCallback(() => {
    performanceMonitor.stopMonitoring();
    setIsMonitoring(false);
  }, []);

  const updateMetrics = React.useCallback(() => {
    const currentMetrics = performanceMonitor.getMetrics();
    setMetrics(currentMetrics);
  }, []);

  React.useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(updateMetrics, 1000);
      return () => clearInterval(interval);
    }
  }, [isMonitoring, updateMetrics]);

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    updateMetrics,
    validateMetrics: performanceMonitor.validateMetrics.bind(performanceMonitor),
    generateReport: performanceMonitor.generateReport.bind(performanceMonitor),
  };
}

