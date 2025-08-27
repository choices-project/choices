/**
 * IA/PO Button Element Debug Test
 * Debug the button element directly
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Button Element Debug', () => {
  test('Debug button element directly', async ({ page }) => {
    console.log('=== BUTTON ELEMENT DEBUG TEST ===')
    
    // Step 1: Go to onboarding page
    console.log('🎯 Step 1: Go to onboarding page')
    await page.goto('/onboarding')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Step 2: Complete onboarding steps
    console.log('🎯 Step 2: Complete onboarding steps')
    
    // Step 1: Welcome
    console.log('Completing step 1...')
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    
    // Step 2: Profile
    console.log('Completing step 2...')
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    
    // Step 3: Privacy
    console.log('Completing step 3...')
    await page.click('text=Next')
    await page.waitForTimeout(1000)
    
    // Step 3: Debug button element
    console.log('🎯 Step 3: Debug button element')
    
    // Find the button
    const button = page.locator('button:has-text("Get Started")')
    const buttonCount = await button.count()
    console.log('Button count:', buttonCount)
    
    if (buttonCount > 0) {
      // Check button properties
      const isVisible = await button.isVisible()
      console.log('Button visible:', isVisible)
      
      const isEnabled = await button.isEnabled()
      console.log('Button enabled:', isEnabled)
      
      const buttonText = await button.textContent()
      console.log('Button text:', buttonText)
      
      const buttonHTML = await button.innerHTML()
      console.log('Button HTML:', buttonHTML)
      
      const buttonClasses = await button.getAttribute('class')
      console.log('Button classes:', buttonClasses)
      
      const buttonOnClick = await button.getAttribute('onclick')
      console.log('Button onclick:', buttonOnClick)
      
      // Check if button has click handler
      const hasClickHandler = await page.evaluate(() => {
        const button = document.querySelector('button') as HTMLButtonElement
        if (button && button.textContent?.includes('Get Started')) {
          console.log('Button found in evaluate')
          console.log('Button onclick:', button.onclick)
          console.log('Button addEventListener:', button.addEventListener)
          return true
        }
        return false
      })
      console.log('Has click handler:', hasClickHandler)
      
      // Try clicking with different methods
      console.log('🎯 Step 4: Try different click methods')
      
      // Method 1: Direct click
      console.log('Method 1: Direct click')
      await button.click()
      await page.waitForTimeout(2000)
      const urlAfterMethod1 = page.url()
      console.log('URL after method 1:', urlAfterMethod1)
      
      if (urlAfterMethod1.includes('/dashboard')) {
        console.log('✅ Method 1 worked!')
        return
      }
      
      // Go back to onboarding
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)
      
      // Complete steps again
      await page.click('text=Next')
      await page.waitForTimeout(1000)
      await page.click('text=Next')
      await page.waitForTimeout(1000)
      await page.click('text=Next')
      await page.waitForTimeout(1000)
      
      // Method 2: JavaScript click
      console.log('Method 2: JavaScript click')
      await page.evaluate(() => {
        const button = document.querySelector('button') as HTMLButtonElement
        if (button && button.textContent?.includes('Get Started')) {
          button.click()
        }
      })
      await page.waitForTimeout(2000)
      const urlAfterMethod2 = page.url()
      console.log('URL after method 2:', urlAfterMethod2)
      
      if (urlAfterMethod2.includes('/dashboard')) {
        console.log('✅ Method 2 worked!')
        return
      }
      
      // Go back to onboarding
      await page.goto('/onboarding')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)
      
      // Complete steps again
      await page.click('text=Next')
      await page.waitForTimeout(1000)
      await page.click('text=Next')
      await page.waitForTimeout(1000)
      await page.click('text=Next')
      await page.waitForTimeout(1000)
      
      // Method 3: Dispatch click event
      console.log('Method 3: Dispatch click event')
      await page.evaluate(() => {
        const button = document.querySelector('button') as HTMLButtonElement
        if (button && button.textContent?.includes('Get Started')) {
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          })
          button.dispatchEvent(clickEvent)
        }
      })
      await page.waitForTimeout(2000)
      const urlAfterMethod3 = page.url()
      console.log('URL after method 3:', urlAfterMethod3)
      
      if (urlAfterMethod3.includes('/dashboard')) {
        console.log('✅ Method 3 worked!')
        return
      }
      
      console.log('❌ All click methods failed')
      throw new Error('All click methods failed')
      
    } else {
      console.log('❌ Button not found')
      throw new Error('Button not found')
    }
    
    console.log('🎉 Button element debug test completed!')
  })
})
