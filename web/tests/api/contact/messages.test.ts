/**
 * Contact Messages API Tests
 * 
 * Tests for contact messages API endpoints
 * 
 * Created: January 26, 2025
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

import { POST, GET } from '@/app/api/contact/messages/route';

// Mock dependencies

jest.mock('@/lib/rate-limiting/api-rate-limiter', () => {
  jest.requireActual('@/lib/rate-limiting/api-rate-limiter');
  return {
    apiRateLimiter: {
      checkLimit: jest.fn(),
    },
  };
});

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(),
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

describe('POST /api/contact/messages', () => {
  let apiRateLimiter: { checkLimit: jest.Mock };
  let getSupabaseServerClient: jest.Mock;
  let mockGetUser: jest.Mock;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockInsert: jest.Mock;
  let mockLimit: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Get mocked modules
    apiRateLimiter = (await import('@/lib/rate-limiting/api-rate-limiter')).apiRateLimiter;
    getSupabaseServerClient = (await import('@/utils/supabase/server')).getSupabaseServerClient;

    // Initialize mock functions
    mockGetUser = jest.fn();
    mockFrom = jest.fn();
    mockSelect = jest.fn();
    mockInsert = jest.fn();
    mockLimit = jest.fn();

    // Default successful rate limit
    apiRateLimiter.checkLimit.mockResolvedValue({
      allowed: true,
      remaining: 10,
      resetTime: Date.now() + 60000,
      totalHits: 0,
    });

    // Default Supabase setup
    getSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    });

    // Default authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });

    // Default successful insert
    mockInsert.mockResolvedValue({
      data: {
        id: 'new-message-id',
        thread_id: 'thread-id',
        sender_id: 'test-user-id',
        recipient_id: 'rep-id',
        content: 'Test message',
        subject: 'Test subject',
        status: 'sent',
        priority: 'normal',
        created_at: new Date().toISOString(),
        message_type: 'text',
        attachments: [],
      },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
    });

    // Chain for representative lookup
    const mockSingle = jest.fn();
    mockSelect.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: mockSingle,
      }),
      limit: mockLimit,
    });

    // Representative exists by default
    mockSingle.mockResolvedValue({
      data: { id: 'rep-id', name: 'Test Rep', office: 'Senator' },
      error: null,
    });

    mockLimit.mockResolvedValue({
      data: [],
      error: null,
    });
  });

  const createRequest = (body: unknown, headers: Record<string, string> = {}) => {
    return new NextRequest('http://localhost/api/contact/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    });
  };

  it('should create a message successfully', async () => {
    const request = createRequest({
      representativeId: 'rep-id',
      subject: 'Test Subject',
      content: 'Test message content',
      priority: 'normal',
      messageType: 'text',
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
  });

  it('should require authentication', async () => {
    // Mock unauthenticated user
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const request = createRequest({
      representativeId: 'rep-id',
      subject: 'Test',
      content: 'Test',
    });

    const response = await POST(request);
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Authentication');
  });

  it('should validate required fields', async () => {
    const request = createRequest({
      // Missing required fields
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('should enforce rate limiting', async () => {
    apiRateLimiter.checkLimit.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + 90000,
      totalHits: 11,
      retryAfter: 90,
    });

    const request = createRequest({
      representativeId: 'rep-id',
      subject: 'Test',
      content: 'Test',
    });

    const response = await POST(request);
    expect(response.status).toBe(429);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Too many messages');
    expect(data.retryAfter).toBeDefined();
  });
});

describe('GET /api/contact/messages', () => {
  let getSupabaseServerClient: jest.Mock;
  let mockGetUser: jest.Mock;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockEq: jest.Mock;
  let mockOrder: jest.Mock;
  let mockLimit: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    getSupabaseServerClient = (await import('@/utils/supabase/server')).getSupabaseServerClient;

    // Initialize mock functions
    mockGetUser = jest.fn();
    mockFrom = jest.fn();
    mockSelect = jest.fn();
    mockEq = jest.fn();
    mockOrder = jest.fn();
    mockLimit = jest.fn();

    getSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    });

    mockGetUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: mockSelect,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
      limit: mockLimit,
    });

    mockEq.mockReturnValue({
      order: mockOrder,
    });

    mockOrder.mockReturnValue({
      limit: mockLimit,
    });
  });

  const createRequest = (searchParams: Record<string, string> = {}) => {
    const params = new URLSearchParams(searchParams);
    return new NextRequest(`http://localhost/api/contact/messages?${params.toString()}`, {
      method: 'GET',
    });
  };

  it('should retrieve messages for a thread', async () => {
    const mockMessages = [
      {
        id: 'msg-1',
        thread_id: 'thread-id',
        sender_id: 'user-id',
        recipient_id: 'rep-id',
        content: 'Message 1',
        subject: 'Test',
        status: 'sent',
        created_at: new Date().toISOString(),
      },
    ];

    mockLimit.mockResolvedValueOnce({
      data: mockMessages,
      error: null,
    });

    mockLimit.mockResolvedValueOnce({
      data: [{ count: mockMessages.length }],
      error: null,
    });

    const request = createRequest({ threadId: 'thread-id' });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.messages).toBeDefined();
  });

  it('should require threadId parameter', async () => {
    const request = createRequest({});

    const response = await GET(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('threadId');
  });
});
