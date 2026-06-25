import { getSupabaseAdminClient } from '@/utils/supabase/server';

import logger from '@/lib/utils/logger';

type TrustTierCode = 'T0' | 'T1' | 'T2' | 'T3' | 'T4';

const TIER_RANK: Record<TrustTierCode, number> = {
  T0: 0,
  T1: 1,
  T2: 2,
  T3: 3,
  T4: 4,
};

export function normalizeTrustTierCode(value: string | null | undefined): TrustTierCode {
  const tier = (value ?? 'T0').toUpperCase();
  if (tier === 'T1' || tier === 'T2' || tier === 'T3' || tier === 'T4') {
    return tier;
  }
  return 'T0';
}

/** Server-only trust tier write (service role). Never call from user-scoped Supabase clients. */
export async function setUserTrustTierAdmin(
  userId: string,
  trustTier: TrustTierCode,
  context?: { reason?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await getSupabaseAdminClient();
  const { error } = await admin
    .from('user_profiles')
    .update({
      trust_tier: trustTier,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    logger.error('setUserTrustTierAdmin failed', {
      userId,
      trustTier,
      reason: context?.reason,
      error: error.message,
    });
    return { ok: false, error: error.message };
  }

  logger.info('Trust tier updated (admin)', {
    userId,
    trustTier,
    reason: context?.reason,
  });
  return { ok: true };
}

/** Promote only when the new tier rank is higher than the current tier. */
export async function promoteUserTrustTierAdmin(
  userId: string,
  targetTier: TrustTierCode,
  context?: { reason?: string },
): Promise<{ ok: true; changed: boolean } | { ok: false; error: string }> {
  const admin = await getSupabaseAdminClient();
  const { data: profile, error: readError } = await admin
    .from('user_profiles')
    .select('trust_tier')
    .eq('user_id', userId)
    .single();

  if (readError || !profile) {
    return { ok: false, error: readError?.message ?? 'Profile not found' };
  }

  const current = normalizeTrustTierCode(profile.trust_tier);
  if (TIER_RANK[current] >= TIER_RANK[targetTier]) {
    return { ok: true, changed: false };
  }

  const result = await setUserTrustTierAdmin(userId, targetTier, context);
  if (!result.ok) {
    return result;
  }
  return { ok: true, changed: true };
}
