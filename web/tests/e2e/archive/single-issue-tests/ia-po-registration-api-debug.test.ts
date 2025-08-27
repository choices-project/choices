/**
 * IA/PO Registration API Debug Test
 * Debug what the registration API is actually returning
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Registration API Debug', () => {
  test('Debug registration API response', async ({ page }) => {
    console.log('=== REGISTRATION API DEBUG TEST ===')
    
    // Step 1: Go to registration page
    console.log('🎯 Step 1: Go to registration page')
    await page.goto('/register')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    
    await page.waitForSelector('input[name="username"]', { timeout: 10000 })
    
    const uniqueUsername = `test_${Math.random().toString(36).substr(2, 8)}`
    const testPassword = 'TestPassword123!'
    
    console.log('Registering user:', uniqueUsername)
    
    await page.fill('input[name="username"]', '')
    await page.fill('input[name="username"]', uniqueUsername)
    await page.click('text=Add password')
    await page.fill('input[name="password"]', testPassword)
    await page.fill('input[name="confirmPassword"]', testPassword)
    
    // Step 2: Monitor network requests
    console.log('🎯 Step 2: Monitor network requests')
    
    const requestPromise = page.waitForRequest(request => 
      request.url().includes('/api/auth/register-ia') && request.method() === 'POST'
    )
    
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/auth/register-ia') && response.request().method() === 'POST'
    )
    
    console.log('Submitting registration form...')
    await page.click('button[type="submit"]')
    
    // Wait for request and response
    const request = await requestPromise
    const response = await responsePromise
    
    console.log('Request URL:', request.url())
    console.log('Request method:', request.method())
    console.log('Request headers:', request.headers())
    
    console.log('Response status:', response.status())
    console.log('Response headers:', response.headers())
    console.log('Response URL:', response.url())
    
    // Check if response is a redirect
    const location = response.headers()['location']
    console.log('Location header:', location)
    
    // Get response body if it's not a redirect
    if (response.status() !== 303) {
      try {
        const responseText = await response.text()
        console.log('Response body:', responseText)
      } catch (error) {
        console.log('Could not read response body:', error)
      }
    }
    
    // Step 3: Check current URL after submission
    console.log('🎯 Step 3: Check current URL')
    await page.waitForTimeout(3000)
    const currentUrl = page.url()
    console.log('Current URL after submission:', currentUrl)
    
    // Step 4: Check cookies
    console.log('🎯 Step 4: Check cookies')
    const cookies = await page.context().cookies()
    const sessionCookie = cookies.find(c => c.name === 'choices_session')
    console.log('Session cookie present:', !!sessionCookie)
    if (sessionCookie) {
      console.log('Session cookie length:', sessionCookie.value.length)
    }
    
    // Step 5: Check console logs
    console.log('🎯 Step 5: Check for any console errors')
    
    console.log('✅ Registration API debug test completed!')
  })
})
