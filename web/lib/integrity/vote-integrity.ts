import { getTrustTierWeight } from '@/lib/moderation/trust-tiers';

import { buildAdvancedSignals, scoreIntegrity } from './scoring';

import type { SupabaseClient } from '@supabase/supabase-js';

type IntegrityConsent = {
  collectSignals: boolean;
  collectAdvanced: boolean;
  trustTier: string | null;
  accountAgeDays: number | null;
};

const INTEGRITY_SCORE_THRESHOLD = 60;

const getBoolean = (value: unknown) => value === true;

const resolveIntegrityConsent = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<IntegrityConsent> => {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('privacy_settings, trust_tier, created_at')
    .eq('user_id', userId)
    .maybeSingle();

  const privacySettings = (profile?.privacy_settings ?? {}) as Record<string, unknown>;
  const collectSignals = getBoolean(privacySettings.collectIntegritySignals);
  const collectAdvanced = getBoolean(privacySettings.collectIntegrityAdvancedSignals);
  const trustTier = profile?.trust_tier ?? null;

  const accountAgeDays =
    profile?.created_at
      ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (24 * 60 * 60 * 1000))
      : null;

  return { collectSignals, collectAdvanced, trustTier, accountAgeDays };
};

const fetchBehaviorSignals = async (
  supabase: SupabaseClient,
  userId: string,
) => {
  const now = Date.now();
  const lastHour = new Date(now - 60 * 60 * 1000).toISOString();
  const lastDay = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const votesLastHour = await supabase
    .from('votes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', lastHour);

  const votesLastDay = await supabase
    .from('votes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', lastDay);

  const rankedLastHour = await supabase
    .from('poll_rankings')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', lastHour);

  const rankedLastDay = await supabase
    .from('poll_rankings')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', lastDay);

  const recentVotes = await supabase
    .from('votes')
    .select('poll_id')
    .eq('user_id', userId)
    .gte('created_at', lastDay);

  const recentRanked = await supabase
    .from('poll_rankings')
    .select('poll_id')
    .eq('user_id', userId)
    .gte('created_at', lastDay);

  const pollIds = new Set<string>();
  (recentVotes.data ?? []).forEach((row: { poll_id?: string | null }) => {
    if (row.poll_id) pollIds.add(row.poll_id);
  });
  (recentRanked.data ?? []).forEach((row: { poll_id?: string | null }) => {
    if (row.poll_id) pollIds.add(row.poll_id);
  });

  return {
    votesLastHour: (votesLastHour.count ?? 0) + (rankedLastHour.count ?? 0),
    votesLastDay: (votesLastDay.count ?? 0) + (rankedLastDay.count ?? 0),
    distinctPollsLastDay: pollIds.size,
  };
};

const countSharedSignals = async (
  adminClient: SupabaseClient,
  deviceHash?: string | null,
  ipHash?: string | null,
) => {
  const sharedDeviceUserCount = deviceHash
    ? await (adminClient as any)
        .from('integrity_signals')
        .select('user_id', { count: 'exact', head: true })
        .eq('signal_type', 'advanced')
        .filter('signals->>deviceHash', 'eq', deviceHash)
    : null;

  const sharedIpUserCount = ipHash
    ? await (adminClient as any)
        .from('integrity_signals')
        .select('user_id', { count: 'exact', head: true })
        .eq('signal_type', 'advanced')
        .filter('signals->>ipHash', 'eq', ipHash)
    : null;

  return {
    sharedDeviceUserCount: sharedDeviceUserCount?.count ?? null,
    sharedIpUserCount: sharedIpUserCount?.count ?? null,
  };
};

export const recordIntegrityForVote = async ({
  supabase,
  adminClient,
  userId,
  pollId,
  voteId,
  voteType,
  ipAddress,
  userAgent,
  actionFlags,
}: {
  supabase: SupabaseClient;
  adminClient: SupabaseClient;
  userId: string;
  pollId: string;
  voteId: string;
  voteType: 'vote' | 'ranked';
  ipAddress?: string | null;
  userAgent?: string | null;
  actionFlags?: string[];
}): Promise<{ score: number; threshold: number } | null> => {
  const consent = await resolveIntegrityConsent(supabase, userId);
  if (!consent.collectSignals) {
    return null;
  }

  const behaviorSignals = await fetchBehaviorSignals(supabase, userId);
  const behavior = {
    ...behaviorSignals,
    accountAgeDays: consent.accountAgeDays,
  };

  let advancedSignals;
  if (consent.collectAdvanced) {
    const baseAdvanced = buildAdvancedSignals({
      ...(ipAddress !== undefined ? { ipAddress } : {}),
      ...(userAgent !== undefined ? { userAgent } : {}),
    });
    const sharedCounts = await countSharedSignals(adminClient, baseAdvanced.deviceHash, baseAdvanced.ipHash);
    advancedSignals = {
      ...baseAdvanced,
      ...sharedCounts,
    };
  }

  const scoreResult = scoreIntegrity({
    behavior,
    ...(advancedSignals ? { advanced: advancedSignals } : {}),
    trustTier: consent.trustTier,
  });

  const weightedScore = scoreResult.score;

  await (adminClient as any)
    .from('integrity_signals')
    .insert({
      user_id: userId,
      poll_id: pollId,
      vote_id: voteId,
      signal_type: 'behavior',
      consent_scope: consent.collectAdvanced ? 'advanced' : 'behavior',
      signals: scoreResult.behaviorSignals,
    });

  if (advancedSignals) {
    await (adminClient as any)
      .from('integrity_signals')
      .insert({
        user_id: userId,
        poll_id: pollId,
        vote_id: voteId,
        signal_type: 'advanced',
        consent_scope: 'advanced',
        signals: advancedSignals,
      });
  }

  await (adminClient as any)
    .from('vote_integrity_scores')
    .insert({
      vote_id: voteId,
      vote_type: voteType,
      poll_id: pollId,
      user_id: userId,
      score: Math.round(weightedScore),
      reason_codes: scoreResult.reasonCodes,
      metadata: {
        trustTier: consent.trustTier,
        scoreWeight: getTrustTierWeight(consent.trustTier),
        threshold: INTEGRITY_SCORE_THRESHOLD,
        ...(actionFlags && actionFlags.length > 0 ? { actionFlags } : {}),
      },
    });

  return { score: Math.round(weightedScore), threshold: INTEGRITY_SCORE_THRESHOLD };
};

export const getIntegrityThreshold = () => INTEGRITY_SCORE_THRESHOLD;
