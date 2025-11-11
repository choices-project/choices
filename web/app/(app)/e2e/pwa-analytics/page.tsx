'use client';

import { notFound } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AnalyticsTestBridge } from '@/app/(app)/e2e/_components/AnalyticsTestBridge';
import type { PWAQueueHarness } from '@/types/pwa';

const isProduction = process.env.NODE_ENV === 'production';
const allowHarness = process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1';

type HarnessState = {
  queueSize: number;
  cachedPages: number;
  cachedResources: number;
  isOffline: boolean;
  lastUpdated: string;
};

const INITIAL_STATE: HarnessState = {
  queueSize: 0,
  cachedPages: 0,
  cachedResources: 0,
  isOffline: false,
  lastUpdated: new Date().toISOString(),
};

const toneStyles: Record<'success' | 'warn' | 'danger' | 'info', string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warn: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-red-200 bg-red-50 text-red-700',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
};

const formatRelativeTime = (value: string | null | undefined) => {
  if (!value) {
    return 'Never';
  }

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return 'Unknown';
  }

  const diffMs = Date.now() - timestamp;
  if (diffMs < 0) {
    return 'Just now';
  }

  const diffSeconds = Math.floor(diffMs / 1000);
  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const getQueueStatus = (size: number, isOffline: boolean, isProcessing: boolean) => {
  if (isProcessing) {
    return {
      label: 'Syncing…',
      tone: 'info' as const,
      description: 'Background sync in progress',
    };
  }

  if (size === 0) {
    return {
      label: 'Healthy',
      tone: 'success' as const,
      description: isOffline
        ? 'Offline; queue will sync when connection returns'
        : 'Background sync is healthy',
    };
  }

  if (size <= 5) {
    return {
      label: 'Monitor',
      tone: 'warn' as const,
      description: 'Queued actions will sync soon',
    };
  }

  return {
    label: 'Attention',
    tone: 'danger' as const,
    description: 'Queue is growing; consider manual sync',
  };
};

const recordAnalyticsEvent = (action: string, payload: Record<string, unknown>) => {
  const bridge = globalThis.__playwrightAnalytics as
    | { events?: Array<Record<string, unknown>> }
    | undefined;

  if (bridge?.events) {
    bridge.events.push({ action, metadata: payload, timestamp: new Date().toISOString() });
  }
};

export default function PWAAnalyticsHarnessPage() {
  if (isProduction && !allowHarness) {
    notFound();
  }

  const [state, setState] = useState<HarnessState>(INITIAL_STATE);
  const [isProcessing, setIsProcessing] = useState(false);

  const queueStatus = useMemo(
    () => getQueueStatus(state.queueSize, state.isOffline, isProcessing),
    [state.queueSize, state.isOffline, isProcessing]
  );
  const relativeLastUpdated = useMemo(() => formatRelativeTime(state.lastUpdated), [state.lastUpdated]);

  const handleProcessQueue = useCallback(async () => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    try {
      await fetch('/api/offline/process', { method: 'POST' }).catch(() => undefined);
    } finally {
      setState((prev) => ({
        ...prev,
        queueSize: 0,
        cachedPages: 0,
        cachedResources: 0,
        lastUpdated: new Date().toISOString(),
      }));
      recordAnalyticsEvent('offline_queue_processed', {});
      setIsProcessing(false);
    }
  }, [isProcessing]);

  useEffect(() => {
    if (isProduction && !allowHarness) {
      return;
    }

    const harness: PWAQueueHarness = {
      setQueueState: (size, options) => {
        setState((prev) => ({
          queueSize: Math.max(0, size),
          cachedPages: options?.cachedPages ?? prev.cachedPages,
          cachedResources: options?.cachedResources ?? prev.cachedResources,
          isOffline: options?.isOffline ?? prev.isOffline,
          lastUpdated: new Date().toISOString(),
        }));

        recordAnalyticsEvent('offline_queue_updated', {
          size,
          cachedPages: options?.cachedPages,
          cachedResources: options?.cachedResources,
          isOffline: options?.isOffline,
        });
      },
      setOnlineStatus: (isOnline) => {
        setState((prev) => ({
          ...prev,
          isOffline: !isOnline,
          lastUpdated: new Date().toISOString(),
        }));

        recordAnalyticsEvent('offline_queue_status', {
          isOnline,
        });
      },
      reset: () => {
        setState({
          queueSize: 0,
          cachedPages: 0,
          cachedResources: 0,
          isOffline: false,
          lastUpdated: new Date().toISOString(),
        });
      },
    };

    window.__pwaQueueHarness = harness;
    harness.reset?.();

    return () => {
      delete window.__pwaQueueHarness;
    };
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-16">
      <AnalyticsTestBridge />
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6">
        <header className="space-y-3 text-center">
          <h1 className="text-3xl font-semibold text-slate-800">PWA Analytics Harness</h1>
          <p className="text-slate-600">
            Automated tests use this page to exercise the offline queue analytics harness without relying on production
            data or service worker state.
          </p>
        </header>

        <section
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          data-testid="pwa-offline-queue-widget"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                data-testid="pwa-offline-queue-status"
                className={`rounded-lg border px-3 py-1 text-sm font-semibold ${toneStyles[queueStatus.tone]}`}
              >
                {queueStatus.label}
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Offline Queue Health</h2>
                <p className="text-sm text-slate-500">Monitor pending PWA actions awaiting background sync.</p>
                <p className="mt-1 text-xs text-slate-400">{queueStatus.description}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Queued Actions</p>
              <p data-testid="pwa-offline-queue-count" className="text-2xl font-semibold text-slate-900">
                {state.queueSize}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Last Update</p>
              <p className="text-lg font-medium text-slate-900">{relativeLastUpdated}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Cached Pages</p>
              <p className="text-lg font-medium text-slate-900">{state.cachedPages}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Cached Resources</p>
              <p className="text-lg font-medium text-slate-900">{state.cachedResources}</p>
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between pt-6">
            <div className="text-xs text-slate-500">
              {state.isOffline
                ? 'Device offline — queued actions will process once reconnected.'
                : 'Connected — background sync will process queued actions automatically.'}
            </div>
            <button
              type="button"
              data-testid="pwa-offline-queue-process"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleProcessQueue}
              disabled={isProcessing || state.queueSize === 0}
            >
              {isProcessing ? 'Processing…' : 'Process now'}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
