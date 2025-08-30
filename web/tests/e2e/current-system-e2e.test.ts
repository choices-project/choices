/**
 * Current System E2E Test Suite
 * Tests the actual current functionality of our system
 * 
 * Created: 2025-08-28
 * Status: Testing current system state
 */

import { test, expect } from '@playwright/test'

test.describe('Current System E2E Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test environment
    await page.addInitScript(() => {
      window.__TEST_MODE__ = true
    })
  })

  test('Homepage loads with trending polls', async ({ page }) => {
    await page.goto('/')
    
    // Check that homepage loads
    await expect(page.locator('h1')).toBeVisible()
    
    // Check for trending polls section
    await expect(page.locator('text=Trending Polls')).toBeVisible()
    
    // Check for poll creation link
    await expect(page.locator('a[href="/polls/create"]')).toBeVisible()
    
    console.log('✅ Homepage loads correctly')
  })

  test('User registration flow', async ({ page }) => {
    await page.goto('/register')
    
    // Check registration form exists
    await expect(page.locator('form')).toBeVisible()
    await expect(page.locator('input[name="username"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    
    // Fill registration form
    const testUser = `testuser_${Date.now()}`
    await page.fill('input[name="username"]', testUser)
    await page.fill('input[name="email"]', `${testUser}@example.com`)
    
    // Submit registration
    await page.click('button[type="submit"]')
    
    // Should redirect to onboarding or dashboard
    await page.waitForURL('**/onboarding**', { timeout: 10000 })
    
    console.log('✅ Registration flow works')
  })

  test('Poll creation wizard', async ({ page }) => {
    await page.goto('/polls/create')
    
    // Check that poll creation wizard loads
    await expect(page.locator('text=Create Poll')).toBeVisible()
    
    // Check for wizard steps
    await expect(page.locator('text=Step 1 of 4')).toBeVisible()
    
    // Check for title input
    await expect(page.locator('input[placeholder*="poll question"]')).toBeVisible()
    
    // Check for description textarea
    await expect(page.locator('textarea[placeholder*="context"]')).toBeVisible()
    
    console.log('✅ Poll creation wizard loads')
  })

  test('Voting interface components', async ({ page }) => {
    // Test single choice voting
    await page.goto('/test-single-choice')
    await expect(page.locator('text=Single Choice Voting')).toBeVisible()
    await expect(page.locator('input[type="radio"]')).toBeVisible()
    
    // Test ranked choice voting
    await page.goto('/test-ranked-choice')
    await expect(page.locator('text=Ranked Choice Voting')).toBeVisible()
    
    // Test approval voting
    await page.goto('/test-approval')
    await expect(page.locator('text=Approval Voting')).toBeVisible()
    
    console.log('✅ Voting interfaces load correctly')
  })

  test('PWA functionality', async ({ page }) => {
    await page.goto('/pwa-app')
    
    // Check for PWA install button
    await expect(page.locator('text=Install App')).toBeVisible()
    
    // Check for offline functionality
    await expect(page.locator('text=Offline Mode')).toBeVisible()
    
    console.log('✅ PWA functionality available')
  })

  test('Admin dashboard', async ({ page }) => {
    await page.goto('/admin')
    
    // Check admin dashboard loads
    await expect(page.locator('text=Admin Dashboard')).toBeVisible()
    
    // Check for admin navigation
    await expect(page.locator('a[href="/admin/dashboard"]')).toBeVisible()
    await expect(page.locator('a[href="/admin/users"]')).toBeVisible()
    await expect(page.locator('a[href="/admin/polls"]')).toBeVisible()
    
    console.log('✅ Admin dashboard loads')
  })

  test('Analytics and reporting', async ({ page }) => {
    await page.goto('/analytics')
    
    // Check analytics page loads
    await expect(page.locator('text=Analytics')).toBeVisible()
    
    // Check for analytics components
    await expect(page.locator('text=User Engagement')).toBeVisible()
    await expect(page.locator('text=Poll Performance')).toBeVisible()
    
    console.log('✅ Analytics page loads')
  })

  test('Privacy and security features', async ({ page }) => {
    await page.goto('/advanced-privacy')
    
    // Check privacy page loads
    await expect(page.locator('text=Advanced Privacy')).toBeVisible()
    
    // Check for privacy controls
    await expect(page.locator('text=Data Controls')).toBeVisible()
    await expect(page.locator('text=Zero-Knowledge Proofs')).toBeVisible()
    
    console.log('✅ Privacy features available')
  })

  test('Cross-platform compatibility', async ({ page }) => {
    await page.goto('/cross-platform-testing')
    
    // Check cross-platform testing page
    await expect(page.locator('text=Cross-Platform Testing')).toBeVisible()
    
    // Check for device optimization
    await expect(page.locator('text=Device Optimization')).toBeVisible()
    
    console.log('✅ Cross-platform features available')
  })

  test('Error handling and 404', async ({ page }) => {
    // Test 404 page
    await page.goto('/nonexistent-page')
    await expect(page.locator('h1')).toContainText('404')
    
    console.log('✅ Error handling works')
  })

  test('Performance and loading', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000)
    
    console.log(`✅ Page loads in ${loadTime}ms`)
  })
})






