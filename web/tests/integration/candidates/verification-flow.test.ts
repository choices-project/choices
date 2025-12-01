/**
 * Integration tests for candidate verification flow
 * Tests the complete flow from requesting a code to confirming it
 */

import type { NextRequest } from 'next/server';

import { POST as confirmPOST } from '@/app/api/candidates/verify/confirm/route';
import { POST as requestPOST } from '@/app/api/candidates/verify/request/route';

// Mock Supabase
const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockLimit = jest.fn();
const mockMaybeSingle = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockRateLimitCheck = jest.fn();
const mockSendEmail = jest.fn();

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

jest.mock('@/lib/core/security/rate-limit', () => ({
  createRateLimiter: jest.fn(() => ({
    check: mockRateLimitCheck,
  })),
  rateLimitMiddleware: jest.fn(async (req, limiter) => {
    const result = await limiter.check(req);
    return result;
  }),
}));

jest.mock('@/lib/integrations/email/resend', () => ({
  sendTransactionalEmail: jest.fn((...args) => mockSendEmail(...args)),
}));

jest.mock('@/lib/integrations/email/templates', () => ({
  verificationCodeTemplate: jest.fn((code: string) => ({
    subject: `Your verification code: ${code}`,
    text: `Your code is ${code}`,
    html: `<p>Your code is ${code}</p>`,
  })),
}));

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
    successResponse: (data: unknown, _meta?: unknown, status = 200) =>
      createResponse(status, { success: true, data }),
    validationError: (details: unknown, message?: string) =>
      createResponse(400, { success: false, error: message ?? 'Validation error', details }),
    errorResponse: (message: string, status = 500) =>
      createResponse(status, { success: false, error: message }),
  };
});

const buildRequest = (body?: any, path = '/api/candidates/verify/request'): NextRequest =>
  ({
    url: `http://localhost${path}`,
    method: 'POST',
    headers: {
      get: (key: string) => {
        const lower = key.toLowerCase();
        if (lower === 'x-forwarded-for') return '127.0.0.1';
        if (lower === 'user-agent') return 'jest';
        return null;
      },
    },
    json: async () => body || {},
  } as unknown as NextRequest);

