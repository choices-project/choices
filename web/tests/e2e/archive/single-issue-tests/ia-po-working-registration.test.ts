/**
 * IA/PO Working Registration Test
 * Simple test to verify registration works end-to-end
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Working Registration', () => {
  test('Complete registration flow', async ({ page }) => {
    console.log('=== TESTING WORKING REGISTRATION ===')
    
    await page.goto('/register')
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Fill in the form
    const uniqueUsername = `test_${Math.random().toString(36).substr(2, 8)}`
    console.log(`Using username: ${uniqueUsername}`)
    
    await page.fill('input[name="username"]', uniqueUsername)
    
    // Submit the form
    await page.click('button[type="submit"]')
    
    // Wait for success message
    await page.waitForSelector('text=Account created successfully', { timeout: 10000 })
    console.log('✅ Registration successful!')
    
    // Wait for redirect to onboarding
    await page.waitForURL(/\/onboarding/, { timeout: 10000 })
    console.log('✅ Redirected to onboarding!')
    
    // Check if onboarding page loads
    const onboardingTitle = await page.locator('text=Welcome to Choices').isVisible()
    console.log(`Onboarding title visible: ${onboardingTitle}`)
    
    // Complete onboarding
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    
    await page.click('text=Get Started')
    await page.waitForTimeout(2000)
    
    // Should be redirected to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 })
    console.log('✅ Redirected to dashboard!')
    
    // Check if we're authenticated
    const dashboardContent = await page.textContent('body')
    const isAuthenticated = !dashboardContent?.includes('login') && !dashboardContent?.includes('register')
    console.log(`Dashboard accessible: ${isAuthenticated}`)
    
    expect(isAuthenticated).toBe(true)
  })
})
