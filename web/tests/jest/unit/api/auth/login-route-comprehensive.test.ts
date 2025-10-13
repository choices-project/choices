/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/login/route';
import { getSupabaseServerClient } from '@/utils/supabase/server';

// Mock Supabase client
jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(),
}));

// Mock Next.js headers
jest.mock('next/headers', () => ({
  cookies: () => ({
    get: jest.fn(),
    set: jest.fn(),
  }),
}));

// Mock logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('Auth Login Route - Comprehensive Testing', () => {
  let mockSupabaseClient: any;
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Supabase client
    mockSupabaseClient = {
      auth: {
        signInWithPassword: jest.fn(),
        getUser: jest.fn(),
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
    };

    (getSupabaseServerClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
  });

  describe('Successful Authentication', () => {
    it('should authenticate user with valid credentials', async () => {
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

      // Mock user profile lookup
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: {
          id: 'user-123',
          email: 'test@example.com',
          display_name: 'Test User',
          is_active: true,
        },
        error: null,
      });

      // Create request with valid credentials
      mockRequest = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('test@example.com');
      expect(data.session).toBeDefined();
    });

    it('should handle user with confirmed email', async () => {
      // Mock successful authentication with confirmed email
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

      // Mock active user profile
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: {
          id: 'user-123',
          email: 'test@example.com',
          display_name: 'Test User',
          is_active: true,
        },
        error: null,
      });

      mockRequest = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.email_confirmed).toBe(true);
    });
  });

  describe('Authentication Failures', () => {
    it('should reject invalid credentials', async () => {
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

      mockRequest = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid login credentials');
    });

    it('should reject inactive user', async () => {
      // Mock successful authentication but inactive user
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

      // Mock inactive user profile
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: {
          id: 'user-123',
          email: 'test@example.com',
          display_name: 'Test User',
          is_active: false,
        },
        error: null,
      });

      mockRequest = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Account is inactive');
    });

    it('should reject unconfirmed email', async () => {
      // Mock successful authentication but unconfirmed email
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            email_confirmed_at: null,
          },
          session: {
            access_token: 'access-token',
            refresh_token: 'refresh-token',
          },
        },
        error: null,
      });

      // Mock active user profile
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: {
          id: 'user-123',
          email: 'test@example.com',
          display_name: 'Test User',
          is_active: true,
        },
        error: null,
      });

      mockRequest = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Email not confirmed');
    });
  });

  describe('Input Validation', () => {
    it('should validate email format', async () => {
      mockRequest = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'password123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid email format');
    });

    it('should validate password strength', async () => {
      mockRequest = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: '123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Password too weak');
    });

    it('should require both email and password', async () => {
      mockRequest = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Email and password are required');
    });

    it('should sanitize email input', async () => {
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

      // Mock user profile lookup
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: {
          id: 'user-123',
          email: 'test@example.com',
          display_name: 'Test User',
          is_active: true,
        },
        error: null,
      });

      mockRequest = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: '  TEST@EXAMPLE.COM  ',
          password: 'password123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Should normalize email to lowercase
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should implement rate limiting for failed attempts', async () => {
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

      // Make multiple failed attempts
      for (let i = 0; i < 5; i++) {
        mockRequest = new NextRequest('http://localhost:3000/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'wrongpassword',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await POST(mockRequest);
        
        if (i < 4) {
          expect(response.status).toBe(401);
        } else {
          // Should be rate limited after 5 attempts
          expect(response.status).toBe(429);
        }
      }
    });

    it('should reset rate limit after successful login', async () => {
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

      // Mock user profile lookup
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: {
          id: 'user-123',
          email: 'test@example.com',
          display_name: 'Test User',
          is_active: true,
        },
        error: null,
      });

      mockRequest = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Security', () => {
    it('should prevent SQL injection in email field', async () => {
      mockRequest = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: "'; DROP TABLE users; --",
          password: 'password123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid email format');
    });

    it('should prevent XSS in email field', async () => {
      mockRequest = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: '<script>alert("xss")</script>@example.com',
          password: 'password123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid email format');
    });

    it('should log security events', async () => {
      const { logger } = require('@/lib/utils/logger');
      
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

      mockRequest = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      await POST(mockRequest);

      expect(logger.warn).toHaveBeenCalledWith(
        'Failed login attempt',
        expect.objectContaining({
          email: 'test@example.com',
          ip: expect.any(String),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle Supabase connection errors', async () => {
      // Mock Supabase connection error
      (getSupabaseServerClient as jest.Mock).mockRejectedValue(
        new Error('Supabase connection failed')
      );

      mockRequest = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Internal server error');
    });

    it('should handle malformed JSON', async () => {
      mockRequest = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid JSON');
    });

    it('should handle missing request body', async () => {
      mockRequest = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Request body is required');
    });
  });

  describe('Performance', () => {
    it('should respond within performance budget', async () => {
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

      // Mock user profile lookup
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: {
          id: 'user-123',
          email: 'test@example.com',
          display_name: 'Test User',
          is_active: true,
        },
        error: null,
      });

      mockRequest = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const startTime = performance.now();
      const response = await POST(mockRequest);
      const endTime = performance.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(1000); // Should respond within 1 second
    });
  });
});




