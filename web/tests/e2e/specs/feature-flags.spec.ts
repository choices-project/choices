import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const MUTABLE_FLAG = 'SOCIAL_SHARING';

const gotoAdminHarness = async (page: Page) => {
  await page.goto('/e2e/admin-store', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForSelector('[data-testid="admin-store-harness"]', { timeout: 60_000 });
  await page.waitForFunction(() => Boolean((window as any).__adminStoreHarness), { timeout: 60_000 });
};

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

  test('mutable flag can be toggled via API and reset', async ({ request }) => {
    const enableResponse = await request.patch('/api/feature-flags', {
      data: { flagId: MUTABLE_FLAG, enabled: true },
    });
    expect(enableResponse.ok()).toBeTruthy();
    const enablePayload = await enableResponse.json();
    expect(enablePayload.success).toBeTruthy();
    // Flags are nested in data.flags (Map serialized to object), each flag is an object with 'enabled' property
    const flags = enablePayload.data?.flags ?? enablePayload.flags ?? {};
    // Map serializes to object, so access by key
    const flag = flags[MUTABLE_FLAG];
    expect(flag).toBeDefined();
    expect(flag?.enabled).toBe(true);

    const disableResponse = await request.patch('/api/feature-flags', {
      data: { flagId: MUTABLE_FLAG, enabled: false },
    });
    expect(disableResponse.ok()).toBeTruthy();
    const disablePayload = await disableResponse.json();
    expect(disablePayload.success).toBeTruthy();
    const disabledFlags = disablePayload.data?.flags ?? disablePayload.flags ?? {};
    const disabledFlag = disabledFlags[MUTABLE_FLAG];
    expect(disabledFlag).toBeDefined();
    expect(disabledFlag?.enabled).toBe(false);
  });
});

test.describe('Admin feature flag harness', () => {
  test('exposes enable/disable helpers that update harness snapshot', async ({ page }) => {
    await gotoAdminHarness(page);
    await page.evaluate(() => window.__adminStoreHarness?.resetAdminState());

    // Ensure flag disabled
    await page.evaluate((flag) => window.__adminStoreHarness?.disableFeatureFlag(flag), MUTABLE_FLAG);
    await expect(page.locator('[data-testid="admin-feature-flags-enabled"]')).not.toContainText(MUTABLE_FLAG);

    const enableResult = await page.evaluate(
      (flag) => window.__adminStoreHarness?.enableFeatureFlag(flag),
      MUTABLE_FLAG
    );
    expect(enableResult).toBeTruthy();
    await expect(page.locator('[data-testid="admin-feature-flags-enabled"]')).toContainText(MUTABLE_FLAG);

    const snapshot = await page.evaluate(() => window.__adminStoreHarness?.getSnapshot());
    expect(snapshot?.featureFlags.enabledFlags).toContain(MUTABLE_FLAG);
  });

  test('disabling a flag via harness surfaces in disabled list', async ({ page }) => {
    await gotoAdminHarness(page);
    await page.evaluate(() => window.__adminStoreHarness?.resetAdminState());

    await page.evaluate((flag) => window.__adminStoreHarness?.enableFeatureFlag(flag), MUTABLE_FLAG);
    await expect(page.locator('[data-testid="admin-feature-flags-enabled"]')).toContainText(MUTABLE_FLAG);

    const disabled = await page.evaluate(
      (flag) => window.__adminStoreHarness?.disableFeatureFlag(flag),
      MUTABLE_FLAG
    );
    expect(disabled).toBeTruthy();

    await expect(page.locator('[data-testid="admin-feature-flags-disabled"]')).toContainText(MUTABLE_FLAG);
  });
});


