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

describe('Privacy Preferences API contract', () => {
  const loadRoute = () => {
    let routeModule: any;
    jest.isolateModules(() => {
      routeModule = require('@/app/api/privacy/preferences/route');
    });
    return routeModule;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient.auth.getUser.mockReset();
    mockSupabaseClient.from.mockReset();
  });

  it('returns default preferences via GET', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-privacy', email: 'pref@example.com' } },
      error: null,
    });

    const preferencesBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
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
    mockSupabaseClient.auth.getUser.mockResolvedValue({
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

    mockSupabaseClient.from.mockImplementation((table: string) => {
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

