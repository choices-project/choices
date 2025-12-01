/**
 * Additional edge case tests for candidate verification
 * Tests specific edge cases and boundary conditions
 */

import type { NextRequest } from 'next/server';

import { POST } from '@/app/api/candidates/verify/confirm/route';

const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockMaybeSingle = jest.fn();

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

jest.mock('@/lib/core/security/rate-limit', () => {
  const mockRateLimitCheck = jest.fn();
  return {
    __esModule: true,
    createRateLimiter: jest.fn(() => ({
      check: mockRateLimitCheck,
    })),
    rateLimitMiddleware: jest.fn(async (req, limiter) => limiter.check(req)),
    mockRateLimitCheck,
  };
});

const { mockRateLimitCheck } = jest.requireMock('@/lib/core/security/rate-limit');

jest.mock('@/lib/api', () => {
  const createResponse = (status: number, payload: unknown) => ({
    status,
    json: async () => payload,
  });
  return {
    __esModule: true,
    withErrorHandling:
      (handler: any) =>
      (...args: any[]) =>
        handler(...args),
    successResponse: (data: unknown) => createResponse(200, { success: true, data }),
    validationError: (details: unknown) => createResponse(400, { success: false, details }),
    errorResponse: (message: string, status = 500) => createResponse(status, { success: false, error: message }),
  };
});

const buildRequest = (body?: any): NextRequest =>
  ({
    url: 'http://localhost/api/candidates/verify/confirm',
    method: 'POST',
    headers: {
      get: (key: string) => {
        const lower = key.toLowerCase();
        if (lower === 'x-forwarded-for') return '127.0.0.1';
        return null;
      },
    },
    json: async () => body || {},
  } as unknown as NextRequest);

