/**
 * @jest-environment node
 *
 * Regression: client sends ?page=2 but API previously ignored it (offset stayed 0),
 * causing infinite load-more loops on /polls and a frozen UI.
 */

import { createNextRequest } from '@/tests/contracts/helpers/request';

const mockSupabaseClient: Record<string, unknown> = {
  from: jest.fn(),
  auth: { getUser: jest.fn() },
};

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(async () => mockSupabaseClient),
}));

describe('GET /api/polls — page query maps to offset', () => {
  const loadRoute = () => {
    let routeModule: { GET: (req: Request) => Promise<Response> };
    jest.isolateModules(() => {
      routeModule = require('@/app/api/polls/route');
    });
    return routeModule!;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockSupabaseClient.from as jest.Mock).mockReset();
  });

  it('uses page=2 as offset 20 when limit=20', async () => {
    const pollsBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      overlaps: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      then: (resolve: (value: { data: unknown[]; error: null; count: number }) => void) =>
        Promise.resolve({ data: [], error: null, count: 40 }).then(resolve),
    };

    const profilesBuilder = {
      select: jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    };

    (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'polls') return pollsBuilder;
      if (table === 'user_profiles') return profilesBuilder;
      throw new Error(`Unexpected table: ${table}`);
    });

    const { GET } = loadRoute();
    const response = await GET(
      createNextRequest('http://localhost/api/polls?sort=newest&view_mode=list&page=2&limit=20'),
    );

    expect(response.status).toBe(200);
    expect(pollsBuilder.range).toHaveBeenCalledWith(20, 39);
  });
});
