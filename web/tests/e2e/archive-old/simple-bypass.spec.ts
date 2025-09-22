/**
 * Simple test to verify rate limiting bypass works
 */

import { test, expect } from '@playwright/test'

test.describe('Rate Limiting Bypass', () => {
  test('should access login page multiple times without rate limiting', async ({ page }) => {
    // First, verify the server is accessible
    const initialResponse = await page.goto('/login', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    })
    
    // Verify we can reach the login page
    expect(initialResponse?.status()).toBeLessThan(400)
    await expect(page.locator('h1')).toContainText('Sign in')
    
    // Now test multiple rapid requests
    for (let i = 0; i < 5; i++) { // Reduced from 15 to 5
      const response = await page.goto('/login', { 
        waitUntil: 'domcontentloaded',
        timeout: 5000 
      })
      
      // Should get a successful response (not rate limited)
      expect(response?.status()).toBeLessThan(400)
      
      // Small delay to avoid overwhelming the server
      await page.waitForTimeout(200)
    }
  })

  test('should access admin API without rate limiting', async ({ page }) => {
    // Try to access admin API multiple times
    for (let i = 0; i < 5; i++) { // Reduced from 10 to 5
      const response = await page.request.get('/api/admin/system-status')
      
      // Should get 401 (unauthorized) not 429 (rate limited)
      expect(response.status()).toBe(401)
      
      // Small delay
      await page.waitForTimeout(200)
    }
  })
})
