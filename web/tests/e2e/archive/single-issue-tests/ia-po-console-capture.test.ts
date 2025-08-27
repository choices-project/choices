import { test, expect } from '@playwright/test'

test('Console Capture - Registration Form Submission', async ({ page, browserName }) => {
  console.log('🔍 Capturing console logs for:', browserName)
  
  // Capture all console logs
  const consoleLogs: string[] = []
  page.on('console', (msg) => {
    const log = `${msg.type()}: ${msg.text()}`
    consoleLogs.push(log)
    console.log('🔍 Console:', log)
  })
  
  // Capture page errors
  page.on('pageerror', (error) => {
    console.log('🔍 Page Error:', error.message)
  })
  
  await page.goto('http://localhost:3001/register')
  await page.waitForLoadState('networkidle')
  
  const uniqueUsername = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  console.log('🔍 Using username:', uniqueUsername)
  
  await page.fill('input[name="username"]', uniqueUsername)
  
  // Wait a moment for any validation
  await page.waitForTimeout(1000)
  
  // Check if submit button is enabled
  const isEnabled = await page.locator('button[type="submit"]').isEnabled()
  console.log('🔍 Submit button enabled:', isEnabled)
  
  // Click submit
  await page.click('button[type="submit"]')
  
  // Wait for any network activity
  await page.waitForTimeout(5000)
  
  const finalUrl = page.url()
  console.log('🔍 Final URL:', finalUrl)
  
  // Filter registration-related logs
  const registrationLogs = consoleLogs.filter(log => 
    log.includes('Registration') || 
    log.includes('fetch') || 
    log.includes('redirect') ||
    log.includes('error') ||
    log.includes('validation')
  )
  
  console.log('🔍 Registration-related logs:', registrationLogs)
  
  if (finalUrl.includes('/onboarding')) {
    console.log('✅ Successfully redirected to onboarding')
  } else {
    console.log('❌ Not redirected to onboarding')
  }
})

