import crypto from 'crypto';

import { getTrustTierWeight } from '@/lib/moderation/trust-tiers';

export type IntegrityBehaviorSignals = {
  votesLastHour: number;
  votesLastDay: number;
  distinctPollsLastDay: number;
  accountAgeDays: number | null;
};

export type IntegrityAdvancedSignals = {
  ipAddress?: string | null;
  ipPrefix?: string | null;
  deviceHash?: string | null;
  ipHash?: string | null;
  sharedDeviceUserCount?: number | null;
  sharedIpUserCount?: number | null;
};

export type IntegrityScoreResult = {
  score: number;
  reasonCodes: string[];
  behaviorSignals: IntegrityBehaviorSignals;
  advancedSignals?: IntegrityAdvancedSignals;
};

const clampScore = (value: number) => Math.max(0, Math.min(100, value));

const hashValue = (value: string) =>
  crypto.createHash('sha256').update(value).digest('hex');

export const buildAdvancedSignals = ({
  ipAddress,
  userAgent,
  sharedDeviceUserCount,
  sharedIpUserCount,
}: {
  ipAddress?: string | null;
  userAgent?: string | null;
  sharedDeviceUserCount?: number | null;
  sharedIpUserCount?: number | null;
}): IntegrityAdvancedSignals => {
  const ipPrefix = ipAddress
    ? ipAddress.split('.').slice(0, 2).join('.')
    : null;
  const deviceHash = userAgent ? hashValue(userAgent) : null;
  const ipHash = ipAddress ? hashValue(ipAddress) : null;

  return {
    ipAddress: ipAddress ?? null,
    ipPrefix,
    deviceHash,
    ipHash,
    sharedDeviceUserCount: sharedDeviceUserCount ?? null,
    sharedIpUserCount: sharedIpUserCount ?? null,
  };
};

export const scoreIntegrity = ({
  behavior,
  advanced,
  trustTier,
}: {
  behavior: IntegrityBehaviorSignals;
  advanced?: IntegrityAdvancedSignals;
  trustTier?: string | null;
}): IntegrityScoreResult => {
  let score = 100;
  const reasonCodes: string[] = [];

  if (behavior.votesLastHour >= 10) {
    score -= 35;
    reasonCodes.push('high_vote_velocity_1h');
  } else if (behavior.votesLastHour >= 5) {
    score -= 20;
    reasonCodes.push('elevated_vote_velocity_1h');
  }

  if (behavior.votesLastDay >= 30) {
    score -= 30;
    reasonCodes.push('high_vote_volume_24h');
  } else if (behavior.votesLastDay >= 15) {
    score -= 15;
    reasonCodes.push('elevated_vote_volume_24h');
  }

  if (behavior.distinctPollsLastDay >= 12) {
    score -= 20;
    reasonCodes.push('broad_poll_spread_24h');
  }

  if (behavior.accountAgeDays !== null) {
    if (behavior.accountAgeDays < 1) {
      score -= 20;
      reasonCodes.push('account_age_lt_1d');
    } else if (behavior.accountAgeDays < 7) {
      score -= 10;
      reasonCodes.push('account_age_lt_7d');
    }
  }

  if (advanced?.sharedDeviceUserCount && advanced.sharedDeviceUserCount >= 5) {
    score -= 25;
    reasonCodes.push('shared_device_high');
  } else if (advanced?.sharedDeviceUserCount && advanced.sharedDeviceUserCount >= 3) {
    score -= 15;
    reasonCodes.push('shared_device_medium');
  }

  if (advanced?.sharedIpUserCount && advanced.sharedIpUserCount >= 8) {
    score -= 25;
    reasonCodes.push('shared_ip_high');
  } else if (advanced?.sharedIpUserCount && advanced.sharedIpUserCount >= 4) {
    score -= 15;
    reasonCodes.push('shared_ip_medium');
  }

  const weightedScore = clampScore(score * getTrustTierWeight(trustTier));

  return {
    score: weightedScore,
    reasonCodes,
    behaviorSignals: behavior,
    ...(advanced ? { advancedSignals: advanced } : {}),
  };
};
