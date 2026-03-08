/**
 * Feature Flags Public API Contract Tests
 *
 * Verifies GET /api/feature-flags/public returns 200 and correct shape
 * without authentication. Critical for client-side flag checks.
 *
 * @jest-environment node
 */

import { createNextRequest } from '@/tests/contracts/helpers/request';

const mockGetAllFlags = jest.fn();

jest.mock('@/lib/core/feature-flags', () => ({
  featureFlagManager: {
    getAllFlags: mockGetAllFlags,
  },
}));

describe('Feature Flags Public API contract', () => {
  beforeEach(() => {
    mockGetAllFlags.mockReset();
    mockGetAllFlags.mockReturnValue(
      new Map([
        ['CONTACT_INFORMATION_SYSTEM', { id: 'CONTACT_INFORMATION_SYSTEM', name: 'contact', enabled: true, description: '' }],
        ['SOME_OTHER_FLAG', { id: 'SOME_OTHER_FLAG', name: 'other', enabled: false, description: '' }],
      ])
    );
  });

  const loadRoute = () => {
    let routeModule: { GET: (req: Request) => Promise<Response> };
    jest.isolateModules(() => {
      routeModule = require('@/app/api/feature-flags/public/route');
    });
    return routeModule;
  };

  it('returns 200 with flags object', async () => {
    const { GET } = loadRoute();
    const response = await GET(createNextRequest('http://localhost/api/feature-flags/public'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.flags).toBeDefined();
    expect(typeof body.data.flags).toBe('object');
  });

  it('returns each flag as boolean', async () => {
    const { GET } = loadRoute();
    const response = await GET(createNextRequest('http://localhost/api/feature-flags/public'));
    const body = await response.json();

    const flags = body.data.flags;
    expect(flags.CONTACT_INFORMATION_SYSTEM).toBe(true);
    expect(flags.SOME_OTHER_FLAG).toBe(false);
    Object.values(flags).forEach((v) => {
      expect(typeof v).toBe('boolean');
    });
  });

  it('returns empty flags object when no flags', async () => {
    mockGetAllFlags.mockReturnValue(new Map());
    const { GET } = loadRoute();
    const response = await GET(createNextRequest('http://localhost/api/feature-flags/public'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.flags).toEqual({});
  });
});
