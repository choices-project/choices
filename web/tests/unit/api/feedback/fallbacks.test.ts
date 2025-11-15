/**
 * @jest-environment node
 */

const mockParseBody = jest.fn();
const mockGetSupabaseServerClient = jest.fn();

jest.mock('@/lib/api', () => {
  const createResponse = (status, payload) => ({
    status,
    json: async () => payload,
  });

  return {
    __esModule: true,
    withErrorHandling: (handler) => handler,
    successResponse: (data, metadata, status = 200) =>
      createResponse(status, { success: true, data, metadata }),
    validationError: (errors) => createResponse(400, { success: false, error: errors }),
    errorResponse: (message, status = 500, details) =>
      createResponse(status, { success: false, error: message, details }),
    rateLimitError: (message, retryAfter) =>
      createResponse(429, { success: false, error: message, metadata: { retryAfter } }),
    parseBody: (...args) => mockParseBody(...args),
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

const buildPostRequest = (body) => ({
    method: 'POST',
    headers: new Headers(),
    json: async () => body,
    url: 'http://localhost/api/feedback',
  });

const buildGetRequest = (search = '') => ({
    method: 'GET',
    headers: new Headers(),
    url: `http://localhost/api/feedback${search}`,
  });

describe('Feedback API Supabase fallbacks', () => {
  let POST;
  let GET;

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

