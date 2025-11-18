/* eslint-disable @typescript-eslint/no-empty-function */
/**
 * @jest-environment node
 */

import type { NextResponse } from 'next/server';

import { canAccessAnalytics } from '@/lib/auth/adminGuard';
import { getCached } from '@/lib/cache/analytics-cache';
import { createPostgrestBuilder } from '@/tests/contracts/helpers/postgrest';
import { createNextRequest } from '@/tests/contracts/helpers/request';



jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(async () => mockSupabaseClient),
}));

jest.mock('@/lib/core/services/analytics', () => ({
  AnalyticsService: {
    getInstance: jest.fn(() => mockAnalyticsService),
  },
}));

jest.mock('@/features/analytics/lib/privacyFilters', () => ({
  PrivacyAwareQueryBuilder: jest.fn(() => mockPrivacyBuilder),
  K_ANONYMITY_THRESHOLD: 2,
}));

jest.mock('@/lib/auth/adminGuard', () => ({
  canAccessAnalytics: jest.fn(() => true),
  logAnalyticsAccess: jest.fn(),
  logAnalyticsAccessToDatabase: jest.fn(async () => {}),
}));

jest.mock('@/lib/cache/analytics-cache', () => {
  const actual = jest.requireActual('@/lib/cache/analytics-cache');
  return {
    ...actual,
    getCached: jest.fn(async (_key: string, _ttl: number, fetcher: () => Promise<any>) => ({
      data: await fetcher(),
      fromCache: false,
    })),
    generateCacheKey: jest.fn(() => 'cache-key'),
  };
});

/* eslint-enable @typescript-eslint/no-empty-function */

const mockSupabaseClient: Record<string, any> = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
  rpc: jest.fn(),
};

const mockAnalyticsService = {
  getPollAnalytics: jest.fn(),
};

const mockPrivacyBuilder = {
  getVoteAnalytics: jest.fn(),
  getDemographics: jest.fn(),
};

const isolateRoute = (path: string) => () => {
  let routeModule: any;
  jest.isolateModules(() => {
    // eslint-disable-next-line import/no-dynamic-require
    routeModule = require(path);
  });
  return routeModule;
};

const loadLayoutRoute = isolateRoute('@/app/api/analytics/dashboard/layout/route');
const loadTrendsRoute = isolateRoute('@/app/api/analytics/trends/route');
const loadTrustTiersRoute = isolateRoute('@/app/api/analytics/trust-tiers/route');
const loadTemporalRoute = isolateRoute('@/app/api/analytics/temporal/route');
const loadPollRoute = isolateRoute('@/app/api/analytics/poll/[id]/route');

