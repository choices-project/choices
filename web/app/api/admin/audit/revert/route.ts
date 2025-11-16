// Server route handler

import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, forbiddenError, validationError, errorResponse, methodNotAllowed } from '@/lib/api';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const adminHeader = request.headers.get('x-admin-key') ?? request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const adminKey = process.env.ADMIN_MONITORING_KEY ?? '';
  if (!adminKey || adminHeader !== adminKey) {
    return forbiddenError('Invalid admin key');
  }
  const supabase = await getSupabaseServerClient();
  if (!supabase) return errorResponse('DB not available', 500);

  const body = await request.json().catch(() => ({}));
  const type = String(body.type ?? '');
  const id = String(body.id ?? '');
  if (!['candidate', 'representative'].includes(type) || !id) {
    return validationError({ _: 'type and id required' });
  }

  if (type === 'candidate') {
    const { data: row } = await (supabase as any)
      .from('candidate_profile_audit')
      .select('candidate_id, field, old_value')
      .eq('id', id)
      .maybeSingle();
    if (!row) return validationError({ _: 'Audit row not found' });
    const patch = { [row.field]: row.old_value };
    const { error } = await (supabase as any)
      .from('candidate_profiles')
      .update(patch)
      .eq('id', row.candidate_id);
    if (error) return errorResponse('Failed to revert', 500);
    return successResponse({ ok: true });
  } else {
    const { data: row } = await (supabase as any)
      .from('representative_overrides_audit')
      .select('representative_id, field, old_value')
      .eq('id', id)
      .maybeSingle();
    if (!row) return validationError({ _: 'Audit row not found' });
    const patch = { [row.field]: row.old_value };
    const { error } = await (supabase as any)
      .from('representative_overrides')
      .update(patch)
      .eq('representative_id', row.representative_id);
    if (error) return errorResponse('Failed to revert', 500);
    return successResponse({ ok: true });
  }
});

export const GET = withErrorHandling(async () => methodNotAllowed(['POST']));

