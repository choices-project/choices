/**
 * IA/PO Onboarding Debug Test
 * Debug the onboarding completion process
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Onboarding Debug', () => {
  test('Debug onboarding completion', async ({ page }) => {
    console.log('=== ONBOARDING DEBUG TEST ===')
    
    // Step 1: Register a user to get to onboarding
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
    
    // Step 2: Verify we're on onboarding page
    console.log('🎯 Step 2: Verify onboarding page')
    await page.waitForURL(/\/onboarding/, { timeout: 10000 })
    console.log('✅ Onboarding page loaded')
    
    // Step 3: Complete onboarding steps
    console.log('🎯 Step 3: Complete onboarding steps')
    
    // Step 1: Welcome
    console.log('  - Step 1: Welcome')
    const nextButton1 = await page.locator('text=Next').first()
    console.log(`Next button 1 visible: ${await nextButton1.isVisible()}`)
    await nextButton1.click()
    await page.waitForTimeout(1000)
    
    // Step 2: Profile
    console.log('  - Step 2: Profile')
    const nextButton2 = await page.locator('text=Next').first()
    console.log(`Next button 2 visible: ${await nextButton2.isVisible()}`)
    await nextButton2.click()
    await page.waitForTimeout(1000)
    
    // Step 3: Privacy
    console.log('  - Step 3: Privacy')
    const nextButton3 = await page.locator('text=Next').first()
    console.log(`Next button 3 visible: ${await nextButton3.isVisible()}`)
    await nextButton3.click()
    await page.waitForTimeout(1000)
    
    // Step 4: Complete
    console.log('  - Step 4: Complete')
    const getStartedButton = await page.locator('text=Get Started').first()
    console.log(`Get Started button visible: ${await getStartedButton.isVisible()}`)
    
    // Check current URL before clicking
    const urlBeforeClick = page.url()
    console.log(`URL before clicking Get Started: ${urlBeforeClick}`)
    
    // Click Get Started
    await getStartedButton.click()
    console.log('✅ Get Started button clicked')
    
    // Step 4: Wait for redirect
    console.log('🎯 Step 4: Wait for redirect')
    await page.waitForTimeout(5000)
    
    // Check current URL
    const urlAfterClick = page.url()
    console.log(`URL after clicking Get Started: ${urlAfterClick}`)
    
    // Check for any error messages
    const errorMessages = await page.locator('[class*="error"], [class*="Error"], .text-red-500, .text-red-600').allTextContents()
    if (errorMessages.length > 0) {
      console.log('Error messages found:', errorMessages)
    }
    
    // Check for console errors
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/onboarding-debug.png', fullPage: true })
    
    // Log all the information
    console.log('=== ONBOARDING DEBUG SUMMARY ===')
    console.log(`URL before click: ${urlBeforeClick}`)
    console.log(`URL after click: ${urlAfterClick}`)
    console.log(`Redirected to dashboard: ${urlAfterClick.includes('/dashboard')}`)
    console.log(`Error messages: ${errorMessages.length}`)
    console.log(`Console errors: ${consoleErrors.length}`)
    
    if (urlAfterClick.includes('/dashboard')) {
      console.log('✅ Onboarding completion successful!')
    } else {
      console.log('❌ Onboarding completion failed')
      console.log('Error messages:', errorMessages)
      console.log('Console errors:', consoleErrors)
      throw new Error('Onboarding completion failed')
    }
  })
})

