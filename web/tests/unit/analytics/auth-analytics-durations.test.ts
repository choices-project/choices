import { describe, it, expect } from '@jest/globals';

import { AuthAnalytics, AuthEventType, AuthMethod } from '@/features/analytics/lib/auth-analytics';

describe('AuthAnalytics duration handling', () => {
  it('computes averages using only numeric durations', async () => {
    const analytics = new AuthAnalytics();
    await analytics.trackAuthEvent(
      AuthEventType.LOGIN_SUCCESS,
      AuthMethod.PASSWORD,
      true,
      { userId: 'u1' },
      { duration: 100 }
    );
    // add an event without duration
    await analytics.trackAuthEvent(
      AuthEventType.LOGIN_SUCCESS,
      AuthMethod.PASSWORD,
      true,
      { userId: 'u1' }
    );
    const perf = analytics.getPerformanceMetrics();
    expect(perf.averageResponseTime).toBeGreaterThan(0);
    expect(perf.averageResponseTime).toBeLessThanOrEqual(100);
  });
});


