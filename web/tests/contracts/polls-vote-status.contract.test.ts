/**
 * @jest-environment node
 *
 * Contract tests for hasVoted detection on the poll voting endpoint.
 *
 * The GET handler powers the "You have already voted" UI banner; the HEAD
 * handler powers the lightweight polling status probe used by service
 * workers, prefetchers, and the optimistic vote bar. Both must consult the
 * correct table per voting method (poll_rankings for ranked, votes
 * otherwise) AND must handle both stored aliases of voting_method.
 *
 * Regression target: before the May 14 fix, ranked_choice polls always
 * returned hasVoted=false because the handler queried the empty `votes`
 * table, so the optimistic UI never settled into the "already voted" state.
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

const mockServerClient: Record<string, unknown> = {
  from: jest.fn(),
  auth: { getUser: jest.fn() },
};

const mockAdminClient: Record<string, unknown> = {
  from: jest.fn(),
};

const mockGetUser = jest.fn();

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(async () => mockServerClient),
  getSupabaseAdminClient: jest.fn(async () => mockAdminClient),
}));

jest.mock('@/lib/core/auth/middleware', () => ({
  getUser: (...args: unknown[]) => mockGetUser(...args),
}));

const mockRateLimiter = { checkLimit: jest.fn() };
jest.mock('@/lib/rate-limiting/api-rate-limiter', () => ({ apiRateLimiter: mockRateLimiter }));

jest.mock('@/app/api/auth/_shared', () => ({
  validateCsrfProtection: jest.fn(async () => true),
  createCsrfErrorResponse: jest.fn(() => new Response('csrf', { status: 403 })),
}));

const POLL_ID = 'af07ccf3-0c5c-41b3-8261-b91a76a02b0d';
const USER_ID = '00000000-1111-2222-3333-444444444444';

const mountRoute = () => {
  let routeModule: {
    GET: (req: Request, ctx: { params: { id: string } }) => Promise<Response>;
    HEAD: (req: Request, ctx: { params: { id: string } }) => Promise<Response>;
  };
  jest.isolateModules(() => {
    routeModule = require('@/app/api/polls/[id]/vote/route');
  });
  return routeModule;
};

const stubTables = (handlers: Record<string, () => any>) => {
  (mockServerClient.from as jest.Mock).mockImplementation((table: string) => {
    const handler = handlers[table];
    if (!handler) throw new Error(`Unexpected table in vote-status test: ${table}`);
    return handler();
  });
};

const callGet = async () => {
  const { GET } = mountRoute();
  const request = createNextRequest(`http://localhost/api/polls/${POLL_ID}/vote`);
  const response = await GET(request, { params: { id: POLL_ID } });
  return { response, body: await response.json() };
};

const callHead = async () => {
  const { HEAD } = mountRoute();
  const request = createNextRequest(`http://localhost/api/polls/${POLL_ID}/vote`, { method: 'HEAD' });
  const response = await HEAD(request, { params: { id: POLL_ID } });
  return response;
};

describe('Vote status (GET) contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockServerClient.from as jest.Mock).mockReset();
    (mockServerClient.auth as { getUser: jest.Mock }).getUser.mockReset();
    mockGetUser.mockResolvedValue({ id: USER_ID });
  });

  it('returns hasVoted:false (200) when no user is signed in', async () => {
    mockGetUser.mockResolvedValueOnce(null);
    const { response, body } = await callGet();
    expect(response.status).toBe(200);
    expect(body.data.hasVoted).toBe(false);
  });

  describe.each([
    ['ranked', 'short form'],
    ['ranked_choice', 'long form (DB default — regression target)'],
  ])('voting_method=%s (%s)', (votingMethod) => {
    it('returns hasVoted:true when a poll_rankings row exists for the user', async () => {
      stubTables({
        polls: () =>
          createPostgrestBuilder({ data: { voting_method: votingMethod }, error: null }),
        poll_rankings: () => createPostgrestBuilder({ data: null, error: null, count: 1 }),
      });

      const { body } = await callGet();
      expect(body.data.hasVoted).toBe(true);
    });

    it('returns hasVoted:false when poll_rankings is empty', async () => {
      stubTables({
        polls: () =>
          createPostgrestBuilder({ data: { voting_method: votingMethod }, error: null }),
        poll_rankings: () => createPostgrestBuilder({ data: null, error: null, count: 0 }),
      });

      const { body } = await callGet();
      expect(body.data.hasVoted).toBe(false);
    });

    it('does NOT touch the votes table (would return stale 0 for ranked polls)', async () => {
      stubTables({
        polls: () =>
          createPostgrestBuilder({ data: { voting_method: votingMethod }, error: null }),
        poll_rankings: () => createPostgrestBuilder({ data: null, error: null, count: 1 }),
      });

      await callGet();

      const fromCalls = (mockServerClient.from as jest.Mock).mock.calls.map((c) => c[0]);
      expect(fromCalls).toContain('poll_rankings');
      expect(fromCalls).not.toContain('votes');
    });
  });

  describe.each([
    ['single', 'short form'],
    ['single_choice', 'long form'],
    ['multiple', 'short form'],
    ['multiple_choice', 'long form'],
    ['approval', 'enum value'],
  ])('voting_method=%s (%s)', (votingMethod) => {
    it('consults the votes table and returns true when a row exists', async () => {
      stubTables({
        polls: () =>
          createPostgrestBuilder({ data: { voting_method: votingMethod }, error: null }),
        votes: () => createPostgrestBuilder({ data: null, error: null, count: 1 }),
      });

      const { body } = await callGet();
      expect(body.data.hasVoted).toBe(true);

      const fromCalls = (mockServerClient.from as jest.Mock).mock.calls.map((c) => c[0]);
      expect(fromCalls).toContain('votes');
      expect(fromCalls).not.toContain('poll_rankings');
    });

    it('returns hasVoted:false when no vote exists', async () => {
      stubTables({
        polls: () =>
          createPostgrestBuilder({ data: { voting_method: votingMethod }, error: null }),
        votes: () => createPostgrestBuilder({ data: null, error: null, count: 0 }),
      });

      const { body } = await callGet();
      expect(body.data.hasVoted).toBe(false);
    });
  });

  it('rejects malformed poll IDs', async () => {
    const { GET } = mountRoute();
    const request = createNextRequest(`http://localhost/api/polls/not-a-uuid/vote`);
    const response = await GET(request, { params: { id: 'not-a-uuid' } });
    expect(response.status).toBe(400);
  });
});

describe('Vote status (HEAD) contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockServerClient.from as jest.Mock).mockReset();
    (mockServerClient.auth as { getUser: jest.Mock }).getUser.mockReset();
    (mockServerClient.auth as { getUser: jest.Mock }).getUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
    });
  });

  it('returns 204 when no user is signed in', async () => {
    (mockServerClient.auth as { getUser: jest.Mock }).getUser.mockResolvedValueOnce({
      data: { user: null },
    });
    const response = await callHead();
    expect(response.status).toBe(204);
  });

  it.each([
    ['ranked'],
    ['ranked_choice'],
  ])('200 for ranked vote present (voting_method=%s)', async (votingMethod) => {
    stubTables({
      polls: () =>
        createPostgrestBuilder({ data: { voting_method: votingMethod }, error: null }),
      poll_rankings: () => createPostgrestBuilder({ data: null, error: null, count: 1 }),
    });
    const response = await callHead();
    expect(response.status).toBe(200);
  });

  it.each([
    ['single'],
    ['single_choice'],
    ['multiple_choice'],
    ['approval'],
  ])('200 for non-ranked vote present (voting_method=%s)', async (votingMethod) => {
    stubTables({
      polls: () =>
        createPostgrestBuilder({ data: { voting_method: votingMethod }, error: null }),
      votes: () => createPostgrestBuilder({ data: null, error: null, count: 1 }),
    });
    const response = await callHead();
    expect(response.status).toBe(200);
  });

  it('rejects malformed poll IDs with 400', async () => {
    const { HEAD } = mountRoute();
    const request = createNextRequest('http://localhost/api/polls/not-a-uuid/vote', { method: 'HEAD' });
    const response = await HEAD(request, { params: { id: 'not-a-uuid' } });
    expect(response.status).toBe(400);
  });
});
