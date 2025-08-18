export interface PerformanceMetrics {
  // Core Web Vitals
  fcp: number | null // First Contentful Paint
  lcp: number | null // Largest Contentful Paint
  fid: number | null // First Input Delay
  cls: number | null // Cumulative Layout Shift
  ttfb: number | null // Time to First Byte
  
  // Custom Metrics
  pageLoadTime: number | null
  domContentLoaded: number | null
  resourceLoadTime: number | null
  memoryUsage: number | null
  networkSpeed: number | null
  
  // User Experience Metrics
  timeToInteractive: number | null
  firstMeaningfulPaint: number | null
  speedIndex: number | null
  
  // Device & Browser Info
  userAgent: string
  deviceType: 'mobile' | 'tablet' | 'desktop'
  connectionType: string | null
  timestamp: number
}

export interface PerformanceAlert {
  type: 'warning' | 'error' | 'critical'
  metric: string
  value: number
  threshold: number
  message: string
  timestamp: number
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private alerts: PerformanceAlert[] = []
  private observers: Map<string, PerformanceObserver> = new Map()
  private isInitialized = false
  
  // Performance thresholds
  private thresholds = {
    fcp: { good: 1800, poor: 3000 },
    lcp: { good: 2500, poor: 4000 },
    fid: { good: 100, poor: 300 },
    cls: { good: 0.1, poor: 0.25 },
    ttfb: { good: 800, poor: 1800 },
    pageLoadTime: { good: 3000, poor: 5000 }
  }

  constructor() {
    if (typeof window === 'undefined') return
    this.init()
  }

  private init() {
    if (this.isInitialized) return
    this.isInitialized = true

    // Initialize Core Web Vitals observers
    this.initCoreWebVitals()
    
    // Initialize custom metrics
    this.initCustomMetrics()
    
    // Initialize memory monitoring
    this.initMemoryMonitoring()
    
    // Initialize network monitoring
    this.initNetworkMonitoring()
    
    // Listen for page visibility changes
    this.initVisibilityMonitoring()
    
    // Start periodic monitoring
    this.startPeriodicMonitoring()
  }

