/**
 * Database Optimization Suite E2E Tests
 *
 * Covers FEATURE_DB_OPTIMIZATION_SUITE:
 * - Admin performance APIs
 * - Database health metrics with query monitor
 * - Export formats
 * - Error handling for invalid params
 */
import { test, expect } from '@playwright/test';
import { E2E_CONFIG } from './helpers/e2e-setup';

test.describe('DB Optimization Suite', () => {
  test('performance admin endpoints return data', async ({ page }) => {
    const endpoints = [
      '/api/admin/performance?type=current',
      '/api/admin/performance?type=summary',
      '/api/admin/performance?type=recommendations',
      '/api/admin/performance?type=cache',
      '/api/admin/performance?type=queries',
      '/api/admin/performance?type=indexes',
    ];
    for (const ep of endpoints) {
      const res = await page.request.get(ep);
      expect(res.ok()).toBeTruthy();
      const json = await res.json();
      expect(json.success).toBeTruthy();
      expect(json.timestamp).toBeTruthy();
    }
  });

  test('performance export supports JSON', async ({ page }) => {
    const res = await page.request.get('/api/admin/performance?type=export&format=json');
    expect(res.ok()).toBeTruthy();
    expect(res.headers()['content-type']).toContain('application/json');
  });

  test('database health exposes optimization-enabled metrics', async ({ page }) => {
    const t0 = Date.now();
    const res = await page.request.get('/api/database-health');
    const ms = Date.now() - t0;
    // Basic performance constraint for response (environment-dependent, keep generous)
    expect(ms).toBeLessThan(10_000);
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    // Expect standard shape including performance + connectionPool
    expect(json.performance).toBeTruthy();
    expect(json.connectionPool).toBeTruthy();
    expect(typeof json.performance.optimizationEnabled).toBe('boolean');
  });

  test('invalid performance type returns 400', async ({ page }) => {
    const res = await page.request.get('/api/admin/performance?type=not-a-real-type');
    expect(res.status()).toBe(400);
  });

  test('offline fetch to health errors client-side', async ({ page }) => {
    await page.goto('/'); // ensure page context ready
    await page.context().setOffline(true);
    // Perform fetch in page context to simulate real network layer
    const result = await page.evaluate(async () => {
      try {
        const r = await fetch('/api/database-health');
        return { ok: r.ok };
      } catch (e) {
        return { error: String(e) };
      }
    });
    await page.context().setOffline(false);
    // When offline, fetch should error at client
    expect(result.error).toBeTruthy();
  });
});

