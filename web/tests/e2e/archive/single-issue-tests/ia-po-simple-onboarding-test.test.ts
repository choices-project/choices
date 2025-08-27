/**
 * IA/PO Simple Onboarding Test
 * Simple test to check if onboarding page loads correctly
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Simple Onboarding Test', () => {
  test('Simple onboarding page test', async ({ page }) => {
    console.log('=== SIMPLE ONBOARDING TEST ===')
    
    // Step 1: Go to onboarding page
    console.log('🎯 Step 1: Go to onboarding page')
    await page.goto('/onboarding')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    console.log('Current URL:', page.url())
    
    // Step 2: Check if page loaded
    console.log('🎯 Step 2: Check if page loaded')
    const pageContent = await page.textContent('body')
    console.log('Page content length:', pageContent?.length)
    
    const hasOnboardingContent = pageContent?.includes('Welcome to Choices') || 
                                pageContent?.includes('Let\'s set up your account')
    console.log('Has onboarding content:', hasOnboardingContent)
    
    if (!hasOnboardingContent) {
      console.log('❌ Onboarding page did not load correctly')
      throw new Error('Onboarding page did not load correctly')
    }
    
    // Step 3: Check if Next button exists
    console.log('🎯 Step 3: Check if Next button exists')
    const nextButton = page.locator('button:has-text("Next")')
    const nextButtonCount = await nextButton.count()
    console.log('Next button count:', nextButtonCount)
    
    if (nextButtonCount === 0) {
      console.log('❌ Next button not found')
      throw new Error('Next button not found')
    }
    
    // Step 4: Click Next button
    console.log('🎯 Step 4: Click Next button')
    await nextButton.click()
    await page.waitForTimeout(1000)
    
    // Step 5: Check if we moved to step 2
    console.log('🎯 Step 5: Check if we moved to step 2')
    const step2Content = await page.textContent('body')
    const hasStep2Content = step2Content?.includes('Display Name') || 
                           step2Content?.includes('Your Profile')
    console.log('Has step 2 content:', hasStep2Content)
    
    if (!hasStep2Content) {
      console.log('❌ Did not move to step 2')
      throw new Error('Did not move to step 2')
    }
    
    console.log('✅ Simple onboarding test passed!')
  })
})

