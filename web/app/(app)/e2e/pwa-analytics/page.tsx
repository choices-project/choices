'use client';

import { notFound } from 'next/navigation';
import { useEffect, useMemo } from 'react';

import PWAOfflineQueueWidget from '@/features/analytics/components/widgets/PWAOfflineQueueWidget';
import type { WidgetConfig } from '@/features/analytics/types/widget';
import { AnalyticsTestBridge } from '@/app/(app)/e2e/_components/AnalyticsTestBridge';
import { usePWAStore } from '@/lib/stores/pwaStore';

const isProduction = process.env.NODE_ENV === 'production';

const createWidgetConfig = (): WidgetConfig => ({
  id: 'pwa-offline-queue-harness',
  type: 'pwa-offline-queue',
  title: 'Offline Queue Health',
  description: 'Harness widget for PWA offline queue analytics',
  icon: '📡',
  enabled: true,
  position: { x: 0, y: 0 },
  size: { w: 4, h: 3 },
  settings: {
    refreshInterval: 30,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
});

declare global {
  interface Window {
    __pwaQueueHarness?: {
      setQueueState: (
        size: number,
        options?: { cachedPages?: number; cachedResources?: number; isOffline?: boolean }
      ) => void;
      setOnlineStatus: (isOnline: boolean) => void;
      reset: () => void;
    };
  }
}

const day = 24 * 60 * 60 * 1000;

function buildCachedEntries(count: number, prefix: string): string[] {
  return Array.from({ length: Math.max(0, count) }, (_, index) => `${prefix}-${index}`);
}

export default function PWAAnalyticsHarnessPage() {
  const config = useMemo(createWidgetConfig, []);

  useEffect(() => {
    if (isProduction) {
      return;
    }

    const setQueueState: Window['__pwaQueueHarness']['setQueueState'] = (size, options) => {
      const timestamp = new Date().toISOString();
      const currentState = usePWAStore.getState();
      const pages = options?.cachedPages ?? currentState.offline.offlineData.cachedPages.length;
      const resources = options?.cachedResources ?? currentState.offline.offlineData.cachedResources.length;
      const isOffline = options?.isOffline ?? currentState.offline.isOffline;
      const queuedActions = Array.from({ length: Math.max(0, size) }, (_, index) => ({
        id: `action-${index}`,
        action: 'vote',
        data: { index },
        timestamp: Date.now() - index * 1000,
      }));

      usePWAStore.setState((state) => ({
        offline: {
          ...state.offline,
          isOnline: !isOffline,
          isOffline,
          offlineData: {
            ...state.offline.offlineData,
            cachedPages: buildCachedEntries(pages, 'cached-page'),
            cachedResources: buildCachedEntries(resources, 'cached-resource'),
            queuedActions,
          },
        },
        offlineQueueSize: size,
        offlineQueueUpdatedAt: timestamp,
      }));

      window.dispatchEvent(
        new CustomEvent('pwa-analytics', {
          detail: {
            eventName: 'offline_queue_updated',
            properties: {
              size,
              updatedAt: timestamp,
            },
          },
        })
      );
    };

    const setOnlineStatus: Window['__pwaQueueHarness']['setOnlineStatus'] = (isOnline) => {
      usePWAStore.setState((state) => ({
        offline: {
          ...state.offline,
          isOnline,
          isOffline: !isOnline,
        },
      }));
    };

    const reset = () => {
      usePWAStore.setState((state) => ({
        offline: {
          ...state.offline,
          isOnline: true,
          isOffline: false,
          offlineData: {
            ...state.offline.offlineData,
            cachedPages: [],
            cachedResources: [],
            queuedActions: [],
          },
        },
        offlineQueueSize: 0,
        offlineQueueUpdatedAt: new Date(Date.now() - day).toISOString(),
      }));
    };

    window.__pwaQueueHarness = {
      setQueueState,
      setOnlineStatus,
      reset,
    };

    reset();

    return () => {
      delete window.__pwaQueueHarness;
    };
  }, []);

  if (isProduction) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-16">
      <AnalyticsTestBridge />
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6">
        <header className="space-y-3 text-center">
          <h1 className="text-3xl font-semibold text-slate-800">PWA Analytics Harness</h1>
          <p className="text-slate-600">
            Automated tests use this page to exercise the offline queue analytics widget without relying on
            production data or service worker state.
          </p>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm" data-testid="pwa-offline-queue-harness">
          <PWAOfflineQueueWidget id={config.id} config={config} />
        </section>
      </div>
    </main>
  );
}
