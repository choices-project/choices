import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, errorResponse, validationError } from '@/lib/api';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return errorResponse('Auth/DB not available', 500);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) return errorResponse('Authentication required', 401);

  const body = await request.json().catch(() => ({}));
  const code = String(body?.code ?? '').trim();
  if (!code) return validationError({ code: 'Code is required' });

  const { data: challenge } = await (supabase as any)
    .from('candidate_email_challenges')
    .select('id, candidate_id, user_id, email, code, expires_at, used_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!challenge) return validationError({ code: 'Invalid or expired code' });
  if (challenge.used_at) return validationError({ code: 'Code already used' });
  if (new Date(challenge.expires_at).getTime() < Date.now()) {
    return validationError({ code: 'Code expired' });
  }
  if (challenge.code !== code) return validationError({ code: 'Invalid code' });

  // Attempt to link representative via email heuristics (exact/domain/fast_track)
  const userDomain = user.email.split('@')[1]?.toLowerCase() ?? '';
  let representativeId: number | null = null;
  const { data: repExact } = await supabase
    .from('representatives_core')
    .select('id, primary_email')
    .eq('primary_email', user.email)
    .maybeSingle();
  if (repExact?.id) {
    representativeId = repExact.id;
  } else {
    const { data: repDomain } = await supabase
      .from('representatives_core')
      .select('id, primary_email')
      .ilike('primary_email', `%@${userDomain}`)
      .limit(10);
    if (Array.isArray(repDomain) && repDomain.length === 1) {
      const only = repDomain[0];
      if (only?.id) {
        representativeId = only.id;
      }
    } else {
      const { data: fastTrack } = await supabase
        .from('official_email_fast_track')
        .select('representative_id')
        .or(`domain.eq.${userDomain},email.eq.${user.email}`)
        .limit(1)
        .maybeSingle();
      if (fastTrack?.representative_id) {
        representativeId = fastTrack.representative_id;
      }
    }
  }

  // Mark challenge used
  await supabase
    .from('candidate_email_challenges')
    .update({ used_at: new Date().toISOString() })
    .eq('id', challenge.id);

  // If linked, update candidate profile and publish
  if (representativeId) {
    await supabase
      .from('candidate_profiles')
      .update({ representative_id: representativeId, filing_status: 'verified', is_public: true })
      .eq('id', challenge.candidate_id);
  }

  return successResponse({ ok: true, representativeId: representativeId ?? null });
});

