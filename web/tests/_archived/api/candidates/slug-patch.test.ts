/**
 * @jest-environment node
 */

import type { NextRequest } from 'next/server';

import { PATCH } from '@/app/api/candidates/[slug]/route';

// Mock Supabase server client
const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockMaybeSingle = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

// Mock API helpers to return simple Response-like objects
jest.mock('@/lib/api', () => {
  const createResponse = (status: number, payload: unknown) => ({
    status,
    json: async () => payload,
  });
  return {
    __esModule: true,
    withErrorHandling:
      (handler: any) =>
      (...args: any[]) =>
        handler(...args),
    successResponse: (data: unknown, _meta?: unknown, status = 200) =>
      createResponse(status, { success: true, data }),
    notFoundError: (message: string) =>
      createResponse(404, { success: false, error: message }),
    validationError: (details: unknown, message?: string) =>
      createResponse(400, { success: false, error: message ?? 'Validation error', details }),
    forbiddenError: (message: string) =>
      createResponse(403, { success: false, error: message }),
    errorResponse: (message: string, status = 500) =>
      createResponse(status, { success: false, error: message }),
    methodNotAllowed: (methods: string[]) =>
      createResponse(405, { success: false, error: `Method not allowed. Use: ${methods.join(', ')}` }),
  };
});

const buildRequest = (url = 'http://localhost/api/candidates/test-slug', body?: any): NextRequest =>
  ({
    url,
    method: 'PATCH',
    headers: {
      get: (key: string) => {
        const lower = key.toLowerCase();
        if (lower === 'x-forwarded-for') return '127.0.0.1';
        if (lower === 'user-agent') return 'jest';
        return null;
      },
    },
    json: async () => body,
  } as unknown as NextRequest);

describe('PATCH /api/candidates/[slug]', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset chainable mocks
    mockFrom.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
      eq: mockEq,
    });
    mockSelect.mockReturnValue({ eq: mockEq, maybeSingle: mockMaybeSingle });
    mockEq.mockImplementation(() => ({ maybeSingle: mockMaybeSingle, update: mockUpdate, eq: mockEq }));
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    // update() should be chainable with .eq(...)
    mockUpdate.mockImplementation(() => ({ eq: () => ({ error: null }) }));
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = (await PATCH(buildRequest(), { params: { slug: 'test-slug' } })) as Response;
    expect(res.status).toBe(401);
    const payload = await res.json();
    expect(payload.success).toBe(false);
  });

  it('returns 404 when candidate not found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    // candidate_profiles maybeSingle => null
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const res = (await PATCH(buildRequest(undefined, { display_name: 'New Name' }), {
      params: { slug: 'missing' },
    })) as Response;
    expect(res.status).toBe(404);
  });

  it('returns 403 when user is not the owner', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    // found candidate but different owner
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: 'cand-1', user_id: 'u2' },
      error: null,
    });

    const res = (await PATCH(buildRequest(undefined, { display_name: 'X' }), {
      params: { slug: 'test-slug' },
    })) as Response;
    expect(res.status).toBe(403);
  });

  it('returns 400 when no editable fields provided', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: 'cand-1', user_id: 'u1' },
      error: null,
    });

    const res = (await PATCH(buildRequest(undefined, {}), {
      params: { slug: 'test-slug' },
    })) as Response;
    expect(res.status).toBe(400);
    const payload = await res.json();
    expect(payload.details).toBeDefined();
  });

  it('updates allowed fields and returns the updated profile', async () => {
    // ensure update path resolves without chaining errors
    mockFrom.mockImplementation((table: string) => {
      if (table === 'candidate_profiles') {
        return {
          select: () => ({ eq: () => ({ maybeSingle: mockMaybeSingle }) }),
          update: () => ({ eq: () => ({ error: null }) }),
          eq: () => ({ maybeSingle: mockMaybeSingle }),
        };
      }
      return {
        select: () => ({ eq: () => ({ maybeSingle: mockMaybeSingle }) }),
        update: () => ({ eq: () => ({ error: null }) }),
        eq: () => ({ maybeSingle: mockMaybeSingle }),
      };
    });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    // candidate exists and owned by user
    mockMaybeSingle
      .mockResolvedValueOnce({
        data: { id: 'cand-1', user_id: 'u1' },
        error: null,
      }) // initial fetch
      .mockResolvedValueOnce({
        data: {
          id: 'cand-1',
          slug: 'test-slug',
          display_name: 'Updated',
          office: 'Mayor',
          jurisdiction: 'City',
          party: 'Independent',
          bio: 'Hello',
          website: 'https://example.com',
          social: { x: '@handle' },
          filing_status: 'declared',
          is_public: true,
          representative_id: null,
        },
        error: null,
      }); // post-update fetch

    mockUpdate.mockResolvedValue({ error: null });

    const body = {
      display_name: 'Updated',
      office: 'Mayor',
      is_public: true,
    };
    const res = (await PATCH(buildRequest(undefined, body), {
      params: { slug: 'test-slug' },
    })) as Response;

    // update flow delegated to helper; we assert final response
    expect(res.status).toBe(200);
    const payload = await res.json();
    expect(payload.success).toBe(true);
    expect(payload.data.display_name).toBe('Updated');
  });
});
