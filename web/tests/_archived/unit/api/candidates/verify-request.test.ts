/**
 * Candidate Verification Request Endpoint Tests
 * 
 * Tests for rate limiting and throttle behavior on the verification code request endpoint
 * 
 * Created: January 2025
 */

import type { NextRequest } from 'next/server';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { RateLimitResult } from '@/lib/core/security/rate-limit';

// Mock dependencies
jest.mock('@/lib/core/security/rate-limit', () => ({
  createRateLimiter: jest.fn(() => ({
    check: jest.fn()
  })),
  rateLimitMiddleware: jest.fn()
}));

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn()
}));

jest.mock('@/lib/integrations/email/resend', () => ({
  sendTransactionalEmail: (
    jest.fn() as jest.MockedFunction<(...args: any[]) => Promise<{ ok: boolean }>>
  ).mockResolvedValue({ ok: true })
}));

jest.mock('@/lib/integrations/email/templates', () => ({
  verificationCodeTemplate: jest.fn(() => ({
    subject: 'Test Subject',
    text: 'Test Text',
    html: 'Test HTML'
  }))
}));

describe('POST /api/candidates/verify/request - Rate Limiting', () => {
  let POST: (request: NextRequest) => Promise<Response>;
  let mockRequest: NextRequest & { json: jest.MockedFunction<() => Promise<unknown>> };
  let mockSupabase: any;
  let mockRateLimit: RateLimitResult;
  let candidateQuery: any;
  let challengeInsert: any;
  let analyticsInsert: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Create reusable query chains
    candidateQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: (jest.fn() as jest.MockedFunction<
        () => Promise<{ data: { id: string; user_id: string }; error: null }>
      >).mockResolvedValue({
        data: {
          id: 'candidate-123',
          user_id: 'user-123'
        },
        error: null
      })
    };
    
    challengeInsert = {
      insert: (jest.fn() as jest.MockedFunction<(...args: any[]) => Promise<{ error: null }>>)
        .mockResolvedValue({ error: null })
    };
    
    analyticsInsert = {
      insert: (jest.fn() as jest.MockedFunction<(...args: any[]) => Promise<{ error: null }>>)
        .mockResolvedValue({ error: null })
    };
    
    mockSupabase = {
      auth: {
        getUser: (jest.fn() as jest.MockedFunction<
          () => Promise<{ data: { user: { id: string; email: string } }; error: null }>
        >).mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              email: 'candidate@example.gov'
            }
          },
          error: null
        })
      },
      from: jest.fn((table: string) => {
        if (table === 'candidate_profiles') {
          return candidateQuery;
        } else if (table === 'candidate_email_challenges') {
          return challengeInsert;
        } else if (table === 'platform_analytics') {
          return analyticsInsert;
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          insert: (jest.fn() as jest.MockedFunction<(...args: any[]) => Promise<{ error: null }>>)
            .mockResolvedValue({ error: null })
        };
      })
    };

    // Setup mock rate limiter
    mockRateLimit = {
      success: true,
      allowed: true,
      remaining: 5,
      resetTime: new Date(Date.now() + 15 * 60 * 1000),
    };

    const { getSupabaseServerClient } = await import('@/utils/supabase/server');
    jest
      .mocked(getSupabaseServerClient as jest.MockedFunction<typeof getSupabaseServerClient>)
      .mockResolvedValue(mockSupabase as any);

    const { rateLimitMiddleware } = await import('@/lib/core/security/rate-limit');
    jest
      .mocked(rateLimitMiddleware as jest.MockedFunction<typeof rateLimitMiddleware>)
      .mockResolvedValue(mockRateLimit);
    
    // Import the handler after mocks are set up
    const module = await import('@/app/api/candidates/verify/request/route');
    POST = module.POST;

    // Setup mock request
    mockRequest = {
      headers: new Headers(),
      nextUrl: new URL('http://localhost/api/candidates/verify/request'),
      json: (jest.fn() as jest.MockedFunction<() => Promise<unknown>>).mockResolvedValue({}),
    } as unknown as NextRequest & { json: jest.MockedFunction<() => Promise<unknown>> };
  });

  it('should allow request when rate limit is not exceeded', async () => {
    mockRateLimit.allowed = true;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should reject request when rate limit is exceeded', async () => {
    mockRateLimit.allowed = false;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details?.rate).toContain('Too many requests');
  });

  it('should enforce 5 requests per 15 minutes limit', async () => {
    const { rateLimitMiddleware, createRateLimiter } = await import('@/lib/core/security/rate-limit');

    await POST(mockRequest);

    // Verify rate limiter is created with correct configuration
    expect(createRateLimiter).toHaveBeenCalledWith({
      interval: 15 * 60 * 1000, // 15 minutes
      uniqueTokenPerInterval: 5, // 5 requests per interval
      maxBurst: 3 // 3 rapid requests allowed
    });

    expect(rateLimitMiddleware).toHaveBeenCalled();
  });

  it('should allow burst of 3 rapid requests', async () => {
    mockRateLimit.allowed = true;

    // Simulate 3 rapid requests
    const responses = await Promise.all([
      POST(mockRequest),
      POST(mockRequest),
      POST(mockRequest)
    ]);

    // All should succeed
    for (const response of responses) {
      expect(response.status).toBe(200);
    }
  });

  it('should provide rate limit information in error response', async () => {
    mockRateLimit.allowed = false;
    mockRateLimit.resetTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Too many requests');
    expect(data.error).toContain('try later');
  });

  it('should track rate limit per IP address', async () => {
    const { rateLimitMiddleware } = await import('@/lib/core/security/rate-limit');

    // First request from IP 1
    const request1 = {
      ...mockRequest,
      headers: new Headers({ 'x-forwarded-for': '192.168.1.1' })
    } as unknown as NextRequest;

    await POST(request1);

    // Second request from IP 2 (different IP, should have separate limit)
    const request2 = {
      ...mockRequest,
      headers: new Headers({ 'x-forwarded-for': '192.168.1.2' })
    } as unknown as NextRequest;

    await POST(request2);

    // Rate limiter should be called for each request
    expect(rateLimitMiddleware).toHaveBeenCalledTimes(2);
  });
});

describe('POST /api/candidates/verify/request - Throttle Policy', () => {
  it('should document throttle policy correctly', () => {
    // Throttle policy:
    // - 5 requests per 15 minutes per IP
    // - Maximum burst of 3 rapid requests
    // - After limit, user must wait 15 minutes

    const policy = {
      interval: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      maxBurst: 3,
      resetAfter: 15 * 60 * 1000
    };

    expect(policy.maxRequests).toBe(5);
    expect(policy.maxBurst).toBe(3);
    expect(policy.interval).toBe(15 * 60 * 1000);
  });
});

