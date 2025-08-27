/**
 * IA/PO Form Loading Test
 * Simple test to verify the registration form loads properly
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Form Loading', () => {
  test('Registration form loads properly', async ({ page }) => {
    console.log('=== TESTING FORM LOADING ===')
    
    await page.goto('/register')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Check if the form container exists
    const formExists = await page.locator('form').isVisible()
    console.log(`Form visible: ${formExists}`)
    
    // Check username field
    const usernameField = await page.locator('input[name="username"]').isVisible()
    console.log(`Username field visible: ${usernameField}`)
    
    // Check if we can interact with the username field
    if (usernameField) {
      await page.fill('input[name="username"]', 'testuser')
      const value = await page.inputValue('input[name="username"]')
      console.log(`Username field value: ${value}`)
    }
    
    // Check submit button
    const submitButton = await page.locator('button[type="submit"]').isVisible()
    console.log(`Submit button visible: ${submitButton}`)
    
    // Check page title
    const title = await page.title()
    console.log(`Page title: ${title}`)
    
    // Check for any error messages
    const errorMessages = await page.locator('.bg-red-50, .text-red-700').allTextContents()
    if (errorMessages.length > 0) {
      console.log('Error messages found:', errorMessages)
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/form-loading-test.png' })
    
    // Basic assertions
    expect(formExists).toBe(true)
    expect(usernameField).toBe(true)
    expect(submitButton).toBe(true)
  })
})

