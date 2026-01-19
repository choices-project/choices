/**
 * @jest-environment node
 */

import { createPostgrestBuilder } from '@/tests/contracts/helpers/postgrest';
import { createNextRequest } from '@/tests/contracts/helpers/request';

const mockSupabaseClient: Record<string, any> = {
  from: jest.fn(),
};

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(async () => mockSupabaseClient),
}));

describe('Demographics API contract', () => {
  const loadRoute = () => {
    let routeModule: any;
    jest.isolateModules(() => {
      routeModule = require('@/app/api/demographics/route');
    });
    return routeModule;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient.from.mockReset();
  });

  it('returns demographics payload with recent polls/votes', async () => {
    const userProfilesBuilder = createPostgrestBuilder({
      data: [
        {
          id: 'profile-1',
          user_id: 'user-1',
          username: 'demo',
          email: 'demo@example.com',
          trust_tier: 'T1',
          created_at: '2025-11-14T00:00:00.000Z',
          updated_at: '2025-11-14T00:00:00.000Z',
          avatar_url: null,
          bio: '',
          is_active: true,
        },
      ],
      error: null,
    });

    const pollsBuilder = createPostgrestBuilder({
      data: [
        {
          id: 'poll-1',
          title: 'Budget allocation',
          total_votes: 12,
          created_at: '2025-11-13T00:00:00.000Z',
        },
      ],
      error: null,
    });

    const votesBuilder = createPostgrestBuilder({
      data: [
        {
          poll_id: 'poll-1',
          created_at: '2025-11-14T00:00:00.000Z',
        },
      ],
      error: null,
    });

    mockSupabaseClient.from.mockImplementation((table: string) => {
      switch (table) {
        case 'user_profiles':
          return userProfilesBuilder;
        case 'polls':
          return pollsBuilder;
        case 'votes':
          return votesBuilder;
        default:
          throw new Error(`Unexpected table: ${table}`);
      }
    });

    const { GET } = loadRoute();
    const response = await GET(createNextRequest('http://localhost/api/demographics'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.totalUsers).toBe(1);
    expect(body.data.recentPolls).toHaveLength(1);
    expect(body.data.recentVotes).toHaveLength(1);
  });

  it('returns 502 when user profile query fails', async () => {
    const failingBuilder = createPostgrestBuilder({
      data: [],
      error: { message: 'user query failed' } as any,
    });

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        return failingBuilder;
      }
      return createPostgrestBuilder({ data: [], error: null });
    });

    const { GET } = loadRoute();
    const response = await GET(createNextRequest('http://localhost/api/demographics'));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to load user demographics');
    expect(body.details.reason).toBe('user query failed');
  });
});

