/**
 * Production API Smoke Tests
 *
 * Tests public API endpoints against production. No authentication required.
 * Run with: npm run test:e2e:production
 *
 * @production
 */

import { expect, test, type APIResponse } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://www.choices-app.com';

async function assertHttpStatus(res: APIResponse, expected: number, label: string): Promise<void> {
  if (res.status() === expected) return;
  const text = await res.text().catch(() => '');
  const hint =
    res.status() === 402 && text.includes('DEPLOYMENT_DISABLED')
      ? ' Vercel returned DEPLOYMENT_DISABLED — re-enable the production deployment or billing in the Vercel project.'
      : '';
  throw new Error(`${label}: expected HTTP ${expected}, got ${res.status()}.${hint} Response: ${text.slice(0, 500)}`);
}

test.describe('@production Production API smoke', () => {
  test('GET /api/health returns ok', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/health`, { timeout: 15_000 });
    await assertHttpStatus(res, 200, 'GET /api/health');
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data?.status).toBe('ok');
    expect(body.data?.environment).toBe('production');
  });

  test('GET /api/feature-flags/public returns flags', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/feature-flags/public`, {
      timeout: 15_000,
    });
    await assertHttpStatus(res, 200, 'GET /api/feature-flags/public');
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data?.flags).toBeDefined();
    expect(typeof body.data.flags).toBe('object');
    // GA flags should be true in production
    expect(body.data.flags.CONTACT_INFORMATION_SYSTEM).toBe(true);
    expect(body.data.flags.PUSH_NOTIFICATIONS).toBe(true);
    expect(body.data.flags.CIVIC_ENGAGEMENT_V2).toBe(true);
  });

  test('GET /api/health/ingest requires auth', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/health/ingest`, {
      timeout: 15_000,
    });
    await assertHttpStatus(res, 401, 'GET /api/health/ingest (unauthenticated)');
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
