import { normalizeTrustTier } from '@/lib/trust/trust-tiers';

import type { PrivacySettings, UserProfile } from './types';

export type ProfileResponsePayload = {
  profile: UserProfile | null;
  preferences: PrivacySettings | null;
  interests: {
    categories: string[];
    keywords: string[];
    topics: string[];
  };
  onboarding: {
    completed: boolean;
    data: Record<string, unknown>;
  };
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is string => typeof entry === 'string');
};

const toRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

export function createProfilePayload(record?: Record<string, unknown> | null): ProfileResponsePayload {
  const typedRecord = (record ?? null) as (Partial<UserProfile> & Record<string, unknown>) | null;
  const profile = typedRecord ? (typedRecord as UserProfile) : null;
  const normalizedProfile = profile
    ? {
        ...profile,
        trust_tier: normalizeTrustTier(profile.trust_tier),
      }
    : null;
  const preferences = (typedRecord?.privacy_settings as PrivacySettings | undefined) ?? null;

  const categories = toStringArray(typedRecord?.primary_concerns);
  const keywords = toStringArray(typedRecord?.community_focus);
  const topics = toStringArray((typedRecord as { primary_hashtags?: unknown })?.primary_hashtags);
  const demographics = toRecord(typedRecord?.demographics);

  const onboardingCompleted = Boolean(
    typedRecord?.demographics &&
    typedRecord?.primary_concerns &&
    typedRecord?.community_focus &&
    typedRecord?.participation_style,
  );

  return {
    profile: normalizedProfile,
    preferences,
    interests: {
      categories,
      keywords,
      topics,
    },
    onboarding: {
      completed: onboardingCompleted,
      data: demographics,
    },
  };
}

