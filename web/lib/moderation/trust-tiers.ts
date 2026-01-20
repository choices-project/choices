export type TrustTierDefinition = {
  tier: string;
  label: string;
  description: string;
  scoreWeight: number;
  minScore: number;
};

export const TRUST_TIER_DEFINITIONS: TrustTierDefinition[] = [
  {
    tier: 'T0',
    label: 'New User',
    description: 'No verified history yet.',
    scoreWeight: 0.9,
    minScore: 0,
  },
  {
    tier: 'T1',
    label: 'Verified User',
    description: 'Completed onboarding with consistent activity.',
    scoreWeight: 1.0,
    minScore: 20,
  },
  {
    tier: 'T2',
    label: 'Trusted User',
    description: 'Sustained healthy engagement with low risk signals.',
    scoreWeight: 1.05,
    minScore: 40,
  },
  {
    tier: 'T3',
    label: 'Guardian',
    description: 'Highly reliable contributor with strong integrity history.',
    scoreWeight: 1.1,
    minScore: 60,
  },
  {
    tier: 'T4',
    label: 'Sentinel',
    description: 'Top-tier integrity profile with verified behavior.',
    scoreWeight: 1.15,
    minScore: 80,
  },
];

export const getTrustTierDefinition = (tier?: string | null) =>
  TRUST_TIER_DEFINITIONS.find((entry) => entry.tier === tier) ?? TRUST_TIER_DEFINITIONS[0];

export const getTrustTierWeight = (tier?: string | null) =>
  getTrustTierDefinition(tier).scoreWeight;
