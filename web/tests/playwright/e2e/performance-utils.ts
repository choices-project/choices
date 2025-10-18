import { type Page, expect } from '@playwright/test';

/**
 * Performance Testing Utilities
 * 
 * Provides utilities for measuring and validating performance metrics
 * including Core Web Vitals, loading performance, and resource optimization.
 */

export interface PerformanceMetrics {
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
}

export interface PerformanceThresholds {
  lcp: number; // 2.5s
  fid: number; // 100ms
  cls: number; // 0.1
  fcp: number; // 1.8s
  tti: number; // 3.8s
  tbt: number; // 200ms
  jsBundleSize: number; // 500KB
  cssBundleSize: number; // 100KB
}

/**
 * Default performance thresholds based on Core Web Vitals
 */
export const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  lcp: 2500, // 2.5 seconds
  fid: 100,  // 100 milliseconds
  cls: 0.1,  // 0.1
  fcp: 1800, // 1.8 seconds
  tti: 3800, // 3.8 seconds
  tbt: 200,  // 200 milliseconds
  jsBundleSize: 500000, // 500KB
  cssBundleSize: 100000, // 100KB
};

/**
 * Measure Core Web Vitals
 */
export async function measureCoreWebVitals(page: Page): Promise<Partial<PerformanceMetrics>> {
  const metrics = await page.evaluate(() => {
    return new Promise<Partial<PerformanceMetrics>>((resolve) => {
      const metrics: Partial<PerformanceMetrics> = {};
      
      // Measure LCP (Largest Contentful Paint)
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          metrics.lcp = lastEntry?.startTime || 0;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Measure FID (First Input Delay)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            metrics.fid = entry.processingStart - entry.startTime;
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        
        // Measure CLS (Cumulative Layout Shift)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          metrics.cls = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        
        // Resolve after a delay to allow metrics to be collected
        setTimeout(() => {
          resolve(metrics);
        }, 3000);
      } else {
        resolve(metrics);
      }
    });
  });
  
  return metrics;
}

/**
 * Measure loading performance metrics
 */
export async function measureLoadingPerformance(page: Page): Promise<Partial<PerformanceMetrics>> {
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
    const lcp = paint.find(entry => entry.name === 'largest-contentful-paint');
    
    return {
      fcp: fcp ? fcp.startTime : 0,
      tti: navigation.domInteractive - navigation.fetchStart,
      tbt: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
    };
  });
  
  return metrics;
}

/**
 * Measure resource performance
 */
export async function measureResourcePerformance(page: Page): Promise<Partial<PerformanceMetrics>> {
  const metrics = await page.evaluate(() => {
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
    
    return {
      jsBundleSize: jsSize,
      cssBundleSize: cssSize,
      imageCount,
      totalRequests: resources.length
    };
  });
  
  return metrics;
}

/**
 * Validate performance metrics against thresholds
 */
export function validatePerformanceMetrics(
  metrics: Partial<PerformanceMetrics>,
  thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS
): { passed: boolean; failures: string[] } {
  const failures: string[] = [];
  
  if (metrics.lcp && metrics.lcp > thresholds.lcp) {
    failures.push(`LCP ${metrics.lcp}ms exceeds threshold ${thresholds.lcp}ms`);
  }
  
  if (metrics.fid && metrics.fid > thresholds.fid) {
    failures.push(`FID ${metrics.fid}ms exceeds threshold ${thresholds.fid}ms`);
  }
  
  if (metrics.cls && metrics.cls > thresholds.cls) {
    failures.push(`CLS ${metrics.cls} exceeds threshold ${thresholds.cls}`);
  }
  
  if (metrics.fcp && metrics.fcp > thresholds.fcp) {
    failures.push(`FCP ${metrics.fcp}ms exceeds threshold ${thresholds.fcp}ms`);
  }
  
  if (metrics.tti && metrics.tti > thresholds.tti) {
    failures.push(`TTI ${metrics.tti}ms exceeds threshold ${thresholds.tti}ms`);
  }
  
  if (metrics.tbt && metrics.tbt > thresholds.tbt) {
    failures.push(`TBT ${metrics.tbt}ms exceeds threshold ${thresholds.tbt}ms`);
  }
  
  if (metrics.jsBundleSize && metrics.jsBundleSize > thresholds.jsBundleSize) {
    failures.push(`JS Bundle ${metrics.jsBundleSize} bytes exceeds threshold ${thresholds.jsBundleSize} bytes`);
  }
  
  if (metrics.cssBundleSize && metrics.cssBundleSize > thresholds.cssBundleSize) {
    failures.push(`CSS Bundle ${metrics.cssBundleSize} bytes exceeds threshold ${thresholds.cssBundleSize} bytes`);
  }
  
  return {
    passed: failures.length === 0,
    failures
  };
}

