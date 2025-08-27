/**
 * Authentication Analytics & Monitoring System
 * Comprehensive tracking and monitoring for authentication events
 * 
 * Features:
 * - Authentication success/failure tracking
 * - Biometric adoption metrics
 * - Performance monitoring for auth flows
 * - Security event alerting
 * - Real-time dashboards
 * 
 * @author Choices Platform
 * @version 1.0.0
 * @since 2024-12-27
 */

import { devLog } from './logger'
import { getDeviceInfo } from './webauthn'

// Analytics event types
export enum AuthEventType {
  REGISTRATION_ATTEMPT = 'registration_attempt',
  REGISTRATION_SUCCESS = 'registration_success',
  REGISTRATION_FAILURE = 'registration_failure',
  LOGIN_ATTEMPT = 'login_attempt',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  BIOMETRIC_SETUP_ATTEMPT = 'biometric_setup_attempt',
  BIOMETRIC_SETUP_SUCCESS = 'biometric_setup_success',
  BIOMETRIC_SETUP_FAILURE = 'biometric_setup_failure',
  BIOMETRIC_AUTH_ATTEMPT = 'biometric_auth_attempt',
  BIOMETRIC_AUTH_SUCCESS = 'biometric_auth_success',
  BIOMETRIC_AUTH_FAILURE = 'biometric_auth_failure',
  DEVICE_FLOW_ATTEMPT = 'device_flow_attempt',
  DEVICE_FLOW_SUCCESS = 'device_flow_success',
  DEVICE_FLOW_FAILURE = 'device_flow_failure',
  PASSWORD_RESET_ATTEMPT = 'password_reset_attempt',
  PASSWORD_RESET_SUCCESS = 'password_reset_success',
  PASSWORD_RESET_FAILURE = 'password_reset_failure',
  ACCOUNT_LOCKOUT = 'account_lockout',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded'
}

// Authentication method types
export enum AuthMethod {
  PASSWORD = 'password',
  BIOMETRIC = 'biometric',
  DEVICE_FLOW = 'device_flow',
  MAGIC_LINK = 'magic_link',
  OAUTH_GOOGLE = 'oauth_google',
  OAUTH_GITHUB = 'oauth_github',
  OAUTH_FACEBOOK = 'oauth_facebook',
  OAUTH_TWITTER = 'oauth_twitter',
  OAUTH_LINKEDIN = 'oauth_linkedin',
  OAUTH_DISCORD = 'oauth_discord'
}

// Analytics event data
export interface AuthEvent {
  id: string
  userId?: string
  eventType: AuthEventType
  authMethod?: AuthMethod
  success: boolean
  timestamp: Date
  duration?: number // milliseconds
  ipAddress: string
  userAgent: string
  deviceInfo: {
    deviceType: string
    browser: string
    platform: string
  }
  location?: {
    country?: string
    region?: string
    city?: string
  }
  errorCode?: string
  errorMessage?: string
  riskScore?: number
  metadata?: Record<string, any>
}

// Performance metrics
export interface AuthPerformanceMetrics {
  totalRequests: number
  successRate: number
  averageResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  errorRate: number
  methodBreakdown: Record<AuthMethod, {
    count: number
    successRate: number
    averageTime: number
  }>
}

// Security metrics
export interface SecurityMetrics {
  suspiciousActivityCount: number
  rateLimitViolations: number
  accountLockouts: number
  failedLoginAttempts: number
  uniqueIPs: number
  uniqueDevices: number
  riskScoreDistribution: {
    low: number
    medium: number
    high: number
  }
}

// Biometric adoption metrics
export interface BiometricMetrics {
  totalUsers: number
  biometricEnabledUsers: number
  adoptionRate: number
  setupSuccessRate: number
  authSuccessRate: number
  deviceBreakdown: Record<string, number>
  browserBreakdown: Record<string, number>
  platformBreakdown: Record<string, number>
}

// Analytics service class
export class AuthAnalytics {
  private events: AuthEvent[] = []
  private performanceMetrics: AuthPerformanceMetrics
  private securityMetrics: SecurityMetrics
  private biometricMetrics: BiometricMetrics
  private alertThresholds: {
    errorRate: number
    suspiciousActivity: number
    rateLimitViolations: number
  }

  constructor() {
    this.performanceMetrics = this.initializePerformanceMetrics()
    this.securityMetrics = this.initializeSecurityMetrics()
    this.biometricMetrics = this.initializeBiometricMetrics()
    this.alertThresholds = {
      errorRate: 0.05, // 5%
      suspiciousActivity: 10, // 10 events per hour
      rateLimitViolations: 50 // 50 violations per hour
    }
  }

  // Initialize metrics
  private initializePerformanceMetrics(): AuthPerformanceMetrics {
    return {
      totalRequests: 0,
      successRate: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      errorRate: 0,
      methodBreakdown: {} as Record<AuthMethod, any>
    }
  }

