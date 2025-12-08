/**
 * @jest-environment node
 */

import { createPostgrestBuilder } from '@/tests/contracts/helpers/postgrest';
import { createNextRequest } from '@/tests/contracts/helpers/request';

const mockSupabaseClient: Record<string, any> = {
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

jest.mock('@/lib/rate-limiting/api-rate-limiter', () => ({
  apiRateLimiter: {
    checkLimit: jest.fn(async () => ({ allowed: true, retryAfter: null })),
  },
}));

describe('Civics by-state API contract', () => {
  const loadRoute = () => {
    let routeModule: any;
    jest.isolateModules(() => {
      routeModule = require('@/app/api/v1/civics/by-state/route');
    });
    return routeModule;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient.from.mockReset();
    mockRedisClient.get.mockReset();
    mockRedisClient.set.mockReset();
    // Mock Redis to return null (cache miss) by default
    mockRedisClient.get.mockResolvedValue(null);
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
  });

  it('returns helper envelope for representative lookup', async () => {
    const reps = [
      {
        id: 'rep-1',
        name: 'Rep Example',
        office: 'Federal',
        level: 'federal',
        jurisdiction: 'CA',
        district: 'CA-12',
        party: 'Independent',
        last_updated: '2025-11-14T00:00:00.000Z',
        representative_divisions: [
          { division_id: 'ocd-division/country:us/state:ca/cd:12' },
        ],
      },
    ];

    mockSupabaseClient.from.mockImplementation((table: string) => {
      switch (table) {
        case 'civics_representatives':
          return createPostgrestBuilder({ data: reps, error: null });
        case 'civics_fec_minimal':
        case 'civics_votes_minimal':
          return createPostgrestBuilder({ data: [], error: null });
        default:
          throw new Error(`Unexpected table ${table}`);
      }
    });

    const { GET } = loadRoute();
    const request = createNextRequest('http://localhost/api/v1/civics/by-state?state=CA&level=federal');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data.representatives).toHaveLength(1);
    expect(body.data.representatives[0].id).toBe('rep-1');
  });

  it('validates required state parameter', async () => {
    const { GET } = loadRoute();
    const response = await GET(createNextRequest('http://localhost/api/v1/civics/by-state'));

    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.details.state).toBe('State parameter is required');
  });

  it('returns 502 when Supabase query fails', async () => {
    const failingBuilder = createPostgrestBuilder({
      data: [],
      error: { message: 'query failed' } as any,
    });

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'civics_representatives') {
        return failingBuilder;
      }
      return createPostgrestBuilder({ data: [], error: null });
    });

    const { GET } = loadRoute();
    const response = await GET(
      createNextRequest('http://localhost/api/v1/civics/by-state?state=CA'),
    );

    const body = await response.json();
    expect(response.status).toBe(502);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to load representatives');
    expect(body.details.reason).toBe('query failed');
  });

  it('filters response when fields/include query params provided', async () => {
    const reps = [
      {
        id: 'rep-1',
        name: 'Rep Example',
        office: 'Federal',
        level: 'federal',
        jurisdiction: 'CA',
        district: 'CA-12',
        party: 'Independent',
        last_updated: '2025-11-14T00:00:00.000Z',
        representative_divisions: [{ division_id: 'ocd-division/country:us/state:ca/cd:12' }],
      },
    ];

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'civics_representatives') {
        return createPostgrestBuilder({ data: reps, error: null });
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const { GET } = loadRoute();
    const response = await GET(
      createNextRequest(
        'http://localhost/api/v1/civics/by-state?state=CA&fields=name,office&include=divisions',
      ),
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.representatives[0]).toEqual({
      name: 'Rep Example',
      office: 'Federal',
    });
    expect(body.metadata.fields).toEqual(['name', 'office']);
    expect(body.metadata.include).toEqual(['divisions']);
  });
});

