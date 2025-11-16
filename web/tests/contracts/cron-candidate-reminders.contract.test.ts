/**
 * @jest-environment node
 */

import { createPostgrestBuilder } from '@/tests/contracts/helpers/postgrest';
import { createNextRequest } from '@/tests/contracts/helpers/request';

const mockSupabaseClient: Record<string, any> = {
  from: jest.fn(),
};

const mockSendCandidateJourneyEmail = jest.fn();

const mockLogger = {
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(async () => mockSupabaseClient),
}));

jest.mock('@/lib/services/email/candidate-journey-emails', () => ({
  sendCandidateJourneyEmail: jest.fn((...args) => mockSendCandidateJourneyEmail(...args)),
}));

jest.mock('@/lib/candidate/journey-tracker', () => ({
  shouldSendReminder: jest.fn((progress: { platformId: string }) => ({
    shouldSend: progress.platformId === 'platform-send',
    reminderType: progress.platformId === 'platform-send' ? 'welcome' : 'check_in',
  })),
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: mockLogger,
  default: mockLogger,
}));

const loadRoute = () => {
  let routeModule: any;
  jest.isolateModules(() => {
    routeModule = require('@/app/api/cron/candidate-reminders/route');
  });
  return routeModule;
};

describe('Cron candidate reminders contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_SECRET = 'secret';
    mockSendCandidateJourneyEmail.mockReset();
    mockLogger.error.mockReset();
    mockLogger.info.mockReset();
    mockLogger.warn.mockReset();
  });

  it('returns success envelope when no candidates need reminders', async () => {
    const platformsBuilder = createPostgrestBuilder({
      data: [],
      error: null,
    });
    mockSupabaseClient.from.mockReturnValue(platformsBuilder);

    const { GET } = loadRoute();
    const response = await GET(
      createNextRequest('http://localhost/api/cron/candidate-reminders', {
        headers: { authorization: 'Bearer secret' },
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.sent).toBe(0);
    expect(payload.data.message).toMatch(/No candidates need reminders/);
  });

  it('processes candidates and emits send counts', async () => {
    const platformsBuilder = createPostgrestBuilder({
      data: [
        {
          id: 'platform-send',
          user_id: 'user-1',
          status: 'active',
          filing_status: 'filed',
          verified: false,
          created_at: '2025-11-01T00:00:00.000Z',
          user_profiles: { email: 'candidate@example.com' },
        },
        {
          id: 'platform-skip',
          user_id: 'user-2',
          status: 'active',
          filing_status: 'filed',
          verified: false,
          created_at: '2025-11-01T00:00:00.000Z',
          user_profiles: { email: 'candidate2@example.com' },
        },
      ],
      error: null,
    });
    mockSupabaseClient.from.mockReturnValue(platformsBuilder);
    mockSendCandidateJourneyEmail.mockResolvedValue({ success: true });

    const { GET } = loadRoute();
    const response = await GET(
      createNextRequest('http://localhost/api/cron/candidate-reminders', {
        headers: { authorization: 'Bearer secret' },
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.sent).toBe(1);
    expect(payload.data.skipped).toBeGreaterThanOrEqual(1);
    expect(mockSendCandidateJourneyEmail).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ to: 'candidate@example.com' })
    );
  });

  it('logs and surfaces Supabase failures', async () => {
    const failingBuilder = createPostgrestBuilder({
      data: null,
      error: { message: 'db error' } as any,
    });
    mockSupabaseClient.from.mockReturnValue(failingBuilder);

    const { GET } = loadRoute();
    const response = await GET(
      createNextRequest('http://localhost/api/cron/candidate-reminders', {
        headers: { authorization: 'Bearer secret' },
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toMatch(/Failed to fetch platforms/);
    expect(mockLogger.error).toHaveBeenCalled();
  });
});


