/**
 * @jest-environment node
 *
 * Contract tests for GET /api/polls/[id]/results.
 *
 * Polling tallies are the entire product. These tests pin down the
 * contract for every voting method (single, multiple, approval, ranked) and
 * for both stored aliases (short form like `single`, long form like
 * `single_choice` that the wizard actually writes). They are the regression
 * net for the May 14 ranked-choice bug where `ranked_choice` polls silently
 * returned 0 votes.
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

const mockAdminClient: Record<string, unknown> = {
  from: jest.fn(),
};

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseAdminClient: jest.fn(async () => mockAdminClient),
}));

const POLL_ID = 'af07ccf3-0c5c-41b3-8261-b91a76a02b0d';
const OPTION_A_ID = '11111111-1111-1111-1111-111111111111';
const OPTION_B_ID = '22222222-2222-2222-2222-222222222222';
const OPTION_C_ID = '33333333-3333-3333-3333-333333333333';

type Option = { id: string; text: string; option_text: string; order_index: number };

const makePoll = (votingMethod: string, options: Option[] = [
  { id: OPTION_A_ID, text: 'A', option_text: 'A', order_index: 0 },
  { id: OPTION_B_ID, text: 'B', option_text: 'B', order_index: 1 },
]) => ({
  id: POLL_ID,
  is_public: true,
  voting_method: votingMethod,
  poll_options: options,
});

const mountRoute = () => {
  let routeModule: { GET: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response> };
  jest.isolateModules(() => {
    routeModule = require('@/app/api/polls/[id]/results/route');
  });
  return routeModule;
};

const call = async () => {
  const { GET } = mountRoute();
  const request = createNextRequest(`http://localhost/api/polls/${POLL_ID}/results`);
  const response = await GET(request, { params: Promise.resolve({ id: POLL_ID }) });
  return { response, body: await response.json() };
};

const stubFromHandler = (handlers: Record<string, () => any>) => {
  (mockAdminClient.from as jest.Mock).mockImplementation((table: string) => {
    const handler = handlers[table];
    if (!handler) {
      throw new Error(`Unexpected table queried in results test: ${table}`);
    }
    return handler();
  });
};

describe('Poll results API contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockAdminClient.from as jest.Mock).mockReset();
  });

  describe.each([
    ['single', 'short form'],
    ['single_choice', 'long form (DB default)'],
  ])('single-choice poll with voting_method=%s (%s)', (votingMethod) => {
    it('tallies vote rows per option and reports total_votes', async () => {
      stubFromHandler({
        polls: () => createPostgrestBuilder({ data: makePoll(votingMethod), error: null }),
        votes: () =>
          createPostgrestBuilder({
            data: [
              { id: 'v1', option_id: OPTION_A_ID },
              { id: 'v2', option_id: OPTION_A_ID },
              { id: 'v3', option_id: OPTION_B_ID },
            ],
            error: null,
          }),
      });

      const { response, body } = await call();
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.voting_method).toBe('single');
      expect(body.data.total_votes).toBe(3);
      expect(body.data.results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ option_id: OPTION_A_ID, vote_count: 2 }),
          expect.objectContaining({ option_id: OPTION_B_ID, vote_count: 1 }),
        ]),
      );
    });

    it('returns total_votes=0 with empty results when no votes exist', async () => {
      stubFromHandler({
        polls: () => createPostgrestBuilder({ data: makePoll(votingMethod), error: null }),
        votes: () => createPostgrestBuilder({ data: [], error: null }),
      });

      const { response, body } = await call();
      expect(response.status).toBe(200);
      expect(body.data.total_votes).toBe(0);
      expect(body.data.results).toEqual([]);
    });
  });

  describe.each([
    ['multiple', 'short form'],
    ['multiple_choice', 'long form'],
  ])('multiple-choice poll with voting_method=%s (%s)', (votingMethod) => {
    it('counts every vote row (a single ballot may have multiple rows)', async () => {
      stubFromHandler({
        polls: () =>
          createPostgrestBuilder({
            data: makePoll(votingMethod, [
              { id: OPTION_A_ID, text: 'A', option_text: 'A', order_index: 0 },
              { id: OPTION_B_ID, text: 'B', option_text: 'B', order_index: 1 },
              { id: OPTION_C_ID, text: 'C', option_text: 'C', order_index: 2 },
            ]),
            error: null,
          }),
        votes: () =>
          createPostgrestBuilder({
            data: [
              // User 1 picked A + B
              { id: 'v1', option_id: OPTION_A_ID },
              { id: 'v2', option_id: OPTION_B_ID },
              // User 2 picked B + C
              { id: 'v3', option_id: OPTION_B_ID },
              { id: 'v4', option_id: OPTION_C_ID },
            ],
            error: null,
          }),
      });

      const { body } = await call();
      expect(body.data.total_votes).toBe(4);
      expect(body.data.results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ option_id: OPTION_A_ID, vote_count: 1 }),
          expect.objectContaining({ option_id: OPTION_B_ID, vote_count: 2 }),
          expect.objectContaining({ option_id: OPTION_C_ID, vote_count: 1 }),
        ]),
      );
    });
  });

  describe('approval poll', () => {
    it('tallies approvals per option', async () => {
      stubFromHandler({
        polls: () => createPostgrestBuilder({ data: makePoll('approval'), error: null }),
        votes: () =>
          createPostgrestBuilder({
            data: [
              { id: 'v1', option_id: OPTION_A_ID },
              { id: 'v2', option_id: OPTION_A_ID },
              { id: 'v3', option_id: OPTION_B_ID },
            ],
            error: null,
          }),
      });

      const { body } = await call();
      expect(body.data.voting_method).toBe('approval');
      expect(body.data.total_votes).toBe(3);
    });
  });

  describe.each([
    ['ranked', 'short form'],
    ['ranked_choice', 'long form (DB default — regression target)'],
    ['ranked-choice', 'hyphenated alias'],
  ])('ranked-choice poll with voting_method=%s (%s)', (votingMethod) => {
    it('reads ballots from poll_rankings (NOT votes) and returns option_stats', async () => {
      stubFromHandler({
        polls: () => createPostgrestBuilder({ data: makePoll(votingMethod), error: null }),
        poll_rankings: () =>
          createPostgrestBuilder({
            data: [
              { id: 'b1', rankings: [0, 1], user_id: 'u1', created_at: '2026-05-14T13:43:34.000Z' },
              { id: 'b2', rankings: [0, 1], user_id: 'u2', created_at: '2026-05-14T13:44:00.000Z' },
              { id: 'b3', rankings: [1, 0], user_id: 'u3', created_at: '2026-05-14T13:45:00.000Z' },
            ],
            error: null,
          }),
      });

      const { response, body } = await call();
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.voting_method).toBe('ranked');
      expect(body.data.total_votes).toBe(3);
      expect(Array.isArray(body.data.option_stats)).toBe(true);
      // option_id in the response is the option's order_index as a string
      // (consistent with the ranked vote engine output)
      const optionA = body.data.option_stats.find((row: any) => row.option_id === '0');
      const optionB = body.data.option_stats.find((row: any) => row.option_id === '1');
      expect(optionA.first_choice_votes).toBe(2);
      expect(optionB.first_choice_votes).toBe(1);
      // The non-ranked `results` array should be absent so the client takes
      // the option_stats branch.
      expect(body.data.results).toBeUndefined();
    });

    it('reports total_votes=0 with empty option_stats when no ballots exist', async () => {
      stubFromHandler({
        polls: () => createPostgrestBuilder({ data: makePoll(votingMethod), error: null }),
        poll_rankings: () => createPostgrestBuilder({ data: [], error: null }),
      });

      const { body } = await call();
      expect(body.data.total_votes).toBe(0);
      expect(body.data.option_stats).toBeDefined();
    });
  });

  describe('error paths', () => {
    it('returns 404 when the poll is not public', async () => {
      stubFromHandler({
        polls: () => createPostgrestBuilder({ data: null, error: null }),
      });

      const { response, body } = await call();
      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('rejects an invalid tier query', async () => {
      const { GET } = mountRoute();
      const request = createNextRequest(`http://localhost/api/polls/${POLL_ID}/results?tier=not-a-number`);
      const response = await GET(request, { params: Promise.resolve({ id: POLL_ID }) });
      expect(response.status).toBe(400);
    });
  });
});
