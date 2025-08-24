interface RateLimitConfig {
  interval: number
  uniqueTokenPerInterval: number
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

// Simple in-memory rate limiter for development
// In production, use Redis or similar for distributed rate limiting
class RateLimiter {
  private tokens: Map<string, { count: number; resetTime: number }> = new Map()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  async check(limit: number, identifier: string): Promise<RateLimitResult> {
    const now = Date.now()
    const key = `${identifier}:${Math.floor(now / this.config.interval)}`
    
    const current = this.tokens.get(key)
    
    if (!current || now > current.resetTime) {
      // First request or interval expired
      this.tokens.set(key, {
        count: 1,
        resetTime: now + this.config.interval,
      })
      
      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: now + this.config.interval,
      }
    }
    
    if (current.count >= limit) {
      // Rate limit exceeded
      return {
        success: false,
        limit,
        remaining: 0,
        reset: current.resetTime,
      }
    }
    
    // Increment counter
    current.count++
    this.tokens.set(key, current)
    
    return {
      success: true,
      limit,
      remaining: limit - current.count,
      reset: current.resetTime,
    }
  }

  // Clean up expired entries periodically
  cleanup() {
    const now = Date.now()
    for (const [key, value] of this.tokens.entries()) {
      if (now > value.resetTime) {
        this.tokens.delete(key)
      }
    }
  }
}

// Clean up expired entries every 5 minutes
setInterval(() => {
  // This would need to be called on each rate limiter instance
  // In a real implementation, this would be handled by the rate limiting service
}, 5 * 60 * 1000)

export function rateLimit(config: RateLimitConfig): RateLimiter {
  return new RateLimiter(config)
}
