/**
 * Server Actions Authentication Flow Test
 * Comprehensive testing of registration → onboarding → dashboard flow using Server Actions
 */

import { test, expect } from '@playwright/test'

test.describe('Server Actions Authentication Flow', () => {
  test('Complete registration and onboarding flow with Server Actions', async ({ page }) => {
    // Generate unique test data
    const timestamp = Date.now()
    const uniqueUsername = `testuser_${timestamp.toString().slice(-6)}`
    const testEmail = `test_${timestamp}_${Math.random().toString(36).substring(2, 8)}@example.com`
    
    console.log('🧪 Testing Server Actions: Registration flow')
    
    // Step 1: Registration
    await page.goto('/register')
    await page.waitForLoadState('networkidle')
    
    // Verify we're on the registration page
    expect(page.url()).toContain('/register')
    
    // Wait for form elements
    await page.waitForSelector('form[action]', { timeout: 10000 })
    await page.waitForSelector('input[name="username"]', { timeout: 10000 })
    await page.waitForSelector('input[name="email"]', { timeout: 10000 })
    
    // Fill registration form
    await page.fill('input[name="username"]', uniqueUsername)
    await page.fill('input[name="email"]', testEmail)
    
    // Submit form (triggers server action)
    await Promise.all([
      page.waitForURL('**/onboarding', { timeout: 10000 }),
      page.click('button[type="submit"]')
    ])
    
    // Verify redirect to onboarding
    expect(page.url()).toContain('/onboarding')
    console.log('✅ Registration successful - redirected to onboarding')
    
    // Step 2: Onboarding
    console.log('🧪 Testing Server Actions: Onboarding flow')
    
    // Wait for onboarding page to load
    await page.waitForLoadState('networkidle')
    
    // Verify onboarding elements are present
    await expect(page.locator('text=Welcome to Choices')).toBeVisible()
    await expect(page.locator('text=Privacy & Security')).toBeVisible()
    await expect(page.locator('text=Personalization')).toBeVisible()
    await expect(page.locator('text=You\'re All Set!')).toBeVisible()
    
    // Navigate through onboarding steps
    for (let step = 1; step <= 3; step++) {
      await page.click('button:has-text("Next")')
      await page.waitForTimeout(500) // Brief pause between steps
    }
    
    // On step 4, complete onboarding
    await page.waitForSelector('form[action]', { timeout: 10000 })
    
    // Submit onboarding completion (triggers server action)
    await Promise.all([
      page.waitForURL('**/dashboard', { timeout: 10000 }),
      page.click('button[type="submit"]')
    ])
    
    // Verify redirect to dashboard
    expect(page.url()).toContain('/dashboard')
    console.log('✅ Onboarding completed - redirected to dashboard')
    
    // Step 3: Dashboard Access
    console.log('🧪 Testing Server Actions: Dashboard access')
    
    // Verify dashboard is accessible
    await page.waitForLoadState('networkidle')
    
    // Check for dashboard content
    await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 10000 })
    
    // Verify session cookie is set
    const cookies = await page.context().cookies()
    const sessionCookie = cookies.find(c => c.name === 'choices_session')
    expect(sessionCookie).toBeDefined()
    expect(sessionCookie?.value).toBeTruthy()
    
    console.log('✅ Dashboard access successful - session cookie verified')
  })
  
  test('Server action validation - invalid username format', async ({ page }) => {
    console.log('🧪 Testing Server Actions: Input validation')
    
    await page.goto('/register')
    
    // Test invalid username format
    await page.fill('input[name="username"]', 'invalid@username')
    await page.fill('input[name="email"]', 'test@example.com')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should stay on registration page (no redirect)
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('/register')
    
    console.log('✅ Input validation working - invalid username rejected')
  })
  
  test('Server action validation - duplicate username', async ({ page }) => {
    console.log('🧪 Testing Server Actions: Duplicate username validation')
    
    // First, create a user
    const timestamp = Date.now()
    const uniqueUsername = `duplicate_${timestamp.toString().slice(-6)}`
    const testEmail1 = `test1_${timestamp}@example.com`
    const testEmail2 = `test2_${timestamp}@example.com`
    
    // Register first user
    await page.goto('/register')
    await page.fill('input[name="username"]', uniqueUsername)
    await page.fill('input[name="email"]', testEmail1)
    await Promise.all([
      page.waitForURL('**/onboarding', { timeout: 10000 }),
      page.click('button[type="submit"]')
    ])
    
    // Go back to registration and try duplicate username
    await page.goto('/register')
    await page.fill('input[name="username"]', uniqueUsername)
    await page.fill('input[name="email"]', testEmail2)
    await page.click('button[type="submit"]')
    
    // Should stay on registration page
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('/register')
    
    console.log('✅ Duplicate username validation working')
  })
  
  test('Cross-browser compatibility - Server Actions', async ({ page }) => {
    console.log('🧪 Testing Server Actions: Cross-browser compatibility')
    
    const timestamp = Date.now()
    const uniqueUsername = `crossbrowser_${timestamp.toString().slice(-6)}`
    const testEmail = `crossbrowser_${timestamp}@example.com`
    
    // Test registration flow
    await page.goto('/register')
    await page.fill('input[name="username"]', uniqueUsername)
    await page.fill('input[name="email"]', testEmail)
    
    // Submit and verify redirect
    await Promise.all([
      page.waitForURL('**/onboarding', { timeout: 10000 }),
      page.click('button[type="submit"]')
    ])
    
    expect(page.url()).toContain('/onboarding')
    
    // Complete onboarding
    for (let step = 1; step <= 3; step++) {
      await page.click('button:has-text("Next")')
      await page.waitForTimeout(500)
    }
    
    await Promise.all([
      page.waitForURL('**/dashboard', { timeout: 10000 }),
      page.click('button[type="submit"]')
    ])
    
    expect(page.url()).toContain('/dashboard')
    
    console.log('✅ Cross-browser compatibility verified')
  })
})
