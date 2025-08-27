/**
 * IA/PO Onboarding API Test
 * Test the onboarding completion API directly
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Onboarding API Test', () => {
  test('Test onboarding completion API', async ({ page }) => {
    console.log('=== ONBOARDING API TEST ===')
    
    // Step 1: Register a user first
    console.log('🎯 Step 1: Register a user')
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
    
    console.log('Submitting registration form...')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(5000)
    
    // Step 2: Check if we're on onboarding page
    console.log('🎯 Step 2: Check registration result')
    const postRegistrationUrl = page.url()
    console.log('URL after registration:', postRegistrationUrl)
    
    if (!postRegistrationUrl.includes('/onboarding')) {
      console.log('❌ Not redirected to onboarding, cannot test API')
      throw new Error('Not redirected to onboarding after registration')
    }
    
    // Step 3: Get session cookie
    console.log('🎯 Step 3: Get session cookie')
    const cookies = await page.context().cookies()
    const sessionCookie = cookies.find(c => c.name === 'choices_session')
    
    if (!sessionCookie) {
      console.log('❌ No session cookie found')
      throw new Error('No session cookie found')
    }
    
    console.log('Session cookie found, length:', sessionCookie.value.length)
    
    // Step 4: Test onboarding completion API directly
    console.log('🎯 Step 4: Test onboarding completion API')
    
    const response = await page.request.post('/api/user/complete-onboarding', {
      headers: {
        'Cookie': `choices_session=${sessionCookie.value}`,
        'Content-Type': 'application/json',
      },
    })
    
    console.log('API response status:', response.status())
    console.log('API response headers:', response.headers())
    
    if (response.status() === 303) {
      console.log('✅ Server redirect detected')
      const location = response.headers()['location']
      console.log('Redirect location:', location)
      
      if (location?.includes('/dashboard')) {
        console.log('✅ Correctly redirecting to dashboard')
      } else {
        console.log('❌ Not redirecting to dashboard:', location)
        throw new Error(`Not redirecting to dashboard: ${location}`)
      }
    } else {
      console.log('❌ Expected 303 redirect, got:', response.status())
      const responseText = await response.text()
      console.log('Response body:', responseText)
      throw new Error(`Expected 303 redirect, got ${response.status()}`)
    }
    
    console.log('✅ Onboarding API test completed successfully!')
  })
})

