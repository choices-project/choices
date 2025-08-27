import { test, expect } from '@playwright/test'

test('Short Username Registration', async ({ page, browserName }) => {
  console.log('🔍 Testing short username registration for:', browserName)
  
  await page.goto('http://localhost:3001/register')
  await page.waitForLoadState('networkidle')
  
  // Use a shorter username that definitely meets the validation requirements
  // Username must be 3-20 characters and match /^[a-zA-Z0-9_-]+$/
  const uniqueUsername = `test_${Date.now().toString().slice(-6)}` // This will be ~10 characters
  console.log('🔍 Using short username:', uniqueUsername)
  console.log('🔍 Username length:', uniqueUsername.length)
  
  // Fill the form
  await page.fill('input[name="username"]', uniqueUsername)
  
  // Submit the form
  await page.click('button[type="submit"]')
  
  // Wait for any activity
  await page.waitForTimeout(5000)
  
  const finalUrl = page.url()
  console.log('🔍 Final URL:', finalUrl)
  
  if (finalUrl.includes('/onboarding')) {
    console.log('✅ Successfully redirected to onboarding')
  } else {
    console.log('❌ Not redirected to onboarding')
  }
})

