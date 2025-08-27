/**
 * IA/PO Login Debug Test
 * Debug the login process
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Login Debug', () => {
  test('Debug login process', async ({ page }) => {
    console.log('=== LOGIN DEBUG TEST ===')
    
    // Step 1: Register a user first
    console.log('📝 Step 1: Register a user')
    await page.goto('/register')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    const uniqueUsername = `test_${Math.random().toString(36).substr(2, 8)}`
    const testPassword = 'TestPassword123!'
    
    await page.fill('input[name="username"]', uniqueUsername)
    await page.click('text=Add password')
    await page.fill('input[name="password"]', testPassword)
    await page.fill('input[name="confirmPassword"]', testPassword)
    await page.click('button[type="submit"]')
    await page.waitForTimeout(5000)
    
    // Check if registration was successful
    const currentUrl = page.url()
    console.log(`URL after registration: ${currentUrl}`)
    
    if (!currentUrl.includes('/dashboard')) {
      console.log('❌ Registration failed')
      throw new Error('Registration failed')
    }
    
    console.log('✅ Registration successful')
    
    // Step 2: Logout
    console.log('🚪 Step 2: Logout')
    await page.click('text=Logout')
    await page.waitForTimeout(2000)
    
    // Should be redirected to login
    await page.waitForURL(/\/login/, { timeout: 10000 })
    console.log('✅ Redirected to login after logout')
    
    // Step 3: Login
    console.log('🔐 Step 3: Login')
    await page.fill('input[name="username"]', uniqueUsername)
    await page.fill('input[name="password"]', testPassword)
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    
    // Check if login was successful
    const loginUrl = page.url()
    console.log(`URL after login: ${loginUrl}`)
    
    if (loginUrl.includes('/dashboard')) {
      console.log('✅ Login successful - redirected to dashboard')
      
      // Check dashboard content
      const dashboardContent = await page.textContent('body')
      const hasDashboardContent = dashboardContent?.includes('Welcome back') || 
                                 dashboardContent?.includes('Overview') ||
                                 dashboardContent?.includes('My Polls')
      
      console.log(`Dashboard content loaded: ${hasDashboardContent}`)
      expect(hasDashboardContent).toBe(true)
    } else {
      console.log('❌ Login failed')
      console.log('Redirected to:', loginUrl)
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/login-debug.png' })
      throw new Error('Login failed')
    }
    
    console.log('🎉 Login debug successful!')
  })
})