  private initializeSecurityMetrics(): SecurityMetrics {
    return {
      suspiciousActivityCount: 0,
      rateLimitViolations: 0,
      accountLockouts: 0,
      failedLoginAttempts: 0,
      uniqueIPs: 0,
      uniqueDevices: 0,
      riskScoreDistribution: {
        low: 0,
        medium: 0,
        high: 0
      }
    }
  }

  private initializeBiometricMetrics(): BiometricMetrics {
    return {
      totalUsers: 0,
      biometricEnabledUsers: 0,
      adoptionRate: 0,
      setupSuccessRate: 0,
      authSuccessRate: 0,
      deviceBreakdown: {},
      browserBreakdown: {},
      platformBreakdown: {}
    }
  }

  // Track authentication event
  async trackEvent(eventData: Omit<AuthEvent, 'id' | 'timestamp'>): Promise<void> {
    const event: AuthEvent = {
      ...eventData,
      id: this.generateEventId(),
      timestamp: new Date()
    }

    // Add to events array
    this.events.push(event)

    // Update metrics
    this.updatePerformanceMetrics(event)
    this.updateSecurityMetrics(event)
    this.updateBiometricMetrics(event)

    // Check for alerts
    await this.checkAlerts(event)

    // Log event
    devLog('Auth analytics event:', {
      eventType: event.eventType,
      success: event.success,
      authMethod: event.authMethod,
      duration: event.duration,
      riskScore: event.riskScore
    })

    // In production, send to external analytics service
    await this.sendToExternalService(event)
  }

