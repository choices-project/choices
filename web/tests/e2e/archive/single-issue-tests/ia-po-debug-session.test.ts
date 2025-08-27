/**
 * IA/PO Session Debug Test
 * Debug session management issues
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Session Debug', () => {
  test('Debug session management step by step', async ({ page }) => {
    console.log('=== SESSION DEBUG TEST ===')
    
    // Step 1: Register a user and check cookies
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
    
    // Check cookies after registration
    const cookies = await page.context().cookies()
    console.log('Cookies after registration:', cookies.map(c => ({ name: c.name, value: c.value?.substring(0, 20) + '...' })))
    
    const sessionCookie = cookies.find(c => c.name === 'choices_session')
    if (sessionCookie) {
      console.log('✅ Session cookie found after registration')
    } else {
      console.log('❌ No session cookie found after registration')
    }
    
    // Step 2: Check if we can access dashboard directly
    console.log('🏠 Step 2: Try to access dashboard')
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    
    const dashboardUrl = page.url()
    console.log(`Dashboard URL: ${dashboardUrl}`)
    
    if (dashboardUrl.includes('/login')) {
      console.log('❌ Redirected to login - session not working')
      
      // Step 3: Try login
      console.log('🔐 Step 3: Try login')
      await page.fill('input[name="username"]', uniqueUsername)
      await page.fill('input[name="password"]', testPassword)
      await page.click('button[type="submit"]')
      await page.waitForTimeout(5000)
      
      // Check cookies after login
      const cookiesAfterLogin = await page.context().cookies()
      console.log('Cookies after login:', cookiesAfterLogin.map(c => ({ name: c.name, value: c.value?.substring(0, 20) + '...' })))
      
      const sessionCookieAfterLogin = cookiesAfterLogin.find(c => c.name === 'choices_session')
      if (sessionCookieAfterLogin) {
        console.log('✅ Session cookie found after login')
      } else {
        console.log('❌ No session cookie found after login')
      }
      
      // Try dashboard again
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(3000)
      
      const finalUrl = page.url()
      console.log(`Final URL after login: ${finalUrl}`)
      
      if (finalUrl.includes('/dashboard')) {
        console.log('✅ Dashboard accessible after login')
      } else {
        console.log('❌ Still cannot access dashboard')
      }
    } else if (dashboardUrl.includes('/dashboard')) {
      console.log('✅ Dashboard accessible immediately after registration')
    } else {
      console.log(`⚠️ Unexpected redirect: ${dashboardUrl}`)
    }
  })
})

