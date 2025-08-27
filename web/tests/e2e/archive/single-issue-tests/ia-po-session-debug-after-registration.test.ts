/**
 * IA/PO Session Debug After Registration Test
 * Debug session management immediately after registration
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Session Debug After Registration', () => {
  test('Debug session after registration', async ({ page }) => {
    console.log('=== SESSION DEBUG AFTER REGISTRATION TEST ===')
    
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
    
    // Check for success message
    const successMessage = await page.locator('text=Account created successfully').isVisible()
    if (successMessage) {
      console.log('✅ Registration successful')
    } else {
      console.log('❌ Registration failed')
      throw new Error('Registration failed')
    }
    
    // Step 2: Check session cookie immediately after registration
    console.log('🍪 Step 2: Check session cookie after registration')
    const cookies = await page.context().cookies()
    const sessionCookie = cookies.find(c => c.name === 'choices_session')
    
    if (sessionCookie) {
      console.log('✅ Session cookie found after registration')
      console.log('Cookie value (first 50 chars):', sessionCookie.value.substring(0, 50) + '...')
    } else {
      console.log('❌ No session cookie found after registration')
      throw new Error('No session cookie after registration')
    }
    
    // Step 3: Test /api/auth/me immediately after registration
    console.log('🔍 Step 3: Test /api/auth/me after registration')
    const response = await page.request.get('/api/auth/me', {
      headers: {
        'Cookie': `choices_session=${sessionCookie.value}`
      }
    })
    
    console.log('Response status:', response.status())
    const responseText = await response.text()
    console.log('Response body:', responseText)
    
    if (response.status() === 200) {
      console.log('✅ /api/auth/me works after registration')
    } else {
      console.log('❌ /api/auth/me failed after registration')
      throw new Error('/api/auth/me failed after registration')
    }
    
    // Step 4: Try to access dashboard directly
    console.log('🏠 Step 4: Try dashboard access after registration')
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
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/dashboard-redirect-after-registration.png' })
      throw new Error('Dashboard not accessible after registration')
    }
    
    console.log('🎉 Session debug after registration successful!')
  })
})

