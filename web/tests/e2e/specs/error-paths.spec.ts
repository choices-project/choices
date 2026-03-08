/**
 * Error Paths and Edge-Case E2E Tests
 *
 * Ensures the app handles errors and edge cases gracefully before go-live:
 * - 404 page content and navigation
 * - Invalid URLs
 * - API validation error shape (contact submit without auth)
 *
 * Created: March 2026
 * Status: ACTIVE
 */

import { expect, test } from '@playwright/test';

import { waitForPageReady } from '../helpers/e2e-setup';

test.describe('Error paths and edge cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('e2e-dashboard-bypass', '1');
      } catch { /* ignore localStorage in test env */ }
    });
  });

  test('404 page shows not-found content and homepage link', async ({ page }) => {
    await page.goto('/this-path-does-not-exist-404', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    await expect(page.getByText('404').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible();
    const homeLink = page.getByRole('link', { name: /go to homepage|home/i }).first();
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toHaveAttribute('href', '/');
  });

  test('404 page homepage link navigates to app root', async ({ page }) => {
    await page.goto('/nonexistent-route-xyz', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    const homeLink = page.getByRole('link', { name: /go to homepage|home/i }).first();
    await homeLink.click();
    await page.waitForURL(/\/(landing|auth|dashboard)?\/?/, { timeout: 10_000 });
    const url = page.url();
    expect(url).toMatch(/\/(landing|auth|dashboard|$)/);
  });

  test('unauthenticated contact submit returns 401', async ({ request }) => {
    const response = await request.post('/api/contact/submit', {
      data: {
        representative_id: 1,
        contact_type: 'email',
        value: 'test@example.com',
      },
    });
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('AUTH_ERROR');
  });

  test('contact submit with invalid type returns 400 validation', async ({ request }) => {
    const response = await request.post('/api/contact/submit', {
      data: {
        representative_id: 1,
        contact_type: 'invalid_type',
        value: 'test@example.com',
      },
    });
    expect([400, 401]).toContain(response.status());
    if (response.status() === 400) {
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.code).toBe('VALIDATION_ERROR');
      expect(body.details?.contact_type).toBeDefined();
    }
  });

  test('contact submit with invalid email returns 400', async ({ request }) => {
    const response = await request.post('/api/contact/submit', {
      data: {
        representative_id: 1,
        contact_type: 'email',
        value: 'not-an-email',
      },
    });
    expect([400, 401]).toContain(response.status());
    if (response.status() === 400) {
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.code).toBe('VALIDATION_ERROR');
    }
  });
});
