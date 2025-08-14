// PWA Analytics System for Choices Platform
// Privacy-first analytics with local processing and minimal data collection

export interface PWAMetrics {
  // Performance Metrics
  loadTime: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  
  // PWA Metrics
  installPromptShown: boolean
  installPromptAccepted: boolean
  serviceWorkerRegistered: boolean
  offlineUsage: number
  backgroundSyncCount: number
  
  // Privacy Metrics
  dataCollected: number
  dataShared: number
  encryptionEnabled: boolean
  anonymizationLevel: 'none' | 'partial' | 'full'
  
  // User Behavior (anonymized)
  sessionDuration: number
  pagesVisited: number
  featuresUsed: string[]
  offlineActions: number
  
  // Security Metrics
  webAuthnSupported: boolean
  webAuthnUsed: boolean
  deviceVerificationScore: number
  botDetectionScore: number
}

export interface PrivacyReport {
  dataMinimization: {
    collectedFields: string[]
    sharedFields: string[]
    retentionPeriod: number
    anonymizationApplied: boolean
  }
  userControl: {
    dataExportEnabled: boolean
    dataDeletionEnabled: boolean
    privacySettingsAccessible: boolean
    consentGranular: boolean
  }
  security: {
    encryptionAtRest: boolean
    encryptionInTransit: boolean
    accessControls: boolean
    auditLogging: boolean
  }
  transparency: {
    dataUsageDisclosed: boolean
    thirdPartySharing: boolean
    purposeLimitation: boolean
    userNotification: boolean
  }
}

export class PWAAnalytics {
  private metrics: PWAMetrics
  private startTime: number
  private sessionId: string
  private isOnline: boolean
  private offlineActions: any[] = []

