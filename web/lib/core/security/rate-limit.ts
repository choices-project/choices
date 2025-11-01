/**
 * DEPRECATED: Legacy in-memory rate limiting (kept for reference/tests)
 * Use Upstash-backed limiter in `@/lib/rate-limiting/api-rate-limiter` instead.
 */

import { devLog } from '../../logger'

// Rate limit configuration
export type RateLimitConfig = {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval: number // Max requests per interval
  maxBurst?: number // Maximum burst allowance
  reputationThreshold?: number // Reputation score threshold for stricter limits
  deviceFingerprintWeight?: number // Weight for device fingerprint in risk calculation
}

// IP reputation data
export type IPReputation = {
  ip: string
  score: number // 0-100, higher = more trusted
  requestCount: number
  lastRequest: Date
  violations: number
  suspiciousActivity: boolean
  whitelisted: boolean
  blacklisted: boolean
}

// Device fingerprint data
export type DeviceFingerprint = {
  userAgent: string
  screenResolution: string
  timezone: string
  language: string
  platform: string
  cookieEnabled: boolean
  doNotTrack: boolean
  hash: string // Computed fingerprint hash
}

// Risk assessment result
export type RiskAssessment = {
  riskScore: number // 0-100, higher = higher risk
  factors: string[]
  recommendedAction: 'allow' | 'challenge' | 'block'
  rateLimitMultiplier: number // Multiplier for rate limit (higher = stricter)
}

// Rate limit result
export type RateLimitResult = {
  success: boolean
  allowed: boolean
  remaining: number
  resetTime: Date
  retryAfter?: number | null
  riskAssessment?: RiskAssessment
  reputation?: IPReputation | null
}

// Token bucket for rate limiting
class TokenBucket {
  private tokens: number
  private lastRefill: number
  private readonly capacity: number
  private readonly refillRate: number

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity
    this.refillRate = refillRate
    this.tokens = capacity
    this.lastRefill = Date.now()
  }

  tryConsume(tokens: number = 1): boolean {
    this.refill()
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens
      return true
    }
    
    return false
  }

  private refill(): void {
    const now = Date.now()
    const timePassed = now - this.lastRefill
    const tokensToAdd = (timePassed * this.refillRate) / 1000
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd)
    this.lastRefill = now
  }

  getRemaining(): number {
    this.refill()
    return Math.floor(this.tokens)
  }

  getResetTime(): Date {
    const tokensNeeded = this.capacity - this.tokens
    const timeNeeded = (tokensNeeded / this.refillRate) * 1000
    return new Date(Date.now() + timeNeeded)
  }
}

