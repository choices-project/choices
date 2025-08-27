import { test, expect } from '@playwright/test'

test('Page Debug - Registration Page Content', async ({ page, browserName }) => {
  console.log('🔍 Debugging registration page for:', browserName)
  
  // Navigate to registration page
  await page.goto('http://localhost:3001/register')
  await page.waitForLoadState('networkidle')
  
  console.log('🔍 Page loaded, checking content...')
  
  // Get page title
  const title = await page.title()
  console.log('🔍 Page title:', title)
  
  // Get page URL
  const url = page.url()
  console.log('🔍 Page URL:', url)
  
  // Check if we're on the right page
  if (!url.includes('/register')) {
    console.log('❌ Not on registration page')
    return
  }
  
  // Get all form elements
  const forms = await page.locator('form').count()
  console.log('🔍 Number of forms:', forms)
  
  // Get all input elements
  const inputs = await page.locator('input').count()
  console.log('🔍 Number of inputs:', inputs)
  
  // Get all buttons
  const buttons = await page.locator('button').count()
  console.log('🔍 Number of buttons:', buttons)
  
  // List all input elements
  const inputElements = await page.locator('input').all()
  console.log('🔍 Input elements:')
  for (let i = 0; i < inputElements.length; i++) {
    const input = inputElements[i]
    const name = await input.getAttribute('name')
    const type = await input.getAttribute('type')
    const placeholder = await input.getAttribute('placeholder')
    console.log(`  ${i + 1}: name="${name}", type="${type}", placeholder="${placeholder}"`)
  }
  
  // List all buttons
  const buttonElements = await page.locator('button').all()
  console.log('🔍 Button elements:')
  for (let i = 0; i < buttonElements.length; i++) {
    const button = buttonElements[i]
    const type = await button.getAttribute('type')
    const text = await button.textContent()
    console.log(`  ${i + 1}: type="${type}", text="${text?.trim()}"`)
  }
  
  // Check for specific elements
  const usernameInput = await page.locator('input[name="username"]').count()
  const passwordInput = await page.locator('input[name="password"]').count()
  const submitButton = await page.locator('button[type="submit"]').count()
  
  console.log('🔍 Specific elements found:', {
    usernameInput,
    passwordInput,
    submitButton
  })
  
  // Get page content
  const pageContent = await page.content()
  console.log('🔍 Page has content length:', pageContent.length)
  
  // Check for error messages
  const errorElements = await page.locator('[class*="error"], [class*="Error"]').count()
  console.log('🔍 Error elements found:', errorElements)
  
  // Take a screenshot for debugging
  await page.screenshot({ path: `debug-registration-${browserName}.png` })
  console.log('🔍 Screenshot saved as debug-registration-${browserName}.png')
})

