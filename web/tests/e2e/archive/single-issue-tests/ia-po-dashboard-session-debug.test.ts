/**
 * IA/PO Dashboard Session Debug Test
 * Debug dashboard session issues
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Dashboard Session Debug', () => {
  test('Debug dashboard session after registration', async ({ page }) => {
    console.log('=== DASHBOARD SESSION DEBUG TEST ===')
    
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
    
    // Step 2: Check session cookie after registration
    console.log('🍪 Step 2: Check session cookie after registration')
    const cookies = await page.context().cookies()
    const sessionCookie = cookies.find(c => c.name === 'choices_session')
    
    if (!sessionCookie) {
      console.log('❌ No session cookie found after registration')
      throw new Error('No session cookie after registration')
    }
    
    console.log('✅ Session cookie found after registration')
    
    // Step 3: Try to access dashboard directly
    console.log('🏠 Step 3: Try dashboard access')
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    
    const dashboardUrl = page.url()
    console.log(`Dashboard URL: ${dashboardUrl}`)
    
    if (dashboardUrl.includes('/dashboard')) {
      console.log('✅ Dashboard accessible after registration')
      
      // Check dashboard content
      const dashboardContent = await page.textContent('body')
      const hasDashboardContent = dashboardContent?.includes('Welcome back') || 
                                 dashboardContent?.includes('Overview')
      
      console.log(`Dashboard content loaded: ${hasDashboardContent}`)
      expect(hasDashboardContent).toBe(true)
    } else {
      console.log('❌ Dashboard not accessible after registration')
      console.log('Redirected to:', dashboardUrl)
      
      // Check if we were redirected to login or register
      if (dashboardUrl.includes('/login')) {
        console.log('❌ Redirected to login - session not recognized')
      } else if (dashboardUrl.includes('/register')) {
        console.log('❌ Redirected to register - session not recognized')
      } else {
        console.log('❌ Redirected to unknown page:', dashboardUrl)
      }
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/dashboard-session-debug.png' })
      throw new Error('Dashboard not accessible after registration')
    }
    
    console.log('🎉 Dashboard session debug successful!')
  })
})

