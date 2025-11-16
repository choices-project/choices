'use server'

import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, errorResponse, validationError, methodNotAllowed } from '@/lib/api';
import { stripUndefinedDeep } from '@/lib/util/clean';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

function extractDomain(email: string): string | null {
  const parts = String(email).toLowerCase().trim().split('@');
  if (parts.length !== 2) return null;
  const domain = parts[1] ?? null;
  return domain && domain.length > 0 ? domain : null;
}

export const POST = withErrorHandling(async (_request: NextRequest) => {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return errorResponse('Auth/DB not available', 500);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) return errorResponse('Authentication required', 401);

  // Find candidate profile for this user
  const { data: candidate, error: candErr } = await supabase
    .from('candidate_profiles')
    .select('id, slug, representative_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (candErr || !candidate) {
    return validationError({ candidate: 'Candidate onboarding not started' });
  }

  const userDomain = extractDomain(user.email);
  if (!userDomain) {
    return validationError({ email: 'Invalid email' });
  }

  // Try exact match to representatives_core.primary_email
  const { data: repExact } = await supabase
    .from('representatives_core')
    .select('id, primary_email')
    .eq('primary_email', user.email)
    .maybeSingle();

  // Try domain match via representatives_core.primary_email
  const { data: repDomain } = await supabase
    .from('representatives_core')
    .select('id, primary_email')
    .ilike('primary_email', `%@${userDomain}`)
    .limit(10);

  // Try cached domain matches in official_email_fast_track
  const { data: fastTrackDomain } = await supabase
    .from('official_email_fast_track')
    .select('representative_id, domain, email, verified')
    .or(`domain.eq.${userDomain},email.eq.${user.email}`)
    .limit(10);

  let representativeId: number | null = null;
  if (repExact?.id) {
    representativeId = repExact.id;
  } else if (Array.isArray(repDomain) && repDomain.length > 0) {
    // Heuristic: if there is a single rep for this domain, accept; else require manual review later
    if (repDomain.length === 1) {
      const only = repDomain[0];
      if (only?.id) representativeId = only.id;
    }
  } else if (Array.isArray(fastTrackDomain) && fastTrackDomain.length > 0) {
    if (fastTrackDomain.length === 1) {
      const only = fastTrackDomain[0];
      if (only?.representative_id) representativeId = only.representative_id;
    }
  }

  if (!representativeId) {
    // Record attempt and require manual/doc verification
    await supabase.from('candidate_verifications').insert(stripUndefinedDeep({
      candidate_id: candidate.id,
      method: 'gov_email',
      status: 'in_progress',
      evidence: { email: user.email, domain: userDomain, match: 'none' },
    }));
    return successResponse({ ok: false, reason: 'No exact/unique domain match. Proceed with document/manual verification.' });
  }

  // Link candidate to representative and mark verified
  const { error: updErr } = await supabase
    .from('candidate_profiles')
    .update({
      representative_id: representativeId,
      filing_status: 'verified',
      is_public: true,
    })
    .eq('id', candidate.id);
  if (updErr) {
    logger.error('Failed to fast-track candidate', { updErr });
    return errorResponse('Failed to fast-track', 500);
  }

  await supabase.from('candidate_verifications').insert(stripUndefinedDeep({
    candidate_id: candidate.id,
    method: 'gov_email',
    status: 'verified',
    evidence: { email: user.email, representative_id: representativeId },
  }));

  return successResponse({ ok: true, slug: candidate.slug, representativeId });
});

export const GET = withErrorHandling(async () => methodNotAllowed(['POST']));

