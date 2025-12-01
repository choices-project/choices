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

  // Wait for page to be ready - give it more time for production
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {
    // Continue even if networkidle times out
  });

  // Wait for any form or input to appear (React hydration)
  try {
    // Wait for either an input field or a form element
    await Promise.race([
      page.waitForSelector('input[type="email"], input#email, input[name="email"]', { timeout: 20_000 }),
      page.waitForSelector('form', { timeout: 20_000 }),
      page.waitForSelector('input', { timeout: 20_000 }),
    ]);
  } catch {
    // Continue anyway - maybe the page structure is different
  }

  // Additional wait for React hydration and client-side rendering
  await page.waitForTimeout(5000);

  // Check if we need to toggle to login mode (page might default to sign up)
  try {
    const toggleButton = page.locator('[data-testid="auth-toggle"]').first();
    const toggleText = await toggleButton.textContent({ timeout: 5000 }).catch(() => null);
    if (toggleText?.includes('Already have an account') || toggleText?.includes('Sign in')) {
      await toggleButton.click();
      await page.waitForTimeout(1000); // Wait for form to switch
    }
  } catch {
    // Toggle might not exist or already in login mode
  }

  // Try to wait for the page to be fully interactive
  try {
    await page.waitForFunction(
      () => {
        const emailInput = document.querySelector('#email, input[name="email"], input[type="email"]');
        return emailInput !== null && (emailInput as HTMLElement).offsetParent !== null; // Check if visible
      },
      { timeout: 15_000 }
    );
  } catch {
    // Continue anyway - maybe the page structure is different
  }

  // Try multiple selector strategies for email field - prioritize #email (matches actual page structure)
  const emailSelectors = [
    '#email',
    'input[name="email"]',
    'input[type="email"]',
    '[data-testid="login-email"]',
    'input[placeholder*="email" i]',
    'input[placeholder*="Email" i]',
  ];

  let emailField = null;
  for (const selector of emailSelectors) {
    try {
      const field = page.locator(selector).first();
      await field.waitFor({ state: 'visible', timeout: 10_000 });
      if (await field.isVisible()) {
        emailField = field;
        break;
      }
    } catch {
      // Continue to next selector
    }
  }

  if (!emailField) {
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/auth-page-debug.png', fullPage: true });
    const pageContent = await page.textContent('body');
    throw new Error(
      `Could not find email input field on auth page. Page URL: ${page.url()}. ` +
      `Page contains: ${pageContent?.substring(0, 200)}...`
    );
  }

  // Try multiple selector strategies for password field - prioritize #password (matches actual page structure)
  const passwordSelectors = [
    '#password',
    'input[name="password"]',
    'input[type="password"]',
    '[data-testid="login-password"]',
    'input[placeholder*="password" i]',
    'input[placeholder*="Password" i]',
  ];

  let passwordField = null;
  for (const selector of passwordSelectors) {
    try {
      const field = page.locator(selector).first();
      await field.waitFor({ state: 'visible', timeout: 10_000 });
      if (await field.isVisible()) {
        passwordField = field;
        break;
      }
    } catch {
      // Continue to next selector
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
    'button:has-text("Sign In")',
    'form button[type="submit"]',
  ];

  let submitButton = null;
  for (const selector of submitSelectors) {
    try {
      const button = page.locator(selector).first();
      await button.waitFor({ state: 'visible', timeout: 10_000 });
      if (await button.isVisible()) {
        submitButton = button;
        break;
      }
    } catch {
      // Continue to next selector
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