describe('Analytics contracts', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-user', email: 'admin@example.com', user_metadata: { role: 'admin' } } },
      error: null,
    });
    mockSupabaseClient.from.mockReset();
    mockSupabaseClient.rpc.mockReset();

    mockAnalyticsService.getPollAnalytics.mockReset();
    mockPrivacyBuilder.getVoteAnalytics.mockReset();
    mockPrivacyBuilder.getDemographics.mockReset();
  });

  describe('dashboard layout endpoint', () => {
    it('returns cached layout with stable headers', async () => {
      const layoutBuilder = createPostgrestBuilder({
        data: { dashboard_layout: { id: 'layout-1', widgets: [{ id: 'w1' }] } },
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(layoutBuilder);

      const { GET } = loadLayoutRoute();
      const response: NextResponse = await GET(
        createNextRequest('http://localhost/api/analytics/dashboard/layout?userId=user-1')
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.layout.id).toBe('layout-1');
      expect(response.headers.get('Cache-Control')).toMatch(/max-age=/);
      expect(response.headers.get('ETag')).toBeTruthy();
    });

    it('returns analytics layout read failure when Supabase errors', async () => {
      const failingBuilder = createPostgrestBuilder({
        data: null,
        error: { message: 'boom', code: '500' } as any,
      });
      mockSupabaseClient.from.mockReturnValue(failingBuilder);

      const { GET } = loadLayoutRoute();
      const response = await GET(
        createNextRequest('http://localhost/api/analytics/dashboard/layout?userId=user-2')
      );
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.code).toBe('ANALYTICS_LAYOUT_READ_FAILED');
    });
  });

  describe('trends analytics endpoint', () => {
    it('serves analytics trends with cache headers when authorized', async () => {
      mockPrivacyBuilder.getVoteAnalytics.mockResolvedValue({
        data: [
          { created_at: '2025-11-10T00:00:00.000Z' },
          { created_at: '2025-11-10T12:00:00.000Z' },
        ],
        error: null,
      });

      const { GET } = loadTrendsRoute();
      const response: NextResponse = await GET(
        createNextRequest('http://localhost/api/analytics/trends?range=7d')
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.trends.length).toBeGreaterThan(0);
      expect(response.headers.get('Cache-Control')).toContain('max-age');
      expect(response.headers.get('ETag')).toBeTruthy();
    });

    it('returns forbidden when analytics access denied', async () => {
      (canAccessAnalytics as jest.Mock).mockReturnValueOnce(false);
      const { GET } = loadTrendsRoute();
      const response = await GET(createNextRequest('http://localhost/api/analytics/trends'));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.code).toBe('FORBIDDEN');
    });

    it('returns analytics RPC failure when cache layer rejects', async () => {
      (getCached as jest.Mock).mockRejectedValueOnce(new Error('redis down'));

      const { GET } = loadTrendsRoute();
      const response = await GET(createNextRequest('http://localhost/api/analytics/trends'));
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.code).toBe('ANALYTICS_RPC_FAILED');
    });
  });

  describe('trust tiers analytics endpoint', () => {
    it('renders aggregated tiers and cache headers', async () => {
      mockPrivacyBuilder.getDemographics.mockResolvedValue({
        users: [
          { id: 'u1', trust_tier: 'T3' },
          { id: 'u2', trust_tier: 'T3' },
          { id: 'u3', trust_tier: 'T2' },
        ],
        totalUsers: 3,
      });
      mockPrivacyBuilder.getVoteAnalytics.mockResolvedValue({ data: [], error: null });

      const { GET } = loadTrustTiersRoute();
      const response = await GET(createNextRequest('http://localhost/api/analytics/trust-tiers'));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.tiers.length).toBeGreaterThan(0);
      expect(response.headers.get('ETag')).toBeTruthy();
    });
  });

  describe('temporal analytics endpoint', () => {
    it('returns temporal data with analytics cache headers', async () => {
      mockPrivacyBuilder.getVoteAnalytics.mockResolvedValue({
        data: [{ created_at: '2025-11-10T00:00:00.000Z' }],
        error: null,
      });

      const { GET } = loadTemporalRoute();
      const response = await GET(createNextRequest('http://localhost/api/analytics/temporal'));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.hourly.length).toBe(24);
      expect(response.headers.get('Cache-Control')).toContain('max-age');
    });
  });

  describe('poll analytics endpoint', () => {
    it('wraps poll analytics with cache headers', async () => {
      mockAnalyticsService.getPollAnalytics.mockResolvedValue({
        poll_id: 'poll-1',
        demographic_insights: { updated_at: '2025-11-10T00:00:00.000Z' },
      });

      const { GET } = loadPollRoute();
      const response = await GET(
        createNextRequest('http://localhost/api/analytics/poll/poll-1'),
        { params: { id: 'poll-1' } }
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.poll.poll_id).toBe('poll-1');
      expect(response.headers.get('ETag')).toBeTruthy();
    });

    it('returns analytics poll failure when service throws', async () => {
      mockAnalyticsService.getPollAnalytics.mockRejectedValue(new Error('missing poll'));
      const { GET } = loadPollRoute();
      const response = await GET(
        createNextRequest('http://localhost/api/analytics/poll/poll-404'),
        { params: { id: 'poll-404' } }
      );
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.code).toBe('ANALYTICS_POLL_FAILED');
    });
  });
});


