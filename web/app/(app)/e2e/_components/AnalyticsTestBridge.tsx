'use client';

import { useEffect, useRef } from 'react';

import {
  analyticsStoreSubscriptions,
  useAnalyticsActions,
  useAnalyticsEvents,
} from '@/lib/stores/analyticsStore';
import type { AnalyticsEvent } from '@/lib/stores/analyticsStore';

type AnalyticsBridgeApi = {
  events: AnalyticsEvent[];
  enable: () => void;
  reset: () => void;
};

export function AnalyticsTestBridge() {
  const events = useAnalyticsEvents();
  const { setTrackingEnabled, updatePreferences, clearEvents } = useAnalyticsActions();
  const bridgeRef = useRef<AnalyticsBridgeApi | null>(null);

  useEffect(() => {
    const api: AnalyticsBridgeApi = {
      events: [],
      enable: () => {
        setTrackingEnabled(true);
        updatePreferences({ trackingEnabled: true });
        clearEvents();
        api.events.splice(0, api.events.length);
      },
      reset: () => {
        setTrackingEnabled(false);
        updatePreferences({ trackingEnabled: false });
        clearEvents();
        api.events.splice(0, api.events.length);
      },
    };

    bridgeRef.current = api;
    globalThis.__playwrightAnalytics = api;

    window.dispatchEvent(new Event('playwright:analytics-ready'));

    return () => {
      bridgeRef.current = null;
      Reflect.deleteProperty(globalThis, '__playwrightAnalytics');
    };
  }, [clearEvents, setTrackingEnabled, updatePreferences]);

  useEffect(() => {
    const unsubscribe = analyticsStoreSubscriptions.onEventTracked((event) => {
      const api = bridgeRef.current;
      if (api) {
        api.events.push(event);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (events.length === 0) {
      return;
    }

    const api = bridgeRef.current;
    if (api && api.events.length < events.length) {
      api.events.splice(0, api.events.length, ...events);
    }
  }, [events]);

  return (
    <div data-testid="analytics-inspector" className="sr-only" aria-hidden="true">
      {events.length}
    </div>
  );
}

