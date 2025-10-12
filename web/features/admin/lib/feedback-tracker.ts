/**
 * Enhanced Feedback Tracking System
 * Captures comprehensive user journey data for AI analysis and diagnosis
 */

import { devLog } from '@/lib/utils/logger'
import { withOptional } from '@/lib/utils/objects'

import type { UserJourney, FeedbackContext } from '../types'

// Using consolidated types from ../types

class FeedbackTracker {
  private sessionId: string
  private sessionStartTime: string
  private pageViews: number = 0
  private actionSequence: string[] = []
  private errors: any[] = []
  private performanceMetrics: any = {}
  
  constructor() {
    this.sessionId = this.generateSessionId()
    this.sessionStartTime = new Date().toISOString()
    this.initializeTracking()
  }
  
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  private initializeTracking(): void {
    if (typeof window === 'undefined') return
    
    // Track page views
    this.trackPageView()
    
    // Track performance metrics
    this.trackPerformance()
    
    // Track errors
    this.trackErrors()
    
    // Track user interactions
    this.trackUserInteractions()
    
    // Track network requests
    this.trackNetworkRequests()
  }
  
  private trackPageView(): void {
    this.pageViews++
    
    // Track time on page
    const startTime = Date.now()
    window.addEventListener('beforeunload', () => {
      const timeOnPage = Date.now() - startTime
      this.updateTimeOnPage(timeOnPage)
    })
  }
  
  private trackPerformance(): void {
    if ('performance' in window) {
      // Wait for performance metrics to be available
      setTimeout(() => {
        const perfEntries = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (perfEntries) {
          this.performanceMetrics = {
            fcp: this.getFCP(),
            lcp: this.getLCP(),
            fid: this.getFID(),
            cls: this.getCLS(),
            pageLoadTime: perfEntries.loadEventEnd - perfEntries.loadEventStart
          }
        }
      }, 1000)
    }
  }
  
