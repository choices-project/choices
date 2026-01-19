import {
  notifyHashtagTrending,
  shouldNotifyHashtagTrending,
} from '@/features/hashtags/lib/notification-service';

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Hashtag notification service', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('treats helper envelopes as the source of truth for POST success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        data: { id: 'notif-1' },
      }),
    }) as unknown as typeof global.fetch;

    const result = await notifyHashtagTrending(
      'user-123',
      'hash-456',
      'ClimateAction',
      87.5,
      120,
    );

    expect(result).toEqual({ success: true });
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/notifications',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
  });

  it('propagates helper error envelopes from POST responses', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: false,
        error: 'Duplicate notification',
      }),
    }) as unknown as typeof global.fetch;

    const result = await notifyHashtagTrending(
      'user-123',
      'hash-456',
      'ClimateAction',
      87.5,
      120,
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Duplicate notification');
  });

  it('prevents duplicate notifications when envelope contains a recent match', async () => {
    const fixedNow = 1_731_600_000_000;
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(fixedNow);
    const recentIso = new Date(fixedNow - 5_000).toISOString();

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          notifications: [
            {
              notification_type: 'hashtag_trending',
              metadata: { hashtag_id: 'hash-456' },
              created_at: recentIso,
            },
          ],
        },
      }),
    }) as unknown as typeof global.fetch;

    const shouldNotify = await shouldNotifyHashtagTrending('user-123', 'hash-456');

    expect(shouldNotify).toBe(false);
    nowSpy.mockRestore();
  });
});

