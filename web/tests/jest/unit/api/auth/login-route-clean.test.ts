/**
 * @jest-environment node
 */

// Mock Supabase server client
jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/login/route';
import { getSupabaseServerClient } from '@/utils/supabase/server';

// Create a proper mock chain for Supabase queries
const mockQueryChain = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

// Mock the Supabase client
const mockSupabaseClient = {
  auth: {
    signInWithPassword: jest.fn(),
  },
  from: jest.fn(() => mockQueryChain),
};

describe('Auth Login Route - Clean Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the mock chain
    mockQueryChain.select.mockReturnThis();
    mockQueryChain.eq.mockReturnThis();
    mockQueryChain.single.mockResolvedValue({
      data: null,
      error: null,
    });
    
    // Ensure the from method returns the mock chain
    mockSupabaseClient.from.mockReturnValue(mockQueryChain);
    
    (getSupabaseServerClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
  });

  describe('Authentication Tests', () => {
    it('should handle invalid credentials gracefully', async () => {
      // Mock authentication failure
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: null,
          session: null,
        },
        error: {
          message: 'Invalid login credentials',
        },
      });

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
          'user-agent': 'test-agent',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toBe('Invalid email or password');
    });

    it('should handle successful authentication', async () => {
      // Mock successful authentication
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            email_confirmed_at: new Date().toISOString(),
          },
          session: {
            access_token: 'access-token',
            refresh_token: 'refresh-token',
          },
        },
        error: null,
      });

      // Mock user profile query
      mockQueryChain.single.mockResolvedValue({
        data: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          is_active: true,
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
          'user-agent': 'test-agent',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
    });

    it('should handle missing credentials', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Email and password are required');
    });

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Internal server error');
    });
  });

  describe('Rate Limiting Tests', () => {
    it('should handle rate limiting', async () => {
      // This test would require mocking the rate limiter
      // For now, we'll test the basic functionality
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      expect(response.status).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    it('should respond within performance budget', async () => {
      const startTime = Date.now();

      // Mock successful authentication
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            email_confirmed_at: new Date().toISOString(),
          },
          session: {
            access_token: 'access-token',
            refresh_token: 'refresh-token',
          },
        },
        error: null,
      });

      mockQueryChain.single.mockResolvedValue({
        data: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          is_active: true,
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(1000); // 1 second budget
    });
  });
});
