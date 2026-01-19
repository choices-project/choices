/**
 * OG Image Generation Tests - Representatives
 *
 * Tests for Open Graph image generation for representative pages
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

describe('OG Image Generation - Representatives', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate OG image for valid representative', async () => {
    const { GET } = await import('@/app/api/og/representative/[id]/route');

    const mockRepresentative = {
      id: 123,
      name: 'John Doe',
      office: 'U.S. Senator',
      party: 'Democratic',
      state: 'CA',
      district: null,
      primary_photo_url: 'https://example.com/photo.jpg',
    };

    (mockSupabaseClient.from as jest.MockedFunction<any>).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn<() => Promise<{ data: typeof mockRepresentative | null; error: any }>>().mockResolvedValue({
            data: mockRepresentative,
            error: null,
          }),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/og/representative/123');
    const response = await GET(request, { params: { id: '123' } });

    expect(response).toBeDefined();
    expect(mockSupabaseClient.from as jest.MockedFunction<any>).toHaveBeenCalledWith('representatives_core');
  });

  it('should return default image when representative not found', async () => {
    const { GET } = await import('@/app/api/og/representative/[id]/route');

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

    const request = new NextRequest('http://localhost:3000/api/og/representative/999');
    const response = await GET(request, { params: { id: '999' } });

    expect(response).toBeDefined();
  });

  it('should handle missing optional fields', async () => {
    const { GET } = await import('@/app/api/og/representative/[id]/route');

    const mockRepresentative = {
      id: 456,
      name: 'Jane Smith',
      office: null,
      party: null,
      state: null,
      district: null,
    };

    (mockSupabaseClient.from as jest.MockedFunction<any>).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn<() => Promise<{ data: typeof mockRepresentative | null; error: any }>>().mockResolvedValue({
            data: mockRepresentative,
            error: null,
          }),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/og/representative/456');
    const response = await GET(request, { params: { id: '456' } });

    expect(response).toBeDefined();
  });
});

