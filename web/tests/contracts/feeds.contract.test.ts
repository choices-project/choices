/**
 * @jest-environment node
 */

import { createPostgrestBuilder } from '@/tests/contracts/helpers/postgrest';
import { createNextRequest } from '@/tests/contracts/helpers/request';

const mockLogger = {
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

jest.mock('@/lib/utils/logger', () => ({
  __esModule: true,
  logger: mockLogger,
  default: mockLogger,
  devLog: jest.fn(),
  LogLevel: { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 },
  logError: jest.fn(),
}));

const mockSupabaseClient: Record<string, any> = {
  from: jest.fn(),
};

const mockRateLimiter = {
  checkLimit: jest.fn(),
};

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(async () => mockSupabaseClient),
}));

jest.mock('@/lib/rate-limiting/api-rate-limiter', () => ({
  apiRateLimiter: mockRateLimiter,
}));

describe('Feeds API contract', () => {
  const loadRoute = () => {
    let routeModule: any;
    jest.isolateModules(() => {
      routeModule = require('@/app/api/feeds/route');
    });
    return routeModule;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient.from.mockReset();
    mockRateLimiter.checkLimit.mockResolvedValue({ allowed: true });
    mockLogger.warn.mockReset();
  });

  it('returns combined feed items', async () => {
    const pollsBuilder = createPostgrestBuilder({
      data: [
        {
          id: 'poll-1',
          title: 'Budget allocation',
          description: 'Allocate funds',
          category: 'civics',
          total_votes: 12,
          status: 'active',
          created_at: '2025-11-13T00:00:00.000Z',
          hashtags: ['budget'],
          primary_hashtag: 'budget',
          engagement_score: 10,
          participation_rate: 5,
          total_views: 20,
          participation: 10,
          is_trending: true,
          trending_score: 50,
          is_featured: false,
          is_verified: false,
          auto_lock_at: null,
          moderation_status: 'approved',
          privacy_level: 'public',
          poll_options: [{ id: 'opt-1', text: 'Yes', vote_count: 10 }],
        },
      ],
      error: null,
    });

    const civicActionsBuilder = createPostgrestBuilder({
      data: [
        {
          id: 'action-1',
          title: 'Sign petition',
          description: 'Support local action',
          action_type: 'petition',
          target_district: 'CA-12',
          target_state: 'CA',
          status: 'active',
          created_at: '2025-11-12T00:00:00.000Z',
          current_signatures: 200,
          required_signatures: 500,
        },
      ],
      error: null,
    });

    let fromCalls = 0;
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'polls') {
        return pollsBuilder;
      }
      if (table === 'civic_actions') {
        fromCalls += 1;
        return civicActionsBuilder;
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { GET } = loadRoute();
    const response = await GET(createNextRequest('http://localhost/api/feeds?limit=5'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.feeds).toHaveLength(2);
    expect(body.data.count).toBe(2);
    expect(body.data.pagination).toEqual(
      expect.objectContaining({
        total: 2,
        limit: 5,
        offset: 0,
        hasMore: false,
      }),
    );
    expect(body.data.filters.sort).toBe('trending');
    expect(mockRateLimiter.checkLimit).toHaveBeenCalledWith(
      '127.0.0.1',
      '/api/feeds',
      expect.objectContaining({ maxRequests: 100, windowMs: 60000 }),
    );
  });

  it('enforces rate limit and returns error when exceeded', async () => {
    mockRateLimiter.checkLimit.mockResolvedValue({ allowed: false });

    const { GET } = loadRoute();
    const response = await GET(createNextRequest('http://localhost/api/feeds'));
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.success).toBe(false);
    expect(body.code).toBe('RATE_LIMIT');
  });

  it('returns error when polls query fails', async () => {
    const failingPolls = createPostgrestBuilder({
      data: [],
      error: { message: 'poll query failed' } as any,
    });

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'polls') {
        return failingPolls;
      }
      return createPostgrestBuilder({ data: [], error: null });
    });

    const { GET } = loadRoute();
    const response = await GET(createNextRequest('http://localhost/api/feeds'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch feed items');
  });

  it('returns polls even when civic actions query fails and logs warning', async () => {
    const pollsBuilder = createPostgrestBuilder({
      data: [
        {
          id: 'poll-1',
          title: 'Budget allocation',
          description: 'Allocate funds',
          category: 'civics',
          total_votes: 12,
          status: 'active',
          created_at: '2025-11-13T00:00:00.000Z',
          hashtags: ['budget'],
          poll_options: [],
        },
      ],
      error: null,
    });

    const civicActionsBuilder = createPostgrestBuilder({
      data: [],
      error: { message: 'civic actions failed' } as any,
    });

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'polls') {
        return pollsBuilder;
      }
      if (table === 'civic_actions') {
        return civicActionsBuilder;
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { GET } = loadRoute();
    const response = await GET(createNextRequest('http://localhost/api/feeds'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.feeds).toHaveLength(1);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Error fetching civic actions for feeds',
      expect.objectContaining({
        error: expect.objectContaining({ message: 'civic actions failed' }),
      }),
    );
  });
});

