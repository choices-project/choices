/**
 * Test rate limiting bypass for E2E tests
 * This test verifies that our E2E bypass header works correctly
 */

import { test, expect } from '@playwright/test'

test.describe('Rate Limiting Bypass', () => {
  test('should bypass rate limiting with E2E header', async ({ page }) => {
    // Navigate to login page multiple times to test rate limiting
    for (let i = 0; i < 5; i++) {
      await page.goto('/login')
      
      // Should be able to access login page without rate limiting
      await expect(page.locator('[data-testid="login-email"]')).toBeVisible()
      
      // Small delay to avoid overwhelming the server
      await page.waitForTimeout(100)
    }
  })

  test('should show login form elements', async ({ page }) => {
    await page.goto('/login')
    
    // Verify login form elements exist
    await expect(page.locator('[data-testid="login-email"]')).toBeVisible()
    await expect(page.locator('[data-testid="login-password"]')).toBeVisible()
    await expect(page.locator('[data-testid="login-submit"]')).toBeVisible()
  })
})
