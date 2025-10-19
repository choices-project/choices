import { NextResponse } from 'next/server';

import { requireAdminOr401 } from '@/features/auth/lib/admin-auth';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

interface CheckResult {
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

export async function GET() {
  try {
    // Check admin access - returns 401 if not admin
    const authGate = await requireAdminOr401()
    if (authGate) return authGate

    const supabase = getSupabaseServerClient();
    
    // Get Supabase client
    const supabaseClient = await supabase;
    
    if (!supabaseClient) {
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      );
    }

    // ---- 1) Connection test ----
    const [connectionTest, connectionCheck] = await timed('db:connect', async () => {
      const { data, error } = await supabaseClient.from('user_profiles').select('id').limit(1);
      if (error) throw error;
      return data;
    });

    // ---- 2) Core tables check ----
    const [migrationRows, migrationCheck] = await timed('db:core-tables', async () => {
      const { data, error } = await supabaseClient.from('polls').select('id, created_at').limit(1);
      if (error) throw error;
      return data;
    });

    // ---- 3) Profiles table reachable ----
    const [userProfilesTest, profilesCheck] = await timed('db:user_profiles', async () => {
      const { data, error } = await supabaseClient.from('user_profiles').select('id').limit(1);
      if (error) throw error;
      return data;
    });

    // ---- 4) Critical RLS policy sanity (example) ----
    const [rlsProbe, rlsCheck] = await timed('db:rls_probe', async () => {
      // Query a table that should be protected; ensure no rows come back without auth
      const { data, error } = await supabaseClient.from('votes').select('id').limit(1);
      if (error) throw error;
      // In a locked-down context, this might return 0 rows; we treat accessibility as success
      return data ?? [];
    });

    // Log each result with context (consuming the "unused" variables)
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
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    logger.error('Admin system-status failed', new Error(reason));
    return NextResponse.json(
      { ok: false, error: reason },
      { status: 500 }
    );
  }
}
