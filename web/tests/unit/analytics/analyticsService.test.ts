/**
 * @jest-environment node
 */
import {
  generateAnalyticsReport,
  sendAnalyticsEvents,
} from '@/lib/analytics/services/analyticsService';

const EVENTS_ENDPOINT =
  '/api/analytics/unified/events?methods=comprehensive&ai-provider=rule-based';

const mockResponse = <T>(options: {
  ok: boolean;
  body?: T;
  statusText?: string;
}): Response =>
  ({
    ok: options.ok,
    statusText: options.statusText ?? (options.ok ? 'OK' : 'Internal Server Error'),
    json: async () => options.body,
  } as unknown as Response);

describe('analyticsService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    if (originalFetch) {
      global.fetch = originalFetch;
    } else {
       
      delete (global as Record<string, unknown>).fetch;
    }
  });

  it('sendAnalyticsEvents posts events and returns success', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse({ ok: true }));

    const payload = {
      events: [],
      sessionId: 'session_123',
      timestamp: new Date().toISOString(),
    };

    const result = await sendAnalyticsEvents(payload);

    expect(global.fetch).toHaveBeenCalledWith(
      EVENTS_ENDPOINT,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    );
    expect(result).toEqual({ success: true, data: undefined });
  });

  it('sendAnalyticsEvents returns failure when response is not ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockResponse({ ok: false, statusText: 'Bad Request' }),
    );

    const result = await sendAnalyticsEvents({
      events: [],
      sessionId: 'session_456',
      timestamp: new Date().toISOString(),
    });

    expect(result.success).toBe(false);
    expect(result).toMatchObject({
      error: expect.stringContaining('Failed to send analytics data'),
    });
  });

  it('generateAnalyticsReport returns dashboard data on success', async () => {
    const dashboard = {
      totalEvents: 10,
      uniqueUsers: 5,
      sessionCount: 2,
      averageSessionDuration: 120,
      topPages: [{ page: '/polls', views: 3 }],
      topActions: [{ action: 'vote', count: 4 }],
      userEngagement: 75,
      conversionFunnel: [{ step: 'start', users: 5, conversion: 0.6 }],
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse({ ok: true, body: dashboard }));

    const result = await generateAnalyticsReport({
      startDate: '2025-01-01',
      endDate: '2025-01-31',
    });

    expect(result).toEqual({ success: true, data: dashboard });
  });

  it('generateAnalyticsReport returns failure when request fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse({ ok: false }));

    const result = await generateAnalyticsReport({
      startDate: '2025-02-01',
      endDate: '2025-02-28',
    });

    expect(result.success).toBe(false);
    expect(result).toMatchObject({
      error: 'Failed to generate analytics report',
    });
  });
});

