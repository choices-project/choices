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

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(async () => mockSupabaseClient),
}));

describe('Contact Threads API contract', () => {
  const loadRoutes = () => {
    let routeModule: any;
    jest.isolateModules(() => {
      routeModule = require('@/app/api/contact/threads/route');
    });
    return routeModule;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient.auth.getUser.mockReset();
    mockSupabaseClient.from.mockReset();
  });

  it('returns helper envelope for GET threads', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const threadsResponse = createPostgrestBuilder({
      data: [
        {
          id: 'thread-1',
          user_id: 'user-1',
          representative_id: 42,
          subject: 'Town hall',
          status: 'active',
          priority: 'normal',
          created_at: '2025-11-14T00:00:00.000Z',
          updated_at: '2025-11-14T00:00:00.000Z',
          last_message_at: '2025-11-14T00:00:00.000Z',
          message_count: 3,
          representatives_core: {
            id: 42,
            name: 'Rep Example',
            office: 'Office',
            party: 'Independent',
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

    let contactThreadsCall = 0;
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'contact_threads') {
        contactThreadsCall += 1;
        return contactThreadsCall === 1 ? threadsResponse : countResponse;
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { GET } = loadRoutes();
    const response = await GET(createNextRequest('http://localhost/api/contact/threads'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.threads).toHaveLength(1);
    expect(body.data.pagination.total).toBe(1);
  });

  it('requires authentication for GET threads', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'No session' },
    });

    const { GET } = loadRoutes();
    const response = await GET(createNextRequest('http://localhost/api/contact/threads'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.code).toBe('AUTH_ERROR');
  });

  it('propagates database failures for GET threads', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const failingResponse = createPostgrestBuilder({
      data: [],
      error: { message: 'threads query failed' } as any,
    });

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'contact_threads') {
        return failingResponse;
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { GET } = loadRoutes();
    const response = await GET(createNextRequest('http://localhost/api/contact/threads'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch threads');
  });

  it('validates required fields for POST', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    mockSupabaseClient.from.mockImplementation(() => {
      throw new Error('Supabase should not be called for validation error');
    });

    const { POST } = loadRoutes();
    const response = await POST(
      createNextRequest('http://localhost/api/contact/threads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          representativeId: '42',
          priority: 'normal',
        }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.details.subject).toBe('Subject is required');
  });

  it('returns conflict when active thread already exists', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const repsBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 42, name: 'Rep Example' },
        error: null,
      }),
    };

    const existingThreadBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'thread-1', status: 'active' },
        error: null,
      }),
    };

    let contactThreadsCall = 0;
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'representatives_core') {
        return repsBuilder;
      }
      if (table === 'contact_threads') {
        contactThreadsCall += 1;
        if (contactThreadsCall === 1) {
          return existingThreadBuilder;
        }
        throw new Error('Unexpected contact_threads insert during conflict path');
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { POST } = loadRoutes();
    const response = await POST(
      createNextRequest('http://localhost/api/contact/threads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          representativeId: '42',
          subject: 'Town hall',
        }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(409);
    expect(body.success).toBe(false);
    expect(body.code).toBe('THREAD_EXISTS');
    expect(body.details.existingThreadId).toBe('thread-1');
  });
});

