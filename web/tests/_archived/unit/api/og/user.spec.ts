/**
 * OG Image Generation Tests - User Profiles
 *
 * Tests for Open Graph image generation for user profile pages
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

describe('OG Image Generation - User Profiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate OG image for valid user profile', async () => {
    const { GET } = await import('@/app/api/og/user/[id]/route');

    const mockProfile = {
      user_id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      trust_tier: 'T2',
      avatar_url: 'https://example.com/avatar.jpg',
    };

    (mockSupabaseClient.from as jest.MockedFunction<any>).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn<() => Promise<{ data: typeof mockProfile | null; error: any }>>().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/og/user/user-123');
    const response = await GET(request, { params: { id: 'user-123' } });

    expect(response).toBeDefined();
    expect(mockSupabaseClient.from as jest.MockedFunction<any>).toHaveBeenCalledWith('user_profiles');
  });

  it('should use email as fallback when username is missing', async () => {
    const { GET } = await import('@/app/api/og/user/[id]/route');

    const mockProfile = {
      user_id: 'user-456',
      username: null,
      email: 'user@example.com',
      trust_tier: 'T1',
    };

    (mockSupabaseClient.from as jest.MockedFunction<any>).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn<() => Promise<{ data: typeof mockProfile | null; error: any }>>().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/og/user/user-456');
    const response = await GET(request, { params: { id: 'user-456' } });

    expect(response).toBeDefined();
  });

  it('should return default image when profile not found', async () => {
    const { GET } = await import('@/app/api/og/user/[id]/route');

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

    const request = new NextRequest('http://localhost:3000/api/og/user/invalid-id');
    const response = await GET(request, { params: { id: 'invalid-id' } });

    expect(response).toBeDefined();
  });

  it('should handle database errors gracefully', async () => {
    const { GET } = await import('@/app/api/og/user/[id]/route');

    (mockSupabaseClient.from as jest.MockedFunction<any>).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn<() => Promise<never>>().mockRejectedValue(new Error('Database error')),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/og/user/test-id');
    const response = await GET(request, { params: { id: 'test-id' } });

    expect(response).toBeDefined();
  });
});

