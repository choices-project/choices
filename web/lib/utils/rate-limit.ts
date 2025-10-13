// Mock rate limiting utilities for testing
export const checkRateLimit = jest.fn().mockResolvedValue({
  allowed: true,
  remaining: 10,
  resetTime: Date.now() + 60000,
})

export const createRateLimiter = jest.fn().mockReturnValue({
  check: checkRateLimit,
  reset: jest.fn(),
  getStats: jest.fn().mockReturnValue({
    total: 0,
    remaining: 10,
    resetTime: Date.now() + 60000,
  }),
})

export const RateLimiter = class RateLimiter {
  constructor(options: any) {
    this.options = options
  }
  
  async check(key: string) {
    return checkRateLimit(key)
  }
  
  async reset(key: string) {
    return Promise.resolve()
  }
  
  getStats(key: string) {
    return {
      total: 0,
      remaining: 10,
      resetTime: Date.now() + 60000,
    }
  }
}
