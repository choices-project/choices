import type { Page } from '@playwright/test';

import { waitForPageReady } from './e2e-setup';

/**
 * Production-specific authentication helpers
 * 
 * These functions are designed for testing production environments (choices-app.com)
 * where test IDs may not be available. They use more generic selectors.
 */

export async function loginToProduction(
  page: Page,
  credentials: { email: string; password: string }
): Promise<void> {
  // Navigate to auth page
  await page.goto('/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForLoadState('networkidle', { timeout: 30_000 });

  // Try multiple selector strategies for email field
  const emailSelectors = [
    '[data-testid="login-email"]',
    'input[type="email"]',
    'input[name="email"]',
    '#email',
  ];

  let emailField = null;
  for (const selector of emailSelectors) {
    const field = page.locator(selector).first();
    if (await field.isVisible({ timeout: 5000 }).catch(() => false)) {
      emailField = field;
      break;
    }
  }

  if (!emailField) {
    throw new Error('Could not find email input field on auth page');
  }

  // Try multiple selector strategies for password field
  const passwordSelectors = [
    '[data-testid="login-password"]',
    'input[type="password"]',
    'input[name="password"]',
    '#password',
  ];

  let passwordField = null;
  for (const selector of passwordSelectors) {
    const field = page.locator(selector).first();
    if (await field.isVisible({ timeout: 5000 }).catch(() => false)) {
      passwordField = field;
      break;
    }
  }

  if (!passwordField) {
    throw new Error('Could not find password input field on auth page');
  }

  // Fill in credentials
  await emailField.fill(credentials.email, { timeout: 10_000 });
  await passwordField.fill(credentials.password, { timeout: 10_000 });

  // Find and click submit button
  const submitSelectors = [
    '[data-testid="login-submit"]',
    'button[type="submit"]',
    'input[type="submit"]',
    'button:has-text("Sign in")',
    'button:has-text("Login")',
  ];

  let submitButton = null;
  for (const selector of submitSelectors) {
    const button = page.locator(selector).first();
    if (await button.isVisible({ timeout: 5000 }).catch(() => false)) {
      submitButton = button;
      break;
    }
  }

  if (!submitButton) {
    throw new Error('Could not find submit button on auth page');
  }

  // Submit form
  await Promise.all([
    page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined),
    submitButton.click(),
  ]);

  // Wait for redirect
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });
  await waitForPageReady(page);
}

