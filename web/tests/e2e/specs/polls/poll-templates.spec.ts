/**
 * Poll Templates E2E Tests
 *
 * Tests poll templates page:
 * - Navigation to templates page
 * - Page load and content display
 * - Category filter
 * - Template selection and redirect to create flow
 *
 * Created: February 2026
 */

import { expect, test } from '@playwright/test';

import { getE2EUserCredentials, loginTestUser, waitForPageReady } from '../../helpers/e2e-setup';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

test.describe('Poll Templates', () => {
  test.beforeEach(async ({ page }) => {
    // /polls/templates is protected - log in when credentials available
    const creds = getE2EUserCredentials();
    const isProduction = BASE_URL.includes('choices-app.com');
    if (isProduction && creds) {
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, { email: creds.email, password: creds.password, username: creds.username });
      await page.waitForTimeout(2_000);
    } else if (isProduction && !creds) {
      test.skip(true, 'E2E credentials required for production poll templates');
    }
  });

  test('templates page loads and displays content', async ({ page }) => {
    await page.goto(`${BASE_URL}/polls/templates`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForPageReady(page);
    await page.waitForTimeout(2_000);

    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/polls\/templates/);

    const heading = page.locator('h1').filter({ hasText: /poll templates/i });
    await expect(heading.first()).toBeVisible({ timeout: 10_000 });

    const searchInput = page.getByLabel(/search templates/i);
    await expect(searchInput.first()).toBeVisible({ timeout: 5_000 });
  });

  test('category filter filters templates', async ({ page }) => {
    await page.goto(`${BASE_URL}/polls/templates`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForPageReady(page);
    await page.waitForTimeout(2_000);

    const businessButton = page.getByRole('button', { name: /business/i });
    await expect(businessButton.first()).toBeVisible({ timeout: 5_000 });
    await businessButton.first().click();
    await page.waitForTimeout(1_000);

    const resultsText = page.locator('[role="status"]').filter({ hasText: /showing.*templates/i });
    await expect(resultsText.first()).toBeVisible({ timeout: 5_000 });
  });

  test('use template navigates to create page', async ({ page }) => {
    await page.goto(`${BASE_URL}/polls/templates`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForPageReady(page);
    await page.waitForTimeout(2_000);

    const useTemplateButton = page.getByTestId('use-template-1').or(page.getByRole('button', { name: /use template/i }).first());
    await expect(useTemplateButton.first()).toBeVisible({ timeout: 10_000 });
    await useTemplateButton.first().click();

    await page.waitForURL(/\/polls\/create/, { timeout: 10_000 });
    const createUrl = page.url();
    expect(createUrl).toMatch(/\/polls\/create/);
    expect(createUrl).toContain('template=');
  });
});
