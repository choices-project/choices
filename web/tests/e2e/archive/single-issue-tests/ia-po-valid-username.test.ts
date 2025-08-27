import { test, expect } from '@playwright/test'

test('Valid Username Registration', async ({ page, browserName }) => {
  console.log('🔍 Testing valid username registration for:', browserName)
  
  await page.goto('http://localhost:3001/register')
  await page.waitForLoadState('networkidle')
  
  // Use a username that definitely matches the validation pattern: /^[a-zA-Z0-9_-]+$/
  const uniqueUsername = `testuser_${Date.now()}`
  console.log('🔍 Using valid username:', uniqueUsername)
  
  await page.fill('input[name="username"]', uniqueUsername)
  await page.click('button[type="submit"]')
  
  await page.waitForTimeout(5000)
  
  const finalUrl = page.url()
  console.log('🔍 Final URL:', finalUrl)
  
  if (finalUrl.includes('/onboarding')) {
    console.log('✅ Successfully redirected to onboarding')
  } else {
    console.log('❌ Not redirected to onboarding')
  }
})

