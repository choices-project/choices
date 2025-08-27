/**
 * IA/PO Session State Debug Test
 * Debug session state during full registration and onboarding flow
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Session State Debug', () => {
  test('Debug session state during full flow', async ({ page }) => {
    console.log('=== SESSION STATE DEBUG TEST ===')
    
    // Step 1: Register a user
    console.log('📝 Step 1: Register a user')
    await page.goto('/register')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    const uniqueUsername = `test_${Math.random().toString(36).substr(2, 8)}`
    const testPassword = 'TestPassword123!'
    
    console.log('Registering user:', uniqueUsername)
    
    await page.fill('input[name="username"]', uniqueUsername)
    await page.click('text=Add password')
    await page.fill('input[name="password"]', testPassword)
    await page.fill('input[name="confirmPassword"]', testPassword)
    
    console.log('Submitting registration form...')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(5000)
    
    // Step 2: Check session after registration
    console.log('🎯 Step 2: Check session after registration')
    const postRegistrationUrl = page.url()
    console.log('URL after registration:', postRegistrationUrl)
    
    const cookiesAfterRegistration = await page.context().cookies()
    const sessionCookieAfterRegistration = cookiesAfterRegistration.find(c => c.name === 'choices_session')
    console.log('Session cookie after registration:', sessionCookieAfterRegistration ? 'Present' : 'Missing')
    
    if (sessionCookieAfterRegistration) {
      console.log('Session cookie value length:', sessionCookieAfterRegistration.value.length)
      console.log('Session cookie domain:', sessionCookieAfterRegistration.domain)
      console.log('Session cookie path:', sessionCookieAfterRegistration.path)
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
    
    // Step 4: Complete onboarding if we're on onboarding page
    if (postRegistrationUrl.includes('/onboarding')) {
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
        
        console.log('Auth response before click status:', authResponseBeforeClick.status())
        const authResponseBeforeClickText = await authResponseBeforeClick.text()
        console.log('Auth response before click body:', authResponseBeforeClickText)
        
        // Click Get Started
        await page.click('text=Get Started')
        console.log('Get Started clicked')
        
        // Wait and check URL
        await page.waitForTimeout(3000)
        const urlAfterGetStarted = page.url()
        console.log('URL after Get Started:', urlAfterGetStarted)
        
        // Check session after clicking
        const cookiesAfterClick = await page.context().cookies()
        const sessionCookieAfterClick = cookiesAfterClick.find(c => c.name === 'choices_session')
        console.log('Session cookie after Get Started:', sessionCookieAfterClick ? 'Present' : 'Missing')
        
        if (sessionCookieAfterClick) {
          console.log('Session cookie value length after click:', sessionCookieAfterClick.value.length)
        }
        
        // Test /api/auth/me after clicking
        const authResponseAfterClick = await page.request.get('/api/auth/me', {
          headers: {
            'Cookie': `choices_session=${sessionCookieAfterClick?.value || ''}`
          }
        })
        
        console.log('Auth response after click status:', authResponseAfterClick.status())
        const authResponseAfterClickText = await authResponseAfterClick.text()
        console.log('Auth response after click body:', authResponseAfterClickText)
        
        if (urlAfterGetStarted.includes('/register')) {
          console.log('❌ Redirected to register instead of dashboard')
          throw new Error('Redirected to register instead of dashboard')
        } else if (urlAfterGetStarted.includes('/dashboard')) {
          console.log('✅ Successfully reached dashboard')
        } else {
          console.log('❓ Unexpected final destination:', urlAfterGetStarted)
          throw new Error(`Unexpected final destination: ${urlAfterGetStarted}`)
        }
      } else {
        console.log('❌ Get Started button not found on final step')
        throw new Error('Get Started button not found')
      }
    } else {
      console.log('❌ Not redirected to onboarding after registration')
      throw new Error('Not redirected to onboarding after registration')
    }
    
    console.log('🎉 Session state debug test completed!')
  })
})

