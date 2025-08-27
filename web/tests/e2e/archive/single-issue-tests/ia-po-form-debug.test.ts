import { test, expect } from '@playwright/test'

test('Form Submission Debug', async ({ page, browserName }) => {
  console.log('🔍 Debugging form submission for:', browserName)
  
  await page.goto('http://localhost:3001/register')
  await page.waitForLoadState('networkidle')
  
  // Monitor form submission events
  const formEvents: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/api/auth/register-ia')) {
      formEvents.push(`API Request: ${request.method()} ${request.url()}`)
      console.log('🔍 API Request detected:', request.method(), request.url())
    }
  })
  
  // Monitor console logs
  page.on('console', (msg) => {
    if (msg.text().includes('Registration') || msg.text().includes('error') || msg.text().includes('validation')) {
      formEvents.push(`Console: ${msg.text()}`)
      console.log('🔍 Console:', msg.text())
    }
  })
  
  // Use a username that definitely matches the validation pattern
  const uniqueUsername = `testuser_${Date.now()}`
  console.log('🔍 Using username:', uniqueUsername)
  
  // Fill the form
  await page.fill('input[name="username"]', uniqueUsername)
  
  // Submit the form
  await page.click('button[type="submit"]')
  
  // Wait for any activity
  await page.waitForTimeout(5000)
  
  const finalUrl = page.url()
  console.log('🔍 Final URL:', finalUrl)
  console.log('🔍 Form events captured:', formEvents)
  
  if (finalUrl.includes('/onboarding')) {
    console.log('✅ Successfully redirected to onboarding')
  } else {
    console.log('❌ Not redirected to onboarding')
  }
})

