/**
 * IA/PO Browser Detection Test
 * Test browser detection and navigation functions
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Browser Detection Test', () => {
  test('Test browser detection and navigation', async ({ page }) => {
    console.log('=== BROWSER DETECTION TEST ===')
    
    // Step 1: Go to registration page
    console.log('🎯 Step 1: Go to registration page')
    await page.goto('/register')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    
    // Step 2: Test browser detection
    console.log('🎯 Step 2: Test browser detection')
    
    const browserInfo = await page.evaluate(() => {
      // Import the browser detection function
      const userAgent = navigator.userAgent
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
      
      let name = 'unknown'
      let version = 'unknown'
      
      if (userAgent.includes('Firefox')) {
        name = 'firefox'
        const match = userAgent.match(/Firefox\/(\d+)/)
        version = match ? match[1] : 'unknown'
      } else if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
        name = 'chrome'
        const match = userAgent.match(/Chrome\/(\d+)/)
        version = match ? match[1] : 'unknown'
      } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        name = 'safari'
        const match = userAgent.match(/Version\/(\d+)/)
        version = match ? match[1] : 'unknown'
      } else if (userAgent.includes('Edg')) {
        name = 'edge'
        const match = userAgent.match(/Edg\/(\d+)/)
        version = match ? match[1] : 'unknown'
      }
      
      const versionNum = parseInt(version, 10)
      let supportsServerRedirects = true
      
      switch (name) {
        case 'safari':
          supportsServerRedirects = true
          break
        case 'chrome':
          supportsServerRedirects = versionNum >= 80
          break
        case 'firefox':
          supportsServerRedirects = versionNum >= 75
          break
        case 'edge':
          supportsServerRedirects = versionNum >= 80
          break
        default:
          supportsServerRedirects = true
      }
      
      return {
        name,
        version,
        isMobile,
        supportsServerRedirects,
        userAgent: userAgent.substring(0, 100) + '...'
      }
    })
    
    console.log('Browser info:', browserInfo)
    
    // Step 3: Test navigation function
    console.log('🎯 Step 3: Test navigation function')
    
    const navigationResult = await page.evaluate((browserInfo) => {
      console.log('🔍 Browser navigation test:', {
        browser: browserInfo.name,
        version: browserInfo.version,
        isMobile: browserInfo.isMobile,
        supportsServerRedirects: browserInfo.supportsServerRedirects
      })
      
      // Test navigation (but don't actually navigate)
      const testUrl = '/onboarding?message=Test'
      console.log('🔍 Would navigate to:', testUrl)
      
      return {
        browser: browserInfo.name,
        supportsServerRedirects: browserInfo.supportsServerRedirects,
        testUrl
      }
    }, browserInfo)
    
    console.log('Navigation test result:', navigationResult)
    
    // Step 4: Test form submission with browser detection
    console.log('🎯 Step 4: Test form submission with browser detection')
    
    await page.waitForSelector('input[name="username"]', { timeout: 10000 })
    
    const uniqueUsername = `test_${Math.random().toString(36).substr(2, 8)}`
    const testPassword = 'TestPassword123!'
    
    console.log('Registering user:', uniqueUsername)
    
    await page.fill('input[name="username"]', '')
    await page.fill('input[name="username"]', uniqueUsername)
    await page.click('text=Add password')
    await page.fill('input[name="password"]', testPassword)
    await page.fill('input[name="confirmPassword"]', testPassword)
    
    // Monitor console logs during submission
    const consoleLogs: string[] = []
    page.on('console', msg => {
      if (msg.text().includes('🔍 Registration:') || msg.text().includes('🔍 Browser navigation:')) {
        consoleLogs.push(msg.text())
        console.log('Console log:', msg.text())
      }
    })
    
    console.log('Submitting registration form...')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(5000)
    
    console.log('Console logs during submission:', consoleLogs)
    
    // Step 5: Check final state
    console.log('🎯 Step 5: Check final state')
    const currentUrl = page.url()
    console.log('Current URL after submission:', currentUrl)
    
    const cookies = await page.context().cookies()
    const sessionCookie = cookies.find(c => c.name === 'choices_session')
    console.log('Session cookie present:', !!sessionCookie)
    if (sessionCookie) {
      console.log('Session cookie length:', sessionCookie.value.length)
    }
    
    console.log('✅ Browser detection test completed!')
  })
})

