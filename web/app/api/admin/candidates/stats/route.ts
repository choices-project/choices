'use server'

/**
 * Admin: Candidate Onboarding Stats
 * GET /api/admin/candidates/stats
 * Headers: x-admin-key: ADMIN_MONITORING_KEY
 */

import type { NextRequest } from 'next/server';
import { withErrorHandling, successResponse, forbiddenError, errorResponse, methodNotAllowed } from '@/lib/api';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const adminHeader = request.headers.get('x-admin-key') ?? request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const adminKey = process.env.ADMIN_MONITORING_KEY ?? '';
  if (!adminKey || adminHeader !== adminKey) {
    return forbiddenError('Invalid admin key');
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  const [{ count: total }, { count: publicCount }, { data: statusRows }, { count: fastTrackLinked }] = await Promise.all([
    (supabase as any).from('candidate_profiles').select('*', { count: 'exact', head: true }),
    (supabase as any).from('candidate_profiles').select('*', { count: 'exact', head: true }).eq('is_public', true),
    (supabase as any)
      .from('candidate_profiles')
      .select('filing_status, count:count(*)')
      .group('filing_status'),
    (supabase as any)
      .from('candidate_profiles')
      .select('*', { count: 'exact', head: true })
      .not('representative_id', 'is', null),
  ]);

  const statusBreakdown = Array.isArray(statusRows)
    ? statusRows.reduce<Record<string, number>>((acc, r: any) => {
        const k = String(r.filing_status ?? 'unknown');
        acc[k] = (acc[k] ?? 0) + Number(r.count ?? 0);
        return acc;
      }, {})
    : {};

  return successResponse({
    timestamp: new Date().toISOString(),
    candidates: {
      total: total ?? 0,
      public: publicCount ?? 0,
      fastTrackLinked: fastTrackLinked ?? 0,
      status: statusBreakdown,
    },
  });
});

export const POST = withErrorHandling(async () => methodNotAllowed(['GET']));

