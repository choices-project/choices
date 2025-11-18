'use client';

import React, { useEffect, useRef, useState } from 'react';

import {
  useAnalyticsActions,
  useAnalyticsStore,
  type AnalyticsStore,
} from '@/lib/stores/analyticsStore';

import { AnalyticsTestBridge } from '../_components/AnalyticsTestBridge';

type AnalyticsHarnessActions = ReturnType<typeof useAnalyticsActions>;

export type AnalyticsStoreHarness = {
  getSnapshot: () => AnalyticsStore;
  enableTracking: () => void;
  disableTracking: () => void;
  reset: () => void;
  clearEvents: AnalyticsHarnessActions['clearEvents'];
  trackEvent: AnalyticsHarnessActions['trackEvent'];
  trackPageView: AnalyticsHarnessActions['trackPageView'];
  trackUserAction: AnalyticsHarnessActions['trackUserAction'];
  sendAnalytics: AnalyticsHarnessActions['sendAnalytics'];
  generateReport: AnalyticsHarnessActions['generateReport'];
  setDashboard: AnalyticsHarnessActions['setDashboard'];
  setChartConfig: AnalyticsHarnessActions['setChartConfig'];
};

declare global {
  var __analyticsStoreHarness: AnalyticsStoreHarness | undefined;
}

const formatNumber = (value: number | undefined | null) =>
  typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString() : '—';

const formatBoolean = (value: boolean | undefined | null) =>
  value ? 'true' : 'false';

