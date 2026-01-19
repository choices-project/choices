import { beforeEach, describe, expect, it } from '@jest/globals';

import { FEATURE_FLAGS, featureFlagManager, isFeatureEnabled } from '@/lib/core/feature-flags';

const EXPECTED_ALWAYS_ON_FLAGS = [
  'PWA',
  'ADMIN',
  'FEEDBACK_WIDGET',
  'ENHANCED_ONBOARDING',
  'ENHANCED_PROFILE',
  'ENHANCED_AUTH',
  'ENHANCED_DASHBOARD',
  'ENHANCED_POLLS',
  'ENHANCED_VOTING',
  'CIVICS_ADDRESS_LOOKUP',
  'CIVICS_REPRESENTATIVE_DATABASE',
  'CIVICS_CAMPAIGN_FINANCE',
  'CIVICS_VOTING_RECORDS',
  'CANDIDATE_ACCOUNTABILITY',
  'CANDIDATE_CARDS',
  'ALTERNATIVE_CANDIDATES',
  'FEATURE_DB_OPTIMIZATION_SUITE',
  'ANALYTICS',
  'WEBAUTHN',
] as const;

const MUTABLE_FLAG_KEYS = new Set(Object.keys(FEATURE_FLAGS));

const getAlwaysOnFlagsFromRuntime = () =>
  featureFlagManager
    .getEnabledFlags()
    .map((flag) => flag.id)
    .filter((flagId) => !MUTABLE_FLAG_KEYS.has(flagId));

describe('Always-on feature flags', () => {
  beforeEach(() => {
    featureFlagManager.reset();
  });

  it('matches the expected allowlist of core capabilities', () => {
    const runtimeAlwaysOn = getAlwaysOnFlagsFromRuntime();

    expect(new Set(runtimeAlwaysOn)).toEqual(new Set(EXPECTED_ALWAYS_ON_FLAGS));
  });

  it('cannot be disabled or toggled off', () => {
    featureFlagManager.reset();

    for (const flagId of EXPECTED_ALWAYS_ON_FLAGS) {
      expect(isFeatureEnabled(flagId)).toBe(true);

      const disableResult = featureFlagManager.disable(flagId);
      expect(disableResult).toBe(false);
      expect(isFeatureEnabled(flagId)).toBe(true);

      const toggleResult = featureFlagManager.toggle(flagId);
      expect(toggleResult).toBe(true);
      expect(isFeatureEnabled(flagId)).toBe(true);

      const enableResult = featureFlagManager.enable(flagId);
      expect(enableResult).toBe(true);
      expect(isFeatureEnabled(flagId)).toBe(true);
    }
  });
});


