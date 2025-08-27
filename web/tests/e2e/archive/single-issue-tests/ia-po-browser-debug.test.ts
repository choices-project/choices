import { test, expect } from '@playwright/test'

test('Browser Detection and Navigation Debug', async ({ page, browserName }) => {
  console.log('🔍 Testing browser detection and navigation for:', browserName)
  
  // Navigate to registration page
  await page.goto('http://localhost:3001/register')
  
  // Wait for page to load
  await page.waitForLoadState('networkidle')
  
  // Check if browser detection is working
  const browserInfo = await page.evaluate(() => {
    // @ts-ignore - browser-utils is available in the page context
    if (typeof window.detectBrowser === 'function') {
      return window.detectBrowser()
    }
    return null
  })
  
  console.log('🔍 Browser info from page:', browserInfo)
  
  // Fill in registration form
  const uniqueUsername = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  console.log('🔍 Using username:', uniqueUsername)
  
  await page.waitForSelector('input[name="username"]', { timeout: 10000 })
  await page.fill('input[name="username"]', uniqueUsername)
  
  // Add password
  await page.click('text=Add password')
  await page.fill('input[name="password"]', 'testpass123')
  await page.fill('input[name="confirmPassword"]', 'testpass123')
  
  console.log('🔍 Submitting registration form...')
  
  // Monitor navigation events
  const navigationEvents: string[] = []
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) {
      navigationEvents.push(`Navigated to: ${frame.url()}`)
      console.log('🔍 Navigation event:', frame.url())
    }
  })
  
  // Submit form
  await page.click('button[type="submit"]')
  
  // Wait for navigation
  await page.waitForTimeout(5000)
  
  const finalUrl = page.url()
  console.log('🔍 Final URL after registration:', finalUrl)
  console.log('🔍 Navigation events:', navigationEvents)
  
  // Check if we're on onboarding page
  if (finalUrl.includes('/onboarding')) {
    console.log('✅ Successfully redirected to onboarding')
    
    // Check session cookie
    const cookies = await page.context().cookies()
    const sessionCookie = cookies.find(c => c.name === 'choices_session')
    console.log('🔍 Session cookie present:', !!sessionCookie)
    
    if (sessionCookie) {
      console.log('🔍 Session cookie value length:', sessionCookie.value.length)
    }
    
    // Test /api/auth/me
    const authResponse = await page.request.get('/api/auth/me', {
      headers: {
        'Cookie': `choices_session=${sessionCookie?.value || ''}`
      }
    })
    
    console.log('🔍 Auth response status:', authResponse.status())
    const authResponseText = await authResponse.text()
    console.log('🔍 Auth response body:', authResponseText)
    
  } else {
    console.log('❌ Not redirected to onboarding, current URL:', finalUrl)
  }
})

