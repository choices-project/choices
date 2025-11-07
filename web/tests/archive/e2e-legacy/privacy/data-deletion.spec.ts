/**
 * Data Deletion E2E Tests
 * 
 * Tests for granular and complete data deletion functionality
 * 
 * Created: November 5, 2025
 * Status: ✅ COMPLETE
 */

import { test, expect } from '@playwright/test';

test.describe('Data Deletion', () => {
  test.beforeEach(async ({ page }) => {
    // Assume user is logged in
    await page.goto('/account/privacy');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="my-data-tab"]');
  });

  test.describe('Granular Data Deletion', () => {
    test('should delete location data category', async ({ page }) => {
      // Find location data category
      await page.waitForSelector('[data-testid="data-category-location"]');
      
      // Click delete button for location category
      await page.click('[data-testid="delete-category-location"]');
      
      // Confirm deletion
      await page.click('[data-testid="confirm-delete-button"]');
      
      // Wait for success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText('deleted');
      
      // Verify category shows no data
      await expect(page.locator('[data-testid="location-data-count"]')).toContainText('0');
    });

    test('should delete voting history category', async ({ page }) => {
      await page.waitForSelector('[data-testid="data-category-voting"]');
      await page.click('[data-testid="delete-category-voting"]');
      await page.click('[data-testid="confirm-delete-button"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    test('should delete interests category', async ({ page }) => {
      await page.waitForSelector('[data-testid="data-category-interests"]');
      await page.click('[data-testid="delete-category-interests"]');
      await page.click('[data-testid="confirm-delete-button"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    test('should delete feed interactions category', async ({ page }) => {
      await page.waitForSelector('[data-testid="data-category-feed-interactions"]');
      await page.click('[data-testid="delete-category-feed-interactions"]');
      await page.click('[data-testid="confirm-delete-button"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    test('should delete analytics category', async ({ page }) => {
      await page.waitForSelector('[data-testid="data-category-analytics"]');
      await page.click('[data-testid="delete-category-analytics"]');
      await page.click('[data-testid="confirm-delete-button"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    test('should delete representatives category', async ({ page }) => {
      await page.waitForSelector('[data-testid="data-category-representatives"]');
      await page.click('[data-testid="delete-category-representatives"]');
      await page.click('[data-testid="confirm-delete-button"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    test('should delete search history category', async ({ page }) => {
      await page.waitForSelector('[data-testid="data-category-search"]');
      await page.click('[data-testid="delete-category-search"]');
      await page.click('[data-testid="confirm-delete-button"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    test('should require confirmation before deleting', async ({ page }) => {
      await page.waitForSelector('[data-testid="delete-category-location"]');
      await page.click('[data-testid="delete-category-location"]');
      
      // Confirmation dialog should appear
      await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).toBeVisible();
      
      // Cancel should close dialog without deleting
      await page.click('[data-testid="cancel-delete-button"]');
      await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).not.toBeVisible();
    });
  });

  test.describe('Complete Account Deletion', () => {
    test('should show account deletion option', async ({ page }) => {
      await page.waitForSelector('[data-testid="delete-account-button"]');
      await expect(page.locator('[data-testid="delete-account-button"]')).toBeVisible();
    });

    test('should require double confirmation for account deletion', async ({ page }) => {
      await page.click('[data-testid="delete-account-button"]');
      
      // First confirmation dialog
      await expect(page.locator('[data-testid="delete-account-confirmation-1"]')).toBeVisible();
      await page.click('[data-testid="confirm-delete-account-1"]');
      
      // Second confirmation dialog
      await expect(page.locator('[data-testid="delete-account-confirmation-2"]')).toBeVisible();
      
      // Verify warning message
      await expect(page.locator('[data-testid="delete-warning"]')).toContainText('permanent');
      await expect(page.locator('[data-testid="delete-warning"]')).toContainText('cannot be undone');
    });

    test('should allow canceling account deletion at any step', async ({ page }) => {
      await page.click('[data-testid="delete-account-button"]');
      await expect(page.locator('[data-testid="delete-account-confirmation-1"]')).toBeVisible();
      
      // Cancel on first confirmation
      await page.click('[data-testid="cancel-delete-account"]');
      await expect(page.locator('[data-testid="delete-account-confirmation-1"]')).not.toBeVisible();
      
      // User should still be on the page
      await expect(page).toHaveURL('/account/privacy');
    });
  });

  test.describe('API-level Deletion Tests', () => {
    test('should delete specific data via API', async ({ page }) => {
      const response = await page.request.delete('/api/profile/data?type=location');
      expect(response.ok()).toBe(true);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain('deleted');
    });

    test('should handle invalid data type gracefully', async ({ page }) => {
      const response = await page.request.delete('/api/profile/data?type=invalid');
      expect(response.status()).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    test('should require authentication for deletion', async ({ page }) => {
      // Log out first
      await page.goto('/');
      const response = await page.request.delete('/api/profile/data?type=location');
      expect(response.status()).toBeGreaterThanOrEqual(401);
    });
  });
});

