/**
 * Unit tests for contact validation (validateAndNormalizeContact, validateContactType).
 * Ensures API rejects extremely long email/phone/address and normalizes valid values.
 */

import { describe, it, expect } from '@jest/globals';
import {
  validateAndNormalizeContact,
  validateContactType,
  type ContactType,
} from '@/lib/contact/contact-validation';

describe('validateAndNormalizeContact', () => {
  describe('email', () => {
    it('accepts valid email', () => {
      const r = validateAndNormalizeContact('email', 'user@example.com');
      expect(r.isValid).toBe(true);
      expect(r.normalized).toBe('user@example.com');
    });

    it('rejects email longer than 254 characters (RFC 5321)', () => {
      const longLocal = 'a'.repeat(300) + '@example.com';
      const r = validateAndNormalizeContact('email', longLocal);
      expect(r.isValid).toBe(false);
      expect(r.error).toMatch(/invalid email format/i);
    });

    it('rejects exactly 255 characters', () => {
      const email = 'a'.repeat(250) + '@x.co';
      expect(email.length).toBe(255);
      const r = validateAndNormalizeContact('email', email);
      expect(r.isValid).toBe(false);
    });

    it('accepts email at 254 characters', () => {
      const email = 'a'.repeat(249) + '@x.co';
      expect(email.length).toBe(254);
      const r = validateAndNormalizeContact('email', email);
      expect(r.isValid).toBe(true);
      expect(r.normalized).toBe(email.toLowerCase());
    });

    it('rejects empty and invalid format', () => {
      expect(validateAndNormalizeContact('email', '').isValid).toBe(false);
      expect(validateAndNormalizeContact('email', '   ').isValid).toBe(false);
      expect(validateAndNormalizeContact('email', 'no-at-sign').isValid).toBe(false);
      expect(validateAndNormalizeContact('email', '@nodomain.com').isValid).toBe(false);
    });
  });

  describe('phone', () => {
    it('accepts valid 10-digit phone', () => {
      const r = validateAndNormalizeContact('phone', '5551234567');
      expect(r.isValid).toBe(true);
    });

    it('accepts formatted phone (123) 456-7890', () => {
      const r = validateAndNormalizeContact('phone', '(123) 456-7890');
      expect(r.isValid).toBe(true);
      expect(r.normalized).toBeDefined();
    });

    it('accepts phone with +1 country code', () => {
      const r = validateAndNormalizeContact('phone', '+1 123 456 7890');
      expect(r.isValid).toBe(true);
    });

    it('accepts phone with dashes and dots', () => {
      expect(validateAndNormalizeContact('phone', '123-456-7890').isValid).toBe(true);
      expect(validateAndNormalizeContact('phone', '123.456.7890').isValid).toBe(true);
    });

    it('rejects fewer than 10 digits', () => {
      expect(validateAndNormalizeContact('phone', '123456789').isValid).toBe(false);
    });

    it('rejects more than 15 digits', () => {
      const longPhone = '1'.repeat(100);
      const r = validateAndNormalizeContact('phone', longPhone);
      expect(r.isValid).toBe(false);
      expect(r.error).toMatch(/invalid phone/i);
    });

    it('rejects 16 digits', () => {
      const r = validateAndNormalizeContact('phone', '1234567890123456');
      expect(r.isValid).toBe(false);
    });

    it('accepts 15 digits', () => {
      const r = validateAndNormalizeContact('phone', '123456789012345');
      expect(r.isValid).toBe(true);
    });
  });

  describe('address', () => {
    it('accepts address between 5 and 500 chars', () => {
      const r = validateAndNormalizeContact('address', '123 Main St, City');
      expect(r.isValid).toBe(true);
      expect(r.normalized).toBe('123 Main St, City');
    });

    it('rejects address longer than 500 characters', () => {
      const longAddress = 'A'.repeat(1000);
      const r = validateAndNormalizeContact('address', longAddress);
      expect(r.isValid).toBe(false);
      expect(r.error).toMatch(/invalid address format/i);
    });

    it('rejects address shorter than 5 characters', () => {
      expect(validateAndNormalizeContact('address', '123').isValid).toBe(false);
      expect(validateAndNormalizeContact('address', '   ').isValid).toBe(false);
    });
  });

  describe('fax', () => {
    it('accepts valid fax like phone', () => {
      const r = validateAndNormalizeContact('fax', '5551234567');
      expect(r.isValid).toBe(true);
      expect(validateAndNormalizeContact('fax', '(800) 555-1212').isValid).toBe(true);
    });

    it('rejects invalid fax', () => {
      expect(validateAndNormalizeContact('fax', '123').isValid).toBe(false);
    });
  });

  describe('unknown type', () => {
    it('accepts any non-empty value and returns normalized', () => {
      const r = validateAndNormalizeContact('other', 'some value');
      expect(r.isValid).toBe(true);
      expect(r.normalized).toBe('some value');
    });
  });

  describe('required value', () => {
    it('rejects missing or empty value', () => {
      expect(validateAndNormalizeContact('email', undefined as any).isValid).toBe(false);
      expect(validateAndNormalizeContact('email', null as any).isValid).toBe(false);
      expect(validateAndNormalizeContact('email', '').error).toMatch(/required|cannot be empty/i);
    });
  });
});

describe('validateContactType', () => {
  it('accepts email, phone, fax, address', () => {
    expect(validateContactType('email')).toBe(true);
    expect(validateContactType('phone')).toBe(true);
    expect(validateContactType('fax')).toBe(true);
    expect(validateContactType('address')).toBe(true);
  });

  it('rejects invalid types', () => {
    expect(validateContactType('')).toBe(false);
    expect(validateContactType('url')).toBe(false);
    expect(validateContactType('other')).toBe(false);
  });
});
