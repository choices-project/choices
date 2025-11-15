/**
 * @jest-environment node
 */

import { createNextRequest } from '@/tests/contracts/helpers/request';

const mockSupabaseClient: Record<string, any> = {
  auth: {
    getUser: jest.fn(),
  },
  rpc: jest.fn(),
  from: jest.fn(),
};

const mockRedisClient = {
  get: jest.fn(),
  set: jest.fn(),
};

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(async () => mockSupabaseClient),
}));

jest.mock('@/lib/cache/redis-client', () => ({
  getRedisClient: jest.fn(async () => mockRedisClient),
}));

describe('Dashboard API contract', () => {
  const loadRoute = () => {
    let routeModule: any;
    jest.isolateModules(() => {
      routeModule = require('@/app/api/dashboard/route');
    });
    return routeModule;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient.auth.getUser.mockReset();
    mockSupabaseClient.rpc.mockReset();
    mockSupabaseClient.from.mockReset();
    mockRedisClient.get.mockReset();
    mockRedisClient.set.mockReset();
  });

  it('returns cached dashboard payload using helper envelope', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'cached@example.com' } },
      error: null,
    });

    const cachedDashboard = {
      user: {
        id: 'user-1',
        email: 'cached@example.com',
        name: 'Cache User',
      },
      analytics: {
        total_votes: 10,
        total_polls_created: 2,
        active_polls: 1,
        total_votes_on_user_polls: 5,
        participation_score: 20,
        recent_activity: {
          votes_last_30_days: 3,
          polls_created_last_30_days: 1,
        },
      },
      preferences: {
        showElectedOfficials: true,
        showQuickActions: true,
        showRecentActivity: true,
        showEngagementScore: true,
      },
      platformStats: {
        total_polls: 100,
        total_votes: 1000,
        active_polls: 20,
        total_users: 500,
      },
      generatedAt: '2025-11-14T00:00:00.000Z',
      fromCache: true,
      loadTime: 5,
    };

    mockRedisClient.get.mockResolvedValue(cachedDashboard);

    const { GET } = loadRoute();
    const response = await GET(createNextRequest('http://localhost/api/dashboard'));

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe('cached@example.com');
    expect(body.data.fromCache).toBe(true);
    expect(mockRedisClient.set).not.toHaveBeenCalled();
    expect(mockSupabaseClient.rpc).not.toHaveBeenCalled();
  });

  it('loads dashboard data when cache misses', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-2', email: 'miss@example.com' } },
      error: null,
    });

    mockRedisClient.get.mockResolvedValue(null);
    const rpcResponse = {
      data: [
        {
          user_email: 'miss@example.com',
          user_name: 'Miss Cache',
          total_votes: 5,
          total_polls_created: 1,
          active_polls: 1,
          total_votes_on_user_polls: 2,
          participation_score: 10,
          votes_last_30_days: 1,
          polls_created_last_30_days: 1,
          show_elected_officials: true,
          show_quick_actions: true,
          show_recent_activity: true,
          show_engagement_score: true,
          platform_total_polls: 50,
          platform_total_votes: 500,
          platform_active_polls: 5,
          platform_total_users: 200,
        },
      ],
      error: null,
    };
    mockSupabaseClient.rpc.mockResolvedValue(rpcResponse);

    const { GET } = loadRoute();
    const response = await GET(createNextRequest('http://localhost/api/dashboard?cache=false'));

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data.fromCache).toBe(false);
    expect(body.data.user.email).toBe('miss@example.com');
    expect(mockRedisClient.set).not.toHaveBeenCalled();
  });

  it('returns auth error when user not authenticated', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'No session' },
    });

    const { GET } = loadRoute();
    const response = await GET(createNextRequest('http://localhost/api/dashboard'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.code).toBe('AUTH_ERROR');
  });

  it('falls back when optimized RPC fails', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-fallback', email: 'fallback@example.com' } },
      error: null,
    });
    mockRedisClient.get.mockResolvedValue(null);

    mockSupabaseClient.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'rpc failed' },
    });

    // Fallback queries
    mockSupabaseClient.from.mockImplementation((table: string) => {
      switch (table) {
        case 'user_profiles':
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { email: 'fallback@example.com', display_name: 'Fallback' },
              error: null,
            }),
          };
        case 'votes':
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
              in: jest.fn().mockResolvedValue({ count: 0, error: null }),
            }),
          };
        case 'polls':
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        default:
          throw new Error(`Unexpected table: ${table}`);
      }
    });

    const { GET } = loadRoute();
    const response = await GET(createNextRequest('http://localhost/api/dashboard?cache=false'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.fromCache).toBe(false);
    expect(body.data.user.email).toBe('fallback@example.com');
  });
});

