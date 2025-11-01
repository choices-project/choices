import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter'
import { upstashRateLimiter } from '@/lib/rate-limiting/upstash-rate-limiter'

jest.mock('@/lib/rate-limiting/upstash-rate-limiter', () => ({
  upstashRateLimiter: {
    checkLimit: jest.fn(),
    recordViolationExternal: jest.fn()
  }
}))

describe('apiRateLimiter facade', () => {
  it('records violation on disallow', async () => {
    (upstashRateLimiter.checkLimit as jest.Mock).mockResolvedValue({
      allowed: false, remaining: 0, resetTime: Date.now(), totalHits: 51, retryAfter: 900
    })
    await apiRateLimiter.checkLimit('1.2.3.4', '/api/test', { maxRequests: 50, windowMs: 900000, userAgent: 'UA' })
    expect(upstashRateLimiter.recordViolationExternal).toHaveBeenCalled()
  })

  it('does not record on allow', async () => {
    (upstashRateLimiter.checkLimit as jest.Mock).mockResolvedValue({
      allowed: true, remaining: 49, resetTime: Date.now(), totalHits: 1
    })
    ;(upstashRateLimiter.recordViolationExternal as jest.Mock).mockClear()
    await apiRateLimiter.checkLimit('1.2.3.4', '/api/test', { maxRequests: 50, windowMs: 900000, userAgent: 'UA' })
    expect(upstashRateLimiter.recordViolationExternal).not.toHaveBeenCalled()
  })
})


