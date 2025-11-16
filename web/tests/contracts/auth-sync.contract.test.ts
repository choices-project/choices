/**
 * @jest-environment node
 */

import { createNextRequest } from '@/tests/contracts/helpers/request';

const mockSupabaseClient: Record<string, any> = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(async () => mockSupabaseClient),
}));

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

describe('Auth sync-user API contract', () => {
  const loadRoute = () => {
    let routeModule: any;
    jest.isolateModules(() => {
      routeModule = require('@/app/api/auth/sync-user/route');
    });
    return routeModule;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient.auth.getUser.mockReset();
    mockSupabaseClient.from.mockReset();
  });

  it('creates profile when missing', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com' } },
      error: null,
    });

    const selectBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    };

    const insertBuilder = {
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'profile-1', user_id: 'user-1', email: 'user@example.com', trust_tier: 'T1' },
            error: null,
          }),
        }),
      }),
    };

    let fromCalls = 0;
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        fromCalls += 1;
        return fromCalls === 1 ? selectBuilder : insertBuilder;
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { POST } = loadRoute();
    const response = await POST(createNextRequest('http://localhost/api/auth/sync-user', { method: 'POST' }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expectSuccessEnvelope(body);
    expect(body.data.user.user_id).toBe('user-1');
    expect(body.metadata).toEqual(expect.objectContaining({ timestamp: expect.any(String) }));
  });

  it('returns existing profile without creating new record', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com' } },
      error: null,
    });

    const existingBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'profile-1', user_id: 'user-1', email: 'user@example.com', trust_tier: 'T1' },
        error: null,
      }),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        return existingBuilder;
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { POST } = loadRoute();
    const response = await POST(createNextRequest('http://localhost/api/auth/sync-user', { method: 'POST' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expectSuccessEnvelope(body);
    expect(body.data.message).toBe('User already synced');
    expect(body.metadata).toEqual(expect.objectContaining({ timestamp: expect.any(String) }));
  });

  it('requires authentication', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'No session' },
    });

    const { POST } = loadRoute();
    const response = await POST(createNextRequest('http://localhost/api/auth/sync-user', { method: 'POST' }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expectErrorEnvelope(body, { code: 'AUTH_ERROR' });
  });

  it('propagates lookup failures', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com' } },
      error: null,
    });

    const failingBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'XX000', message: 'lookup failed' },
      }),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        return failingBuilder;
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { POST } = loadRoute();
    const response = await POST(createNextRequest('http://localhost/api/auth/sync-user', { method: 'POST' }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expectErrorEnvelope(body, { code: 'SYNC_PROFILE_LOOKUP_FAILED' });
    expect(body.details).toEqual({ message: 'lookup failed' });
  });

  it('propagates creation failures', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com' } },
      error: null,
    });

    const selectBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    };

    const insertBuilder = {
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'insert failed' },
          }),
        }),
      }),
    };

    let fromCalls = 0;
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        fromCalls += 1;
        return fromCalls === 1 ? selectBuilder : insertBuilder;
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { POST } = loadRoute();
    const response = await POST(createNextRequest('http://localhost/api/auth/sync-user', { method: 'POST' }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expectErrorEnvelope(body, { code: 'SYNC_PROFILE_CREATE_FAILED' });
    expect(body.details).toEqual({ message: 'insert failed' });
  });
});

