// Server route handler

import { getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, forbiddenError, methodNotAllowed } from '@/lib/api';

import type { NextRequest } from 'next/server';


export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const adminHeader = request.headers.get('x-admin-key') ?? request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const adminKey = process.env.ADMIN_MONITORING_KEY ?? '';
  if (!adminKey || adminHeader !== adminKey) {
    return forbiddenError('Invalid admin key');
  }

  const supabase = await getSupabaseServerClient();
  const searchParams = request.nextUrl.searchParams;
  const limit = Number(searchParams.get('limit') ?? 50);
  const offset = Number(searchParams.get('offset') ?? 0);

  const { data } = await (supabase as any)
    .from('candidate_profile_audit')
    .select('id, candidate_id, user_id, field, old_value, new_value, created_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return successResponse({
    items: Array.isArray(data) ? data : [],
    limit,
    offset,
  });
});

export const POST = withErrorHandling(async () => methodNotAllowed(['GET']));

