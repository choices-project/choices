/**
 * @jest-environment node
 */

import type { NextRequest } from 'next/server';

const mockSupabaseFrom = jest.fn();
const mockSetVapidDetails = jest.fn();
const mockSendNotification = jest.fn();

jest.mock('web-push', () => ({
  __esModule: true,
  default: {
    setVapidDetails: mockSetVapidDetails,
    sendNotification: mockSendNotification
  }
}));

const mockIsFeatureEnabled = jest.fn().mockReturnValue(true);

jest.mock('@/lib/core/feature-flags', () => ({
  isFeatureEnabled: (...args: unknown[]) => mockIsFeatureEnabled(...args)
}));

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: () => ({
    from: mockSupabaseFrom
  })
}));

jest.mock('@/lib/api', () => {
  const createResponse = (status: number, payload: unknown) => ({
    status,
    json: async () => payload
  });

  return {
    __esModule: true,
    withErrorHandling: (handler: any) => handler,
    successResponse: (data: unknown, _metadata?: unknown, status?: number) =>
      createResponse(status ?? 200, { success: true, data }),
    forbiddenError: (message?: string) => createResponse(403, { success: false, error: message ?? 'Access forbidden' }),
    validationError: (errors: unknown) => createResponse(400, { success: false, error: errors }),
    errorResponse: (message: string, status: number = 500, details?: unknown) =>
      createResponse(status, { success: false, error: message, details }),
    notFoundError: (message?: string) => createResponse(404, { success: false, error: message ?? 'Not found' })
  };
});

type QueryResult<T> = { data: T; error: null } | { data: null; error: { message: string } };

const createBuilder = <T>(result: QueryResult<T>) => {
  const builder: any = {
    _result: result,
    select: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    then(onFulfilled: (value: QueryResult<T>) => unknown, onRejected?: (reason: unknown) => unknown) {
      return Promise.resolve(builder._result).then(onFulfilled, onRejected);
    },
    catch(onRejected: (reason: unknown) => unknown) {
      return Promise.resolve(builder._result).catch(onRejected);
    },
    finally(onFinally: (() => void) | undefined) {
      return Promise.resolve(builder._result).finally(onFinally);
    }
  };
  return builder;
};

const buildPostRequest = (body: Record<string, unknown>): NextRequest =>
  ({
    method: 'POST',
    url: 'http://localhost/api',
    json: async () => body
  } as unknown as NextRequest);

const buildGetRequest = (url: string): NextRequest =>
  ({
    method: 'GET',
    url
  } as unknown as NextRequest);

const originalEnv = process.env;

