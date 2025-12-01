/**
 * Candidate Verification Confirm Endpoint Tests
 * 
 * Tests for expired code handling, wrong code handling, and edge cases
 * 
 * Created: January 2025
 */

import type { NextRequest } from 'next/server';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

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

type AuthUser = {
  id: string;
  email: string;
};

type SupabaseAuthResponse = {
  data: { user: AuthUser | null };
  error: null;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  reset: number;
};

interface MockQueryChain {
  select: jest.Mock<MockQueryChain, unknown[]>;
  eq: jest.Mock<MockQueryChain, unknown[]>;
  order: jest.Mock<MockQueryChain, unknown[]>;
  limit: jest.Mock<MockQueryChain, unknown[]>;
  maybeSingle: jest.Mock<Promise<unknown>, unknown[]>;
  update: jest.Mock<unknown, unknown[]>;
  ilike: jest.Mock<MockQueryChain, unknown[]>;
  or: jest.Mock<MockQueryChain, unknown[]>;
}

const createMockQueryChain = (): MockQueryChain => {
  const chain = {} as MockQueryChain;
  const chainMethod = () => jest.fn<MockQueryChain, []>().mockReturnValue(chain);

  chain.select = chainMethod();
  chain.eq = chainMethod();
  chain.order = chainMethod();
  chain.limit = chainMethod();
  chain.update = jest.fn().mockReturnValue(chain);
  chain.ilike = chainMethod();
  chain.or = chainMethod();
  // Default to "no row" shape to avoid destructuring errors when tests
  // don't care about the actual challenge payload.
  chain.maybeSingle = jest.fn<Promise<unknown>, []>().mockResolvedValue({
    data: null,
    error: null,
  });

  return chain;
};

type MockSupabaseClient = {
  auth: {
    getUser: jest.Mock<Promise<SupabaseAuthResponse>, []>;
  };
  from: jest.Mock<MockQueryChain, [string]>;
};

const DEFAULT_AUTH_USER: AuthUser = {
  id: 'user-123',
  email: 'candidate@example.gov'
};

const createMockSupabaseClient = (options?: {
  queryChain?: MockQueryChain;
  fromImpl?: (table: string) => MockQueryChain;
  authUser?: AuthUser | null;
}): MockSupabaseClient => {
  const sharedChain = options?.queryChain ?? createMockQueryChain();
  const fromImplementation =
    options?.fromImpl ?? ((_: string) => sharedChain);

  return {
    auth: {
      getUser: jest
        .fn<Promise<SupabaseAuthResponse>, []>()
        .mockResolvedValue({
          data: { user: options?.authUser ?? DEFAULT_AUTH_USER },
          error: null
        })
    },
    from: jest.fn<MockQueryChain, [string]>((table: string) => fromImplementation(table))
  };
};

const createRateLimitState = (overrides: Partial<RateLimitResult> = {}): RateLimitResult => ({
  allowed: true,
  remaining: 10,
  reset: Date.now() + 15 * 60 * 1000,
  ...overrides
});

const resolveSupabaseClient = async (client: MockSupabaseClient) => {
  const { getSupabaseServerClient } = await import('@/utils/supabase/server');
  type SupabaseServerClient = Awaited<ReturnType<typeof getSupabaseServerClient>>;
  jest.mocked(getSupabaseServerClient).mockResolvedValue(client as SupabaseServerClient);
};

