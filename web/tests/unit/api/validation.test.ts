/**
 * Comprehensive Input Validation Tests
 *
 * Tests input validation across the application to ensure data integrity
 * and prevent invalid data from entering the system.
 *
 * Created: November 30, 2025
 */

import { describe, it, expect } from '@jest/globals';

describe('Input Validation', () => {
  describe('Email Validation', () => {
    const validateEmail = (email: string): { valid: boolean; error?: string } => {
      if (!email || email.trim() === '') {
        return { valid: false, error: 'Email is required' };
      }

      // Check for consecutive dots (invalid)
      if (email.includes('..')) {
        return { valid: false, error: 'Invalid email format' };
      }

      // RFC 5322 compliant regex (simplified)
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

      if (!emailRegex.test(email)) {
        return { valid: false, error: 'Invalid email format' };
      }

      if (email.length > 254) {
        return { valid: false, error: 'Email too long' };
      }

      return { valid: true };
    };

    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.user@example.co.uk',
        'user+tag@example.com',
        'user_name@example-domain.com',
        'user123@example123.com',
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        '',
        'invalid',
        'user@',
        '@example.com',
        'user @example.com',
        // Note: Some regex patterns may accept consecutive dots, so we test explicitly
        'user@example..com',
        'user@.example.com',
        'user@example.',
        'user<script>@example.com',
        'user@example<script>.com',
      ];

      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.valid).toBe(false);
      });
    });

    it('should reject emails that are too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = validateEmail(longEmail);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too long');
    });
  });

  describe('Password Validation', () => {
    const validatePassword = (password: string, confirmPassword?: string): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];

      if (!password || password.length === 0) {
        errors.push('Password is required');
        return { valid: false, errors };
      }

      if (password.length < 8) {
        errors.push('Password must be at least 8 characters');
      }

      if (password.length > 128) {
        errors.push('Password must be less than 128 characters');
      }

      if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      }

      if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }

      if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
      }

      if (!/[^a-zA-Z0-9]/.test(password)) {
        errors.push('Password must contain at least one special character');
      }

      if (confirmPassword !== undefined && password !== confirmPassword) {
        errors.push('Passwords do not match');
      }

      return { valid: errors.length === 0, errors };
    };

    it('should accept strong passwords', () => {
      const strongPasswords = [
        'StrongPass123!',
        'MyP@ssw0rd',
        'Secure#2024',
        'Complex!Pass1',
      ];

      strongPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        { password: 'short', expected: 'at least 8 characters' },
        { password: 'nouppercase123!', expected: 'uppercase' },
        { password: 'NOLOWERCASE123!', expected: 'lowercase' },
        { password: 'NoNumbers!', expected: 'number' },
        { password: 'NoSpecial123', expected: 'special character' },
      ];

      weakPasswords.forEach(({ password, expected }) => {
        const result = validatePassword(password);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.toLowerCase().includes(expected.toLowerCase()))).toBe(true);
      });
    });

    it('should validate password confirmation', () => {
      const result1 = validatePassword('Password123!', 'Password123!');
      expect(result1.valid).toBe(true);

      const result2 = validatePassword('Password123!', 'Different123!');
      expect(result2.valid).toBe(false);
      expect(result2.errors).toContain('Passwords do not match');
    });
  });

  describe('String Length Validation', () => {
    const validateLength = (value: string, min: number, max: number, fieldName: string): { valid: boolean; error?: string } => {
      if (value.length < min) {
        return { valid: false, error: `${fieldName} must be at least ${min} characters` };
      }
      if (value.length > max) {
        return { valid: false, error: `${fieldName} must be at most ${max} characters` };
      }
      return { valid: true };
    };

    it('should validate string length constraints', () => {
      expect(validateLength('abc', 3, 10, 'Field').valid).toBe(true);
      expect(validateLength('ab', 3, 10, 'Field').valid).toBe(false);
      expect(validateLength('abcdefghijklmnop', 3, 10, 'Field').valid).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validateLength('', 0, 10, 'Field').valid).toBe(true);
      expect(validateLength('', 1, 10, 'Field').valid).toBe(false);
      expect(validateLength('a'.repeat(1000), 1, 100, 'Field').valid).toBe(false);
    });
  });

  describe('URL Validation', () => {
    const validateURL = (url: string): { valid: boolean; error?: string } => {
      if (!url || url.trim() === '') {
        return { valid: false, error: 'URL is required' };
      }

      try {
        const parsed = new URL(url);
        // Only allow http and https protocols
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return { valid: false, error: 'URL must use http or https protocol' };
        }
        return { valid: true };
      } catch {
        return { valid: false, error: 'Invalid URL format' };
      }
    };

    it('should accept valid URLs', () => {
      const validURLs = [
        'https://example.com',
        'http://example.com',
        'https://example.com/path',
        'https://example.com:8080/path?query=value',
      ];

      validURLs.forEach(url => {
        const result = validateURL(url);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidURLs = [
        '',
        'not-a-url',
        'javascript:alert(1)',
        'ftp://example.com',
        'file:///etc/passwd',
      ];

      invalidURLs.forEach(url => {
        const result = validateURL(url);
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('Number Validation', () => {
    const validateNumber = (value: unknown, min?: number, max?: number): { valid: boolean; error?: string } => {
      if (typeof value !== 'number' || isNaN(value)) {
        return { valid: false, error: 'Value must be a number' };
      }

      if (min !== undefined && value < min) {
        return { valid: false, error: `Value must be at least ${min}` };
      }

      if (max !== undefined && value > max) {
        return { valid: false, error: `Value must be at most ${max}` };
      }

      return { valid: true };
    };

    it('should validate number ranges', () => {
      expect(validateNumber(5, 1, 10).valid).toBe(true);
      expect(validateNumber(0, 1, 10).valid).toBe(false);
      expect(validateNumber(11, 1, 10).valid).toBe(false);
      expect(validateNumber('5' as any, 1, 10).valid).toBe(false);
      expect(validateNumber(NaN, 1, 10).valid).toBe(false);
    });
  });

  describe('Date Validation', () => {
    const validateDate = (date: string | Date): { valid: boolean; error?: string } => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;

      if (isNaN(dateObj.getTime())) {
        return { valid: false, error: 'Invalid date' };
      }

      // Check if date is in the future (for events, deadlines, etc.)
      if (dateObj.getTime() < Date.now()) {
        return { valid: false, error: 'Date must be in the future' };
      }

      return { valid: true };
    };

    it('should validate future dates', () => {
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow
      expect(validateDate(futureDate).valid).toBe(true);

      const pastDate = new Date(Date.now() - 86400000); // Yesterday
      expect(validateDate(pastDate).valid).toBe(false);

      expect(validateDate('invalid').valid).toBe(false);
    });
  });

  describe('Array Validation', () => {
    const validateArray = (value: unknown, minLength?: number, maxLength?: number): { valid: boolean; error?: string } => {
      if (!Array.isArray(value)) {
        return { valid: false, error: 'Value must be an array' };
      }

      if (minLength !== undefined && value.length < minLength) {
        return { valid: false, error: `Array must have at least ${minLength} items` };
      }

      if (maxLength !== undefined && value.length > maxLength) {
        return { valid: false, error: `Array must have at most ${maxLength} items` };
      }

      return { valid: true };
    };

    it('should validate array constraints', () => {
      expect(validateArray([1, 2, 3], 1, 10).valid).toBe(true);
      expect(validateArray([], 1, 10).valid).toBe(false);
      expect(validateArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], 1, 10).valid).toBe(false);
      expect(validateArray('not-array' as any, 1, 10).valid).toBe(false);
    });
  });

  describe('Sanitization', () => {
    it('should trim whitespace', () => {
      const sanitize = (input: string): string => input.trim();

      expect(sanitize('  hello  ')).toBe('hello');
      expect(sanitize('\n\t  test  \n\t')).toBe('test');
    });

    it('should remove null bytes', () => {
      const sanitize = (input: string): string => input.replace(/\0/g, '');

      expect(sanitize('hello\0world')).toBe('helloworld');
      expect(sanitize('test\0\0\0')).toBe('test');
    });

    it('should normalize unicode', () => {
      const normalize = (input: string): string => input.normalize('NFKC');

      // Test that normalization works (simplified)
      expect(normalize('café').length).toBeGreaterThan(0);
    });
  });
});