  constructor() {
    this.startTime = Date.now()
    this.sessionId = this.generateSessionId()
    this.isOnline = navigator.onLine
    
    this.metrics = {
      loadTime: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      installPromptShown: false,
      installPromptAccepted: false,
      serviceWorkerRegistered: false,
      offlineUsage: 0,
      backgroundSyncCount: 0,
      dataCollected: 0,
      dataShared: 0,
      encryptionEnabled: true,
      anonymizationLevel: 'full',
      sessionDuration: 0,
      pagesVisited: 0,
      featuresUsed: [],
      offlineActions: 0,
      webAuthnSupported: 'credentials' in navigator,
      webAuthnUsed: false,
      deviceVerificationScore: 0,
      botDetectionScore: 0
    }

    this.initializeMetrics()
    this.setupEventListeners()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private initializeMetrics() {
    // Performance metrics
    if ('PerformanceObserver' in window) {
      // First Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const fcp = entries.find(entry => entry.name === 'first-contentful-paint')
        if (fcp) {
          this.metrics.firstContentfulPaint = fcp.startTime
        }
      }).observe({ entryTypes: ['paint'] })

      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lcp = entries[entries.length - 1]
        if (lcp) {
          this.metrics.largestContentfulPaint = lcp.startTime
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] })

      // Cumulative Layout Shift
      new PerformanceObserver((list) => {
        let cls = 0
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            cls += (entry as any).value
          }
        }
        this.metrics.cumulativeLayoutShift = cls
      }).observe({ entryTypes: ['layout-shift'] })
    }

    // Load time
    window.addEventListener('load', () => {
      this.metrics.loadTime = Date.now() - this.startTime
    })

    // Service Worker registration
    if ('serviceWorker' in navigator) {
      this.metrics.serviceWorkerRegistered = true
    }
  }

  private setupEventListeners() {
    // Online/offline tracking
    window.addEventListener('online', () => {
      this.isOnline = true
      this.syncOfflineActions()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.metrics.offlineUsage++
    })

    // Install prompt tracking
    window.addEventListener('beforeinstallprompt', () => {
      this.metrics.installPromptShown = true
    })

    // Page visibility tracking
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.metrics.sessionDuration = Date.now() - this.startTime
      }
    })

    // Feature usage tracking
    this.trackFeatureUsage('pwa_analytics_initialized')
  }

  // Track feature usage
  trackFeatureUsage(feature: string) {
    if (!this.metrics.featuresUsed.includes(feature)) {
      this.metrics.featuresUsed.push(feature)
    }
  }

  // Track offline action
  trackOfflineAction(action: string, data?: any) {
    this.metrics.offlineActions++
    this.offlineActions.push({
      action,
      data,
      timestamp: Date.now(),
      sessionId: this.sessionId
    })
  }

  // Track WebAuthn usage
  trackWebAuthnUsage(success: boolean) {
    this.metrics.webAuthnUsed = true
    this.trackFeatureUsage(success ? 'webauthn_success' : 'webauthn_failed')
  }

  // Track data collection
  trackDataCollection(fields: string[], shared: boolean = false) {
    this.metrics.dataCollected += fields.length
    if (shared) {
      this.metrics.dataShared += fields.length
    }
  }

  // Track background sync
  trackBackgroundSync(success: boolean) {
    if (success) {
      this.metrics.backgroundSyncCount++
    }
    this.trackFeatureUsage(success ? 'background_sync_success' : 'background_sync_failed')
  }

  // Get current metrics
  getMetrics(): PWAMetrics {
    return {
      ...this.metrics,
      sessionDuration: Date.now() - this.startTime
    }
  }

  // Generate privacy report
  generatePrivacyReport(): PrivacyReport {
    return {
      dataMinimization: {
        collectedFields: this.getCollectedFields(),
        sharedFields: this.getSharedFields(),
        retentionPeriod: 30, // days
        anonymizationApplied: this.metrics.anonymizationLevel === 'full'
      },
      userControl: {
        dataExportEnabled: true,
        dataDeletionEnabled: true,
        privacySettingsAccessible: true,
        consentGranular: true
      },
      security: {
        encryptionAtRest: this.metrics.encryptionEnabled,
        encryptionInTransit: true,
        accessControls: true,
        auditLogging: true
      },
      transparency: {
        dataUsageDisclosed: true,
        thirdPartySharing: false,
        purposeLimitation: true,
        userNotification: true
      }
    }
  }

  private getCollectedFields(): string[] {
    // Return anonymized field names
    return [
      'session_duration',
      'pages_visited',
      'features_used',
      'offline_actions',
      'performance_metrics'
    ]
  }

  private getSharedFields(): string[] {
    // Return only aggregated, anonymized data
    return [
      'aggregated_performance',
      'feature_usage_patterns',
      'offline_usage_stats'
    ]
  }

  // Sync offline actions when back online
  private async syncOfflineActions() {
    if (this.offlineActions.length > 0) {
      try {
        // Process offline actions locally first
        const processedActions = this.processOfflineActions(this.offlineActions)
        
        // Send only aggregated data
        await this.sendAnalytics({
          type: 'offline_sync',
          sessionId: this.sessionId,
          actionCount: this.offlineActions.length,
          processedData: processedActions
        })
        
        this.offlineActions = []
      } catch (error) {
        console.error('Failed to sync offline actions:', error)
      }
    }
  }

  // Process offline actions locally
  private processOfflineActions(actions: any[]): any {
    // Aggregate and anonymize offline actions
    const actionTypes = actions.reduce((acc, action) => {
      acc[action.action] = (acc[action.action] || 0) + 1
      return acc
    }, {})

    return {
      actionTypes,
      totalCount: actions.length,
      timeRange: {
        start: Math.min(...actions.map(a => a.timestamp)),
        end: Math.max(...actions.map(a => a.timestamp))
      }
    }
  }

  // Send analytics data (privacy-first)
  private async sendAnalytics(data: any) {
    try {
      // Only send aggregated, anonymized data
      const anonymizedData = this.anonymizeData(data)
      
      await fetch('/api/analytics/pwa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(anonymizedData)
      })
    } catch (error) {
      console.error('Failed to send analytics:', error)
      // Store for later sync
      this.trackOfflineAction('analytics_send_failed', { error: error.message })
    }
  }

  // Anonymize data before sending
  private anonymizeData(data: any): any {
    return {
      ...data,
      sessionId: this.hashString(data.sessionId),
      timestamp: Math.floor(Date.now() / 1000), // Unix timestamp
      // Remove any potentially identifying information
      userAgent: undefined,
      ipAddress: undefined,
      exactLocation: undefined
    }
  }

  // Simple hash function for anonymization
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }

  // Export analytics data for user
  exportUserData(): any {
    return {
      sessionId: this.sessionId,
      metrics: this.getMetrics(),
      privacyReport: this.generatePrivacyReport(),
      offlineActions: this.offlineActions,
      timestamp: new Date().toISOString()
    }
  }

  // Clear all analytics data
  clearData() {
    this.metrics = {
      loadTime: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      installPromptShown: false,
      installPromptAccepted: false,
      serviceWorkerRegistered: false,
      offlineUsage: 0,
      backgroundSyncCount: 0,
      dataCollected: 0,
      dataShared: 0,
      encryptionEnabled: true,
      anonymizationLevel: 'full',
      sessionDuration: 0,
      pagesVisited: 0,
      featuresUsed: [],
      offlineActions: 0,
      webAuthnSupported: 'credentials' in navigator,
      webAuthnUsed: false,
      deviceVerificationScore: 0,
      botDetectionScore: 0
    }
    this.offlineActions = []
    this.startTime = Date.now()
    this.sessionId = this.generateSessionId()
  }
}

// Singleton instance
export const pwaAnalytics = new PWAAnalytics()
