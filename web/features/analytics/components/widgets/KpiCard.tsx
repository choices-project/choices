'use client';

import { ArrowDownRight, ArrowUpRight, RefreshCw } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { cn } from '@/lib/utils';

import { useI18n } from '@/hooks/useI18n';

import type { WidgetProps } from '../../types/widget';

type KpiResponse = {
  metric: string;
  label: string;
  value: number;
  unit?: string;
  changePercent: number;
  trendWindow: string;
  description?: string;
  generatedAt: string;
};

type ApiResponse = {
  success: boolean;
  kpi?: KpiResponse;
  error?: string;
};

const METRIC_LABELS: Record<string, string> = {
  dau: 'Daily Active Users',
  polls_created: 'Polls Created',
  civic_engagement: 'Active Civic Actions',
};

const METRIC_DESCRIPTIONS: Record<string, string> = {
  dau: 'Unique voters in the last 24 hours',
  polls_created: 'New polls created in the last 7 days',
  civic_engagement: 'Public civic actions currently collecting signatures',
};

const DEFAULT_METRIC = 'dau';

export default function KpiCardWidget({ config }: WidgetProps) {
  const { currentLanguage, t } = useI18n();
  const metric = (config.settings.filters?.metric as string) ?? DEFAULT_METRIC;
  const refreshInterval = Number(config.settings.refreshInterval ?? 60_000);
  const [data, setData] = useState<KpiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(currentLanguage, {
        maximumFractionDigits: 1,
      }),
    [currentLanguage]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/analytics/kpi?metric=${metric}`, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }

      const payload = (await response.json()) as ApiResponse;
      if (!payload.success || !payload.kpi) {
        throw new Error(payload.error ?? 'Unknown KPI error');
      }

      setData(payload.kpi);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load KPI';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [metric]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!refreshInterval || Number.isNaN(refreshInterval)) {
      return;
    }
    const handle = setInterval(fetchData, refreshInterval);
    return () => clearInterval(handle);
  }, [fetchData, refreshInterval]);

  const formattedValue = useMemo(() => {
    if (!data) return '--';
    if (data.unit === '%') {
      return `${numberFormatter.format(data.value)}%`;
    }
    return numberFormatter.format(data.value);
  }, [data, numberFormatter]);

  const changeBadge = useMemo(() => {
    if (!data) return null;
    const isPositive = data.changePercent >= 0;
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
    const tone = isPositive ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50';

    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
          tone
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        {numberFormatter.format(Math.abs(data.changePercent))}%
      </span>
    );
  }, [data, numberFormatter]);

  const title = data?.label ?? METRIC_LABELS[metric] ?? t('analytics.kpi.defaultTitle' as never);
  const description =
    data?.description ?? METRIC_DESCRIPTIONS[metric] ?? t('analytics.kpi.defaultDescription' as never);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Refresh KPI"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin text-primary')} />
          </Button>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        ) : error ? (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : (
          <>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-bold tracking-tight text-slate-900">
                {formattedValue}
              </span>
              {changeBadge}
            </div>
            <div className="text-sm text-muted-foreground">
              Trend window: {data?.trendWindow ?? '—'}
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        {data?.generatedAt
          ? `Updated ${new Date(data.generatedAt).toLocaleString()}`
          : 'Awaiting KPI data'}
      </CardFooter>
    </Card>
  );
}

