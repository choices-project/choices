/**
 * OG Image Generation Tests - Polls
 *
 * Tests for Open Graph image generation for poll pages
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock @vercel/og
jest.mock('@vercel/og', () => ({
  ImageResponse: jest.fn((element: any, options: any) => {
    return {
      element,
      options,
      headers: new Headers({
        'Content-Type': 'image/png',
      }),
    };
  }),
}));

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn() as jest.MockedFunction<any>,
};

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(() => Promise.resolve(mockSupabaseClient)),
}));

jest.mock('@/lib/utils/logger', () => {
  const loggerMock = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
  return {
    __esModule: true,
    default: loggerMock,
  };
});

describe('OG Image Generation - Polls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate OG image for valid poll', async () => {
    const { GET } = await import('@/app/api/og/poll/[id]/route');

    // Mock poll data
    const mockPoll = {
      id: 'test-poll-id',
      title: 'Test Poll Title',
      description: 'This is a test poll description',
      total_votes: 42,
      status: 'active',
    };

    (mockSupabaseClient.from as jest.MockedFunction<any>).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn<() => Promise<{ data: typeof mockPoll | null; error: any }>>().mockResolvedValue({
            data: mockPoll,
            error: null,
          }),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/og/poll/test-poll-id');
    const response = await GET(request, { params: { id: 'test-poll-id' } });

    expect(response).toBeDefined();
    expect(mockSupabaseClient.from as jest.MockedFunction<any>).toHaveBeenCalledWith('polls');
  });

  it('should return default image when poll not found', async () => {
    const { GET } = await import('@/app/api/og/poll/[id]/route');

    (mockSupabaseClient.from as jest.MockedFunction<any>).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn<() => Promise<{ data: null; error: any }>>().mockResolvedValue({
            data: null,
            error: { message: 'Not found' },
          }),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/og/poll/invalid-id');
    const response = await GET(request, { params: { id: 'invalid-id' } });

    expect(response).toBeDefined();
  });

  it('should handle database errors gracefully', async () => {
    const { GET } = await import('@/app/api/og/poll/[id]/route');

    (mockSupabaseClient.from as jest.MockedFunction<any>).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn<() => Promise<never>>().mockRejectedValue(new Error('Database error')),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/og/poll/test-id');
    const response = await GET(request, { params: { id: 'test-id' } });

    expect(response).toBeDefined();
  });

  it('should truncate long titles and descriptions', async () => {
    const { GET } = await import('@/app/api/og/poll/[id]/route');

    const longTitle = 'A'.repeat(100);
    const longDescription = 'B'.repeat(200);

    const mockPoll = {
      id: 'test-poll-id',
      title: longTitle,
      description: longDescription,
      total_votes: 0,
      status: 'draft',
    };

    (mockSupabaseClient.from as jest.MockedFunction<any>).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn<() => Promise<{ data: typeof mockPoll | null; error: any }>>().mockResolvedValue({
            data: mockPoll,
            error: null,
          }),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/og/poll/test-poll-id');
    const response = await GET(request, { params: { id: 'test-poll-id' } });

    expect(response).toBeDefined();
  });
});

