import type { NextRequest } from 'next/server';

import {
  successResponse,
  errorResponse,
  validationError,
  withErrorHandling
} from '@/lib/api';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

const EVENT_TYPES = ['notifications.election.delivered', 'notifications.election.opened'] as const;
type ElectionEventType = (typeof EVENT_TYPES)[number];

type AggregatedMetrics = {
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
const MAX_WINDOW_DAYS = 180;

const parseWindowDays = (value: string | null): number => {
  if (!value) return DEFAULT_WINDOW_DAYS;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return DEFAULT_WINDOW_DAYS;
  return Math.min(parsed, MAX_WINDOW_DAYS);
};

const normaliseDateKey = (timestamp: string): string => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
};

export const GET = withErrorHandling(async (request: NextRequest) => {
  if (!isFeatureEnabled('ANALYTICS')) {
    return errorResponse('Analytics feature is disabled', 403);
  }

  const supabase = await getSupabaseServerClient();
  const urlObj = request.nextUrl ?? new URL(request.url ?? 'http://localhost');
  const { searchParams } = urlObj;
  const windowDays = parseWindowDays(searchParams.get('windowDays'));

  const since = new Date();
  since.setDate(since.getDate() - windowDays);

  const { data, error } = await supabase
    .from('analytics_events')
    .select('event_type, created_at, event_data')
    .in('event_type', EVENT_TYPES as unknown as string[])
    .gte('created_at', since.toISOString());

  if (error) {
    return errorResponse('Failed to fetch analytics events', 500, {
      hint: error.message
    });
  }

  if (!Array.isArray(data)) {
    return validationError({ data: 'Unexpected analytics payload' });
  }

  const totals = { delivered: 0, opened: 0 };
  const byDay = new Map<string, { delivered: number; opened: number }>();
  const bySource = new Map<string, { delivered: number; opened: number }>();

  data.forEach((event) => {
    const type = event.event_type as ElectionEventType;
    if (!EVENT_TYPES.includes(type)) return;

    const bucket = byDay.get(normaliseDateKey(event.created_at ?? new Date().toISOString())) ?? {
      delivered: 0,
      opened: 0
    };

    const source =
      typeof (event.event_data as Record<string, unknown> | null)?.source === 'string'
        ? ((event.event_data as Record<string, unknown>).source as string)
        : 'unknown';

    const sourceBucket = bySource.get(source) ?? { delivered: 0, opened: 0 };

    if (type === 'notifications.election.delivered') {
      totals.delivered += 1;
      bucket.delivered += 1;
      sourceBucket.delivered += 1;
    } else if (type === 'notifications.election.opened') {
      totals.opened += 1;
      bucket.opened += 1;
      sourceBucket.opened += 1;
    }

    byDay.set(normaliseDateKey(event.created_at ?? new Date().toISOString()), bucket);
    bySource.set(source, sourceBucket);
  });

  const conversionRate =
    totals.delivered === 0 ? 0 : Number(((totals.opened / totals.delivered) * 100).toFixed(2));

  const response: AggregatedMetrics = {
    windowDays,
    totals,
    conversionRate,
    byDay: Array.from(byDay.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, stats]) => ({
        date,
        delivered: stats.delivered,
        opened: stats.opened
      })),
    bySource: Array.from(bySource.entries())
      .sort(([, a], [, b]) => b.delivered + b.opened - (a.delivered + a.opened))
      .map(([source, stats]) => ({
        source,
        delivered: stats.delivered,
        opened: stats.opened
      })),
    lastUpdated: new Date().toISOString()
  };

  return successResponse(response);
});

