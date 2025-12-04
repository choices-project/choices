/**
 * @jest-environment node
 */

import { createNextRequest } from '@/tests/contracts/helpers/request';

const mockRpc = jest.fn();

const mockSupabaseClient = {
  rpc: mockRpc,
};

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(async () => mockSupabaseClient),
}));

jest.mock('@/lib/rate-limiting/api-rate-limiter', () => ({
  apiRateLimiter: {
    checkLimit: jest.fn(async () => ({ allowed: true, retryAfter: null })),
  },
}));

describe('Civics elections contract', () => {
  const loadRoute = () => {
    let routeModule: any;
    jest.isolateModules(() => {
      routeModule = require('@/app/api/v1/civics/elections/route');
    });
    return routeModule;
  };
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    mockRpc.mockReset();
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
  });

  it('returns upcoming elections', async () => {
    mockRpc.mockResolvedValue({
      data: [{ id: 'election-1', name: 'General Election' }],
      error: null,
    });

    const { GET } = loadRoute();
    const response = await GET(createNextRequest('http://localhost/api/v1/civics/elections?divisions=ocd-division'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.elections).toHaveLength(1);
    expect(mockRpc).toHaveBeenCalledWith('get_upcoming_elections', { divisions: ['ocd-division'] });
  });

  it('returns 500 when supabase config missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    const { GET } = loadRoute();
    const response = await GET(createNextRequest('http://localhost/api/v1/civics/elections'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Supabase configuration missing');
  });

  it('returns 502 when RPC fails', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'rpc failed' },
    });

    const { GET } = loadRoute();
    const response = await GET(createNextRequest('http://localhost/api/v1/civics/elections'));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to load upcoming elections');
  });

  it('returns empty payload with count zero when RPC data is empty', async () => {
    mockRpc.mockResolvedValue({
      data: [],
      error: null,
    });

    const { GET } = loadRoute();
    const response = await GET(createNextRequest('http://localhost/api/v1/civics/elections'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.count).toBe(0);
    expect(body.data.elections).toEqual([]);
  });

  it('parses comma-delimited divisions parameter into array', async () => {
    mockRpc.mockResolvedValue({
      data: [],
      error: null,
    });

    const { GET } = loadRoute();
    const response = await GET(
      createNextRequest('http://localhost/api/v1/civics/elections?divisions=ocd-1, ocd-2'),
    );
    await response.json();

    expect(mockRpc).toHaveBeenCalledWith('get_upcoming_elections', { divisions: ['ocd-1', 'ocd-2'] });
  });
});

