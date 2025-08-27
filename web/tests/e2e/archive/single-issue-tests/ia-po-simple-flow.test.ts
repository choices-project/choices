/**
 * IA/PO Simple Flow Test
 * Tests the basic registration → onboarding → dashboard flow
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Simple Flow', () => {
  test('Complete registration and onboarding flow', async ({ page }) => {
    // Step 1: Navigate to registration page
    console.log('🔍 Navigating to registration page...')
    await page.goto('/register')
    await page.waitForLoadState('networkidle')
    
    // Verify we're on the registration page
    const currentUrl = page.url()
    console.log('🔍 Current URL:', currentUrl)
    expect(currentUrl).toContain('/register')
    
    // Wait for registration form to be visible
    await page.waitForSelector('form[action="/api/auth/register-ia"]', { timeout: 10000 })
    await page.waitForSelector('input[name="username"]', { timeout: 10000 })
    await page.waitForSelector('input[name="email"]', { timeout: 10000 })
    
    const timestamp = Date.now()
    const uniqueUsername = `test_${timestamp.toString().slice(-6)}`
    const testEmail = `test_${timestamp}_${Math.random().toString(36).substring(2, 8)}@example.com`
    
    console.log('🔍 Registering user:', uniqueUsername)
    
    // Fill registration form
    await page.fill('input[name="username"]', uniqueUsername)
    await page.fill('input[name="email"]', testEmail)
    
    // Submit form and wait for redirect
    console.log('🔍 Submitting registration form...')
    await Promise.all([
      page.waitForURL('**/onboarding', { timeout: 15000 }),
      page.click('button[type="submit"]')
    ])
    
    // Verify we're on onboarding page
    const onboardingUrl = page.url()
    console.log('🔍 Onboarding URL:', onboardingUrl)
    expect(onboardingUrl).toContain('/onboarding')
    
    // Step 2: Complete onboarding
    console.log('🔍 Starting onboarding completion...')
    
    // Wait for onboarding content to load
    await page.waitForSelector('text=Welcome to Choices', { timeout: 10000 })
    
    // Navigate through onboarding steps
    console.log('🔍 Completing step 1...')
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    
    console.log('🔍 Completing step 2...')
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    
    console.log('🔍 Completing step 3...')
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    
    // Wait for "Get Started" button to be visible
    await page.waitForSelector('button[type="submit"]', { timeout: 10000 })
    
    // Click "Get Started" and wait for redirect to dashboard
    console.log('🔍 Clicking Get Started...')
    await Promise.all([
      page.waitForURL('**/dashboard', { timeout: 15000 }),
      page.click('button[type="submit"]')
    ])
    
    // Verify we're on dashboard
    const dashboardUrl = page.url()
    console.log('🔍 Dashboard URL:', dashboardUrl)
    expect(dashboardUrl).toContain('/dashboard')
    
    // Verify dashboard content is loaded
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 10000 })
    console.log('✅ Successfully completed registration and onboarding flow')
  })
})
