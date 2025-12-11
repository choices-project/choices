// Server route handler

/**
 * Admin: Civics Stats Summary
 * GET /api/admin/civics/stats
 * Headers: x-admin-key: ADMIN_MONITORING_KEY
 */

import { getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, forbiddenError, errorResponse, methodNotAllowed } from '@/lib/api';
import { formatISODateOnly, nowISO } from '@/lib/utils/format-utils';

import type { NextRequest } from 'next/server';



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

  const today = formatISODateOnly(nowISO());

  const [{ data: elections, error: electionsErr }, { error: repsErr }] = await Promise.all([
    (supabase as any)
      .from('civic_elections')
      .select('election_id, election_day')
      .gte('election_day', today)
      .order('election_day', { ascending: true }),
    (supabase as any)
      .from('representatives_core')
      .select('id, name, office')
      .limit(1) // count below
  ]);

  const { count: repsCount } = await (supabase as any)
    .from('representatives_core')
    .select('*', { count: 'exact', head: true });

  const electionCount = Array.isArray(elections) ? elections.length : 0;
  const latestElection = Array.isArray(elections) && elections.length > 0 ? elections[elections.length - 1].election_day : null;
  const nextElection = Array.isArray(elections) && elections.length > 0 ? elections[0].election_day : null;

  // Stale alert if no upcoming elections within 30 days
  let staleAlert = false;
  if (nextElection) {
    const diffDays = Math.ceil((new Date(nextElection).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
    staleAlert = diffDays > 365 || diffDays < 0;
  } else {
    staleAlert = true;
  }

  return successResponse({
    timestamp: nowISO(),
    elections: {
      count: electionCount,
      nextElectionDay: nextElection,
      latestElectionDay: latestElection,
      staleAlert,
      error: electionsErr ? electionsErr.message : null
    },
    representatives: {
      count: repsCount ?? 0,
      error: repsErr ? repsErr.message : null
    }
  });
});

export const POST = withErrorHandling(async () => methodNotAllowed(['GET']));