export default function AnalyticsStoreHarnessPage() {
  const events = useAnalyticsStore((store) => store.events);
  const dashboard = useAnalyticsStore((store) => store.dashboard);
  const metrics = useAnalyticsStore((store) => store.performanceMetrics);
  const preferences = useAnalyticsStore((store) => store.preferences);
  const trackingEnabled = useAnalyticsStore((store) => store.trackingEnabled);
  const error = useAnalyticsStore((store) => store.error);
  const sessionId = useAnalyticsStore((store) => store.sessionId);
  const isTracking = useAnalyticsStore((store) => store.isTracking);
  const isSending = useAnalyticsStore((store) => store.isSending);
  const chartData = useAnalyticsStore((store) => store.chartData);
  const chartMaxValue = useAnalyticsStore((store) => store.chartMaxValue);
  const chartShowTrends = useAnalyticsStore((store) => store.chartShowTrends);
  const chartShowConfidence = useAnalyticsStore((store) => store.chartShowConfidence);
  const session = React.useMemo(
    () => ({
      sessionId,
      events,
      isTracking,
      isSending,
    }),
    [sessionId, events, isTracking, isSending],
  );
  const chartContext = React.useMemo(
    () => ({
      data: chartData,
      maxValue: chartMaxValue,
      showTrends: chartShowTrends,
      showConfidence: chartShowConfidence,
    }),
    [chartData, chartMaxValue, chartShowTrends, chartShowConfidence],
  );
  const [isMounted, setIsMounted] = useState(false);
  const actions = useAnalyticsActions();
  const actionsRef = useRef(actions);
  const snapshotRef = useRef<Partial<AnalyticsStore>>({});

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  useEffect(() => {
    if (!isMounted) return;
    snapshotRef.current = {
      events,
      dashboard,
      performanceMetrics: metrics,
      preferences,
      trackingEnabled,
      error,
      session,
      chartData: chartContext.data,
      chartMaxValue: chartContext.maxValue,
      chartShowTrends: chartContext.showTrends,
      chartShowConfidence: chartContext.showConfidence,
    } as Partial<AnalyticsStore>;
  }, [chartContext, dashboard, error, events, isMounted, metrics, preferences, session, trackingEnabled]);

  useEffect(() => {
    if (!isMounted) return;
    const harness: AnalyticsStoreHarness = {
      getSnapshot: () => snapshotRef.current as AnalyticsStore,
      enableTracking: () => {
        const api = actionsRef.current;
        api.setTrackingEnabled(true);
        api.updatePreferences({ trackingEnabled: true });
      },
      disableTracking: () => {
        const api = actionsRef.current;
        api.setTrackingEnabled(false);
        api.updatePreferences({ trackingEnabled: false });
      },
      reset: () => {
        actionsRef.current.resetAnalyticsState();
      },
      clearEvents: (...args) => actionsRef.current.clearEvents(...args),
      trackEvent: (...args) => actionsRef.current.trackEvent(...args),
      trackPageView: (...args) => actionsRef.current.trackPageView(...args),
      trackUserAction: (...args) => actionsRef.current.trackUserAction(...args),
      sendAnalytics: (...args) => actionsRef.current.sendAnalytics(...args),
      generateReport: (...args) => actionsRef.current.generateReport(...args),
      setDashboard: (...args) => actionsRef.current.setDashboard(...args),
      setChartConfig: (...args) => actionsRef.current.setChartConfig(...args),
    };

    console.warn('[analytics-store-harness] setting window.__analyticsStoreHarness');
    window.__analyticsStoreHarness = harness;
    return () => {
      console.warn('[analytics-store-harness] cleaning window.__analyticsStoreHarness');
      if (window.__analyticsStoreHarness === harness) {
         
        delete (window as any).__analyticsStoreHarness;
      }
    };
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted) {
      return;
    }
    console.warn('[analytics-store-harness] marking dataset ready');
    document.documentElement.dataset.analyticsStoreHarness = 'ready';
    return () => {
      if (document.documentElement.dataset.analyticsStoreHarness) {
        delete document.documentElement.dataset.analyticsStoreHarness;
      }
    };
  }, [isMounted]);

  if (!isMounted) {
    return (
      <main data-testid="analytics-store-harness" className="mx-auto flex w_full max-w-5xl flex-col gap-6 p-6">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h1 className="text-xl font-semibold">Analytics Store Harness</h1>
          <p className="text-sm text-slate-600">Loading harness state…</p>
        </section>
      </main>
    );
  }

  const totalEvents = events.length;
  const latestEvent = totalEvents > 0 ? events[events.length - 1] : null;

  return (
    <main
      data-testid="analytics-store-harness"
      className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6"
    >
      <AnalyticsTestBridge />

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold">Analytics Store Harness</h1>
        <p className="text-sm text-slate-600">
          Interact with the analytics store via <code>window.__analyticsStoreHarness</code>.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <div>
          <h2 className="text-lg font-medium">Session</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt>Session ID</dt>
              <dd data-testid="analytics-session-id" className="font-mono text-xs">
                {session.sessionId}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Tracking Enabled</dt>
              <dd data-testid="analytics-tracking-enabled">{formatBoolean(trackingEnabled)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Consent (preferences.trackingEnabled)</dt>
              <dd data-testid="analytics-preference-tracking">
                {formatBoolean(preferences.trackingEnabled)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Total Events</dt>
              <dd data-testid="analytics-event-count">{String(totalEvents)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Error</dt>
              <dd data-testid="analytics-error">{error ?? 'none'}</dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 className="text-lg font-medium">Latest Event</h2>
          <dl className="mt-2 space-y-1 break-all text-sm">
            <div className="flex justify-between gap-2">
              <dt>Type</dt>
              <dd data-testid="analytics-latest-type">{latestEvent?.type ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Category</dt>
              <dd data-testid="analytics-latest-category">{latestEvent?.category ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Action</dt>
              <dd data-testid="analytics-latest-action">{latestEvent?.action ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Label</dt>
              <dd data-testid="analytics-latest-label">{latestEvent?.label ?? '—'}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-medium">Dashboard Snapshot</h3>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt>Total Events</dt>
              <dd data-testid="analytics-dashboard-events">
                {formatNumber(dashboard?.totalEvents)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Unique Users</dt>
              <dd data-testid="analytics-dashboard-users">
                {formatNumber(dashboard?.uniqueUsers)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Session Count</dt>
              <dd data-testid="analytics-dashboard-sessions">
                {formatNumber(dashboard?.sessionCount)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Avg. Session Duration</dt>
              <dd data-testid="analytics-dashboard-duration">
                {formatNumber(dashboard?.averageSessionDuration)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-medium">Performance Metrics</h3>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt>Page Load</dt>
              <dd data-testid="analytics-metrics-page-load">
                {formatNumber(metrics?.pageLoadTime)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>TTI</dt>
              <dd data-testid="analytics-metrics-tti">
                {formatNumber(metrics?.timeToInteractive)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>CLS</dt>
              <dd data-testid="analytics-metrics-cls">
                {formatNumber(metrics?.cumulativeLayoutShift)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>TBT</dt>
              <dd data-testid="analytics-metrics-tbt">
                {formatNumber(metrics?.totalBlockingTime)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-medium">Chart Context</h3>
        <dl className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-2">
            <dt>Data Points</dt>
            <dd data-testid="analytics-chart-count">{String(chartContext.data.length)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Max Value</dt>
            <dd data-testid="analytics-chart-max">{formatNumber(chartContext.maxValue)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Show Trends</dt>
            <dd data-testid="analytics-chart-trends">
              {formatBoolean(chartContext.showTrends)}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Show Confidence</dt>
            <dd data-testid="analytics-chart-confidence">
              {formatBoolean(chartContext.showConfidence)}
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
}

