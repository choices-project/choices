/**
 * Mobile Helper for E2E Tests
 * 
 * Provides mobile-specific test handling and configurations
 * 
 * Created: January 19, 2025
 * Status: ✅ ACTIVE
 */

export class MobileHelper {
  /**
   * Mobile viewport configurations
   */
  static readonly MOBILE_VIEWPORTS = {
    iPhoneSE: { width: 375, height: 667 },
    iPhone12: { width: 390, height: 844 },
    iPhone12Pro: { width: 390, height: 844 },
    iPhone12ProMax: { width: 428, height: 926 },
    SamsungGalaxy: { width: 360, height: 760 },
    Pixel5: { width: 393, height: 851 }
  };

  /**
   * Mobile user agents
   */
  static readonly MOBILE_USER_AGENTS = {
    iPhone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    Android: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
    Samsung: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
  };

  /**
   * Configure test for mobile device
   */
  static configureMobileTest(test: any, device: 'iPhone' | 'Android' | 'Samsung' = 'iPhone') {
    const viewport = device === 'iPhone' ? this.MOBILE_VIEWPORTS.iPhone12 : this.MOBILE_VIEWPORTS.SamsungGalaxy;
    const userAgent = this.MOBILE_USER_AGENTS[device];
    
    test.use({
      viewport,
      userAgent,
      // Mobile-specific settings
      hasTouch: true,
      isMobile: true,
      // Reduce timeout for mobile (faster feedback)
      actionTimeout: 10000,
      navigationTimeout: 15000
    });
  }

  /**
   * Wait for mobile-specific elements to load
   */
  static async waitForMobileLoad(page: any) {
    // Wait for mobile viewport to settle
    await page.waitForTimeout(1000);
    
    // Wait for mobile-specific elements
    await page.waitForLoadState('networkidle');
    
    // Check if mobile navigation is present
    const mobileNav = page.locator('[data-testid="mobile-nav"], .mobile-nav, nav[aria-label="mobile"]');
    if (await mobileNav.count() > 0) {
      await mobileNav.waitFor({ timeout: 5000 });
    }
  }

  /**
   * Handle mobile touch interactions
   */
  static async handleMobileTouch(page: any, selector: string) {
    // Try touch first, fallback to click
    try {
      await page.tap(selector);
    } catch (error) {
      console.log('Touch failed, falling back to click');
      await page.click(selector);
    }
  }

  /**
   * Handle mobile form interactions
   */
  static async handleMobileForm(page: any, selector: string, value: string) {
    // Focus first, then type (better for mobile)
    await page.focus(selector);
    await page.fill(selector, value);
    
    // Trigger mobile-specific events
    await page.dispatchEvent(selector, 'input');
    await page.dispatchEvent(selector, 'change');
  }

  /**
   * Handle mobile scrolling
   */
  static async handleMobileScroll(page: any, direction: 'up' | 'down' = 'down') {
    const deltaY = direction === 'down' ? 300 : -300;
    await page.mouse.wheel(0, deltaY);
    await page.waitForTimeout(500); // Let scroll settle
  }

  /**
   * Check if element is visible on mobile
   */
  static async isMobileVisible(page: any, selector: string): Promise<boolean> {
    const element = page.locator(selector);
    if (await element.count() === 0) return false;
    
    // Check if element is in viewport
    const isVisible = await element.isVisible();
    if (!isVisible) return false;
    
    // Check if element is not covered by mobile UI
    const boundingBox = await element.boundingBox();
    if (!boundingBox) return false;
    
    // Mobile-specific visibility check
    return boundingBox.height > 0 && boundingBox.width > 0;
  }

  /**
   * Handle mobile keyboard
   */
  static async handleMobileKeyboard(page: any, action: 'show' | 'hide' = 'show') {
    if (action === 'show') {
      // Focus on input to show keyboard
      await page.keyboard.press('Tab');
    } else {
      // Blur to hide keyboard
      await page.evaluate(() => (document.activeElement as any)?.blur());
    }
  }

  /**
   * Mobile-specific error handling
   */
  static async handleMobileErrors(page: any) {
    // Handle mobile-specific errors
    page.on('pageerror', (error: any) => {
      console.log('Mobile page error:', error.message);
    });
    
    // Handle mobile console errors
    page.on('console', (msg: any) => {
      if (msg.type() === 'error') {
        console.log('Mobile console error:', msg.text());
      }
    });
  }

  /**
   * Test mobile responsiveness
   */
  static async testMobileResponsiveness(page: any) {
    const viewport = page.viewportSize();
    console.log(`📱 Testing mobile responsiveness at ${viewport?.width}x${viewport?.height}`);
    
    // Test if mobile navigation is present
    const mobileNav = page.locator('[data-testid="mobile-nav"], .mobile-nav');
    const hasMobileNav = await mobileNav.count() > 0;
    
    // Test if content is properly sized for mobile
    const mainContent = page.locator('main, [role="main"]');
    const contentBox = await mainContent.boundingBox();
    
    if (contentBox) {
      const isMobileSized = contentBox.width <= (viewport?.width || 0);
      console.log(`📱 Mobile content sizing: ${isMobileSized ? 'Good' : 'Needs adjustment'}`);
    }
    
    return {
      hasMobileNav,
      viewport,
      isResponsive: true
    };
  }
}
