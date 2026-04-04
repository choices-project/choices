/**
 * @jest-environment node
 *
 * Contract tests for admin vote audit API.
 * GET /api/admin/polls/[id]/vote-audit - returns vote history for investigations.
 */

import { createPostgrestBuilder } from '@/tests/contracts/helpers/postgrest';
import { createNextRequest } from '@/tests/contracts/helpers/request';

jest.mock('@/features/auth/lib/admin-auth', () => ({
  requireAdminOr401: jest.fn(async () => null),
}));

const mockAdminClient: Record<string, unknown> = {
  from: jest.fn(),
};

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseAdminClient: jest.fn(async () => mockAdminClient),
}));

describe('Admin vote audit contract', () => {
  const pollId = '550e8400-e29b-41d4-a716-446655440000';

  const loadRoute = () => {
    let routeModule: { GET: (req: unknown, ctx: { params: Promise<{ id: string }> }) => Promise<Response> };
    jest.isolateModules(() => {
      routeModule = require('@/app/api/admin/polls/[id]/vote-audit/route');
    });
    return routeModule;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockAdminClient.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'polls') {
        return createPostgrestBuilder({
          data: {
            id: pollId,
            voting_method: 'single',
            poll_options: [
              { id: 'opt-1', text: 'Option A', option_text: 'Option A', order_index: 0 },
              { id: 'opt-2', text: 'Option B', option_text: 'Option B', order_index: 1 },
            ],
          },
          error: null,
        });
      }
      if (table === 'votes' || table === 'poll_rankings' || table === 'user_profiles') {
        return createPostgrestBuilder({ data: [], error: null });
      }
      throw new Error(`Unexpected table: ${table}`);
    });
  });

  it('returns vote audit data for admin', async () => {
    const { GET } = loadRoute();
    const request = createNextRequest(`http://localhost/api/admin/polls/${pollId}/vote-audit`);
    const response = await GET(request, { params: Promise.resolve({ id: pollId }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.objectContaining({
        pollId,
        votingMethod: 'single',
        totalEntries: 0,
        entries: [],
      })
    );
  });

  it('returns 401 when requireAdminOr401 blocks', async () => {
    const { requireAdminOr401 } = require('@/features/auth/lib/admin-auth');
    (requireAdminOr401 as jest.Mock).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403 })
    );

    const { GET } = loadRoute();
    const request = createNextRequest(`http://localhost/api/admin/polls/${pollId}/vote-audit`);
    const response = await GET(request, { params: Promise.resolve({ id: pollId }) });

    expect(response.status).toBe(403);
  });
});