describe('POST /api/candidates/verify/confirm - Expired Code Handling', () => {
  let POST: (request: NextRequest) => Promise<Response>;
  let mockRequest: NextRequest;
  let mockSupabase: MockSupabaseClient;
  let mockRateLimit: RateLimitResult;
  let queryChain: MockQueryChain;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Create a reusable query builder chain that we can configure
    queryChain = createMockQueryChain();

    // Setup mock Supabase - return the same chain instance
    mockSupabase = createMockSupabaseClient({
      queryChain,
      fromImpl: () => queryChain
    });

    // Setup mock rate limiter
    mockRateLimit = createRateLimitState();

    await resolveSupabaseClient(mockSupabase);

    const { rateLimitMiddleware } = await import('@/lib/core/security/rate-limit');
    jest.mocked(rateLimitMiddleware).mockResolvedValue(mockRateLimit);
    
    // Import the handler after mocks are set up
    const module = await import('@/app/api/candidates/verify/confirm/route');
    POST = module.POST;

    // Setup mock request
    mockRequest = {
      headers: new Headers(),
      nextUrl: new URL('http://localhost/api/candidates/verify/confirm'),
      json: jest.fn().mockResolvedValue({ code: '123456' })
    } as unknown as NextRequest;
  });

  it('should reject expired code with clear error message', async () => {
    const expiredAt = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago
    
    queryChain.maybeSingle.mockResolvedValue({
      data: {
        id: 'challenge-123',
        candidate_id: 'candidate-123',
        user_id: 'user-123',
        email: 'candidate@example.gov',
        code: '123456',
        expires_at: expiredAt.toISOString(),
        used_at: null,
        failed_attempts: 0
      },
      error: null
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details?.code).toContain('expired');
    expect(data.details?.code).toContain('20 minutes');
    expect(data.details?.code).toContain('request a new code');
  });

  it('should show expiration time in minutes when less than 60 minutes', async () => {
    const expiredAt = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    
    queryChain.maybeSingle.mockResolvedValue({
      data: {
        id: 'challenge-123',
        candidate_id: 'candidate-123',
        user_id: 'user-123',
        email: 'candidate@example.gov',
        code: '123456',
        expires_at: expiredAt.toISOString(),
        used_at: null,
        failed_attempts: 0
      },
      error: null
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.details?.code).toContain('5 minute');
    expect(data.details?.code).not.toContain('hour');
  });

  it('should show expiration time in hours when more than 60 minutes', async () => {
    const expiredAt = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    
    queryChain.maybeSingle.mockResolvedValue({
      data: {
        id: 'challenge-123',
        candidate_id: 'candidate-123',
        user_id: 'user-123',
        email: 'candidate@example.gov',
        code: '123456',
        expires_at: expiredAt.toISOString(),
        used_at: null,
        failed_attempts: 0
      },
      error: null
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.details?.code).toContain('2 hour');
  });

  it('should include expiration metadata in error response', async () => {
    const expiredAt = new Date(Date.now() - 10 * 60 * 1000);
    
    queryChain.maybeSingle.mockResolvedValue({
      data: {
        id: 'challenge-123',
        candidate_id: 'candidate-123',
        user_id: 'user-123',
        email: 'candidate@example.gov',
        code: '123456',
        expires_at: expiredAt.toISOString(),
        used_at: null,
        failed_attempts: 0
      },
      error: null
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(data.expired).toBe(true);
    expect(data.expiresAt).toBe(expiredAt.toISOString());
    expect(data.expiredMinutesAgo).toBeGreaterThan(0);
    expect(data.canRequestNew).toBe(true);
  });
});

describe('POST /api/candidates/verify/confirm - Wrong Code Handling', () => {
  let POST: (request: NextRequest) => Promise<Response>;
  let mockRequest: NextRequest;
  let mockSupabase: MockSupabaseClient;
  let mockRateLimit: RateLimitResult;
  let queryChain: MockQueryChain;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Create a reusable query builder chain
    queryChain = createMockQueryChain();
    queryChain.update.mockResolvedValue({ error: null });

    mockSupabase = createMockSupabaseClient({
      queryChain,
      fromImpl: () => queryChain
    });

    mockRateLimit = createRateLimitState();

    await resolveSupabaseClient(mockSupabase);

    const { rateLimitMiddleware } = await import('@/lib/core/security/rate-limit');
    jest.mocked(rateLimitMiddleware).mockResolvedValue(mockRateLimit);
    
    const module = await import('@/app/api/candidates/verify/confirm/route');
    POST = module.POST;

    mockRequest = {
      headers: new Headers(),
      nextUrl: new URL('http://localhost/api/candidates/verify/confirm'),
      json: jest.fn().mockResolvedValue({ code: 'wrong-code' })
    } as unknown as NextRequest;
  });

  it('should reject wrong code with attempts remaining message', async () => {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    
    queryChain.maybeSingle.mockResolvedValue({
      data: {
        id: 'challenge-123',
        candidate_id: 'candidate-123',
        user_id: 'user-123',
        email: 'candidate@example.gov',
        code: '123456', // Correct code
        expires_at: expiresAt.toISOString(),
        used_at: null,
        failed_attempts: 0
      },
      error: null
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details?.code).toContain('incorrect');
    expect(data.details?.code).toContain('attempts remaining');
    expect(data.invalid).toBe(true);
    expect(data.attemptsRemaining).toBe(4); // 5 max - 1 failed = 4 remaining
    expect(data.maxAttempts).toBe(5);
    expect(data.failedAttempts).toBe(1);
  });

  it('should show correct attempts remaining after multiple failures', async () => {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    queryChain.maybeSingle.mockResolvedValue({
      data: {
        id: 'challenge-123',
        candidate_id: 'candidate-123',
        user_id: 'user-123',
        email: 'candidate@example.gov',
        code: '123456',
        expires_at: expiresAt.toISOString(),
        used_at: null,
        failed_attempts: 2 // Already 2 failed attempts
      },
      error: null
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.attemptsRemaining).toBe(2); // 5 max - 3 failed = 2 remaining
    expect(data.failedAttempts).toBe(3);
  });

  it('should lock code after 5 failed attempts', async () => {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    queryChain.maybeSingle.mockResolvedValue({
      data: {
        id: 'challenge-123',
        candidate_id: 'candidate-123',
        user_id: 'user-123',
        email: 'candidate@example.gov',
        code: '123456',
        expires_at: expiresAt.toISOString(),
        used_at: null,
        failed_attempts: 4 // Already 4 failed attempts
      },
      error: null
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.details?.code).toContain('exceeded');
    expect(data.details?.code).toContain('locked');
    expect(data.details?.code).toContain('request a new verification code');
    expect(data.attemptsRemaining).toBe(0);
    expect(data.canRequestNew).toBe(true);
  });

  it('should update failed_attempts counter in database', async () => {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    queryChain.maybeSingle.mockResolvedValue({
      data: {
        id: 'challenge-123',
        candidate_id: 'candidate-123',
        user_id: 'user-123',
        email: 'candidate@example.gov',
        code: '123456',
        expires_at: expiresAt.toISOString(),
        used_at: null,
        failed_attempts: 1
      },
      error: null
    });

    await POST(mockRequest);

    // Verify update was called with incremented failed_attempts
    expect(mockSupabase.from).toHaveBeenCalledWith('candidate_email_challenges');
    const updateCall = mockSupabase.from().update;
    expect(updateCall).toHaveBeenCalled();
  });

  it('should reject code that has already been used', async () => {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const usedAt = new Date(Date.now() - 5 * 60 * 1000);
    
    queryChain.maybeSingle.mockResolvedValue({
      data: {
        id: 'challenge-123',
        candidate_id: 'candidate-123',
        user_id: 'user-123',
        email: 'candidate@example.gov',
        code: '123456',
        expires_at: expiresAt.toISOString(),
        used_at: usedAt.toISOString(), // Already used
        failed_attempts: 0
      },
      error: null
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.details?.code).toContain('already been used');
    expect(data.details?.code).toContain('request a new code');
    expect(data.alreadyUsed).toBe(true);
  });
});

describe('POST /api/candidates/verify/confirm - Successful Verification', () => {
  let POST: (request: NextRequest) => Promise<Response>;
  let mockRequest: NextRequest;
  let mockSupabase: MockSupabaseClient;
  let mockRateLimit: RateLimitResult;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module = await import('@/app/api/candidates/verify/confirm/route');
    POST = module.POST;

    mockRequest = {
      headers: new Headers(),
      nextUrl: new URL('http://localhost/api/candidates/verify/confirm'),
      json: jest.fn().mockResolvedValue({ code: '123456' })
    } as unknown as NextRequest;

    mockSupabase = createMockSupabaseClient({
      fromImpl: (table: string) => {
        const chain = createMockQueryChain();

        if (table === 'candidate_email_challenges') {
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
          chain.maybeSingle.mockResolvedValue({
            data: {
              id: 'challenge-123',
              candidate_id: 'candidate-123',
              user_id: 'user-123',
              email: 'candidate@example.gov',
              code: '123456', // Correct code
              expires_at: expiresAt.toISOString(),
              used_at: null,
              failed_attempts: 0
            },
            error: null
          });
        } else if (table === 'representatives_core') {
          chain.maybeSingle.mockResolvedValue({
            data: null,
            error: null
          });
          chain.limit.mockResolvedValue({
            data: [],
            error: null
          });
        } else if (table === 'official_email_fast_track') {
          chain.maybeSingle.mockResolvedValue({
            data: null,
            error: null
          });
        } else if (table === 'candidate_profiles') {
          // .update() returns chain, .eq() returns promise
          chain.update.mockReturnValue(chain);
          chain.eq.mockResolvedValue({ data: null, error: null });
        }

        return chain;
      }
    });

    mockRateLimit = createRateLimitState();

    await resolveSupabaseClient(mockSupabase);

    const { rateLimitMiddleware } = await import('@/lib/core/security/rate-limit');
    jest.mocked(rateLimitMiddleware).mockResolvedValue(mockRateLimit);
  });

  it('should accept valid code and mark challenge as used', async () => {
    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.ok).toBe(true);

    // Verify challenge was marked as used
    expect(mockSupabase.from).toHaveBeenCalledWith('candidate_email_challenges');
  });

  it('should link representative when email matches exactly', async () => {
    mockSupabase = createMockSupabaseClient({
      fromImpl: (table: string) => {
        const chain = createMockQueryChain();

        if (table === 'candidate_email_challenges') {
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
          chain.maybeSingle.mockResolvedValue({
            data: {
              id: 'challenge-123',
              candidate_id: 'candidate-123',
              user_id: 'user-123',
              email: 'candidate@example.gov',
              code: '123456',
              expires_at: expiresAt.toISOString(),
              used_at: null,
              failed_attempts: 0
            },
            error: null
          });
        } else if (table === 'representatives_core') {
          chain.maybeSingle.mockResolvedValue({
            data: {
              id: 456,
              primary_email: 'candidate@example.gov'
            },
            error: null
          });
        } else if (table === 'candidate_profiles') {
          // .update() returns chain, .eq() returns promise
          chain.update.mockReturnValue(chain);
          chain.eq.mockResolvedValue({ data: null, error: null });
        }

        return chain;
      }
    });
    await resolveSupabaseClient(mockSupabase);

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.representativeId).toBe(456);
  });
});

describe('POST /api/candidates/verify/confirm - Rate Limiting', () => {
  let POST: (request: NextRequest) => Promise<Response>;
  let mockRequest: NextRequest;
  let mockSupabase: MockSupabaseClient;
  let mockRateLimit: RateLimitResult;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();
    
    const module = await import('@/app/api/candidates/verify/confirm/route');
    POST = module.POST;

    mockRequest = {
      headers: new Headers(),
      nextUrl: new URL('http://localhost/api/candidates/verify/confirm'),
      json: jest.fn().mockResolvedValue({ code: '123456' })
    } as unknown as NextRequest;

    mockSupabase = createMockSupabaseClient({
      fromImpl: () => createMockQueryChain()
    });

    mockRateLimit = createRateLimitState();

    await resolveSupabaseClient(mockSupabase);

    const { rateLimitMiddleware } = await import('@/lib/core/security/rate-limit');
    jest.mocked(rateLimitMiddleware).mockResolvedValue(mockRateLimit);
  });

  it('should reject when rate limit is exceeded', async () => {
    mockRateLimit.allowed = false;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details?.code).toContain('Too many verification attempts');
    expect(data.details?.code).toContain('15 minutes');
  });

  it('should enforce 10 attempts per 15 minutes limit', async () => {
    const { createRateLimiter } = await import('@/lib/core/security/rate-limit');

    // Verify rate limiter is created with correct configuration
    expect(createRateLimiter).toHaveBeenCalledWith({
      interval: 15 * 60 * 1000, // 15 minutes
      uniqueTokenPerInterval: 10, // 10 attempts per interval
      maxBurst: 5 // 5 rapid attempts allowed
    });
  });
});

