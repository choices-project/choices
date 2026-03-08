/**
 * Unit tests for input sanitization and validation (security).
 * Covers validateRepresentativeId, sanitizeText, sanitizeSubject.
 */

import { describe, it, expect } from '@jest/globals';
import {
  validateRepresentativeId,
  sanitizeText,
  sanitizeSubject,
} from '@/lib/security/input-sanitization';

describe('validateRepresentativeId', () => {
  it('accepts positive integer number', () => {
    expect(validateRepresentativeId(1).isValid).toBe(true);
    expect(validateRepresentativeId(1).parsedId).toBe(1);
    expect(validateRepresentativeId(999).isValid).toBe(true);
    expect(validateRepresentativeId(999).parsedId).toBe(999);
  });

  it('accepts numeric string', () => {
    const r = validateRepresentativeId('42');
    expect(r.isValid).toBe(true);
    expect(r.parsedId).toBe(42);
  });

  it('rejects zero and negative', () => {
    expect(validateRepresentativeId(0).isValid).toBe(false);
    expect(validateRepresentativeId(-1).isValid).toBe(false);
    expect(validateRepresentativeId('-5').isValid).toBe(false);
  });

  it('rejects non-integer number', () => {
    const r = validateRepresentativeId(1.5);
    expect(r.isValid).toBe(false);
    expect(r.error).toMatch(/positive integer/i);
  });

  it('rejects string that is not a valid integer', () => {
    expect(validateRepresentativeId('abc').isValid).toBe(false);
    expect(validateRepresentativeId('12.3').isValid).toBe(false);
    expect(validateRepresentativeId('').isValid).toBe(false);
  });

  it('rejects string with leading/trailing non-numeric', () => {
    const r = validateRepresentativeId('  123  ');
    expect(r.isValid).toBe(true);
    expect(r.parsedId).toBe(123);
    expect(validateRepresentativeId('123abc').isValid).toBe(false);
  });

  it('rejects null, undefined, and non-string/non-number', () => {
    expect(validateRepresentativeId(null).isValid).toBe(false);
    expect(validateRepresentativeId(undefined).isValid).toBe(false);
    expect(validateRepresentativeId(true as any).isValid).toBe(false);
    expect(validateRepresentativeId({} as any).isValid).toBe(false);
  });
});

describe('sanitizeText', () => {
  it('returns empty string for non-string input', () => {
    expect(sanitizeText(null as any)).toBe('');
    expect(sanitizeText(undefined as any)).toBe('');
    expect(sanitizeText(123 as any)).toBe('');
  });

  it('removes script tags', () => {
    const input = 'Hello <script>alert("xss")</script> world';
    expect(sanitizeText(input)).not.toMatch(/<script/i);
    expect(sanitizeText(input)).toMatch(/Hello/);
    expect(sanitizeText(input)).toMatch(/world/);
  });

  it('removes javascript: protocol', () => {
    const input = 'Link: javascript:void(0)';
    expect(sanitizeText(input)).not.toMatch(/javascript:/i);
  });

  it('removes event handlers', () => {
    const input = 'Click <span onclick="evil()">here</span>';
    expect(sanitizeText(input)).not.toMatch(/on\w+\s*=/i);
  });

  it('trims whitespace', () => {
    expect(sanitizeText('  safe  ')).toBe('safe');
  });

  it('leaves safe text unchanged', () => {
    const safe = 'Hello world 123';
    expect(sanitizeText(safe)).toBe(safe);
  });
});

describe('sanitizeSubject', () => {
  it('returns invalid for empty or non-string', () => {
    expect(sanitizeSubject('').isValid).toBe(false);
    expect(sanitizeSubject(null as any).isValid).toBe(false);
  });

  it('accepts valid subject and returns sanitized', () => {
    const r = sanitizeSubject('Valid subject');
    expect(r.isValid).toBe(true);
    expect(r.sanitized).toBeDefined();
    expect(r.sanitized!.length).toBeGreaterThan(0);
  });

  it('rejects subject over max length', () => {
    const long = 'a'.repeat(201);
    const r = sanitizeSubject(long);
    expect(r.isValid).toBe(false);
    expect(r.error).toMatch(/long/i);
  });
});
