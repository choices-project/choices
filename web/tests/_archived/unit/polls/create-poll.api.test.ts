import { createPollRequest } from '@/features/polls/pages/create/api';
import type { PollCreatePayload } from '@/lib/polls/wizard/submission';

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockPayload: PollCreatePayload = {
  title: 'Playwright Feedback',
  question: 'Playwright Feedback',
  description: 'Collect feedback on our Playwright coverage and planned scenarios.',
  category: 'technology',
  tags: ['qa', 'automation'],
  options: [{ text: 'Great' }, { text: 'Needs work' }],
  settings: {
    allowMultipleVotes: false,
    allowAnonymousVotes: true,
    requireAuthentication: false,
    showResultsBeforeClose: true,
    allowComments: true,
    allowSharing: true,
    privacyLevel: 'public',
  },
  metadata: {},
};

const mockFetch = global.fetch as jest.Mock | undefined;

const createFetchResponse = (init: {
  ok: boolean;
  status: number;
  body: unknown;
}) => ({
  ok: init.ok,
  status: init.status,
  url: '/api/polls',
  json: jest.fn().mockResolvedValue(init.body),
});

beforeEach(() => {
  (global as any).fetch = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
});

afterAll(() => {
  if (mockFetch) {
    (global as any).fetch = mockFetch;
  }
});

if (typeof DOMException === 'undefined') {
  (global as any).DOMException = class extends Error {
    constructor(message?: string, name?: string) {
      super(message);
      this.name = name ?? 'DOMException';
    }
  };
}

describe('createPollRequest', () => {
  it('returns success data when server responds with poll identifier', async () => {
    const responseBody = { data: { id: 'poll-123', title: 'Playwright Feedback' } };
    (global.fetch as jest.Mock).mockResolvedValueOnce(createFetchResponse({ ok: true, status: 201, body: responseBody }));

    const result = await createPollRequest(mockPayload);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.id).toBe('poll-123');
    expect(result.data.title).toBe('Playwright Feedback');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/polls',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(mockPayload),
      }),
    );
  });

  it('maps validation errors from the backend into field errors', async () => {
    const responseBody = {
      error: 'Validation failed',
      fields: {
        title: 'Title already used this week',
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce(
      createFetchResponse({ ok: false, status: 422, body: responseBody }),
    );

    const result = await createPollRequest(mockPayload);

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.status).toBe(422);
    expect(result.fieldErrors?.title).toBe('Title already used this week');
    expect(result.message).toContain('Validation failed');
  });

  it('provides helpful message for unauthenticated requests', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      createFetchResponse({ ok: false, status: 401, body: { error: 'not signed in' } }),
    );

    const result = await createPollRequest(mockPayload);

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.message).toContain('sign in');
  });

  it('returns friendly copy for throttled requests', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      createFetchResponse({ ok: false, status: 429, body: { error: 'Too many requests' } }),
    );

    const result = await createPollRequest(mockPayload);

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.message).toContain('slow down');
  });

  it('handles network failures gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network disconnected'));

    const result = await createPollRequest(mockPayload);

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.status).toBe(0);
    expect(result.message).toContain('reach the server');
  });

  it('treats abort errors as cancellations', async () => {
    const abortError = new (global as any).DOMException('The operation was aborted.', 'AbortError');
    (global.fetch as jest.Mock).mockRejectedValueOnce(abortError);

    const controller = new AbortController();

    const result = await createPollRequest(mockPayload, controller.signal);

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.status).toBe(0);
    expect(result.message).toContain('cancelled');
  });
});

