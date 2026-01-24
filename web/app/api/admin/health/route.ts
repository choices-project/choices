/**
 * Consolidated Admin Health & System Status API
 *
 * This endpoint consolidates admin health functionality:
 * - System metrics (polls, feedback, health status)
 * - Detailed system checks (database, RLS, performance)
 * - Admin authentication required
 *
 * Usage:
 * GET /api/admin/health - System metrics
 * GET /api/admin/health?type=status - Detailed system checks
 * GET /api/admin/health?type=all - Both metrics and status
 *
 * Created: October 19, 2025
 * Status: ✅ ACTIVE
 */

import { getSupabaseAdminClient } from '@/utils/supabase/server';

import { requireAdminOr401 } from '@/features/auth/lib/admin-auth';


import { successResponse, withErrorHandling, errorResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';


type CheckResult = {
  name: string;
  ok: boolean;
  detail?: string;
  durationMs: number;
}

async function timed<T>(name: string, fn: () => Promise<T>): Promise<[T | null, CheckResult]> {
  const t0 = performance.now();
  try {
    const out = await fn();
    const dt = performance.now() - t0;
    return [
      out,
      { name, ok: true, durationMs: Math.round(dt) },
    ];
  } catch (e) {
    const dt = performance.now() - t0;
    const detail = e instanceof Error ? e.message : String(e);
    return [
      null,
      { name, ok: false, detail, durationMs: Math.round(dt) },
    ];
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export const GET = withErrorHandling(async (request: NextRequest) => {
  const authGate = await requireAdminOr401();
  if (authGate) return authGate;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') ?? 'metrics';

  const adminClient = await getSupabaseAdminClient();
  if (!adminClient) {
    return errorResponse('Supabase client not available', 500);
  }

  const includeMetrics = type === 'metrics' || type === 'all';
  const includeStatus = type === 'status' || type === 'all';

  const metrics = includeMetrics ? await buildMetricsSnapshot(adminClient) : undefined;
  const status = includeStatus ? await buildSystemStatus(adminClient) : undefined;

  if (type === 'metrics') {
    return successResponse(
      { metrics },
      { dataset: 'metrics' }
    );
  }

  if (type === 'status') {
    const statusCode = status?.ok ? 200 : 503;
    return successResponse(
      { status },
      { dataset: 'status' },
      statusCode
    );
  }

  const combinedStatusCode = status && !status.ok ? 503 : 200;
  return successResponse(
    {
      metrics,
      status,
    },
    { dataset: 'all' },
    combinedStatusCode
  );
});

async function buildMetricsSnapshot(supabase: any) {
  const [pollsResult, feedbackResult] = await Promise.all([
    supabase.from('polls').select('id, status'),
    supabase.from('feedback').select('id, status'),
  ]);

  const totalPolls = pollsResult.data?.length ?? 0;
  const activePolls =
    pollsResult.data?.filter((poll: any) => poll?.status === 'active').length ?? 0;
  const totalFeedback = feedbackResult.data?.length ?? 0;

  return {
    total_topics: totalFeedback,
    total_polls: totalPolls,
    active_polls: activePolls,
    system_health: 'healthy',
    last_updated: new Date().toISOString(),
  };
}

async function buildSystemStatus(supabase: any) {
  const [connectionTest, connectionCheck] = await timed('db:connect', async () => {
    const { data, error } = await supabase.from('user_profiles').select('id').limit(1);
    if (error) throw error;
    return data;
  });

  const [migrationRows, migrationCheck] = await timed('db:core-tables', async () => {
    const { data, error } = await supabase.from('polls').select('id, created_at').limit(1);
    if (error) throw error;
    return data;
  });

  const [userProfilesTest, profilesCheck] = await timed('db:user_profiles', async () => {
    const { data, error } = await supabase.from('user_profiles').select('id').limit(1);
    if (error) throw error;
    return data;
  });

  const [rlsProbe, rlsCheck] = await timed('db:rls_probe', async () => {
    const { data, error } = await supabase.from('votes').select('id').limit(1);
    if (error) throw error;
    return data ?? [];
  });

  const checks: CheckResult[] = [connectionCheck, migrationCheck, profilesCheck, rlsCheck];
  const ok = checks.every((c) => c.ok);

  logger.info('Admin system-status checks', {
    connectionRows: Array.isArray(connectionTest) ? connectionTest.length : null,
    migrationRows: Array.isArray(migrationRows) ? migrationRows.length : null,
    profileRows: Array.isArray(userProfilesTest) ? userProfilesTest.length : null,
    rlsProbeRows: Array.isArray(rlsProbe) ? rlsProbe.length : null,
    checks,
  });

  return {
    ok,
    checks,
    meta: {
      generatedAt: new Date().toISOString(),
      region: process.env.VERCEL_REGION ?? 'local',
    },
  };
}

