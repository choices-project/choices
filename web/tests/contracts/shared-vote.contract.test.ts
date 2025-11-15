/**
 * @jest-environment node
 */

import { createNextRequest } from '@/tests/contracts/helpers/request';

const mockSupabaseClient: Record<string, any> = {
  from: jest.fn(),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

describe('Shared Vote API contract', () => {
  const loadRoute = () => {
    let routeModule: any;
    jest.isolateModules(() => {
      routeModule = require('@/app/api/shared/vote/route');
    });
    return routeModule;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient.from.mockReset();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
  });

  it('records anonymous vote with helper envelope', async () => {
    const pollBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'poll-shared', is_public: true, is_shareable: true },
        error: null,
      }),
    };

    const optionBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'option-1' },
        error: null,
      }),
    };

    const voteCheckBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    };

    const insertVoteBuilder = {
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'vote-123' },
            error: null,
          }),
        }),
      }),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      switch (table) {
        case 'polls':
          return pollBuilder;
        case 'poll_options':
          return optionBuilder;
        case 'votes':
          if (!voteCheckBuilder.select.mock.calls.length) {
            return voteCheckBuilder;
          }
          return insertVoteBuilder;
        default:
          throw new Error(`Unexpected table ${table}`);
      }
    });

    const { POST } = loadRoute();
    const response = await POST(
      createNextRequest('http://localhost/api/shared/vote', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          poll_id: 'poll-shared',
          option_id: 'option-1',
          voter_session: 'session-xyz',
        }),
      }),
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.voteId).toBe('vote-123');
  });
});

