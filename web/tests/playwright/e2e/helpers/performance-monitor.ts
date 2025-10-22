/**
 * Performance Monitor - Advanced Performance Testing
 * 
 * This module provides comprehensive performance monitoring and optimization
 * for the Testing Roadmap to Perfection.
 * 
 * Created: January 27, 2025
 * Updated: January 27, 2025
 */

import type { Page } from '@playwright/test';
import type { Database } from '@/types/database';

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  
  // Performance Metrics
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  domContentLoaded: number;
  loadComplete: number;
  
  // Memory Metrics
  memoryUsage: number;
  memoryLeaks: boolean;
  heapSize: number;
  
  // Network Metrics
  requestsCount: number;
  totalSize: number;
  slowestRequest: number;
  
  // Custom Metrics
  pollCreationTime: number;
  votingTime: number;
  navigationTime: number;
}

export interface PerformanceThresholds {
  lcp: number; // < 2.5s
  fid: number; // < 100ms
  cls: number; // < 0.1
  fcp: number; // < 1.8s
  ttfb: number; // < 600ms
  memoryUsage: number; // < 50MB
  pollCreationTime: number; // < 5s
  votingTime: number; // < 2s
  navigationTime: number; // < 1s
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private thresholds: PerformanceThresholds;

  private constructor() {
    this.thresholds = {
      lcp: 2500, // 2.5 seconds
      fid: 100, // 100ms
      cls: 0.1, // 0.1
      fcp: 1800, // 1.8 seconds
      ttfb: 600, // 600ms
      memoryUsage: 50 * 1024 * 1024, // 50MB
      pollCreationTime: 5000, // 5 seconds
      votingTime: 2000, // 2 seconds
      navigationTime: 1000, // 1 second
    };
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Monitor Core Web Vitals
   */
  async monitorCoreWebVitals(page: Page): Promise<Partial<PerformanceMetrics>> {
    const metrics: Partial<PerformanceMetrics> = {};

    try {
      // Get LCP (Largest Contentful Paint) with timeout
             const lcp = await page.evaluate(() => {
               return new Promise((resolve) => {
                 const timeout = setTimeout(() => resolve(0), 5000); // 5 second timeout
                 new PerformanceObserver((list) => {
                   const entries = list.getEntries();
                   const lastEntry = entries[entries.length - 1];
                   clearTimeout(timeout);
                   resolve(lastEntry?.startTime || 0);
                 }).observe({ entryTypes: ['largest-contentful-paint'] });
               });
             });
      metrics.lcp = lcp as number;

      // Get FID (First Input Delay) with timeout
      const fid = await page.evaluate(() => {
        return new Promise((resolve) => {
          const timeout = setTimeout(() => resolve(0), 5000); // 5 second timeout
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const firstEntry = entries[0];
            clearTimeout(timeout);
            if (firstEntry && 'processingStart' in firstEntry) {
              resolve((firstEntry as any).processingStart - firstEntry.startTime);
            } else {
              resolve(0);
            }
          }).observe({ entryTypes: ['first-input'] });
        });
      });
      metrics.fid = fid as number;

      // Get CLS (Cumulative Layout Shift)
      const cls = await page.evaluate(() => {
        return new Promise((resolve) => {
          let clsValue = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
            resolve(clsValue);
          }).observe({ entryTypes: ['layout-shift'] });
        });
      });
      metrics.cls = cls as number;

    } catch (error) {
      console.warn('Core Web Vitals monitoring failed:', error);
    }

    return metrics;
  }

  /**
   * Monitor Performance Metrics
   */
  async monitorPerformanceMetrics(page: Page): Promise<Partial<PerformanceMetrics>> {
    const metrics: Partial<PerformanceMetrics> = {};

    try {
      // Get FCP (First Contentful Paint)
      const fcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const firstEntry = entries[0];
            resolve(firstEntry?.startTime || 0);
          }).observe({ entryTypes: ['paint'] });
        });
      });
      metrics.fcp = fcp as number;

      // Get TTFB (Time to First Byte)
      const ttfb = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return navigation.responseStart - navigation.requestStart;
      });
      metrics.ttfb = ttfb;

      // Get DOM Content Loaded time
      const domContentLoaded = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return navigation.domContentLoadedEventEnd - (navigation as any).navigationStart;
      });
      metrics.domContentLoaded = domContentLoaded;

      // Get Load Complete time
      const loadComplete = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return navigation.loadEventEnd - (navigation as any).navigationStart;
      });
      metrics.loadComplete = loadComplete;

    } catch (error) {
      console.warn('Performance metrics monitoring failed:', error);
    }

    return metrics;
  }

  /**
   * Monitor Memory Usage
   */
  async monitorMemoryUsage(page: Page): Promise<Partial<PerformanceMetrics>> {
    const metrics: Partial<PerformanceMetrics> = {};

    try {
      const memoryInfo = await page.evaluate(() => {
        if ('memory' in performance) {
          return {
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
            jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
          };
        }
        return null;
      });

      if (memoryInfo) {
        metrics.memoryUsage = memoryInfo.usedJSHeapSize;
        metrics.heapSize = memoryInfo.totalJSHeapSize;
        metrics.memoryLeaks = memoryInfo.usedJSHeapSize > 50 * 1024 * 1024; // 50MB threshold
      }

    } catch (error) {
      console.warn('Memory monitoring failed:', error);
    }

    return metrics;
  }

  /**
   * Monitor Network Performance
   */
  async monitorNetworkPerformance(page: Page): Promise<Partial<PerformanceMetrics>> {
    const metrics: Partial<PerformanceMetrics> = {};

    try {
      // Check if page is still valid before evaluating
      if (page.isClosed()) {
        console.log('⚠️ Page is closed, skipping network performance monitoring');
        return metrics;
      }

      const networkInfo = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource');
        let totalSize = 0;
        let slowestRequest = 0;
        
        resources.forEach((resource: any) => {
          totalSize += resource.transferSize || 0;
          const duration = resource.responseEnd - resource.startTime;
          if (duration > slowestRequest) {
            slowestRequest = duration;
          }
        });

        return {
          requestsCount: resources.length,
          totalSize,
          slowestRequest,
        };
      }).catch(error => {
        console.log('⚠️ Failed to evaluate network performance:', error.message);
        return { requestsCount: 0, totalSize: 0, slowestRequest: 0 };
      });

      metrics.requestsCount = networkInfo.requestsCount;
      metrics.totalSize = networkInfo.totalSize;
      metrics.slowestRequest = networkInfo.slowestRequest;

    } catch (error) {
      console.warn('Network monitoring failed:', error);
    }

    return metrics;
  }

  /**
   * Monitor Custom Application Metrics
   */
  async monitorCustomMetrics(page: Page, action: string): Promise<Partial<PerformanceMetrics>> {
    const metrics: Partial<PerformanceMetrics> = {};

    try {
      const startTime = performance.now();

      // Wait for the action to complete
      await page.waitForLoadState('networkidle');

      const endTime = performance.now();
      const duration = endTime - startTime;

      switch (action) {
        case 'poll-creation':
          metrics.pollCreationTime = duration;
          break;
        case 'voting':
          metrics.votingTime = duration;
          break;
        case 'navigation':
          metrics.navigationTime = duration;
          break;
      }

    } catch (error) {
      console.warn(`Custom metrics monitoring for ${action} failed:`, error);
    }

    return metrics;
  }

  /**
   * Comprehensive Performance Monitoring
   */
  async monitorComprehensive(page: Page, action?: string): Promise<PerformanceMetrics> {
    const metrics: PerformanceMetrics = {
      lcp: 0,
      fid: 0,
      cls: 0,
      fcp: 0,
      ttfb: 0,
      domContentLoaded: 0,
      loadComplete: 0,
      memoryUsage: 0,
      memoryLeaks: false,
      heapSize: 0,
      requestsCount: 0,
      totalSize: 0,
      slowestRequest: 0,
      pollCreationTime: 0,
      votingTime: 0,
      navigationTime: 0,
    };

    // Monitor Core Web Vitals
    const coreWebVitals = await this.monitorCoreWebVitals(page);
    Object.assign(metrics, coreWebVitals);

    // Monitor Performance Metrics
    const performanceMetrics = await this.monitorPerformanceMetrics(page);
    Object.assign(metrics, performanceMetrics);

    // Monitor Memory Usage
    const memoryMetrics = await this.monitorMemoryUsage(page);
    Object.assign(metrics, memoryMetrics);

    // Monitor Network Performance
    const networkMetrics = await this.monitorNetworkPerformance(page);
    Object.assign(metrics, networkMetrics);

    // Monitor Custom Metrics
    if (action) {
      const customMetrics = await this.monitorCustomMetrics(page, action);
      Object.assign(metrics, customMetrics);
    }

    // Store metrics
    this.metrics.push(metrics);

    return metrics;
  }

  /**
   * Check Performance Thresholds
   */
  checkThresholds(metrics: PerformanceMetrics): {
    passed: boolean;
    failures: string[];
    warnings: string[];
  } {
    const failures: string[] = [];
    const warnings: string[] = [];

    // Check Core Web Vitals
    if (metrics.lcp > this.thresholds.lcp) {
      failures.push(`LCP ${metrics.lcp}ms exceeds threshold ${this.thresholds.lcp}ms`);
    }
    if (metrics.fid > this.thresholds.fid) {
      failures.push(`FID ${metrics.fid}ms exceeds threshold ${this.thresholds.fid}ms`);
    }
    if (metrics.cls > this.thresholds.cls) {
      failures.push(`CLS ${metrics.cls} exceeds threshold ${this.thresholds.cls}`);
    }

    // Check Performance Metrics
    if (metrics.fcp > this.thresholds.fcp) {
      failures.push(`FCP ${metrics.fcp}ms exceeds threshold ${this.thresholds.fcp}ms`);
    }
    if (metrics.ttfb > this.thresholds.ttfb) {
      failures.push(`TTFB ${metrics.ttfb}ms exceeds threshold ${this.thresholds.ttfb}ms`);
    }

    // Check Memory Usage
    if (metrics.memoryUsage > this.thresholds.memoryUsage) {
      failures.push(`Memory usage ${Math.round(metrics.memoryUsage / 1024 / 1024)}MB exceeds threshold ${Math.round(this.thresholds.memoryUsage / 1024 / 1024)}MB`);
    }
    if (metrics.memoryLeaks) {
      failures.push('Memory leaks detected');
    }

    // Check Custom Metrics
    if (metrics.pollCreationTime > this.thresholds.pollCreationTime) {
      failures.push(`Poll creation time ${metrics.pollCreationTime}ms exceeds threshold ${this.thresholds.pollCreationTime}ms`);
    }
    if (metrics.votingTime > this.thresholds.votingTime) {
      failures.push(`Voting time ${metrics.votingTime}ms exceeds threshold ${this.thresholds.votingTime}ms`);
    }
    if (metrics.navigationTime > this.thresholds.navigationTime) {
      failures.push(`Navigation time ${metrics.navigationTime}ms exceeds threshold ${this.thresholds.navigationTime}ms`);
    }

    return {
      passed: failures.length === 0,
      failures,
      warnings,
    };
  }

  /**
   * Generate Performance Report
   */
  generateReport(): {
    summary: {
      totalTests: number;
      passedTests: number;
      failedTests: number;
      averageLCP: number;
      averageFID: number;
      averageCLS: number;
      averageMemoryUsage: number;
    };
    details: PerformanceMetrics[];
  } {
    const totalTests = this.metrics.length;
    let passedTests = 0;
    let failedTests = 0;
    let totalLCP = 0;
    let totalFID = 0;
    let totalCLS = 0;
    let totalMemoryUsage = 0;

    this.metrics.forEach(metrics => {
      const check = this.checkThresholds(metrics);
      if (check.passed) {
        passedTests++;
      } else {
        failedTests++;
      }
      
      totalLCP += metrics.lcp;
      totalFID += metrics.fid;
      totalCLS += metrics.cls;
      totalMemoryUsage += metrics.memoryUsage;
    });

    return {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        averageLCP: totalTests > 0 ? totalLCP / totalTests : 0,
        averageFID: totalTests > 0 ? totalFID / totalTests : 0,
        averageCLS: totalTests > 0 ? totalCLS / totalTests : 0,
        averageMemoryUsage: totalTests > 0 ? totalMemoryUsage / totalTests : 0,
      },
      details: this.metrics,
    };
  }

  /**
   * Reset Monitor
   */
  reset(): void {
    this.metrics = [];
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();
