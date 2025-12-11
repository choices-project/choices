'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { useI18n } from '@/hooks/useI18n';

import type { WidgetConfig, WidgetProps } from '../../types/widget';

type FunnelId = 'onboarding' | 'poll-creation' | 'civic-action';

type FunnelResponse = {
  id: FunnelId;
  label: string;
  totalEntries: number;
  completionRate: number;
  steps: Array<{
    id: string;
    label: string;
    count: number;
    conversionRate: number;
    dropOffRate: number;
    description?: string;
  }>;
  insights: string[];
  generatedAt: string;
};

type ApiResponse = {
  success: boolean;
  funnel?: FunnelResponse;
  error?: string;
};

const FUNNEL_OPTIONS: Array<{ id: FunnelId; label: string }> = [
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'poll-creation', label: 'Poll Creation' },
  { id: 'civic-action', label: 'Civic Actions' },
];

const DEFAULT_FUNNEL: FunnelId = 'onboarding';

export default function FunnelWidget({ config, onConfigChange }: WidgetProps) {
  const { currentLanguage } = useI18n();
  const [data, setData] = useState<FunnelResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const funnelId = (config.settings.filters?.funnel as FunnelId) ?? DEFAULT_FUNNEL;

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
      const response = await fetch(`/api/analytics/funnels?funnel=${funnelId}`, {
        cache: 'no-store',
        headers: { 'Accept': 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }

      const payload = (await response.json()) as ApiResponse;
      if (!payload.success || !payload.funnel) {
        throw new Error(payload.error ?? 'Unknown funnel error');
      }

      setData(payload.funnel);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load funnel data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [funnelId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const completionText = data
    ? `${numberFormatter.format(data.completionRate)}% completion`
    : '--';

  const handleFunnelChange = (value: string) => {
    const nextFunnel = (value as FunnelId) ?? DEFAULT_FUNNEL;
    updateWidgetFilters(config, nextFunnel, onConfigChange);
  };

  const insights = data?.insights ?? [];

  return (
    <Card className="h-full">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">{data?.label ?? 'Conversion Funnel'}</CardTitle>
            <CardDescription>{completionText}</CardDescription>
          </div>
          <label className="text-xs font-medium text-muted-foreground">
            Funnel
            <select
              className="mt-1 block rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={funnelId}
              onChange={(event) => handleFunnelChange(event.target.value)}
            >
              {FUNNEL_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <FunnelSkeleton />
        ) : error ? (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : data ? (
          <>
            <div className="space-y-4">
              {data.steps.map((step) => (
                <div key={step.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>{step.label}</span>
                    <span>{numberFormatter.format(step.conversionRate)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.max(0, Math.min(100, step.conversionRate))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{step.description ?? ''}</span>
                    <span>Drop-off: {numberFormatter.format(step.dropOffRate)}%</span>
                  </div>
                </div>
              ))}
            </div>
            {insights.length > 0 && (
              <div className="rounded-md bg-muted/40 p-3 text-sm">
                <p className="font-medium text-muted-foreground">Insights</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  {insights.map((insight) => (
                    <li key={insight}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-muted-foreground">No funnel data available.</div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        {data?.generatedAt ? `Updated ${new Date(data.generatedAt).toLocaleString()}` : 'Awaiting data'}
      </CardFooter>
    </Card>
  );
}

const FunnelSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3, 4].map((index) => (
      <div key={index} className="space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-2 w-full" />
      </div>
    ))}
  </div>
);

function updateWidgetFilters(
  config: WidgetConfig,
  nextFunnel: FunnelId,
  onConfigChange?: (changes: Partial<WidgetConfig>) => void
) {
  if (!onConfigChange) return;
  const nextFilters = {
    ...(config.settings.filters ?? {}),
    funnel: nextFunnel,
  };
  onConfigChange({
    settings: {
      ...config.settings,
      filters: nextFilters,
    },
  });
}

