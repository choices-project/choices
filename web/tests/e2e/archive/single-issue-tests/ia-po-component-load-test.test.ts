/**
 * IA/PO Component Load Test
 * Minimal test to check if the onboarding component loads at all
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Component Load Test', () => {
  test('Check if onboarding component loads', async ({ page }) => {
    console.log('=== COMPONENT LOAD TEST ===')
    
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
    
    // Check for any error messages
    const errorElements = await page.locator('.text-red-600, .text-red-500, .bg-red-50, .error').allTextContents()
    console.log('Error elements:', errorElements)
    
    // Check for any console errors
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
        console.log('Console error:', msg.text())
      }
    })
    
    // Check for any page errors
    const pageErrors: string[] = []
    page.on('pageerror', error => {
      pageErrors.push(error.message)
      console.log('Page error:', error.message)
    })
    
    // Wait a bit to capture any errors
    await page.waitForTimeout(2000)
    
    console.log('Console errors:', consoleErrors)
    console.log('Page errors:', pageErrors)
    
    // Check if we have basic onboarding content
    const hasOnboardingContent = pageContent?.includes('Welcome to Choices') || 
                                pageContent?.includes('Let\'s set up your account') ||
                                pageContent?.includes('onboarding')
    console.log('Has onboarding content:', hasOnboardingContent)
    
    if (!hasOnboardingContent) {
      console.log('❌ Onboarding page did not load correctly')
      console.log('Page content preview:', pageContent?.substring(0, 500))
      throw new Error('Onboarding page did not load correctly')
    }
    
    // Step 3: Check if we can find any buttons
    console.log('🎯 Step 3: Check for buttons')
    const buttons = await page.locator('button').all()
    console.log('Button count:', buttons.length)
    
    for (let i = 0; i < buttons.length; i++) {
      const buttonText = await buttons[i].textContent()
      console.log(`Button ${i}:`, buttonText)
    }
    
    // Step 4: Check if we can find the Next button specifically
    console.log('🎯 Step 4: Check for Next button')
    const nextButton = page.locator('button:has-text("Next")')
    const nextButtonCount = await nextButton.count()
    console.log('Next button count:', nextButtonCount)
    
    if (nextButtonCount > 0) {
      const isVisible = await nextButton.isVisible()
      const isEnabled = await nextButton.isEnabled()
      console.log('Next button visible:', isVisible)
      console.log('Next button enabled:', isEnabled)
    }
    
    console.log('✅ Component load test completed!')
  })
})