  private initCoreWebVitals() {
    // First Contentful Paint
    this.observeMetric('paint', (entries) => {
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric('fcp', entry.startTime)
        }
      })
    })

    // Largest Contentful Paint
    this.observeMetric('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1]
      if (lastEntry) {
        this.recordMetric('lcp', lastEntry.startTime)
      }
    })

    // First Input Delay
    this.observeMetric('first-input', (entries) => {
      entries.forEach((entry: any) => {
        this.recordMetric('fid', entry.processingStart - entry.startTime)
      })
    })

    // Cumulative Layout Shift
    this.observeMetric('layout-shift', (entries) => {
      let clsValue = 0
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      this.recordMetric('cls', clsValue)
    })
  }

  private initCustomMetrics() {
    // Page Load Time
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.recordMetric('domContentLoaded', performance.now())
      })
    } else {
      this.recordMetric('domContentLoaded', performance.now())
    }

    window.addEventListener('load', () => {
      const loadTime = performance.now()
      this.recordMetric('pageLoadTime', loadTime)
      
      // Calculate Time to Interactive
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigationEntry) {
        const tti = navigationEntry.loadEventEnd - navigationEntry.fetchStart
        this.recordMetric('timeToInteractive', tti)
      }
    })

    // Resource Load Time
    this.observeMetric('resource', (entries) => {
      entries.forEach((entry: any) => {
        const loadTime = entry.responseEnd - entry.fetchStart
        this.recordMetric('resourceLoadTime', loadTime)
      })
    })
  }

  private initMemoryMonitoring() {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      setInterval(() => {
        const usedMemory = memory.usedJSHeapSize / 1024 / 1024 // MB
        this.recordMetric('memoryUsage', usedMemory)
      }, 5000)
    }
  }

  private initNetworkMonitoring() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      if (connection) {
        this.recordMetric('networkSpeed', connection.downlink)
        this.recordMetric('connectionType', connection.effectiveType)
      }
    }
  }

  private initVisibilityMonitoring() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Page became visible again - record performance
        this.recordCurrentMetrics()
      }
    })
  }

  private startPeriodicMonitoring() {
    // Record metrics every 10 seconds
    setInterval(() => {
      this.recordCurrentMetrics()
    }, 10000)
  }

  private observeMetric(type: string, callback: (entries: PerformanceEntry[]) => void) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = Array.from(list.getEntries())
        callback(entries)
      })
      observer.observe({ type, buffered: true })
      this.observers.set(type, observer)
    } catch (error) {
      devLog(`PerformanceObserver for ${type} not supported:`, error)
    }
  }

  private recordMetric(key: keyof PerformanceMetrics, value: number | string | null) {
    const currentMetrics = this.getCurrentMetrics()
    
    if (typeof value === 'number' && !isNaN(value)) {
      (currentMetrics as any)[key] = value
      
      // Check thresholds and create alerts
      this.checkThresholds(key, value)
    } else if (typeof value === 'string') {
      (currentMetrics as any)[key] = value
    }
  }

  private recordCurrentMetrics() {
    const metrics = this.getCurrentMetrics()
    metrics.timestamp = Date.now()
    
    // Add device info
    metrics.userAgent = navigator.userAgent
    metrics.deviceType = this.getDeviceType()
    
    this.metrics.push(metrics)
    
    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }
    
    // Send to analytics if available
    this.sendToAnalytics(metrics)
  }

  private getCurrentMetrics(): PerformanceMetrics {
    return {
      fcp: null,
      lcp: null,
      fid: null,
      cls: null,
      ttfb: null,
      pageLoadTime: null,
      domContentLoaded: null,
      resourceLoadTime: null,
      memoryUsage: null,
      networkSpeed: null,
      timeToInteractive: null,
      firstMeaningfulPaint: null,
      speedIndex: null,
      userAgent: '',
      deviceType: 'desktop',
      connectionType: null,
      timestamp: Date.now()
    }
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  }

  private checkThresholds(metric: string, value: number) {
    const threshold = this.thresholds[metric as keyof typeof this.thresholds]
    if (!threshold) return

    let alertType: 'warning' | 'error' | 'critical' | null = null
    let message = ''

    if (value > threshold.poor) {
      alertType = 'critical'
      message = `${metric.toUpperCase()} is critically slow: ${value}ms`
    } else if (value > threshold.good) {
      alertType = 'warning'
      message = `${metric.toUpperCase()} is slower than optimal: ${value}ms`
    }

    if (alertType) {
      this.alerts.push({
        type: alertType,
        metric,
        value,
        threshold: threshold.good,
        message,
        timestamp: Date.now()
      })

      // Keep only last 50 alerts
      if (this.alerts.length > 50) {
        this.alerts = this.alerts.slice(-50)
      }

      // Log alert
      devLog(`Performance Alert: ${message}`)
    }
  }

  private sendToAnalytics(metrics: PerformanceMetrics) {
    // Send to Google Analytics if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'performance_metrics', {
        fcp: metrics.fcp,
        lcp: metrics.lcp,
        fid: metrics.fid,
        cls: metrics.cls,
        page_load_time: metrics.pageLoadTime,
        device_type: metrics.deviceType
      })
    }

    // Send to custom analytics endpoint
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metrics)
    }).catch(() => {
      // Silently fail if analytics endpoint doesn't exist
    })
  }

  // Public API
  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  public getAlerts(): PerformanceAlert[] {
    return [...this.alerts]
  }

  public getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null
  }

  public getPerformanceScore(): number {
    const latest = this.getLatestMetrics()
    if (!latest) return 0

    let score = 100
    let factors = 0

    // FCP scoring
    if (latest.fcp) {
      factors++
      if (latest.fcp > this.thresholds.fcp.poor) score -= 30
      else if (latest.fcp > this.thresholds.fcp.good) score -= 15
    }

    // LCP scoring
    if (latest.lcp) {
      factors++
      if (latest.lcp > this.thresholds.lcp.poor) score -= 30
      else if (latest.lcp > this.thresholds.lcp.good) score -= 15
    }

    // FID scoring
    if (latest.fid) {
      factors++
      if (latest.fid > this.thresholds.fid.poor) score -= 20
      else if (latest.fid > this.thresholds.fid.good) score -= 10
    }

    // CLS scoring
    if (latest.cls) {
      factors++
      if (latest.cls > this.thresholds.cls.poor) score -= 20
      else if (latest.cls > this.thresholds.cls.good) score -= 10
    }

    return factors > 0 ? Math.max(0, score / factors) : 100
  }

  public getPerformanceSummary() {
    const latest = this.getLatestMetrics()
    const score = this.getPerformanceScore()
    const alerts = this.getAlerts()

    return {
      score,
      grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
      latestMetrics: latest,
      recentAlerts: alerts.slice(-10),
      totalAlerts: alerts.length,
      deviceType: latest?.deviceType || 'unknown'
    }
  }

  public destroy() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()
    this.isInitialized = false
  }
}

// Global instance
let performanceMonitor: PerformanceMonitor | null = null

export const getPerformanceMonitor = (): PerformanceMonitor => {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor()
  }
  return performanceMonitor
}

// Auto-initialize when module is imported (only in browser)
if (typeof window !== 'undefined') {
  // Use setTimeout to ensure this runs after the module is fully loaded
  setTimeout(() => {
    getPerformanceMonitor()
  }, 0)
}
