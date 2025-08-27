/**
 * IA/PO Full Flow Debug Test
 * Debug the full registration → onboarding → dashboard flow
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Full Flow Debug', () => {
  test('Debug full registration to dashboard flow', async ({ page }) => {
    console.log('=== FULL FLOW DEBUG TEST ===')
    
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
    
    // Step 2: Check where we ended up after registration
    console.log('🎯 Step 2: Check post-registration state')
    const postRegistrationUrl = page.url()
    console.log('URL after registration:', postRegistrationUrl)
    
    // Check cookies
    const cookies = await page.context().cookies()
    const sessionCookie = cookies.find(c => c.name === 'choices_session')
    console.log('Session cookie after registration:', sessionCookie ? 'Present' : 'Missing')
    
    if (sessionCookie) {
      console.log('Session cookie value length:', sessionCookie.value.length)
    }
    
    // Step 3: Complete onboarding if we're on onboarding page
    if (postRegistrationUrl.includes('/onboarding')) {
      console.log('🎯 Step 3: Complete onboarding')
      
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
        
        // Check cookies before clicking
        const cookiesBeforeClick = await page.context().cookies()
        const sessionCookieBeforeClick = cookiesBeforeClick.find(c => c.name === 'choices_session')
        console.log('Session cookie before Get Started:', sessionCookieBeforeClick ? 'Present' : 'Missing')
        
        // Click Get Started
        await page.click('text=Get Started')
        console.log('Get Started clicked')
        
        // Wait and check URL
        await page.waitForTimeout(3000)
        const urlAfterGetStarted = page.url()
        console.log('URL after Get Started:', urlAfterGetStarted)
        
        // Check cookies after clicking
        const cookiesAfterClick = await page.context().cookies()
        const sessionCookieAfterClick = cookiesAfterClick.find(c => c.name === 'choices_session')
        console.log('Session cookie after Get Started:', sessionCookieAfterClick ? 'Present' : 'Missing')
        
        if (urlAfterGetStarted.includes('/register')) {
          console.log('❌ Redirected to register instead of dashboard')
          
          // Check if we can see the register form
          const registerForm = await page.locator('form').first()
          const isRegisterForm = await registerForm.isVisible()
          console.log('Register form visible:', isRegisterForm)
          
          // Check page content
          const pageContent = await page.textContent('body')
          const hasRegisterContent = pageContent?.includes('Create Account') || 
                                    pageContent?.includes('Register')
          console.log('Has register content:', hasRegisterContent)
          
          throw new Error('Redirected to register instead of dashboard')
        } else if (urlAfterGetStarted.includes('/dashboard')) {
          console.log('✅ Successfully reached dashboard')
          
          // Check dashboard content
          const dashboardContent = await page.textContent('body')
          const hasDashboardContent = dashboardContent?.includes('Welcome back') || 
                                     dashboardContent?.includes('Overview')
          console.log('Dashboard content loaded:', hasDashboardContent)
          
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
      console.log('Expected: /onboarding, Got:', postRegistrationUrl)
      throw new Error('Not redirected to onboarding after registration')
    }
    
    console.log('🎉 Full flow debug test completed!')
  })
})

