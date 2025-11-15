/**
 * @jest-environment node
 */

import type { NextRequest } from 'next/server';

const mockSupabaseFrom = jest.fn();

jest.mock('@/lib/core/feature-flags', () => ({
  isFeatureEnabled: jest.fn().mockReturnValue(true)
}));

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: () => ({
    from: mockSupabaseFrom
  })
}));

jest.mock('@/lib/api', () => {
  const createResponse = (status: number, payload: unknown) => ({
    status,
    json: async () => payload
  });

  return {
    __esModule: true,
    withErrorHandling: (handler: any) => handler,
    successResponse: (data: unknown) => createResponse(200, { success: true, data }),
    errorResponse: (message: string, status: number) => createResponse(status, { success: false, error: message }),
    validationError: (error: unknown) => createResponse(400, { success: false, error }),
  };
});

const { isFeatureEnabled } = jest.requireMock('@/lib/core/feature-flags') as {
  isFeatureEnabled: jest.Mock;
};

const { GET } = require('@/app/api/analytics/election-notifications/route') as typeof import('@/app/api/analytics/election-notifications/route');

type QueryBuilder = {
  select: jest.Mock;
  in: jest.Mock;
  gte: jest.Mock;
};

const createQueryBuilder = (): QueryBuilder => {
  const builder: QueryBuilder = {
    select: jest.fn(),
    in: jest.fn(),
    gte: jest.fn(),
  };

  builder.select.mockImplementation(() => builder);
  builder.in.mockImplementation(() => builder);
  builder.gte.mockImplementation(() => builder);

  return builder;
};

const buildRequest = (url = 'http://localhost/api'): NextRequest =>
  ({
    url,
    method: 'GET'
  } as unknown as NextRequest);

describe('GET /api/analytics/election-notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isFeatureEnabled.mockReturnValue(true);
  });

  it('returns 403 when analytics feature flag disabled', async () => {
    isFeatureEnabled.mockImplementation((flag: string) => flag !== 'ANALYTICS');
    const response = (await GET(buildRequest())) as Response;

    expect(response.status).toBe(403);
  });

  it('aggregates metrics correctly', async () => {
    const builder = createQueryBuilder();
    const now = new Date().toISOString();
    builder.select.mockReturnValue(builder);
    builder.in.mockReturnValue(builder);
    builder.gte.mockReturnValue({
      data: [
        {
          event_type: 'notifications.election.delivered',
          created_at: now,
          event_data: { source: 'dashboard', election_id: 'e1', division_id: 'd1' }
        },
        {
          event_type: 'notifications.election.delivered',
          created_at: now,
          event_data: { source: 'contact', election_id: 'e1', division_id: 'd1' }
        },
        {
          event_type: 'notifications.election.opened',
          created_at: now,
          event_data: { source: 'dashboard', election_id: 'e1', division_id: 'd1' }
        }
      ],
      error: null
    });

    mockSupabaseFrom.mockImplementation((table: string) =>
      table === 'analytics_events' ? builder : createQueryBuilder()
    );

    const response = (await GET(buildRequest())) as Response;
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.success).toBe(true);
    expect(payload.data.totals.delivered).toBe(2);
    expect(payload.data.totals.opened).toBe(1);
    expect(payload.data.conversionRate).toBe(50);
    expect(payload.data.bySource.find((entry: any) => entry.source === 'dashboard').opened).toBe(1);
  });

  it('handles Supabase errors', async () => {
    const builder = createQueryBuilder();
    builder.select.mockReturnValue(builder);
    builder.in.mockReturnValue(builder);
    builder.gte.mockReturnValue({
      data: null,
      error: { message: 'boom' }
    });

    mockSupabaseFrom.mockImplementation((table: string) =>
      table === 'analytics_events' ? builder : createQueryBuilder()
    );

    const response = (await GET(buildRequest())) as Response;
    expect(response.status).toBe(500);
  });
});

