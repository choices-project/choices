// Server route handler

import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, validationError, errorResponse, methodNotAllowed } from '@/lib/api';
import { sendTransactionalEmail } from '@/lib/integrations/email/resend';
import { welcomeCandidateTemplate } from '@/lib/integrations/email/templates';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return errorResponse('Auth/DB not available', 500);
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return errorResponse('Authentication required', 401);
  }

  const body = await request.json().catch(() => ({}));
  const displayName = String(body.displayName ?? '').trim();
  const office = String(body.office ?? '').trim();
  const jurisdiction = String(body.jurisdiction ?? '').trim();
  const party = String(body.party ?? '').trim();

  if (!displayName) {
    return validationError({ displayName: 'Display name is required' });
  }

  // Ensure single profile per user
  const { data: existing } = await supabase
    .from('candidate_profiles')
    .select('id, slug')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return successResponse({ id: existing.id, slug: existing.slug });
  }

  const baseSlug = slugify(displayName);
  let slug = baseSlug;
  // Ensure unique slug
  for (let i = 1; i < 10; i++) {
    const { data: conflict } = await supabase.from('candidate_profiles').select('id').eq('slug', slug).maybeSingle();
    if (!conflict) break;
    slug = `${baseSlug}-${i}`;
  }

  const { data: created, error } = await supabase
    .from('candidate_profiles')
    .insert({
      user_id: user.id,
      slug,
      display_name: displayName,
      office: office || null,
      jurisdiction: jurisdiction || null,
      party: party || null,
      filing_status: 'in_progress',
      is_public: false,
    })
    .select('id, slug')
    .single();

  if (error) {
    logger.error('candidate_profiles insert failed', { error });
    return errorResponse('Failed to start candidate onboarding', 500);
  }

  // Seed onboarding row
  await supabase.from('candidate_onboarding').insert(
    { candidate_id: created.id, step: 'verification', completed: false }
  );

  // Fire-and-forget welcome email
  try {
    const email = (await supabase.auth.getUser()).data.user?.email ?? null;
    if (email) {
      const { subject, text, html } = welcomeCandidateTemplate(displayName);
      await sendTransactionalEmail({ to: email, subject, text, html });
    }
  } catch {
    // Non-blocking: onboarding succeeds even if welcome email fails to send
  }

  return successResponse({ id: created.id, slug: created.slug });
});

export const GET = withErrorHandling(async () => methodNotAllowed(['POST']));