describe('Candidate Verification Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimitCheck.mockResolvedValue({
      success: true,
      allowed: true,
      remaining: 9,
      resetTime: new Date(Date.now() + 15 * 60 * 1000),
    });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'test@example.com' } }, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'candidate_email_challenges') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  maybeSingle: mockMaybeSingle,
                }),
              }),
            }),
          }),
          update: () => ({
            eq: () => ({ error: null }),
          }),
        };
      }
      if (table === 'candidate_profiles') {
        return {
          update: () => ({
            eq: () => ({ error: null }),
          }),
        };
      }
      if (table === 'representatives_core') {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: mockMaybeSingle }),
            ilike: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
          }),
        };
      }
      if (table === 'official_email_fast_track') {
        return {
          select: () => ({
            or: () => ({ limit: () => ({ maybeSingle: mockMaybeSingle }) }),
          }),
        };
      }
      return {
        select: () => ({ eq: () => ({ maybeSingle: mockMaybeSingle }) }),
      };
    });
  });

  describe('Expiration Edge Cases', () => {
    it('should handle code expired exactly 1 minute ago', async () => {
      const expiredTime = new Date(Date.now() - 1 * 60 * 1000).toISOString();
      mockMaybeSingle.mockResolvedValue({
        data: {
          id: 'challenge-1',
          code: '123456',
          expires_at: expiredTime,
          used_at: null,
          failed_attempts: 0,
        },
        error: null,
      });

      const res = (await POST(buildRequest({ code: '123456' }))) as Response;
      expect(res.status).toBe(400);
      const payload = await res.json();
      expect(payload.details.expired).toBe(true);
      expect(payload.details.code).toContain('1 minute');
    });

    it('should handle code expired exactly at expiration time', async () => {
      const expiredTime = new Date(Date.now() - 100).toISOString(); // Just expired
      mockMaybeSingle.mockResolvedValue({
        data: {
          id: 'challenge-1',
          code: '123456',
          expires_at: expiredTime,
          used_at: null,
          failed_attempts: 0,
        },
        error: null,
      });

      const res = (await POST(buildRequest({ code: '123456' }))) as Response;
      expect(res.status).toBe(400);
      const payload = await res.json();
      expect(payload.details.expired).toBe(true);
    });

    it('should handle code expiring in the future (valid)', async () => {
      const futureTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      let callCount = 0;
      mockMaybeSingle.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            data: {
              id: 'challenge-1',
              candidate_id: 'cand-1',
              user_id: 'u1',
              email: 'test@example.com',
              code: '123456',
              expires_at: futureTime,
              used_at: null,
              failed_attempts: 0,
            },
            error: null,
          });
        }
        // Subsequent calls for representative lookup
        return Promise.resolve({ data: null, error: null });
      });

      const res = (await POST(buildRequest({ code: '123456' }))) as Response;
      // Should succeed with correct code
      expect(res.status).toBe(200);
      const payload = await res.json();
      expect(payload.success).toBe(true);
    });
  });

  describe('Attempt Limit Edge Cases', () => {
    it('should handle exactly 5 failed attempts (boundary)', async () => {
      const futureTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      mockMaybeSingle.mockResolvedValue({
        data: {
          id: 'challenge-1',
          code: '123456',
          expires_at: futureTime,
          used_at: null,
          failed_attempts: 5, // Exactly at limit
        },
        error: null,
      });

      const res = (await POST(buildRequest({ code: '999999' }))) as Response;
      expect(res.status).toBe(400);
      const payload = await res.json();
      expect(payload.details.locked).toBe(true);
      expect(payload.details.attemptsRemaining).toBe(0);
    });

    it('should handle 4 failed attempts (one remaining)', async () => {
      const futureTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      mockMaybeSingle.mockResolvedValue({
        data: {
          id: 'challenge-1',
          code: '123456',
          expires_at: futureTime,
          used_at: null,
          failed_attempts: 4,
        },
        error: null,
      });

      const res = (await POST(buildRequest({ code: '999999' }))) as Response;
      expect(res.status).toBe(400);
      const payload = await res.json();
      expect(payload.details.locked).toBe(true);
      expect(payload.details.attemptsRemaining).toBe(0);
    });

    it('should handle 0 failed attempts (first attempt)', async () => {
      const futureTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      mockMaybeSingle.mockResolvedValue({
        data: {
          id: 'challenge-1',
          code: '123456',
          expires_at: futureTime,
          used_at: null,
          failed_attempts: 0,
        },
        error: null,
      });

      const res = (await POST(buildRequest({ code: '999999' }))) as Response;
      expect(res.status).toBe(400);
      const payload = await res.json();
      expect(payload.details.invalid).toBe(true);
      expect(payload.details.attemptsRemaining).toBe(4); // 5 - 1 = 4
    });

    it('should handle null failed_attempts (defaults to 0)', async () => {
      const futureTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      mockMaybeSingle.mockResolvedValue({
        data: {
          id: 'challenge-1',
          code: '123456',
          expires_at: futureTime,
          used_at: null,
          failed_attempts: null, // Should default to 0
        },
        error: null,
      });

      const res = (await POST(buildRequest({ code: '999999' }))) as Response;
      expect(res.status).toBe(400);
      const payload = await res.json();
      expect(payload.details.invalid).toBe(true);
      expect(payload.details.attemptsRemaining).toBe(4);
    });
  });

  describe('Code Validation Edge Cases', () => {
    it('should handle empty code string', async () => {
      const res = (await POST(buildRequest({ code: '' }))) as Response;
      expect(res.status).toBe(400);
      const payload = await res.json();
      expect(payload.details.code).toBe('Code is required');
    });

    it('should handle whitespace-only code', async () => {
      const res = (await POST(buildRequest({ code: '   ' }))) as Response;
      expect(res.status).toBe(400);
      const payload = await res.json();
      expect(payload.details.code).toBe('Code is required');
    });

    it('should handle code with leading/trailing whitespace', async () => {
      const futureTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      let callCount = 0;
      mockMaybeSingle.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            data: {
              id: 'challenge-1',
              candidate_id: 'cand-1',
              user_id: 'u1',
              email: 'test@example.com',
              code: '123456',
              expires_at: futureTime,
              used_at: null,
              failed_attempts: 0,
            },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      // Code should be trimmed before comparison - trimmed code matches, so should succeed
      const res = (await POST(buildRequest({ code: '  123456  ' }))) as Response;
      // Should succeed because trimmed code matches
      expect(res.status).toBe(200);
      const payload = await res.json();
      expect(payload.success).toBe(true);
    });

    it('should handle code with wrong length', async () => {
      const futureTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      mockMaybeSingle.mockResolvedValue({
        data: {
          id: 'challenge-1',
          code: '123456',
          expires_at: futureTime,
          used_at: null,
          failed_attempts: 0,
        },
        error: null,
      });

      // Code too short (5 digits) - should still validate but fail on mismatch
      const res1 = (await POST(buildRequest({ code: '12345' }))) as Response;
      expect(res1.status).toBe(400);
      const payload1 = await res1.json();
      // Code is not empty, so it will try to validate and fail
      expect(payload1.details).toBeDefined();

      // Code too long (7 digits) - should validate but fail on mismatch
      const res2 = (await POST(buildRequest({ code: '1234567' }))) as Response;
      expect(res2.status).toBe(400);
      const payload2 = await res2.json();
      expect(payload2.details.invalid).toBe(true);
    });
  });

  describe('Already Used Edge Cases', () => {
    it('should handle code that was just used', async () => {
      const futureTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const usedTime = new Date().toISOString();
      mockMaybeSingle.mockResolvedValue({
        data: {
          id: 'challenge-1',
          code: '123456',
          expires_at: futureTime,
          used_at: usedTime, // Just used
          failed_attempts: 0,
        },
        error: null,
      });

      const res = (await POST(buildRequest({ code: '123456' }))) as Response;
      expect(res.status).toBe(400);
      const payload = await res.json();
      expect(payload.details.alreadyUsed).toBe(true);
      expect(payload.details.code).toContain('already been used');
    });
  });

  describe('Rate Limiting Edge Cases', () => {
    it('should handle rate limit exactly at threshold', async () => {
      mockRateLimitCheck.mockResolvedValue({
        success: true,
        allowed: true,
        remaining: 0, // Last allowed request
        resetTime: new Date(Date.now() + 15 * 60 * 1000),
      });

      const futureTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      mockMaybeSingle.mockResolvedValue({
        data: {
          id: 'challenge-1',
          candidate_id: 'cand-1',
          user_id: 'u1',
          email: 'test@example.com',
          code: '123456',
          expires_at: futureTime,
          used_at: null,
          failed_attempts: 0,
        },
        error: null,
      });

      // Should still allow this request (rate limit passes)
      // Use wrong code to test that rate limit doesn't block
      const res = (await POST(buildRequest({ code: '999999' }))) as Response;
      // Will fail on code validation, but rate limit should pass
      expect(res.status).toBe(400);
      const payload = await res.json();
      expect(payload.details.code).not.toContain('Too many verification attempts');
      expect(payload.details.invalid).toBe(true);
    });

    it('should handle rate limit exceeded', async () => {
      mockRateLimitCheck.mockResolvedValue({
        success: true,
        allowed: false,
        remaining: 0,
        resetTime: new Date(Date.now() + 15 * 60 * 1000),
      });

      const res = (await POST(buildRequest({ code: '123456' }))) as Response;
      expect(res.status).toBe(400);
      const payload = await res.json();
      expect(payload.details.code).toContain('Too many verification attempts');
    });
  });
});

