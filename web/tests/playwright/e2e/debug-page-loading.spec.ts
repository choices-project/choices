import { test, expect } from '@playwright/test';

test.describe('Debug Page Loading', () => {
  test('should debug what is actually loading on home page', async ({ page }) => {
    console.log('🔍 Starting page load debug...');
    
    // Navigate to home page
    await page.goto('/');
    console.log('📍 Navigated to /');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    console.log('⏳ Network idle reached');
    
    // Check page title
    const pageTitle = await page.title();
    console.log('📄 Page title:', pageTitle);
    
    // Check if page has any content
    const bodyText = await page.locator('body').textContent();
    console.log('📝 Body text length:', bodyText?.length || 0);
    console.log('📝 Body text preview:', bodyText?.substring(0, 100) || 'No content');
    
    // Check for any h1 elements
    const h1Elements = await page.locator('h1').count();
    console.log('🏷️ H1 elements found:', h1Elements);
    
    // Check for any headings
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
    console.log('📋 Total headings found:', headings);
    
    // Check for specific elements we added
    const siteTitle = await page.locator('#site-title').count();
    console.log('🏷️ Site title element found:', siteTitle);
    
    const mainHeading = await page.locator('#main-heading').count();
    console.log('🏷️ Main heading element found:', mainHeading);
    
    // Check for skip links
    const skipLinks = await page.locator('.skip-link').count();
    console.log('🔗 Skip links found:', skipLinks);
    
    // Check for semantic elements
    const header = await page.locator('header').count();
    const main = await page.locator('main').count();
    const nav = await page.locator('nav').count();
    const footer = await page.locator('footer').count();
    
    console.log('🏗️ Semantic elements:');
    console.log('  - Header:', header);
    console.log('  - Main:', main);
    console.log('  - Nav:', nav);
    console.log('  - Footer:', footer);
    
    // Take a screenshot for visual debugging
    await page.screenshot({ path: 'debug-home-page.png' });
    console.log('📸 Screenshot saved as debug-home-page.png');
    
    // Basic assertions
    expect(pageTitle).toBeTruthy();
    expect(bodyText).toBeTruthy();
  });
  
  test('should debug auth page loading', async ({ page }) => {
    console.log('🔍 Starting auth page load debug...');
    
    // Navigate to auth page
    await page.goto('/auth');
    console.log('📍 Navigated to /auth');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    console.log('⏳ Network idle reached');
    
    // Check page title
    const pageTitle = await page.title();
    console.log('📄 Page title:', pageTitle);
    
    // Check for auth elements
    const authTitle = await page.locator('#auth-title').count();
    console.log('🏷️ Auth title element found:', authTitle);
    
    // Check for form elements
    const forms = await page.locator('form').count();
    console.log('📝 Forms found:', forms);
    
    // Take a screenshot
    await page.screenshot({ path: 'debug-auth-page.png' });
    console.log('📸 Screenshot saved as debug-auth-page.png');
    
    expect(pageTitle).toBeTruthy();
  });
});
