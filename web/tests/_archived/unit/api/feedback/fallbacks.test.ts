/**
 * @jest-environment node
 */

export {};

const mockParseBody = jest.fn();
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
    validationError: (errors: unknown) => createResponse(400, { success: false, error: errors }),
    errorResponse: (message: string, status: number = 500, details?: unknown) =>
      createResponse(status, { success: false, error: message, details }),
    rateLimitError: (message: string, retryAfter?: number) =>
      createResponse(429, { success: false, error: message, metadata: { retryAfter } }),
    parseBody: (...args: any[]) => mockParseBody(...args),
  };
});

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: () => mockGetSupabaseServerClient(),
}));

jest.mock('@/lib/utils/logger', () => ({
  devLog: jest.fn(),
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

const buildPostRequest = (body: unknown) =>
  new Request('http://localhost/api/feedback', {
    method: 'POST',
    headers: new Headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });

const buildGetRequest = (search: string = '') =>
  new Request(`http://localhost/api/feedback${search}`, {
    method: 'GET',
    headers: new Headers(),
  });

describe('Feedback API Supabase fallbacks', () => {
  let POST: (request: Request) => Promise<Response>;
  let GET: (request: Request) => Promise<Response>;

  const loadModule = () => {
    jest.isolateModules(() => {
      ({ POST, GET } = require('@/app/api/feedback/route'));
    });
  };

  beforeEach(() => {
    jest.resetModules();
    mockParseBody.mockReset();
    mockGetSupabaseServerClient.mockReset();
    loadModule();
  });

  it('returns mock success response when Supabase unavailable for POST', async () => {
    const payload = {
      type: 'bug',
      title: 'Fallback regression',
      description: 'Testing Supabase outage fallback',
      sentiment: 'negative',
    };

    mockParseBody.mockResolvedValue({ success: true, data: payload });
    mockGetSupabaseServerClient.mockReturnValue(undefined);

    const response = await POST(buildPostRequest(payload));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.message).toContain('Enhanced feedback submitted successfully');
    expect(body.metadata).toMatchObject({ source: 'mock', mode: 'degraded' });
    expect(body.data.feedbackId).toMatch(/^mock-/);
  });

  it('returns empty dataset when Supabase unavailable for GET', async () => {
    mockGetSupabaseServerClient.mockReturnValue(undefined);

    const response = await GET(buildGetRequest('?limit=10'));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.feedback).toEqual([]);
    expect(body.data.count).toBe(0);
    expect(body.data.analytics).toBeDefined();
    expect(body.metadata).toMatchObject({ source: 'mock', mode: 'degraded' });
  });
});

