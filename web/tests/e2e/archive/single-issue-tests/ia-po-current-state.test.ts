/**
 * IA/PO Current State Analysis
 * Tests to identify gaps between current implementation and ideal behavior
 */

import { test, expect, Page } from '@playwright/test'

test.describe('IA/PO Current State Analysis', () => {
  test('Current registration form state', async ({ page }) => {
    await page.goto('/register')
    
    // Check what's currently implemented
    console.log('=== CURRENT REGISTRATION FORM ANALYSIS ===')
    
    // 1. Check if username field exists and is required
    const usernameField = page.locator('input[name="username"]')
    await expect(usernameField).toBeVisible()
    console.log('✅ Username field is visible')
    
    // 2. Check if email field exists and is optional
    const emailField = page.locator('input[name="email"]')
    const emailVisible = await emailField.isVisible()
    console.log(`Email field visible: ${emailVisible}`)
    
    // 3. Check if password field exists and is optional
    const passwordField = page.locator('input[name="password"]')
    const passwordVisible = await passwordField.isVisible()
    console.log(`Password field visible: ${passwordVisible}`)
    
    // 4. Check for toggle buttons
    const addEmailButton = page.locator('text=Add email')
    const addPasswordButton = page.locator('text=Add password')
    
    const hasEmailToggle = await addEmailButton.isVisible()
    const hasPasswordToggle = await addPasswordButton.isVisible()
    
    console.log(`Email toggle button: ${hasEmailToggle}`)
    console.log(`Password toggle button: ${hasPasswordToggle}`)
    
    // 5. Check for privacy messaging
    const privacyMessages = [
      'Email is optional',
      'Password is optional',
      'privacy'
    ]
    
    for (const message of privacyMessages) {
      const hasMessage = await page.locator(`text=${message}`).isVisible()
      console.log(`Privacy message "${message}": ${hasMessage}`)
    }
    
    // Check biometric text separately to avoid conflicts
    const biometricText = await page.locator('text=biometric authentication').first().isVisible()
    console.log(`Biometric text visible: ${biometricText}`)
    
    // 6. Check submit button state
    const submitButton = page.locator('button[type="submit"]')
    const isEnabled = await submitButton.isEnabled()
    console.log(`Submit button enabled: ${isEnabled}`)
    
    // 7. Test minimal registration
    await page.fill('input[name="username"]', 'testuser123')
    await page.click('button[type="submit"]')
    
    // Check if it redirects to onboarding
    try {
      await page.waitForURL('/onboarding', { timeout: 5000 })
      console.log('✅ Redirects to onboarding after registration')
    } catch (error) {
      console.log('❌ Does not redirect to onboarding')
      console.log('Current URL:', page.url())
    }
  })

  test('Current onboarding flow state', async ({ page }) => {
    // First register a user
    await page.goto('/register')
    await page.fill('input[name="username"]', 'onboarding_test_user')
    await page.click('button[type="submit"]')
    
    // Check if we reach onboarding
    try {
      await page.waitForURL('/onboarding', { timeout: 5000 })
      console.log('=== CURRENT ONBOARDING FLOW ANALYSIS ===')
      
      // Check onboarding content
      const onboardingContent = await page.textContent('body')
      console.log('Onboarding page content preview:', onboardingContent?.substring(0, 200))
      
      // Check for specific onboarding elements
      const welcomeText = await page.locator('text=Welcome').isVisible()
      const privacyText = await page.locator('text=Privacy').isVisible()
      const progressIndicator = await page.locator('[data-testid="onboarding-progress"]').isVisible()
      
      console.log(`Welcome text visible: ${welcomeText}`)
      console.log(`Privacy text visible: ${privacyText}`)
      console.log(`Progress indicator visible: ${progressIndicator}`)
      
    } catch (error) {
      console.log('❌ Cannot reach onboarding flow')
      console.log('Current URL:', page.url())
    }
  })

  test('Current login form state', async ({ page }) => {
    await page.goto('/login')
    
    console.log('=== CURRENT LOGIN FORM ANALYSIS ===')
    
    // Check login form fields
    const usernameField = await page.locator('input[name="username"]').isVisible()
    const emailField = await page.locator('input[name="email"]').isVisible()
    const passwordField = await page.locator('input[name="password"]').isVisible()
    
    console.log(`Username field visible: ${usernameField}`)
    console.log(`Email field visible: ${emailField}`)
    console.log(`Password field visible: ${passwordField}`)
    
    // Check for biometric options
    const biometricButton = await page.locator('[data-testid="biometric-login-button"]').isVisible()
    const biometricText = await page.locator('text=biometric').isVisible()
    
    console.log(`Biometric button visible: ${biometricButton}`)
    console.log(`Biometric text visible: ${biometricText}`)
  })

  test('Current API endpoints', async ({ page }) => {
    console.log('=== CURRENT API ENDPOINTS ANALYSIS ===')
    
    // Test the IA/PO registration endpoint
    try {
      const response = await page.request.post('/api/auth/register-ia', {
        data: {
          username: 'apitestuser',
          email: 'apitest@example.com',
          password: 'TestPassword123!'
        }
      })
      
      console.log(`IA/PO registration endpoint status: ${response.status()}`)
      const responseData = await response.json()
      console.log('Response data:', responseData)
      
    } catch (error) {
      console.log('❌ IA/PO registration endpoint not available')
    }
    
    // Test legacy registration endpoint
    try {
      const response = await page.request.post('/api/auth/register', {
        data: {
          username: 'legacytestuser',
          email: 'legacytest@example.com',
          password: 'TestPassword123!'
        }
      })
      
      console.log(`Legacy registration endpoint status: ${response.status()}`)
      
    } catch (error) {
      console.log('❌ Legacy registration endpoint not available')
    }
  })
})
