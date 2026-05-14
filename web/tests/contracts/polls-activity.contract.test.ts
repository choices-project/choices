/**
 * @jest-environment node
 *
 * Contract tests for GET /api/polls/[id]/activity (sparkline daily counts).
 *
 * Activity charts on the poll detail page must read from the right source
 * per voting method. For ranked-choice polls that source is `poll_rankings`;
 * for every other method it is `votes`. Like the rest of the polls API,
 * activity has to handle both stored aliases of voting_method.
 */

import { createPostgrestBuilder } from '@/tests/contracts/helpers/postgrest';
import { createNextRequest } from '@/tests/contracts/helpers/request';

const mockLogger = {
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

jest.mock('@/lib/utils/logger', () => ({
  __esModule: true,
  logger: mockLogger,
  default: mockLogger,
  devLog: jest.fn(),
  LogLevel: { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 },
  logError: jest.fn(),
}));

const mockAdminClient: Record<string, unknown> = { from: jest.fn() };
jest.mock('@/utils/supabase/server', () => ({
  getSupabaseAdminClient: jest.fn(async () => mockAdminClient),
}));

const POLL_ID = 'af07ccf3-0c5c-41b3-8261-b91a76a02b0d';

const mountRoute = () => {
  let routeModule: { GET: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response> };
  jest.isolateModules(() => {
    routeModule = require('@/app/api/polls/[id]/activity/route');
  });
  return routeModule;
};

const call = async () => {
  const { GET } = mountRoute();
  const request = createNextRequest(`http://localhost/api/polls/${POLL_ID}/activity`);
  const response = await GET(request, { params: Promise.resolve({ id: POLL_ID }) });
  return { response, body: await response.json() };
};

const stubTables = (handlers: Record<string, () => any>) => {
  (mockAdminClient.from as jest.Mock).mockImplementation((table: string) => {
    const handler = handlers[table];
    if (!handler) throw new Error(`Unexpected table in activity test: ${table}`);
    return handler();
  });
};

describe('Poll activity API contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockAdminClient.from as jest.Mock).mockReset();
  });

  it('404s when the poll is not public', async () => {
    stubTables({
      polls: () => createPostgrestBuilder({ data: null, error: null }),
    });

    const { response } = await call();
    expect(response.status).toBe(404);
  });

  describe.each([
    ['ranked', 'short form'],
    ['ranked_choice', 'long form — regression target'],
  ])('voting_method=%s (%s)', (votingMethod) => {
    it('reads daily counts from poll_rankings', async () => {
      const today = new Date().toISOString();
      stubTables({
        polls: () =>
          createPostgrestBuilder({
            data: { id: POLL_ID, is_public: true, voting_method: votingMethod },
            error: null,
          }),
        poll_rankings: () =>
          createPostgrestBuilder({ data: [{ created_at: today }, { created_at: today }], error: null }),
      });

      const { response, body } = await call();
      expect(response.status).toBe(200);
      const fromCalls = (mockAdminClient.from as jest.Mock).mock.calls.map((c) => c[0]);
      expect(fromCalls).toContain('poll_rankings');
      expect(fromCalls).not.toContain('votes');
      expect(Array.isArray(body.data.data)).toBe(true);
      expect(body.data.data).toHaveLength(7);
      const total = body.data.data.reduce((acc: number, row: { count: number }) => acc + row.count, 0);
      expect(total).toBe(2);
    });
  });

  describe.each([
    ['single', 'short form'],
    ['single_choice', 'long form'],
    ['multiple_choice', 'long form'],
    ['approval', 'enum value'],
  ])('voting_method=%s (%s)', (votingMethod) => {
    it('reads daily counts from votes', async () => {
      const today = new Date().toISOString();
      stubTables({
        polls: () =>
          createPostgrestBuilder({
            data: { id: POLL_ID, is_public: true, voting_method: votingMethod },
            error: null,
          }),
        votes: () =>
          createPostgrestBuilder({ data: [{ created_at: today }, { created_at: today }, { created_at: today }], error: null }),
      });

      const { body } = await call();
      const fromCalls = (mockAdminClient.from as jest.Mock).mock.calls.map((c) => c[0]);
      expect(fromCalls).toContain('votes');
      expect(fromCalls).not.toContain('poll_rankings');
      const total = body.data.data.reduce((acc: number, row: { count: number }) => acc + row.count, 0);
      expect(total).toBe(3);
    });
  });
});
