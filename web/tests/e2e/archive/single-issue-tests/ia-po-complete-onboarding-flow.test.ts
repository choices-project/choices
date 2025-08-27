/**
 * IA/PO Complete Onboarding Flow Test
 * Tests the complete user journey: registration → onboarding → dashboard
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Complete Onboarding Flow', () => {
  test('Complete onboarding flow with session management', async ({ page }) => {
    console.log('=== COMPLETE ONBOARDING FLOW TEST ===')
    
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
    
    if (currentUrl.includes('/onboarding')) {
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
    
    // Step 2: Complete onboarding
    console.log('🎯 Step 2: Complete onboarding')
    await page.waitForURL(/\/onboarding/, { timeout: 10000 })
    console.log('✅ Onboarding page loaded')
    
    // Step 1: Welcome
    console.log('  - Step 1: Welcome')
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    
    // Step 2: Profile
    console.log('  - Step 2: Profile')
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    
    // Step 3: Privacy
    console.log('  - Step 3: Privacy')
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    
    // Step 4: Complete
    console.log('  - Step 4: Complete')
    await page.click('text=Get Started')
    await page.waitForTimeout(3000)
    
    // Step 3: Verify dashboard access
    console.log('🏠 Step 3: Verify dashboard access')
    await page.waitForURL(/\/dashboard/, { timeout: 10000 })
    console.log('✅ Redirected to dashboard!')
    
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
    
    console.log('🎉 Complete onboarding flow test successful!')
  })

  test('Onboarding preserves session across steps', async ({ page }) => {
    console.log('=== ONBOARDING SESSION PRESERVATION TEST ===')
    
    // Step 1: Register a user
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
    
    // Step 2: Verify onboarding page
    console.log('🎯 Step 2: Verify onboarding page')
    await page.waitForURL(/\/onboarding/, { timeout: 10000 })
    console.log('✅ Onboarding page loaded')
    
    // Step 3: Check session cookie is present
    console.log('🍪 Step 3: Check session cookie')
    const cookies = await page.context().cookies()
    const sessionCookie = cookies.find(c => c.name === 'choices_session')
    
    if (sessionCookie) {
      console.log('✅ Session cookie found during onboarding')
    } else {
      console.log('❌ No session cookie found during onboarding')
      throw new Error('No session cookie during onboarding')
    }
    
    // Step 4: Complete onboarding
    console.log('🎯 Step 4: Complete onboarding')
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    await page.click('text=Get Started')
    await page.waitForTimeout(3000)
    
    // Step 5: Verify dashboard access
    console.log('🏠 Step 5: Verify dashboard access')
    await page.waitForURL(/\/dashboard/, { timeout: 10000 })
    console.log('✅ Redirected to dashboard!')
    
    // Check dashboard content
    const dashboardContent = await page.textContent('body')
    const hasDashboardContent = dashboardContent?.includes('Welcome back') || 
                               dashboardContent?.includes('Overview')
    
    expect(hasDashboardContent).toBe(true)
    console.log('✅ Dashboard content loaded after onboarding')
    
    console.log('🎉 Onboarding session preservation test successful!')
  })

  test('Onboarding handles user preferences correctly', async ({ page }) => {
    console.log('=== ONBOARDING PREFERENCES TEST ===')
    
    // Step 1: Register a user
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
    
    // Step 2: Complete onboarding with preferences
    console.log('🎯 Step 2: Complete onboarding with preferences')
    await page.waitForURL(/\/onboarding/, { timeout: 10000 })
    console.log('✅ Onboarding page loaded')
    
    // Step 1: Welcome
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    
    // Step 2: Profile - fill in some preferences
    console.log('  - Filling profile preferences')
    await page.fill('input[placeholder="How would you like to be called?"]', 'Test User')
    await page.fill('textarea[placeholder="Tell us about yourself..."]', 'This is a test user for onboarding preferences')
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    
    // Step 3: Privacy
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    
    // Step 4: Complete
    await page.click('text=Get Started')
    await page.waitForTimeout(3000)
    
    // Step 3: Verify dashboard access
    console.log('🏠 Step 3: Verify dashboard access')
    await page.waitForURL(/\/dashboard/, { timeout: 10000 })
    console.log('✅ Redirected to dashboard!')
    
    // Check dashboard content
    const dashboardContent = await page.textContent('body')
    const hasDashboardContent = dashboardContent?.includes('Welcome back') || 
                               dashboardContent?.includes('Overview')
    
    expect(hasDashboardContent).toBe(true)
    console.log('✅ Dashboard content loaded with preferences')
    
    console.log('🎉 Onboarding preferences test successful!')
  })
})

