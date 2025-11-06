/**
 * Feedback Widget E2E Tests
 *
 * Covers FEEDBACK_WIDGET:
 * - Feedback widget rendering and interaction
 * - Multi-step feedback form submission
 * - Feedback categorization (Bug Report, Feature Request, General Feedback)
 * - Sentiment selection
 * - Screenshot capture (with skip option)
 * - Offline/retry behavior
 * - User journey tracking
 *
 * Created: January 30, 2025
 * Updated: January 30, 2025
 */

import { test, expect } from '@playwright/test';

import { waitForPageReady, setupExternalAPIMocks, loginTestUser } from './helpers/e2e-setup';

test.describe('Feedback Widget', () => {
  test.beforeEach(async ({ page }) => {
    await setupExternalAPIMocks(page);

    // Navigate to homepage (widget is in app layout, appears on all pages)
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000); // Let widget animate in
  });

  test('feedback widget button appears on page', async ({ page }) => {
    // Widget should be visible with data-testid
    await expect(page.locator('[data-testid="feedback-widget-button"]')).toBeVisible({ timeout: 10000 });
  });

  test('opens feedback modal when clicked', async ({ page }) => {
    // Click feedback widget button
    await page.click('[data-testid="feedback-widget-button"]');

    // Modal should open
    await expect(page.locator('text=/Feedback|Enhanced Feedback/i')).toBeVisible({ timeout: 5000 });
  });

  test('completes full feedback flow - Bug Report', async ({ page }) => {
    // Click the feedback widget button
    await page.click('[data-testid="feedback-widget-button"]');
    await expect(page.locator('text=/Feedback|Enhanced Feedback/i')).toBeVisible();

    // Select Bug Report
    await page.getByRole('button', { name: 'Bug Report' }).click();

    // Fill details
    await page.fill('input[placeholder="Summarize the issue"]', 'Test bug report');
    await page.fill('textarea[placeholder="Provide more details"]', 'This is a test bug report for E2E testing.');
    await page.getByRole('button', { name: 'Next' }).click();

    // Select sentiment
    await page.getByLabel('Negative').click();
    await page.getByRole('button', { name: 'Next' }).click();

    // Skip screenshot
    await page.getByRole('button', { name: 'Skip Screenshot' }).click();

    // Mock successful submission
    await page.route('**/api/feedback', async route => {
      const request = route.request();
      const postData = request.postDataJSON();

      // Verify payload
      expect(postData.type).toBe('bug_report');
      expect(postData.title).toBe('Test bug report');
      expect(postData.description).toContain('test bug report');
      expect(postData.sentiment).toBe('negative');
      expect(postData.userJourney).toBeDefined();

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Feedback submitted successfully!' }),
      });
    });

    // Submit
    await page.getByRole('button', { name: 'Submit Feedback' }).click();

    // Verify success message
    await expect(page.locator('text=Thank you for your feedback!')).toBeVisible();
    await expect(page.locator('text=We\'ll analyze your input')).toBeVisible();

    // Close
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.locator('text=Enhanced Feedback')).not.toBeVisible();
  });

  test('completes full feedback flow - Feature Request', async ({ page }) => {
    await page.locator('.fixed.bottom-6.right-6').click();
    await expect(page.locator('text=Enhanced Feedback')).toBeVisible();

    // Select Feature Request
    await page.getByRole('button', { name: 'Feature Request' }).click();

    // Fill details
    await page.fill('input[placeholder="Summarize the issue"]', 'New feature idea');
    await page.fill('textarea[placeholder="Provide more details"]', 'I would like to see this feature added.');
    await page.getByRole('button', { name: 'Next' }).click();

    // Select sentiment
    await page.getByLabel('Positive').click();
    await page.getByRole('button', { name: 'Next' }).click();

    // Skip screenshot
    await page.getByRole('button', { name: 'Skip Screenshot' }).click();

    // Mock submission
    await page.route('**/api/feedback', async route => {
      const postData = route.request().postDataJSON();
      expect(postData.type).toBe('feature_request');
      expect(postData.sentiment).toBe('positive');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Feedback submitted successfully!' }),
      });
    });

    // Submit and verify
    await page.getByRole('button', { name: 'Submit Feedback' }).click();
    await expect(page.locator('text=Thank you for your feedback!')).toBeVisible();
  });

  test('completes full feedback flow - General Feedback', async ({ page }) => {
    await page.locator('.fixed.bottom-6.right-6').click();
    await expect(page.locator('text=Enhanced Feedback')).toBeVisible();

    // Select General Feedback
    await page.getByRole('button', { name: 'General Feedback' }).click();

    // Fill details
    await page.fill('input[placeholder="Summarize the issue"]', 'General thoughts');
    await page.fill('textarea[placeholder="Provide more details"]', 'Just some general feedback.');
    await page.getByRole('button', { name: 'Next' }).click();

    // Select neutral sentiment
    await page.getByLabel('Neutral').click();
    await page.getByRole('button', { name: 'Next' }).click();

    // Skip screenshot
    await page.getByRole('button', { name: 'Skip Screenshot' }).click();

    // Mock submission
    await page.route('**/api/feedback', async route => {
      const postData = route.request().postDataJSON();
      expect(postData.type).toBe('general');
      expect(postData.sentiment).toBe('neutral');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Feedback submitted successfully!' }),
      });
    });

    // Submit and verify
    await page.getByRole('button', { name: 'Submit Feedback' }).click();
    await expect(page.locator('text=Thank you for your feedback!')).toBeVisible();
  });

  test('handles offline submission with retry', async ({ page }) => {
    await page.locator('.fixed.bottom-6.right-6').click();
    await expect(page.locator('text=Enhanced Feedback')).toBeVisible();

    // Select type and fill form
    await page.getByRole('button', { name: 'General Feedback' }).click();
    await page.fill('input[placeholder="Summarize the issue"]', 'Offline test feedback');
    await page.fill('textarea[placeholder="Provide more details"]', 'Testing offline behavior.');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByLabel('Neutral').click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Skip Screenshot' }).click();

    // Go offline
    await page.context().setOffline(true);

    // Mock offline failure
    await page.route('**/api/feedback', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Network error' }),
      });
    });

    // Try to submit - should fail
    await page.getByRole('button', { name: 'Submit Feedback' }).click();
    await expect(page.locator('text=Failed to submit feedback. Retrying...')).toBeVisible({ timeout: 10000 });

    // Go back online
    await page.context().setOffline(false);

    // Mock successful retry
    await page.route('**/api/feedback', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Feedback submitted successfully after retry!' }),
      });
    });

    // Should eventually succeed
    await expect(page.locator('text=Feedback submitted successfully after retry!')).toBeVisible({ timeout: 15000 });
  });

  test('tracks user journey context', async ({ page }) => {
    await page.locator('.fixed.bottom-6.right-6').click();
    await expect(page.locator('text=Enhanced Feedback')).toBeVisible();

    await page.getByRole('button', { name: 'General Feedback' }).click();
    await page.fill('input[placeholder="Summarize the issue"]', 'Journey tracking test');
    await page.fill('textarea[placeholder="Provide more details"]', 'Testing user journey tracking.');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByLabel('Positive').click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Skip Screenshot' }).click();

    // Verify user journey is included in submission
    await page.route('**/api/feedback', async route => {
      const postData = route.request().postDataJSON();

      // User journey should be tracked
      expect(postData.userJourney).toBeDefined();
      expect(postData.userJourney).toBeTruthy();

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Feedback submitted successfully!' }),
      });
    });

    await page.getByRole('button', { name: 'Submit Feedback' }).click();
    await expect(page.locator('text=Thank you for your feedback!')).toBeVisible();
  });
});

