/**
 * @jest-environment node
 */

import type { NextRequest } from 'next/server';

import { POST } from '@/app/api/candidates/verify/confirm/route';

// Mock Supabase server client
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

// Mock the actual rate limiter used by the route
jest.mock('@/lib/rate-limiting/api-rate-limiter', () => ({
  apiRateLimiter: {
    checkLimit: jest.fn(),
  },
}));

// Get the mock function after the mock is set up
const mockApiRateLimiterModule = jest.requireMock('@/lib/rate-limiting/api-rate-limiter') as {
  apiRateLimiter: { checkLimit: jest.Mock };
};
const mockApiRateLimiterCheckLimit = mockApiRateLimiterModule.apiRateLimiter.checkLimit;

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
    validationError: (details: unknown, message?: string) => {
      // Convert boolean values to strings for consistency with validationError signature
      const normalizedDetails = typeof details === 'object' && details !== null
        ? Object.fromEntries(
            Object.entries(details as Record<string, unknown>).map(([k, v]) => [
              k,
              typeof v === 'boolean' ? String(v) : v,
            ])
          )
        : details;
      return createResponse(400, { success: false, error: message ?? 'Validation error', details: normalizedDetails });
    },
    errorResponse: (message: string, status = 500) =>
      createResponse(status, { success: false, error: message }),
    parseBody: async (request: any, schema?: any) => {
      const body = await request.json();
      if (schema) {
        try {
          const validated = schema.parse(body);
          return { success: true as const, data: validated };
        } catch (error: any) {
          const validationError = (details: unknown) => createResponse(400, { success: false, error: 'Validation error', details });
          return {
            success: false as const,
            error: validationError(
              error instanceof Error ? { _error: error.message } : { _error: 'Validation failed' }
            ),
          };
        }
      }
      return { success: true as const, data: body };
    },
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
        if (lower === 'user-agent') return 'jest';
        return null;
      },
    },
    json: async () => body || {},
  } as unknown as NextRequest);

describe('POST /api/candidates/verify/confirm', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: rate limit allows request
    mockRateLimitCheck.mockResolvedValue({
      success: true,
      allowed: true,
      remaining: 9,
      resetTime: new Date(Date.now() + 15 * 60 * 1000),
    });
    
    // Default: apiRateLimiter allows request
    mockApiRateLimiterCheckLimit.mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetTime: new Date(Date.now() + 15 * 60 * 1000),
    });

    // Setup chainable mocks
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
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: mockMaybeSingle,
          }),
          ilike: () => ({
            limit: () => ({ data: [], error: null }),
          }),
        }),
      };
    });
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = (await POST(buildRequest({ code: '123456' }))) as Response;
    expect(res.status).toBe(401);
    const payload = await res.json();
    expect(payload.success).toBe(false);
  });

  it('returns 400 when rate limit exceeded', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'test@example.com' } }, error: null });
    mockApiRateLimiterCheckLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetTime: new Date(Date.now() + 15 * 60 * 1000),
    });

    const res = (await POST(buildRequest({ code: '123456' }))) as Response;
    expect(res.status).toBe(400);
    const payload = await res.json();
    expect(payload.details.code).toContain('Too many verification attempts');
  });

  it('returns 400 when code is missing', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'test@example.com' } }, error: null });

    const res = (await POST(buildRequest({}))) as Response;
    expect(res.status).toBe(400);
    const payload = await res.json();
    expect(payload.details).toBeDefined();
    expect(payload.details.code).toBe('Code is required');
  });

  it('returns 400 when no challenge found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'test@example.com' } }, error: null });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const res = (await POST(buildRequest({ code: '123456' }))) as Response;
    expect(res.status).toBe(400);
    const payload = await res.json();
    expect(payload.details.code).toContain('Invalid or expired code');
  });

  it('returns 400 with expired flag when code is expired', async () => {
    const expiredTime = new Date(Date.now() - 20 * 60 * 1000).toISOString(); // 20 minutes ago
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'test@example.com' } }, error: null });
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: 'challenge-1',
        candidate_id: 'cand-1',
        user_id: 'u1',
        email: 'test@example.com',
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
    expect(payload.details.code).toContain('expired');
  });

  it('returns 400 with alreadyUsed flag when code was already used', async () => {
    const futureTime = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes from now
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'test@example.com' } }, error: null });
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: 'challenge-1',
        candidate_id: 'cand-1',
        user_id: 'u1',
        email: 'test@example.com',
        code: '123456',
        expires_at: futureTime,
        used_at: new Date().toISOString(),
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

  it('returns 400 with locked flag when max attempts exceeded', async () => {
    const futureTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'test@example.com' } }, error: null });
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: 'challenge-1',
        candidate_id: 'cand-1',
        user_id: 'u1',
        email: 'test@example.com',
        code: '123456',
        expires_at: futureTime,
        used_at: null,
        failed_attempts: 5, // Max attempts reached
      },
      error: null,
    });

    const res = (await POST(buildRequest({ code: '123456' }))) as Response;
    expect(res.status).toBe(400);
    const payload = await res.json();
    expect(payload.details.locked).toBe(true);
    expect(payload.details.code).toContain('locked');
  });

  it('returns 400 with attemptsRemaining when wrong code entered', async () => {
    const futureTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'test@example.com' } }, error: null });
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: 'challenge-1',
        candidate_id: 'cand-1',
        user_id: 'u1',
        email: 'test@example.com',
        code: '123456',
        expires_at: futureTime,
        used_at: null,
        failed_attempts: 2, // 2 previous failed attempts
      },
      error: null,
    });

    const res = (await POST(buildRequest({ code: '999999' }))) as Response; // Wrong code
    expect(res.status).toBe(400);
    const payload = await res.json();
    expect(payload.details.invalid).toBe(true);
    expect(payload.details.attemptsRemaining).toBe(2); // 5 - 3 = 2
    expect(payload.details.code).toContain('incorrect');
  });

  it('returns success when correct code is provided', async () => {
    const futureTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'test@example.com' } }, error: null });
    
    // Setup mock to return challenge first, then representatives
    let callCount = 0;
    mockMaybeSingle.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call: return challenge
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
      // Subsequent calls: no representative found
      return Promise.resolve({ data: null, error: null });
    });

    // Mock the from() to handle different tables
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
      if (table === 'candidate_profiles') {
        return {
          update: () => ({
            eq: () => ({ error: null }),
          }),
        };
      }
      return {
        select: () => ({ eq: () => ({ maybeSingle: mockMaybeSingle }) }),
      };
    });

    const res = (await POST(buildRequest({ code: '123456' }))) as Response;
    expect(res.status).toBe(200);
    const payload = await res.json();
    expect(payload.success).toBe(true);
    expect(payload.data.ok).toBe(true);
  });
});

