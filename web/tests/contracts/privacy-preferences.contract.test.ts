/**
 * @jest-environment node
 *
 * Contract tests for GET/POST /api/privacy/preferences.
 */

import { createNextRequest } from '@/tests/contracts/helpers/request';

const mockSupabaseClient: Record<string, unknown> = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(async () => mockSupabaseClient),
}));

jest.mock('@/lib/utils/logger', () => ({
  devLog: jest.fn(),
}));

describe('Privacy preferences API contract', () => {
  const loadRoute = () => {
    let routeModule: {
      GET: (req: Request) => Promise<Response>;
      POST: (req: Request) => Promise<Response>;
    };
    jest.isolateModules(() => {
      routeModule = require('@/app/api/privacy/preferences/route');
    });
    return routeModule;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockSupabaseClient.auth as { getUser: jest.Mock }).getUser.mockReset();
    (mockSupabaseClient.from as jest.Mock).mockReset();
  });

  it('returns default preferences via GET when row missing', async () => {
    (mockSupabaseClient.auth as { getUser: jest.Mock }).getUser.mockResolvedValue({
      data: { user: { id: 'user-privacy', email: 'pref@example.com' } },
      error: null,
    });

    const preferencesBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    };

    (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'user_privacy_preferences') {
        return preferencesBuilder;
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const { GET } = loadRoute();
    const response = await GET(createNextRequest('http://localhost/api/privacy/preferences'));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.preferences.user_id).toBe('user-privacy');
    expect(body.data.preferences.profile_visibility).toBe('public');
  });

  it('updates preferences via POST', async () => {
    (mockSupabaseClient.auth as { getUser: jest.Mock }).getUser.mockResolvedValue({
      data: { user: { id: 'user-privacy', email: 'pref@example.com' } },
      error: null,
    });

    const upsertBuilder = {
      upsert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                user_id: 'user-privacy',
                profile_visibility: 'friends_only',
                allow_contact: true,
              },
              error: null,
            }),
          }),
        }),
      }),
    };

    const profileBuilder = {
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    };

    (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'user_privacy_preferences') {
        return upsertBuilder;
      }
      if (table === 'user_profiles') {
        return profileBuilder;
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const { POST } = loadRoute();
    const response = await POST(
      createNextRequest('http://localhost/api/privacy/preferences', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          profile_visibility: 'friends_only',
          allow_contact: true,
        }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.preferences.profile_visibility).toBe('friends_only');
  });
});
