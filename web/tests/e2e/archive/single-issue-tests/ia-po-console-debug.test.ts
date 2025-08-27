import { test, expect } from '@playwright/test'

test('Console Debug - Registration Form Submission', async ({ page, browserName }) => {
  console.log('🔍 Testing console logs for:', browserName)
  
  // Capture console logs
  const consoleLogs: string[] = []
  page.on('console', (msg) => {
    const log = `${msg.type()}: ${msg.text()}`
    consoleLogs.push(log)
    console.log('🔍 Console:', log)
  })
  
  // Capture page errors
  const pageErrors: string[] = []
  page.on('pageerror', (error) => {
    const errorMsg = `Page Error: ${error.message}`
    pageErrors.push(errorMsg)
    console.log('🔍 Page Error:', errorMsg)
  })
  
  // Navigate to registration page
  await page.goto('http://localhost:3001/register')
  await page.waitForLoadState('networkidle')
  
  console.log('🔍 Page loaded, checking for form elements...')
  
  // Check if form elements exist
  const usernameInput = await page.locator('input[name="username"]').count()
  const submitButton = await page.locator('button[type="submit"]').count()
  
  console.log('🔍 Form elements found:', { usernameInput, submitButton })
  
  if (usernameInput === 0 || submitButton === 0) {
    console.log('❌ Form elements not found')
    return
  }
  
  // Fill in registration form
  const uniqueUsername = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  console.log('🔍 Using username:', uniqueUsername)
  
  await page.fill('input[name="username"]', uniqueUsername)
  
  // Add password
  await page.click('text=Add password')
  await page.fill('input[name="password"]', 'testpass123')
  await page.fill('input[name="confirmPassword"]', 'testpass123')
  
  console.log('🔍 Form filled, about to submit...')
  
  // Check if submit button is enabled
  const isSubmitEnabled = await page.locator('button[type="submit"]').isEnabled()
  console.log('🔍 Submit button enabled:', isSubmitEnabled)
  
  // Submit form
  await page.click('button[type="submit"]')
  
  console.log('🔍 Form submitted, waiting for response...')
  
  // Wait for any network activity
  await page.waitForTimeout(3000)
  
  const finalUrl = page.url()
  console.log('🔍 Final URL:', finalUrl)
  
  // Check for errors
  if (pageErrors.length > 0) {
    console.log('❌ Page errors found:', pageErrors)
  }
  
  // Check console logs for registration-related messages
  const registrationLogs = consoleLogs.filter(log => 
    log.includes('Registration') || 
    log.includes('fetch') || 
    log.includes('redirect') ||
    log.includes('error')
  )
  
  console.log('🔍 Registration-related console logs:', registrationLogs)
  
  // Check if we're on onboarding page
  if (finalUrl.includes('/onboarding')) {
    console.log('✅ Successfully redirected to onboarding')
  } else {
    console.log('❌ Not redirected to onboarding')
  }
})

