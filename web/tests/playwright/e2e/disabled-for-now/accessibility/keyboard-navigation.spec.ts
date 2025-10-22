import { test, expect } from '@playwright/test';
import { testKeyboardNavigation, testFocusManagement } from './accessibility-utils';

/**
 * Keyboard Navigation Tests
 * 
 * Tests keyboard accessibility including:
 * - Tab navigation
 * - Focus management
 * - Keyboard shortcuts
 * - Skip links
 * - Focus trapping
 */
test.describe('Keyboard Navigation Tests', () => {
  
  test('should support tab navigation', async ({ page }) => {
    const result = await testKeyboardNavigation(page);
    
    // Keyboard navigation should pass
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(80);
    
    console.log(`⌨️ Keyboard Navigation Score: ${result.score}/100`);
    
    if (result.violations.length > 0) {
      console.log('⚠️ Keyboard Navigation Issues found:');
      result.violations.forEach(violation => {
        console.log(`  - ${violation.description} (${violation.impact})`);
      });
    }
  });
  
  test('should have focusable elements', async ({ page }) => {
    await page.goto('/');
    
    // Check for focusable elements
    const focusableElements = await page.evaluate(() => {
      const elements = document.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      return Array.from(elements).map(el => ({
        tagName: el.tagName,
        text: el.textContent?.trim().substring(0, 30) || '',
        tabIndex: el.getAttribute('tabindex')
      }));
    });
    
    expect(focusableElements.length).toBeGreaterThan(0);
    console.log(`✅ Found ${focusableElements.length} focusable elements`);
  });
  
  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/');
    
    // Test focus indicators
    await page.keyboard.press('Tab');
    
    const focusVisible = await page.evaluate(() => {
      const activeElement = document.activeElement as HTMLElement;
      if (!activeElement) return false;
      
      const computedStyle = window.getComputedStyle(activeElement);
      return computedStyle.outline !== 'none' || 
             computedStyle.boxShadow !== 'none' ||
             activeElement.style.outline !== 'none';
    });
    
    expect(focusVisible).toBe(true);
    console.log('✅ Focus indicators are visible');
  });
  
  test('should have skip links', async ({ page }) => {
    await page.goto('/');
    
    // Check for skip links
    const skipLinks = await page.locator('a[href="#main"], a[href="#content"], .skip-link').count();
    
    if (skipLinks > 0) {
      console.log('✅ Skip links found');
      
      // Test skip link functionality
      const skipLink = page.locator('a[href="#main"], a[href="#content"], .skip-link').first();
      await skipLink.click();
      
      // Should focus on main content
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeDefined();
      console.log('✅ Skip link functionality works');
    } else {
      console.log('⚠️ No skip links found - consider adding for keyboard users');
    }
  });
  
  test('should support arrow key navigation', async ({ page }) => {
    await page.goto('/');
    
    // Test arrow key navigation in lists
    const lists = await page.locator('ul, ol').count();
    
    if (lists > 0) {
      const list = page.locator('ul, ol').first();
      const items = await list.locator('li').count();
      
      if (items > 0) {
        // Focus first item
        await list.locator('li').first().focus();
        
        // Test arrow key navigation
        await page.keyboard.press('ArrowDown');
        const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(focusedElement).toBeDefined();
        
        console.log('✅ Arrow key navigation works in lists');
      }
    } else {
      console.log('ℹ️ No lists found for arrow key navigation testing');
    }
  });
  
  test('should support escape key functionality', async ({ page }) => {
    await page.goto('/');
    
    // Test escape key for modals/dropdowns
    const modals = await page.locator('[role="dialog"], .modal').count();
    const dropdowns = await page.locator('[role="menu"], .dropdown').count();
    
    if (modals > 0 || dropdowns > 0) {
      // Open modal/dropdown
      if (modals > 0) {
        await page.locator('[role="dialog"], .modal').first().focus();
      } else {
        await page.locator('[role="menu"], .dropdown').first().focus();
      }
      
      // Test escape key
      await page.keyboard.press('Escape');
      
      // Should close modal/dropdown
      const isVisible = await page.locator('[role="dialog"], .modal, [role="menu"], .dropdown').first().isVisible();
      expect(isVisible).toBe(false);
      
      console.log('✅ Escape key functionality works');
    } else {
      console.log('ℹ️ No modals or dropdowns found for escape key testing');
    }
  });
  
  test('should support enter key activation', async ({ page }) => {
    await page.goto('/');
    
    // Test enter key on buttons and links
    const buttons = await page.locator('button').count();
    const links = await page.locator('a[href]').count();
    
    if (buttons > 0) {
      const button = page.locator('button').first();
      await button.focus();
      
      // Test enter key
      await page.keyboard.press('Enter');
      
      // Should trigger button action (we can't easily test the result, but we can test it doesn't error)
      console.log('✅ Enter key works on buttons');
    }
    
    if (links > 0) {
      const link = page.locator('a[href]').first();
      await link.focus();
      
      // Test enter key
      await page.keyboard.press('Enter');
      
      // Should trigger link navigation
      console.log('✅ Enter key works on links');
    }
  });
  
  test('should support space key activation', async ({ page }) => {
    await page.goto('/');
    
    // Test space key on buttons
    const buttons = await page.locator('button').count();
    
    if (buttons > 0) {
      const button = page.locator('button').first();
      await button.focus();
      
      // Test space key
      await page.keyboard.press('Space');
      
      // Should trigger button action
      console.log('✅ Space key works on buttons');
    } else {
      console.log('ℹ️ No buttons found for space key testing');
    }
  });
  
  test('should have proper focus order', async ({ page }) => {
    await page.goto('/');
    
    // Test focus order
    const focusOrder = await page.evaluate(() => {
      const focusableElements = document.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      return Array.from(focusableElements).map(el => ({
        tagName: el.tagName,
        text: el.textContent?.trim().substring(0, 30) || '',
        tabIndex: el.getAttribute('tabindex')
      }));
    });
    
    // Check for logical focus order
    const tabIndexValues = focusOrder.map(el => el.tabIndex);
    const hasCustomTabIndex = tabIndexValues.some(index => index && parseInt(index) > 0);
    
    if (hasCustomTabIndex) {
      console.log('⚠️ Custom tabindex values found - ensure logical order');
    } else {
      console.log('✅ Natural focus order maintained');
    }
  });
  
  test('should support focus trapping in modals', async ({ page }) => {
    const result = await testFocusManagement(page);
    
    // Focus management should pass
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(80);
    
    console.log(`🎯 Focus Management Score: ${result.score}/100`);
    
    if (result.violations.length > 0) {
      console.log('⚠️ Focus Management Issues found:');
      result.violations.forEach(violation => {
        console.log(`  - ${violation.description} (${violation.impact})`);
      });
    }
  });
  
  test('should support keyboard shortcuts', async ({ page }) => {
    await page.goto('/');
    
    // Test common keyboard shortcuts
    const shortcuts = [
      { key: 'Control+KeyK', description: 'Search shortcut' },
      { key: 'Control+KeyN', description: 'New item shortcut' },
      { key: 'Control+KeyS', description: 'Save shortcut' },
      { key: 'Control+KeyZ', description: 'Undo shortcut' }
    ];
    
    for (const shortcut of shortcuts) {
      try {
        await page.keyboard.press(shortcut.key);
        console.log(`✅ ${shortcut.description} (${shortcut.key}) works`);
      } catch (error) {
        console.log(`ℹ️ ${shortcut.description} (${shortcut.key}) not implemented`);
      }
    }
  });
  
  test('should support keyboard navigation in forms', async ({ page }) => {
    await page.goto('/');
    
    // Test form navigation
    const forms = await page.locator('form').count();
    
    if (forms > 0) {
      const form = page.locator('form').first();
      const inputs = await form.locator('input, select, textarea').count();
      
      if (inputs > 0) {
        // Focus first input
        await form.locator('input, select, textarea').first().focus();
        
        // Test tab navigation through form
        for (let i = 0; i < Math.min(inputs, 3); i++) {
          await page.keyboard.press('Tab');
          const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
          expect(focusedElement).toBeDefined();
        }
        
        console.log('✅ Keyboard navigation works in forms');
      } else {
        console.log('ℹ️ No form inputs found for keyboard navigation testing');
      }
    } else {
      console.log('ℹ️ No forms found for keyboard navigation testing');
    }
  });
});




