'use client';

import { RefreshCw, TrendingUp, Activity, AlertTriangle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { WidgetProps } from '../../types/widget';

type ElectionNotificationMetrics = {
  windowDays: number;
  totals: {
    delivered: number;
    opened: number;
  };
  conversionRate: number;
  byDay: Array<{
    date: string;
    delivered: number;
    opened: number;
  }>;
  bySource: Array<{
    source: string;
    delivered: number;
    opened: number;
  }>;
  lastUpdated: string;
};

const DEFAULT_WINDOW_DAYS = 30;

type ApiResponse =
  | {
      success: true;
      data: ElectionNotificationMetrics;
    }
  | {
      success: false;
      error: string;
    };

const metricLabel = 'text-xs uppercase tracking-wide text-slate-500';
const metricValue = 'text-2xl font-semibold text-slate-900';

const formatRelative = (value: string | null | undefined) => {
  if (!value) return '—';
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return value;
  const diffSeconds = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSeconds < 0) return 'Just now';
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const toneClasses = {
  healthy: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  watch: 'border-amber-200 bg-amber-50 text-amber-700',
  warning: 'border-red-200 bg-red-50 text-red-700'
};

const getTone = (conversionRate: number) => {
  if (conversionRate >= 40) return { tone: 'healthy', label: 'High engagement', icon: TrendingUp } as const;
  if (conversionRate >= 20) return { tone: 'watch', label: 'Monitor engagement', icon: Activity } as const;
  return { tone: 'warning', label: 'Low engagement', icon: AlertTriangle } as const;
};

export default function ElectionNotificationWidget({ config }: WidgetProps) {
  const [metrics, setMetrics] = useState<ElectionNotificationMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshInterval = useMemo(() => {
    const interval = config.settings.refreshInterval ?? 300; // seconds
    return Math.max(interval, 30) * 1000;
  }, [config.settings.refreshInterval]);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/analytics/election-notifications', {
        cache: 'no-store'
      });
      const payload = (await response.json()) as ApiResponse;
      if ('success' in payload && payload.success) {
        setMetrics(payload.data);
      } else {
        setError(payload.error ?? 'Failed to load metrics');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to load metrics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void fetchMetrics();
    }, refreshInterval);
    return () => window.clearInterval(id);
  }, [fetchMetrics, refreshInterval]);

  const tone = getTone(metrics?.conversionRate ?? 0);

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={cn('rounded-lg border px-3 py-1 text-sm font-semibold', toneClasses[tone.tone])}>
            <tone.icon className="mr-2 inline-block h-4 w-4 align-middle" />
            <span className="align-middle">{tone.label}</span>
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Election Notification Engagement</h3>
            <p className="text-sm text-slate-500">
              Track delivered alerts, opens, and conversion trends across civics surfaces.
            </p>
            {metrics?.lastUpdated && (
              <p className="mt-1 text-xs text-slate-400">Last updated {formatRelative(metrics.lastUpdated)}</p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchMetrics()}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </header>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <p className={metricLabel}>Delivered</p>
          <p className={metricValue}>
            {isLoading ? '—' : metrics?.totals.delivered.toLocaleString() ?? '0'}
          </p>
        </div>
        <div>
          <p className={metricLabel}>Opened</p>
          <p className={metricValue}>
            {isLoading ? '—' : metrics?.totals.opened.toLocaleString() ?? '0'}
          </p>
        </div>
        <div>
          <p className={metricLabel}>Conversion Rate</p>
          <p className={metricValue}>
            {isLoading ? '—' : `${metrics?.conversionRate.toFixed(2) ?? '0.00'}%`}
          </p>
        </div>
      </section>

      <section className="mt-6">
        <h4 className="text-sm font-semibold text-slate-700">Daily Trend (last {metrics?.windowDays ?? DEFAULT_WINDOW_DAYS} days)</h4>
        <div className="mt-3 h-32 overflow-x-auto">
          <div className="flex items-end gap-2">
            {(metrics?.byDay ?? []).map((item) => {
              const max = Math.max(item.delivered, item.opened, 1);
              const deliveredHeight = (item.delivered / max) * 40;
              const openedHeight = (item.opened / max) * 40;
              return (
                <div key={item.date} className="flex flex-col items-center gap-1 text-xs">
                  <div className="flex h-10 w-8 flex-col justify-end gap-1">
                    <div
                      className="w-full rounded-sm bg-slate-400"
                      style={{ height: `${deliveredHeight}px` }}
                      title={`${item.delivered} delivered`}
                    />
                    <div
                      className="w-full rounded-sm bg-emerald-500"
                      style={{ height: `${openedHeight}px` }}
                      title={`${item.opened} opened`}
                    />
                  </div>
                  <span className="text-slate-500">{item.date.slice(5)}</span>
                </div>
              );
            })}
            {metrics?.byDay?.length === 0 && !isLoading && (
              <div className="text-xs text-slate-500">No events in selected window</div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h4 className="text-sm font-semibold text-slate-700">Top Sources</h4>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
          {(metrics?.bySource ?? []).slice(0, 6).map((item) => (
            <div
              key={item.source}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            >
              <span className="font-medium text-slate-700">{item.source}</span>
              <span className="text-slate-500">
                {item.opened}/{item.delivered}
              </span>
            </div>
          ))}
          {metrics?.bySource?.length === 0 && !isLoading && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              No sources recorded yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

