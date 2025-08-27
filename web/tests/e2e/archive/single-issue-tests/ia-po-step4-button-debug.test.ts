/**
 * IA/PO Step 4 Button Debug Test
 * Debug the step 4 button behavior specifically
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Step 4 Button Debug', () => {
  test('Debug step 4 button behavior', async ({ page }) => {
    console.log('=== STEP 4 BUTTON DEBUG TEST ===')
    
    // Step 1: Go to onboarding page
    console.log('🎯 Step 1: Go to onboarding page')
    await page.goto('/onboarding')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    console.log('Current URL:', page.url())
    
    // Step 2: Complete steps 1-3
    console.log('🎯 Step 2: Complete steps 1-3')
    
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
    
    // Step 3: Debug step 4 button
    console.log('🎯 Step 3: Debug step 4 button')
    
    // Check current step
    const currentStepIndicator = await page.locator('.bg-blue-600').last()
    const stepNumber = await currentStepIndicator.textContent()
    console.log('Current step indicator:', stepNumber)
    
    // Check if we're on step 4
    const pageContent = await page.textContent('body')
    const hasStep4Content = pageContent?.includes('Welcome to the Choices community') || 
                           pageContent?.includes('What you can do now')
    console.log('Has step 4 content:', hasStep4Content)
    
    // Find the Get Started button
    const getStartedButton = page.locator('button:has-text("Get Started")')
    const buttonCount = await getStartedButton.count()
    console.log('Get Started button count:', buttonCount)
    
    if (buttonCount > 0) {
      // Check button properties
      const isVisible = await getStartedButton.isVisible()
      console.log('Get Started button visible:', isVisible)
      
      const isEnabled = await getStartedButton.isEnabled()
      console.log('Get Started button enabled:', isEnabled)
      
      const buttonText = await getStartedButton.textContent()
      console.log('Get Started button text:', buttonText)
      
      const buttonClasses = await getStartedButton.getAttribute('class')
      console.log('Get Started button classes:', buttonClasses)
      
      // Check if button is disabled
      const isDisabled = await getStartedButton.isDisabled()
      console.log('Get Started button disabled:', isDisabled)
      
      // Check if there's a loading state
      const loadingText = await page.locator('text=Setting up...').count()
      console.log('Loading text count:', loadingText)
      
      // Check for any error messages
      const errorElements = await page.locator('.text-red-600, .text-red-500, .bg-red-50, .error').allTextContents()
      console.log('Error elements:', errorElements)
      
      // Try clicking the button
      console.log('🎯 Step 4: Try clicking Get Started button')
      
      if (isEnabled && !isDisabled) {
        console.log('Button is enabled, attempting to click...')
        
        // Click the button
        await getStartedButton.click()
        console.log('Get Started button clicked')
        
        // Wait and check URL
        await page.waitForTimeout(3000)
        const urlAfterClick = page.url()
        console.log('URL after Get Started click:', urlAfterClick)
        
        if (urlAfterClick.includes('/dashboard')) {
          console.log('✅ Successfully redirected to dashboard')
        } else if (urlAfterClick.includes('/register')) {
          console.log('❌ Redirected to register instead of dashboard')
          throw new Error('Redirected to register instead of dashboard')
        } else if (urlAfterClick.includes('/onboarding')) {
          console.log('❌ Still on onboarding page')
          throw new Error('Still on onboarding page after clicking Get Started')
        } else {
          console.log('❓ Unexpected redirect:', urlAfterClick)
          throw new Error(`Unexpected redirect: ${urlAfterClick}`)
        }
      } else {
        console.log('❌ Button is disabled or not enabled')
        throw new Error('Get Started button is disabled')
      }
    } else {
      console.log('❌ Get Started button not found')
      throw new Error('Get Started button not found')
    }
    
    console.log('🎉 Step 4 button debug test completed!')
  })
})

