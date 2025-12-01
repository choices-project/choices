
import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, notFoundError, validationError, errorResponse, forbiddenError } from '@/lib/api';
import { createRateLimiter, rateLimitMiddleware } from '@/lib/core/security/rate-limit';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

const editLimiter = createRateLimiter({
  interval: 60 * 60 * 1000, // 1h window
  uniqueTokenPerInterval: 20,
  maxBurst: 10
});

export const GET = withErrorHandling(async (request: NextRequest, { params }: { params: { slug: string } }) => {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return notFoundError('Not available');

  const slug = String(params.slug);
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await (supabase as any)
    .from('candidate_profiles')
    .select('id, user_id, slug, display_name, office, jurisdiction, party, bio, website, social, filing_status, is_public, representative_id')
    .eq('slug', slug)
    .maybeSingle();

  if (!profile) return notFoundError('Candidate not found');
  const isOwner = !!(user && String(profile.user_id) === String(user.id));
  if (!profile.is_public && !isOwner) return notFoundError('Candidate not found');

  return successResponse({ ...profile, isOwner });
});

export const PATCH = withErrorHandling(async (request: NextRequest, { params }: { params: { slug: string } }) => {
  const rate = await rateLimitMiddleware(request, editLimiter);
  if (!rate.allowed) {
    return validationError({ rate: 'Too many edits, please try later' }, 'Rate limited');
  }
  const supabase = await getSupabaseServerClient();
  if (!supabase) return errorResponse('Auth/DB not available', 500);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return errorResponse('Authentication required', 401);

  const slug = String(params.slug);
  const { data: candidate, error: candErr } = await supabase
    .from('candidate_profiles')
    .select('id, user_id')
    .eq('slug', slug)
    .maybeSingle();
  if (candErr || !candidate) {
    return notFoundError('Candidate not found');
  }
  if (String(candidate.user_id) !== String(user.id)) {
    return forbiddenError('Not authorized to edit this candidate profile');
  }

  const body = await request.json().catch(() => ({}));
  const allowed: Record<string, unknown> = {};
  const fields = {
    display_name: 'string',
    office: 'string',
    jurisdiction: 'string',
    party: 'string',
    bio: 'string',
    website: 'string',
    social: 'object',
    is_public: 'boolean',
  } as const;

  let hasAny = false;
  for (const [key, type] of Object.entries(fields)) {
    const value = (body as Record<string, unknown>)[key];
    if (value === undefined) continue;
    if (type === 'object' ? typeof value !== 'object' || value === null : typeof value !== type) {
      return validationError({ [key]: `Invalid ${key}` });
    }
    (allowed as any)[key] = value;
    hasAny = true;
  }
  if (!hasAny) {
    return validationError({ _: 'No editable fields provided' });
  }

  // Additional validation
  if (typeof allowed.display_name === 'string' && (allowed.display_name as string).length > 120) {
    return validationError({ display_name: 'Display name too long' });
  }
  if (typeof allowed.bio === 'string' && (allowed.bio as string).length > 2000) {
    return validationError({ bio: 'Bio exceeds 2000 characters' });
  }
  const isValidUrl = (u: string) => {
    try {
      const url = new URL(u);
      return ['http:', 'https:'].includes(url.protocol);
    } catch {
      return false;
    }
  };
  if (typeof allowed.website === 'string' && allowed.website && !isValidUrl(String(allowed.website))) {
    return validationError({ website: 'Invalid website URL' });
  }
  if (allowed.social && typeof allowed.social === 'object') {
    const socials = allowed.social as Record<string, unknown>;
    for (const [k, v] of Object.entries(socials)) {
      if (typeof v !== 'string' || (v && !isValidUrl(v))) {
        return validationError({ [`social.${k}`]: 'Invalid URL' });
      }
    }
  }

  const { error: updErr } = await updateCandidateProfile(supabase, candidate.id, allowed);
  if (updErr) {
    return errorResponse('Failed to update candidate', 500);
  }

  const { data: updated } = await supabase
    .from('candidate_profiles')
    .select('id, slug, display_name, office, jurisdiction, party, bio, website, social, filing_status, is_public, representative_id')
    .eq('id', candidate.id)
    .maybeSingle();

  try {
    await (supabase as any)
      .from('platform_analytics')
      .insert({
        event_type: 'candidate_profile_edit',
        metadata: { slug, fields: Object.keys(allowed) },
      });
  } catch {
    // Intentionally ignore analytics insertion failures to avoid blocking the main update flow
  }

  return successResponse(updated ?? { id: candidate.id, slug });
});

export async function updateCandidateProfile(
  supabase: any,
  id: string,
  allowed: Record<string, unknown>
): Promise<{ error: unknown | null }> {
  return await supabase
    .from('candidate_profiles')
    .update(allowed)
    .eq('id', id);
}

