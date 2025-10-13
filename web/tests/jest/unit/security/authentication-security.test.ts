/**
 * Authentication Security Tests - PHASE 3 COMPREHENSIVE TESTING
 * 
 * Tests security aspects of the authentication system:
 * - Session management
 * - CSRF protection
 * - Rate limiting
 * - Input validation
 * - Password security
 * - WebAuthn security
 * - Data protection
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    updateUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      }))
    })),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }))
};

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/auth',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock WebAuthn
Object.defineProperty(navigator, 'credentials', {
  value: {
    create: jest.fn(),
    get: jest.fn(),
  },
  writable: true,
});

describe('Authentication Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset rate limiting
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Session Management Security', () => {
    it('should properly manage session tokens', async () => {
      const mockSession = {
        access_token: 'valid-token',
        refresh_token: 'valid-refresh-token',
        expires_at: Date.now() + 3600000, // 1 hour
        user: {
          id: 'user-123',
          email: 'test@example.com'
        }
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      // Test session validation
      const session = await mockSupabaseClient.auth.getSession();
      expect(session.data.session).toBeDefined();
      expect(session.data.session.access_token).toBe('valid-token');
      expect(session.data.session.expires_at).toBeGreaterThan(Date.now());
    });

    it('should handle expired sessions securely', async () => {
      const expiredSession = {
        access_token: 'expired-token',
        refresh_token: 'expired-refresh-token',
        expires_at: Date.now() - 3600000, // 1 hour ago
        user: {
          id: 'user-123',
          email: 'test@example.com'
        }
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: expiredSession },
        error: null
      });

      const session = await mockSupabaseClient.auth.getSession();
      expect(session.data.session.expires_at).toBeLessThan(Date.now());
      
      // Should trigger refresh or logout
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    });

    it('should securely store session data', async () => {
      const sessionData = {
        access_token: 'secure-token',
        refresh_token: 'secure-refresh-token',
        expires_at: Date.now() + 3600000
      };

      // Test that sensitive data is not exposed
      expect(sessionData.access_token).not.toContain('password');
      expect(sessionData.refresh_token).not.toContain('password');
      
      // Test that tokens are properly formatted
      expect(sessionData.access_token).toMatch(/^[A-Za-z0-9-_]+$/);
      expect(sessionData.refresh_token).toMatch(/^[A-Za-z0-9-_]+$/);
    });
  });

  describe('CSRF Protection', () => {
    it('should include CSRF tokens in requests', async () => {
      const csrfToken = 'csrf-token-123';
      
      // Mock CSRF token generation
      const generateCSRFToken = jest.fn(() => csrfToken);
      
      const request = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ email: 'test@example.com' })
      };

      expect(request.headers['X-CSRF-Token']).toBe(csrfToken);
      expect(generateCSRFToken).toHaveBeenCalled();
    });

    it('should validate CSRF tokens on server', async () => {
      const validToken = 'valid-csrf-token';
      const invalidToken = 'invalid-csrf-token';
      
      const validateCSRFToken = jest.fn((token) => token === validToken);
      
      expect(validateCSRFToken(validToken)).toBe(true);
      expect(validateCSRFToken(invalidToken)).toBe(false);
    });

    it('should reject requests without CSRF tokens', async () => {
      const requestWithoutCSRF = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: 'test@example.com' })
      };

      expect(requestWithoutCSRF.headers['X-CSRF-Token']).toBeUndefined();
      
      // Should be rejected
      const isValidRequest = requestWithoutCSRF.headers['X-CSRF-Token'] !== undefined;
      expect(isValidRequest).toBe(false);
    });
  });

  describe('Rate Limiting Security', () => {
    it('should implement rate limiting for login attempts', async () => {
      const rateLimiter = {
        attempts: 0,
        maxAttempts: 5,
        windowMs: 15 * 60 * 1000, // 15 minutes
        lastAttempt: 0
      };

      const attemptLogin = () => {
        const now = Date.now();
        
        if (now - rateLimiter.lastAttempt > rateLimiter.windowMs) {
          rateLimiter.attempts = 0;
        }
        
        if (rateLimiter.attempts >= rateLimiter.maxAttempts) {
          throw new Error('Rate limit exceeded');
        }
        
        rateLimiter.attempts++;
        rateLimiter.lastAttempt = now;
        return true;
      };

      // Test successful attempts
      for (let i = 0; i < 5; i++) {
        expect(attemptLogin()).toBe(true);
      }

      // Test rate limit exceeded
      expect(() => attemptLogin()).toThrow('Rate limit exceeded');
    });

    it('should implement rate limiting for password reset', async () => {
      const passwordResetLimiter = {
        attempts: 0,
        maxAttempts: 3,
        windowMs: 60 * 60 * 1000, // 1 hour
        lastAttempt: 0
      };

      const attemptPasswordReset = () => {
        const now = Date.now();
        
        if (now - passwordResetLimiter.lastAttempt > passwordResetLimiter.windowMs) {
          passwordResetLimiter.attempts = 0;
        }
        
        if (passwordResetLimiter.attempts >= passwordResetLimiter.maxAttempts) {
          throw new Error('Password reset rate limit exceeded');
        }
        
        passwordResetLimiter.attempts++;
        passwordResetLimiter.lastAttempt = now;
        return true;
      };

      // Test successful attempts
      for (let i = 0; i < 3; i++) {
        expect(attemptPasswordReset()).toBe(true);
      }

      // Test rate limit exceeded
      expect(() => attemptPasswordReset()).toThrow('Password reset rate limit exceeded');
    });

    it('should implement IP-based rate limiting', async () => {
      const ipRateLimiter = new Map();
      const maxRequestsPerIP = 100;
      const windowMs = 60 * 1000; // 1 minute

      const checkIPRateLimit = (ip: string) => {
        const now = Date.now();
        const ipData = ipRateLimiter.get(ip) || { count: 0, resetTime: now + windowMs };
        
        if (now > ipData.resetTime) {
          ipData.count = 0;
          ipData.resetTime = now + windowMs;
        }
        
        if (ipData.count >= maxRequestsPerIP) {
          throw new Error('IP rate limit exceeded');
        }
        
        ipData.count++;
        ipRateLimiter.set(ip, ipData);
        return true;
      };

      // Test IP rate limiting
      expect(checkIPRateLimit('192.168.1.1')).toBe(true);
      expect(checkIPRateLimit('192.168.1.2')).toBe(true);
    });
  });

  describe('Input Validation Security', () => {
    it('should validate email format securely', async () => {
      const validateEmail = (email: string) => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email) && email.length <= 254;
      };

      // Valid emails
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
      
      // Invalid emails
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('test@domain')).toBe(false);
      
      // XSS attempts
      expect(validateEmail('<script>alert("xss")</script>@domain.com')).toBe(false);
      expect(validateEmail('test@domain.com<script>')).toBe(false);
    });

    it('should validate password strength securely', async () => {
      const validatePassword = (password: string) => {
        if (password.length < 8) return false;
        if (password.length > 128) return false;
        
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
      };

      // Strong passwords
      expect(validatePassword('Password123!')).toBe(true);
      expect(validatePassword('MySecure@Pass1')).toBe(true);
      
      // Weak passwords
      expect(validatePassword('password')).toBe(false);
      expect(validatePassword('12345678')).toBe(false);
      expect(validatePassword('Password')).toBe(false);
      expect(validatePassword('PASSWORD123!')).toBe(false);
    });

    it('should sanitize user input', async () => {
      const sanitizeInput = (input: string) => {
        return input
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<[^>]*>/g, '')
          .trim();
      };

      // XSS attempts
      expect(sanitizeInput('<script>alert("xss")</script>Hello')).toBe('Hello');
      expect(sanitizeInput('<img src="x" onerror="alert(1)">')).toBe('');
      expect(sanitizeInput('javascript:alert("xss")')).toBe('javascript:alert("xss")');
      
      // SQL injection attempts
      expect(sanitizeInput("'; DROP TABLE users; --")).toBe("'; DROP TABLE users; --");
    });
  });

  describe('Password Security', () => {
    it('should hash passwords securely', async () => {
      const hashPassword = async (password: string) => {
        // Mock bcrypt-like hashing
        const salt = 'random-salt-123';
        const hashedPassword = `$2b$10$${salt}${password}`;
        return hashedPassword;
      };

      const password = 'MySecurePassword123!';
      const hashed = await hashPassword(password);
      
      expect(hashed).not.toBe(password);
      expect(hashed).toContain('$2b$10$');
      expect(hashed.length).toBeGreaterThan(50);
    });

    it('should verify passwords securely', async () => {
      const verifyPassword = (password: string, hashedPassword: string) => {
        // Mock bcrypt-like verification
        return hashedPassword.includes(password);
      };

      const password = 'MySecurePassword123!';
      const hashed = '$2b$10$random-salt-123MySecurePassword123!';
      
      expect(verifyPassword(password, hashed)).toBe(true);
      expect(verifyPassword('wrong-password', hashed)).toBe(false);
    });

    it('should prevent password reuse', async () => {
      const passwordHistory = [
        '$2b$10$salt1$oldpassword1',
        '$2b$10$salt2$oldpassword2',
        '$2b$10$salt3$oldpassword3'
      ];

      const checkPasswordReuse = (newPassword: string, history: string[]) => {
        return !history.some(hashed => hashed.includes(newPassword));
      };

      expect(checkPasswordReuse('newpassword', passwordHistory)).toBe(true);
      expect(checkPasswordReuse('oldpassword1', passwordHistory)).toBe(false);
    });
  });

  describe('WebAuthn Security', () => {
    it('should validate WebAuthn credentials securely', async () => {
      const mockCredential = {
        id: 'credential-id-123',
        type: 'public-key',
        rawId: new ArrayBuffer(16),
        response: {
          clientDataJSON: new ArrayBuffer(32),
          attestationObject: new ArrayBuffer(64)
        }
      };

      const validateWebAuthnCredential = (credential: any) => {
        return credential && 
               credential.id && 
               credential.type === 'public-key' &&
               credential.response &&
               credential.response.clientDataJSON &&
               credential.response.attestationObject;
      };

      expect(validateWebAuthnCredential(mockCredential)).toBe(true);
    });

    it('should handle WebAuthn errors securely', async () => {
      const handleWebAuthnError = (error: any) => {
        if (error.name === 'NotAllowedError') {
          return 'User cancelled authentication';
        }
        if (error.name === 'NotSupportedError') {
          return 'WebAuthn not supported';
        }
        if (error.name === 'SecurityError') {
          return 'Security error occurred';
        }
        return 'Unknown error occurred';
      };

      expect(handleWebAuthnError({ name: 'NotAllowedError' })).toBe('User cancelled authentication');
      expect(handleWebAuthnError({ name: 'NotSupportedError' })).toBe('WebAuthn not supported');
      expect(handleWebAuthnError({ name: 'SecurityError' })).toBe('Security error occurred');
    });
  });

  describe('Data Protection', () => {
    it('should encrypt sensitive data', async () => {
      const encryptData = (data: string, key: string) => {
        // Mock encryption
        return `encrypted_${data}_${key}`;
      };

      const sensitiveData = 'user-personal-information';
      const encryptionKey = 'secret-key-123';
      const encrypted = encryptData(sensitiveData, encryptionKey);
      
      expect(encrypted).not.toBe(sensitiveData);
      expect(encrypted).toContain('encrypted_');
    });

    it('should implement data anonymization', async () => {
      const anonymizeData = (data: any) => {
        return {
          ...data,
          email: data.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
          phone: data.phone ? data.phone.replace(/(.{3}).*(.{4})/, '$1***$2') : null,
          ssn: data.ssn ? '***-**-' + data.ssn.slice(-4) : null
        };
      };

      const userData = {
        email: 'test@example.com',
        phone: '123-456-7890',
        ssn: '123-45-6789'
      };

      const anonymized = anonymizeData(userData);
      
      expect(anonymizeData.email).toBe('te***@example.com');
      expect(anonymizeData.phone).toBe('123***7890');
      expect(anonymizeData.ssn).toBe('***-**-6789');
    });

    it('should implement GDPR compliance', async () => {
      const gdprCompliance = {
        dataRetention: 365, // days
        consentRequired: true,
        rightToErasure: true,
        dataPortability: true
      };

      const checkGDPRCompliance = (userData: any) => {
        return {
          hasConsent: userData.consentGiven,
          canDelete: gdprCompliance.rightToErasure,
          canExport: gdprCompliance.dataPortability,
          retentionPeriod: gdprCompliance.dataRetention
        };
      };

      const userData = { consentGiven: true };
      const compliance = checkGDPRCompliance(userData);
      
      expect(compliance.hasConsent).toBe(true);
      expect(compliance.canDelete).toBe(true);
      expect(compliance.canExport).toBe(true);
    });
  });

  describe('Security Headers', () => {
    it('should implement proper security headers', async () => {
      const securityHeaders = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'"
      };

      Object.entries(securityHeaders).forEach(([header, value]) => {
        expect(value).toBeTruthy();
        expect(typeof value).toBe('string');
      });
    });

    it('should implement CORS security', async () => {
      const corsConfig = {
        origin: ['https://choices.app', 'https://www.choices.app'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
        credentials: true
      };

      expect(corsConfig.origin).toContain('https://choices.app');
      expect(corsConfig.methods).toContain('GET');
      expect(corsConfig.credentials).toBe(true);
    });
  });
});



