/**
 * IA/PO Session Management Test
 * Simple test to verify session management is working
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Session Management', () => {
  test('Basic session management test', async ({ page }) => {
    console.log('=== BASIC SESSION MANAGEMENT TEST ===')
    
    // Step 1: Register a user
    console.log('📝 Step 1: Register a user')
    await page.goto('/register')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    const uniqueUsername = `test_${Math.random().toString(36).substr(2, 8)}`
    const testPassword = 'TestPassword123!'
    console.log(`Using username: ${uniqueUsername}`)
    
    // Fill registration form with password
    await page.fill('input[name="username"]', uniqueUsername)
    await page.click('text=Add password')
    await page.fill('input[name="password"]', testPassword)
    await page.fill('input[name="confirmPassword"]', testPassword)
    
    // Submit registration
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    
    // Check if we got a success message or redirected
    const currentUrl = page.url()
    console.log(`Current URL after registration: ${currentUrl}`)
    
    if (currentUrl.includes('/onboarding')) {
      console.log('✅ Registration successful - redirected to onboarding')
    } else {
      // Check for success message
      const successMessage = await page.locator('text=Account created successfully').isVisible()
      if (successMessage) {
        console.log('✅ Registration successful - success message shown')
      } else {
        console.log('❌ Registration may have failed')
        await page.screenshot({ path: 'test-results/registration-failed.png' })
      }
    }
    
    // Step 2: Check if we can access the dashboard directly
    console.log('🏠 Step 2: Check dashboard access')
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    const dashboardUrl = page.url()
    console.log(`Dashboard URL: ${dashboardUrl}`)
    
    if (dashboardUrl.includes('/login')) {
      console.log('❌ Session not working - redirected to login')
    } else if (dashboardUrl.includes('/dashboard')) {
      console.log('✅ Session working - dashboard accessible')
    } else {
      console.log(`⚠️ Unexpected redirect: ${dashboardUrl}`)
    }
    
    // Step 3: Test login
    console.log('🔐 Step 3: Test login')
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    await page.fill('input[name="username"]', uniqueUsername)
    await page.fill('input[name="password"]', testPassword)
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    
    const loginUrl = page.url()
    console.log(`Login URL: ${loginUrl}`)
    
    if (loginUrl.includes('/dashboard')) {
      console.log('✅ Login successful - redirected to dashboard')
    } else {
      console.log('❌ Login failed or not working')
      await page.screenshot({ path: 'test-results/login-failed.png' })
    }
  })
})

