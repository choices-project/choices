/**
 * @jest-environment node
 *
 * Contract tests for standalone avatar upload (POST /api/profile/avatar).
 */

import { createNextRequest } from '@/tests/contracts/helpers/request';

const mockGetCurrentUser = jest.fn();

jest.mock('@/lib/core/auth/utils', () => ({
  getCurrentUser: (req: unknown) => mockGetCurrentUser(req),
}));

const mockSupabaseClient = {
  storage: {
    from: jest.fn(),
  },
  from: jest.fn(),
};

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(async () => mockSupabaseClient),
}));

jest.mock('@/lib/utils/logger', () => ({
  devLog: jest.fn(),
}));

const loadRoute = () => {
  let routeModule: { POST: (req: Request) => Promise<Response> };
  jest.isolateModules(() => {
    routeModule = require('@/app/api/profile/avatar/route');
  });
  return routeModule;
};

describe('Profile avatar POST API contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockReturnValue({
      userId: 'user-avatar-1',
      email: 'u@example.com',
      stableId: 'stable-1',
      verificationTier: 'T1',
      iat: 1,
      exp: 9999999999,
    });

    mockSupabaseClient.storage.from.mockImplementation(() => ({
      upload: jest.fn().mockResolvedValue({ data: { path: 'avatars/user-avatar-1.png' }, error: null }),
      getPublicUrl: jest.fn().mockReturnValue({
        data: { publicUrl: 'https://cdn.example/avatars/user-avatar-1.png' },
      }),
    }));

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
  });

  it('returns success envelope with public avatar URL', async () => {
    const { POST } = loadRoute();
    const form = new FormData();
    form.append('avatar', new File([Buffer.from('fake-png')], 'face.png', { type: 'image/png' }));

    const response = await POST(
      createNextRequest('http://localhost/api/profile/avatar', {
        method: 'POST',
        body: form,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({
      avatarUrl: 'https://cdn.example/avatars/user-avatar-1.png',
    });
    expect(body.metadata).toEqual(
      expect.objectContaining({
        timestamp: expect.any(String),
      }),
    );
  });

  it('returns validation error when avatar file is missing', async () => {
    const { POST } = loadRoute();
    const form = new FormData();
    const response = await POST(
      createNextRequest('http://localhost/api/profile/avatar', {
        method: 'POST',
        body: form,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 401 when JWT user cannot be resolved', async () => {
    mockGetCurrentUser.mockReturnValue(null);
    const { POST } = loadRoute();
    const form = new FormData();
    form.append('avatar', new File([Buffer.from('x')], 'a.png', { type: 'image/png' }));

    const response = await POST(
      createNextRequest('http://localhost/api/profile/avatar', {
        method: 'POST',
        body: form,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.code).toBe('AUTH_ERROR');
  });
});
