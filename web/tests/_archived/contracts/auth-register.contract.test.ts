/**
 * @jest-environment node
 */

import { validateCsrfProtection, createCsrfErrorResponse } from '@/app/api/auth/_shared';
import { createNextRequest } from '@/tests/contracts/helpers/request';

const mockSupabaseClient: Record<string, any> = {
  auth: {
    signUp: jest.fn(),
  },
  from: jest.fn(),
};

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const mockRateLimiter = {
  checkLimit: jest.fn(),
};

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(async () => mockSupabaseClient),
}));

jest.mock('@/lib/rate-limiting/api-rate-limiter', () => ({
  apiRateLimiter: mockRateLimiter,
}));

jest.mock('@/app/api/auth/_shared', () => ({
  validateCsrfProtection: jest.fn(),
  createCsrfErrorResponse: jest.fn(),
}));

jest.mock('@/lib/utils/logger', () => ({
  __esModule: true,
  logger: mockLogger,
  default: mockLogger,
}));

describe('Auth register API contract', () => {
  const loadRoute = async () => {
    let routeModule: typeof import('@/app/api/auth/register/route');
    await jest.isolateModulesAsync(async () => {
      routeModule = await import('@/app/api/auth/register/route');
    });
    return routeModule!;
  };

  const createUserProfilesBuilder = (result: { data: any; error: any }) => ({
    insert: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue(result),
      }),
    }),
  });

  const baseHeaders = {
    'content-type': 'application/json',
    'x-forwarded-for': '203.0.113.1',
    'user-agent': 'contract-suite',
  };

  const expectSuccessEnvelope = (body: any) => {
    expect(body.success).toBe(true);
    expect(body.metadata).toEqual(
      expect.objectContaining({
        timestamp: expect.any(String),
      }),
    );
  };

  const expectErrorEnvelope = (body: any, options?: { code?: string }) => {
    expect(body.success).toBe(false);
    expect(body.metadata).toEqual(
      expect.objectContaining({
        timestamp: expect.any(String),
      }),
    );
    if (options?.code) {
      expect(body.code).toBe(options.code);
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient.auth.signUp.mockReset();
    mockSupabaseClient.from.mockReset();
    mockRateLimiter.checkLimit.mockResolvedValue({ allowed: true });
    (validateCsrfProtection as jest.Mock).mockResolvedValue(true);
    (createCsrfErrorResponse as jest.Mock).mockReturnValue(
      new Response(JSON.stringify({ success: false, code: 'CSRF_ERROR' }), { status: 403 }),
    );
  });

  it('registers user successfully and invokes gatekeepers', async () => {
    const user = { id: 'user-1', email: 'new@example.com' };
    const session = { access_token: 'token' };
    mockSupabaseClient.auth.signUp.mockResolvedValue({ data: { user, session }, error: null });
    const profileResponse = {
      data: {
        id: 'profile-1',
        username: 'newuser',
        trust_tier: 'T1',
        display_name: 'newuser',
        is_active: true,
      },
      error: null,
    };
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        return createUserProfilesBuilder(profileResponse);
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { POST } = await loadRoute();
    expect(typeof POST).toBe('function');
    const response = await POST(
      createNextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify({
          email: 'new@example.com',
          password: 'password123',
          username: 'newuser',
        }),
      }),
    );

    if (!response) {
      throw new Error('Route returned undefined response');
    }
    const body = await response.json();
    expect(response.status).toBe(201);
    expectSuccessEnvelope(body);
    expect(body.data.user.email).toBe('new@example.com');
    expect(validateCsrfProtection).toHaveBeenCalledWith(expect.any(Request));
    expect(mockRateLimiter.checkLimit).toHaveBeenCalledWith(
      '203.0.113.1',
      '/api/auth/register',
      expect.objectContaining({ userAgent: 'contract-suite' }),
    );
    expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'password123',
      options: {
        data: {
          username: 'newuser',
          display_name: 'newuser',
        },
      },
    });
  });

  it('enforces CSRF protection', async () => {
    (validateCsrfProtection as jest.Mock).mockResolvedValue(false);

    const { POST } = await loadRoute();
    const response = await POST(
      createNextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify({}),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(403);
    expect(body.code).toBe('CSRF_ERROR');
  });

  it('enforces rate limiting', async () => {
    mockRateLimiter.checkLimit.mockResolvedValue({ allowed: false });

    const { POST } = await loadRoute();
    const response = await POST(
      createNextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify({
          email: 'new@example.com',
          password: 'password123',
          username: 'newuser',
        }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(429);
    expectErrorEnvelope(body, { code: 'RATE_LIMIT' });
  });

  it('rejects invalid usernames via regex validation', async () => {
    const { POST } = await loadRoute();
    const response = await POST(
      createNextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify({
          email: 'x@example.com',
          password: 'password123',
          username: 'ab', // too short
        }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(400);
    expectErrorEnvelope(body, { code: 'VALIDATION_ERROR' });
    expect(body.details.username).toContain('Username must be 3-20 characters');
    expect(mockSupabaseClient.auth.signUp).not.toHaveBeenCalled();
  });

  it('handles Supabase email conflict', async () => {
    mockSupabaseClient.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'already registered' },
    });

    const { POST } = await loadRoute();
    const response = await POST(
      createNextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify({
          email: 'new@example.com',
          password: 'password123',
          username: 'newuser',
        }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(409);
    expectErrorEnvelope(body, { code: 'EMAIL_EXISTS' });
  });

  it('returns 400 with error detail for non-conflict Supabase failures', async () => {
    mockSupabaseClient.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'service unavailable', status: 500 },
    });

    const { POST } = await loadRoute();
    const response = await POST(
      createNextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify({
          email: 'new@example.com',
          password: 'password123',
          username: 'newuser',
        }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(400);
    expectErrorEnvelope(body);
    expect(body.error).toBe('Registration failed. Please try again.');
    expect(body.details).toEqual(
      expect.objectContaining({
        error: 'service unavailable',
        details: 500,
      }),
    );
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Registration failed',
      expect.objectContaining({ email: 'new@example.com', error: 'service unavailable' }),
    );
  });

  it('handles profile creation failure', async () => {
    const user = { id: 'user-1', email: 'new@example.com' };
    mockSupabaseClient.auth.signUp.mockResolvedValue({ data: { user, session: null }, error: null });
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        return createUserProfilesBuilder({
                data: null,
                error: { message: 'insert failed' },
        });
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { POST } = await loadRoute();
    const response = await POST(
      createNextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify({
          email: 'new@example.com',
          password: 'password123',
          username: 'newuser',
        }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(500);
    expectErrorEnvelope(body);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Orphaned auth user created - cleanup required',
      expect.objectContaining({ user_id: 'user-1', email: 'new@example.com' }),
    );
  });
});

