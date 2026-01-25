import type { TrustTier } from '@/types/features/analytics';

export const TRUST_TIERS = ['T0', 'T1', 'T2', 'T3', 'T4'] as const;

export const LEGACY_TRUST_TIER_ALIASES = [
  'bronze',
  'silver',
  'gold',
  'platinum',
  'tier_0',
  'tier_1',
  'tier_2',
  'tier_3',
  'tier_4',
  'tier-0',
  'tier-1',
  'tier-2',
  'tier-3',
  'tier-4',
  't0',
  't1',
  't2',
  't3',
  't4',
] as const;

const LEGACY_ALIAS_MAP: Record<string, TrustTier> = {
  bronze: 'T1',
  silver: 'T2',
  gold: 'T3',
  platinum: 'T3',
  tier_0: 'T0',
  tier_1: 'T1',
  tier_2: 'T2',
  tier_3: 'T3',
  tier_4: 'T4',
  'tier-0': 'T0',
  'tier-1': 'T1',
  'tier-2': 'T2',
  'tier-3': 'T3',
  'tier-4': 'T4',
  t0: 'T0',
  t1: 'T1',
  t2: 'T2',
  t3: 'T3',
  t4: 'T4',
};

const TIER_MATCHER = /^TIER[_-]?([0-4])$/i;

export const TRUST_TIER_LABELS: Record<TrustTier, { name: string; description: string }> = {
  T0: { name: 'Guest', description: 'Anonymous/shared participant' },
  T1: { name: 'Verified', description: 'Email or social login verified' },
  T2: { name: 'Trusted', description: 'Passkey (WebAuthn) verified' },
  T3: { name: 'Community Leader', description: 'High-trust, highly engaged member' },
  T4: { name: 'Sentinel', description: 'Highest integrity tier with verified history' },
};

export const isTrustTier = (value: unknown): value is TrustTier =>
  typeof value === 'string' && TRUST_TIERS.includes(value as TrustTier);

export const normalizeTrustTier = (value: unknown): TrustTier => {
  if (typeof value === 'number' && value >= 0 && value <= 3) {
    return `T${value}` as TrustTier;
  }

  if (typeof value === 'string') {
    const upper = value.toUpperCase();
    if (isTrustTier(upper)) {
      return upper as TrustTier;
    }

    const alias = LEGACY_ALIAS_MAP[value.toLowerCase()];
    if (alias) {
      return alias;
    }

    const tierMatch = value.match(TIER_MATCHER);
    if (tierMatch) {
      return `T${tierMatch[1]}` as TrustTier;
    }
  }

  return 'T0';
};

export const compareTrustTiers = (left: TrustTier, right: TrustTier): number =>
  TRUST_TIERS.indexOf(left) - TRUST_TIERS.indexOf(right);

export const getTrustTierLabel = (tier: TrustTier): string => TRUST_TIER_LABELS[tier].name;

export const getTrustTierDescription = (tier: TrustTier): string =>
  TRUST_TIER_LABELS[tier].description;