// Enhanced Rate Limiter with reputation and device fingerprinting
export class EnhancedRateLimiter {
  private buckets: Map<string, TokenBucket> = new Map()
  private reputation: Map<string, IPReputation> = new Map()
  private deviceFingerprints: Map<string, DeviceFingerprint> = new Map()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = Object.assign({}, {
      maxBurst: 5,
      reputationThreshold: 50,
      deviceFingerprintWeight: 0.3,
    }, config)
  }

  // Get client IP address
  private getClientIP(req: Request): string {
    // Check for forwarded headers (common in proxy setups)
    const forwarded = req.headers.get('x-forwarded-for')
    if (forwarded) {
      const firstIP = forwarded.split(',')[0]
      if (firstIP) {
        return firstIP.trim()
      }
    }

    const realIP = req.headers.get('x-real-ip')
    if (realIP) {
      return realIP
    }

    // Fallback to connection remote address (if available)
    return 'unknown'
  }

  // Generate device fingerprint from request
  private generateDeviceFingerprint(req: Request): DeviceFingerprint {
    const userAgent = req.headers.get('user-agent') || ''
    const acceptLanguage = req.headers.get('accept-language') || ''
    
    // Extract basic fingerprint data
    const fingerprint: DeviceFingerprint = {
      userAgent,
      screenResolution: req.headers.get('sec-ch-viewport-width') + 'x' + req.headers.get('sec-ch-viewport-height') || 'unknown',
      timezone: req.headers.get('sec-ch-prefers-color-scheme') || 'unknown',
      language: acceptLanguage.split(',')[0] || 'unknown',
      platform: this.extractPlatform(userAgent),
      cookieEnabled: req.headers.get('cookie') !== null,
      doNotTrack: req.headers.get('dnt') === '1',
      hash: ''
    }

    // Generate hash from fingerprint data
    fingerprint.hash = this.hashFingerprint(fingerprint)
    
    return fingerprint
  }

  // Extract platform from user agent
  private extractPlatform(userAgent: string): string {
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      return 'ios'
    } else if (userAgent.includes('Android')) {
      return 'android'
    } else if (userAgent.includes('Windows')) {
      return 'windows'
    } else if (userAgent.includes('Mac')) {
      return 'macos'
    } else if (userAgent.includes('Linux')) {
      return 'linux'
    }
    return 'unknown'
  }

  // Hash device fingerprint
  private hashFingerprint(fingerprint: DeviceFingerprint): string {
    const data = `${fingerprint.userAgent}|${fingerprint.screenResolution}|${fingerprint.timezone}|${fingerprint.language}|${fingerprint.platform}|${fingerprint.cookieEnabled}|${fingerprint.doNotTrack}`
    
    // Simple hash function (in production, use crypto.createHash)
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36)
  }

  // Assess risk based on IP and device fingerprint
  private assessRisk(ip: string, deviceFingerprint: DeviceFingerprint): RiskAssessment {
    const factors: string[] = []
    let riskScore = 0

    // Check IP reputation
    const reputation = this.reputation.get(ip)
    if (reputation) {
      if (reputation.blacklisted) {
        riskScore = 100
        factors.push('IP blacklisted')
      } else if (reputation.whitelisted) {
        riskScore = 0
        factors.push('IP whitelisted')
      } else {
        riskScore += (100 - reputation.score) * 0.4 // IP reputation weight
        if (reputation.suspiciousActivity) {
          factors.push('Suspicious IP activity')
          riskScore += 20
        }
        if (reputation.violations > 0) {
          factors.push(`IP violations: ${reputation.violations}`)
          riskScore += reputation.violations * 10
        }
      }
    } else {
      // New IP - moderate risk
      riskScore += 30
      factors.push('New IP address')
    }

    // Check device fingerprint
    const existingFingerprint = this.deviceFingerprints.get(deviceFingerprint.hash)
    if (existingFingerprint) {
      // Known device - lower risk
      riskScore -= 20
      factors.push('Known device')
    } else {
      // New device - higher risk
      riskScore += 25
      factors.push('New device fingerprint')
    }

    // Check for suspicious patterns
    if (deviceFingerprint.userAgent.includes('bot') || deviceFingerprint.userAgent.includes('crawler')) {
      riskScore += 40
      factors.push('Bot-like user agent')
    }

    if (!deviceFingerprint.cookieEnabled) {
      riskScore += 15
      factors.push('Cookies disabled')
    }

    // Normalize risk score
    riskScore = Math.max(0, Math.min(100, riskScore))

    // Determine recommended action
    let recommendedAction: 'allow' | 'challenge' | 'block' = 'allow'
    if (riskScore >= 80) {
      recommendedAction = 'block'
    } else if (riskScore >= 50) {
      recommendedAction = 'challenge'
    }

    // Calculate rate limit multiplier
    const rateLimitMultiplier = 1 + (riskScore / 100) * 2 // 1x to 3x multiplier

    return {
      riskScore,
      factors,
      recommendedAction,
      rateLimitMultiplier
    }
  }

  // Update IP reputation
  private updateReputation(ip: string, success: boolean, riskAssessment: RiskAssessment): void {
    let reputation = this.reputation.get(ip)
    
    if (!reputation) {
      reputation = {
        ip,
        score: 50, // Neutral starting score
        requestCount: 0,
        lastRequest: new Date(),
        violations: 0,
        suspiciousActivity: false,
        whitelisted: false,
        blacklisted: false
      }
    }

    // Update request count and last request
    reputation.requestCount++
    reputation.lastRequest = new Date()

    // Update score based on success/failure
    if (success) {
      reputation.score = Math.min(100, reputation.score + 1)
    } else {
      reputation.score = Math.max(0, reputation.score - 5)
      reputation.violations++
    }

    // Update suspicious activity flag
    if (riskAssessment.riskScore > 70) {
      reputation.suspiciousActivity = true
    }

    // Auto-blacklist if too many violations
    if (reputation.violations >= 10) {
      reputation.blacklisted = true
      reputation.score = 0
    }

    // Auto-whitelist if very good behavior
    if (reputation.requestCount > 100 && reputation.score > 90 && reputation.violations === 0) {
      reputation.whitelisted = true
    }

    this.reputation.set(ip, reputation)
  }

  // Check rate limit with enhanced features
  async check(req: Request, identifier?: string): Promise<RateLimitResult> {
    const ip = this.getClientIP(req)
    const deviceFingerprint = this.generateDeviceFingerprint(req)
    const key = identifier || ip

    // Assess risk
    const riskAssessment = this.assessRisk(ip, deviceFingerprint)

    // Get or create token bucket
    let bucket = this.buckets.get(key)
    if (!bucket) {
      const adjustedLimit = Math.floor(this.config.uniqueTokenPerInterval / riskAssessment.rateLimitMultiplier)
      const refillRate = adjustedLimit / (this.config.interval / 1000)
      bucket = new TokenBucket(adjustedLimit, refillRate)
      this.buckets.set(key, bucket)
    }

    // Try to consume token
    const allowed = bucket.tryConsume()
    const remaining = bucket.getRemaining()
    const resetTime = bucket.getResetTime()

    // Update reputation
    this.updateReputation(ip, allowed, riskAssessment)

    // Store device fingerprint
    this.deviceFingerprints.set(deviceFingerprint.hash, deviceFingerprint)

    // Log for analytics
    devLog('Rate limit check:', {
      ip,
      key,
      allowed,
      remaining,
      riskScore: riskAssessment.riskScore,
      factors: riskAssessment.factors,
      action: riskAssessment.recommendedAction
    })

    return {
      success: true,
      allowed,
      remaining,
      resetTime,
      retryAfter: allowed ? null : Math.ceil((resetTime.getTime() - Date.now()) / 1000),
      riskAssessment,
      reputation: this.reputation.get(ip) || null
    }
  }

  // Get reputation for an IP
  getReputation(ip: string): IPReputation | null {
    return this.reputation.get(ip) || null
  }

  // Manually update reputation
  updateReputationManually(ip: string, updates: Partial<IPReputation>): void {
    const reputation = this.reputation.get(ip)
    if (reputation) {
      Object.assign(reputation, updates)
      this.reputation.set(ip, reputation)
    }
  }

  // Cleanup old data
  cleanup(): void {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours

    // Cleanup old buckets
    for (const [key, bucket] of Array.from(this.buckets.entries())) {
      if (now - bucket.getResetTime().getTime() > maxAge) {
        this.buckets.delete(key)
      }
    }

    // Cleanup old reputation data
    for (const [ip, reputation] of Array.from(this.reputation.entries())) {
      if (now - reputation.lastRequest.getTime() > maxAge * 7) { // 7 days
        this.reputation.delete(ip)
      }
    }

    // Cleanup old device fingerprints
    // Note: In production, you might want to keep these longer for analytics
  }

  // Get statistics
  getStats(): {
    buckets: number
    reputation: number
    deviceFingerprints: number
  } {
    return {
      buckets: this.buckets.size,
      reputation: this.reputation.size,
      deviceFingerprints: this.deviceFingerprints.size
    }
  }
}

