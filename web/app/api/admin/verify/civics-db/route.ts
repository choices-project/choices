/**
 * Admin: Verify Civics Database Connectivity and Shape
 *
 * GET /api/admin/verify/civics-db
 * Headers:
 *   - x-admin-key: must equal ADMIN_MONITORING_KEY
 *
 * Returns quick stats from civics tables (civic_elections, representatives_core)
 * to validate database wiring and recently regenerated types.
 */

import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, errorResponse, forbiddenError, methodNotAllowed } from '@/lib/api';
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

  // civic_elections quick sample
  const electionsQuery = (supabase as any)
    .from('civic_elections')
    .select('election_id, name, ocd_division_id, election_day')
    .gte('election_day', new Date().toISOString().slice(0, 10))
    .order('election_day', { ascending: true })
    .limit(5);
  const { data: elections, error: electionsError } = await electionsQuery;

  // representatives_core smoke
  const repsQuery = (supabase as any)
    .from('representatives_core')
    .select('id, name, office, party')
    .limit(5);
  const { data: reps, error: repsError } = await repsQuery;

  const details: Record<string, unknown> = {
    civic_elections: {
      sample: elections ?? [],
      error: electionsError ? electionsError.message : null
    },
    representatives_core: {
      sample: reps ?? [],
      error: repsError ? repsError.message : null
    }
  };

  const status = electionsError || repsError ? 'warning' : 'ok';

  return successResponse(
    {
      status,
      timestamp: new Date().toISOString(),
      details
    },
    { integration: 'supabase' }
  );
});

export const POST = withErrorHandling(async () => methodNotAllowed(['GET']));
export const PUT = withErrorHandling(async () => methodNotAllowed(['GET']));
export const DELETE = withErrorHandling(async () => methodNotAllowed(['GET']));


