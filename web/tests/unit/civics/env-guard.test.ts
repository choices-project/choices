import { describe, it, expect } from '@jest/globals';
import { assertPepperConfig } from '@/lib/civics/env-guard';

describe('assertPepperConfig', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('throws in non-dev when PRIVACY_PEPPER_CURRENT is missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.PRIVACY_PEPPER_CURRENT;
    expect(() => assertPepperConfig()).toThrow();
  });

  it('accepts properly prefixed ≥32-byte pepper in prod', () => {
    process.env.NODE_ENV = 'production';
    // 32 bytes of hex (64 hex chars) with prefix
    process.env.PRIVACY_PEPPER_CURRENT = 'hex:' + 'a'.repeat(64);
    expect(() => assertPepperConfig()).not.toThrow();
  });
});


