import { test, expect } from '@playwright/test'

test('Basic Form Submission Test', async ({ page, browserName }) => {
  console.log('🔍 Testing basic form submission for:', browserName)
  
  await page.goto('http://localhost:3001/register')
  await page.waitForLoadState('networkidle')
  
  // Use a simple valid username
  const uniqueUsername = `testuser_${Date.now()}`
  console.log('🔍 Using username:', uniqueUsername)
  
  // Fill the form
  await page.fill('input[name="username"]', uniqueUsername)
  
  // Check if submit button is enabled
  const submitButton = page.locator('button[type="submit"]')
  const isEnabled = await submitButton.isEnabled()
  console.log('🔍 Submit button enabled:', isEnabled)
  
  if (!isEnabled) {
    console.log('❌ Submit button is disabled')
    return
  }
  
  // Submit the form
  await submitButton.click()
  
  // Wait for any network activity
  await page.waitForTimeout(3000)
  
  const finalUrl = page.url()
  console.log('🔍 Final URL:', finalUrl)
  
  if (finalUrl.includes('/onboarding')) {
    console.log('✅ Successfully redirected to onboarding')
  } else {
    console.log('❌ Not redirected to onboarding')
  }
})

