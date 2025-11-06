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

import { withOptional } from '@/lib/util/objects'
import { logger } from '@/lib/utils/logger'

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
export type AuthEvent = {
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
export type AuthPerformanceMetrics = {
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
export type SecurityMetrics = {
  totalEvents: number
  suspiciousActivityCount: number
  rateLimitViolations: number
  accountLockouts: number
  failedAttempts: number
  riskScoreDistribution: {
    low: number
    medium: number
    high: number
  }
}

// Biometric metrics
export type BiometricMetrics = {
  totalSetupAttempts: number
  setupSuccessRate: number
  totalAuthAttempts: number
  authSuccessRate: number
  deviceBreakdown: Record<string, number>
  browserBreakdown: Record<string, number>
  platformBreakdown: Record<string, number>
}

// Analytics context for tracking
export type AuthContext = {
  userId?: string
  ipAddress?: string
  userAgent?: string
  deviceInfo?: {
    deviceType: string
    browser: string
    platform: string
  }
}

// Main analytics service
export class AuthAnalytics {
  private events: AuthEvent[] = []
  private performanceMetrics: AuthPerformanceMetrics
  private securityMetrics: SecurityMetrics
  private biometricMetrics: BiometricMetrics
  private alertThresholds = {
    errorRate: 0.1, // 10%
    suspiciousActivity: 5,
    rateLimitViolations: 10
  }

  constructor() {
    this.performanceMetrics = {
      totalRequests: 0,
      successRate: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      errorRate: 0,
      methodBreakdown: {} as Record<AuthMethod, {
        count: number;
        successRate: number;
        averageTime: number;
      }>
    }

    this.securityMetrics = {
      totalEvents: 0,
      suspiciousActivityCount: 0,
      rateLimitViolations: 0,
      accountLockouts: 0,
      failedAttempts: 0,
      riskScoreDistribution: { low: 0, medium: 0, high: 0 }
    }

    this.biometricMetrics = {
      totalSetupAttempts: 0,
      setupSuccessRate: 0,
      totalAuthAttempts: 0,
      authSuccessRate: 0,
      deviceBreakdown: {},
      browserBreakdown: {},
      platformBreakdown: {}
    }
  }

  // Track authentication event
  async trackAuthEvent(
    eventType: AuthEventType,
    authMethod: AuthMethod,
    success: boolean,
    context: AuthContext,
    options: {
      duration?: number
      errorCode?: string
      errorMessage?: string
      riskScore?: number
      metadata?: Record<string, unknown>
    } = {}
  ): Promise<void> {
    const baseEvent = {
      id: this.generateEventId(),
      eventType,
      success,
      timestamp: new Date(),
      ipAddress: context.ipAddress ?? 'unknown',
      userAgent: context.userAgent ?? 'unknown',
      deviceInfo: context.deviceInfo ?? {
        deviceType: 'unknown',
        browser: 'unknown',
        platform: 'unknown'
      },
      authMethod,
    };
    
    const optionalData: Record<string, unknown> = {};
    if (context.userId) optionalData.userId = context.userId;
    if (options.duration !== undefined) optionalData.duration = options.duration;
    if (options.errorCode) optionalData.errorCode = options.errorCode;
    if (options.errorMessage) optionalData.errorMessage = options.errorMessage;
    if (options.riskScore !== undefined) optionalData.riskScore = options.riskScore;
    if (options.metadata) optionalData.metadata = options.metadata;
    
    const event = withOptional(baseEvent, optionalData) as AuthEvent;

    // Add to events
    this.events.push(event)

    // Update metrics
    this.updateMetrics(event)

    // Check for alerts
    await this.checkAlerts(event)

    // Log the event
    logger.info('Auth event tracked', {
      eventType,
      authMethod,
      success,
      userId: context.userId,
      duration: options.duration,
      riskScore: options.riskScore
    })

    // Send to external service in production
    await this.sendToExternalService(event)
  }

  // Convenience methods for common events
  async trackRegistrationAttempt(context: AuthContext, metadata?: Record<string, unknown>): Promise<void> {
    await this.trackAuthEvent(AuthEventType.REGISTRATION_ATTEMPT, AuthMethod.PASSWORD, false, context, metadata ? { metadata } : {})
  }

  async trackRegistrationSuccess(context: AuthContext, duration?: number): Promise<void> {
    await this.trackAuthEvent(AuthEventType.REGISTRATION_SUCCESS, AuthMethod.PASSWORD, true, context, duration !== undefined ? { duration } : {})
  }

  async trackRegistrationFailure(context: AuthContext, errorCode: string, errorMessage: string): Promise<void> {
    await this.trackAuthEvent(AuthEventType.REGISTRATION_FAILURE, AuthMethod.PASSWORD, false, context, { errorCode, errorMessage })
  }

  async trackLoginAttempt(context: AuthContext, authMethod: AuthMethod, metadata?: Record<string, unknown>): Promise<void> {
    await this.trackAuthEvent(AuthEventType.LOGIN_ATTEMPT, authMethod, false, context, metadata ? { metadata } : {})
  }

  async trackLoginSuccess(context: AuthContext, authMethod: AuthMethod, duration?: number): Promise<void> {
    await this.trackAuthEvent(AuthEventType.LOGIN_SUCCESS, authMethod, true, context, duration !== undefined ? { duration } : {})
  }

  async trackLoginFailure(context: AuthContext, authMethod: AuthMethod, errorCode: string, errorMessage: string): Promise<void> {
    await this.trackAuthEvent(AuthEventType.LOGIN_FAILURE, authMethod, false, context, { errorCode, errorMessage })
  }

  async trackBiometricSetupAttempt(context: AuthContext): Promise<void> {
    await this.trackAuthEvent(AuthEventType.BIOMETRIC_SETUP_ATTEMPT, AuthMethod.BIOMETRIC, false, context)
  }

  async trackBiometricSetupSuccess(context: AuthContext, duration?: number): Promise<void> {
    await this.trackAuthEvent(AuthEventType.BIOMETRIC_SETUP_SUCCESS, AuthMethod.BIOMETRIC, true, context, duration !== undefined ? { duration } : {})
  }

  async trackBiometricSetupFailure(context: AuthContext, errorCode: string, errorMessage: string): Promise<void> {
    await this.trackAuthEvent(AuthEventType.BIOMETRIC_SETUP_FAILURE, AuthMethod.BIOMETRIC, false, context, { errorCode, errorMessage })
  }

  async trackBiometricAuthAttempt(context: AuthContext): Promise<void> {
    await this.trackAuthEvent(AuthEventType.BIOMETRIC_AUTH_ATTEMPT, AuthMethod.BIOMETRIC, false, context)
  }

  async trackBiometricAuthSuccess(context: AuthContext, duration?: number): Promise<void> {
    await this.trackAuthEvent(AuthEventType.BIOMETRIC_AUTH_SUCCESS, AuthMethod.BIOMETRIC, true, context, duration !== undefined ? { duration } : {})
  }

  async trackBiometricAuthFailure(context: AuthContext, errorCode: string, errorMessage: string): Promise<void> {
    await this.trackAuthEvent(AuthEventType.BIOMETRIC_AUTH_FAILURE, AuthMethod.BIOMETRIC, false, context, { errorCode, errorMessage })
  }

  async trackDeviceFlowAttempt(context: AuthContext): Promise<void> {
    await this.trackAuthEvent(AuthEventType.DEVICE_FLOW_ATTEMPT, AuthMethod.DEVICE_FLOW, false, context)
  }

  async trackDeviceFlowSuccess(context: AuthContext, duration?: number): Promise<void> {
    await this.trackAuthEvent(AuthEventType.DEVICE_FLOW_SUCCESS, AuthMethod.DEVICE_FLOW, true, context, duration !== undefined ? { duration } : undefined)
  }

  async trackDeviceFlowFailure(context: AuthContext, errorCode: string, errorMessage: string): Promise<void> {
    await this.trackAuthEvent(AuthEventType.DEVICE_FLOW_FAILURE, AuthMethod.DEVICE_FLOW, false, context, { errorCode, errorMessage })
  }

  async trackPasswordResetAttempt(context: AuthContext): Promise<void> {
    await this.trackAuthEvent(AuthEventType.PASSWORD_RESET_ATTEMPT, AuthMethod.PASSWORD, false, context)
  }

  async trackPasswordResetSuccess(context: AuthContext, duration?: number): Promise<void> {
    await this.trackAuthEvent(AuthEventType.PASSWORD_RESET_SUCCESS, AuthMethod.PASSWORD, true, context, duration !== undefined ? { duration } : undefined)
  }

  async trackPasswordResetFailure(context: AuthContext, errorCode: string, errorMessage: string): Promise<void> {
    await this.trackAuthEvent(AuthEventType.PASSWORD_RESET_FAILURE, AuthMethod.PASSWORD, false, context, { errorCode, errorMessage })
  }

  async trackAccountLockout(context: AuthContext, reason: string): Promise<void> {
    await this.trackAuthEvent(AuthEventType.ACCOUNT_LOCKOUT, AuthMethod.PASSWORD, false, context, { 
      errorMessage: reason,
      riskScore: 100 
    })
  }

  async trackSuspiciousActivity(context: AuthContext, activity: string, riskScore: number): Promise<void> {
    await this.trackAuthEvent(AuthEventType.SUSPICIOUS_ACTIVITY, AuthMethod.PASSWORD, false, context, { 
      errorMessage: activity,
      riskScore 
    })
  }

  async trackRateLimitExceeded(context: AuthContext, limit: string): Promise<void> {
    await this.trackAuthEvent(AuthEventType.RATE_LIMIT_EXCEEDED, AuthMethod.PASSWORD, false, context, { 
      errorMessage: `Rate limit exceeded: ${limit}`,
      riskScore: 75 
    })
  }

  // Generate unique event ID
  private generateEventId(): string {
    return `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Update metrics based on event
  private updateMetrics(event: AuthEvent): void {
    // Update performance metrics
    this.performanceMetrics.totalRequests++
    
    if (event.success) {
      const successCount = this.events.filter(e => e.success).length
      this.performanceMetrics.successRate = successCount / this.performanceMetrics.totalRequests
    } else {
      this.performanceMetrics.errorRate = 1 - this.performanceMetrics.successRate
    }

    if (event.duration) {
      const durations = this.events.filter(e => e.duration).map(e => e.duration!)
      this.performanceMetrics.averageResponseTime = durations.reduce((a, b) => a + b, 0) / durations.length
      
      // Calculate percentiles
      const sortedDurations = durations.sort((a, b) => a - b)
      const p95Index = Math.floor(sortedDurations.length * 0.95)
      const p99Index = Math.floor(sortedDurations.length * 0.99)
      this.performanceMetrics.p95ResponseTime = sortedDurations[p95Index] ?? 0
      this.performanceMetrics.p99ResponseTime = sortedDurations[p99Index] ?? 0
    }

    // Update method breakdown
    if (event.authMethod) {
      if (!this.performanceMetrics.methodBreakdown[event.authMethod]) {
        this.performanceMetrics.methodBreakdown[event.authMethod] = { count: 0, successRate: 0, averageTime: 0 }
      }
      this.performanceMetrics.methodBreakdown[event.authMethod].count++
      
      const methodEvents = this.events.filter(e => e.authMethod === event.authMethod)
      const methodSuccesses = methodEvents.filter(e => e.success).length
      this.performanceMetrics.methodBreakdown[event.authMethod].successRate = methodSuccesses / methodEvents.length
      
      const methodDurations = methodEvents.filter(e => e.duration).map(e => e.duration!)
      if (methodDurations.length > 0) {
        this.performanceMetrics.methodBreakdown[event.authMethod].averageTime = methodDurations.reduce((a, b) => a + b, 0) / methodDurations.length
      }
    }

    // Update security metrics
    this.securityMetrics.totalEvents++
    
    if (event.eventType === AuthEventType.SUSPICIOUS_ACTIVITY) {
      this.securityMetrics.suspiciousActivityCount++
    }
    
    if (event.eventType === AuthEventType.RATE_LIMIT_EXCEEDED) {
      this.securityMetrics.rateLimitViolations++
    }
    
    if (event.eventType === AuthEventType.ACCOUNT_LOCKOUT) {
      this.securityMetrics.accountLockouts++
    }
    
    if (!event.success) {
      this.securityMetrics.failedAttempts++
    }

    if (event.riskScore) {
      if (event.riskScore < 30) this.securityMetrics.riskScoreDistribution.low++
      else if (event.riskScore < 70) this.securityMetrics.riskScoreDistribution.medium++
      else this.securityMetrics.riskScoreDistribution.high++
    }

    // Update biometric metrics
    if (event.authMethod === AuthMethod.BIOMETRIC) {
      if (event.eventType === AuthEventType.BIOMETRIC_SETUP_ATTEMPT) {
        this.biometricMetrics.totalSetupAttempts++
      }
      
      if (event.eventType === AuthEventType.BIOMETRIC_AUTH_ATTEMPT) {
        this.biometricMetrics.totalAuthAttempts++
      }

      const setupEvents = this.events.filter(e => e.eventType === AuthEventType.BIOMETRIC_SETUP_ATTEMPT || e.eventType === AuthEventType.BIOMETRIC_SETUP_SUCCESS)
      const setupSuccesses = setupEvents.filter(e => e.eventType === AuthEventType.BIOMETRIC_SETUP_SUCCESS).length
      this.biometricMetrics.setupSuccessRate = setupSuccesses / setupEvents.length

      const authEvents = this.events.filter(e => e.eventType === AuthEventType.BIOMETRIC_AUTH_ATTEMPT || e.eventType === AuthEventType.BIOMETRIC_AUTH_SUCCESS)
      const authSuccesses = authEvents.filter(e => e.eventType === AuthEventType.BIOMETRIC_AUTH_SUCCESS).length
      this.biometricMetrics.authSuccessRate = authSuccesses / authEvents.length

      // Update device breakdown
      if (event.deviceInfo) {
        const deviceType = event.deviceInfo.deviceType
        this.biometricMetrics.deviceBreakdown[deviceType] = (this.biometricMetrics.deviceBreakdown[deviceType] ?? 0) + 1

        const browser = event.deviceInfo.browser
        this.biometricMetrics.browserBreakdown[browser] = (this.biometricMetrics.browserBreakdown[browser] ?? 0) + 1

        const platform = event.deviceInfo.platform
        this.biometricMetrics.platformBreakdown[platform] = (this.biometricMetrics.platformBreakdown[platform] ?? 0) + 1
      }
    }
  }

  // Check for security alerts
  private async checkAlerts(_event: AuthEvent): Promise<void> {
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

  // Send alert
  private async sendAlert(alerts: string[]): Promise<void> {
    logger.warn('Security alert:', { alerts })
    
    // In production, send to:
    // - Email/SMS notifications
    // - Slack/Discord webhooks
    // - Security monitoring systems
    // - Incident response teams
  }

  // Send to external analytics service
  private async sendToExternalService(event: AuthEvent): Promise<void> {
    // In production, send to:
    // - Google Analytics
    // - Mixpanel
    // - Amplitude
    // - Custom analytics platform
    // - Data warehouse
    
    // Log the event for external service integration
    logger.info('Sending auth event to external service', {
      eventId: event.id,
      eventType: event.eventType,
      authMethod: event.authMethod,
      success: event.success,
      userId: event.userId,
      timestamp: event.timestamp.toISOString()
    })
    
    // Send to external analytics service
    try {
      await fetch('/api/analytics/unified/auth-events?methods=comprehensive&ai-provider=rule-based', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    } catch (error) {
      logger.error('Failed to send auth event to external service', error instanceof Error ? error : new Error(String(error)));
    }
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
  getRecentEvents(limit = 100): AuthEvent[] {
    return this.events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  // Get events by type
  getEventsByType(eventType: AuthEventType, limit = 100): AuthEvent[] {
    return this.events
      .filter(e => e.eventType === eventType)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  // Get events by user
  getEventsByUser(userId: string, limit = 100): AuthEvent[] {
    return this.events
      .filter(e => e.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  // Get events by time range
  getEventsByTimeRange(start: Date, end: Date): AuthEvent[] {
    return this.events.filter(e => e.timestamp >= start && e.timestamp <= end)
  }

  // Get events by auth method
  getEventsByAuthMethod(authMethod: AuthMethod, limit = 100): AuthEvent[] {
    return this.events
      .filter(e => e.authMethod === authMethod)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  // Clear old events (for memory management)
  clearOldEvents(olderThan: Date): void {
    this.events = this.events.filter(e => e.timestamp > olderThan)
  }

  // Export events for backup/analysis
  exportEvents(): AuthEvent[] {
    return [...this.events]
  }

  // Import events (for data migration)
  importEvents(events: AuthEvent[]): void {
    this.events.push(...events.filter(event => event !== undefined))
  }
}

// Singleton instance
export const authAnalytics = new AuthAnalytics()

// Convenience function for tracking events
export function trackAuthEvent(
  eventType: AuthEventType,
  authMethod: AuthMethod,
  success: boolean,
  context: AuthContext,
  options?: {
    duration?: number
    errorCode?: string
    errorMessage?: string
    riskScore?: number
    metadata?: Record<string, unknown>
  }
): Promise<void> {
  return authAnalytics.trackAuthEvent(eventType, authMethod, success, context, options)
}



