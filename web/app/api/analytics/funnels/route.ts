/**
 * Analytics Funnels API
 *
 * Provides aggregated funnel analytics for onboarding, poll creation,
 * and civic-action journeys. Results are cached via the analytics
 * cache layer and restricted to admins (or future T3 users).
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
import type { CivicAction, Database, Poll } from '@/types/database';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

type FunnelId = 'onboarding' | 'poll-creation' | 'civic-action';

type FunnelStep = {
  id: string;
  label: string;
  count: number;
  description?: string;
};

type NormalizedFunnelStep = FunnelStep & {
  conversionRate: number;
  dropOffRate: number;
};

type FunnelResponse = {
  id: FunnelId;
  label: string;
  totalEntries: number;
  completionRate: number;
  steps: NormalizedFunnelStep[];
  insights: string[];
  generatedAt: string;
};

type SupabaseServerClient = Awaited<ReturnType<typeof getSupabaseServerClient>>;

type FunnelBuilder = (client: SupabaseServerClient) => Promise<FunnelResponse>;

const FUNNEL_BUILDERS: Record<FunnelId, FunnelBuilder> = {
  'onboarding': buildOnboardingFunnel,
  'poll-creation': buildPollCreationFunnel,
  'civic-action': buildCivicActionFunnel,
};

type OnboardingProgressRow = {
  completed_steps: string[] | null;
  completed_at: string | null;
};

type PollFunnelRow = Pick<Poll, 'status' | 'total_votes'> & {
  is_active?: boolean | null;
};

type CivicActionFunnelRow = Pick<CivicAction, 'status'> & {
  is_public?: boolean | null;
  current_signatures?: number | null;
  required_signatures?: number | null;
};

type ExtendedTableName = keyof Database['public']['Tables'] | 'onboarding_progress';

const fromAnalyticsTable = (
  client: SupabaseServerClient,
  table: ExtendedTableName
) =>
  (client.from as unknown as (relation: ExtendedTableName) => ReturnType<typeof client.from>)(table);

export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: authFetchError,
  } = await supabase.auth.getUser();

  if (authFetchError || !user) {
    return authError('Authentication required for analytics funnels');
  }

  const allowAccess = canAccessAnalytics(user, true);
  logAnalyticsAccess(user, '/api/analytics/funnels', allowAccess);

  if (!allowAccess) {
    return forbiddenError('Admin access required for funnels');
  }

  const url = new URL(request.url);
  const funnelParam = (url.searchParams.get('funnel') ?? 'onboarding') as FunnelId;
  const builder = FUNNEL_BUILDERS[funnelParam];

  if (!builder) {
    return validationError({ funnel: 'Unsupported funnel. Use onboarding, poll-creation, or civic-action.' });
  }

  const cacheKey = generateCacheKey(CACHE_PREFIX.FUNNELS, { funnel: funnelParam });
  const { data } = await getCached(
    cacheKey,
    CACHE_TTL.FUNNELS,
    async () => builder(supabase)
  );

  return successResponse({
    funnel: data,
    cache: {
      key: cacheKey,
      ttl: CACHE_TTL.FUNNELS,
    },
  });
});

// ---------------------------------------------------------------------------
// Funnel builders
// ---------------------------------------------------------------------------

async function buildOnboardingFunnel(client: SupabaseServerClient): Promise<FunnelResponse> {
  const { data, error } = await fromAnalyticsTable(client, 'onboarding_progress')
    .select('completed_steps, completed_at')
    .limit(10_000);

  if (error) {
    logger.error('Failed to load onboarding progress for funnels', error);
    throw new Error('Unable to compute onboarding funnel');
  }

  const rows = Array.isArray(data) ? (data as unknown as OnboardingProgressRow[]) : [];
  const total = rows.length;

  const includesStep = (rowSteps: unknown, step: string) => {
    if (!rowSteps || !Array.isArray(rowSteps)) {
      return false;
    }
    return rowSteps.includes(step);
  };

  const steps: FunnelStep[] = [
    {
      id: 'started',
      label: 'Started Onboarding',
      count: total,
      description: 'Users who entered the onboarding flow',
    },
    {
      id: 'profile',
      label: 'Profile Details',
      count: rows.filter((row) => includesStep(row.completed_steps, 'profile')).length,
      description: 'Completed profile + identity step',
    },
    {
      id: 'preferences',
      label: 'Preferences Saved',
      count: rows.filter((row) => includesStep(row.completed_steps, 'preferences')).length,
      description: 'Configured notification + privacy preferences',
    },
    {
      id: 'verification',
      label: 'Verification',
      count: rows.filter((row) => includesStep(row.completed_steps, 'verification')).length,
      description: 'Finished verification / trust tier step',
    },
    {
      id: 'completed',
      label: 'Onboarding Complete',
      count: rows.filter((row) => Boolean(row.completed_at)).length,
      description: 'Reached final onboarding step',
    },
  ];

  return normalizeFunnel('onboarding', 'Onboarding Completion', total, steps);
}

async function buildPollCreationFunnel(client: SupabaseServerClient): Promise<FunnelResponse> {
  const { data, error } = await client
    .from('polls')
    .select('status,total_votes')
    .limit(10_000);

  if (error) {
    logger.error('Failed to load poll data for funnel', error);
    throw new Error('Unable to compute poll funnel');
  }

  const rows = Array.isArray(data) ? (data as PollFunnelRow[]) : [];
  const total = rows.length;

  const countWithStatus = (targets: string[]) =>
    rows.filter((row) => targets.includes((row.status ?? '').toLowerCase())).length;

  const steps: FunnelStep[] = [
    {
      id: 'draft',
      label: 'Draft Created',
      count: total,
      description: 'Polls that were created or drafted',
    },
    {
      id: 'launched',
      label: 'Published',
      count: countWithStatus(['active', 'published', 'live']),
      description: 'Polls moved to active/published state',
    },
    {
      id: 'collecting',
      label: 'Collecting Votes',
      count: rows.filter((row) => {
        const status = (row.status ?? '').toLowerCase();
        const hasVotes = (row.total_votes ?? 0) > 0;
        const isActiveStatus = ['active', 'published', 'live'].includes(status);
        return hasVotes || isActiveStatus;
      }).length,
      description: 'Polls with at least one vote or actively collecting',
    },
    {
      id: 'closed',
      label: 'Closed',
      count: countWithStatus(['closed', 'completed', 'archived']),
      description: 'Polls that reached completion/closed state',
    },
  ];

  return normalizeFunnel('poll-creation', 'Poll Creation', total, steps);
}

async function buildCivicActionFunnel(client: SupabaseServerClient): Promise<FunnelResponse> {
  const { data, error } = await client
    .from('civic_actions')
    .select('status,is_public,current_signatures,required_signatures')
    .limit(10_000);

  if (error) {
    logger.error('Failed to load civic actions for funnel', error);
    throw new Error('Unable to compute civic action funnel');
  }

  const rows = Array.isArray(data) ? (data as unknown as CivicActionFunnelRow[]) : [];
  const total = rows.length;

  const countWithStatus = (targets: string[]) =>
    rows.filter((row) => targets.includes((row.status ?? '').toLowerCase())).length;

  const steps: FunnelStep[] = [
    {
      id: 'submitted',
      label: 'Submitted',
      count: total,
      description: 'Civic actions drafted or submitted',
    },
    {
      id: 'review',
      label: 'In Review',
      count: countWithStatus(['review', 'pending', 'moderation']),
      description: 'Awaiting moderation / approvals',
    },
    {
      id: 'launched',
      label: 'Launched',
      count: rows.filter((row) => {
        const status = (row.status ?? '').toLowerCase();
        const isPublic = Boolean(row.is_public);
        return status === 'published' && isPublic;
      }).length,
      description: 'Public civic actions accepting signatures',
    },
    {
      id: 'completed',
      label: 'Completed',
      count: rows.filter((row) => {
        const status = (row.status ?? '').toLowerCase();
        if (status === 'completed' || status === 'archived') {
          return true;
        }
        const goal = Number(row.required_signatures ?? 0);
        const signatures = Number(row.current_signatures ?? 0);
        return goal > 0 && signatures >= goal;
      }).length,
      description: 'Achieved goal or archived after completion',
    },
  ];

  return normalizeFunnel('civic-action', 'Civic Action', total, steps);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeFunnel(
  id: FunnelId,
  label: string,
  totalEntries: number,
  rawSteps: FunnelStep[]
): FunnelResponse {
  let previousCount = totalEntries;

  const steps = rawSteps.map((step, index) => {
    const cappedCount = Math.max(0, Math.min(previousCount, step.count));
    const base = index === 0 ? totalEntries || 1 : previousCount || 1;
    const conversionRate = totalEntries > 0 ? (cappedCount / totalEntries) * 100 : 0;
    const dropOffRate = index === 0 ? 0 : Math.max(0, ((previousCount - cappedCount) / base) * 100);
    previousCount = cappedCount;

    return {
      ...step,
      count: cappedCount,
      conversionRate: Number(conversionRate.toFixed(1)),
      dropOffRate: Number(dropOffRate.toFixed(1)),
    };
  });

  const completionRate = steps.length
    ? steps[steps.length - 1].conversionRate
    : 0;

  const insights = buildFunnelInsights(steps);

  return {
    id,
    label,
    totalEntries,
    completionRate: Number(completionRate.toFixed(1)),
    steps,
    insights,
    generatedAt: new Date().toISOString(),
  };
}

function buildFunnelInsights(steps: NormalizedFunnelStep[]): string[] {
  if (!steps.length) return ['No funnel data available'];

  const insights: string[] = [];
  const completion = steps[steps.length - 1];

  insights.push(`Completion rate: ${completion.conversionRate.toFixed(1)}%`);

  const largestDrop = steps
    .slice(1)
    .reduce(
      (acc, step) =>
        step.dropOffRate > acc.dropOffRate ? step : acc,
      steps[1] ?? steps[0]
    );

  if (largestDrop && largestDrop.dropOffRate > 0) {
    insights.push(`Largest drop-off at "${largestDrop.label}" (${largestDrop.dropOffRate.toFixed(1)}% fall-off)`);
  }

  return insights;
}

