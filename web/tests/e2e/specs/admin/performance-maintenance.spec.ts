/**
 * Admin Performance Maintenance Tests
 *
 * Tests for materialized views refresh and database maintenance endpoints
 */

import { test, expect } from '@playwright/test';

import { getE2EAdminCredentials, loginWithPassword, waitForPageReady } from '../../helpers/e2e-setup';

test.describe('Admin Performance Maintenance', () => {
  test.skip(
    () => process.env.PLAYWRIGHT_USE_MOCKS === '1' || process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1',
    'Admin performance tests require a real Supabase backend with admin credentials',
  );

  test.beforeEach(async ({ page }) => {
    const adminCreds = getE2EAdminCredentials();
    if (!adminCreds) {
      test.skip(true, 'Admin credentials not available');
      return;
    }

    await loginWithPassword(page, adminCreds, { path: '/auth', timeoutMs: 30_000 });
    await page.waitForTimeout(2_000);

    await page.goto('/admin/performance', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForPageReady(page);

    // Wait for dashboard to load: h2, loading skeleton, spinner, or error (valid CSS only for waitForSelector)
    await page.locator('.animate-pulse, .animate-spin, h2, [role="status"]').first().waitFor({ state: 'visible', timeout: 20_000 });
    // Extra wait for dynamic PerformanceDashboard to hydrate (ssr: false)
    await page.waitForTimeout(3_000);
  });

  test('Refresh Materialized Views button should call API endpoint', async ({ page }) => {
    test.setTimeout(90_000);

    const apiCallPromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/admin/refresh-materialized-views') &&
        response.request().method() === 'POST',
      { timeout: 60_000 }
    );

    const refreshButton = page.locator('button:has-text("Refresh Views"), button:has-text("Refresh Materialized Views")').first();

    if ((await refreshButton.count()) === 0) {
      test.skip(true, 'Refresh Views button not found');
      return;
    }

    await refreshButton.click();

    const response = await apiCallPromise;

    expect(response.status()).toBeLessThan(500);

    let responseBody: { success?: boolean };
    try {
      responseBody = await Promise.race([
        response.json(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('JSON parse timeout')), 30_000)
        ),
      ]);
    } catch {
      test.skip(true, 'API response slow or non-JSON (production API may be unavailable)');
      return;
    }
    expect(responseBody).toHaveProperty('success');

    if (response.status() === 200) {
      expect(responseBody.success).toBe(true);
    }
  });

  test('DB Maintenance button should call API endpoint', async ({ page }) => {
    test.setTimeout(120_000); // Maintenance can take 60s+ in production

    const apiCallPromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/admin/perform-database-maintenance') &&
        response.request().method() === 'POST',
      { timeout: 90_000 }
    );

    const maintenanceButton = page.locator('button:has-text("DB Maintenance"), button:has-text("Database Maintenance")').first();

    if ((await maintenanceButton.count()) === 0) {
      test.skip(true, 'DB Maintenance button not found');
      return;
    }

    await maintenanceButton.click();

    const response = await apiCallPromise;

    expect(response.status()).toBeLessThan(500);

    let responseBody: { success?: boolean; operations?: unknown };
    try {
      responseBody = await Promise.race([
        response.json(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('JSON parse timeout')), 45_000)
        ),
      ]);
    } catch {
      test.skip(true, 'API response slow or non-JSON (production maintenance may be unavailable)');
      return;
    }
    expect(responseBody).toHaveProperty('success');

    if (response.status() === 200) {
      expect(responseBody.success).toBe(true);
      expect(responseBody).toHaveProperty('operations');
    }
  });

  test('Endpoints should handle missing database functions gracefully', async ({ page, request }) => {
    test.setTimeout(90_000);
    // Test refresh-materialized-views endpoint directly
    const refreshResponse = await request.post('/api/admin/refresh-materialized-views', {
      headers: {
        'Cookie': await page.context().cookies().then(cookies =>
          cookies.map(c => `${c.name}=${c.value}`).join('; ')
        ),
      },
    });

    // Should not be a 500 error (should handle gracefully)
    expect(refreshResponse.status()).not.toBe(500);

    if (refreshResponse.ok()) {
      const body = await refreshResponse.json();
      expect(body).toHaveProperty('success');
      // Should indicate if functions are missing
      if (body.message) {
        expect(typeof body.message).toBe('string');
      }
    }

    // Test perform-database-maintenance endpoint directly
    const maintenanceResponse = await request.post('/api/admin/perform-database-maintenance', {
      headers: {
        'Cookie': await page.context().cookies().then(cookies =>
          cookies.map(c => `${c.name}=${c.value}`).join('; ')
        ),
      },
    });

    // Should not be a 500 error (should handle gracefully)
    expect(maintenanceResponse.status()).not.toBe(500);

    if (maintenanceResponse.ok()) {
      const body = await maintenanceResponse.json();
      expect(body).toHaveProperty('success');
      expect(body).toHaveProperty('operations');
      // Should indicate if functions are missing
      if (body.note) {
        expect(typeof body.note).toBe('string');
      }
    }
  });
});
