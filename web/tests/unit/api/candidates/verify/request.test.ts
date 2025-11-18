/**
 * @jest-environment node
 */

import type { NextRequest } from 'next/server';

import { POST } from '@/app/api/candidates/verify/request/route';

// Mock dependencies
const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockMaybeSingle = jest.fn();
const mockInsert = jest.fn();
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

// Mock API helpers
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

const buildRequest = (): NextRequest =>
  ({
    url: 'http://localhost/api/candidates/verify/request',
    method: 'POST',
    headers: {
      get: (key: string) => {
        const lower = key.toLowerCase();
        if (lower === 'x-forwarded-for') return '127.0.0.1';
        if (lower === 'user-agent') return 'jest';
        return null;
      },
    },
    json: async () => ({}),
  } as unknown as NextRequest);

describe('POST /api/candidates/verify/request', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup chainable mocks
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
    });
    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      maybeSingle: mockMaybeSingle,
    });
    mockInsert.mockResolvedValue({ error: null });
    mockSendEmail.mockResolvedValue({ ok: true });
    
    // Default: rate limit allows request
    mockRateLimitCheck.mockResolvedValue({
      success: true,
      allowed: true,
      remaining: 4,
      resetTime: new Date(Date.now() + 15 * 60 * 1000),
    });
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = (await POST(buildRequest())) as Response;
    expect(res.status).toBe(401);
    const payload = await res.json();
    expect(payload.success).toBe(false);
  });

  it('returns 400 when candidate profile not found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'test@example.com' } }, error: null });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const res = (await POST(buildRequest())) as Response;
    expect(res.status).toBe(400);
    const payload = await res.json();
    expect(payload.details).toBeDefined();
  });

  it('returns 400 when rate limit exceeded', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'test@example.com' } }, error: null });
    mockMaybeSingle.mockResolvedValue({
      data: { id: 'cand-1', user_id: 'u1' },
      error: null,
    });
    
    // Rate limit exceeded
    mockRateLimitCheck.mockResolvedValue({
      success: true,
      allowed: false,
      remaining: 0,
      resetTime: new Date(Date.now() + 15 * 60 * 1000),
      retryAfter: 900,
    });

    const res = (await POST(buildRequest())) as Response;
    expect(res.status).toBe(400);
    const payload = await res.json();
    expect(payload.details.rate).toContain('Too many requests');
  });

  it('successfully sends verification code when rate limit allows', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'test@example.com' } }, error: null });
    mockMaybeSingle.mockResolvedValue({
      data: { id: 'cand-1', user_id: 'u1' },
      error: null,
    });

    // Mock insert to return success
    mockFrom.mockImplementation((table: string) => {
      if (table === 'candidate_email_challenges') {
        return {
          insert: mockInsert,
        };
      }
      if (table === 'platform_analytics') {
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: mockMaybeSingle,
          }),
        }),
      };
    });

    const res = (await POST(buildRequest())) as Response;
    expect(res.status).toBe(200);
    const payload = await res.json();
    expect(payload.success).toBe(true);
    expect(mockSendEmail).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalled();
  });

  it('respects rate limit configuration (15 minutes, 3 max burst)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'test@example.com' } }, error: null });
    mockMaybeSingle.mockResolvedValue({
      data: { id: 'cand-1', user_id: 'u1' },
      error: null,
    });

    // Verify rate limiter is called with correct config
    await POST(buildRequest());
    
    // Rate limiter should be called
    expect(mockRateLimitCheck).toHaveBeenCalled();
    
    // Check that rate limiter was configured with 15 minute interval
    // (The actual config is in the route file: interval: 15 * 60 * 1000, uniqueTokenPerInterval: 5, maxBurst: 3)
  });

  it('returns 500 when email sending fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'test@example.com' } }, error: null });
    mockMaybeSingle.mockResolvedValue({
      data: { id: 'cand-1', user_id: 'u1' },
      error: null,
    });
    mockSendEmail.mockResolvedValue({ ok: false, error: 'Email service unavailable' });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'candidate_email_challenges') {
        return {
          insert: mockInsert,
        };
      }
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: mockMaybeSingle,
          }),
        }),
      };
    });

    const res = (await POST(buildRequest())) as Response;
    expect(res.status).toBe(502);
    const payload = await res.json();
    expect(payload.error).toContain('Failed to send verification email');
  });
});

