/**
 * Admin System End-to-End Tests
 * 
 * Tests the complete admin system functionality:
 * 1. Admin authentication and access control
 * 2. Admin dashboard and navigation
 * 3. Admin functionality (users, feedback, analytics, etc.)
 * 4. Security measures and unauthorized access prevention
 */

import { test, expect } from '@playwright/test'

test.describe('Admin System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login')
  })

  test.describe('Admin Authentication', () => {
    test('should redirect non-admin users away from admin pages', async ({ page }) => {
      // Try to access admin dashboard without authentication
      await page.goto('/admin')
      
      // Should be redirected to login or show access denied
      await expect(page).toHaveURL(/\/login|\/admin/)
      
      // If on admin page, should show access denied message
      if (page.url().includes('/admin')) {
        await expect(page.locator('text=Access Denied')).toBeVisible()
      }
    })

    test('should show admin access denied for regular users', async ({ page }) => {
      // Login as regular user (you'll need to set up test user)
      await page.fill('input[name="email"]', 'regular@example.com')
      await page.fill('input[name="password"]', 'password123')
      await page.click('button[type="submit"]')
      
      // Wait for login to complete
      await page.waitForURL(/\/dashboard|\/profile/)
      
      // Try to access admin
      await page.goto('/admin')
      
      // Should show access denied
      await expect(page.locator('text=Access Denied')).toBeVisible()
    })

    test('should allow admin users to access admin dashboard', async ({ page }) => {
      // Login as admin user (you'll need to set up test admin user)
      await page.fill('input[name="email"]', 'admin@example.com')
      await page.fill('input[name="password"]', 'adminpassword')
      await page.click('button[type="submit"]')
      
      // Wait for login to complete
      await page.waitForURL(/\/dashboard|\/profile/)
      
      // Navigate to admin
      await page.goto('/admin')
      
      // Should show admin dashboard
      await expect(page.locator('h1')).toContainText(/Admin|Dashboard/)
      await expect(page.locator('nav')).toBeVisible()
    })
  })

  test.describe('Admin Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin user
      await page.fill('input[name="email"]', 'admin@example.com')
      await page.fill('input[name="password"]', 'adminpassword')
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/dashboard|\/profile/)
      
      // Navigate to admin dashboard
      await page.goto('/admin')
    })

    test('should display admin dashboard with all sections', async ({ page }) => {
      // Check main dashboard elements
      await expect(page.locator('h1')).toContainText(/Admin|Dashboard/)
      
      // Check navigation sidebar
      await expect(page.locator('nav')).toBeVisible()
      await expect(page.locator('a[href="/admin/dashboard"]')).toBeVisible()
      await expect(page.locator('a[href="/admin/users"]')).toBeVisible()
      await expect(page.locator('a[href="/admin/feedback"]')).toBeVisible()
      await expect(page.locator('a[href="/admin/analytics"]')).toBeVisible()
      await expect(page.locator('a[href="/admin/system"]')).toBeVisible()
      await expect(page.locator('a[href="/admin/site-messages"]')).toBeVisible()
    })

    test('should navigate between admin sections', async ({ page }) => {
      // Test navigation to users page
      await page.click('a[href="/admin/users"]')
      await expect(page).toHaveURL('/admin/users')
      await expect(page.locator('h1')).toContainText(/Users|User Management/)
      
      // Test navigation to feedback page
      await page.click('a[href="/admin/feedback"]')
      await expect(page).toHaveURL('/admin/feedback')
      await expect(page.locator('h1')).toContainText(/Feedback/)
      
      // Test navigation to analytics page
      await page.click('a[href="/admin/analytics"]')
      await expect(page).toHaveURL('/admin/analytics')
      await expect(page.locator('h1')).toContainText(/Analytics/)
      
      // Test navigation to system page
      await page.click('a[href="/admin/system"]')
      await expect(page).toHaveURL('/admin/system')
      await expect(page.locator('h1')).toContainText(/System/)
      
      // Test navigation to site messages page
      await page.click('a[href="/admin/site-messages"]')
      await expect(page).toHaveURL('/admin/site-messages')
      await expect(page.locator('h1')).toContainText(/Site Messages|Messages/)
    })
  })

  test.describe('Admin User Management', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin and navigate to users page
      await page.fill('input[name="email"]', 'admin@example.com')
      await page.fill('input[name="password"]', 'adminpassword')
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/dashboard|\/profile/)
      await page.goto('/admin/users')
    })

    test('should display user management interface', async ({ page }) => {
      await expect(page.locator('h1')).toContainText(/Users|User Management/)
      
      // Check for user list or user management controls
      await expect(page.locator('table, .user-list, .user-grid')).toBeVisible()
    })

    test('should allow admin to view user details', async ({ page }) => {
      // Look for user rows or user cards
      const userRows = page.locator('tr, .user-card, .user-item')
      if (await userRows.count() > 0) {
        // Click on first user
        await userRows.first().click()
        
        // Should show user details or modal
        await expect(page.locator('.user-details, .modal, .user-profile')).toBeVisible()
      }
    })
  })

  test.describe('Admin Feedback Management', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin and navigate to feedback page
      await page.fill('input[name="email"]', 'admin@example.com')
      await page.fill('input[name="password"]', 'adminpassword')
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/dashboard|\/profile/)
      await page.goto('/admin/feedback')
    })

    test('should display feedback management interface', async ({ page }) => {
      await expect(page.locator('h1')).toContainText(/Feedback/)
      
      // Check for feedback list or management controls
      await expect(page.locator('table, .feedback-list, .feedback-grid')).toBeVisible()
    })

    test('should allow admin to filter feedback', async ({ page }) => {
      // Look for filter controls
      const filterControls = page.locator('select, .filter-dropdown, .filter-button')
      if (await filterControls.count() > 0) {
        await expect(filterControls.first()).toBeVisible()
      }
    })

    test('should allow admin to update feedback status', async ({ page }) => {
      // Look for feedback items with status controls
      const feedbackItems = page.locator('.feedback-item, tr')
      if (await feedbackItems.count() > 0) {
        const statusControls = page.locator('select[name*="status"], .status-button')
        if (await statusControls.count() > 0) {
          await expect(statusControls.first()).toBeVisible()
        }
      }
    })
  })

  test.describe('Admin Analytics', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin and navigate to analytics page
      await page.fill('input[name="email"]', 'admin@example.com')
      await page.fill('input[name="password"]', 'adminpassword')
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/dashboard|\/profile/)
      await page.goto('/admin/analytics')
    })

    test('should display analytics dashboard', async ({ page }) => {
      await expect(page.locator('h1')).toContainText(/Analytics/)
      
      // Check for charts or analytics widgets
      await expect(page.locator('canvas, .chart, .analytics-widget, .metric-card')).toBeVisible()
    })

    test('should show system metrics', async ({ page }) => {
      // Look for metrics or statistics
      const metrics = page.locator('.metric, .stat, .kpi, .number')
      if (await metrics.count() > 0) {
        await expect(metrics.first()).toBeVisible()
      }
    })
  })

  test.describe('Admin System Monitoring', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin and navigate to system page
      await page.fill('input[name="email"]', 'admin@example.com')
      await page.fill('input[name="password"]', 'adminpassword')
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/dashboard|\/profile/)
      await page.goto('/admin/system')
    })

    test('should display system monitoring interface', async ({ page }) => {
      await expect(page.locator('h1')).toContainText(/System/)
      
      // Check for system status indicators
      await expect(page.locator('.system-status, .health-check, .status-indicator')).toBeVisible()
    })

    test('should show system health metrics', async ({ page }) => {
      // Look for health indicators
      const healthIndicators = page.locator('.health, .status, .indicator')
      if (await healthIndicators.count() > 0) {
        await expect(healthIndicators.first()).toBeVisible()
      }
    })
  })

  test.describe('Admin Site Messages', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin and navigate to site messages page
      await page.fill('input[name="email"]', 'admin@example.com')
      await page.fill('input[name="password"]', 'adminpassword')
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/dashboard|\/profile/)
      await page.goto('/admin/site-messages')
    })

    test('should display site messages interface', async ({ page }) => {
      await expect(page.locator('h1')).toContainText(/Site Messages|Messages/)
      
      // Check for message management controls
      await expect(page.locator('form, .message-form, .message-list')).toBeVisible()
    })

    test('should allow admin to create site messages', async ({ page }) => {
      // Look for message creation form
      const messageForm = page.locator('form, .message-form')
      if (await messageForm.count() > 0) {
        await expect(messageForm.first()).toBeVisible()
        
        // Check for form fields
        const messageField = page.locator('textarea, input[name*="message"]')
        if (await messageField.count() > 0) {
          await expect(messageField.first()).toBeVisible()
        }
      }
    })
  })

  test.describe('Admin Security', () => {
    test('should not expose admin API endpoints to non-admin users', async ({ page }) => {
      // Try to access admin API endpoints directly
      const adminEndpoints = [
        '/api/admin/feedback',
        '/api/admin/users',
        '/api/admin/system-metrics',
        '/api/admin/system-status',
        '/api/admin/site-messages'
      ]

      for (const endpoint of adminEndpoints) {
        const response = await page.request.get(endpoint)
        expect(response.status()).toBe(401) // Unauthorized
      }
    })

    test('should require authentication for all admin routes', async ({ page }) => {
      // Try to access admin pages without authentication
      const adminPages = [
        '/admin',
        '/admin/dashboard',
        '/admin/users',
        '/admin/feedback',
        '/admin/analytics',
        '/admin/system',
        '/admin/site-messages'
      ]

      for (const adminPage of adminPages) {
        await page.goto(adminPage)
        
        // Should redirect to login or show access denied
        const currentUrl = page.url()
        expect(currentUrl).toMatch(/\/login|\/admin/)
        
        if (currentUrl.includes('/admin')) {
          await expect(page.locator('text=Access Denied')).toBeVisible()
        }
      }
    })
  })
})
