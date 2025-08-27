/**
 * IA/PO Complete Authentication Flow Test
 * Tests the complete user journey: registration → login → dashboard
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Complete Authentication Flow', () => {
  test('Complete authentication flow with session management', async ({ page }) => {
    console.log('=== COMPLETE AUTHENTICATION FLOW TEST ===')
    
    // Step 1: Registration
    console.log('📝 Step 1: Registration')
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
    
    // Wait for success and redirect to onboarding
    try {
      await page.waitForSelector('text=Account created successfully', { timeout: 15000 })
      console.log('✅ Registration successful!')
    } catch (error) {
      console.log('❌ Registration failed or success message not found')
      // Check if we're on onboarding page (might have redirected already)
      const currentUrl = page.url()
      if (currentUrl.includes('/onboarding')) {
        console.log('✅ Registration successful (redirected to onboarding)!')
      } else {
        throw error
      }
    }
    
    // Step 2: Complete Onboarding
    console.log('🎯 Step 2: Complete Onboarding')
    await page.waitForURL(/\/onboarding/, { timeout: 10000 })
    console.log('✅ Onboarding page loaded!')
    
    // Complete onboarding steps
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    await page.click('text=Get Started')
    await page.waitForTimeout(2000)
    
    // Should be redirected to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 })
    console.log('✅ Redirected to dashboard!')
    
    // Check if we're authenticated on dashboard
    const dashboardContent = await page.textContent('body')
    const isAuthenticated = !dashboardContent?.includes('login') && !dashboardContent?.includes('register')
    console.log(`Dashboard accessible: ${isAuthenticated}`)
    expect(isAuthenticated).toBe(true)
    
    // Step 3: Logout
    console.log('🚪 Step 3: Logout')
    await page.click('text=Logout')
    await page.waitForTimeout(2000)
    
    // Should be redirected to login
    await page.waitForURL(/\/login/, { timeout: 10000 })
    console.log('✅ Redirected to login after logout!')
    
    // Step 4: Login
    console.log('🔐 Step 4: Login')
    await page.fill('input[name="username"]', uniqueUsername)
    await page.fill('input[name="password"]', testPassword)
    await page.click('button[type="submit"]')
    
    // Wait for login success
    try {
      await page.waitForSelector('text=Login successful', { timeout: 15000 })
      console.log('✅ Login successful!')
    } catch (error) {
      console.log('❌ Login failed or success message not found')
      // Check if we're on dashboard page (might have redirected already)
      const currentUrl = page.url()
      if (currentUrl.includes('/dashboard')) {
        console.log('✅ Login successful (redirected to dashboard)!')
      } else {
        throw error
      }
    }
    
    // Should be redirected to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 })
    console.log('✅ Redirected to dashboard after login!')
    
    // Check if we're authenticated again
    const dashboardContent2 = await page.textContent('body')
    const isAuthenticated2 = !dashboardContent2?.includes('login') && !dashboardContent2?.includes('register')
    console.log(`Dashboard accessible after login: ${isAuthenticated2}`)
    expect(isAuthenticated2).toBe(true)
    
    console.log('🎉 Complete authentication flow successful!')
  })

  test('Test login with non-existent user', async ({ page }) => {
    console.log('=== TEST LOGIN WITH NON-EXISTENT USER ===')
    
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Try to login with non-existent user
    await page.fill('input[name="username"]', 'nonexistentuser')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Should show error message
    await page.waitForSelector('text=Invalid username or password', { timeout: 10000 })
    console.log('✅ Login error message displayed correctly')
  })

  test('Test login with user without password', async ({ page }) => {
    console.log('=== TEST LOGIN WITH USER WITHOUT PASSWORD ===')
    
    // First register a user without password
    await page.goto('/register')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    const usernameNoPassword = `test_${Math.random().toString(36).substr(2, 8)}`
    console.log(`Registering user without password: ${usernameNoPassword}`)
    
    await page.fill('input[name="username"]', usernameNoPassword)
    await page.click('button[type="submit"]')
    
    // Wait for registration success
    try {
      await page.waitForSelector('text=Account created successfully', { timeout: 15000 })
      console.log('✅ User without password registered successfully!')
    } catch (error) {
      const currentUrl = page.url()
      if (currentUrl.includes('/onboarding')) {
        console.log('✅ User without password registered successfully!')
      } else {
        throw error
      }
    }
    
    // Complete onboarding quickly
    await page.waitForURL(/\/onboarding/, { timeout: 10000 })
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    await page.click('text=Get Started')
    await page.waitForTimeout(2000)
    
    // Now try to login with password
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    await page.fill('input[name="username"]', usernameNoPassword)
    await page.fill('input[name="password"]', 'anypassword')
    await page.click('button[type="submit"]')
    
    // Should show error about no password set
    await page.waitForSelector('text=does not have a password set', { timeout: 10000 })
    console.log('✅ Correct error message for user without password')
  })
})

