import type { AnalyticsEvent } from '@/lib/stores/analyticsStore';

export type PlaywrightAnalyticsBridge = {
  events: AnalyticsEvent[];
  enable: () => void;
  reset: () => void;
};

declare global {
  namespace globalThis {
    // eslint-disable-next-line no-var
    var __playwrightAnalytics: PlaywrightAnalyticsBridge | undefined;
  }
}

