/**
 * IA/PO Registration Page Test
 * Simple test to check if the registration page loads correctly
 */

import { test, expect } from '@playwright/test'

test.describe('IA/PO Registration Page Test', () => {
  test('Check if registration page loads', async ({ page }) => {
    console.log('=== REGISTRATION PAGE TEST ===')
    
    // Step 1: Go to registration page
    console.log('🎯 Step 1: Go to registration page')
    await page.goto('/register')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    console.log('Current URL:', page.url())
    
    // Step 2: Check if page loaded
    console.log('🎯 Step 2: Check if page loaded')
    const pageContent = await page.textContent('body')
    console.log('Page content length:', pageContent?.length)
    
    // Check for any error messages
    const errorElements = await page.locator('.text-red-600, .text-red-500, .bg-red-50, .error').allTextContents()
    console.log('Error elements:', errorElements)
    
    // Check for any console errors
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
        console.log('Console error:', msg.text())
      }
    })
    
    // Check for any page errors
    const pageErrors: string[] = []
    page.on('pageerror', error => {
      pageErrors.push(error.message)
      console.log('Page error:', error.message)
    })
    
    // Wait a bit to capture any errors
    await page.waitForTimeout(2000)
    
    console.log('Console errors:', consoleErrors)
    console.log('Page errors:', pageErrors)
    
    // Check if we have basic registration content
    const hasRegistrationContent = pageContent?.includes('Create your account') || 
                                  pageContent?.includes('Join Choices') ||
                                  pageContent?.includes('Username')
    console.log('Has registration content:', hasRegistrationContent)
    
    if (!hasRegistrationContent) {
      console.log('❌ Registration page did not load correctly')
      console.log('Page content preview:', pageContent?.substring(0, 500))
      throw new Error('Registration page did not load correctly')
    }
    
    // Step 3: Check if we can find the username input
    console.log('🎯 Step 3: Check for username input')
    const usernameInput = page.locator('input[name="username"]')
    const inputCount = await usernameInput.count()
    console.log('Username input count:', inputCount)
    
    if (inputCount > 0) {
      const isVisible = await usernameInput.isVisible()
      console.log('Username input visible:', isVisible)
      
      if (isVisible) {
        console.log('✅ Username input found and visible')
      } else {
        console.log('❌ Username input found but not visible')
        throw new Error('Username input not visible')
      }
    } else {
      console.log('❌ Username input not found')
      throw new Error('Username input not found')
    }
    
    // Step 4: Check for other form elements
    console.log('🎯 Step 4: Check for other form elements')
    const addPasswordButton = page.locator('text=Add password')
    const addPasswordCount = await addPasswordButton.count()
    console.log('Add password button count:', addPasswordCount)
    
    const submitButton = page.locator('button[type="submit"]')
    const submitButtonCount = await submitButton.count()
    console.log('Submit button count:', submitButtonCount)
    
    console.log('✅ Registration page test completed!')
  })
})

