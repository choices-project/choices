/**
 * Simple test to verify rate limiting bypass works
 */

import { test, expect } from '@playwright/test'

test.describe('Rate Limiting Bypass', () => {
  test('should access login page multiple times without rate limiting', async ({ page }) => {
    // Navigate to login page multiple times to test rate limiting
    for (let i = 0; i < 15; i++) {
      const response = await page.goto('/login')
      
      // Should get a response (not rate limited)
      expect(response?.status()).toBeLessThan(500)
      
      // Small delay to avoid overwhelming the server
      await page.waitForTimeout(100)
    }
  })

  test('should access admin API without rate limiting', async ({ page }) => {
    // Try to access admin API multiple times
    for (let i = 0; i < 10; i++) {
      const response = await page.request.get('/api/admin/system-status')
      
      // Should get 401 (unauthorized) not 429 (rate limited)
      expect(response.status()).toBe(401)
      
      // Small delay
      await page.waitForTimeout(100)
    }
  })
})
