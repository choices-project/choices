/**
 * IA/PO Session Cookie Debug Test
 * Debug session cookie issues
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Session Cookie Debug', () => {
  test('Debug session cookie after registration', async ({ page }) => {
    console.log('=== SESSION COOKIE DEBUG TEST ===')
    
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
    
    // Step 2: Check session cookie immediately after registration
    console.log('🍪 Step 2: Check session cookie after registration')
    const cookies = await page.context().cookies()
    console.log('All cookies:', cookies.map(c => ({ name: c.name, domain: c.domain, path: c.path })))
    
    const sessionCookie = cookies.find(c => c.name === 'choices_session')
    if (sessionCookie) {
      console.log('✅ Session cookie found')
      console.log('Session cookie details:', {
        name: sessionCookie.name,
        domain: sessionCookie.domain,
        path: sessionCookie.path,
        httpOnly: sessionCookie.httpOnly,
        secure: sessionCookie.secure,
        sameSite: sessionCookie.sameSite,
        value: sessionCookie.value.substring(0, 50) + '...'
      })
    } else {
      console.log('❌ No session cookie found')
      throw new Error('No session cookie after registration')
    }
    
    // Step 3: Test /api/auth/me with the session cookie
    console.log('🔍 Step 3: Test /api/auth/me with session cookie')
    const response = await page.request.get('/api/auth/me', {
      headers: {
        'Cookie': `choices_session=${sessionCookie.value}`
      }
    })
    
    console.log('Response status:', response.status())
    const responseText = await response.text()
    console.log('Response body:', responseText)
    
    if (response.status() === 200) {
      console.log('✅ /api/auth/me works with session cookie')
    } else {
      console.log('❌ /api/auth/me failed with session cookie')
      throw new Error('/api/auth/me failed with session cookie')
    }
    
    // Step 4: Try to access dashboard directly with session cookie
    console.log('🏠 Step 4: Try dashboard access with session cookie')
    
    // Create a new context with the session cookie
    const context = await page.context()
    await context.addCookies([sessionCookie])
    
    // Navigate to dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    
    const dashboardUrl = page.url()
    console.log(`Dashboard URL: ${dashboardUrl}`)
    
    if (dashboardUrl.includes('/dashboard')) {
      console.log('✅ Dashboard accessible with session cookie')
      
      // Check dashboard content
      const dashboardContent = await page.textContent('body')
      const hasDashboardContent = dashboardContent?.includes('Welcome back') || 
                                 dashboardContent?.includes('Overview')
      
      console.log(`Dashboard content loaded: ${hasDashboardContent}`)
      expect(hasDashboardContent).toBe(true)
    } else {
      console.log('❌ Dashboard not accessible with session cookie')
      console.log('Redirected to:', dashboardUrl)
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/dashboard-with-session-cookie.png' })
      throw new Error('Dashboard not accessible with session cookie')
    }
    
    console.log('🎉 Session cookie debug successful!')
  })
})

