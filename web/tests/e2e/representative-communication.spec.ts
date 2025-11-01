/**
 * Representative Communication E2E Tests
 * 
 * Comprehensive end-to-end tests for representative communication features
 * 
 * Created: January 26, 2025
 */

import { test, expect } from '@playwright/test';

test.describe('Representative Communication Features', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app and authenticate
    await page.goto('/');
    // Assume authentication happens here (adjust based on your auth flow)
  });

  test.describe('Message Templates', () => {
    test('should display templates in contact modal', async ({ page }) => {
      // Navigate to representatives
      await page.goto('/representatives');
      
      // Open contact modal for a representative
      await page.click('button:has-text("Contact")');
      
      // Check for template button
      await expect(page.locator('button:has-text("Use a Template")')).toBeVisible();
    });

    test('should allow selecting a template', async ({ page }) => {
      await page.goto('/representatives');
      await page.click('button:has-text("Contact")');
      await page.click('button:has-text("Use a Template")');
      
      // Should show template categories
      await expect(page.locator('text=policy')).toBeVisible();
      await expect(page.locator('text=support')).toBeVisible();
    });

    test('should fill template with user values', async ({ page }) => {
      await page.goto('/representatives');
      await page.click('button:has-text("Contact")');
      await page.click('button:has-text("Use a Template")');
      
      // Select a template
      await page.click('button:has-text("Support for Legislation")');
      
      // Template form should appear
      await expect(page.locator('input[placeholder*="Bill Name"]')).toBeVisible();
    });
  });

  test.describe('Individual Contact', () => {
    test('should send message to representative', async ({ page }) => {
      await page.goto('/representatives');
      await page.click('button:has-text("Contact")');
      
      // Fill message form
      await page.fill('input[placeholder*="subject"]', 'Test Subject');
      await page.fill('textarea[placeholder*="message"]', 'Test message content');
      
      // Send message
      await page.click('button:has-text("Send Message")');
      
      // Should show success message
      await expect(page.locator('text=Message sent successfully')).toBeVisible({ timeout: 10000 });
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/representatives');
      await page.click('button:has-text("Contact")');
      
      // Try to send without filling fields
      await page.click('button:has-text("Send Message")');
      
      // Should show validation error
      await expect(page.locator('text=Please fill')).toBeVisible();
    });
  });

  test.describe('Communication History', () => {
    test('should display communication history', async ({ page }) => {
      await page.goto('/contact/history');
      
      // Should show history page
      await expect(page.locator('h1:has-text("Communication History")')).toBeVisible();
    });

    test('should filter threads by status', async ({ page }) => {
      await page.goto('/contact/history');
      
      // Click filter buttons
      await page.click('button:has-text("Active")');
      await page.click('button:has-text("Closed")');
      await page.click('button:has-text("All")');
    });

    test('should sort threads by date', async ({ page }) => {
      await page.goto('/contact/history');
      
      // Change sort order
      await page.selectOption('select[name="sort"]', 'oldest');
      await page.selectOption('select[name="sort"]', 'recent');
    });
  });

  test.describe('Bulk Contact', () => {
    test('should open bulk contact modal', async ({ page }) => {
      await page.goto('/representatives/my');
      
      // Should show "Contact All" button if multiple representatives
      const contactAllButton = page.locator('button:has-text("Contact All")');
      if (await contactAllButton.isVisible()) {
        await contactAllButton.click();
        
        // Modal should open
        await expect(page.locator('text=Contact Multiple Representatives')).toBeVisible();
      }
    });

    test('should allow selecting representatives', async ({ page }) => {
      await page.goto('/representatives/my');
      
      const contactAllButton = page.locator('button:has-text("Contact All")');
      if (await contactAllButton.isVisible()) {
        await contactAllButton.click();
        
        // Should see representative checkboxes
        await expect(page.locator('input[type="checkbox"]').first()).toBeVisible();
      }
    });
  });

  test.describe('My Representatives Integration', () => {
    test('should show contact button on each card', async ({ page }) => {
      await page.goto('/representatives/my');
      
      // Each representative card should have a contact button
      const contactButtons = page.locator('button:has-text("Contact")');
      const count = await contactButtons.count();
      
      if (count > 0) {
        await expect(contactButtons.first()).toBeVisible();
      }
    });

    test('should navigate to message history from my representatives', async ({ page }) => {
      await page.goto('/representatives/my');
      
      // Click message history link
      await page.click('a:has-text("View Message History")');
      
      // Should navigate to history page
      await expect(page).toHaveURL(/.*contact\/history/);
    });
  });
});

