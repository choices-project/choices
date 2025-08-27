/**
 * IA/PO Onboarding With Message Debug Test
 * Check if onboarding works correctly when loaded with registration message
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Onboarding With Message Debug', () => {
  test('Debug onboarding with registration message', async ({ page }) => {
    console.log('=== ONBOARDING WITH MESSAGE DEBUG TEST ===')
    
    // Step 1: Go directly to onboarding with registration message
    console.log('🎯 Step 1: Go to onboarding with registration message')
    const onboardingUrl = '/onboarding?message=Registration successful! Let\'s set up your preferences.'
    await page.goto(onboardingUrl)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    console.log('Current URL:', page.url())
    
    // Step 2: Check if onboarding page loaded correctly
    console.log('🎯 Step 2: Check onboarding page')
    const pageContent = await page.textContent('body')
    const hasOnboardingContent = pageContent?.includes('Welcome to Choices') || 
                                pageContent?.includes('Let\'s set up your account')
    console.log('Has onboarding content:', hasOnboardingContent)
    
    // Step 3: Complete onboarding steps
    console.log('🎯 Step 3: Complete onboarding steps')
    
    // Step 1: Welcome
    console.log('Completing step 1...')
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    
    // Step 2: Profile
    console.log('Completing step 2...')
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    
    // Step 3: Privacy
    console.log('Completing step 3...')
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    
    // Check final step
    const finalStepContent = await page.textContent('body')
    const hasGetStarted = finalStepContent?.includes('Get Started')
    console.log('Has Get Started button:', hasGetStarted)
    
    if (hasGetStarted) {
      console.log('Clicking Get Started...')
      
      // Click Get Started
      await page.click('text=Get Started')
      console.log('Get Started clicked')
      
      // Wait and check URL
      await page.waitForTimeout(3000)
      const urlAfterGetStarted = page.url()
      console.log('URL after Get Started:', urlAfterGetStarted)
      
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
    
    console.log('🎉 Onboarding with message debug test completed!')
  })
})

