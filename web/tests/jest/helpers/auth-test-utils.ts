// Mock auth utilities for testing
import { jest } from '@jest/globals';

export const getUser = (jest.fn() as any).mockResolvedValue({
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  },
  error: null,
})

export const requireAuth = jest.fn().mockImplementation((handler: any) => {
  return async (req: any, res: any) => {
    const user = await getUser()
    if (!user.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    return handler(req, res)
  }
})

export const checkPermissions = (jest.fn() as any).mockResolvedValue(true)

export const validateSession = (jest.fn() as any).mockResolvedValue({
  valid: true,
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
  },
})

// Mock context creator
export const createAuthMockContext = jest.fn().mockReturnValue({
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  },
  session: {
    id: 'test-session-id',
    userId: 'test-user-id',
    expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
  },
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0 (Test Browser)',
  headers: {
    'x-forwarded-for': '192.168.1.1',
    'user-agent': 'Mozilla/5.0 (Test Browser)',
  },
})

// Mock rate limiting
export const mockRateLimiting = (jest.fn() as any).mockResolvedValue({
  allowed: true,
  remaining: 10,
  resetTime: Date.now() + 60000,
})

// Mock CSRF protection
export const mockCSRFProtection = (jest.fn() as any).mockResolvedValue({
  valid: true,
  token: 'test-csrf-token',
})

// Mock secure server action creator
export const createSecureServerAction = jest.fn().mockImplementation((handler: any, options: any) => {
  return async (data: any, context: any) => {
    // Mock authentication check
    if (options?.requireAuth && !context?.user) {
      throw new Error('Authentication required')
    }
    
    // Mock rate limiting check
    if (options?.rateLimit) {
      const rateLimitResult = await mockRateLimiting()
      if (!rateLimitResult.allowed) {
        throw new Error('Rate limit exceeded')
      }
    }
    
    // Mock CSRF protection check
    if (options?.csrfProtection) {
      const csrfResult = await mockCSRFProtection()
      if (!csrfResult.valid) {
        throw new Error('CSRF token validation failed')
      }
    }
    
    // Mock missing context check
    if (!context) {
      throw new Error('Server action context is required')
    }
    
    // Mock invalid input check
    if (!data) {
      throw new Error('Invalid input')
    }
    
    return await handler(data, context)
  }
})