describe('Candidate Verification Flow Integration', () => {
  const testUser = { id: 'user-1', email: 'candidate@example.gov' };
  const testCandidate = { id: 'cand-1', user_id: 'user-1' };
  let generatedCode: string;
  let challengeId: string;

  beforeEach(() => {
    jest.clearAllMocks();
    generatedCode = '123456';
    challengeId = 'challenge-1';

    // Default: rate limit allows
    mockRateLimitCheck.mockResolvedValue({
      success: true,
      allowed: true,
      remaining: 9,
      resetTime: new Date(Date.now() + 15 * 60 * 1000),
    });

    mockGetUser.mockResolvedValue({ data: { user: testUser }, error: null });
    mockSendEmail.mockResolvedValue({ ok: true });

    // Setup Supabase mocks
    mockFrom.mockImplementation((table: string) => {
      if (table === 'candidate_profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: mockMaybeSingle,
            }),
          }),
        };
      }
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
          insert: mockInsert,
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
      if (table === 'platform_analytics') {
        return {
          insert: () => Promise.resolve({ error: null }),
        };
      }
      return {
        select: () => ({ eq: () => ({ maybeSingle: mockMaybeSingle }) }),
      };
    });
  });

  describe('Complete Verification Flow', () => {
    it('should successfully complete full verification flow: request -> confirm', async () => {
      // Step 1: Request verification code
      mockMaybeSingle.mockResolvedValueOnce({
        data: testCandidate,
        error: null,
      });

      mockInsert.mockResolvedValueOnce({ error: null });

      const requestRes = (await requestPOST(buildRequest({}, '/api/candidates/verify/request'))) as Response;
      expect(requestRes.status).toBe(200);
      const requestPayload = await requestRes.json();
      expect(requestPayload.success).toBe(true);
      expect(mockSendEmail).toHaveBeenCalled();

      // Step 2: Confirm verification code
      const futureTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      let callCount = 0;
      mockMaybeSingle.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: return challenge
          return Promise.resolve({
            data: {
              id: challengeId,
              candidate_id: testCandidate.id,
              user_id: testUser.id,
              email: testUser.email,
              code: generatedCode,
              expires_at: futureTime,
              used_at: null,
              failed_attempts: 0,
            },
            error: null,
          });
        }
        // Subsequent calls: no representative found
        return Promise.resolve({ data: null, error: null });
      });

      const confirmRes = (await confirmPOST(
        buildRequest({ code: generatedCode }, '/api/candidates/verify/confirm'),
      )) as Response;
      expect(confirmRes.status).toBe(200);
      const confirmPayload = await confirmRes.json();
      expect(confirmPayload.success).toBe(true);
      expect(confirmPayload.data.ok).toBe(true);
    });

    it('should handle expired code in verification flow', async () => {
      // Request code
      mockMaybeSingle.mockResolvedValueOnce({
        data: testCandidate,
        error: null,
      });
      mockInsert.mockResolvedValueOnce({ error: null });

      await requestPOST(buildRequest({}, '/api/candidates/verify/request'));

      // Try to confirm with expired code
      const expiredTime = new Date(Date.now() - 20 * 60 * 1000).toISOString();
      mockMaybeSingle.mockResolvedValueOnce({
        data: {
          id: challengeId,
          candidate_id: testCandidate.id,
          user_id: testUser.id,
          email: testUser.email,
          code: generatedCode,
          expires_at: expiredTime,
          used_at: null,
          failed_attempts: 0,
        },
        error: null,
      });

      const confirmRes = (await confirmPOST(
        buildRequest({ code: generatedCode }, '/api/candidates/verify/confirm'),
      )) as Response;
      expect(confirmRes.status).toBe(400);
      const payload = await confirmRes.json();
      expect(payload.details.expired).toBe(true);
      expect(payload.details.code).toContain('expired');
    });

    it('should handle wrong code with retry limit', async () => {
      // Request code
      mockMaybeSingle.mockResolvedValueOnce({
        data: testCandidate,
        error: null,
      });
      mockInsert.mockResolvedValueOnce({ error: null });

      await requestPOST(buildRequest({}, '/api/candidates/verify/request'));

      // Try wrong code multiple times
      const futureTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      let attemptCount = 0;

      mockMaybeSingle.mockImplementation(() => {
        attemptCount++;
        return Promise.resolve({
          data: {
            id: challengeId,
            candidate_id: testCandidate.id,
            user_id: testUser.id,
            email: testUser.email,
            code: generatedCode,
            expires_at: futureTime,
            used_at: null,
            failed_attempts: attemptCount - 1, // Previous attempts
          },
          error: null,
        });
      });

      // First wrong attempt
      const res1 = (await confirmPOST(
        buildRequest({ code: '999999' }, '/api/candidates/verify/confirm'),
      )) as Response;
      expect(res1.status).toBe(400);
      const payload1 = await res1.json();
      expect(payload1.details.invalid).toBe(true);
      expect(payload1.details.attemptsRemaining).toBe(4);

      // Second wrong attempt
      const res2 = (await confirmPOST(
        buildRequest({ code: '999999' }, '/api/candidates/verify/confirm'),
      )) as Response;
      expect(res2.status).toBe(400);
      const payload2 = await res2.json();
      expect(payload2.details.attemptsRemaining).toBe(3);

      // After 5 attempts, code should be locked
      attemptCount = 5;
      mockMaybeSingle.mockResolvedValueOnce({
        data: {
          id: challengeId,
          candidate_id: testCandidate.id,
          user_id: testUser.id,
          email: testUser.email,
          code: generatedCode,
          expires_at: futureTime,
          used_at: null,
          failed_attempts: 5,
        },
        error: null,
      });

      const res3 = (await confirmPOST(
        buildRequest({ code: '999999' }, '/api/candidates/verify/confirm'),
      )) as Response;
      expect(res3.status).toBe(400);
      const payload3 = await res3.json();
      expect(payload3.details.locked).toBe(true);
      expect(payload3.details.attemptsRemaining).toBe(0);
    });

    it('should handle rate limiting on request endpoint', async () => {
      // First 5 requests should succeed
      mockMaybeSingle.mockResolvedValue({
        data: testCandidate,
        error: null,
      });
      mockInsert.mockResolvedValue({ error: null });

      for (let i = 0; i < 5; i++) {
        const res = (await requestPOST(buildRequest({}, '/api/candidates/verify/request'))) as Response;
        expect(res.status).toBe(200);
      }

      // 6th request should be rate limited
      mockRateLimitCheck.mockResolvedValueOnce({
        success: true,
        allowed: false,
        remaining: 0,
        resetTime: new Date(Date.now() + 15 * 60 * 1000),
      });

      const res = (await requestPOST(buildRequest({}, '/api/candidates/verify/request'))) as Response;
      expect(res.status).toBe(400);
      const payload = await res.json();
      expect(payload.details.rate).toContain('Too many requests');
    });

    it('should handle rate limiting on confirm endpoint', async () => {
      const futureTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      mockMaybeSingle.mockResolvedValue({
        data: {
          id: challengeId,
          candidate_id: testCandidate.id,
          user_id: testUser.id,
          email: testUser.email,
          code: generatedCode,
          expires_at: futureTime,
          used_at: null,
          failed_attempts: 0,
        },
        error: null,
      });

      // Make 10 successful attempts
      for (let i = 0; i < 10; i++) {
        const res = (await confirmPOST(
          buildRequest({ code: generatedCode }, '/api/candidates/verify/confirm'),
        )) as Response;
        // First one might succeed, others will fail for various reasons
      }

      // 11th attempt should be rate limited
      mockRateLimitCheck.mockResolvedValueOnce({
        success: true,
        allowed: false,
        remaining: 0,
        resetTime: new Date(Date.now() + 15 * 60 * 1000),
      });

      const res = (await confirmPOST(
        buildRequest({ code: generatedCode }, '/api/candidates/verify/confirm'),
      )) as Response;
      expect(res.status).toBe(400);
      const payload = await res.json();
      expect(payload.details.code).toContain('Too many verification attempts');
    });
  });
});

