/**
 * Performance Metrics Collector
 * 
 * Collects and analyzes performance metrics including:
 * - Core Web Vitals (LCP, FID, CLS)
 * - Bundle loading times
 * - Resource loading performance
 * - User interaction metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
  userAgent: string;
  connection?: string;
}

interface CoreWebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
}

interface BundlePerformance {
  bundleName: string;
  loadTime: number;
  parseTime: number;
  executeTime: number;
  size: number;
  gzipSize?: number;
}

interface ResourcePerformance {
  url: string;
  type: 'script' | 'stylesheet' | 'image' | 'font' | 'other';
  loadTime: number;
  size: number;
  cached: boolean;
}

class PerformanceMetricsCollector {
  private metrics: PerformanceMetric[] = [];
  private coreWebVitals: CoreWebVitals | null = null;
  private bundlePerformance: BundlePerformance[] = [];
  private resourcePerformance: ResourcePerformance[] = [];
  private observers: Array<(metrics: PerformanceMetric[]) => void> = [];

  constructor() {
    this.initializeWebVitals();
    this.initializeResourceTracking();
    this.initializeBundleTracking();
  }

  /**
   * Initialize Core Web Vitals collection
   */
  private initializeWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.addMetric('lcp', lastEntry.startTime);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.addMetric('fid', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.addMetric('cls', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.addMetric('fcp', entry.startTime);
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });

      // Time to First Byte
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.addMetric('ttfb', entry.responseStart - entry.requestStart);
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
    }
  }

  /**
   * Initialize resource performance tracking
   */
  private initializeResourceTracking(): void {
    if (typeof window === 'undefined') return;

    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const resource: ResourcePerformance = {
            url: entry.name,
            type: this.getResourceType(entry.name),
            loadTime: entry.duration,
            size: entry.transferSize || 0,
            cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
          };
          this.resourcePerformance.push(resource);
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
    }
  }

  /**
   * Initialize bundle performance tracking
   */
  private initializeBundleTracking(): void {
    if (typeof window === 'undefined') return;

    // Track script loading performance
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach((script) => {
      const startTime = performance.now();
      
      script.addEventListener('load', () => {
        const loadTime = performance.now() - startTime;
        const bundle: BundlePerformance = {
          bundleName: script.getAttribute('src') || 'unknown',
          loadTime,
          parseTime: 0, // Would need more sophisticated tracking
          executeTime: 0, // Would need more sophisticated tracking
          size: 0, // Would need to fetch actual size
        };
        this.bundlePerformance.push(bundle);
      });
    });
  }

  /**
   * Get resource type from URL
   */
  private getResourceType(url: string): ResourcePerformance['type'] {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/)) return 'image';
    if (url.match(/\.(woff|woff2|eot|ttf|otf)$/)) return 'font';
    return 'other';
  }

  /**
   * Add performance metric
   */
  addMetric(name: string, value: number): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      connection: typeof navigator !== 'undefined' && 'connection' in navigator 
        ? (navigator as any).connection?.effectiveType : undefined,
    };

    this.metrics.push(metric);
    this.notifyObservers();
  }

  /**
   * Get Core Web Vitals
   */
  getCoreWebVitals(): CoreWebVitals | null {
    const lcp = this.getLatestMetric('lcp');
    const fid = this.getLatestMetric('fid');
    const cls = this.getLatestMetric('cls');
    const fcp = this.getLatestMetric('fcp');
    const ttfb = this.getLatestMetric('ttfb');

    if (lcp && fid && cls && fcp && ttfb) {
      return {
        lcp: lcp.value,
        fid: fid.value,
        cls: cls.value,
        fcp: fcp.value,
        ttfb: ttfb.value,
      };
    }

    return null;
  }

  /**
   * Get latest metric by name
   */
  private getLatestMetric(name: string): PerformanceMetric | null {
    const metrics = this.metrics.filter(m => m.name === name);
    const latestMetric = metrics[metrics.length - 1];
    return latestMetric || null;
  }

  /**
   * Get performance score based on Core Web Vitals
   */
  getPerformanceScore(): number {
    const vitals = this.getCoreWebVitals();
    if (!vitals) return 0;

    let score = 100;

    // LCP scoring (0-100)
    if (vitals.lcp > 4000) score -= 30;
    else if (vitals.lcp > 2500) score -= 15;

    // FID scoring (0-100)
    if (vitals.fid > 300) score -= 30;
    else if (vitals.fid > 100) score -= 15;

    // CLS scoring (0-100)
    if (vitals.cls > 0.25) score -= 30;
    else if (vitals.cls > 0.1) score -= 15;

    return Math.max(0, score);
  }

  /**
   * Get bundle performance summary
   */
  getBundlePerformance(): BundlePerformance[] {
    return [...this.bundlePerformance];
  }

  /**
   * Get resource performance summary
   */
  getResourcePerformance(): ResourcePerformance[] {
    return [...this.resourcePerformance];
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Subscribe to metrics updates
   */
  subscribe(callback: (metrics: PerformanceMetric[]) => void): () => void {
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
   * Get performance summary
   */
  getSummary(): {
    totalMetrics: number;
    coreWebVitals: CoreWebVitals | null;
    performanceScore: number;
    bundleCount: number;
    resourceCount: number;
    averageLoadTime: number;
  } {
    const vitals = this.getCoreWebVitals();
    const score = this.getPerformanceScore();
    
    const totalLoadTime = this.resourcePerformance.reduce((sum, resource) => sum + resource.loadTime, 0);
    const averageLoadTime = this.resourcePerformance.length > 0 ? totalLoadTime / this.resourcePerformance.length : 0;

    return {
      totalMetrics: this.metrics.length,
      coreWebVitals: vitals,
      performanceScore: score,
      bundleCount: this.bundlePerformance.length,
      resourceCount: this.resourcePerformance.length,
      averageLoadTime,
    };
  }

  /**
   * Export metrics to JSON
   */
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      coreWebVitals: this.getCoreWebVitals(),
      bundlePerformance: this.bundlePerformance,
      resourcePerformance: this.resourcePerformance,
      summary: this.getSummary(),
      timestamp: Date.now(),
    }, null, 2);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.bundlePerformance = [];
    this.resourcePerformance = [];
  }
}

// Create singleton instance
export const performanceMetrics = new PerformanceMetricsCollector();

// Export types and class
export type { PerformanceMetric, CoreWebVitals, BundlePerformance, ResourcePerformance };
export { PerformanceMetricsCollector };
