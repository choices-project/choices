/**
 * @jest-environment node
 */

import { createPostgrestBuilder } from '@/tests/contracts/helpers/postgrest';
import { createNextRequest } from '@/tests/contracts/helpers/request';

const mockSupabaseClient: Record<string, any> = {
  from: jest.fn(),
};

const mockTrendingTracker = {
  getTrendingHashtags: jest.fn(),
  getHashtagAnalytics: jest.fn(),
  trackMultipleHashtags: jest.fn(),
};

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(async () => mockSupabaseClient),
}));

jest.mock('@/lib/trending/TrendingHashtags', () => ({
  trendingHashtagsTracker: mockTrendingTracker,
}));

describe('Trending API contract', () => {
  const loadRoute = () => {
    let routeModule: any;
    jest.isolateModules(() => {
      routeModule = require('@/app/api/trending/route');
    });
    return routeModule;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient.from.mockReset();
    Object.values(mockTrendingTracker).forEach((fn: any) => fn.mockReset());
  });

  it('returns trending polls', async () => {
    const pollsBuilder = createPostgrestBuilder({
      data: [
        {
          id: 'poll-1',
          title: 'Budget allocation',
          description: 'Allocate funds',
          category: 'civics',
          created_at: '2025-11-14T00:00:00.000Z',
          end_date: '2025-11-20T00:00:00.000Z',
          total_votes: 25,
          status: 'active',
          options: [{ id: 'opt-1', text: 'Yes', votes: 15 }],
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
    const response = await GET(createNextRequest('http://localhost/api/trending?type=polls&limit=1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.polls).toHaveLength(1);
  });

  it('returns trending hashtags via tracker', async () => {
    mockTrendingTracker.getTrendingHashtags.mockResolvedValue([
      { hashtag: '#civics', score: 90 },
    ]);

    const { GET } = loadRoute();
    const response = await GET(createNextRequest('http://localhost/api/trending?type=hashtags&limit=1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.hashtags).toHaveLength(1);
    expect(mockTrendingTracker.getTrendingHashtags).toHaveBeenCalledWith(1);
  });

  it('returns validation error for invalid type', async () => {
    const { GET } = loadRoute();
    const response = await GET(createNextRequest('http://localhost/api/trending?type=unknown'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('tracks hashtags via POST', async () => {
    const metadata = { region: 'bay-area' };
    const { POST } = loadRoute();
    const response = await POST(
      createNextRequest('http://localhost/api/trending?type=hashtags', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          hashtags: ['#budget'],
          userId: 'user-1',
          source: 'user-action',
          metadata,
        }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockTrendingTracker.trackMultipleHashtags).toHaveBeenCalledWith(
      ['#budget'],
      'user-1',
      'user-action',
      metadata,
    );
  });

  it('requires hashtags array on POST', async () => {
    const { POST } = loadRoute();
    const response = await POST(
      createNextRequest('http://localhost/api/trending?type=hashtags', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userId: 'user-1',
        }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 500 when tracker fails to record hashtags', async () => {
    mockTrendingTracker.trackMultipleHashtags.mockRejectedValue(new Error('tracker down'));

    const { POST } = loadRoute();
    const response = await POST(
      createNextRequest('http://localhost/api/trending?type=hashtags', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          hashtags: ['#budget'],
          userId: 'user-1',
        }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to track hashtags');
  });
});

