/**
 * IA/PO Dashboard Authentication Test
 * Tests the complete authentication flow with proper session management
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Dashboard Authentication', () => {
  test('Complete authentication flow with dashboard access', async ({ page }) => {
    console.log('=== COMPLETE DASHBOARD AUTHENTICATION TEST ===')
    
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
    await page.waitForTimeout(5000)
    
    // Check for success message or redirect
    const currentUrl = page.url()
    console.log(`URL after registration: ${currentUrl}`)
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Registration successful - redirected to dashboard')
    } else if (currentUrl.includes('/onboarding')) {
      console.log('✅ Registration successful - redirected to onboarding')
    } else {
      const successMessage = await page.locator('text=Account created successfully').isVisible()
      if (successMessage) {
        console.log('✅ Registration successful - success message shown')
      } else {
        console.log('❌ Registration may have failed')
        await page.screenshot({ path: 'test-results/registration-failed.png' })
        throw new Error('Registration failed')
      }
    }
    
    // Step 2: Check if we're already on dashboard or need to complete onboarding
    console.log('🎯 Step 2: Check dashboard access')
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Already on dashboard after registration!')
    } else {
      // Complete onboarding if needed
      console.log('🎯 Completing onboarding...')
      await page.waitForURL(/\/onboarding/, { timeout: 10000 })
      console.log('✅ Onboarding page loaded')
      
      // Complete onboarding steps
      await page.click('text=Next')
      await page.waitForTimeout(1000)
      await page.click('text=Next')
      await page.waitForTimeout(1000)
      await page.click('text=Next')
      await page.waitForTimeout(1000)
      await page.click('text=Get Started')
      await page.waitForTimeout(3000)
      
      // Should be redirected to dashboard
      await page.waitForURL(/\/dashboard/, { timeout: 10000 })
      console.log('✅ Redirected to dashboard!')
    }
    
    // Step 3: Verify dashboard access
    console.log('🏠 Step 3: Verify dashboard access')
    
    // Check if dashboard content is loaded
    const dashboardContent = await page.textContent('body')
    const hasDashboardContent = dashboardContent?.includes('Welcome back') || 
                               dashboardContent?.includes('Overview') ||
                               dashboardContent?.includes('My Polls')
    
    console.log(`Dashboard content loaded: ${hasDashboardContent}`)
    expect(hasDashboardContent).toBe(true)
    
    // Step 4: Test logout
    console.log('🚪 Step 4: Test logout')
    await page.click('text=Logout')
    await page.waitForTimeout(2000)
    
    // Should be redirected to login
    await page.waitForURL(/\/login/, { timeout: 10000 })
    console.log('✅ Redirected to login after logout')
    
    // Step 5: Test login and dashboard access
    console.log('🔐 Step 5: Test login and dashboard access')
    await page.fill('input[name="username"]', uniqueUsername)
    await page.fill('input[name="password"]', testPassword)
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    
    // Should be redirected to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 })
    console.log('✅ Redirected to dashboard after login')
    
    // Verify dashboard content again
    const dashboardContent2 = await page.textContent('body')
    const hasDashboardContent2 = dashboardContent2?.includes('Welcome back') || 
                                dashboardContent2?.includes('Overview') ||
                                dashboardContent2?.includes('My Polls')
    
    console.log(`Dashboard content loaded after login: ${hasDashboardContent2}`)
    expect(hasDashboardContent2).toBe(true)
    
    console.log('🎉 Complete dashboard authentication test successful!')
  })

  test('Dashboard redirects unauthenticated users to login', async ({ page }) => {
    console.log('=== UNAUTHENTICATED DASHBOARD ACCESS TEST ===')
    
    // Try to access dashboard without authentication
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    
    // Should be redirected to login
    const currentUrl = page.url()
    console.log(`URL after accessing dashboard: ${currentUrl}`)
    
    expect(currentUrl).toContain('/login')
    console.log('✅ Unauthenticated users redirected to login')
  })

  test('Session persists across page refreshes', async ({ page }) => {
    console.log('=== SESSION PERSISTENCE TEST ===')
    
    // Step 1: Register and login
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
    
    // Complete onboarding quickly
    await page.waitForURL(/\/onboarding/, { timeout: 10000 })
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    await page.click('text=Get Started')
    await page.waitForTimeout(3000)
    
    // Verify dashboard access
    await page.waitForURL(/\/dashboard/, { timeout: 10000 })
    console.log('✅ Dashboard accessible after registration')
    
    // Step 2: Refresh the page
    console.log('🔄 Refreshing dashboard page')
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    
    // Should still be on dashboard
    const currentUrl = page.url()
    console.log(`URL after refresh: ${currentUrl}`)
    
    expect(currentUrl).toContain('/dashboard')
    console.log('✅ Session persists after page refresh')
    
    // Step 3: Check dashboard content is still loaded
    const dashboardContent = await page.textContent('body')
    const hasDashboardContent = dashboardContent?.includes('Welcome back') || 
                               dashboardContent?.includes('Overview')
    
    expect(hasDashboardContent).toBe(true)
    console.log('✅ Dashboard content loaded after refresh')
  })
})
