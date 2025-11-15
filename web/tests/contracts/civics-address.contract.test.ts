/**
 * @jest-environment node
 */

import { createNextRequest } from '@/tests/contracts/helpers/request';

const mockSetJurisdictionCookie = jest.fn();
const mockAssertPepperConfig = jest.fn();

jest.mock('@/lib/civics/privacy-utils', () => ({
  setJurisdictionCookie: jest.fn(async (...args: unknown[]) => mockSetJurisdictionCookie(...args)),
  generateAddressHMAC: jest.fn(() => 'hash'),
}));

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
});

