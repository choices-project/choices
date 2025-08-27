/**
 * IA/PO Registration Debug Test
 * Debug the registration process step by step
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Registration Debug', () => {
  test('Debug registration process', async ({ page }) => {
    console.log('=== REGISTRATION DEBUG TEST ===')
    
    // Step 1: Go to registration page
    console.log('📝 Step 1: Go to registration page')
    await page.goto('/register')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Check if registration form is loaded
    const formExists = await page.locator('form').isVisible()
    console.log(`Registration form visible: ${formExists}`)
    
    if (!formExists) {
      console.log('❌ Registration form not found')
      await page.screenshot({ path: 'test-results/registration-form-not-found.png' })
      throw new Error('Registration form not found')
    }
    
    // Step 2: Fill registration form
    console.log('📝 Step 2: Fill registration form')
    const uniqueUsername = `test_${Math.random().toString(36).substr(2, 8)}`
    const testPassword = 'TestPassword123!'
    console.log(`Using username: ${uniqueUsername}`)
    
    // Fill username
    await page.fill('input[name="username"]', uniqueUsername)
    console.log('✅ Username filled')
    
    // Click "Add password" button
    await page.click('text=Add password')
    console.log('✅ Add password clicked')
    
    // Fill password fields
    await page.fill('input[name="password"]', testPassword)
    await page.fill('input[name="confirmPassword"]', testPassword)
    console.log('✅ Passwords filled')
    
    // Step 3: Submit form
    console.log('📝 Step 3: Submit registration form')
    await page.click('button[type="submit"]')
    console.log('✅ Submit button clicked')
    
    // Step 4: Wait for response
    console.log('📝 Step 4: Wait for registration response')
    await page.waitForTimeout(5000)
    
    // Check current URL
    const currentUrl = page.url()
    console.log(`Current URL after submission: ${currentUrl}`)
    
    // Check for success message
    const successMessage = await page.locator('text=Account created successfully').isVisible()
    console.log(`Success message visible: ${successMessage}`)
    
    // Check for error messages
    const errorMessages = await page.locator('[class*="error"], [class*="Error"], .text-red-500, .text-red-600').allTextContents()
    if (errorMessages.length > 0) {
      console.log('Error messages found:', errorMessages)
    }
    
    // Check for any console errors
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/registration-debug.png', fullPage: true })
    
    // Log all the information
    console.log('=== REGISTRATION DEBUG SUMMARY ===')
    console.log(`URL: ${currentUrl}`)
    console.log(`Success message: ${successMessage}`)
    console.log(`Error messages: ${errorMessages.length}`)
    console.log(`Console errors: ${consoleErrors.length}`)
    
    if (successMessage) {
      console.log('✅ Registration successful!')
    } else if (currentUrl.includes('/onboarding')) {
      console.log('✅ Registration successful - redirected to onboarding')
    } else {
      console.log('❌ Registration may have failed')
      console.log('Error messages:', errorMessages)
      console.log('Console errors:', consoleErrors)
      throw new Error('Registration failed')
    }
  })
})

