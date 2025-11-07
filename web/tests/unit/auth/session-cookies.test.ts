import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const MODULE_PATH = '@/lib/core/auth/session-cookies';

describe('session-cookies environment guards', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    jest.resetModules();
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  it('throws when JWT_SECRET is not defined', async () => {
    delete process.env.JWT_SECRET;

    const { generateSessionToken } = await import(MODULE_PATH);

    expect(() => generateSessionToken({ sub: 'user-123' })).toThrow(/JWT_SECRET/);
  });

  it('returns null when verifying without JWT secret', async () => {
    process.env.JWT_SECRET = 'test-secret-value';

    const { generateSessionToken } = await import(MODULE_PATH);
    const token = generateSessionToken({ sub: 'user-321' });

    delete process.env.JWT_SECRET;

    const { verifySessionToken } = await import(MODULE_PATH);

    expect(verifySessionToken(token)).toBeNull();
  });

  it('generates and validates session tokens when secret is provided', async () => {
    process.env.JWT_SECRET = 'test-secret-value';

    const { generateSessionToken, verifySessionToken } = await import(MODULE_PATH);

    const token = generateSessionToken({ sub: 'user-42', role: 'admin' });
    const payload = verifySessionToken(token);

    expect(typeof token).toBe('string');
    expect(payload).toMatchObject({
      sub: 'user-42',
      role: 'admin',
    });
    expect(payload?.exp).toBeGreaterThan(payload?.iat ?? 0);
  });
});

