/**
 * @jest-environment node
 */

import type { NextRequest } from 'next/server';

import {
  POST,
  DELETE,
  GET,
  PUT,
} from '@/app/api/pwa/notifications/subscribe/route';

const mockSupabaseFrom = jest.fn();

jest.mock('@/lib/core/feature-flags', () => ({
  isFeatureEnabled: jest.fn()
}));

jest.mock('@/lib/api', () => {
  const createResponse = (status: number, payload: unknown) => ({
    status,
    json: async () => payload
  });

  return {
    __esModule: true,
    withErrorHandling: (handler: any) => handler,
    successResponse: (data: unknown, message?: string, status?: number) =>
      createResponse(status ?? 200, { data, message }),
    forbiddenError: (message?: string) => createResponse(403, { error: message ?? 'Access forbidden' }),
    validationError: (errors: Record<string, unknown>) => createResponse(400, { error: errors }),
    errorResponse: (message: string, status: number = 500) => createResponse(status, { error: message })
  };
});

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: () => ({
    from: mockSupabaseFrom
  })
}));

jest.mock('@/lib/utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  },
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

const { isFeatureEnabled } = jest.requireMock('@/lib/core/feature-flags') as {
  isFeatureEnabled: jest.Mock;
};

const mockIsFeatureEnabled = isFeatureEnabled;

const buildRequest = (init?: RequestInit & { url?: string }) => {
  const headers = new Headers(init?.headers);
  const rawBody = init?.body as string | undefined;
  if (rawBody && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const parsedBody = rawBody ? JSON.parse(rawBody) : undefined;

  const request: Partial<NextRequest> = {
    url: init?.url ?? 'http://localhost/api',
    method: init?.method ?? 'GET',
    headers,
    json: async () => parsedBody,
    text: async () => rawBody ?? '',
    clone: () => request as NextRequest
  };

  return request as NextRequest;
};

type QueryBuilder = {
  select: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  maybeSingle: jest.Mock;
  single: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
};

const configureBuilder = (builder: QueryBuilder) => {
  builder.select.mockImplementation(() => builder);
  builder.eq.mockImplementation(() => builder);
  builder.order.mockImplementation(() => builder);
  builder.limit.mockImplementation(() => builder);
  builder.insert.mockImplementation(() => builder);
  builder.update.mockImplementation(() => builder);
};

const createQueryBuilder = (): QueryBuilder => {
  const builder: QueryBuilder = {
    select: jest.fn(),
    eq: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    maybeSingle: jest.fn(),
    single: jest.fn(),
    insert: jest.fn(),
    update: jest.fn()
  };
  configureBuilder(builder);
  return builder;
};

describe('/api/pwa/notifications/subscribe', () => {
  const defaultBuilder = createQueryBuilder();

  beforeEach(() => {
    jest.resetAllMocks();
    configureBuilder(defaultBuilder);
    mockIsFeatureEnabled.mockReturnValue(true);
    mockSupabaseFrom.mockReturnValue(defaultBuilder);
    defaultBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });
    defaultBuilder.single.mockResolvedValue({ data: { id: 'sub_123' }, error: null });
  });

  describe('POST', () => {
    const payload = {
      subscription: {
        endpoint: 'https://example.com/endpoint',
        keys: { auth: 'auth-key', p256dh: 'p256dh-key' }
      },
      userId: 'user-123',
      preferences: { newPolls: false }
    };

    it('returns 403 when feature is disabled', async () => {
      mockIsFeatureEnabled.mockReturnValue(false);
      const response = (await POST(
        buildRequest({
          method: 'POST',
          body: JSON.stringify(payload)
        }) as NextRequest
      )) as Response;

      expect(response.status).toBe(403);
    });

    it('validates subscription payload', async () => {
      const response = (await POST(
        buildRequest({
          method: 'POST',
          body: JSON.stringify({ userId: 'user-123', subscription: null })
        }) as NextRequest
      )) as Response;

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error?.subscription).toBe('Invalid subscription data');
    });

    it('validates userId', async () => {
      const response = (await POST(
        buildRequest({
          method: 'POST',
          body: JSON.stringify({
            subscription: payload.subscription,
            preferences: payload.preferences
          })
        }) as NextRequest
      )) as Response;

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error?.userId).toBe('User ID is required');
    });

    it('inserts new subscription when none exists', async () => {
      const builder = createQueryBuilder();
      builder.maybeSingle.mockResolvedValue({ data: null, error: null });

      const singleMock = jest.fn().mockResolvedValue({
        data: { id: 'sub_456' },
        error: null
      });

      const insertSelectMock = jest.fn().mockReturnValue({
        single: singleMock
      });

      const insertMock = jest.fn().mockReturnValue({
        select: insertSelectMock
      });

      builder.insert.mockImplementation(insertMock);

      mockSupabaseFrom.mockImplementation((table: string) =>
        table === 'push_subscriptions' ? builder : createQueryBuilder()
      );

      const response = (await POST(
        buildRequest({
          method: 'POST',
          body: JSON.stringify(payload)
        }) as NextRequest
      )) as Response;

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result.data.subscriptionId).toBe('sub_456');
      expect(insertMock).toHaveBeenCalled();
    });

    it('updates existing subscription when endpoint matches', async () => {
      const builder = createQueryBuilder();
      builder.maybeSingle.mockResolvedValue({
        data: { id: 'sub_001', created_at: '2024-01-01T00:00:00.000Z' },
        error: null
      });

      const updateSingleMock = jest.fn().mockResolvedValue({
        data: { id: 'sub_001' },
        error: null
      });

      const updateEqMock = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: updateSingleMock
        })
      });

      const updateMock = jest.fn().mockReturnValue({
        eq: updateEqMock
      });

      builder.update.mockImplementation(updateMock);

      mockSupabaseFrom.mockImplementation((table: string) =>
        table === 'push_subscriptions' ? builder : createQueryBuilder()
      );

      const response = (await POST(
        buildRequest({
          method: 'POST',
          body: JSON.stringify(payload)
        }) as NextRequest
      )) as Response;

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result.data.subscriptionId).toBe('sub_001');
      expect(updateMock).toHaveBeenCalled();
      expect(updateSingleMock).toHaveBeenCalled();
    });

    it('handles Supabase errors', async () => {
      const builder = createQueryBuilder();
      builder.maybeSingle.mockResolvedValue({ data: null, error: null });
      const insertSelectMock = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: null, error: new Error('insert failed') })
      });
      builder.insert.mockReturnValue({ select: insertSelectMock });

      mockSupabaseFrom.mockImplementation((table: string) =>
        table === 'push_subscriptions' ? builder : createQueryBuilder()
      );

      const response = (await POST(
        buildRequest({
          method: 'POST',
          body: JSON.stringify(payload)
        }) as NextRequest
      )) as Response;

      expect(response.status).toBe(500);
    });
  });

  describe('DELETE', () => {
    it('validates feature flag', async () => {
      mockIsFeatureEnabled.mockReturnValue(false);
      const response = (await DELETE(
        buildRequest({
          method: 'DELETE',
          url: 'http://localhost/api?subscriptionId=sub_123'
        }) as NextRequest
      )) as Response;

      expect(response.status).toBe(403);
    });

    it('requires userId or subscriptionId', async () => {
      const response = (await DELETE(
        buildRequest({
          method: 'DELETE',
          url: 'http://localhost/api'
        }) as NextRequest
      )) as Response;

      expect(response.status).toBe(400);
    });

    it('marks subscription inactive', async () => {
      const builder = createQueryBuilder();
      const updateChain = createQueryBuilder();
      updateChain.eq.mockImplementation(() => updateChain);
      updateChain.select.mockReturnValue({
        data: [{ id: 'sub_123' }],
        error: null
      });
      builder.update.mockReturnValue(updateChain);

      mockSupabaseFrom.mockImplementation((table: string) =>
        table === 'push_subscriptions' ? builder : createQueryBuilder()
      );

      const response = (await DELETE(
        buildRequest({
          method: 'DELETE',
          url: 'http://localhost/api?subscriptionId=sub_123'
        }) as NextRequest
      )) as Response;

      expect(response.status).toBe(200);
      expect(builder.update).toHaveBeenCalled();
    });
  });

  describe('GET', () => {
    it('requires userId', async () => {
      const response = (await GET(
        buildRequest({
          method: 'GET',
          url: 'http://localhost/api'
        }) as NextRequest
      )) as Response;

      expect(response.status).toBe(400);
    });

    it('returns preferences when found', async () => {
      const builder = createQueryBuilder();
      builder.maybeSingle.mockResolvedValue({
        data: {
          preferences: { newPolls: false, weeklyDigest: true },
          updated_at: '2025-01-01T00:00:00.000Z'
        },
        error: null
      });

      mockSupabaseFrom.mockImplementation((table: string) =>
        table === 'push_subscriptions' ? builder : createQueryBuilder()
      );

      const response = (await GET(
        buildRequest({
          method: 'GET',
          url: 'http://localhost/api?userId=user-123'
        }) as NextRequest
      )) as Response;

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data.preferences.newPolls).toBe(false);
      expect(body.data.preferences.weeklyDigest).toBe(true);
      expect(body.data.timestamp).toBeDefined();
    });
  });

  describe('PUT', () => {
    it('validates request body', async () => {
      const response = (await PUT(
        buildRequest({
          method: 'PUT',
          body: JSON.stringify({ userId: 'user-123' })
        }) as NextRequest
      )) as Response;

      expect(response.status).toBe(400);
    });

    it('updates preferences for active subscriptions', async () => {
      const builder = createQueryBuilder();
      const updateChain = createQueryBuilder();
      updateChain.eq.mockImplementation(() => updateChain);
      updateChain.select.mockReturnValue({
        data: [{ id: 'sub_123' }],
        error: null
      });
      builder.update.mockReturnValue(updateChain);

      mockSupabaseFrom.mockImplementation((table: string) =>
        table === 'push_subscriptions' ? builder : createQueryBuilder()
      );

      const response = (await PUT(
        buildRequest({
          method: 'PUT',
          body: JSON.stringify({
            userId: 'user-123',
            preferences: { weeklyDigest: false }
          })
        }) as NextRequest
      )) as Response;

      expect(response.status).toBe(200);
      expect(builder.update).toHaveBeenCalled();
    });
  });
});

