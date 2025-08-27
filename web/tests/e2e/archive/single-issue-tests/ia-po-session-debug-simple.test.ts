/**
 * IA/PO Session Debug Simple Test
 * Simple test to debug session management by testing API directly
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Session Debug Simple', () => {
  test('Test session management with API calls', async ({ page }) => {
    console.log('=== SESSION DEBUG SIMPLE TEST ===')
    
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
    
    // Get cookies after registration
    const cookies = await page.context().cookies()
    const sessionCookie = cookies.find(c => c.name === 'choices_session')
    
    if (sessionCookie) {
      console.log('✅ Session cookie found after registration')
      console.log('Cookie value (first 50 chars):', sessionCookie.value.substring(0, 50) + '...')
      
      // Step 2: Test /api/auth/me directly with the session cookie
      console.log('🔍 Step 2: Test /api/auth/me with session cookie')
      
      const response = await page.request.get('/api/auth/me', {
        headers: {
          'Cookie': `choices_session=${sessionCookie.value}`
        }
      })
      
      console.log('Response status:', response.status())
      console.log('Response body:', await response.text())
      
      if (response.status() === 200) {
        console.log('✅ /api/auth/me works with session cookie')
      } else {
        console.log('❌ /api/auth/me failed with session cookie')
      }
    } else {
      console.log('❌ No session cookie found after registration')
    }
    
    // Step 3: Test dashboard access
    console.log('🏠 Step 3: Test dashboard access')
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    
    const dashboardUrl = page.url()
    console.log(`Dashboard URL: ${dashboardUrl}`)
    
    if (dashboardUrl.includes('/dashboard')) {
      console.log('✅ Dashboard accessible')
    } else {
      console.log('❌ Dashboard not accessible')
    }
  })
})