/**
 * Assert performance metrics meet thresholds
 */
export async function assertPerformanceMetrics(
  page: Page,
  thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS
): Promise<void> {
  // Measure all performance metrics
  const coreWebVitals = await measureCoreWebVitals(page);
  const loadingPerformance = await measureLoadingPerformance(page);
  const resourcePerformance = await measureResourcePerformance(page);
  
  // Combine all metrics
  const allMetrics: Partial<PerformanceMetrics> = {
    ...coreWebVitals,
    ...loadingPerformance,
    ...resourcePerformance
  };
  
  // Validate against thresholds
  const validation = validatePerformanceMetrics(allMetrics, thresholds);
  
  if (!validation.passed) {
    console.error('❌ Performance validation failed:');
    validation.failures.forEach(failure => console.error(`  - ${failure}`));
    
    // Log detailed metrics for debugging
    console.log('📊 Performance Metrics:', allMetrics);
    console.log('📏 Performance Thresholds:', thresholds);
    
    throw new Error(`Performance validation failed: ${validation.failures.join(', ')}`);
  }
  
  console.log('✅ Performance validation passed');
  console.log('📊 Performance Metrics:', allMetrics);
}

/**
 * Measure page load time
 */
export async function measurePageLoadTime(page: Page, url: string): Promise<number> {
  const startTime = Date.now();
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  const endTime = Date.now();
  
  return endTime - startTime;
}

/**
 * Measure interaction performance
 */
export async function measureInteractionPerformance(
  page: Page,
  selector: string,
  action: 'click' | 'type' | 'hover' = 'click'
): Promise<number> {
  const startTime = Date.now();
  
  switch (action) {
    case 'click':
      await page.click(selector);
      break;
    case 'type':
      await page.fill(selector, 'test input');
      break;
    case 'hover':
      await page.hover(selector);
      break;
  }
  
  const endTime = Date.now();
  return endTime - startTime;
}

/**
 * Generate performance report
 */
export function generatePerformanceReport(metrics: Partial<PerformanceMetrics>): string {
  return `
# Performance Test Report

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

## Recommendations
${generateRecommendations(metrics)}
`;
}

/**
 * Generate performance recommendations
 */
function generateRecommendations(metrics: Partial<PerformanceMetrics>): string {
  const recommendations: string[] = [];
  
  if (metrics.lcp && metrics.lcp > 2500) {
    recommendations.push('- Optimize Largest Contentful Paint (LCP)');
  }
  
  if (metrics.fid && metrics.fid > 100) {
    recommendations.push('- Reduce First Input Delay (FID)');
  }
  
  if (metrics.cls && metrics.cls > 0.1) {
    recommendations.push('- Minimize Cumulative Layout Shift (CLS)');
  }
  
  if (metrics.jsBundleSize && metrics.jsBundleSize > 500000) {
    recommendations.push('- Optimize JavaScript bundle size');
  }
  
  if (metrics.cssBundleSize && metrics.cssBundleSize > 100000) {
    recommendations.push('- Optimize CSS bundle size');
  }
  
  if (recommendations.length === 0) {
    return '- ✅ All performance metrics are within acceptable ranges';
  }
  
  return recommendations.join('\n');
}




