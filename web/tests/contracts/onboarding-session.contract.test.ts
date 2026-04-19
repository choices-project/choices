/**
 * @jest-environment node
 *
 * Contract tests for session-backed onboarding helpers:
 * POST /api/onboarding/progress, POST /api/onboarding/complete, POST /api/user/complete-onboarding
 */

import { createNextRequest } from '@/tests/contracts/helpers/request';

const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(() => Promise.resolve(mockSupabaseClient)),
}));

jest.mock('@/lib/utils/logger', () => ({
  devLog: jest.fn(),
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Onboarding progress POST contract', () => {
  const loadRoute = () => {
    let routeModule: { POST: (req: Request) => Promise<Response> };
    jest.isolateModules(() => {
      routeModule = require('@/app/api/onboarding/progress/route');
    });
    return routeModule;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'onb-user-1' } },
      error: null,
    });
  });

  it('returns 200 for action=start with step', async () => {
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'onboarding_progress') {
        return {
          upsert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  user_id: 'onb-user-1',
                  current_step: 'welcome',
                  completed_steps: [],
                  step_data: {},
                },
                error: null,
              }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { POST } = loadRoute();
    const response = await POST(
      createNextRequest('http://localhost/api/onboarding/progress', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ step: 'welcome', action: 'start' }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.progress.user_id).toBe('onb-user-1');
  });
});

describe('Onboarding complete POST contract', () => {
  const loadRoute = () => {
    let routeModule: { POST: (req: Request) => Promise<Response> };
    jest.isolateModules(() => {
      routeModule = require('@/app/api/onboarding/complete/route');
    });
    return routeModule;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'onb-user-2' } },
      error: null,
    });
  });

  it('returns success when profile update succeeds', async () => {
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { POST } = loadRoute();
    const response = await POST(
      createNextRequest('http://localhost/api/onboarding/complete', {
        method: 'POST',
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.message).toContain('completed');
  });
});

describe('User complete-onboarding POST contract', () => {
  const loadRoute = () => {
    let routeModule: { POST: (req: Request) => Promise<Response> };
    jest.isolateModules(() => {
      routeModule = require('@/app/api/user/complete-onboarding/route');
    });
    return routeModule;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'onb-user-3' } },
      error: null,
    });
  });

  it('returns success with JSON preferences', async () => {
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { POST } = loadRoute();
    const response = await POST(
      createNextRequest('http://localhost:3000/api/user/complete-onboarding', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ preferences: { theme: 'dark' } }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.onboarding.completed).toBe(true);
    expect(body.data.redirectTo).toContain('/dashboard');
  });
});
