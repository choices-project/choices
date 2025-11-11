import { afterEach, describe, expect, it, jest } from '@jest/globals';

import {
  FEATURE_FLAGS,
  featureFlagManager,
  isFeatureEnabled,
} from '@/lib/core/feature-flags';

type MutableFlagKey = keyof typeof FEATURE_FLAGS;

const ALWAYS_ON = [
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

const muteConsole = () => {
  const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => undefined);
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  return () => {
    warnSpy.mockRestore();
    infoSpy.mockRestore();
    errorSpy.mockRestore();
  };
};

afterEach(() => {
  featureFlagManager.reset();
});

describe('featureFlagManager defaults', () => {
  it('exports only mutable flags in the default config', () => {
    const exportConfig = featureFlagManager.exportConfig();
    const exportedKeys = Object.keys(exportConfig.flags);

    expect(exportedKeys).toEqual(Object.keys(FEATURE_FLAGS));
    for (const key of exportedKeys) {
      expect(exportConfig.flags[key]).toBe(isFeatureEnabled(key));
    }
  });

  it('does not mutate always-on flags when importing config', () => {
    const restoreConsole = muteConsole();
    const intentionallyBadConfig = {
      flags: Object.fromEntries(
        Object.keys(FEATURE_FLAGS).map((key) => [key, false])
      ),
      timestamp: new Date().toISOString(),
      version: 'test',
    };

    featureFlagManager.importConfig(intentionallyBadConfig);

    for (const [flagId, defaultValue] of Object.entries(FEATURE_FLAGS)) {
      expect(isFeatureEnabled(flagId)).toBe(defaultValue);
    }

    for (const flagId of ALWAYS_ON) {
      expect(isFeatureEnabled(flagId)).toBe(true);
    }
    restoreConsole();
  });

  it('prevents toggling always-on flags via API helpers', () => {
    const restoreConsole = muteConsole();

    for (const flagId of ALWAYS_ON) {
      expect(featureFlagManager.disable(flagId)).toBe(false);
      expect(featureFlagManager.toggle(flagId)).toBe(true);
      expect(featureFlagManager.enable(flagId)).toBe(true);
      expect(isFeatureEnabled(flagId)).toBe(true);
    }

    restoreConsole();
  });
});

describe('featureFlagManager mutation behaviour', () => {
  it('toggles mutable flags and reflects state in getFlag', () => {
    const restoreConsole = muteConsole();
    const mutableKeys = Object.keys(FEATURE_FLAGS) as MutableFlagKey[];
    const targetFlag = mutableKeys[0];

    if (!targetFlag) {
      throw new Error('FEATURE_FLAGS must contain at least one mutable flag.');
    }

    expect(isFeatureEnabled(targetFlag)).toBe(FEATURE_FLAGS[targetFlag]);

    const toggleResult = featureFlagManager.toggle(targetFlag);
    expect(toggleResult).toBe(true);
    expect(isFeatureEnabled(targetFlag)).toBe(!FEATURE_FLAGS[targetFlag]);

    const flagDescriptor = featureFlagManager.getFlag(targetFlag);
    expect(flagDescriptor?.enabled).toBe(!FEATURE_FLAGS[targetFlag]);

    restoreConsole();
  });

  it('reset returns manager to default state', () => {
    const restoreConsole = muteConsole();
    const mutableKeys = Object.keys(FEATURE_FLAGS) as MutableFlagKey[];
    const targetFlag = mutableKeys[0];

    if (!targetFlag) {
      throw new Error('FEATURE_FLAGS must contain at least one mutable flag.');
    }

    featureFlagManager.toggle(targetFlag);
    expect(isFeatureEnabled(targetFlag)).toBe(!FEATURE_FLAGS[targetFlag]);

    featureFlagManager.reset();
    expect(isFeatureEnabled(targetFlag)).toBe(FEATURE_FLAGS[targetFlag]);

    restoreConsole();
  });
});


