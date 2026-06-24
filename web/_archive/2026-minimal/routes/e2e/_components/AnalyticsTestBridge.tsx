'use client';

import { useEffect, useRef } from 'react';

import {
  analyticsStoreSubscriptions,
  useAnalyticsActions,
  useAnalyticsEvents,
} from '@/lib/stores/analyticsStore';

import type { PlaywrightAnalyticsBridge } from '@/types/playwright-analytics';

export function AnalyticsTestBridge() {
  const events = useAnalyticsEvents();
  const { setTrackingEnabled, updatePreferences, clearEvents } = useAnalyticsActions();
  const bridgeRef = useRef<PlaywrightAnalyticsBridge | null>(null);
  const actionsRef = useRef({ setTrackingEnabled, updatePreferences, clearEvents });

  // Update refs when actions change
  useEffect(() => {
    actionsRef.current = { setTrackingEnabled, updatePreferences, clearEvents };
  }, [setTrackingEnabled, updatePreferences, clearEvents]);

  // Initialize bridge immediately on mount (don't wait for dependencies)
  useEffect(() => {
    const api: PlaywrightAnalyticsBridge = {
      events: [],
      enable: () => {
        actionsRef.current.setTrackingEnabled(true);
        actionsRef.current.updatePreferences({ trackingEnabled: true });
        actionsRef.current.clearEvents();
        api.events.splice(0, api.events.length);
      },
      reset: () => {
        actionsRef.current.setTrackingEnabled(false);
        actionsRef.current.updatePreferences({ trackingEnabled: false });
        actionsRef.current.clearEvents();
        api.events.splice(0, api.events.length);
      },
    };

    console.warn('[analytics-test-bridge] initialising');
    bridgeRef.current = api;
    globalThis.__playwrightAnalytics = api;

    // Dispatch ready event immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('playwright:analytics-ready'));
    }

    return () => {
      bridgeRef.current = null;
      if (typeof globalThis !== 'undefined') {
        Reflect.deleteProperty(globalThis, '__playwrightAnalytics');
      }
    };
  }, []); // Empty deps - initialize once, use refs for actions

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

