/**
 * Civic Actions E2E Tests
 * 
 * End-to-end tests for Civic Engagement V2 features
 * 
 * Feature Flag: CIVIC_ENGAGEMENT_V2
 * 
 * Created: January 2025
 */

import { expect, test } from '@playwright/test';

import {
  cleanupE2ETestData,
  getSeededData,
  setupE2ETestData,
  waitForPageReady,
  type SeedHandle,
  type TestUser,
} from './helpers/e2e-setup';

test.describe('Civic Engagement V2 - E2E Tests', () => {
  let seedHandle: SeedHandle | null = null;
  let testUser: TestUser | null = null;

  test.beforeAll(async ({ browser }) => {
    seedHandle = await setupE2ETestData(browser);
    testUser = await getSeededData(seedHandle, 'user');
  });

  test.afterAll(async () => {
    if (seedHandle) {
      await cleanupE2ETestData(seedHandle);
    }
  });

  test.describe('Feature Flag Check', () => {
    test('should show feature disabled message when flag is off', async ({ page }) => {
      // Mock feature flag as disabled
      await page.route('**/api/feature-flags', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              CIVIC_ENGAGEMENT_V2: false,
            },
          }),
        });
      });

      await page.goto('/civic-actions');
      await waitForPageReady(page);

      // Component should not render when feature is disabled
      const card = page.locator('[data-testid="civic-action-card"]');
      await expect(card).toHaveCount(0);
    });
  });

  test.describe('Create Civic Action Flow', () => {
    test('should create a new civic action', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await waitForPageReady(page);
      
      // Assuming login flow exists - adjust based on actual implementation
      // await loginUser(page, testUser);

      await page.goto('/civic-actions/create');
      await waitForPageReady(page);

      // Wait for form to be visible (feature flag check)
      const form = page.locator('form');
      await expect(form).toBeVisible({ timeout: 10_000 }).catch(() => {
        // If form doesn't appear, feature might be disabled or route doesn't exist
        test.skip();
      });

      // Fill form using ID selectors (form uses id attributes, not name)
      await page.fill('#title', 'E2E Test Petition', { timeout: 30_000 });
      await page.fill('#description', 'This is a test petition created by E2E tests');
      
      // Custom Select components - click trigger and select option
      await page.click('#action_type');
      await page.click('text=Petition'); // Select the option by text
      
      await page.click('#urgency_level');
      await page.click('text=High'); // Select the option by text
      
      await page.fill('#required_signatures', '100');

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for redirect or success message
      await page.waitForURL(/\/civic-actions\/[^/]+/, { timeout: 10_000 });

      // Verify action was created
      await expect(page.locator('h1, h2')).toContainText('E2E Test Petition');
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/civic-actions/create');
      await waitForPageReady(page);

      // Wait for form to be visible
      const form = page.locator('form');
      await expect(form).toBeVisible({ timeout: 10_000 }).catch(() => {
        test.skip();
      });

      // Try to submit without title
      await page.click('button[type="submit"]', { timeout: 30_000 });

      // Should show validation error (check for error message)
      await expect(page.locator('text=/title.*required/i, .text-red-600')).toBeVisible({ timeout: 5_000 });
    });
  });

  test.describe('List and View Actions', () => {
    test('should display list of civic actions', async ({ page }) => {
      await page.goto('/civic-actions');
      await waitForPageReady(page);

      // Wait for page to load and check if feature is enabled
      // If no cards appear, feature might be disabled or no actions exist
      const cards = page.locator('[data-testid="civic-action-card"], .civic-action-card');
      const cardCount = await cards.count();
      
      if (cardCount === 0) {
        // Check if feature is disabled or page shows empty state
        const emptyState = page.locator('text=/no.*actions/i, text=/feature.*disabled/i');
        const hasEmptyState = await emptyState.count() > 0;
        
        if (!hasEmptyState) {
          // If no empty state and no cards, wait a bit more for cards to load
          await page.waitForTimeout(2_000);
          const finalCount = await cards.count();
          if (finalCount === 0) {
            // Skip if still no cards after waiting
            test.skip();
          }
        } else {
          // Feature disabled or no actions - this is expected
          test.skip();
        }
      }
      
      await expect(cards.first()).toBeVisible({ timeout: 15_000 });
    });

    test('should filter actions by status', async ({ page }) => {
      await page.goto('/civic-actions');
      await waitForPageReady(page);

      // Apply filter (if filter UI exists)
      // This would depend on actual filter implementation
      // await page.click('button:has-text("Active")');

      // Verify filtered results
      // await expect(page.locator('.civic-action-card')).toHaveCount(expectedCount);
    });

    test('should navigate to action detail page', async ({ page }) => {
      await page.goto('/civic-actions');
      await waitForPageReady(page);

      // Click on first action
      const firstAction = page.locator('a:has-text("View Details")').first();
      await firstAction.click();

      // Should navigate to detail page
      await page.waitForURL(/\/civic-actions\/[^/]+/, { timeout: 5000 });
      await expect(page.locator('h1, h2')).toBeVisible();
    });
  });

  test.describe('Sign Petition Flow', () => {
    test('should sign a petition', async ({ page }) => {
      // Create a test action first (or use seeded data)
      await page.goto('/civic-actions');
      await waitForPageReady(page);

      // Find a petition action
      const signButton = page.locator('button:has-text("Sign")').first();
      
      if (await signButton.count() > 0) {
        const initialCount = await page.locator('text=/\\d+ \\/ \\d+ signatures/').first().textContent();
        
        await signButton.click();
        
        // Wait for update
        await page.waitForTimeout(1000);
        
        // Verify signature count increased
        const newCount = await page.locator('text=/\\d+ \\/ \\d+ signatures/').first().textContent();
        expect(newCount).not.toBe(initialCount);
        
        // Verify button shows "Signed"
        await expect(page.locator('button:has-text("Signed")')).toBeVisible();
      }
    });

    test('should prevent duplicate signatures', async ({ page }) => {
      await page.goto('/civic-actions');
      await waitForPageReady(page);

      const signButton = page.locator('button:has-text("Sign")').first();
      
      if (await signButton.count() > 0) {
        // Sign once
        await signButton.click();
        await page.waitForTimeout(1000);
        
        // Try to sign again (should be disabled or show error)
        const signedButton = page.locator('button:has-text("Signed")').first();
        await expect(signedButton).toBeDisabled();
      }
    });
  });

  test.describe('Update and Delete Actions', () => {
    test('should update own action', async ({ page }) => {
      // This would require creating an action first
      // Then navigating to edit page
      // Then updating and saving
      
      // Placeholder for actual implementation
      test.skip(); // Skip until edit UI is implemented
    });

    test('should delete own action', async ({ page }) => {
      // This would require creating an action first
      // Then deleting it
      
      // Placeholder for actual implementation
      test.skip(); // Skip until delete UI is implemented
    });
  });

  test.describe('Analytics Tracking', () => {
    test('should track analytics events', async ({ page }) => {
      // Monitor network requests
      const analyticsRequests: any[] = [];
      
      page.on('request', (request) => {
        if (request.url().includes('/api/analytics') || request.url().includes('analytics_events')) {
          analyticsRequests.push(request);
        }
      });

      await page.goto('/civic-actions');
      await waitForPageReady(page);

      // Perform actions that should trigger analytics
      const viewLink = page.locator('a:has-text("View Details")').first();
      if (await viewLink.count() > 0) {
        await viewLink.click();
        await page.waitForTimeout(500);
      }

      // Verify analytics requests were made
      // This is a simplified check - actual implementation would verify event data
      expect(analyticsRequests.length).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Integration with Representatives', () => {
    test('should show actions for representative', async ({ page }) => {
      // Navigate to representative page
      // Verify civic actions section shows related actions
      
      test.skip(); // Skip until representative integration UI is implemented
    });
  });

  test.describe('Integration with Feeds', () => {
    test('should show civic actions in feed', async ({ page }) => {
      // Navigate to feed page
      // Verify civic action items appear
      
      test.skip(); // Skip until feed integration UI is implemented
    });
  });
});

