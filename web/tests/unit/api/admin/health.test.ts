/**
 * @jest-environment node
 */

import type { NextRequest } from 'next/server';

import { GET } from '@/app/api/admin/health/route';

const mockRequireAdminOr401 = jest.fn();
const mockGetSupabaseServerClient = jest.fn();

jest.mock('@/features/auth/lib/admin-auth', () => ({
  requireAdminOr401: (...args: unknown[]) => mockRequireAdminOr401(...args),
}));

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: (...args: unknown[]) => mockGetSupabaseServerClient(...args),
}));

type SupabaseResult<T> = { data: T; error: null | Error };

const result = <T>(data: T, error: null | Error = null): SupabaseResult<T> => ({ data, error });

const buildRequest = (query: string = '') =>
  ({
    url: `http://localhost/api/admin/health${query}`,
  } as unknown as NextRequest);

const buildSupabaseMock = (overrides?: Partial<Record<string, SupabaseResult<any>>>) => {
  const config = {
    pollsMetrics: result([
      { id: 'poll-1', status: 'active' },
      { id: 'poll-2', status: 'closed' },
    ]),
    pollsStatus: result([{ id: 'poll-1', created_at: '2025-11-01T00:00:00.000Z' }]),
    feedbackMetrics: result([
      { id: 'fb-1', status: 'new' },
      { id: 'fb-2', status: 'triaged' },
      { id: 'fb-3', status: 'resolved' },
    ]),
    userProfiles: result([{ id: 'user-1' }]),
    votes: result([{ id: 'vote-1' }]),
    ...overrides,
  };

  const buildLimitBuilder = (key: keyof typeof config) => ({
    limit: jest.fn(() => Promise.resolve(config[key])),
  });

  const supabase = {
    from: jest.fn((table: string) => {
      switch (table) {
        case 'polls':
          return {
            select: jest.fn((fields: string) => {
              if (fields.includes('status')) {
                return Promise.resolve(config.pollsMetrics);
              }
              return buildLimitBuilder('pollsStatus');
            }),
          };
        case 'feedback':
          return {
            select: jest.fn(() => Promise.resolve(config.feedbackMetrics)),
          };
        case 'user_profiles':
          return {
            select: jest.fn(() => buildLimitBuilder('userProfiles')),
          };
        case 'votes':
          return {
            select: jest.fn(() => buildLimitBuilder('votes')),
          };
        default:
          throw new Error(`Unhandled table ${table}`);
      }
    }),
  };

  return supabase;
};

describe('GET /api/admin/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminOr401.mockResolvedValue(null);
    mockGetSupabaseServerClient.mockResolvedValue(buildSupabaseMock());
  });

  it('returns metrics dataset by default', async () => {
    const response = (await GET(buildRequest())) as Response;
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.metadata?.dataset).toBe('metrics');
    expect(payload.data.metrics).toMatchObject({
      total_polls: 2,
      active_polls: 1,
      total_topics: 3,
      system_health: 'healthy',
    });
  });

  it('returns status dataset and 503 when a check fails', async () => {
    mockGetSupabaseServerClient.mockResolvedValue(
      buildSupabaseMock({
        votes: result([], new Error('RLS failure')),
      }),
    );

    const response = (await GET(buildRequest('?type=status'))) as Response;
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.metadata?.dataset).toBe('status');
    expect(payload.data.status.ok).toBe(false);
    expect(
      payload.data.status.checks.some(
        (check: any) => check.name === 'db:rls_probe' && check.ok === false,
      ),
    ).toBe(true);
  });

  it('returns combined payload for type=all', async () => {
    const response = (await GET(buildRequest('?type=all'))) as Response;
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.metadata?.dataset).toBe('all');
    expect(payload.data.metrics).toBeDefined();
    expect(payload.data.status).toBeDefined();
    expect(payload.data.status.ok).toBe(true);
  });
});

