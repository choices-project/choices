/**
 * End-to-End User Journey Tests
 * Tests complete user flows from landing to completion
 */

import { test, expect, Page } from '@playwright/test'

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  username: 'testuser'
}

const testPoll = {
  title: 'Test Poll for E2E Testing',
  description: 'This is a test poll created during end-to-end testing',
  options: ['Option A', 'Option B', 'Option C'],
  category: 'Technology'
}

// Helper functions
async function loginUser(page: Page) {
  await page.goto('/login')
  await page.fill('input[name="username"]', testUser.username)
  await page.fill('input[name="password"]', testUser.password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
}

async function createTestPoll(page: Page) {
  await page.goto('/polls/create')
  await page.fill('input[name="title"]', testPoll.title)
  await page.fill('textarea[name="description"]', testPoll.description)
  
  // Add options
  for (let i = 0; i < testPoll.options.length; i++) {
    await page.fill(`input[name="options[${i}]"]`, testPoll.options[i])
  }
  
  await page.selectOption('select[name="category"]', testPoll.category)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/polls\/\d+/)
}

describe('User Journey Tests', () => {
  test.describe('New User Journey', () => {
    test('Complete new user onboarding flow', async ({ page }) => {
      // 1. Land on homepage
      await page.goto('/')
      await expect(page.locator('h1')).toContainText('Choices')
      
      // 2. Click Get Started
      await page.click('text=Get Started')
      await page.waitForURL('/register')
      
      // 3. Register new account
      await page.fill('input[name="username"]', testUser.username)
      await page.fill('input[name="email"]', testUser.email)
      await page.fill('input[name="password"]', testUser.password)
      await page.click('button[type="submit"]')
      
      // 4. Complete onboarding
      await page.waitForURL('/onboarding')
      
      // Welcome step
      await expect(page.locator('h2')).toContainText('Welcome')
      await page.click('button:has-text("Get Started")')
      
      // Values step
      await page.click('input[value="democracy"]')
      await page.click('input[value="transparency"]')
      await page.click('button:has-text("Continue")')
      
      // Demographics step
      await page.selectOption('select[name="age"]', '25-34')
      await page.selectOption('select[name="location"]', 'United States')
      await page.click('button:has-text("Continue")')
      
      // Privacy step
      await page.click('input[name="privacyLevel"][value="medium"]')
      await page.click('button:has-text("Continue")')
      
      // Complete
      await page.click('button:has-text("Complete Setup")')
      await page.waitForURL('/dashboard')
      
      // 5. Verify dashboard
      await expect(page.locator('h1')).toContainText('Dashboard')
      await expect(page.locator('text=Welcome back')).toBeVisible()
    })
  })

  test.describe('Returning User Journey', () => {
    test.beforeEach(async ({ page }) => {
      await loginUser(page)
    })

    test('Complete poll creation and voting flow', async ({ page }) => {
      // 1. Navigate to polls
      await page.click('nav a[href="/polls"]')
      await page.waitForURL('/polls')
      
      // 2. Create a new poll
      await page.click('a[href="/polls/create"]')
      await page.waitForURL('/polls/create')
      
      await createTestPoll(page)
      
      // 3. Verify poll was created
      await expect(page.locator('h1')).toContainText(testPoll.title)
      await expect(page.locator('text=Option A')).toBeVisible()
      await expect(page.locator('text=Option B')).toBeVisible()
      await expect(page.locator('text=Option C')).toBeVisible()
      
      // 4. Vote on the poll
      await page.click('input[value="Option A"]')
      await page.click('button:has-text("Submit Vote")')
      
      // 5. View results
      await page.waitForSelector('text=Vote submitted successfully')
      await page.click('a[href*="/results"]')
      await page.waitForURL(/\/results/)
      
      // 6. Verify results show
      await expect(page.locator('text=Results')).toBeVisible()
      await expect(page.locator('text=Option A')).toBeVisible()
    })

    test('Navigation flow between all major sections', async ({ page }) => {
      const navigationTests = [
        { href: '/polls', expectedText: 'Polls' },
        { href: '/polls/create', expectedText: 'Create Poll' },
        { href: '/polls/analytics', expectedText: 'Analytics' },
        { href: '/polls/trending', expectedText: 'Trending' },
        { href: '/dashboard', expectedText: 'Dashboard' },
        { href: '/pwa-features', expectedText: 'PWA Features' }
      ]

      for (const test of navigationTests) {
        await page.click(`nav a[href="${test.href}"]`)
        await page.waitForURL(test.href)
        await expect(page.locator('h1, h2')).toContainText(test.expectedText)
      }
    })

    test('Search functionality', async ({ page }) => {
      // Create a poll first
      await createTestPoll(page)
      const pollId = page.url().split('/').pop()
      
      // Navigate to polls page
      await page.goto('/polls')
      
      // Use search
      await page.click('button[aria-label="Search"]')
      await page.fill('input[placeholder*="Search"]', testPoll.title)
      await page.press('input[placeholder*="Search"]', 'Enter')
      
      // Verify search results
      await expect(page.locator(`text=${testPoll.title}`)).toBeVisible()
    })

    test('Mobile navigation flow', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      // Open mobile menu
      await page.click('button[aria-label="Menu"]')
      await expect(page.locator('nav')).toBeVisible()
      
      // Test mobile navigation
      await page.click('nav a[href="/polls"]')
      await page.waitForURL('/polls')
      await expect(page.locator('nav')).not.toBeVisible() // Menu should close
      
      // Reopen and test another link
      await page.click('button[aria-label="Menu"]')
      await page.click('nav a[href="/dashboard"]')
      await page.waitForURL('/dashboard')
    })
  })

  test.describe('Admin User Journey', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin user
      await page.goto('/login')
      await page.fill('input[name="username"]', 'admin')
      await page.fill('input[name="password"]', 'adminpassword')
      await page.click('button[type="submit"]')
      await page.waitForURL('/dashboard')
    })

    test('Complete admin dashboard flow', async ({ page }) => {
      // 1. Access admin dashboard
      await page.click('nav a[href="/admin"]')
      await page.waitForURL('/admin')
      
      // 2. Check system status
      await expect(page.locator('text=System Health')).toBeVisible()
      await expect(page.locator('text=Total Users')).toBeVisible()
      
      // 3. Navigate to site messages
      await page.click('a[href="/admin/site-messages"]')
      await page.waitForURL('/admin/site-messages')
      
      // 4. Create a site message
      await page.click('button:has-text("New Message")')
      await page.fill('input[name="title"]', 'Test Site Message')
      await page.fill('textarea[name="message"]', 'This is a test message')
      await page.selectOption('select[name="type"]', 'info')
      await page.click('button:has-text("Save")')
      
      // 5. Verify message was created
      await expect(page.locator('text=Test Site Message')).toBeVisible()
      
      // 6. Navigate to feedback
      await page.click('a[href="/admin/feedback"]')
      await page.waitForURL('/admin/feedback')
      await expect(page.locator('text=Feedback')).toBeVisible()
    })

    test('Admin navigation flow', async ({ page }) => {
      await page.goto('/admin')
      
      const adminNavTests = [
        { href: '/admin/breaking-news', expectedText: 'Breaking News' },
        { href: '/admin/trending-topics', expectedText: 'Trending Topics' },
        { href: '/admin/generated-polls', expectedText: 'Generated Polls' },
        { href: '/admin/analytics', expectedText: 'Analytics' },
        { href: '/admin/feedback', expectedText: 'Feedback' },
        { href: '/admin/system', expectedText: 'System' }
      ]

      for (const test of adminNavTests) {
        await page.click(`a[href="${test.href}"]`)
        await page.waitForURL(test.href)
        await expect(page.locator('h1, h2')).toContainText(test.expectedText)
      }
    })
  })

  test.describe('Error Handling and Edge Cases', () => {
    test('Handle authentication errors gracefully', async ({ page }) => {
      // Try to access protected route without auth
      await page.goto('/dashboard')
      await page.waitForURL('/login')
      await expect(page.locator('text=Please sign in')).toBeVisible()
    })

    test('Handle network errors gracefully', async ({ page }) => {
      await loginUser(page)
      
      // Simulate offline mode
      await page.route('**/*', route => route.abort())
      
      await page.goto('/polls')
      await expect(page.locator('text=Unable to load polls')).toBeVisible()
    })

    test('Handle form validation errors', async ({ page }) => {
      await loginUser(page)
      
      // Try to create poll with invalid data
      await page.goto('/polls/create')
      await page.click('button[type="submit"]')
      
      // Should show validation errors
      await expect(page.locator('text=Title is required')).toBeVisible()
    })
  })

  test.describe('Performance and Accessibility', () => {
    test('Page load performance', async ({ page }) => {
      const startTime = Date.now()
      await page.goto('/')
      const loadTime = Date.now() - startTime
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000)
    })

    test('Accessibility compliance', async ({ page }) => {
      await page.goto('/')
      
      // Check for proper heading structure
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').count()
      expect(headings).toBeGreaterThan(0)
      
      // Check for alt text on images
      const images = await page.locator('img').count()
      if (images > 0) {
        const imagesWithAlt = await page.locator('img[alt]').count()
        expect(imagesWithAlt).toBe(images)
      }
    })

    test('Keyboard navigation', async ({ page }) => {
      await page.goto('/')
      
      // Tab through navigation
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      
      // Should be able to navigate with keyboard
      await page.keyboard.press('Enter')
      await expect(page.url()).not.toBe('http://localhost:3000/')
    })
  })

  test.describe('Cross-browser Compatibility', () => {
    test('Works in different viewport sizes', async ({ page }) => {
      const viewports = [
        { width: 375, height: 667 }, // Mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1920, height: 1080 } // Desktop
      ]

      for (const viewport of viewports) {
        await page.setViewportSize(viewport)
        await page.goto('/')
        
        // Verify navigation is accessible
        await expect(page.locator('nav')).toBeVisible()
        
        // Verify content is readable
        await expect(page.locator('h1')).toBeVisible()
      }
    })
  })
})