// Redis-based rate limiter for production
export class RedisRateLimiter {
  // Implementation for Redis-based rate limiting
  // This would be used in production for distributed rate limiting
  // For now, we'll use the enhanced memory-based limiter
}

// Factory function to create appropriate rate limiter
export function createRateLimiter(config: RateLimitConfig): EnhancedRateLimiter {
  // In production, check environment and return Redis-based limiter if available
  return new EnhancedRateLimiter(config)
}

// Pre-configured rate limiters for different endpoints
export const rateLimiters = {
  auth: createRateLimiter({
    interval: 15 * 60 * 1000, // 15 minutes
    uniqueTokenPerInterval: 10, // 10 attempts per 15 minutes
    maxBurst: 3
  }),
  
  registration: createRateLimiter({
    interval: 60 * 60 * 1000, // 1 hour
    uniqueTokenPerInterval: 5, // 5 registrations per hour
    maxBurst: 1
  }),
  
  deviceFlow: createRateLimiter({
    interval: 5 * 60 * 1000, // 5 minutes
    uniqueTokenPerInterval: 20, // 20 device flow attempts per 5 minutes
    maxBurst: 5
  }),
  
  biometric: createRateLimiter({
    interval: 5 * 60 * 1000, // 5 minutes
    uniqueTokenPerInterval: 30, // 30 biometric attempts per 5 minutes
    maxBurst: 10
  })
}

// Middleware function for API routes
export async function rateLimitMiddleware(
  req: Request,
  limiter: EnhancedRateLimiter = rateLimiters.auth
): Promise<RateLimitResult> {
  return await limiter.check(req)
}