  private getFCP(): number | undefined {
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0]
    return fcpEntry ? fcpEntry.startTime : undefined
  }
  
  private getLCP(): number | undefined {
    const lcpEntry = performance.getEntriesByName('largest-contentful-paint')[0]
    return lcpEntry ? lcpEntry.startTime : undefined
  }
  
  private getFID(): number | undefined {
    const fidEntry = performance.getEntriesByName('first-input-delay')[0] as any
    return fidEntry ? (fidEntry.processingStart || 0) - (fidEntry.startTime || 0) : undefined
  }
  
  private getCLS(): number | undefined {
    // Simplified CLS calculation
    return 0 // Would need more complex implementation
  }
  
  private trackErrors(): void {
    window.addEventListener('error', (event) => {
      this.errors.push({
        type: 'javascript',
        message: event.message,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      })
    })
    
    window.addEventListener('unhandledrejection', (event) => {
      this.errors.push({
        type: 'promise',
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      })
    })
  }
  
  private trackUserInteractions(): void {
    // Only track interactions in browser environment
    if (typeof document === 'undefined') return
    
    // Track clicks, form submissions, etc.
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      const action = `click:${target.tagName.toLowerCase()}:${target.className || target.id || 'unknown'}`
      this.actionSequence.push(action)
    })
    
    document.addEventListener('submit', (event) => {
      const target = event.target as HTMLFormElement
      const action = `submit:${target.action || target.className || 'unknown'}`
      this.actionSequence.push(action)
    })
  }
  
  private trackNetworkRequests(): void {
    // Track fetch requests
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const startTime = Date.now()
      try {
        const response = await originalFetch(...args)
        const duration = Date.now() - startTime
        
        // Store network request info
        this.performanceMetrics.networkRequests = this.performanceMetrics.networkRequests || []
        this.performanceMetrics.networkRequests.push({
          url: typeof args[0] === 'string' ? args[0] : (args[0] as Request).url,
          method: args[1]?.method || 'GET',
          status: response.status,
          duration
        })
        
        return response
      } catch (error) {
        const duration = Date.now() - startTime
        this.errors.push({
          type: 'network',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          duration
        })
        throw error
      }
    }
  }
  
  private updateTimeOnPage(timeOnPage: number): void {
    // This would be called when user leaves the page
    this.performanceMetrics.timeOnPage = timeOnPage
  }
  
  public getDeviceInfo(): any {
    if (typeof window === 'undefined') return {}
    
    const userAgent = navigator.userAgent
    const screen = window.screen
    
    return {
      type: this.getDeviceType(),
      os: this.getOS(),
      browser: this.getBrowser(),
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      userAgent // Include user agent for debugging and analytics
    }
  }
  
  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  }
  
  private getOS(): string {
    const userAgent = navigator.userAgent
    if (userAgent.includes('Windows')) return 'Windows'
    if (userAgent.includes('Mac')) return 'macOS'
    if (userAgent.includes('Linux')) return 'Linux'
    if (userAgent.includes('Android')) return 'Android'
    if (userAgent.includes('iOS')) return 'iOS'
    return 'Unknown'
  }
  
  private getBrowser(): string {
    const userAgent = navigator.userAgent
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Unknown'
  }
  
  public captureUserJourney(): UserJourney {
    return withOptional(
      {
        currentPage: typeof window !== 'undefined' ? window.location.pathname : '',
        currentPath: typeof window !== 'undefined' ? window.location.href : '',
        pageTitle: typeof document !== 'undefined' ? document.title : '',
        referrer: typeof document !== 'undefined' ? document.referrer : '',
        
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        timeOnPage: this.performanceMetrics.timeOnPage || 0,
        
        sessionId: this.sessionId,
        sessionStartTime: this.sessionStartTime,
        totalPageViews: this.pageViews,
        
        activeFeatures: this.getActiveFeatures(),
        lastAction: this.actionSequence[this.actionSequence.length - 1] || 'none',
        actionSequence: this.actionSequence.slice(-10), // Last 10 actions
        
        pageLoadTime: this.performanceMetrics.pageLoadTime || 0,
        performanceMetrics: {
          fcp: this.performanceMetrics.fcp,
          lcp: this.performanceMetrics.lcp,
          fid: this.performanceMetrics.fid,
          cls: this.performanceMetrics.cls
        },
        
        errors: this.errors,
        
        deviceInfo: this.getDeviceInfo(),
        
        isAuthenticated: this.isUserAuthenticated()
      },
      {
        userRole: this.getUserRole(),
        userId: this.getUserId()
      }
    )
  }
  
  private getActiveFeatures(): string[] {
    const features: string[] = []
    
    // Check for PWA features
    if ('serviceWorker' in navigator) features.push('pwa')
    if ('PushManager' in window) features.push('push-notifications')
    
    // Check for modern browser features
    if ('IntersectionObserver' in window) features.push('intersection-observer')
    if ('ResizeObserver' in window) features.push('resize-observer')
    
    // Check for specific app features
    if (typeof document !== 'undefined') {
      if (document.querySelector('[data-feature="polls"]')) features.push('polls')
      if (document.querySelector('[data-feature="privacy"]')) features.push('privacy-controls')
      if (document.querySelector('[data-feature="admin"]')) features.push('admin-panel')
    }
    
    return features
  }
  
  private isUserAuthenticated(): boolean {
    // Check for authentication indicators
    return !!(
      (typeof localStorage !== 'undefined' && localStorage.getItem('supabase.auth.token')) ||
      (typeof document !== 'undefined' && document.querySelector('[data-auth="authenticated"]')) ||
      (typeof window !== 'undefined' && window.location.pathname.includes('/admin'))
    )
  }
  
  private getUserRole(): string | undefined {
    // Extract user role from various sources
    if (typeof document === 'undefined') return undefined
    const roleElement = document.querySelector('[data-user-role]')
    return roleElement?.getAttribute('data-user-role') || undefined
  }
  
  private getUserId(): string | undefined {
    // Extract user ID from various sources
    if (typeof document === 'undefined') return undefined
    const userIdElement = document.querySelector('[data-user-id]')
    return userIdElement?.getAttribute('data-user-id') || undefined
  }
  
  public captureConsoleLogs(): string[] {
    if (typeof window === 'undefined') return []
    
    // Capture recent console logs (simplified implementation)
    return []
  }
  
  public async captureScreenshot(): Promise<string | undefined> {
    if (typeof window === 'undefined') return undefined
    
    try {
      // Use html2canvas or similar library for screenshot
      // For now, return undefined
      return undefined
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        devLog('Failed to capture screenshot:', error)
      }
      return undefined
    }
  }
  
  public generateFeedbackContext(
    type: string,
    title: string,
    description: string,
    sentiment: string
  ): FeedbackContext {
    return withOptional(
      {
        feedbackId: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        source: 'widget',
        
        userJourney: this.captureUserJourney(),
        
        type: type as any,
        title,
        description,
        sentiment: sentiment as any,
        
        category: this.categorizeFeedback(type, title, description),
        priority: this.determinePriority(type, sentiment),
        severity: this.determineSeverity(type, sentiment),
        
        consoleLogs: this.captureConsoleLogs(),
        networkRequests: this.performanceMetrics.networkRequests || [],
        
        aiAnalysis: {
          intent: '',
          category: '',
          sentiment: 0,
          urgency: 0,
          complexity: 0,
          keywords: [],
          suggestedActions: []
        }
      },
      {
        screenshot: this.captureScreenshot()
      }
    )
  }
  
  private categorizeFeedback(type: string, title: string, description: string): string[] {
    const categories: string[] = []
    
    // Add type-based category
    categories.push(type)
    
    // Add content-based categories
    const content = `${title} ${description}`.toLowerCase()
    
    if (content.includes('bug') || content.includes('error') || content.includes('broken')) {
      categories.push('bug-report')
    }
    
    if (content.includes('feature') || content.includes('request') || content.includes('add')) {
      categories.push('feature-request')
    }
    
    if (content.includes('slow') || content.includes('performance') || content.includes('lag')) {
      categories.push('performance')
    }
    
    if (content.includes('mobile') || content.includes('responsive') || content.includes('screen')) {
      categories.push('responsive-design')
    }
    
    if (content.includes('privacy') || content.includes('security') || content.includes('data')) {
      categories.push('privacy-security')
    }
    
    return categories
  }
  
  private determinePriority(type: string, sentiment: string): 'low' | 'medium' | 'high' | 'urgent' {
    if (type === 'bug' && sentiment === 'negative') return 'high'
    if (type === 'security') return 'urgent'
    if (sentiment === 'negative') return 'medium'
    return 'low'
  }
  
  private determineSeverity(type: string, sentiment: string): 'minor' | 'moderate' | 'major' | 'critical' {
    if (type === 'security') return 'critical'
    if (type === 'bug' && sentiment === 'negative') return 'major'
    if (sentiment === 'negative') return 'moderate'
    return 'minor'
  }
}

// Singleton instance
let feedbackTracker: FeedbackTracker | null = null

export function getFeedbackTracker(): FeedbackTracker {
  if (!feedbackTracker) {
    feedbackTracker = new FeedbackTracker()
  }
  return feedbackTracker
}

export function resetFeedbackTracker(): void {
  feedbackTracker = null
}
