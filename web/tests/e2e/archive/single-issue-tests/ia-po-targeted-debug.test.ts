/**
 * IA/PO Targeted Debug Test
 * Targeted debugging of form rendering issues
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Targeted Debug', () => {
  test('Targeted form debugging', async ({ page }) => {
    console.log('=== TARGETED FORM DEBUGGING ===')
    
    await page.goto('/register')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Wait a bit more for any client-side rendering
    await page.waitForTimeout(2000)
    
    // Check for the title text first
    const titleVisible = await page.locator('text=Create your account').isVisible()
    console.log(`Title "Create your account" visible: ${titleVisible}`)
    
    // Check for any form elements with different selectors
    const formByTag = await page.locator('form').count()
    const formByClass = await page.locator('[class*="form"]').count()
    const formByRole = await page.locator('[role="form"]').count()
    
    console.log(`Forms by tag: ${formByTag}`)
    console.log(`Forms by class: ${formByClass}`)
    console.log(`Forms by role: ${formByRole}`)
    
    // Check for input elements with different selectors
    const inputByTag = await page.locator('input').count()
    const inputByName = await page.locator('[name]').count()
    const inputByType = await page.locator('[type]').count()
    
    console.log(`Inputs by tag: ${inputByTag}`)
    console.log(`Elements with name attribute: ${inputByName}`)
    console.log(`Elements with type attribute: ${inputByType}`)
    
    // List all elements with name attributes
    const namedElements = await page.locator('[name]').all()
    console.log('Elements with name attributes:')
    for (const element of namedElements) {
      const name = await element.getAttribute('name')
      const tag = await element.evaluate(el => el.tagName.toLowerCase())
      console.log(`  - ${tag}[name="${name}"]`)
    }
    
    // Check for username field specifically
    const usernameByTag = await page.locator('input[name="username"]').count()
    const usernameByPlaceholder = await page.locator('[placeholder*="username"]').count()
    const usernameByText = await page.locator('text=Username').count()
    
    console.log(`Username inputs by name: ${usernameByTag}`)
    console.log(`Username inputs by placeholder: ${usernameByPlaceholder}`)
    console.log(`Username labels by text: ${usernameByText}`)
    
    // Check for submit button
    const submitByType = await page.locator('button[type="submit"]').count()
    const submitByText = await page.locator('text=Create Account').count()
    const submitByText2 = await page.locator('text=Creating Account').count()
    
    console.log(`Submit buttons by type: ${submitByType}`)
    console.log(`Submit buttons by "Create Account" text: ${submitByText}`)
    console.log(`Submit buttons by "Creating Account" text: ${submitByText2}`)
    
    // List all buttons
    const allButtons = await page.locator('button').all()
    console.log('All buttons:')
    for (const button of allButtons) {
      const text = await button.textContent()
      const type = await button.getAttribute('type')
      console.log(`  - button[type="${type}"]: "${text?.trim()}"`)
    }
    
    // Check if the form is actually there but not visible
    const formExists = await page.locator('form').count()
    if (formExists > 0) {
      const form = page.locator('form').first()
      const isVisible = await form.isVisible()
      const display = await form.evaluate(el => window.getComputedStyle(el).display)
      const visibility = await form.evaluate(el => window.getComputedStyle(el).visibility)
      const opacity = await form.evaluate(el => window.getComputedStyle(el).opacity)
      
      console.log(`Form exists: ${formExists}`)
      console.log(`Form visible: ${isVisible}`)
      console.log(`Form display: ${display}`)
      console.log(`Form visibility: ${visibility}`)
      console.log(`Form opacity: ${opacity}`)
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/targeted-debug.png', fullPage: true })
    
    // If we found the form, try to interact with it
    if (formExists > 0) {
      console.log('Attempting to interact with form...')
      
      // Try to find username field
      const usernameField = page.locator('input[name="username"]')
      const usernameExists = await usernameField.count()
      
      if (usernameExists > 0) {
        console.log('Username field found, attempting to fill...')
        await usernameField.fill('testuser123')
        const value = await usernameField.inputValue()
        console.log(`Username field value: ${value}`)
      } else {
        console.log('Username field not found by name attribute')
      }
    }
  })
})

