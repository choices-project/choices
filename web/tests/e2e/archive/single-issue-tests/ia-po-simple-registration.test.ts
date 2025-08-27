/**
 * Simple IA/PO Registration Test
 * Tests the basic registration flow
 */

import { test, expect } from '@playwright/test'

test('Simple Registration - Username Only', async ({ page, browserName }) => {
  console.log('🔍 Testing simple registration for:', browserName)
  
  await page.goto('http://localhost:3001/register')
  await page.waitForLoadState('networkidle')
  
  const uniqueUsername = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  console.log('🔍 Using username:', uniqueUsername)
  
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
