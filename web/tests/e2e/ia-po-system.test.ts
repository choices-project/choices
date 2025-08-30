/**
 * IA/PO System End-to-End Tests
 * Tests the ideal behavior of the Identity Authentication/Progressive Onboarding system
 * These tests define HOW THE SYSTEM SHOULD WORK, not just current implementation
 */

import { test, expect, Page } from '@playwright/test'

// Test data for different user scenarios
const biometricUser = {
  username: 'biometric_user',
  email: 'biometric@example.com',
  password: undefined // Biometric-first user
}

const passwordUser = {
  username: 'password_user',
  email: 'password@example.com',
  password: 'SecurePassword123!'
}

const minimalUser = {
  username: 'minimal_user',
  email: undefined, // Email optional
  password: undefined // Password optional
}

// Helper functions for ideal IA/PO behavior
async function testBiometricAvailability(page: Page) {
  // Test should detect biometric availability
  const biometricSupported = await page.evaluate(() => {
    return window.PublicKeyCredential !== undefined
  })
  
  if (biometricSupported) {
    // Should show biometric option prominently
    await expect(page.locator('[data-testid="biometric-option"]')).toBeVisible()
    await expect(page.locator('text=🎉 Biometric Authentication Available!')).toBeVisible()
  }
  
  return biometricSupported
}

async function testProgressiveFormDisclosure(page: Page) {
  // Should start with minimal required fields
  await expect(page.locator('input[name="username"]')).toBeVisible()
  await expect(page.locator('input[name="email"]')).not.toBeVisible()
  await expect(page.locator('input[name="password"]')).not.toBeVisible()
  
  // Should have toggle buttons for optional fields
  await expect(page.locator('text=Add email')).toBeVisible()
  await expect(page.locator('text=Add password')).toBeVisible()
}

