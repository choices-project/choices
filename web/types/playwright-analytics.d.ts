import type { AnalyticsEvent } from '@/lib/stores/analyticsStore';

export type PlaywrightAnalyticsBridge = {
  events: AnalyticsEvent[];
  enable: () => void;
  reset: () => void;
};

declare global {
  namespace globalThis {
     
    var __playwrightAnalytics: PlaywrightAnalyticsBridge | undefined;
  }
}

