/**
 * @jest-environment node
 *
 * Contract tests for granular profile data deletion (DELETE /api/profile/data).
 */

import { createNextRequest } from '@/tests/contracts/helpers/request';

const mockSupabaseClient: Record<string, unknown> = {
  auth: {
    getSession: jest.fn(),
  },
  from: jest.fn(),
};

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(async () => mockSupabaseClient),
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const loadRoute = () => {
  let routeModule: { DELETE: (req: Request) => Promise<Response> };
  jest.isolateModules(() => {
    routeModule = require('@/app/api/profile/data/route');
  });
  return routeModule;
};

describe('Profile data DELETE API contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockSupabaseClient.auth as { getSession: jest.Mock }).getSession.mockResolvedValue({
      data: { session: { user: { id: 'auth-user-1' } } },
      error: null,
    });
  });

  it('returns success envelope when clearing location data', async () => {
    (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { DELETE } = loadRoute();
    const response = await DELETE(
      createNextRequest('http://localhost/api/profile/data?type=location', {
        method: 'DELETE',
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.objectContaining({
        message: expect.stringContaining('demographics'),
        deletedCount: 1,
        dataType: 'location',
      }),
    );
    expect(body.metadata).toEqual(
      expect.objectContaining({
        timestamp: expect.any(String),
      }),
    );
  });

  it('returns 401 when session is missing', async () => {
    (mockSupabaseClient.auth as { getSession: jest.Mock }).getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { DELETE } = loadRoute();
    const response = await DELETE(
      createNextRequest('http://localhost/api/profile/data?type=location', {
        method: 'DELETE',
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.code).toBe('AUTH_ERROR');
  });

  it('returns validation error when type query is missing', async () => {
    const { DELETE } = loadRoute();
    const response = await DELETE(
      createNextRequest('http://localhost/api/profile/data', {
        method: 'DELETE',
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns validation error for unknown data type', async () => {
    const { DELETE } = loadRoute();
    const response = await DELETE(
      createNextRequest('http://localhost/api/profile/data?type=not-a-real-type', {
        method: 'DELETE',
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(String(body.details?.type ?? body.error)).toContain('Unknown data type');
  });
});
