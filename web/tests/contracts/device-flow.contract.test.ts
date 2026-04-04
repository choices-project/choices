/**
 * @jest-environment node
 *
 * Contract tests for Device Flow Auth API (RFC 8628).
 * POST /api/auth/device-flow - generates device code and user code.
 */

import { createNextRequest } from '@/tests/contracts/helpers/request';

const mockSupabase = {
  from: jest.fn(),
};

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(async () => mockSupabase),
}));

jest.mock('@/lib/rate-limiting/api-rate-limiter', () => ({
  apiRateLimiter: {
    checkLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 2 }),
  },
}));

const loadRoute = () => {
  let routeModule: { POST: (req: Request) => Promise<Response> };
  jest.isolateModules(() => {
    routeModule = require('@/app/api/auth/device-flow/route');
  });
  return routeModule;
};

describe('Device Flow API contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'device_flow') {
        return {
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });
  });

  it('returns 200 with deviceCode, userCode, verificationUri for valid provider', async () => {
    const { POST } = loadRoute();
    const request = createNextRequest('http://localhost/api/auth/device-flow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'google' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      success: true,
      deviceCode: expect.any(String),
      userCode: expect.stringMatching(/^[A-Z]{4}-[A-Z]{4}$/),
      verificationUri: expect.stringContaining('/auth/device-flow/verify'),
      expiresIn: 1800,
      interval: 5,
    });
  });

  it('returns 400 for invalid provider', async () => {
    const { POST } = loadRoute();
    const request = createNextRequest('http://localhost/api/auth/device-flow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'invalid' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 for missing provider', async () => {
    const { POST } = loadRoute();
    const request = createNextRequest('http://localhost/api/auth/device-flow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });
});
