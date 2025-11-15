/**
 * @jest-environment node
 */

import { createPostgrestBuilder } from '@/tests/contracts/helpers/postgrest';
import { createNextRequest } from '@/tests/contracts/helpers/request';

const mockSupabaseClient: Record<string, any> = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

const mockRateLimiter = {
  checkLimit: jest.fn(),
};

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(async () => mockSupabaseClient),
}));

jest.mock('@/lib/rate-limiting/api-rate-limiter', () => ({
  apiRateLimiter: mockRateLimiter,
}));

describe('Contact Messages API contract', () => {
  const loadRoutes = () => {
    let routeModule: any;
    jest.isolateModules(() => {
      routeModule = require('@/app/api/contact/messages/route');
    });
    return routeModule;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient.auth.getUser.mockReset();
    mockSupabaseClient.from.mockReset();
    mockRateLimiter.checkLimit.mockResolvedValue({ allowed: true });
  });

  it('returns helper envelope for GET messages', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
      error: null,
    });

    const representativesResponse = createPostgrestBuilder({
      data: [{ id: 'rep-1' }],
      error: null,
    });

    const messagesResponse = createPostgrestBuilder({
      data: [
        {
          id: 'msg-1',
          thread_id: 'thread-1',
          sender_id: 'user-1',
          recipient_id: 'rep-1',
          content: 'Hi there',
          subject: 'Civic Issue',
          status: 'sent',
          priority: 'normal',
          message_type: 'text',
          created_at: '2025-11-14T00:00:00.000Z',
          contact_threads: {
            id: 'thread-1',
            subject: 'Town hall',
            status: 'active',
            priority: 'normal',
            representatives_core: {
              id: 'rep-1',
              name: 'Rep Example',
              office: 'Office',
              party: 'Independent',
            },
          },
        },
      ],
      error: null,
    });

    const countResponse = createPostgrestBuilder({
      data: null,
      error: null,
      count: 1,
    });

    let contactMessagesCall = 0;
    mockSupabaseClient.from.mockImplementation((table: string) => {
      switch (table) {
        case 'representatives_core':
          return representativesResponse;
        case 'contact_messages':
          contactMessagesCall += 1;
          return contactMessagesCall === 1 ? messagesResponse : countResponse;
        case 'contact_threads':
          return createPostgrestBuilder({ data: [], error: null });
        default:
          throw new Error(`Unexpected table: ${table}`);
      }
    });

    const { GET } = loadRoutes();
    const response = await GET(createNextRequest('http://localhost/api/contact/messages'));

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data.messages).toHaveLength(1);
    expect(body.data.pagination.total).toBe(1);
  });

  it('returns auth error when user missing', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'No session' },
    });

    const { GET } = loadRoutes();
    const response = await GET(createNextRequest('http://localhost/api/contact/messages'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.code).toBe('AUTH_ERROR');
  });

  it('propagates Supabase failures for GET messages', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const repsResponse = createPostgrestBuilder({
      data: [],
      error: null,
    });

    const failingMessagesResponse = createPostgrestBuilder({
      data: [],
      error: { message: 'query failed' } as any,
    });

    let messagesCall = 0;
    mockSupabaseClient.from.mockImplementation((table: string) => {
      switch (table) {
        case 'representatives_core':
          return repsResponse;
        case 'contact_messages':
          messagesCall += 1;
          return messagesCall === 1 ? failingMessagesResponse : createPostgrestBuilder({ data: null, error: null });
        default:
          throw new Error(`Unexpected table: ${table}`);
      }
    });

    const { GET } = loadRoutes();
    const response = await GET(createNextRequest('http://localhost/api/contact/messages'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch messages');
  });

  it('validates required fields for POST', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    mockSupabaseClient.from.mockImplementation(() => {
      throw new Error('Supabase should not be called for validation failure');
    });

    const { POST } = loadRoutes();
    const response = await POST(
      createNextRequest('http://localhost/api/contact/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          representativeId: '42',
          content: 'Hello there',
        }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.details.subject).toBe('Subject is required');
  });

  it('returns not found when representative missing on POST', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const repBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'representatives_core') {
        return repBuilder;
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { POST } = loadRoutes();
    const response = await POST(
      createNextRequest('http://localhost/api/contact/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          representativeId: '42',
          subject: 'Town hall',
          content: 'Please attend',
        }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.code).toBe('NOT_FOUND');
    expect(body.error).toBe('Representative not found');
  });
});

