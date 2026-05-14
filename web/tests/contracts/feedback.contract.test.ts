/**
 * @jest-environment node
 *
 * Contract tests for POST /api/feedback.
 *
 * Regression targets (May 14, 2026):
 *  1. Legitimate bug reports that mention URLs or acronyms must NOT 400.
 *     Previous content rules silently dropped real reports for ~5 months.
 *  2. The "schema cache stale" fallback must be narrow. The previous
 *     `errorMessage.includes('does not exist')` swallowed column/function/
 *     RLS errors and returned mock success — losing the user's report.
 *  3. The success response must include a real feedback id when the DB
 *     accepts the row; a `mock-…` id signals a fallback that the widget
 *     can treat as a recoverable degraded mode.
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

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(async () => mockServerClient),
  getSupabaseAdminClient: jest.fn(async () => mockAdminClient),
}));

jest.mock('@/lib/rate-limiting/api-rate-limiter', () => ({
  apiRateLimiter: {
    checkLimit: jest.fn(async () => ({ allowed: true, remaining: 9 })),
  },
}));

jest.mock('@/app/api/auth/_shared', () => ({
  validateCsrfProtection: jest.fn(async () => true),
  createCsrfErrorResponse: jest.fn(() => new Response('csrf', { status: 403 })),
}));

jest.mock('@/lib/core/auth/server-actions', () => ({
  sanitizeInput: (s: string) => s,
}));

const USER_ID = '00000000-1111-2222-3333-444444444444';

const mountRoute = () => {
  let mod: { POST: (req: Request) => Promise<Response> };
  jest.isolateModules(() => {
    mod = require('@/app/api/feedback/route');
  });
  return mod;
};

const baseBody = (overrides: Partial<Record<string, unknown>> = {}) => ({
  type: 'bug',
  title: 'Vote count stays 0 after voting',
  description: 'On https://www.choices-app.com/polls/abc the RANKED poll total stays at 0.',
  sentiment: 'negative',
  ...overrides,
});

const postFeedback = async (body: Record<string, unknown>) => {
  const { POST } = mountRoute();
  const request = createNextRequest('http://localhost/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const response = await POST(request);
  const json = await response.json();
  return { response, body: json };
};

const stubAuthenticated = () => {
  (mockServerClient.auth as { getUser: jest.Mock }).getUser.mockResolvedValue({
    data: { user: { id: USER_ID } },
    error: null,
  });
};

const stubDailyLimitCount = (count: number) => {
  (mockServerClient.from as jest.Mock).mockImplementationOnce(() =>
    createPostgrestBuilder({ data: null, error: null, count }),
  );
};

const resetMocks = () => {
  jest.clearAllMocks();
  (mockServerClient.from as jest.Mock).mockReset();
  (mockAdminClient.from as jest.Mock).mockReset();
  (mockServerClient.auth as { getUser: jest.Mock }).getUser.mockReset();
};

describe('POST /api/feedback — content validation (no more silent drops)', () => {
  beforeEach(() => {
    resetMocks();
    stubAuthenticated();
  });

  it('accepts bug reports that contain a URL (most common shape)', async () => {
    stubDailyLimitCount(0);
    (mockServerClient.from as jest.Mock).mockImplementationOnce(() =>
      createPostgrestBuilder({
        data: [{ id: 'fb-1', created_at: '2026-05-14T14:00:00Z' }],
        error: null,
      }),
    );

    const { response, body } = await postFeedback(baseBody());
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.feedbackId).toBe('fb-1');
  });

  it('accepts bug reports that contain ALL-CAPS acronyms', async () => {
    stubDailyLimitCount(0);
    (mockServerClient.from as jest.Mock).mockImplementationOnce(() =>
      createPostgrestBuilder({
        data: [{ id: 'fb-2', created_at: '2026-05-14T14:00:00Z' }],
        error: null,
      }),
    );

    const { response, body } = await postFeedback(
      baseBody({
        title: 'GITHUB OAUTH redirect',
        description: 'PLEASE check the OAUTH redirect for GITHUB and GOOGLE',
      }),
    );
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('still rejects obvious spam wording with a 400', async () => {
    stubDailyLimitCount(0);
    const { response, body } = await postFeedback(
      baseBody({ description: 'Click here to win free money' }),
    );
    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });
});

describe('POST /api/feedback — schema-cache fallback is narrow', () => {
  beforeEach(() => {
    resetMocks();
    stubAuthenticated();
  });

  it('returns mock success only for true "relation feedback does not exist" failures', async () => {
    stubDailyLimitCount(0);
    (mockServerClient.from as jest.Mock).mockImplementationOnce(() =>
      createPostgrestBuilder({
        data: null,
        error: { message: 'relation "public.feedback" does not exist', code: '42P01' },
      } as unknown as { data: any; error: null }),
    );

    const { response, body } = await postFeedback(baseBody());
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(typeof body.data.feedbackId).toBe('string');
    expect(body.data.feedbackId).toMatch(/^mock-/);
  });

  it('returns mock success for a PGRST205 schema cache miss', async () => {
    stubDailyLimitCount(0);
    (mockServerClient.from as jest.Mock).mockImplementationOnce(() =>
      createPostgrestBuilder({
        data: null,
        error: { message: 'Could not find the table in the schema cache', code: 'PGRST205' },
      } as unknown as { data: any; error: null }),
    );

    const { response, body } = await postFeedback(baseBody());
    expect(response.status).toBe(200);
    expect(body.data.feedbackId).toMatch(/^mock-/);
  });

  it('does NOT swallow column-missing errors as schema-cache fallback', async () => {
    stubDailyLimitCount(0);
    (mockServerClient.from as jest.Mock).mockImplementationOnce(() =>
      createPostgrestBuilder({
        data: null,
        error: { message: 'column "screenshot" does not exist', code: '42703' },
      } as unknown as { data: any; error: null }),
    );

    const { response, body } = await postFeedback(baseBody());
    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.data?.feedbackId).toBeUndefined();
    // Admin fallback must NOT be attempted for non-RLS/non-schema errors.
    expect((mockAdminClient.from as jest.Mock)).not.toHaveBeenCalled();
  });

  it('does NOT swallow function-missing errors as schema-cache fallback', async () => {
    stubDailyLimitCount(0);
    (mockServerClient.from as jest.Mock).mockImplementationOnce(() =>
      createPostgrestBuilder({
        data: null,
        error: { message: 'function update_x() does not exist', code: '42883' },
      } as unknown as { data: any; error: null }),
    );

    const { response, body } = await postFeedback(baseBody());
    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect((mockAdminClient.from as jest.Mock)).not.toHaveBeenCalled();
  });
});

describe('POST /api/feedback — RLS admin fallback still works', () => {
  beforeEach(() => {
    resetMocks();
    stubAuthenticated();
  });

  it('falls back to the admin client when the user client hits RLS', async () => {
    stubDailyLimitCount(0);
    (mockServerClient.from as jest.Mock).mockImplementationOnce(() =>
      createPostgrestBuilder({
        data: null,
        error: { message: 'new row violates row-level security policy', code: '42501' },
      } as unknown as { data: any; error: null }),
    );
    (mockAdminClient.from as jest.Mock).mockImplementationOnce(() =>
      createPostgrestBuilder({
        data: { id: 'fb-rls-recovered', created_at: '2026-05-14T14:00:00Z' },
        error: null,
      }),
    );

    const { response, body } = await postFeedback(baseBody());
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.feedbackId).toBe('fb-rls-recovered');
  });
});
