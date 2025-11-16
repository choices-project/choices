/**
 * District Heatmap API Tests
 * 
 * Tests the district-based civic engagement heatmap API:
 * - Returns district data (not geohashes)
 * - K-anonymity enforced
 * - State/level filtering works
 * - Privacy-safe aggregation
 * 
 * Created: November 5, 2025
 * Status: ✅ Testing district-based implementation
 */

import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';
import type { NextRequest, NextResponse } from 'next/server';

type CacheResolver = () => Promise<unknown>;
type CacheEntry = { data: unknown; fromCache: boolean };

type SupabaseSelectFn = jest.MockedFunction<() => Promise<{ data: unknown; error: unknown }>>;
type SupabaseClientStub = {
  auth: {
    getUser: jest.MockedFunction<() => Promise<{ data: { user: { id: string; role: string } }; error: null }>>;
  };
  from: jest.MockedFunction<(table: string) => { select: SupabaseSelectFn }>;
};

const mockGetSupabaseServerClient = jest.fn<() => Promise<SupabaseClientStub>>();
jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: mockGetSupabaseServerClient,
}));

const mockCanAccessAnalytics = jest.fn<(request: NextRequest, skipAudit?: boolean) => boolean>();
const mockLogAnalyticsAccess = jest.fn<(request: NextRequest, resource: string, granted: boolean) => Promise<void>>();
jest.mock('@/lib/auth/adminGuard', () => ({
  canAccessAnalytics: mockCanAccessAnalytics,
  logAnalyticsAccess: mockLogAnalyticsAccess,
}));

const mockGetCached = jest.fn<(key: string, ttl: number, resolver: CacheResolver) => Promise<CacheEntry>>();
const mockGenerateCacheKey = jest.fn((prefix: string, params: Record<string, unknown>) =>
  `${prefix}-${JSON.stringify(params)}`
);
jest.mock('@/lib/cache/analytics-cache', () => ({
  getCached: mockGetCached,
  CACHE_TTL: { DISTRICT_HEATMAP: 900 },
  CACHE_PREFIX: { DISTRICT_HEATMAP: 'district-heatmap' },
  generateCacheKey: mockGenerateCacheKey,
}));

const mockDemographics = jest.fn<
  () => Promise<{
    users: Array<{
      id: string;
      demographics: { location: { state: string; district: string } };
    }>;
  }>
>();
jest.mock('@/features/analytics/lib/privacyFilters', () => ({
  PrivacyAwareQueryBuilder: jest.fn().mockImplementation(() => ({
    getDemographics: mockDemographics,
  })),
  K_ANONYMITY_THRESHOLD: 5,
}));

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
jest.mock('@/lib/utils/logger', () => ({ logger: mockLogger }));

let GET: (request: NextRequest) => Promise<NextResponse>;

const buildSupabaseStub = (): SupabaseClientStub => {
  const selectMocks: Record<string, SupabaseSelectFn> = {
    civic_actions: jest.fn(async () => ({
      data: [{ id: '1', target_district: 'CA-12' }],
      error: null,
    })),
    representatives_core: jest.fn(async () => ({
      data: [{ id: '1', district: 'CA-12' }],
      error: null,
    })),
  };

  return {
    auth: {
      getUser: jest.fn(async () => ({
        data: { user: { id: 'admin-user', role: 'admin' } },
        error: null,
      })),
    },
    from: jest.fn((table: string) => ({
      select:
        selectMocks[table] ??
        jest.fn(async () => ({ data: [], error: null })) as SupabaseSelectFn,
    })),
  };
};

beforeAll(async () => {
  const module = await import('@/app/api/v1/civics/heatmap/route');
  GET = module.GET;
});

const buildRequest = (url: string): NextRequest => {
  const request = new Request(url);
  Object.assign(request, { nextUrl: new URL(url) });
  return request as unknown as NextRequest;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockCanAccessAnalytics.mockReturnValue(true);
  mockLogAnalyticsAccess.mockResolvedValue(undefined);
  mockDemographics.mockResolvedValue({
    users: [
      {
        id: 'user-1',
        demographics: {
          location: {
            state: 'CA',
            district: '12',
          },
        },
      },
      {
        id: 'user-2',
        demographics: {
          location: {
            state: 'CA',
            district: '12',
          },
        },
      },
      {
        id: 'user-3',
        demographics: {
          location: {
            state: 'CA',
            district: '12',
          },
        },
      },
      {
        id: 'user-4',
        demographics: {
          location: {
            state: 'CA',
            district: '12',
          },
        },
      },
      {
        id: 'user-5',
        demographics: {
          location: {
            state: 'CA',
            district: '12',
          },
        },
      },
    ],
  });
  mockGetCached.mockImplementation(async (_key, _ttl, resolver) => ({
    data: await resolver(),
    fromCache: false,
  }));
  mockGetSupabaseServerClient.mockResolvedValue(buildSupabaseStub());
});

describe('GET /api/v1/civics/heatmap', () => {
  it('returns aggregated district heatmap data with cache metadata', async () => {
    const response = await GET(buildRequest('http://localhost/api/v1/civics/heatmap?state=CA&level=federal'));
    const payload = await response.json();

    expect(payload.success).toBe(true);
    expect(payload.data?.heatmap).toHaveLength(1);
    expect(payload.data?.heatmap?.[0]).toMatchObject({
      district_id: 'CA-12',
      state: 'CA',
      level: 'federal',
    });
    expect(payload.metadata?.cache).toMatchObject({ hit: false });
    expect(mockCanAccessAnalytics).toHaveBeenCalledWith(expect.any(Object), false);
    expect(mockLogAnalyticsAccess).toHaveBeenCalledWith(expect.any(Object), 'district-heatmap-api', true);
  });

  it('honors filters and propagates cache key generation', async () => {
    await GET(buildRequest('http://localhost/api/v1/civics/heatmap?state=TX&level=state&min_count=7'));

    expect(mockGenerateCacheKey).toHaveBeenCalledWith('district-heatmap', {
      state: 'TX',
      level: 'state',
    });
    expect(mockGetCached).toHaveBeenCalledWith(expect.any(String), 900, expect.any(Function));
  });

  it('returns forbidden when user lacks analytics access', async () => {
    mockCanAccessAnalytics.mockReturnValue(false);

    const response = await GET(buildRequest('http://localhost/api/v1/civics/heatmap'));
    const payload = await response.json();

    expect(payload.error).toMatch(/Unauthorized/);
    expect(mockLogAnalyticsAccess).toHaveBeenCalledWith(expect.any(Object), 'district-heatmap-api', false);
  });

  it('returns empty dataset when Supabase RPC reports an error', async () => {
    const supabaseWithError = buildSupabaseStub();
    supabaseWithError.from = jest
      .fn<(table: string) => { select: SupabaseSelectFn }>(() => ({
        select: jest.fn(async () => ({ data: [], error: null })) as SupabaseSelectFn,
      }));
    mockGetSupabaseServerClient.mockResolvedValueOnce(supabaseWithError);
    mockGetCached.mockImplementationOnce(async (_key, _ttl, _resolver) => ({
      data: {
        ok: true,
        heatmap: [],
        k_anonymity: 5,
        generated_at: new Date().toISOString(),
        warning: 'fallback',
      },
      fromCache: true,
    }));

    const response = await GET(buildRequest('http://localhost/api/v1/civics/heatmap'));
    const payload = await response.json();

    expect(payload.data?.heatmap).toEqual([]);
    expect(payload.metadata?.cache?.hit).toBe(true);
  });
});

