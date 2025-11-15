/**
 * @jest-environment node
 */

import { createNextRequest } from '@/tests/contracts/helpers/request';

const mockSupabaseClient: Record<string, any> = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
};

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(async () => mockSupabaseClient),
}));

describe('Polls API contract', () => {
  const loadRoute = () => {
    let routeModule: any;
    jest.isolateModules(() => {
      routeModule = require('@/app/api/polls/route');
    });
    return routeModule;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient.from.mockReset();
    mockSupabaseClient.auth.getUser.mockReset();
  });

  it('returns helper envelope for GET polls', async () => {
    const pollsData = [
      {
        id: 'poll-1',
        title: 'Budget allocation',
        description: 'Choose allocation',
        category: 'civics',
        status: 'active',
        total_votes: 5,
        created_at: '2025-11-13T00:00:00.000Z',
        created_by: 'user-1',
        tags: ['budget'],
      },
    ];

    const pollsBuilder: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      overlaps: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      then: (resolve: (value: { data: unknown; error: null; count: number }) => void) =>
        Promise.resolve({ data: pollsData, error: null, count: pollsData.length }).then(resolve),
      catch: () => Promise.resolve(),
    };

    const profilesBuilder = {
      select: jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({
          data: [
            {
              user_id: 'user-1',
              username: 'author',
              display_name: 'Author Name',
              is_admin: false,
            },
          ],
          error: null,
        }),
      }),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      switch (table) {
        case 'polls':
          return pollsBuilder;
        case 'user_profiles':
          return profilesBuilder;
        default:
          throw new Error(`Unexpected table: ${table}`);
      }
    });

    const { GET } = loadRoute();
    const response = await GET(createNextRequest('http://localhost/api/polls?limit=1'));

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data.polls).toHaveLength(1);
    expect(body.metadata.pagination.total).toBe(1);
  });

  it('creates a poll via POST', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-creator' } },
      error: null,
    });

    const pollsInsertBuilder = {
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'poll-new',
              title: 'Neighborhood Feedback',
              created_by: 'user-creator',
              poll_settings: {},
              auto_lock_at: null,
              moderation_status: 'approved',
              category: 'general',
            },
            error: null,
          }),
        }),
      }),
    };

    const pollOptionsBuilder = {
      insert: jest.fn().mockResolvedValue({ error: null }),
    };

    const analyticsEventsBuilder = {
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'analytics-1' },
            error: null,
          }),
        }),
      }),
    };

    const analyticsEventDataBuilder = {
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      switch (table) {
        case 'polls':
          return pollsInsertBuilder;
        case 'poll_options':
          return pollOptionsBuilder;
        case 'analytics_events':
          return analyticsEventsBuilder;
        case 'analytics_event_data':
          return analyticsEventDataBuilder;
        default:
          throw new Error(`Unexpected table: ${table}`);
      }
    });

    const { POST } = loadRoute();
    const response = await POST(
      createNextRequest('http://localhost/api/polls', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Neighborhood Feedback',
          question: 'What should we improve first?',
          options: ['Parks', 'Transit'],
          description: 'Gather input',
        }),
      }),
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('poll-new');
  });

  it('returns validation error when required fields missing', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-creator' } },
      error: null,
    });

    const { POST } = loadRoute();
    const response = await POST(
      createNextRequest('http://localhost/api/polls', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Incomplete poll',
          options: ['A', 'B'],
        }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('propagates insert errors when Supabase fails', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-creator' } },
      error: null,
    });

    const failingInsertBuilder = {
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'insert failed' },
          }),
        }),
      }),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'polls') {
        return failingInsertBuilder;
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { POST } = loadRoute();
    const response = await POST(
      createNextRequest('http://localhost/api/polls', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Neighborhood Feedback',
          question: 'What should we improve first?',
          options: ['Parks', 'Transit'],
        }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to create poll');
  });
});

