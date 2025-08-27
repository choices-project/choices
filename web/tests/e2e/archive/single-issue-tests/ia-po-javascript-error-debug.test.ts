/**
 * IA/PO JavaScript Error Debug Test
 * Check for JavaScript errors during onboarding completion
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO JavaScript Error Debug', () => {
  test('Check for JavaScript errors during onboarding completion', async ({ page }) => {
    console.log('=== JAVASCRIPT ERROR DEBUG TEST ===')
    
    // Step 1: Set up error listeners
    console.log('🎯 Step 1: Set up error listeners')
    const consoleErrors: string[] = []
    const pageErrors: string[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
        console.log('Console error:', msg.text())
      }
    })
    
    page.on('pageerror', error => {
      pageErrors.push(error.message)
      console.log('Page error:', error.message)
    })
    
    // Step 2: Register a user
    console.log('📝 Step 2: Register a user')
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
    
    // Step 3: Complete onboarding
    console.log('🎯 Step 3: Complete onboarding')
    const postRegistrationUrl = page.url()
    console.log('URL after registration:', postRegistrationUrl)
    
    if (postRegistrationUrl.includes('/onboarding')) {
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
        
        // Click Get Started and monitor for errors
        await page.click('text=Get Started')
        console.log('Get Started clicked')
        
        // Wait and check for errors
        await page.waitForTimeout(3000)
        
        console.log('Console errors after Get Started:', consoleErrors)
        console.log('Page errors after Get Started:', pageErrors)
        
        const urlAfterGetStarted = page.url()
        console.log('URL after Get Started:', urlAfterGetStarted)
        
        if (urlAfterGetStarted.includes('/register')) {
          console.log('❌ Redirected to register instead of dashboard')
          console.log('❌ Console errors:', consoleErrors)
          console.log('❌ Page errors:', pageErrors)
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
    
    console.log('🎉 JavaScript error debug test completed!')
  })
})

