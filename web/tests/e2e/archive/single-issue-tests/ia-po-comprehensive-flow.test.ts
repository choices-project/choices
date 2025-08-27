/**
 * IA/PO Comprehensive Flow Test
 * Tests the complete user journey and identifies implementation gaps
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Comprehensive Flow Analysis', () => {
  test('Complete registration to onboarding flow analysis', async ({ page }) => {
    console.log('=== IA/PO COMPREHENSIVE FLOW ANALYSIS ===')
    
    // Step 1: Registration Form Analysis
    console.log('\n📝 Step 1: Registration Form Analysis')
    await page.goto('/register')
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Check form elements
    const usernameField = await page.locator('input[name="username"]').isVisible()
    const emailToggle = await page.locator('text=Add email').isVisible()
    const passwordToggle = await page.locator('text=Add password').isVisible()
    const biometricSection = await page.locator('text=Biometric Authentication').first().isVisible()
    
    console.log(`✅ Username field visible: ${usernameField}`)
    console.log(`✅ Email toggle visible: ${emailToggle}`)
    console.log(`✅ Password toggle visible: ${passwordToggle}`)
    console.log(`✅ Biometric section visible: ${biometricSection}`)
    
    // Step 2: Test Registration Process
    console.log('\n🔄 Step 2: Registration Process Analysis')
    
    const uniqueUsername = `test_${Math.random().toString(36).substr(2, 8)}`
    console.log(`Using username: ${uniqueUsername}`)
    
    await page.fill('input[name="username"]', uniqueUsername)
    await page.click('button[type="submit"]')
    
    // Wait for the form submission to process
    await page.waitForTimeout(3000)
    
    // Wait for any response and capture what happens
    try {
      // Wait for either success message or error message
      const successMessage = await page.waitForSelector('text=Account created successfully', { timeout: 5000 })
      if (successMessage) {
        console.log('✅ Registration successful - success message found')
        
        // Check if redirect happens
        try {
          await page.waitForURL('/onboarding', { timeout: 5000 })
          console.log('✅ Redirect to onboarding successful')
        } catch (error) {
          console.log('❌ No redirect to onboarding - current URL:', page.url())
        }
      }
    } catch (error) {
      console.log('❌ No success message found')
      
      // Check for error messages
      const errorMessages = await page.locator('.bg-red-50, .text-red-700, [role="alert"]').allTextContents()
      if (errorMessages.length > 0) {
        console.log('❌ Error messages found:', errorMessages)
      }
      
      // Check current URL
      console.log('Current URL after submission:', page.url())
      
      // Check if we're still on registration page
      const stillOnRegister = page.url().includes('/register')
      console.log(`Still on registration page: ${stillOnRegister}`)
    }
    
    // Step 3: Check if onboarding page exists
    console.log('\n🎯 Step 3: Onboarding Page Analysis')
    await page.goto('/onboarding')
    
    const onboardingContent = await page.textContent('body')
    const hasOnboardingContent = onboardingContent && onboardingContent.length > 100
    
    console.log(`Onboarding page accessible: ${hasOnboardingContent}`)
    if (hasOnboardingContent) {
      console.log('Onboarding content preview:', onboardingContent?.substring(0, 200))
    } else {
      console.log('❌ Onboarding page not found or empty')
    }
    
    // Step 4: Check login functionality
    console.log('\n🔐 Step 4: Login System Analysis')
    await page.goto('/login')
    
    const loginForm = await page.locator('form').isVisible()
    const usernameLoginField = await page.locator('input[name="username"]').isVisible()
    const passwordLoginField = await page.locator('input[name="password"]').isVisible()
    const biometricLoginButton = await page.locator('text=biometric').first().isVisible()
    
    console.log(`Login form visible: ${loginForm}`)
    console.log(`Username login field: ${usernameLoginField}`)
    console.log(`Password login field: ${passwordLoginField}`)
    console.log(`Biometric login option: ${biometricLoginButton}`)
    
    // Step 5: Check dashboard/authenticated area
    console.log('\n🏠 Step 5: Dashboard/Authenticated Area Analysis')
    await page.goto('/dashboard')
    
    const dashboardContent = await page.textContent('body')
    const isAuthenticated = !dashboardContent?.includes('login') && !dashboardContent?.includes('register')
    
    console.log(`Dashboard accessible: ${isAuthenticated}`)
    if (!isAuthenticated) {
      console.log('❌ Dashboard requires authentication or redirects to login')
    }
    
    // Step 6: API Endpoint Analysis
    console.log('\n🔌 Step 6: API Endpoint Analysis')
    
    // Test registration endpoint directly
    const response = await page.request.post('/api/auth/register-ia', {
      data: {
        username: `apitest_${Date.now()}`,
        email: `apitest_${Date.now()}@example.com`,
        password: 'TestPassword123!'
      }
    })
    
    console.log(`Registration API status: ${response.status()}`)
    const responseData = await response.json()
    console.log('Registration API response:', responseData)
    
    // Test login endpoint
    try {
      const loginResponse = await page.request.post('/api/auth/login', {
        data: {
          username: uniqueUsername,
          password: 'TestPassword123!'
        }
      })
      console.log(`Login API status: ${loginResponse.status()}`)
    } catch (error) {
      console.log('❌ Login API endpoint not available')
    }
    
    console.log('\n=== ANALYSIS COMPLETE ===')
  })

  test('Biometric authentication flow analysis', async ({ page }) => {
    console.log('\n📱 Biometric Authentication Flow Analysis')
    await page.goto('/register')
    
    // Check biometric availability
    const biometricAvailable = await page.locator('text=Biometric Authentication Available').isVisible()
    const biometricNotAvailable = await page.locator('text=Not available on this device').isVisible()
    
    console.log(`Biometric available: ${biometricAvailable}`)
    console.log(`Biometric not available: ${biometricNotAvailable}`)
    
    if (biometricAvailable) {
      console.log('✅ Biometric authentication is available on this device')
    } else if (biometricNotAvailable) {
      console.log('ℹ️ Biometric authentication not available on this device')
    } else {
      console.log('❓ Biometric status unclear')
    }
    
    // Check for biometric registration flow
    const biometricRegistrationButton = await page.locator('[data-testid="biometric-register"], text=Register with biometric').isVisible()
    console.log(`Biometric registration button: ${biometricRegistrationButton}`)
  })

  test('Privacy and user experience analysis', async ({ page }) => {
    console.log('\n🔒 Privacy and UX Analysis')
    await page.goto('/register')
    
    // Check privacy messaging
    const privacyMessages = [
      'Email is optional',
      'Password is optional',
      'biometric authentication',
      'privacy',
      'data control'
    ]
    
    for (const message of privacyMessages) {
      const hasMessage = await page.locator(`text=${message}`).isVisible()
      console.log(`Privacy message "${message}": ${hasMessage}`)
    }
    
    // Check accessibility
    const hasLabels = await page.locator('label').count()
    const hasAriaLabels = await page.locator('[aria-label]').count()
    
    console.log(`Form labels: ${hasLabels}`)
    console.log(`ARIA labels: ${hasAriaLabels}`)
    
    // Check mobile responsiveness
    await page.setViewportSize({ width: 375, height: 667 })
    const mobileUsernameField = await page.locator('input[name="username"]').isVisible()
    const mobileSubmitButton = await page.locator('button[type="submit"]').isVisible()
    
    console.log(`Mobile username field visible: ${mobileUsernameField}`)
    console.log(`Mobile submit button visible: ${mobileSubmitButton}`)
  })
})
