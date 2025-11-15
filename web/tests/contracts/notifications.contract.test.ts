/**
 * @jest-environment node
 */

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

describe('Notifications API contract', () => {
  const loadRoute = () => {
    let routeModule: any;
    jest.isolateModules(() => {
      routeModule = require('@/app/api/notifications/route');
    });
    return routeModule;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient.auth.getUser.mockReset();
    mockSupabaseClient.from.mockReset();
  });

  it('returns helper envelope for GET notifications', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'notify@example.com' } },
      error: null,
    });

    const notifications = [
      {
        id: 'notif-1',
        user_id: 'user-1',
        title: 'Poll update',
        body: 'New poll available',
        created_at: '2025-11-14T00:00:00.000Z',
      },
    ];

    const selectBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn(() => Promise.resolve({ data: notifications, error: null })),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'notification_log') {
        return selectBuilder;
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { GET } = loadRoute();
    const response = await GET(
      createNextRequest('http://localhost/api/notifications?limit=5&unread_only=false'),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.notifications).toHaveLength(1);
    expect(body.data.total).toBe(1);
  });

  it('allows notification creation via POST', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-2', email: 'create@example.com' } },
      error: null,
    });

    const singleBuilder = {
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'notif-2',
          title: 'System alert',
          body: 'All good',
          created_at: '2025-11-14T01:00:00.000Z',
        },
        error: null,
      }),
    };

    const insertBuilder = {
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue(singleBuilder),
      }),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'notification_log') {
        return insertBuilder;
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { POST } = loadRoute();
    const payload = {
      title: 'System alert',
      message: 'All good',
      notification_type: 'system',
    };
    const response = await POST(
      createNextRequest('http://localhost/api/notifications', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('System alert');
  });

  it('marks notifications as read via PUT', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-3', email: 'reader@example.com' } },
      error: null,
    });

    const updateBuilder = {
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'notif-read', read_at: '2025-11-14T02:00:00.000Z' },
                error: null,
              }),
            }),
          }),
        }),
      }),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'notification_log') {
        return updateBuilder;
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { PUT } = loadRoute();
    const response = await PUT(
      createNextRequest('http://localhost/api/notifications', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ notificationId: 'notif-read' }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('notif-read');
    expect(body.data.readAt).toBe('2025-11-14T02:00:00.000Z');
  });

  it('returns validation error when POST payload invalid', async () => {
    const { POST } = loadRoute();
    const response = await POST(
      createNextRequest('http://localhost/api/notifications', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Missing message',
          notification_type: 'system',
        }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.error).toBe('Validation failed');
  });

  it('returns not found when PUT notification missing', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-3', email: 'reader@example.com' } },
      error: null,
    });

    const updateBuilder = {
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      }),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'notification_log') {
        return updateBuilder;
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { PUT } = loadRoute();
    const response = await PUT(
      createNextRequest('http://localhost/api/notifications', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ notificationId: 'missing-id' }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.code).toBe('NOT_FOUND');
  });
});


