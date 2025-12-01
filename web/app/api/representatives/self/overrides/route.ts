
import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, validationError, errorResponse, forbiddenError, methodNotAllowed } from '@/lib/api';
import { createRateLimiter, rateLimitMiddleware } from '@/lib/core/security/rate-limit';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

const isValidUrl = (u: string) => {
  try {
    const url = new URL(u);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
};

export const POST = withErrorHandling(async (request: NextRequest) => {
  const rate = await rateLimitMiddleware(request, createRateLimiter({
    interval: 60 * 60 * 1000,
    uniqueTokenPerInterval: 20,
    maxBurst: 10
  }));
  if (!rate.allowed) {
    return validationError({ rate: 'Too many edits, please try later' }, 'Rate limited');
  }
  const supabase = await getSupabaseServerClient();
  if (!supabase) return errorResponse('Auth/DB not available', 500);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return errorResponse('Authentication required', 401);

  const body = await request.json().catch(() => ({}));
  const representativeId = Number((body?.representativeId ?? body?.representative_id) ?? NaN);
  if (!Number.isFinite(representativeId)) {
    return validationError({ representativeId: 'representativeId is required' });
  }

  // Ownership check: ensure this user is fast-tracked/linked to the representative
  const { data: link } = await supabase
    .from('candidate_profiles')
    .select('id')
    .eq('user_id', user.id)
    .eq('representative_id', representativeId)
    .maybeSingle();
  if (!link) {
    return forbiddenError('Not authorized to edit this representative');
  }

  const payload: Record<string, unknown> = {};
  if (typeof body.profile_photo_url === 'string' && body.profile_photo_url) {
    if (!isValidUrl(body.profile_photo_url)) {
      return validationError({ profile_photo_url: 'Invalid URL' });
    }
    payload.profile_photo_url = body.profile_photo_url;
  }
  if (typeof body.campaign_website === 'string' && body.campaign_website) {
    if (!isValidUrl(body.campaign_website)) {
      return validationError({ campaign_website: 'Invalid URL' });
    }
    payload.campaign_website = body.campaign_website;
  }
  if (typeof body.short_bio === 'string') {
    if (body.short_bio.length > 600) {
      return validationError({ short_bio: 'Bio exceeds 600 characters' });
    }
    payload.short_bio = body.short_bio;
  }
  if (typeof body.press_contact === 'string') {
    payload.press_contact = body.press_contact.slice(0, 200);
  }
  if (body.socials && typeof body.socials === 'object') {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(body.socials as Record<string, unknown>)) {
      if (typeof v === 'string' && isValidUrl(v)) {
        out[k] = v;
      } else {
        return validationError({ [`socials.${k}`]: 'Invalid URL' });
      }
    }
    payload.socials = out;
  }

  if (Object.keys(payload).length === 0) {
    return validationError({ _: 'No fields provided' });
  }

  // Upsert override with current user_id
  const { data: existing } = await supabase
    .from('representative_overrides')
    .select('id')
    .eq('representative_id', representativeId)
    .maybeSingle();

  if (existing) {
    const { error: updErr } = await supabase
      .from('representative_overrides')
      .update({ ...payload, user_id: user.id })
      .eq('id', existing.id);
    if (updErr) {
      return errorResponse('Failed to update override', 500);
    }
  } else {
    const { error: insErr } = await supabase
      .from('representative_overrides')
      .insert({ representative_id: representativeId, user_id: user.id, ...payload });
    if (insErr) {
      return errorResponse('Failed to create override', 500);
    }
  }

  try {
    await (supabase as any)
      .from('platform_analytics')
      .insert({
        event_type: 'representative_override_edit',
        metadata: { representativeId, fields: Object.keys(payload) },
      });
  } catch {
    // Non-blocking: analytics insertion failure should not affect API success
  }

  return successResponse({ ok: true });
});

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  // Alias to POST for convenience
  return POST(request);
});

export const GET = withErrorHandling(async () => methodNotAllowed(['POST', 'PATCH']));

