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

describe('Polls trending API contract', () => {
  const loadRoute = () => {
    let routeModule: any;
    jest.isolateModules(() => {
      routeModule = require('@/app/api/polls/trending/route');
    });
    return routeModule;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient.from.mockReset();
  });

  it('returns trending polls for valid limit', async () => {
    const pollsBuilder = createPostgrestBuilder({
      data: [
        {
          id: 'poll-1',
          title: 'Budget allocation',
          description: 'Allocate funds',
          category: 'civics',
          created_at: '2025-11-14T00:00:00.000Z',
          end_date: '2025-11-20T00:00:00.000Z',
          total_votes: 10,
          options: [{ id: 'opt-1', text: 'Yes', votes: 7 }],
        },
      ],
      error: null,
    });

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'polls') {
        return pollsBuilder;
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { GET } = loadRoute();
    const response = await GET(createNextRequest('http://localhost/api/polls/trending?limit=3'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.polls).toHaveLength(1);
    expect(body.metadata.pagination.limit).toBe(3);
  });

  it('validates limit parameter', async () => {
    const { GET } = loadRoute();
    const response = await GET(createNextRequest('http://localhost/api/polls/trending?limit=abc'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('propagates Supabase errors', async () => {
    const failingBuilder = createPostgrestBuilder({
      data: [],
      error: { message: 'query failed' } as any,
    });

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'polls') {
        return failingBuilder;
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { GET } = loadRoute();
    const response = await GET(createNextRequest('http://localhost/api/polls/trending?limit=5'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch trending polls');
  });

  it('emits pagination metadata when limit is below available rows', async () => {
    const pollsBuilder = createPostgrestBuilder({
      data: [
        {
          id: 'poll-1',
          title: 'Budget allocation',
          description: 'Allocate funds',
          category: 'civics',
          created_at: '2025-11-14T00:00:00.000Z',
          end_date: '2025-11-20T00:00:00.000Z',
          total_votes: 10,
          options: [{ id: 'opt-1', text: 'Yes', votes: 7 }],
        },
      ],
      error: null,
    });

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'polls') {
        return pollsBuilder;
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { GET } = loadRoute();
    const response = await GET(createNextRequest('http://localhost/api/polls/trending?limit=1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.metadata.pagination.hasMore).toBe(true);
    expect(body.metadata.pagination.totalPages).toBe(1);
  });
});

