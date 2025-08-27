/**
 * IA/PO Redirect Chain Debug Test
 * Debug the redirect chain: onboarding → dashboard → login → register
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Redirect Chain Debug', () => {
  test('Debug redirect chain from onboarding completion', async ({ page }) => {
    console.log('=== REDIRECT CHAIN DEBUG TEST ===')
    
    // Step 1: Register a user
    console.log('📝 Step 1: Register a user')
    await page.goto('/register')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    const uniqueUsername = `test_${Math.random().toString(36).substr(2, 8)}`
    const testPassword = 'TestPassword123!'
    
    await page.fill('input[name="username"]', uniqueUsername)
    await page.click('text=Add password')
    await page.fill('input[name="password"]', testPassword)
    await page.fill('input[name="confirmPassword"]', testPassword)
    await page.click('button[type="submit"]')
    await page.waitForTimeout(5000)
    
    // Step 2: Complete onboarding
    console.log('🎯 Step 2: Complete onboarding')
    await page.waitForURL(/\/onboarding/, { timeout: 10000 })
    console.log('✅ Onboarding page loaded')
    
    // Complete onboarding steps
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    
    // Step 3: Monitor redirect chain
    console.log('🎯 Step 3: Monitor redirect chain')
    
    // Set up navigation event listeners
    const navigationEvents: string[] = []
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        navigationEvents.push(frame.url())
        console.log('Navigation event:', frame.url())
      }
    })
    
    // Click Get Started and monitor
    const urlBeforeClick = page.url()
    console.log(`URL before Get Started: ${urlBeforeClick}`)
    
    await page.click('text=Get Started')
    console.log('✅ Get Started clicked')
    
    // Wait and check each step of the redirect chain
    await page.waitForTimeout(2000)
    const urlAfter2s = page.url()
    console.log(`URL after 2s: ${urlAfter2s}`)
    
    await page.waitForTimeout(2000)
    const urlAfter4s = page.url()
    console.log(`URL after 4s: ${urlAfter4s}`)
    
    await page.waitForTimeout(2000)
    const urlAfter6s = page.url()
    console.log(`URL after 6s: ${urlAfter6s}`)
    
    // Step 4: Check if we ended up at register
    console.log('🎯 Step 4: Check final destination')
    const finalUrl = page.url()
    console.log(`Final URL: ${finalUrl}`)
    
    if (finalUrl.includes('/register')) {
      console.log('❌ Ended up at register page')
      
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
    } else if (finalUrl.includes('/dashboard')) {
      console.log('✅ Successfully reached dashboard')
    } else if (finalUrl.includes('/login')) {
      console.log('⚠️ Ended up at login page')
      
      // Check if we can see the login form
      const loginForm = await page.locator('form').first()
      const isLoginForm = await loginForm.isVisible()
      console.log('Login form visible:', isLoginForm)
      
      // Check if there are any error messages
      const errorMessages = await page.locator('.text-red-600, .text-red-500').allTextContents()
      console.log('Error messages:', errorMessages)
      
      throw new Error('Redirected to login instead of dashboard')
    } else {
      console.log('❓ Unexpected final destination:', finalUrl)
      throw new Error(`Unexpected final destination: ${finalUrl}`)
    }
    
    console.log('🎉 Redirect chain debug test completed!')
  })
})

