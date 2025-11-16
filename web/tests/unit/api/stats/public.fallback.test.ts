/**
 * @jest-environment node
 */

const mockGetSupabaseServerClient = jest.fn();

jest.mock('@/lib/api', () => {
  const createResponse = (status, payload) => ({
    status,
    json: async () => payload,
  });

  return {
    __esModule: true,
    withErrorHandling: (handler) => handler,
    successResponse: (data, metadata, status = 200) =>
      createResponse(status, { success: true, data, metadata }),
  };
});

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: () => mockGetSupabaseServerClient(),
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('GET /api/stats/public fallbacks', () => {
  let GET;

  const loadModule = () => {
    jest.isolateModules(() => {
      ({ GET } = require('@/app/api/stats/public/route'));
    });
  };

  beforeEach(() => {
    jest.resetModules();
    mockGetSupabaseServerClient.mockReset();
    loadModule();
  });

  it('returns zeroed metrics when Supabase is unavailable', async () => {
    mockGetSupabaseServerClient.mockReturnValue(undefined);

    const response = await GET({});
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual({
      totalPolls: 0,
      totalVotes: 0,
      activeUsers: 0,
    });
    expect(body.metadata).toMatchObject({
      source: 'mock',
      mode: 'degraded',
      window: '30d',
    });
  });
});

