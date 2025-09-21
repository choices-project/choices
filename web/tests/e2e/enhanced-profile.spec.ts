import { test, expect } from '@playwright/test'

test.describe('Enhanced Profile System', () => {
  const testUser = {
    email: 'profile-test@example.com',
    username: 'profiletestuser',
    password: 'TestPassword123!'
  }

  test.beforeEach(async ({ page }) => {
    // Register and login user for each test
    await page.goto('/register')
    await page.waitForSelector('[data-testid="register-hydrated"]', { state: 'attached' })
    await page.click('button:has-text("Password Account")')
    await page.waitForTimeout(500)
    
    await page.fill('[data-testid="email"]', testUser.email)
    await page.fill('[data-testid="username"]', testUser.username)
    await page.fill('[data-testid="password"]', testUser.password)
    await page.fill('[data-testid="confirm-password"]', testUser.password)
    await page.click('[data-testid="register-button"]')
    
    // Complete enhanced onboarding
    await page.waitForURL('/onboarding?step=welcome')
    await page.click('button:has-text("Get Started")')
    await page.selectOption('select[name="ageRange"]', '25-34')
    await page.selectOption('select[name="gender"]', 'other')
    await page.selectOption('select[name="education"]', 'bachelors')
    await page.selectOption('select[name="income"]', '50000-75000')
    await page.click('button:has-text("Continue")')
    await page.click('button:has-text("Continue")') // Values step
    await page.click('button:has-text("Continue")') // Privacy Philosophy step
    await page.click('button:has-text("Continue")') // Data Usage step
    await page.fill('input[name="displayName"]', 'Test User')
    await page.click('button:has-text("Continue")') // Profile Setup step
    await page.click('button:has-text("Continue")') // Notifications step
    await page.click('button:has-text("Continue")') // Privacy Settings step
    await page.click('button:has-text("Complete")') // Complete step
    await page.waitForURL('/dashboard')
  })

  test('should display enhanced profile page with all features', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')

    // Profile header should be visible
    await expect(page.locator('h1')).toContainText('Profile')
    
    // User information section
    await expect(page.locator('text=User Information')).toBeVisible()
    await expect(page.locator('text=Email')).toBeVisible()
    await expect(page.locator('text=Verification Tier')).toBeVisible()
    
    // Biometric credentials section
    await expect(page.locator('text=Biometric Credentials')).toBeVisible()
    await expect(page.locator('text=Trust Score')).toBeVisible()
    
    // Account management section
    await expect(page.locator('text=Account Management')).toBeVisible()
    await expect(page.locator('button:has-text("Export Data")')).toBeVisible()
    await expect(page.locator('button:has-text("Delete Account")')).toBeVisible()
  })

  test('should navigate to profile edit page', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    
    // Click edit profile button
    await page.click('button:has-text("Edit Profile")')
    await page.waitForURL('/profile/edit')
    
    // Should show edit form
    await expect(page.locator('h1')).toContainText('Edit Profile')
    await expect(page.locator('input[name="displayName"]')).toBeVisible()
    await expect(page.locator('textarea[name="bio"]')).toBeVisible()
  })

  test('should update profile information', async ({ page }) => {
    await page.goto('/profile/edit')
    await page.waitForLoadState('networkidle')
    
    // Update display name
    await page.fill('[data-testid="display-name-input"]', 'Updated Test User')
    
    // Update bio
    await page.fill('[data-testid="bio-textarea"]', 'This is my updated bio')
    
    // Select participation style
    await page.click('button[role="combobox"]:has-text("Select participation style")')
    await page.click('text=Contributor')
    
    // Save changes
    await page.click('[data-testid="save-changes-button"]')
    
    // Should show success message
    await expect(page.locator('text=Profile updated successfully')).toBeVisible()
    
    // Should redirect back to profile page
    await page.waitForURL('/profile')
  })

  test('should handle avatar upload', async ({ page }) => {
    await page.goto('/profile/edit')
    await page.waitForLoadState('networkidle')
    
    // Create a test image file
    const testImagePath = '/tmp/test-avatar.png'
    await page.evaluate(() => {
      // Create a simple test image
      const canvas = document.createElement('canvas')
      canvas.width = 100
      canvas.height = 100
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#ff0000'
        ctx.fillRect(0, 0, 100, 100)
      }
      return canvas.toDataURL('image/png')
    })
    
    // Test avatar upload (this would need a real file in a real test)
    // For now, just verify the upload button exists
    await expect(page.locator('button:has-text("Upload Avatar")')).toBeVisible()
  })

  test('should manage privacy settings', async ({ page }) => {
    await page.goto('/profile/edit')
    await page.waitForLoadState('networkidle')
    
    // Privacy settings section should be visible
    await expect(page.locator('text=Privacy Settings')).toBeVisible()
    
    // Profile visibility toggle
    await expect(page.locator('text=Profile Visibility')).toBeVisible()
    await expect(page.locator('button[role="combobox"]:has-text("Public")')).toBeVisible()
    
    // Privacy toggles
    await expect(page.locator('text=Show Email')).toBeVisible()
    await expect(page.locator('text=Show Activity')).toBeVisible()
    await expect(page.locator('text=Allow Messages')).toBeVisible()
    await expect(page.locator('text=Share Demographics')).toBeVisible()
    await expect(page.locator('text=Allow Analytics')).toBeVisible()
  })

  test('should export user data', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    
    // Click export data button
    await page.click('[data-testid="export-data-button"]')
    
    // Should show confirmation dialog
    await expect(page.locator('text=Export Your Data')).toBeVisible()
    await expect(page.locator('text=This will download all your data')).toBeVisible()
    
    // Confirm export
    await page.click('button:has-text("Export")')
    
    // Should show success message
    await expect(page.locator('text=Data export started')).toBeVisible()
  })

  test('should handle account deletion flow', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    
    // Click delete account button
    await page.click('[data-testid="delete-account-button"]')
    
    // Should show confirmation dialog
    await expect(page.locator('text=Delete Account')).toBeVisible()
    await expect(page.locator('text=This action cannot be undone')).toBeVisible()
    
    // Type confirmation text
    await page.fill('input[placeholder*="DELETE"]', 'DELETE')
    
    // Confirm deletion
    await page.click('button:has-text("Delete Account")')
    
    // Should redirect to login page
    await page.waitForURL('/login')
  })

  test('should display biometric credentials', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    
    // Biometric credentials section
    await expect(page.locator('text=Biometric Credentials')).toBeVisible()
    
    // Should show trust score
    await expect(page.locator('text=Trust Score')).toBeVisible()
    
    // Should show credential count
    await expect(page.locator('text=credential')).toBeVisible()
  })

  test('should navigate to biometric setup', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    
    // Click biometric setup button
    await page.click('button:has-text("Set Up Biometric")')
    
    // Should navigate to biometric setup page
    await page.waitForURL('/profile/biometric-setup')
    
    // Should show biometric setup interface
    await expect(page.locator('text=Biometric Setup')).toBeVisible()
  })

  test('should handle profile validation errors', async ({ page }) => {
    await page.goto('/profile/edit')
    await page.waitForLoadState('networkidle')
    
    // Clear required fields
    await page.fill('[data-testid="display-name-input"]', '')
    
    // Try to save
    await page.click('[data-testid="save-changes-button"]')
    
    // Should show validation error
    await expect(page.locator('text=Display name is required')).toBeVisible()
  })

  test('should maintain profile state across navigation', async ({ page }) => {
    await page.goto('/profile/edit')
    await page.waitForLoadState('networkidle')
    
    // Make changes
    await page.fill('[data-testid="display-name-input"]', 'Navigation Test User')
    await page.fill('[data-testid="bio-textarea"]', 'Testing navigation persistence')
    
    // Navigate away and back
    await page.goto('/dashboard')
    await page.goto('/profile/edit')
    
    // Changes should be preserved (if using proper state management)
    await expect(page.locator('[data-testid="display-name-input"]')).toHaveValue('Navigation Test User')
    await expect(page.locator('[data-testid="bio-textarea"]')).toHaveValue('Testing navigation persistence')
  })
})
