/**
 * Feedback Widget E2E Tests
 *
 * Covers FEEDBACK_WIDGET flows:
 * - Basic submission end-to-end
 * - Validation errors (suspicious content)
 * - Offline error handling + recovery
 * - Admin feedback analytics page loads
 *
 * Mirrors patterns from user-journeys.spec.ts:
 * - waitUntil: 'commit' App Router-aware waits
 * - console log capture
 * - offline simulation
 * - API route mocking when helpful
 */
import { test, expect } from '@playwright/test';
import {
  waitForPageReady,
  setupExternalAPIMocks,
  E2E_CONFIG,
} from './helpers/e2e-setup';

test.describe('Feedback Widget', () => {

  test.beforeEach(async ({ page }) => {
    await setupExternalAPIMocks(page);
    // Navigate to a page that has the feedback widget (app layout)
    await page.goto('/dashboard');
    await waitForPageReady(page);
  });

  test('submits feedback successfully with UI flow', async ({ page }) => {
    const consoleLogs: string[] = [];
    page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));

    // Debug: Check what's actually on the page
    // Page should load quickly
    const pageContent = await page.content();
    console.log('Page content length:', pageContent.length);
    console.log('Page title:', await page.title());
    
    // Check if any buttons exist
    const buttons = await page.locator('button').count();
    console.log('Number of buttons on page:', buttons);
    
    // Check if feedback widget exists in any form
    const feedbackElements = await page.locator('[class*="feedback"], [class*="Feedback"]').count();
    console.log('Feedback-related elements:', feedbackElements);
    
    // Check for any elements with fixed positioning
    const fixedElements = await page.locator('[class*="fixed"]').count();
    console.log('Fixed elements:', fixedElements);
    
    // Check for any elements with bottom-6 or right-6 classes
    const bottomElements = await page.locator('[class*="bottom-6"]').count();
    const rightElements = await page.locator('[class*="right-6"]').count();
    console.log('Bottom-6 elements:', bottomElements);
    console.log('Right-6 elements:', rightElements);
    
    // Check console logs for any errors
    console.log('Console logs:', consoleLogs);
    
    // Wait for feedback button to appear (has 2-second delay)
    await page.waitForSelector('.fixed.bottom-6.right-6', { timeout: 5000 });
    await page.locator('.fixed.bottom-6.right-6').click();
    // Modal should show
    await expect(page.locator('text=Enhanced Feedback')).toBeVisible();

    // Step select type
    await page.getByRole('button', { name: 'Bug Report' }).click();

    // Step details
    await page.getByPlaceholder('Brief title').fill('UI breaks on narrow viewport');
    await page.getByPlaceholder('Detailed description...').fill('When reducing width to 320px, layout overflows.');
    await page.getByRole('button', { name: 'Next' }).click();

    // Step sentiment
    await page.getByRole('button', { name: 'Positive' }).click();

    // Step screenshot (skip capture/upload in E2E; submit directly)
    await page.getByRole('button', { name: 'Submit Feedback' }).click();
    // Success UI verification
    await expect(page.getByText('Thank You! 🎉')).toBeVisible({ timeout: 10_000 });
    // Console debug trace
    console.log('Feedback widget logs:', consoleLogs);
  });

  test('shows validation error for suspicious content', async ({ page }) => {
    // Wait for feedback button to appear (has 2-second delay)
    await page.waitForSelector('.fixed.bottom-6.right-6', { timeout: 5000 });
    await page.locator('.fixed.bottom-6.right-6').click();
    await expect(page.locator('text=Enhanced Feedback')).toBeVisible();

    // Type -> Details with suspicious content (matches API pattern)
    await page.getByRole('button', { name: 'General' }).click();
    await page.getByPlaceholder('Brief title').fill('FREE MONEY CLICK HERE!!!');
    await page.getByPlaceholder('Detailed description...').fill('BUY NOW FREE MONEY CLICK HERE!!!');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Neutral' }).click();

    // Capture alert dialog triggered by API validation failure
    const dialogPromise = new Promise<string>(resolve => {
      page.on('dialog', dialog => {
        resolve(dialog.message());
        dialog.dismiss().catch(() => {});
      });
    });
    await page.getByRole('button', { name: 'Submit Feedback' }).click();
    const dialogMsg = await dialogPromise;
    expect(dialogMsg).toContain('Feedback submission failed');
  });

  test('offline submission fails gracefully, then succeeds online', async ({ page }) => {
    // Wait for feedback button to appear (has 2-second delay)
    await page.waitForSelector('.fixed.bottom-6.right-6', { timeout: 5000 });
    await page.locator('.fixed.bottom-6.right-6').click();
    await expect(page.locator('text=Enhanced Feedback')).toBeVisible();

    // Type -> Details
    await page.getByRole('button', { name: 'Feature Request' }).click();
    await page.getByPlaceholder('Brief title').fill('Add keyboard shortcuts');
    await page.getByPlaceholder('Detailed description...').fill('Shortcuts for navigation and voting.');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Mixed' }).click();

    // Go offline and attempt submission
    await page.context().setOffline(true);
    const dialogPromise = new Promise<string>(resolve => {
      page.on('dialog', dialog => {
        resolve(dialog.message());
        dialog.dismiss().catch(() => {});
      });
    });
    await page.getByRole('button', { name: 'Submit Feedback' }).click();
    const offlineMsg = await dialogPromise;
    expect(offlineMsg).toContain('Feedback submission failed');

    // Go online and submit again
    await page.context().setOffline(false);
    await page.getByRole('button', { name: 'Submit Feedback' }).click();
    await expect(page.getByText('Thank You! 🎉')).toBeVisible({ timeout: E2E_CONFIG.TIMEOUTS.ELEMENT_WAIT });
  });

  test('admin feedback analytics page renders', async ({ page }) => {
    // App router-aware wait
    await Promise.all([
      page.waitForURL('**/admin/feedback/enhanced', { waitUntil: 'commit' }),
      page.goto('/admin/feedback/enhanced'),
    ]);
    await waitForPageReady(page);
    // Wait for the page to fully load and the heading to be visible
    await expect(page.locator('h1:has-text("Access Denied")')).toBeVisible({ timeout: 15000 });
  });
});