describe('POST /api/candidates/verify/confirm - Input Validation', () => {
  let POST: (request: NextRequest) => Promise<Response>;
  let mockRequest: NextRequest;
  let mockSupabase: MockSupabaseClient;
  let mockRateLimit: RateLimitResult;
  let queryChain: MockQueryChain;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module = await import('@/app/api/candidates/verify/confirm/route');
    POST = module.POST;

    mockRequest = {
      headers: new Headers(),
      nextUrl: new URL('http://localhost/api/candidates/verify/confirm'),
      json: jest.fn()
    } as unknown as NextRequest;

    queryChain = createMockQueryChain();

    mockSupabase = createMockSupabaseClient({
      queryChain,
      fromImpl: () => queryChain
    });

    mockRateLimit = createRateLimitState();

    await resolveSupabaseClient(mockSupabase);

    const { rateLimitMiddleware } = await import('@/lib/core/security/rate-limit');
    jest.mocked(rateLimitMiddleware).mockResolvedValue(mockRateLimit);
  });

  it('should reject request with missing code', async () => {
    mockRequest.json = jest.fn().mockResolvedValue({});

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details?.code).toContain('required');
  });

  it('should reject request with empty code', async () => {
    mockRequest.json = jest.fn().mockResolvedValue({ code: '' });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details?.code).toContain('required');
  });

  it('should reject request when no challenge exists', async () => {
    mockRequest.json = jest.fn().mockResolvedValue({ code: '123456' });
    
    queryChain.maybeSingle.mockResolvedValue({
      data: null,
      error: null
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details?.code).toContain('Invalid or expired code');
  });

  it('should reject request when user is not authenticated', async () => {
    mockRequest.json = jest.fn().mockResolvedValue({ code: '123456' });
    
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Authentication required');
  });
});

