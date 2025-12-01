/**
 * Analytics KPI API
 *
 * Returns single-metric KPI payloads for admin dashboards.
 * Supports multiple metrics (DAU, poll creation velocity, civic engagement)
 * and leverages Redis caching for fast responses.
 */

import type { NextRequest } from 'next/server';

import {
  authError,
  forbiddenError,
  successResponse,
  validationError,
  withErrorHandling,
} from '@/lib/api';
import { canAccessAnalytics, logAnalyticsAccess } from '@/lib/auth/adminGuard';
import {
  CACHE_PREFIX,
  CACHE_TTL,
  generateCacheKey,
  getCached,
} from '@/lib/cache/analytics-cache';
import { logger } from '@/lib/utils/logger';
import type { Database } from '@/types/database';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

type MetricId = 'dau' | 'polls_created' | 'civic_engagement';

type KpiPayload = {
  metric: MetricId;
  label: string;
  value: number;
  unit?: string;
  changePercent: number;
  trendWindow: string;
  description?: string;
  generatedAt: string;
};

type SupabaseServerClient = Awaited<ReturnType<typeof getSupabaseServerClient>>;
type MetricBuilder = (client: SupabaseServerClient) => Promise<{
  current: number;
  previous: number;
  label: string;
  unit?: string;
  trendWindow: string;
  description?: string;
}>;

type PublicTable = keyof Database['public']['Tables'];
type QueryAugmenter = (query: any) => any;

const KPI_BUILDERS: Record<MetricId, MetricBuilder> = {
  dau: buildDailyActiveUsersMetric,
  polls_created: buildPollCreationMetric,
  civic_engagement: buildCivicEngagementMetric,
};

export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return authError('Authentication required for KPI analytics');
  }

  const allowAccess = canAccessAnalytics(user, true);
  logAnalyticsAccess(user, '/api/analytics/kpi', allowAccess);

  if (!allowAccess) {
    return forbiddenError('Admin access required for KPIs');
  }

  const url = new URL(request.url);
  const metric = (url.searchParams.get('metric') ?? 'dau') as MetricId;
  const builder = KPI_BUILDERS[metric];

  if (!builder) {
    return validationError({ metric: 'Unsupported metric. Use dau, polls_created, or civic_engagement.' });
  }

  const cacheKey = generateCacheKey(CACHE_PREFIX.KPI, { metric });

  const { data } = await getCached(
    cacheKey,
    CACHE_TTL.KPI,
    async (): Promise<KpiPayload> => {
      const result = await builder(supabase);
      const changePercent = computeChangePercent(result.current, result.previous);

      const payload: KpiPayload = {
        metric,
        label: result.label,
        value: Number(result.current.toFixed(0)),
        changePercent,
        trendWindow: result.trendWindow,
        generatedAt: new Date().toISOString(),
      };

      if (typeof result.unit === 'string') {
        payload.unit = result.unit;
      }
      if (typeof result.description === 'string') {
        payload.description = result.description;
      }

      return payload;
    }
  );

  return successResponse({
    kpi: data,
    cache: {
      key: cacheKey,
      ttl: CACHE_TTL.KPI,
    },
  });
});

// ---------------------------------------------------------------------------
// Metric builders
// ---------------------------------------------------------------------------

async function buildDailyActiveUsersMetric(client: SupabaseServerClient) {
  const now = Date.now();
  const currentWindowStart = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const previousWindowStart = new Date(now - 48 * 60 * 60 * 1000).toISOString();

  const current = await countDistinctUsers(client, currentWindowStart, undefined);
  const previous = await countDistinctUsers(client, previousWindowStart, currentWindowStart);

  return {
    current,
    previous,
    label: 'Daily Active Users',
    trendWindow: '24h',
    description: 'Unique voters in the last 24 hours',
  };
}

async function buildPollCreationMetric(client: SupabaseServerClient) {
  const now = Date.now();
  const currentStart = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const previousStart = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();

  const current = await countRows(client, 'polls', currentStart);
  const previous = await countRows(client, 'polls', previousStart, currentStart);

  return {
    current,
    previous,
    label: 'Polls Created (7d)',
    trendWindow: '7d',
    description: 'New polls created in the last 7 days',
  };
}

async function buildCivicEngagementMetric(client: SupabaseServerClient) {
  const current = await countRows(client, 'civic_actions', undefined, undefined, (query) =>
    query.eq('status', 'published').eq('is_public', true)
  );
  const previous = await countRows(client, 'civic_actions', undefined, undefined, (query) =>
    query.eq('status', 'completed')
  );

  return {
    current,
    previous: previous || current,
    label: 'Active Civic Actions',
    trendWindow: 'current',
    description: 'Public civic actions currently collecting signatures',
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function countDistinctUsers(
  client: SupabaseServerClient,
  start: string,
  end?: string
) {
  let query = client
    .from('votes')
    .select('user_id', { count: 'exact', head: true })
    .gte('created_at', start)
    .not('user_id', 'is', null);

  if (end) {
    query = query.lt('created_at', end);
  }

  const { count, error } = await query;
  if (error) {
    logger.error('Failed to count distinct voters', error);
    return 0;
  }

  return count ?? 0;
}

async function countRows(
  client: SupabaseServerClient,
  table: PublicTable,
  start?: string,
  end?: string,
  augment?: QueryAugmenter
) {
  let query = client
    .from(table)
    .select('id', { count: 'exact', head: true });

  if (start) {
    query = query.gte('created_at', start);
  }
  if (end) {
    query = query.lt('created_at', end);
  }
  if (augment) {
    query = augment(query);
  }

  const { count, error } = await query;
  if (error) {
    logger.error(`Failed to count rows for ${table}`, error);
    return 0;
  }

  return count ?? 0;
}

function computeChangePercent(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  const delta = ((current - previous) / previous) * 100;
  return Number(delta.toFixed(1));
}