describe('POST /api/pwa/notifications/send', () => {
  let POST: typeof import('@/app/api/pwa/notifications/send/route')['POST'];
  let GET: typeof import('@/app/api/pwa/notifications/send/route')['GET'];

  const loadRoute = () => {
    jest.isolateModules(() => {
      ({ POST, GET } = require('@/app/api/pwa/notifications/send/route'));
    });
  };

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      WEB_PUSH_VAPID_PUBLIC_KEY: 'test-public',
      WEB_PUSH_VAPID_PRIVATE_KEY: 'test-private',
      WEB_PUSH_VAPID_SUBJECT: 'mailto:test@example.com'
    };
    mockSupabaseFrom.mockReset();
    mockSendNotification.mockReset();
    mockSetVapidDetails.mockReset();
    mockIsFeatureEnabled.mockReset();
    mockIsFeatureEnabled.mockReturnValue(true);
    loadRoute();
    expect(typeof POST).toBe('function');
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns 403 when feature disabled', async () => {
    mockIsFeatureEnabled.mockReturnValue(false);
    const response = (await POST(
      buildPostRequest({ title: 'Hello', message: 'World' })
    )) as Response;
    expect(response.status).toBe(403);
  });

  it('validates title and message', async () => {
    const response = (await POST(
      buildPostRequest({ title: '', message: '' })
    )) as Response;
    expect(response.status).toBe(400);
  });

  it('returns 503 when VAPID keys missing', async () => {
    process.env.WEB_PUSH_VAPID_PUBLIC_KEY = '';
    process.env.WEB_PUSH_VAPID_PRIVATE_KEY = '';
    loadRoute();

    const subscriptionRecord = {
      id: 'sub_1',
      user_id: 'user_1',
      endpoint: 'https://example.com/endpoint',
      auth_key: 'auth',
      p256dh_key: 'p256dh',
      subscription_data: {
        endpoint: 'https://example.com/endpoint',
        keys: {
          auth: 'auth',
          p256dh: 'p256dh'
        }
      },
      is_active: true,
      preferences: null,
      created_at: null,
      updated_at: null,
      deactivated_at: null
    };

    const selectBuilder = createBuilder({ data: [subscriptionRecord], error: null });
    mockSupabaseFrom.mockImplementationOnce(() => selectBuilder);

    const response = (await POST(
      buildPostRequest({ title: 'Hello', message: 'World' })
    )) as Response;

    expect(response.status).toBe(503);
  });

  it('returns 404 when no subscriptions', async () => {
    const selectBuilder = createBuilder({ data: [] as any, error: null });
    mockSupabaseFrom.mockImplementationOnce(() => selectBuilder);

    const response = (await POST(
      buildPostRequest({ title: 'Hello', message: 'World' })
    )) as Response;

    expect(response.status).toBe(404);
  });

  it('sends notifications and logs results', async () => {
    const subscriptionRecord = {
      id: 'sub_1',
      user_id: 'user_1',
      endpoint: 'https://example.com/endpoint',
      auth_key: 'auth',
      p256dh_key: 'p256dh',
      subscription_data: {
        endpoint: 'https://example.com/endpoint',
        keys: {
          auth: 'auth',
          p256dh: 'p256dh'
        }
      },
      is_active: true,
      preferences: null,
      created_at: null,
      updated_at: null,
      deactivated_at: null
    };

    const selectBuilder = createBuilder({ data: [subscriptionRecord], error: null });
    const logBuilder = createBuilder({ data: null, error: null });

    mockSupabaseFrom
      .mockImplementationOnce(() => selectBuilder)
      .mockImplementationOnce(() => logBuilder);

    mockSendNotification.mockResolvedValue(undefined);

    const response = (await POST(
      buildPostRequest({ title: 'Hello', message: 'World' })
    )) as Response;

    expect(response.status).toBe(201);
    expect(mockSetVapidDetails).toHaveBeenCalledTimes(1);
    expect(mockSendNotification).toHaveBeenCalledTimes(1);
    expect(logBuilder.insert).toHaveBeenCalledTimes(1);
  });

  it('deactivates subscription on permanent failure', async () => {
    const subscriptionRecord = {
      id: 'sub_bad',
      user_id: 'user_bad',
      endpoint: 'https://example.com/bad',
      auth_key: 'auth',
      p256dh_key: 'p256dh',
      subscription_data: {
        endpoint: 'https://example.com/bad',
        keys: {
          auth: 'auth',
          p256dh: 'p256dh'
        }
      },
      is_active: true,
      preferences: null,
      created_at: null,
      updated_at: null,
      deactivated_at: null
    };

    const selectBuilder = createBuilder({ data: [subscriptionRecord], error: null });
    const logBuilder = createBuilder({ data: null, error: null });
    const deactivateBuilder = createBuilder({ data: [{ id: 'sub_bad' }], error: null });
    deactivateBuilder.eq.mockReturnThis();

    mockSupabaseFrom
      .mockImplementationOnce(() => selectBuilder)
      .mockImplementationOnce(() => logBuilder)
      .mockImplementationOnce(() => deactivateBuilder)
      .mockImplementationOnce(() => logBuilder);

    const error = new Error('Gone');
    (error as any).statusCode = 410;
    mockSendNotification.mockRejectedValue(error);

    const response = (await POST(
      buildPostRequest({ title: 'Hello', message: 'World' })
    )) as Response;

    expect(response.status).toBe(201);
    expect(deactivateBuilder.update).toHaveBeenCalled();
  });

  it('fetches notification history', async () => {
    const historyBuilder = createBuilder({
      data: [
        { id: '1', title: 'Test', body: 'Body', status: 'sent', created_at: new Date().toISOString(), user_id: 'user_1' }
      ],
      error: null
    });
    mockSupabaseFrom.mockImplementationOnce(() => historyBuilder);

    const response = (await GET(
      buildGetRequest('http://localhost/api?userId=user_1&limit=5')
    )) as Response;

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.history).toHaveLength(1);
  });
});

