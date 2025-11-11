import { describe, expect, it } from '@jest/globals';

import { FEATURE_FLAGS, featureFlagManager } from '@/lib/core/feature-flags';

describe('Mutable feature flag defaults', () => {
  const mutableEntries = Object.entries(FEATURE_FLAGS);

  it.each(mutableEntries)('%s defaults to %s', (flagId, expectedValue) => {
    expect(featureFlagManager.isEnabled(flagId)).toBe(expectedValue);
  });
});


