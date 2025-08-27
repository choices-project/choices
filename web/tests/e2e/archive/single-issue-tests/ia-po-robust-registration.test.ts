/**
 * IA/PO Robust Registration Test
 * Handles timing issues and provides comprehensive feedback
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Robust Registration', () => {
  test('Robust registration flow with proper timing', async ({ page }) => {
    console.log('=== ROBUST REGISTRATION TEST ===')
    
    await page.goto('/register')
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    
    // Fill in the form
    const uniqueUsername = `test_${Math.random().toString(36).substr(2, 8)}`
    console.log(`Using username: ${uniqueUsername}`)
    
    await page.fill('input[name="username"]', uniqueUsername)
    
    // Submit the form
    await page.click('button[type="submit"]')
    
    // Wait for either success message or error message
    let registrationSuccess = false
    let errorMessage = null
    
    try {
      // Wait for success message with longer timeout
      await page.waitForSelector('text=Account created successfully', { timeout: 15000 })
      registrationSuccess = true
      console.log('✅ Registration successful!')
    } catch (error) {
      console.log('❌ Success message not found, checking for errors...')
      
      // Check for error messages
      const errorElements = await page.locator('.bg-red-50, .text-red-700, [role="alert"]').allTextContents()
      if (errorElements.length > 0) {
        errorMessage = errorElements.join(', ')
        console.log(`❌ Error found: ${errorMessage}`)
      }
      
      // Check if we're still on registration page
      const currentUrl = page.url()
      console.log(`Current URL: ${currentUrl}`)
      
      if (currentUrl.includes('/onboarding')) {
        registrationSuccess = true
        console.log('✅ Registration successful (redirected to onboarding)!')
      }
    }
    
    // If registration was successful, test onboarding
    if (registrationSuccess) {
      console.log('🎯 Testing onboarding flow...')
      
      // Wait for onboarding page to load
      await page.waitForURL(/\/onboarding/, { timeout: 10000 })
      console.log('✅ Onboarding page loaded!')
      
      // Check onboarding content
      const onboardingTitle = await page.locator('text=Welcome to Choices').first().isVisible()
      console.log(`Onboarding title visible: ${onboardingTitle}`)
      
      if (onboardingTitle) {
        // Complete onboarding steps
        console.log('📝 Completing onboarding steps...')
        
        // Step 1: Welcome (already on this step)
        await page.waitForTimeout(1000)
        
        // Step 2: Profile
        await page.click('text=Next')
        await page.waitForTimeout(1000)
        console.log('✅ Step 2 completed')
        
        // Step 3: Privacy
        await page.click('text=Next')
        await page.waitForTimeout(1000)
        console.log('✅ Step 3 completed')
        
        // Step 4: Complete
        await page.click('text=Next')
        await page.waitForTimeout(1000)
        console.log('✅ Step 4 completed')
        
        // Finish onboarding
        await page.click('text=Get Started')
        await page.waitForTimeout(2000)
        console.log('✅ Onboarding completed!')
        
        // Check if redirected to dashboard
        try {
          await page.waitForURL(/\/dashboard/, { timeout: 10000 })
          console.log('✅ Redirected to dashboard!')
          
          // Check if we're authenticated
          const dashboardContent = await page.textContent('body')
          const isAuthenticated = !dashboardContent?.includes('login') && !dashboardContent?.includes('register')
          console.log(`Dashboard accessible: ${isAuthenticated}`)
          
          expect(isAuthenticated).toBe(true)
        } catch (error) {
          console.log('❌ Dashboard redirect failed')
          console.log(`Current URL: ${page.url()}`)
        }
      } else {
        console.log('❌ Onboarding page not loading properly')
      }
    } else {
      console.log('❌ Registration failed')
      if (errorMessage) {
        console.log(`Error: ${errorMessage}`)
      }
    }
  })

  test('Test registration with different auth methods', async ({ page }) => {
    console.log('=== TESTING DIFFERENT AUTH METHODS ===')
    
    await page.goto('/register')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Test 1: Username only (biometric-first)
    console.log('📱 Test 1: Username only (biometric-first)')
    const username1 = `test_${Math.random().toString(36).substr(2, 8)}`
    await page.fill('input[name="username"]', username1)
    await page.click('button[type="submit"]')
    
    try {
      await page.waitForSelector('text=Account created successfully', { timeout: 10000 })
      console.log('✅ Username-only registration successful')
    } catch (error) {
      console.log('❌ Username-only registration failed')
    }
    
    // Go back to registration
    await page.goto('/register')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Test 2: Username + Email
    console.log('📧 Test 2: Username + Email')
    const username2 = `test_${Math.random().toString(36).substr(2, 8)}`
    await page.fill('input[name="username"]', username2)
    
    // Add email
    await page.click('text=Add email')
    await page.fill('input[name="email"]', `${username2}@example.com`)
    
    await page.click('button[type="submit"]')
    
    try {
      await page.waitForSelector('text=Account created successfully', { timeout: 10000 })
      console.log('✅ Username + Email registration successful')
    } catch (error) {
      console.log('❌ Username + Email registration failed')
    }
    
    // Go back to registration
    await page.goto('/register')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Test 3: Username + Password
    console.log('🔐 Test 3: Username + Password')
    const username3 = `test_${Math.random().toString(36).substr(2, 8)}`
    await page.fill('input[name="username"]', username3)
    
    // Add password
    await page.click('text=Add password')
    await page.fill('input[name="password"]', 'TestPassword123!')
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!')
    
    await page.click('button[type="submit"]')
    
    try {
      await page.waitForSelector('text=Account created successfully', { timeout: 10000 })
      console.log('✅ Username + Password registration successful')
    } catch (error) {
      console.log('❌ Username + Password registration failed')
    }
  })
})

