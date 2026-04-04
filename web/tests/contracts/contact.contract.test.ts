/**
 * @jest-environment node
 *
 * Contract tests for contact API.
 * POST /api/contact/messages - returns 403 when feature flag disabled.
 * GET /api/contact/threads - returns 403 when feature flag disabled.
 */

import { createNextRequest } from '@/tests/contracts/helpers/request';

jest.mock('@/lib/core/feature-flags', () => ({
  isFeatureEnabled: jest.fn(),
}));

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(async () => ({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}));

jest.mock('@/lib/rate-limiting/api-rate-limiter', () => ({
  apiRateLimiter: {
    checkLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 99 }),
  },
}));

const loadMessagesRoute = () => {
  let routeModule: { POST: (req: Request) => Promise<Response> };
  jest.isolateModules(() => {
    routeModule = require('@/app/api/contact/messages/route');
  });
  return routeModule;
};

const loadThreadsRoute = () => {
  let routeModule: { GET: (req: Request) => Promise<Response> };
  jest.isolateModules(() => {
    routeModule = require('@/app/api/contact/threads/route');
  });
  return routeModule;
};

describe('Contact API contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/contact/messages', () => {
    it('returns 403 when CONTACT_INFORMATION_SYSTEM is disabled', async () => {
      const { isFeatureEnabled } = require('@/lib/core/feature-flags');
      (isFeatureEnabled as jest.Mock).mockReturnValue(false);

      const { POST } = loadMessagesRoute();
      const request = createNextRequest('http://localhost/api/contact/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          representativeId: 'rep-1',
          subject: 'Test',
          content: 'Test content',
        }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error ?? body.message).toMatch(/disabled|disabled/i);
    });
  });

  describe('GET /api/contact/threads', () => {
    it('returns 403 when CONTACT_INFORMATION_SYSTEM is disabled', async () => {
      const { isFeatureEnabled } = require('@/lib/core/feature-flags');
      (isFeatureEnabled as jest.Mock).mockReturnValue(false);

      const { GET } = loadThreadsRoute();
      const request = createNextRequest('http://localhost/api/contact/threads');

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error ?? body.message).toMatch(/disabled|disabled/i);
    });
  });
});
