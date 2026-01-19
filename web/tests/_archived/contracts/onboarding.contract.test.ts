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

describe('/api/user/complete-onboarding contract', () => {
  const loadRoute = () => {
    let routeModule: any;
    jest.isolateModules(() => {
      routeModule = require('@/app/api/user/complete-onboarding/route');
    });
    return routeModule;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient.auth.getUser.mockReset();
    mockSupabaseClient.from.mockReset();
  });

  it('completes onboarding and returns redirect', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-onboard' } },
      error: null,
    });

    const updateBuilder = {
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        return updateBuilder;
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { POST } = loadRoute();
    const response = await POST(
      createNextRequest('http://localhost/api/user/complete-onboarding', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ preferences: { theme: 'dark' } }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.redirectTo).toContain('/dashboard');
    expect(body.data.onboarding.completed).toBe(true);
  });

  it('returns auth error when user missing', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'No session' },
    });

    const { POST } = loadRoute();
    const response = await POST(
      createNextRequest('http://localhost/api/user/complete-onboarding', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ preferences: {} }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(401);
    expect(body.code).toBe('AUTH_ERROR');
  });

  it('returns invalid payload for bad JSON', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-onboard' } },
      error: null,
    });

    const { POST } = loadRoute();
    const response = await POST(
      createNextRequest('http://localhost/api/user/complete-onboarding', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'not-json',
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.code).toBe('ONBOARDING_INVALID_PAYLOAD');
  });

  it('surface errors when profile update fails', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-onboard' } },
      error: null,
    });

    const updateBuilder = {
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: { message: 'update failed' },
        }),
      }),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        return updateBuilder;
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { POST } = loadRoute();
    const response = await POST(
      createNextRequest('http://localhost/api/user/complete-onboarding', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ preferences: { theme: 'dark' } }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body.code).toBe('ONBOARDING_UPDATE_FAILED');
  });
});

