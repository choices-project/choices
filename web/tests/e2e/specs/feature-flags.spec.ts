import { expect, test } from '@playwright/test';

const ALWAYS_ON_FLAGS = [
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

test.describe('Feature flag guarantees', () => {
  test('always-on flags are reported as enabled via the API', async ({ request }) => {
    const response = await request.get('/api/feature-flags');
    expect(response.ok()).toBeTruthy();

    const payload = await response.json();
    expect(payload.success).toBeTruthy();

    const enabledIds: string[] = (payload.data?.enabledFlags ?? []).map((flag: { id: string }) => flag.id);

    for (const flagId of ALWAYS_ON_FLAGS) {
      expect(enabledIds).toContain(flagId);
    }
  });

  test('attempting to disable an always-on flag is rejected', async ({ request }) => {
    for (const flagId of ALWAYS_ON_FLAGS) {
      const response = await request.patch('/api/feature-flags', {
        data: { flagId, enabled: false },
      });

      expect(response.status()).toBe(400);

      const payload = await response.json();
      expect(payload.success).toBe(false);
      expect(payload.error).toMatch(/Failed to update feature flag/);
    }
  });
});


