/**
 * IA/PO Session Flow Debug Test
 * Debug session state during the full registration flow
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Session Flow Debug', () => {
  test('Debug session state during full registration flow', async ({ page }) => {
    console.log('=== SESSION FLOW DEBUG TEST ===')
    
    // Step 1: Register a user
    console.log('📝 Step 1: Register a user')
    await page.goto('/register')
    await page.waitForLoadState('networkidle')
    
    // Wait for the username input to be available
    console.log('Waiting for username input...')
    await page.waitForSelector('input[name="username"]', { timeout: 10000 })
    
    const timestamp = Date.now()
    const uniqueUsername = `test_${timestamp.toString().slice(-6)}`
    const testEmail = `test_${timestamp}_${Math.random().toString(36).substring(2, 8)}@example.com`
    
    console.log('Registering user:', uniqueUsername)
    
    // Fill the registration form
    await page.fill('input[name="username"]', '')
    await page.fill('input[name="username"]', uniqueUsername)
    await page.fill('input[name="email"]', testEmail)
    
    console.log('Submitting registration form...')
    
    // Wait for redirect to onboarding
    await Promise.all([
      page.waitForURL('**/onboarding', { timeout: 10000 }),
      page.click('button[type="submit"]')
    ])
    
    // Step 2: Check session after registration
    console.log('🎯 Step 2: Check session after registration')
    const postRegistrationUrl = page.url()
    console.log('URL after registration:', postRegistrationUrl)
    
    const cookiesAfterRegistration = await page.context().cookies()
    const sessionCookieAfterRegistration = cookiesAfterRegistration.find(c => c.name === 'choices_session')
    console.log('Session cookie after registration:', sessionCookieAfterRegistration ? 'Present' : 'Missing')
    
    if (sessionCookieAfterRegistration) {
      console.log('Session cookie value length:', sessionCookieAfterRegistration.value.length)
    }
    
    // Step 3: Test /api/auth/me after registration
    console.log('🎯 Step 3: Test /api/auth/me after registration')
    const authResponse = await page.request.get('/api/auth/me', {
      headers: {
        'Cookie': `choices_session=${sessionCookieAfterRegistration?.value || ''}`
      }
    })
    
    console.log('Auth response status:', authResponse.status())
    const authResponseText = await authResponse.text()
    console.log('Auth response body:', authResponseText)
    
    // Step 4: Complete onboarding
    console.log('🎯 Step 4: Complete onboarding')
    
    // Complete onboarding steps
    console.log('Completing step 1...')
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    
    console.log('Completing step 2...')
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    
    console.log('Completing step 3...')
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    
    // Check final step
    const finalStepContent = await page.textContent('body')
    const hasGetStarted = finalStepContent?.includes('Get Started')
    console.log('Has Get Started button:', hasGetStarted)
    
    if (hasGetStarted) {
      console.log('Clicking Get Started...')
      
      // Check session before clicking
      const cookiesBeforeClick = await page.context().cookies()
      const sessionCookieBeforeClick = cookiesBeforeClick.find(c => c.name === 'choices_session')
      console.log('Session cookie before Get Started:', sessionCookieBeforeClick ? 'Present' : 'Missing')
      
      if (sessionCookieBeforeClick) {
        console.log('Session cookie value length before click:', sessionCookieBeforeClick.value.length)
      }
      
      // Test /api/auth/me before clicking
      const authResponseBeforeClick = await page.request.get('/api/auth/me', {
        headers: {
          'Cookie': `choices_session=${sessionCookieBeforeClick?.value || ''}`
        }
      })
      
      console.log('Auth response before Get Started:', authResponseBeforeClick.status())
      
      // Click Get Started and wait for redirect
      await Promise.all([
        page.waitForURL('**/dashboard', { timeout: 10000 }),
        page.click('button[type="submit"]')
      ])
      
      // Step 5: Check final state
      console.log('🎯 Step 5: Check final state')
      const finalUrl = page.url()
      console.log('Final URL:', finalUrl)
      
      const cookiesAfterOnboarding = await page.context().cookies()
      const sessionCookieAfterOnboarding = cookiesAfterOnboarding.find(c => c.name === 'choices_session')
      console.log('Session cookie after onboarding:', sessionCookieAfterOnboarding ? 'Present' : 'Missing')
      
      if (sessionCookieAfterOnboarding) {
        console.log('Session cookie value length after onboarding:', sessionCookieAfterOnboarding.value.length)
      }
      
      // Test /api/auth/me after onboarding
      const authResponseAfterOnboarding = await page.request.get('/api/auth/me', {
        headers: {
          'Cookie': `choices_session=${sessionCookieAfterOnboarding?.value || ''}`
        }
      })
      
      console.log('Auth response after onboarding:', authResponseAfterOnboarding.status())
      const authResponseTextAfterOnboarding = await authResponseAfterOnboarding.text()
      console.log('Auth response body after onboarding:', authResponseTextAfterOnboarding)
      
      // Verify we're on dashboard
      expect(finalUrl).toContain('/dashboard')
      console.log('✅ Successfully reached dashboard')
      
    } else {
      console.log('❌ Get Started button not found')
      expect(hasGetStarted).toBe(true)
    }
  })
})
