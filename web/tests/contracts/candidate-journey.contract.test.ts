/**
 * @jest-environment node
 */

import { createPostgrestBuilder } from '@/tests/contracts/helpers/postgrest';
import { createNextRequest } from '@/tests/contracts/helpers/request';

const mockSupabaseClient: Record<string, any> = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

const mockEmailService = {
  sendCandidateJourneyEmail: jest.fn(),
};

const mockRateLimitResult = {
  allowed: true,
  remaining: 5,
  resetTime: new Date(),
  retryAfter: null,
};

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(async () => mockSupabaseClient),
}));

jest.mock('@/lib/services/email/candidate-journey-emails', () => ({
  sendCandidateJourneyEmail: jest.fn((...args) =>
    mockEmailService.sendCandidateJourneyEmail(...args)
  ),
}));

const mockRateLimitMiddleware = jest.fn(async () => mockRateLimitResult);

jest.mock('@/lib/core/security/rate-limit', () => ({
  createRateLimiter: jest.fn(() => ({})),
  rateLimitMiddleware: mockRateLimitMiddleware,
}));

const { rateLimitMiddleware } = require('@/lib/core/security/rate-limit');

const loadRoute = () => {
  let routeModule: any;
  jest.isolateModules(() => {
    routeModule = require('@/app/api/candidate/journey/send-email/route');
  });
  return routeModule;
};

describe('Candidate journey send-email contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    (rateLimitMiddleware as jest.Mock).mockImplementation(async () => mockRateLimitResult);
    mockEmailService.sendCandidateJourneyEmail.mockResolvedValue({
      success: true,
    });
  });

  it('rejects when rate limit denies request', async () => {
    (rateLimitMiddleware as jest.Mock).mockResolvedValueOnce({
      ...mockRateLimitResult,
      allowed: false,
      retryAfter: 30,
    });

    const { POST } = loadRoute();
    const response = await POST(
      createNextRequest('http://localhost/api/candidate/journey/send-email', {
        method: 'POST',
        body: JSON.stringify({ type: 'welcome', platformId: 'platform-1' }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(payload.code).toBe('RATE_LIMIT');
  });

  it('sends candidate emails and updates last active timestamp', async () => {
    const updateBuilder = createPostgrestBuilder({
      data: null,
      error: null,
    });

    const platformBuilder = createPostgrestBuilder({
      data: {
        id: 'platform-1',
        user_id: 'user-1',
        candidate_name: 'Candidate',
        office: 'Mayor',
        level: 'local',
        state: 'CA',
        filing_deadline: '2025-12-01T00:00:00.000Z',
        user_profiles: { email: 'candidate@example.com' },
      },
      error: null,
    });

    platformBuilder.update = jest.fn(() => updateBuilder);

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'candidate_platforms') {
        return platformBuilder;
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const { POST } = loadRoute();
    const response = await POST(
      createNextRequest('http://localhost/api/candidate/journey/send-email', {
        method: 'POST',
        body: JSON.stringify({ type: 'welcome', platformId: 'platform-1' }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.data.emailType).toBe('welcome');
    expect(mockEmailService.sendCandidateJourneyEmail).toHaveBeenCalledWith(
      'welcome',
      expect.objectContaining({
        to: 'candidate@example.com',
        platformId: 'platform-1',
      })
    );
  });

  it('enforces ownership guard for authenticated users', async () => {
    const platformBuilder = createPostgrestBuilder({
      data: {
        id: 'platform-2',
        user_id: 'someone-else',
        user_profiles: { email: 'candidate@example.com' },
      },
      error: null,
    });
    mockSupabaseClient.from.mockReturnValue(platformBuilder);

    const { POST } = loadRoute();
    const response = await POST(
      createNextRequest('http://localhost/api/candidate/journey/send-email', {
        method: 'POST',
        body: JSON.stringify({ type: 'welcome', platformId: 'platform-2' }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.code).toBe('FORBIDDEN');
  });
});


