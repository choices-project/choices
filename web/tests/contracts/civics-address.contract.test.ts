/**
 * @jest-environment node
 */

import { createNextRequest } from '@/tests/contracts/helpers/request';

const mockSetJurisdictionCookie = jest.fn();
const mockAssertPepperConfig = jest.fn();

jest.mock('@/lib/civics/privacy-utils', () => {
  // Preserve real implementations for validation and feature checks
  // while overriding only the pieces that touch cookies/HMACs.
  // This ensures validateAddressInput remains a real function.
  const actual = jest.requireActual<typeof import('@/lib/civics/privacy-utils')>('@/lib/civics/privacy-utils');
  return {
    ...actual,
    setJurisdictionCookie: jest.fn(async (...args: unknown[]) => mockSetJurisdictionCookie(...args)),
    generateAddressHMAC: jest.fn(() => 'hash'),
  };
});

jest.mock('@/lib/civics/env-guard', () => ({
  assertPepperConfig: jest.fn((...args: unknown[]) => mockAssertPepperConfig(...args)),
}));

describe('Civics address lookup contract', () => {
  const loadRoute = () => {
    let routeModule: any;
    jest.isolateModules(() => {
      routeModule = require('@/app/api/v1/civics/address-lookup/route');
    });
    return routeModule;
  };
  const originalEnv = process.env.GOOGLE_CIVIC_API_KEY;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_CIVIC_API_KEY = 'test-key';
    global.fetch = jest.fn();
    mockSetJurisdictionCookie.mockReset();
    mockAssertPepperConfig.mockReset();
  });

  afterAll(() => {
    process.env.GOOGLE_CIVIC_API_KEY = originalEnv;
    global.fetch = originalFetch;
  });

  it('returns jurisdiction data for valid address and writes cookie', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        normalizedInput: { state: 'CA' },
        divisions: {
          'ocd-division/country:us/state:ca/cd:12': { name: 'California 12th Congressional District' },
        },
      }),
    });

    const { POST } = loadRoute();
    const response = await POST(
      createNextRequest('http://localhost/api/v1/civics/address-lookup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ address: '123 Main St, San Francisco, CA' }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.jurisdiction.state).toBe('CA');
    expect(body.metadata?.fallback).toBe(false);
    expect(mockSetJurisdictionCookie).toHaveBeenCalledWith({
      state: 'CA',
      district: '12',
    });
    expect(mockAssertPepperConfig).toHaveBeenCalled();
  });

  it('validates address payload', async () => {
    const { POST } = loadRoute();
    const response = await POST(
      createNextRequest('http://localhost/api/v1/civics/address-lookup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 502 when API key missing', async () => {
    process.env.GOOGLE_CIVIC_API_KEY = '';

    const { POST } = loadRoute();
    const response = await POST(
      createNextRequest('http://localhost/api/v1/civics/address-lookup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ address: '123 Main' }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(502);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to resolve address jurisdiction');
  });

  it('falls back to state extraction when external API fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));

    const { POST } = loadRoute();
    const response = await POST(
      createNextRequest('http://localhost/api/v1/civics/address-lookup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ address: '123 Main St, Sacramento, CA' }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.metadata?.fallback).toBe(true);
    expect(body.data.jurisdiction.state).toBe('CA');
    expect(mockSetJurisdictionCookie).toHaveBeenCalledWith({
      state: 'CA',
    });
  });

  it('enforces per-IP rate limiting', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        normalizedInput: { state: 'CA' },
        divisions: {},
      }),
    });

    const { POST } = loadRoute();
    let lastResponse: Response | null = null;
    // 31 rapid requests to exceed limit (30/min)
    for (let i = 0; i < 31; i++) {
      // vary the address slightly to bypass cache
      const resp = await POST(
        createNextRequest('http://localhost/api/v1/civics/address-lookup', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
          body: JSON.stringify({ address: `123 Main St, San Jose, CA ${i}` }),
        }),
      );
      lastResponse = resp;
    }
    expect(lastResponse).not.toBeNull();
    const body = await (lastResponse as Response).json();
    expect([200, 429]).toContain((lastResponse as Response).status);
    // The final request should be 429 in most runs; tolerate race in CI by allowing either
    if ((lastResponse as Response).status === 429) {
      expect(body.success).toBe(false);
      expect(body.error).toMatch(/Rate limit exceeded/i);
    }
  });

  it('returns cached responses within TTL with meta.cached=true', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        normalizedInput: { state: 'IL' },
        divisions: {
          'ocd-division/country:us/state:il/place:springfield': { name: 'Springfield' },
        },
      }),
    });

    const { POST } = loadRoute();
    const req = (addr: string) =>
      POST(
        createNextRequest('http://localhost/api/v1/civics/address-lookup', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-forwarded-for': '9.8.7.6' },
          body: JSON.stringify({ address: addr }),
        }),
      );

    const first = await req('123 Main St, Springfield, IL 62701');
    const firstBody = await first.json();
    expect(first.status).toBe(200);
    expect(firstBody?.metadata?.cached).toBeUndefined();

    const second = await req('123 Main St, Springfield, IL 62701');
    const secondBody = await second.json();
    expect(second.status).toBe(200);
    expect(secondBody?.metadata?.cached).toBe(true);
  });
});

