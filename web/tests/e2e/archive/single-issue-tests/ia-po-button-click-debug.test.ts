/**
 * IA/PO Button Click Debug Test
 * Debug the Get Started button click issue
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Button Click Debug', () => {
  test('Debug Get Started button click', async ({ page }) => {
    console.log('=== BUTTON CLICK DEBUG TEST ===')
    
    // Step 1: Go directly to onboarding page
    console.log('🎯 Step 1: Go to onboarding page')
    await page.goto('/onboarding')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    console.log('Current URL:', page.url())
    
    // Step 2: Check if we're on the onboarding page
    const pageContent = await page.textContent('body')
    console.log('Page has onboarding content:', pageContent?.includes('Welcome to Choices'))
    
    // Step 3: Complete onboarding steps manually
    console.log('🎯 Step 2: Complete onboarding steps')
    
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
    
    // Step 4: Check if we're on the final step
    console.log('🎯 Step 3: Check final step')
    const finalStepContent = await page.textContent('body')
    console.log('Final step content:', finalStepContent?.includes('Get Started'))
    
    // Step 4: Try to click Get Started
    console.log('🎯 Step 4: Click Get Started')
    
    // Check if button exists
    const getStartedButton = page.locator('button:has-text("Get Started")')
    const buttonExists = await getStartedButton.count()
    console.log('Get Started button count:', buttonExists)
    
    if (buttonExists > 0) {
      const isVisible = await getStartedButton.isVisible()
      console.log('Get Started button visible:', isVisible)
      
      const isEnabled = await getStartedButton.isEnabled()
      console.log('Get Started button enabled:', isEnabled)
      
      // Try to click
      console.log('Attempting to click Get Started...')
      await getStartedButton.click()
      console.log('Get Started clicked')
      
      // Wait and check URL
      await page.waitForTimeout(3000)
      const urlAfterClick = page.url()
      console.log('URL after Get Started click:', urlAfterClick)
      
      if (urlAfterClick.includes('/register')) {
        console.log('❌ Redirected to register')
        throw new Error('Redirected to register instead of dashboard')
      } else if (urlAfterClick.includes('/dashboard')) {
        console.log('✅ Successfully redirected to dashboard')
      } else {
        console.log('❓ Unexpected redirect:', urlAfterClick)
        throw new Error(`Unexpected redirect: ${urlAfterClick}`)
      }
    } else {
      console.log('❌ Get Started button not found')
      throw new Error('Get Started button not found')
    }
    
    console.log('🎉 Button click debug test completed!')
  })
})

