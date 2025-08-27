/**
 * IA/PO Debug Test
 * Debug why the registration form is not loading
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Debug', () => {
  test('Debug registration page', async ({ page }) => {
    console.log('=== DEBUGGING REGISTRATION PAGE ===')
    
    // Listen for console errors
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
        console.log('Console error:', msg.text())
      }
    })
    
    // Listen for page errors
    page.on('pageerror', error => {
      console.log('Page error:', error.message)
    })
    
    await page.goto('/register')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Check page content
    const bodyText = await page.textContent('body')
    console.log('Body text preview:', bodyText?.substring(0, 500))
    
    // Check if there are any elements on the page
    const allElements = await page.locator('*').count()
    console.log(`Total elements on page: ${allElements}`)
    
    // Check for specific elements
    const divs = await page.locator('div').count()
    const forms = await page.locator('form').count()
    const inputs = await page.locator('input').count()
    const buttons = await page.locator('button').count()
    
    console.log(`Divs: ${divs}`)
    console.log(`Forms: ${forms}`)
    console.log(`Inputs: ${inputs}`)
    console.log(`Buttons: ${buttons}`)
    
    // Check for any text content
    const hasText = await page.locator('text=Create your account').isVisible()
    console.log(`Has "Create your account" text: ${hasText}`)
    
    // Check for loading states
    const loadingElements = await page.locator('text=Loading').count()
    console.log(`Loading elements: ${loadingElements}`)
    
    // Check for error states
    const errorElements = await page.locator('text=Error').count()
    console.log(`Error elements: ${errorElements}`)
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/debug-registration.png', fullPage: true })
    
    // Log console errors
    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors)
    }
    
    // Basic check - if we have any content at all
    expect(allElements).toBeGreaterThan(10)
  })
})

