/**
 * Civic Actions API Integration Tests
 * 
 * Tests for Civic Engagement V2 API endpoints
 * 
 * Feature Flag: CIVIC_ENGAGEMENT_V2
 * 
 * Created: January 2025
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, jest } from '@jest/globals';
import type { NextRequest } from 'next/server';

import { GET, POST } from '@/app/api/civic-actions/route';
import { GET as GET_ID, PATCH, DELETE } from '@/app/api/civic-actions/[id]/route';
import { POST as POST_SIGN } from '@/app/api/civic-actions/[id]/sign/route';

// Mock dependencies
jest.mock('@/lib/core/feature-flags', () => ({
  isFeatureEnabled: jest.fn(() => true),
}));

jest.mock('@/lib/rate-limiting/api-rate-limiter', () => ({
  apiRateLimiter: {
    checkLimit: jest.fn(() => Promise.resolve({ allowed: true })),
  },
}));

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(),
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockSupabase = jest.requireMock('@/utils/supabase/server') as {
  getSupabaseServerClient: jest.Mock;
};

const createMockSupabaseClient = () => {
  const mockClient = {
    from: jest.fn(() => mockClient),
    select: jest.fn(() => mockClient),
    insert: jest.fn(() => mockClient),
    update: jest.fn(() => mockClient),
    delete: jest.fn(() => mockClient),
    eq: jest.fn(() => mockClient),
    contains: jest.fn(() => mockClient),
    order: jest.fn(() => mockClient),
    range: jest.fn(() => mockClient),
    single: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  };
  return mockClient;
};

const createRequest = (
  method: string,
  url: string,
  body?: unknown,
  headers: Record<string, string> = {}
): NextRequest => {
  return new NextRequest(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  } as any);
};

describe('Civic Actions API', () => {
  let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = createMockSupabaseClient();
    mockSupabase.getSupabaseServerClient.mockResolvedValue(mockSupabaseClient);
  });

  describe('GET /api/civic-actions', () => {
    it('should return list of civic actions', async () => {
      const mockActions = [
        {
          id: '1',
          title: 'Test Action',
          action_type: 'petition',
          status: 'active',
          is_public: true,
          current_signatures: 10,
          required_signatures: 100,
        },
      ];

      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.order.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.range.mockResolvedValue({
        data: mockActions,
        error: null,
        count: 1,
      });
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = createRequest('GET', 'http://localhost:3000/api/civic-actions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should filter by status', async () => {
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.order.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = createRequest(
        'GET',
        'http://localhost:3000/api/civic-actions?status=active'
      );
      await GET(request);

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'active');
    });

    it('should return 403 when feature flag is disabled', async () => {
      const { isFeatureEnabled } = jest.requireMock('@/lib/core/feature-flags');
      isFeatureEnabled.mockReturnValue(false);

      const request = createRequest('GET', 'http://localhost:3000/api/civic-actions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('disabled');
    });
  });

  describe('POST /api/civic-actions', () => {
    it('should create a new civic action', async () => {
      const mockAction = {
        id: '1',
        title: 'New Action',
        action_type: 'petition',
        urgency_level: 'medium',
        is_public: true,
        status: 'draft',
        created_by: 'user-123',
        current_signatures: 0,
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValue({
        data: mockAction,
        error: null,
      });

      const request = createRequest('POST', 'http://localhost:3000/api/civic-actions', {
        title: 'New Action',
        action_type: 'petition',
        urgency_level: 'medium',
        is_public: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.title).toBe('New Action');
    });

    it('should validate required fields', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const request = createRequest('POST', 'http://localhost:3000/api/civic-actions', {
        // Missing required title
        action_type: 'petition',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should require authentication', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const request = createRequest('POST', 'http://localhost:3000/api/civic-actions', {
        title: 'Test',
        action_type: 'petition',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Authentication required');
    });
  });

  describe('GET /api/civic-actions/[id]', () => {
    it('should return a single civic action', async () => {
      const mockAction = {
        id: '1',
        title: 'Test Action',
        action_type: 'petition',
        status: 'active',
        is_public: true,
      };

      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });
      mockSupabaseClient.single.mockResolvedValue({
        data: mockAction,
        error: null,
      });

      const request = createRequest('GET', 'http://localhost:3000/api/civic-actions/1');
      const response = await GET_ID(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('1');
    });

    it('should return 404 for non-existent action', async () => {
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const request = createRequest('GET', 'http://localhost:3000/api/civic-actions/999');
      const response = await GET_ID(request, { params: Promise.resolve({ id: '999' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });
  });

  describe('PATCH /api/civic-actions/[id]', () => {
    it('should update a civic action', async () => {
      const existingAction = {
        id: '1',
        created_by: 'user-123',
      };

      const updatedAction = {
        ...existingAction,
        title: 'Updated Title',
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: existingAction,
        error: null,
      });
      mockSupabaseClient.update.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: updatedAction,
        error: null,
      });

      const request = createRequest('PATCH', 'http://localhost:3000/api/civic-actions/1', {
        title: 'Updated Title',
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.title).toBe('Updated Title');
    });

    it('should prevent updating other users actions', async () => {
      const existingAction = {
        id: '1',
        created_by: 'other-user',
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValue({
        data: existingAction,
        error: null,
      });

      const request = createRequest('PATCH', 'http://localhost:3000/api/civic-actions/1', {
        title: 'Updated Title',
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Permission denied');
    });
  });

  describe('DELETE /api/civic-actions/[id]', () => {
    it('should delete a civic action', async () => {
      const existingAction = {
        id: '1',
        created_by: 'user-123',
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValue({
        data: existingAction,
        error: null,
      });
      mockSupabaseClient.delete.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockResolvedValue({
        error: null,
      });

      const request = createRequest('DELETE', 'http://localhost:3000/api/civic-actions/1');
      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.deleted).toBe(true);
    });
  });

  describe('POST /api/civic-actions/[id]/sign', () => {
    it('should sign a civic action', async () => {
      const action = {
        id: '1',
        status: 'active',
        is_public: true,
        current_signatures: 5,
        required_signatures: 100,
        end_date: null,
      };

      const metadata = { signatures: [] };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single
        .mockResolvedValueOnce({
          data: action,
          error: null,
        })
        .mockResolvedValueOnce({
          data: { metadata },
          error: null,
        });
      mockSupabaseClient.update.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { ...action, current_signatures: 6 },
        error: null,
      });

      const request = createRequest('POST', 'http://localhost:3000/api/civic-actions/1/sign');
      const response = await POST_SIGN(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.signed).toBe(true);
      expect(data.data.signature_count).toBe(6);
    });

    it('should prevent signing inactive actions', async () => {
      const action = {
        id: '1',
        status: 'completed',
        is_public: true,
        current_signatures: 5,
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValue({
        data: action,
        error: null,
      });

      const request = createRequest('POST', 'http://localhost:3000/api/civic-actions/1/sign');
      const response = await POST_SIGN(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('not currently active');
    });

    it('should prevent duplicate signatures', async () => {
      const action = {
        id: '1',
        status: 'active',
        is_public: true,
        current_signatures: 5,
        end_date: null,
      };

      const metadata = { signatures: ['user-123'] };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single
        .mockResolvedValueOnce({
          data: action,
          error: null,
        })
        .mockResolvedValueOnce({
          data: { metadata },
          error: null,
        });

      const request = createRequest('POST', 'http://localhost:3000/api/civic-actions/1/sign');
      const response = await POST_SIGN(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('already signed');
    });
  });
});

