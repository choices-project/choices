/**
 * Rate Limiting in Server Actions Tests
 *
 * Tests for the enhanced checkRateLimit function that now actually enforces rate limits
 *
 * Created: 2025-01-16
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { checkRateLimit } from '@/lib/core/auth/server-actions';
import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter';
import { getSecurityConfig } from '@/lib/core/security/config';

// Mock server-only to allow testing
jest.mock('server-only', () => ({}));

// Mock dependencies
jest.mock('@/lib/rate-limiting/api-rate-limiter', () => ({
  apiRateLimiter: {
    checkLimit: jest.fn()
  }
}));

jest.mock('@/lib/core/security/config', () => ({
  getSecurityConfig: jest.fn()
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn()
  }))
}));

describe('checkRateLimit', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (getSecurityConfig as jest.MockedFunction<typeof getSecurityConfig>).mockReturnValue({
      rateLimit: {
        maxRequests: 100,
        windowMs: 15 * 60 * 1000, // 15 minutes
        sensitiveEndpoints: {
          '/api/auth/register': 5,
          '/api/auth/login': 10
        }
      }
    } as any);
  });

  it('should use apiRateLimiter to check limits', async () => {
    const mockCheckLimit = apiRateLimiter.checkLimit as jest.MockedFunction<typeof apiRateLimiter.checkLimit>;
    mockCheckLimit.mockResolvedValue({
      allowed: true,
      remaining: 99,
      totalHits: 1,
      retryAfter: null
    });

    const result = await checkRateLimit('/api/test', undefined, '192.168.1.1');

    expect(mockCheckLimit).toHaveBeenCalledWith(
      '192.168.1.1',
      '/api/test',
      {
        maxRequests: 100,
        windowMs: 15 * 60 * 1000
      }
    );
    expect(result).toBe(true);
  });

  it('should use userId when provided', async () => {
    const mockCheckLimit = apiRateLimiter.checkLimit as jest.MockedFunction<typeof apiRateLimiter.checkLimit>;
    mockCheckLimit.mockResolvedValue({
      allowed: true,
      remaining: 50,
      totalHits: 50,
      retryAfter: null
    });

    const result = await checkRateLimit('/api/test', 'user-123', '192.168.1.1');

    expect(mockCheckLimit).toHaveBeenCalledWith(
      'user-123',
      '/api/test',
      expect.objectContaining({
        maxRequests: 100,
        windowMs: 15 * 60 * 1000
      })
    );
    expect(result).toBe(true);
  });

  it('should use sensitive endpoint limits when configured', async () => {
    const mockCheckLimit = apiRateLimiter.checkLimit as jest.MockedFunction<typeof apiRateLimiter.checkLimit>;
    mockCheckLimit.mockResolvedValue({
      allowed: true,
      remaining: 4,
      totalHits: 1,
      retryAfter: null
    });

    const result = await checkRateLimit('/api/auth/register', undefined, '192.168.1.1');

    expect(mockCheckLimit).toHaveBeenCalledWith(
      '192.168.1.1',
      '/api/auth/register',
      {
        maxRequests: 5, // Sensitive endpoint limit
        windowMs: 15 * 60 * 1000
      }
    );
    expect(result).toBe(true);
  });

  it('should return false when rate limit is exceeded', async () => {
    const mockCheckLimit = apiRateLimiter.checkLimit as jest.MockedFunction<typeof apiRateLimiter.checkLimit>;
    mockCheckLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      totalHits: 100,
      retryAfter: 60
    });

    const result = await checkRateLimit('/api/test', undefined, '192.168.1.1');

    expect(result).toBe(false);
  });

  it('should use default windowMs when not configured', async () => {
    (getSecurityConfig as jest.MockedFunction<typeof getSecurityConfig>).mockReturnValue({
      rateLimit: {
        maxRequests: 50,
        sensitiveEndpoints: {}
      }
    } as any);

    const mockCheckLimit = apiRateLimiter.checkLimit as jest.MockedFunction<typeof apiRateLimiter.checkLimit>;
    mockCheckLimit.mockResolvedValue({
      allowed: true,
      remaining: 49,
      totalHits: 1,
      retryAfter: null
    });

    await checkRateLimit('/api/test', undefined, '192.168.1.1');

    expect(mockCheckLimit).toHaveBeenCalledWith(
      '192.168.1.1',
      '/api/test',
      {
        maxRequests: 50,
        windowMs: 15 * 60 * 1000 // Default 15 minutes
      }
    );
  });

  it('should fail open and return true on error', async () => {
    const mockCheckLimit = apiRateLimiter.checkLimit as jest.MockedFunction<typeof apiRateLimiter.checkLimit>;
    mockCheckLimit.mockRejectedValue(new Error('Rate limiter error'));

    const result = await checkRateLimit('/api/test', undefined, '192.168.1.1');

    expect(result).toBe(true); // Fail open for availability
  });

  it('should use "unknown" key when neither userId nor ipAddress provided', async () => {
    const mockCheckLimit = apiRateLimiter.checkLimit as jest.MockedFunction<typeof apiRateLimiter.checkLimit>;
    mockCheckLimit.mockResolvedValue({
      allowed: true,
      remaining: 100,
      totalHits: 0,
      retryAfter: null
    });

    await checkRateLimit('/api/test');

    expect(mockCheckLimit).toHaveBeenCalledWith(
      'unknown',
      '/api/test',
      expect.objectContaining({
        maxRequests: 100
      })
    );
  });
});

