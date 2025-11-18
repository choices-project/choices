import { describe, it, expect } from '@jest/globals';

import { assertPepperConfig } from '@/lib/civics/env-guard';

describe('assertPepperConfig', () => {
  it('accepts properly prefixed ≥32-byte pepper in prod', () => {
    const env = {
      NODE_ENV: 'production',
      PRIVACY_PEPPER_DEV: undefined,
      // 32 bytes of hex (64 hex chars) with prefix
      PRIVACY_PEPPER_CURRENT: 'hex:' + 'a'.repeat(64),
      PRIVACY_PEPPER_PREVIOUS: undefined,
    };

    expect(() => assertPepperConfig(env)).not.toThrow();
  });
});


