/**
 * Analytics E2E Tests
 *
 * Covers ANALYTICS:
 * - Admin analytics dashboard renders
 * - Auto-refresh toggle interaction
 * - Analytics API endpoint returns structured data
 */
import { test, expect } from '@playwright/test';
import { waitForPageReady } from './helpers/e2e-setup';

test.describe('Analytics', () => {
  test('admin analytics dashboard renders', async ({ page }) => {
    await Promise.all([
      page.waitForURL('**/admin/analytics', { waitUntil: 'commit' }),
      page.goto('/admin/analytics'),
    ]);
    await waitForPageReady(page);
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible();
    await expect(page.getByTestId('analytics-widget')).toBeVisible();
  });

  test('toggles auto-refresh UI state', async ({ page }) => {
    await page.goto('/admin/analytics');
    await waitForPageReady(page);
    const toggle = page.getByRole('button', { name: /Auto-refresh/ });
    await expect(toggle).toBeVisible();
    const before = await toggle.textContent();
    await toggle.click();
    const after = await toggle.textContent();
    expect(before).not.toEqual(after);
  });

  test('analytics API returns performance info', async ({ page }) => {
    const res = await page.request.get('/api/analytics?period=7d');
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.performance).toBeTruthy();
    expect(json.performance.queryOptimized).toBeTruthy();
    expect(json.generatedAt).toBeTruthy();
  });
});

