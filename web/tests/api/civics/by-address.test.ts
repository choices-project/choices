/**
 * Civics By-Address API Tests
 *
 * Tests for /api/v1/civics/address-lookup endpoint
 *
 * Created: January 29, 2025
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, jest } from '@jest/globals';

import { POST, GET } from '@/app/api/v1/civics/address-lookup/route';

jest.mock('@/lib/civics/env-guard', () => ({
  assertPepperConfig: jest.fn(),
}));

jest.mock('@/lib/civics/privacy-utils', () => ({
  generateAddressHMAC: jest.fn((address: string) => `mock-hmac-${address}`),
  setJurisdictionCookie: jest.fn(() => Promise.resolve()),
  validateAddressInput: jest.fn(() => ({ valid: true })),
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const privacyUtilsMock = jest.requireMock('@/lib/civics/privacy-utils') as {
  generateAddressHMAC: jest.Mock;
  setJurisdictionCookie: jest.Mock;
  validateAddressInput: jest.Mock;
};
const envGuardMock = jest.requireMock('@/lib/civics/env-guard') as {
  assertPepperConfig: jest.Mock;
};

const { generateAddressHMAC, setJurisdictionCookie, validateAddressInput } = privacyUtilsMock;
const { assertPepperConfig } = envGuardMock;

const originalFetch = global.fetch;
let fetchMock: jest.MockedFunction<typeof fetch>;

beforeAll(() => {
  process.env.GOOGLE_CIVIC_API_KEY = 'test-api-key';
});

beforeEach(() => {
  jest.clearAllMocks();
  fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
  global.fetch = fetchMock;
});

afterEach(() => {
  global.fetch = originalFetch;
});

const createPostRequest = (body: unknown) =>
  new Request('http://localhost:3000/api/v1/civics/address-lookup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

const mockFetchSuccess = (overrides: Record<string, unknown> = {}) => {
  const responseBody = {
    normalizedInput: { state: 'CA' },
    divisions: {
      'ocd-division/country:us/state:ca/cd:12': { name: 'California 12' },
      'ocd-division/country:us/state:ca': { name: 'California' },
    },
    ...overrides,
  };

  fetchMock.mockResolvedValue(
    new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  );
};

describe('POST /api/v1/civics/address-lookup', () => {
  it('returns 200 with jurisdiction data when external API succeeds', async () => {
    mockFetchSuccess();

    const response = await POST(createPostRequest({ address: '123 Market St, San Francisco, CA' }));
    const payload = await response.json();

    const status = (response as any)?.status;
    if (typeof status === 'number') {
      expect(status).toBe(200);
    }
    expect(payload.success).toBe(true);
    expect(payload.data?.jurisdiction).toMatchObject({ state: 'CA' });
    expect(setJurisdictionCookie).toHaveBeenCalledWith(expect.objectContaining({ state: 'CA' }));
    expect(generateAddressHMAC).toHaveBeenCalledWith('123 Market St, San Francisco, CA');
    expect(assertPepperConfig).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('representatives?address='), expect.any(Object));
  });

  it('returns 400 when address is missing', async () => {
    validateAddressInput.mockReturnValueOnce({ valid: false, error: 'Address is required' });
    const response = await POST(createPostRequest({}));
    const payload = await response.json();

    const status = (response as any)?.status;
    if (typeof status === 'number') {
      expect(status).toBe(400);
    }
    // validationError envelope with details
    expect(payload.success).toBe(false);
    if (payload.details) {
      expect(payload.details.address).toBe('Address is required');
    }
    expect(global.fetch).not.toHaveBeenCalled();
    expect(setJurisdictionCookie).not.toHaveBeenCalled();
  });

  it('returns fallback jurisdiction when external API fails', async () => {
    fetchMock.mockRejectedValue(new Error('network failure'));

    const response = await POST(createPostRequest({ address: '456 Elm St, Austin, Texas' }));
    const payload = await response.json();

    const status = (response as any)?.status;
    if (typeof status === 'number') {
      expect(status).toBe(200);
    }
    expect(payload.data?.jurisdiction).toMatchObject({ state: 'TX', fallback: true });
    expect(setJurisdictionCookie).toHaveBeenCalledWith(expect.objectContaining({ state: 'TX' }));
  });

  it('returns 400 when validation fails', async () => {
    validateAddressInput.mockReturnValueOnce({ valid: false, error: 'Address too short' });

    const response = await POST(createPostRequest({ address: '123' }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.details?.address).toBe('Address too short');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns 503 when feature disabled', async () => {
    validateAddressInput.mockReturnValueOnce({ valid: false, error: 'Feature disabled' });

    const response = await POST(createPostRequest({ address: '123 Market St, San Francisco, CA' }));
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.error).toMatch(/disabled/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('GET /api/v1/civics/address-lookup', () => {
  it('always returns 405 with guidance to use POST', async () => {
    const response = await GET();
    const payload = await response.json();

    const status = (response as any)?.status;
    if (typeof status === 'number') {
      expect(status).toBe(405);
    }
    expect(payload.error).toBe('Method not allowed. Allowed methods: POST');
  });
});

