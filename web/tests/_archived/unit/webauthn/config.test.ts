import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { NextRequest } from 'next/server';

const ORIGINAL_ENV = { ...process.env };

const restoreEnv = () => {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) {
      delete process.env[key];
    }
  }
  Object.assign(process.env, ORIGINAL_ENV);
};

const loadConfigModule = async () => {
  jest.resetModules();
  return await import('@/features/auth/lib/webauthn/config');
};

afterEach(() => {
  restoreEnv();
  jest.resetModules();
});

describe('WebAuthn config', () => {
  it('enables WebAuthn for production host', async () => {
    process.env.RP_ID = 'choices.example.com';
    process.env.ALLOWED_ORIGINS = 'https://choices.example.com';

    const { getRPIDAndOrigins, ALLOWED_ORIGINS } = await loadConfigModule();

    const request = {
      headers: new Headers({ host: 'choices.example.com' }),
    } as unknown as NextRequest;

    const result = getRPIDAndOrigins(request);
    expect(result.enabled).toBe(true);
    expect(result.rpID).toBe('choices.example.com');
    expect(result.allowedOrigins).toEqual(ALLOWED_ORIGINS);
  });

  it('enables WebAuthn for localhost during development', async () => {
    process.env.RP_ID = 'choices.example.com';

    const { getRPIDAndOrigins } = await loadConfigModule();

    const request = {
      headers: new Headers({ host: 'localhost:3000' }),
    } as unknown as NextRequest;

    const result = getRPIDAndOrigins(request);
    expect(result.enabled).toBe(true);
  });

  it('disables WebAuthn on Vercel preview deployments', async () => {
    process.env.RP_ID = 'choices.example.com';

    const { getRPIDAndOrigins } = await loadConfigModule();

    const request = {
      headers: new Headers({ host: 'preview-123.vercel.app' }),
    } as unknown as NextRequest;

    const result = getRPIDAndOrigins(request);
    expect(result.enabled).toBe(false);
  });

  it('disables WebAuthn for unknown hosts', async () => {
    process.env.RP_ID = 'choices.example.com';

    const { getRPIDAndOrigins } = await loadConfigModule();

    const request = {
      headers: new Headers({ host: 'malicious.example.net' }),
    } as unknown as NextRequest;

    const result = getRPIDAndOrigins(request);
    expect(result.enabled).toBe(false);
  });

  it('computes challenge TTL from environment variables', async () => {
    process.env.WEBAUTHN_CHALLENGE_TTL_SECONDS = '600';

    const { CHALLENGE_TTL_MS } = await loadConfigModule();

    expect(CHALLENGE_TTL_MS).toBe(600_000);
  });

  it('detects Vercel preview hostnames', async () => {
    const { isVercelPreview } = await loadConfigModule();

    expect(isVercelPreview('branch-123.vercel.app')).toBe(true);
    expect(isVercelPreview('feature.vercel.live')).toBe(true);
    expect(isVercelPreview('my-vercel-preview-domain')).toBe(true);
    expect(isVercelPreview('choices.example.com')).toBe(false);
    expect(isVercelPreview('localhost:3000')).toBe(false);
  });
});