  // Generate unique event ID
  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Update performance metrics
  private updatePerformanceMetrics(event: AuthEvent): void {
    const metrics = this.performanceMetrics

    // Update total requests
    metrics.totalRequests++

    // Update success rate
    const successfulRequests = this.events.filter(e => e.success).length
    metrics.successRate = successfulRequests / metrics.totalRequests

    // Update response times
    if (event.duration) {
      const responseTimes = this.events
        .filter(e => e.duration)
        .map(e => e.duration!)
        .sort((a, b) => a - b)

      if (responseTimes.length > 0) {
        metrics.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        metrics.p95ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.95)]
        metrics.p99ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.99)]
      }
    }

    // Update error rate
    const failedRequests = this.events.filter(e => !e.success).length
    metrics.errorRate = failedRequests / metrics.totalRequests

    // Update method breakdown
    if (event.authMethod) {
      if (!metrics.methodBreakdown[event.authMethod]) {
        metrics.methodBreakdown[event.authMethod] = {
          count: 0,
          successRate: 0,
          averageTime: 0
        }
      }

      const methodMetrics = metrics.methodBreakdown[event.authMethod]
      methodMetrics.count++
      
      const methodEvents = this.events.filter(e => e.authMethod === event.authMethod)
      const methodSuccesses = methodEvents.filter(e => e.success).length
      methodMetrics.successRate = methodSuccesses / methodEvents.length

      const methodTimes = methodEvents.filter(e => e.duration).map(e => e.duration!)
      if (methodTimes.length > 0) {
        methodMetrics.averageTime = methodTimes.reduce((a, b) => a + b, 0) / methodTimes.length
      }
    }
  }

  // Update security metrics
  private updateSecurityMetrics(event: AuthEvent): void {
    const metrics = this.securityMetrics

    // Update suspicious activity
    if (event.eventType === AuthEventType.SUSPICIOUS_ACTIVITY) {
      metrics.suspiciousActivityCount++
    }

    // Update rate limit violations
    if (event.eventType === AuthEventType.RATE_LIMIT_EXCEEDED) {
      metrics.rateLimitViolations++
    }

    // Update account lockouts
    if (event.eventType === AuthEventType.ACCOUNT_LOCKOUT) {
      metrics.accountLockouts++
    }

    // Update failed login attempts
    if (event.eventType === AuthEventType.LOGIN_FAILURE) {
      metrics.failedLoginAttempts++
    }

    // Update unique IPs and devices
    const uniqueIPs = new Set(this.events.map(e => e.ipAddress)).size
    const uniqueDevices = new Set(this.events.map(e => e.deviceInfo.deviceType)).size
    metrics.uniqueIPs = uniqueIPs
    metrics.uniqueDevices = uniqueDevices

    // Update risk score distribution
    if (event.riskScore !== undefined) {
      if (event.riskScore < 30) {
        metrics.riskScoreDistribution.low++
      } else if (event.riskScore < 70) {
        metrics.riskScoreDistribution.medium++
      } else {
        metrics.riskScoreDistribution.high++
      }
    }
  }

  // Update biometric metrics
  private updateBiometricMetrics(event: AuthEvent): void {
    const metrics = this.biometricMetrics

    // Update biometric setup metrics
    if (event.eventType === AuthEventType.BIOMETRIC_SETUP_ATTEMPT) {
      metrics.totalUsers++
    }

    if (event.eventType === AuthEventType.BIOMETRIC_SETUP_SUCCESS) {
      metrics.biometricEnabledUsers++
      metrics.adoptionRate = metrics.biometricEnabledUsers / metrics.totalUsers
    }

    // Update setup success rate
    const setupAttempts = this.events.filter(e => e.eventType === AuthEventType.BIOMETRIC_SETUP_ATTEMPT).length
    const setupSuccesses = this.events.filter(e => e.eventType === AuthEventType.BIOMETRIC_SETUP_SUCCESS).length
    if (setupAttempts > 0) {
      metrics.setupSuccessRate = setupSuccesses / setupAttempts
    }

    // Update auth success rate
    const authAttempts = this.events.filter(e => e.eventType === AuthEventType.BIOMETRIC_AUTH_ATTEMPT).length
    const authSuccesses = this.events.filter(e => e.eventType === AuthEventType.BIOMETRIC_AUTH_SUCCESS).length
    if (authAttempts > 0) {
      metrics.authSuccessRate = authSuccesses / authAttempts
    }

    // Update device breakdown
    if (event.deviceInfo) {
      const deviceType = event.deviceInfo.deviceType
      metrics.deviceBreakdown[deviceType] = (metrics.deviceBreakdown[deviceType] || 0) + 1

      const browser = event.deviceInfo.browser
      metrics.browserBreakdown[browser] = (metrics.browserBreakdown[browser] || 0) + 1

      const platform = event.deviceInfo.platform
      metrics.platformBreakdown[platform] = (metrics.platformBreakdown[platform] || 0) + 1
    }
  }

  // Check for security alerts
  private async checkAlerts(event: AuthEvent): Promise<void> {
    const alerts: string[] = []

    // Check error rate
    if (this.performanceMetrics.errorRate > this.alertThresholds.errorRate) {
      alerts.push(`High error rate detected: ${(this.performanceMetrics.errorRate * 100).toFixed(2)}%`)
    }

    // Check suspicious activity
    if (this.securityMetrics.suspiciousActivityCount > this.alertThresholds.suspiciousActivity) {
      alerts.push(`High suspicious activity detected: ${this.securityMetrics.suspiciousActivityCount} events`)
    }

    // Check rate limit violations
    if (this.securityMetrics.rateLimitViolations > this.alertThresholds.rateLimitViolations) {
      alerts.push(`High rate limit violations detected: ${this.securityMetrics.rateLimitViolations} violations`)
    }

    // Send alerts if any
    if (alerts.length > 0) {
      await this.sendAlert(alerts)
    }
  }

  // Send alert (placeholder for production)
  private async sendAlert(alerts: string[]): Promise<void> {
    devLog('Security alert:', alerts)
    
    // In production, send to:
    // - Email/SMS notifications
    // - Slack/Discord webhooks
    // - Security monitoring systems
    // - Incident response teams
  }

  // Send to external analytics service (placeholder for production)
  private async sendToExternalService(event: AuthEvent): Promise<void> {
    // In production, send to:
    // - Google Analytics
    // - Mixpanel
    // - Amplitude
    // - Custom analytics platform
    // - Data warehouse
  }

  // Get performance metrics
  getPerformanceMetrics(): AuthPerformanceMetrics {
    return { ...this.performanceMetrics }
  }

  // Get security metrics
  getSecurityMetrics(): SecurityMetrics {
    return { ...this.securityMetrics }
  }

  // Get biometric metrics
  getBiometricMetrics(): BiometricMetrics {
    return { ...this.biometricMetrics }
  }

  // Get recent events
  getRecentEvents(limit: number = 100): AuthEvent[] {
    return this.events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  // Get events by type
  getEventsByType(eventType: AuthEventType, limit: number = 100): AuthEvent[] {
    return this.events
      .filter(e => e.eventType === eventType)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  // Get events by user
  getEventsByUser(userId: string, limit: number = 100): AuthEvent[] {
    return this.events
      .filter(e => e.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  // Get events by time range
  getEventsByTimeRange(start: Date, end: Date): AuthEvent[] {
    return this.events.filter(e => 
      e.timestamp >= start && e.timestamp <= end
    )
  }

  // Clear old events (for memory management)
  clearOldEvents(maxAge: number = 30 * 24 * 60 * 60 * 1000): void { // 30 days
    const cutoff = new Date(Date.now() - maxAge)
    this.events = this.events.filter(e => e.timestamp > cutoff)
  }

  // Export data for external analysis
  exportData(): {
    events: AuthEvent[]
    performanceMetrics: AuthPerformanceMetrics
    securityMetrics: SecurityMetrics
    biometricMetrics: BiometricMetrics
  } {
    return {
      events: [...this.events],
      performanceMetrics: this.getPerformanceMetrics(),
      securityMetrics: this.getSecurityMetrics(),
      biometricMetrics: this.getBiometricMetrics()
    }
  }
}

// Global analytics instance
export const authAnalytics = new AuthAnalytics()

// Helper functions for common tracking scenarios
export const trackAuthEvent = {
  // Registration events
  registrationAttempt: (data: Omit<AuthEvent, 'eventType' | 'success'>) =>
    authAnalytics.trackEvent({ ...data, eventType: AuthEventType.REGISTRATION_ATTEMPT, success: false }),

  registrationSuccess: (data: Omit<AuthEvent, 'eventType' | 'success'>) =>
    authAnalytics.trackEvent({ ...data, eventType: AuthEventType.REGISTRATION_SUCCESS, success: true }),

  registrationFailure: (data: Omit<AuthEvent, 'eventType' | 'success'>) =>
    authAnalytics.trackEvent({ ...data, eventType: AuthEventType.REGISTRATION_FAILURE, success: false }),

  // Login events
  loginAttempt: (data: Omit<AuthEvent, 'eventType' | 'success'>) =>
    authAnalytics.trackEvent({ ...data, eventType: AuthEventType.LOGIN_ATTEMPT, success: false }),

  loginSuccess: (data: Omit<AuthEvent, 'eventType' | 'success'>) =>
    authAnalytics.trackEvent({ ...data, eventType: AuthEventType.LOGIN_SUCCESS, success: true }),

  loginFailure: (data: Omit<AuthEvent, 'eventType' | 'success'>) =>
    authAnalytics.trackEvent({ ...data, eventType: AuthEventType.LOGIN_FAILURE, success: false }),

  // Biometric events
  biometricSetupAttempt: (data: Omit<AuthEvent, 'eventType' | 'success'>) =>
    authAnalytics.trackEvent({ ...data, eventType: AuthEventType.BIOMETRIC_SETUP_ATTEMPT, success: false }),

  biometricSetupSuccess: (data: Omit<AuthEvent, 'eventType' | 'success'>) =>
    authAnalytics.trackEvent({ ...data, eventType: AuthEventType.BIOMETRIC_SETUP_SUCCESS, success: true }),

  biometricSetupFailure: (data: Omit<AuthEvent, 'eventType' | 'success'>) =>
    authAnalytics.trackEvent({ ...data, eventType: AuthEventType.BIOMETRIC_SETUP_FAILURE, success: false }),

  biometricAuthAttempt: (data: Omit<AuthEvent, 'eventType' | 'success'>) =>
    authAnalytics.trackEvent({ ...data, eventType: AuthEventType.BIOMETRIC_AUTH_ATTEMPT, success: false }),

  biometricAuthSuccess: (data: Omit<AuthEvent, 'eventType' | 'success'>) =>
    authAnalytics.trackEvent({ ...data, eventType: AuthEventType.BIOMETRIC_AUTH_SUCCESS, success: true }),

  biometricAuthFailure: (data: Omit<AuthEvent, 'eventType' | 'success'>) =>
    authAnalytics.trackEvent({ ...data, eventType: AuthEventType.BIOMETRIC_AUTH_FAILURE, success: false }),

  // Device flow events
  deviceFlowAttempt: (data: Omit<AuthEvent, 'eventType' | 'success'>) =>
    authAnalytics.trackEvent({ ...data, eventType: AuthEventType.DEVICE_FLOW_ATTEMPT, success: false }),

  deviceFlowSuccess: (data: Omit<AuthEvent, 'eventType' | 'success'>) =>
    authAnalytics.trackEvent({ ...data, eventType: AuthEventType.DEVICE_FLOW_SUCCESS, success: true }),

  deviceFlowFailure: (data: Omit<AuthEvent, 'eventType' | 'success'>) =>
    authAnalytics.trackEvent({ ...data, eventType: AuthEventType.DEVICE_FLOW_FAILURE, success: false }),

  // Security events
  suspiciousActivity: (data: Omit<AuthEvent, 'eventType' | 'success'>) =>
    authAnalytics.trackEvent({ ...data, eventType: AuthEventType.SUSPICIOUS_ACTIVITY, success: false }),

  rateLimitExceeded: (data: Omit<AuthEvent, 'eventType' | 'success'>) =>
    authAnalytics.trackEvent({ ...data, eventType: AuthEventType.RATE_LIMIT_EXCEEDED, success: false }),

  accountLockout: (data: Omit<AuthEvent, 'eventType' | 'success'>) =>
    authAnalytics.trackEvent({ ...data, eventType: AuthEventType.ACCOUNT_LOCKOUT, success: false })
}



