import { test, expect, Page } from '@playwright/test'

test.describe('Enhanced Onboarding Flow', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    await page.goto('/onboarding')
  })

  test('should load onboarding page with welcome step', async () => {
    // Check page title
    await expect(page).toHaveTitle(/Onboarding/)
    
    // Check welcome step is displayed
    await expect(page.locator('h1')).toContainText('Welcome to Choices')
    await expect(page.locator('text=Your voice matters, but your privacy matters more')).toBeVisible()
    
    // Check progress indicator
    await expect(page.locator('[data-testid="progress-indicator"]')).toBeVisible()
  })

  test('should navigate through welcome step sections', async () => {
    // Check initial welcome section
    await expect(page.locator('text=Our Privacy Promise')).toBeVisible()
    
    // Click to next section
    await page.click('text=Learn More About Your Experience')
    
    // Check value proposition section
    await expect(page.locator('text=What Makes Choices Different')).toBeVisible()
    
    // Click to preview section
    await page.click('text=See What You\'ll Learn')
    
    // Check preview section
    await expect(page.locator('text=Your Onboarding Journey')).toBeVisible()
    
    // Complete welcome step
    await page.click('text=Get Started')
  })

  test('should complete privacy philosophy step', async () => {
    // Navigate to privacy philosophy step
    await page.click('text=Get Started')
    
    // Check privacy philosophy content
    await expect(page.locator('h2')).toContainText('Privacy Philosophy')
    await expect(page.locator('text=Privacy by Design')).toBeVisible()
    
    // Navigate through sections
    await page.click('text=Configure Your Privacy')
    
    // Set privacy level
    await page.click('text=Medium Privacy')
    
    // Set profile visibility
    await page.click('text=Public')
    
    // Set data sharing
    await page.click('text=Analytics Only')
    
    // Preview settings
    await page.click('text=Preview Your Settings')
    
    // Verify summary
    await expect(page.locator('text=Medium Privacy')).toBeVisible()
    await expect(page.locator('text=Public')).toBeVisible()
    await expect(page.locator('text=Analytics Only')).toBeVisible()
    
    // Save preferences
    await page.click('text=Save Preferences')
  })

  test('should complete platform tour step', async () => {
    // Navigate to platform tour
    await page.click('text=Get Started')
    await page.click('text=Save Preferences')
    
    // Check platform tour overview
    await expect(page.locator('h2')).toContainText('Platform Tour')
    await expect(page.locator('text=Create Polls')).toBeVisible()
    await expect(page.locator('text=Vote Securely')).toBeVisible()
    await expect(page.locator('text=View Results')).toBeVisible()
    await expect(page.locator('text=Analytics')).toBeVisible()
    
    // Start tour
    await page.click('text=Start Tour')
    
    // Navigate through tour sections
    await expect(page.locator('h3')).toContainText('Create Engaging Polls')
    await page.click('text=Next: Voting')
    
    await expect(page.locator('h3')).toContainText('Secure Voting Experience')
    await page.click('text=Next: Results')
    
    await expect(page.locator('h3')).toContainText('Real-Time Results')
    await page.click('text=Next: Analytics')
    
    await expect(page.locator('h3')).toContainText('Analytics & Insights')
    await page.click('text=Complete Tour')
  })

  test('should complete data usage step', async () => {
    // Navigate to data usage step
    await page.click('text=Get Started')
    await page.click('text=Save Preferences')
    await page.click('text=Complete Tour')
    
    // Check data usage overview
    await expect(page.locator('h2')).toContainText('How We Use Your Data')
    await expect(page.locator('text=Analytics')).toBeVisible()
    await expect(page.locator('text=Research')).toBeVisible()
    await expect(page.locator('text=Privacy')).toBeVisible()
    
    // Configure preferences
    await page.click('text=Configure Your Preferences')
    
    // Set data sharing level
    await page.click('text=Analytics Only')
    
    // Set additional preferences
    await page.check('input[type="checkbox"]:has-text("Allow Contact for Research")')
    await page.check('input[type="checkbox"]:has-text("Participate in Research Studies")')
    
    // Preview settings
    await page.click('text=Preview Your Settings')
    
    // Verify summary
    await expect(page.locator('text=Analytics Only')).toBeVisible()
    await expect(page.locator('text=Allowed')).toBeVisible()
    await expect(page.locator('text=Enabled')).toBeVisible()
    
    // Save preferences
    await page.click('text=Save Preferences')
  })

  test('should complete authentication setup step', async () => {
    // Navigate to auth setup
    await page.click('text=Get Started')
    await page.click('text=Save Preferences')
    await page.click('text=Complete Tour')
    await page.click('text=Save Preferences')
    
    // Check auth options
    await expect(page.locator('h2')).toContainText('Secure Your Account')
    await expect(page.locator('text=Email')).toBeVisible()
    await expect(page.locator('text=Social Login')).toBeVisible()
    await expect(page.locator('text=Anonymous')).toBeVisible()
    await expect(page.locator('text=Skip for Now')).toBeVisible()
    
    // Choose email authentication
    await page.click('text=Email')
    await page.click('text=Continue with Email')
    
    // Fill email form
    await page.fill('input[type="email"]', 'test@example.com')
    await page.click('text=Send Login Link')
    
    // Check success message
    await expect(page.locator('text=Check your email for the login link!')).toBeVisible()
  })

  test('should complete profile setup step', async () => {
    // Navigate to profile setup
    await page.click('text=Get Started')
    await page.click('text=Save Preferences')
    await page.click('text=Complete Tour')
    await page.click('text=Save Preferences')
    await page.click('text=Continue')
    
    // Check profile setup
    await expect(page.locator('h2')).toContainText('Set Up Your Profile')
    await expect(page.locator('text=Profile')).toBeVisible()
    await expect(page.locator('text=Visibility')).toBeVisible()
    await expect(page.locator('text=Notifications')).toBeVisible()
    
    // Start setup
    await page.click('text=Start Setup')
    
    // Fill profile information
    await page.fill('input[placeholder="Enter your display name"]', 'Test User')
    
    // Set profile visibility
    await page.click('text=Public')
    
    // Navigate to notifications
    await page.click('text=Next: Notifications')
    
    // Set notification preferences
    await page.check('input[type="checkbox"]:has-text("Email Notifications")')
    await page.check('input[type="checkbox"]:has-text("Push Notifications")')
    
    // Review settings
    await page.click('text=Review Settings')
    
    // Verify summary
    await expect(page.locator('text=Test User')).toBeVisible()
    await expect(page.locator('text=Public')).toBeVisible()
    await expect(page.locator('text=Enabled')).toBeVisible()
    
    // Complete setup
    await page.click('text=Complete Setup')
  })

  test('should complete first experience step', async () => {
    // Navigate to first experience
    await page.click('text=Get Started')
    await page.click('text=Save Preferences')
    await page.click('text=Complete Tour')
    await page.click('text=Save Preferences')
    await page.click('text=Continue')
    await page.click('text=Complete Setup')
    
    // Check first experience
    await expect(page.locator('h2')).toContainText('Your First Experience')
    await expect(page.locator('text=Create a Poll')).toBeVisible()
    await expect(page.locator('text=Vote Securely')).toBeVisible()
    await expect(page.locator('text=See Results')).toBeVisible()
    
    // Start demo
    await page.click('text=Start Demo')
    
    // Interact with demo poll
    await expect(page.locator('text=What\'s your favorite way to stay informed about current events?')).toBeVisible()
    await page.click('input[value="social"]')
    await page.click('text=Continue to Voting')
    
    // Complete voting process
    await expect(page.locator('text=Cast Your Vote')).toBeVisible()
    await expect(page.locator('text=Social Media')).toBeVisible()
    await page.click('text=Cast My Vote')
    
    // View results
    await page.click('text=View Results')
    await expect(page.locator('text=Poll Results')).toBeVisible()
    await expect(page.locator('text=Vote Recorded!')).toBeVisible()
    
    // Complete experience
    await page.click('text=Continue')
    await expect(page.locator('text=Experience Complete!')).toBeVisible()
    await page.click('text=Complete Onboarding')
  })

  test('should complete onboarding and redirect to dashboard', async () => {
    // Complete all steps
    await page.click('text=Get Started')
    await page.click('text=Save Preferences')
    await page.click('text=Complete Tour')
    await page.click('text=Save Preferences')
    await page.click('text=Continue')
    await page.click('text=Complete Setup')
    await page.click('text=Complete Onboarding')
    
    // Check completion step
    await expect(page.locator('text=Welcome to Choices!')).toBeVisible()
    await expect(page.locator('text=Your onboarding is complete')).toBeVisible()
    
    // Check next steps
    await expect(page.locator('text=Create Your First Poll')).toBeVisible()
    await expect(page.locator('text=Explore Trending Polls')).toBeVisible()
    await expect(page.locator('text=View Your Dashboard')).toBeVisible()
  })

  test('should handle back navigation correctly', async () => {
    // Navigate through steps
    await page.click('text=Get Started')
    await page.click('text=Save Preferences')
    
    // Go back
    await page.click('text=Back')
    await expect(page.locator('h2')).toContainText('Privacy Philosophy')
    
    // Go back again
    await page.click('text=Back')
    await expect(page.locator('h1')).toContainText('Welcome to Choices')
  })

  test('should save progress correctly', async () => {
    // Complete partial onboarding
    await page.click('text=Get Started')
    await page.click('text=Save Preferences')
    await page.click('text=Complete Tour')
    
    // Reload page
    await page.reload()
    
    // Should resume from where we left off
    await expect(page.locator('h2')).toContainText('Data Usage')
  })

  test('should be responsive on mobile devices', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check mobile layout
    await expect(page.locator('h1')).toContainText('Welcome to Choices')
    
    // Navigate through steps
    await page.click('text=Get Started')
    await expect(page.locator('h2')).toContainText('Privacy Philosophy')
    
    // Check mobile navigation
    await expect(page.locator('button:has-text("Back")')).toBeVisible()
    await expect(page.locator('button:has-text("Next")')).toBeVisible()
  })

  test('should handle keyboard navigation', async () => {
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    
    // Should navigate to next step
    await expect(page.locator('h2')).toContainText('Privacy Philosophy')
    
    // Test back navigation with keyboard
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    
    // Should go back
    await expect(page.locator('h1')).toContainText('Welcome to Choices')
  })

  test('should handle form validation', async () => {
    // Navigate to auth setup
    await page.click('text=Get Started')
    await page.click('text=Save Preferences')
    await page.click('text=Complete Tour')
    await page.click('text=Save Preferences')
    
    // Try to submit without email
    await page.click('text=Continue with Email')
    await page.click('text=Send Login Link')
    
    // Should show validation error
    await expect(page.locator('text=Please enter your email address')).toBeVisible()
    
    // Enter valid email
    await page.fill('input[type="email"]', 'test@example.com')
    await page.click('text=Send Login Link')
    
    // Should show success message
    await expect(page.locator('text=Check your email for the login link!')).toBeVisible()
  })

  test('should handle accessibility requirements', async () => {
    // Check ARIA labels
    await expect(page.locator('[aria-label]')).toBeVisible()
    
    // Check heading structure
    const headings = await page.locator('h1, h2, h3').all()
    expect(headings.length).toBeGreaterThan(0)
    
    // Check form labels
    await expect(page.locator('label')).toBeVisible()
    
    // Check button accessibility
    await expect(page.locator('button[type="button"]')).toBeVisible()
  })

  test('should handle error states gracefully', async () => {
    // Mock API error
    await page.route('**/api/onboarding/progress', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    })
    
    // Try to complete step
    await page.click('text=Get Started')
    
    // Should handle error gracefully
    await expect(page.locator('text=Something went wrong')).toBeVisible()
  })

  test('should complete full onboarding flow end-to-end', async () => {
    // Complete entire onboarding flow
    await page.click('text=Get Started')
    await page.click('text=Save Preferences')
    await page.click('text=Complete Tour')
    await page.click('text=Save Preferences')
    await page.click('text=Continue')
    await page.click('text=Complete Setup')
    await page.click('text=Complete Onboarding')
    
    // Verify completion
    await expect(page.locator('text=Welcome to Choices!')).toBeVisible()
    
    // Check that user is redirected to dashboard
    await page.click('text=View Your Dashboard')
    await expect(page).toHaveURL(/\/dashboard/)
  })
})
