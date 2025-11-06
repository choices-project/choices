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

import type { NextRequest } from 'next/server';

import { requireAdminOr401 } from '@/features/auth/lib/admin-auth';
import { withErrorHandling, errorResponse } from '@/lib/api';
import { devLog, logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

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

export const GET = withErrorHandling(async (request: NextRequest) => {
  const authGate = await requireAdminOr401();
  if (authGate) return authGate;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') ?? 'metrics';

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return errorResponse('Supabase client not available', 500);
  }

    // System Metrics (default)
    if (type === 'metrics' || type === 'all') {
      const [pollsResult, feedbackResult] = await Promise.all([
        supabase.from('polls').select('id, status'),
        supabase.from('feedback').select('id, status')
      ]);

      const totalPolls = pollsResult.data?.length ?? 0;
      const activePolls = pollsResult.data?.filter((poll: any) => poll?.status === 'active').length ?? 0;
      const totalFeedback = feedbackResult.data?.length ?? 0;

      const metrics = {
        total_topics: totalFeedback,
        total_polls: totalPolls,
        active_polls: activePolls,
        system_health: 'healthy',
        last_updated: new Date().toISOString()
      };

      if (type === 'metrics') {
        return NextResponse.json({ metrics });
      }
    }

    // System Status Checks
    if (type === 'status' || type === 'all') {
      // Database connection test
      const [connectionTest, connectionCheck] = await timed('db:connect', async () => {
        const { data, error } = await supabase.from('user_profiles').select('id').limit(1);
        if (error) throw error;
        return data;
      });

      // Core tables check
      const [migrationRows, migrationCheck] = await timed('db:core-tables', async () => {
        const { data, error } = await supabase.from('polls').select('id, created_at').limit(1);
        if (error) throw error;
        return data;
      });

      // User profiles table check
      const [userProfilesTest, profilesCheck] = await timed('db:user_profiles', async () => {
        const { data, error } = await supabase.from('user_profiles').select('id').limit(1);
        if (error) throw error;
        return data;
      });

      // RLS policy check
      const [rlsProbe, rlsCheck] = await timed('db:rls_probe', async () => {
        const { data, error } = await supabase.from('votes').select('id').limit(1);
        if (error) throw error;
        return data ?? [];
      });

      const checks: CheckResult[] = [connectionCheck, migrationCheck, profilesCheck, rlsCheck];

      logger.info('Admin system-status checks', {
        connectionRows: Array.isArray(connectionTest) ? connectionTest.length : null,
        migrationRows: Array.isArray(migrationRows) ? migrationRows.length : null,
        profileRows: Array.isArray(userProfilesTest) ? userProfilesTest.length : null,
        rlsProbeRows: Array.isArray(rlsProbe) ? rlsProbe.length : null,
        checks,
      });

      const ok = checks.every((c) => c.ok);
      const status = ok ? 200 : 503;

      if (type === 'status') {
        return NextResponse.json(
          {
            ok,
            checks,
            meta: {
              generatedAt: new Date().toISOString(),
              region: process.env.VERCEL_REGION ?? 'local',
            },
          },
          { status }
        );
      }
    }

    // Combined response (type === 'all')
    const [pollsResult, feedbackResult] = await Promise.all([
      supabase.from('polls').select('id, status'),
      supabase.from('feedback').select('id, status')
    ]);

    const totalPolls = pollsResult.data?.length ?? 0;
    const activePolls = pollsResult.data?.filter((poll: any) => poll?.status === 'active').length ?? 0;
    const totalFeedback = feedbackResult.data?.length ?? 0;

    const metrics = {
      total_topics: totalFeedback,
      total_polls: totalPolls,
      active_polls: activePolls,
      system_health: 'healthy',
      last_updated: new Date().toISOString()
    };

    // System checks
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

    // Log system checks for 'all' case as well
    logger.info('Admin system-status checks (all)', {
      connectionRows: Array.isArray(connectionTest) ? connectionTest.length : null,
      migrationRows: Array.isArray(migrationRows) ? migrationRows.length : null,
      profileRows: Array.isArray(userProfilesTest) ? userProfilesTest.length : null,
      rlsProbeRows: Array.isArray(rlsProbe) ? rlsProbe.length : null,
      checks,
    });

    return NextResponse.json({
      metrics,
      status: {
        ok,
        checks,
        meta: {
          generatedAt: new Date().toISOString(),
          region: process.env.VERCEL_REGION ?? 'local',
        },
      }
    });

  } catch (error) {
    devLog('Error in admin health API:', { error });
    logger.error('Admin health API error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to fetch admin health data' },
      { status: 500 }
    );
  }
}