describe('IA/PO System - Ideal Behavior Tests', () => {
  test.describe('Registration Flow - How It Should Work', () => {
    test('Biometric-first registration with minimal data collection', async ({ page }) => {
      // 1. Navigate to registration
      await page.goto('/register')
      
      // 2. Should show progressive form disclosure
      await testProgressiveFormDisclosure(page)
      
      // 3. Should detect and recommend biometric authentication
      const biometricAvailable = await testBiometricAvailability(page)
      
      // 4. Should allow registration with just username
      await page.fill('input[name="username"]', minimalUser.username)
      
      // 5. Should validate username format
      await expect(page.locator('text=3-20 characters, letters, numbers, _ and - only')).toBeVisible()
      
      // 6. Should show clear privacy messaging
      await expect(page.locator('text=Email is optional - you can register with just a username')).toBeVisible()
      await expect(page.locator('text=Password is optional - biometric authentication is more secure')).toBeVisible()
      
      // 7. Should enable submit button with just username
      await expect(page.locator('button[type="submit"]')).toBeEnabled()
      
      // 8. Should handle registration successfully
      await page.click('button[type="submit"]')
      
      // 9. Should redirect to progressive onboarding
      await page.waitForURL('/onboarding')
      
      // 10. Should show success message
      await expect(page.locator('text=Account created successfully!')).toBeVisible()
    })

    test('Optional email addition during registration', async ({ page }) => {
      await page.goto('/register')
      
      // 1. Should show email toggle
      await page.click('text=Add email')
      
      // 2. Should reveal email field
      await expect(page.locator('input[name="email"]')).toBeVisible()
      
      // 3. Should validate email format when provided
      await page.fill('input[name="email"]', 'invalid-email')
      await page.fill('input[name="username"]', 'testuser')
      await page.click('button[type="submit"]')
      
      // 4. Should show validation error
      await expect(page.locator('text=Please enter a valid email address')).toBeVisible()
      
      // 5. Should accept valid email
      await page.fill('input[name="email"]', 'valid@example.com')
      await page.click('button[type="submit"]')
      
      // 6. Should proceed to onboarding
      await page.waitForURL('/onboarding')
    })

    test('Optional password addition during registration', async ({ page }) => {
      await page.goto('/register')
      
      // 1. Should show password toggle
      await page.click('text=Add password')
      
      // 2. Should reveal password fields
      await expect(page.locator('input[name="password"]')).toBeVisible()
      await expect(page.locator('input[name="confirmPassword"]')).toBeVisible()
      
      // 3. Should validate password strength
      await page.fill('input[name="username"]', 'testuser')
      await page.fill('input[name="password"]', 'weak')
      await page.click('button[type="submit"]')
      
      // 4. Should show password strength error
      await expect(page.locator('text=Password must be at least 8 characters long')).toBeVisible()
      
      // 5. Should validate password confirmation
      await page.fill('input[name="password"]', 'StrongPassword123!')
      await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!')
      await page.click('button[type="submit"]')
      
      // 6. Should show confirmation error
      await expect(page.locator('text=Passwords do not match')).toBeVisible()
      
      // 7. Should accept valid password
      await page.fill('input[name="confirmPassword"]', 'StrongPassword123!')
      await page.click('button[type="submit"]')
      
      // 8. Should proceed to onboarding
      await page.waitForURL('/onboarding')
    })

    test('Username availability checking', async ({ page }) => {
      await page.goto('/register')
      
      // 1. Should check username availability in real-time
      await page.fill('input[name="username"]', 'existinguser')
      
      // 2. Should show availability status
      await expect(page.locator('text=Username already taken')).toBeVisible()
      
      // 3. Should prevent submission with taken username
      await expect(page.locator('button[type="submit"]')).toBeDisabled()
      
      // 4. Should accept available username
      await page.fill('input[name="username"]', 'newuser123')
      await expect(page.locator('button[type="submit"]')).toBeEnabled()
    })
  })

  test.describe('Progressive Onboarding - How It Should Work', () => {
    test('Seamless transition from registration to onboarding', async ({ page }) => {
      // 1. Complete minimal registration
      await page.goto('/register')
      await page.fill('input[name="username"]', 'onboarding_user')
      await page.click('button[type="submit"]')
      
      // 2. Should automatically redirect to onboarding
      await page.waitForURL('/onboarding')
      
      // 3. Should show welcome message with user's username
      await expect(page.locator('text=Welcome, onboarding_user!')).toBeVisible()
      
      // 4. Should explain the onboarding process
      await expect(page.locator('text=Let\'s set up your preferences')).toBeVisible()
      
      // 5. Should show progress indicator
      await expect(page.locator('[data-testid="onboarding-progress"]')).toBeVisible()
    })

    test('Privacy education during onboarding', async ({ page }) => {
      // Setup: Complete registration and reach onboarding
      await page.goto('/register')
      await page.fill('input[name="username"]', 'privacy_user')
      await page.click('button[type="submit"]')
      await page.waitForURL('/onboarding')
      
      // 1. Should start with privacy philosophy step
      await expect(page.locator('text=Privacy Philosophy')).toBeVisible()
      
      // 2. Should explain data minimization
      await expect(page.locator('text=We collect only what you choose to share')).toBeVisible()
      
      // 3. Should explain user control
      await expect(page.locator('text=You control your data')).toBeVisible()
      
      // 4. Should provide clear privacy options
      await expect(page.locator('input[name="privacyLevel"]')).toBeVisible()
      
      // 5. Should allow users to skip optional steps
      await expect(page.locator('text=Skip for now')).toBeVisible()
    })

    test('Progressive data collection', async ({ page }) => {
      // Setup: Complete registration and reach onboarding
      await page.goto('/register')
      await page.fill('input[name="username"]', 'progressive_user')
      await page.click('button[type="submit"]')
      await page.waitForURL('/onboarding')
      
      // 1. Should collect data progressively, not all at once
      await page.click('button:has-text("Get Started")')
      
      // 2. Should explain each step before collecting data
      await expect(page.locator('text=This helps us personalize your experience')).toBeVisible()
      
      // 3. Should allow users to decline optional data collection
      await page.click('text=Skip for now')
      
      // 4. Should not penalize users for skipping optional steps
      await expect(page.locator('text=That\'s okay! You can always add this later')).toBeVisible()
      
      // 5. Should complete onboarding successfully even with minimal data
      await page.click('button:has-text("Complete Setup")')
      await page.waitForURL('/dashboard')
    })
  })

  test.describe('Authentication Flow - How It Should Work', () => {
    test('Biometric authentication for returning users', async ({ page }) => {
      // 1. Navigate to login
      await page.goto('/login')
      
      // 2. Should prioritize biometric authentication
      await expect(page.locator('text=Sign in with biometrics')).toBeVisible()
      
      // 3. Should show biometric button prominently
      await expect(page.locator('[data-testid="biometric-login-button"]')).toBeVisible()
      
      // 4. Should provide fallback to username/password
      await expect(page.locator('text=Or sign in with username')).toBeVisible()
      
      // 5. Should remember user's preferred authentication method
      // (This would require previous biometric setup)
    })

    test('Username-based login for password users', async ({ page }) => {
      await page.goto('/login')
      
      // 1. Should allow username-based login
      await page.click('text=Or sign in with username')
      
      // 2. Should show username field (not email)
      await expect(page.locator('input[name="username"]')).toBeVisible()
      await expect(page.locator('input[name="email"]')).not.toBeVisible()
      
      // 3. Should show password field if user has password
      await expect(page.locator('input[name="password"]')).toBeVisible()
      
      // 4. Should validate credentials
      await page.fill('input[name="username"]', 'nonexistent')
      await page.fill('input[name="password"]', 'wrongpassword')
      await page.click('button[type="submit"]')
      
      // 5. Should show appropriate error message
      await expect(page.locator('text=Invalid username or password')).toBeVisible()
    })

    test('Graceful handling of missing biometric credentials', async ({ page }) => {
      await page.goto('/login')
      
      // 1. Should attempt biometric authentication
      await page.click('[data-testid="biometric-login-button"]')
      
      // 2. Should handle biometric failure gracefully
      // (Simulate biometric failure)
      
      // 3. Should provide clear fallback options
      await expect(page.locator('text=Biometric authentication failed')).toBeVisible()
      await expect(page.locator('text=Try username login instead')).toBeVisible()
      
      // 4. Should not block user from accessing account
      await page.click('text=Try username login instead')
      await expect(page.locator('input[name="username"]')).toBeVisible()
    })
  })

  test.describe('User Experience - How It Should Work', () => {
    test('Consistent privacy messaging throughout', async ({ page }) => {
      // 1. Registration page should emphasize privacy
      await page.goto('/register')
      await expect(page.locator('text=Your privacy matters')).toBeVisible()
      await expect(page.locator('text=Minimal data collection')).toBeVisible()
      
      // 2. Onboarding should reinforce privacy principles
      await page.fill('input[name="username"]', 'privacy_test_user')
      await page.click('button[type="submit"]')
      await page.waitForURL('/onboarding')
      
      await expect(page.locator('text=You control your data')).toBeVisible()
      await expect(page.locator('text=Transparent data usage')).toBeVisible()
      
      // 3. Dashboard should show privacy status
      await page.click('button:has-text("Complete Setup")')
      await page.waitForURL('/dashboard')
      
      await expect(page.locator('[data-testid="privacy-status"]')).toBeVisible()
    })

    test('Accessibility and mobile responsiveness', async ({ page }) => {
      // 1. Should be fully keyboard navigable
      await page.goto('/register')
      await page.keyboard.press('Tab')
      await expect(page.locator('input[name="username"]')).toBeFocused()
      
      // 2. Should have proper ARIA labels
      await expect(page.locator('input[name="username"]')).toHaveAttribute('aria-label')
      
      // 3. Should work on mobile devices
      await page.setViewportSize({ width: 375, height: 667 })
      await expect(page.locator('input[name="username"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()
      
      // 4. Should have touch-friendly interface
      await expect(page.locator('button[type="submit"]')).toHaveCSS('min-height', '44px')
    })

    test('Error handling and user feedback', async ({ page }) => {
      await page.goto('/register')
      
      // 1. Should provide immediate feedback for validation errors
      await page.fill('input[name="username"]', 'a') // Too short
      await page.click('button[type="submit"]')
      await expect(page.locator('text=Username must be at least 3 characters')).toBeVisible()
      
      // 2. Should clear errors when user fixes issues
      await page.fill('input[name="username"]', 'validusername')
      await expect(page.locator('text=Username must be at least 3 characters')).not.toBeVisible()
      
      // 3. Should show loading states during operations
      await page.click('button[type="submit"]')
      await expect(page.locator('text=Creating Account...')).toBeVisible()
      
      // 4. Should handle network errors gracefully
      // (Would need to mock network failure)
    })
  })

  test.describe('Data Management - How It Should Work', () => {
    test('User data control and transparency', async ({ page }) => {
      // Setup: Complete registration and onboarding
      await page.goto('/register')
      await page.fill('input[name="username"]', 'data_control_user')
      await page.click('button[type="submit"]')
      await page.waitForURL('/onboarding')
      await page.click('button:has-text("Complete Setup")')
      await page.waitForURL('/dashboard')
      
      // 1. Should provide data export functionality
      await page.click('[data-testid="user-menu"]')
      await page.click('text=Export My Data')
      await expect(page.locator('text=Download your data')).toBeVisible()
      
      // 2. Should show what data is collected
      await page.click('text=Privacy Settings')
      await expect(page.locator('text=Data we collect')).toBeVisible()
      
      // 3. Should allow data deletion
      await page.click('text=Delete Account')
      await expect(page.locator('text=This action cannot be undone')).toBeVisible()
      
      // 4. Should provide clear data retention policies
      await expect(page.locator('text=Data retention policy')).toBeVisible()
    })

    test('Progressive data collection tracking', async ({ page }) => {
      // Setup: Complete registration
      await page.goto('/register')
      await page.fill('input[name="username"]', 'progressive_data_user')
      await page.click('button[type="submit"]')
      await page.waitForURL('/onboarding')
      
      // 1. Should track what data user has provided
      await page.click('text=Privacy Settings')
      await expect(page.locator('text=Data provided: Username only')).toBeVisible()
      
      // 2. Should show what data is optional
      await expect(page.locator('text=Optional: Email, Password, Profile')).toBeVisible()
      
      // 3. Should allow users to add data later
      await page.click('text=Add Email')
      await expect(page.locator('input[name="email"]')).toBeVisible()
    })
  })
})

describe('IA/PO System - Integration Tests', () => {
  test('Complete user journey from registration to first poll', async ({ page }) => {
    // 1. Registration with minimal data
    await page.goto('/register')
    await page.fill('input[name="username"]', 'journey_user')
    await page.click('button[type="submit"]')
    await page.waitForURL('/onboarding')
    
    // 2. Complete onboarding with privacy focus
    await page.click('button:has-text("Get Started")')
    await page.click('input[value="privacy"]')
    await page.click('button:has-text("Continue")')
    await page.click('text=Skip for now') // Skip demographics
    await page.click('input[value="high"]') // High privacy
    await page.click('button:has-text("Continue")')
    await page.click('button:has-text("Complete Setup")')
    await page.waitForURL('/dashboard')
    
    // 3. Should be able to create and vote on polls
    await page.click('text=Create Poll')
    await page.fill('input[name="title"]', 'Test Poll')
    await page.fill('textarea[name="description"]', 'Test Description')
    await page.fill('input[name="options[0]"]', 'Option A')
    await page.fill('input[name="options[1]"]', 'Option B')
    await page.click('button[type="submit"]')
    
    // 4. Should be able to vote anonymously
    await page.waitForURL(/\/polls\/\d+/)
    await page.click('input[value="Option A"]')
    await page.click('button:has-text("Vote")')
    
    // 5. Should show voting results
    await expect(page.locator('text=Vote submitted successfully')).toBeVisible()
  })
})









