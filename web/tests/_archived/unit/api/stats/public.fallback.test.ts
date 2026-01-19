/**
 * @jest-environment node
 */

export {};

const mockGetSupabaseServerClient = jest.fn();

jest.mock('@/lib/api', () => {
  const createResponse = (status: number, payload: unknown) => ({
    status,
    json: async () => payload,
  });

  return {
    __esModule: true,
    withErrorHandling: (handler: (request: Request) => Promise<Response>) => handler,
    successResponse: (data: unknown, metadata: unknown, status: number = 200) =>
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
  let GET: (request: Request) => Promise<Response>;

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

    const response = await GET(new Request('http://localhost/api/stats/public'));
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

