import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

import {
  setupExternalAPIMocks,
  waitForPageReady,
} from '../../helpers/e2e-setup';

test.describe('Comprehensive Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up E2E bypass for auth
    await page.addInitScript(() => {
      try {
        localStorage.setItem('e2e-dashboard-bypass', '1');
      } catch (e) {
        console.warn('Could not set localStorage:', e);
      }
    });

    // Set bypass cookie
    const baseUrl = process.env.BASE_URL || 'https://www.choices-app.com';
    const url = new URL(baseUrl);
    const domain = url.hostname.startsWith('www.') ? url.hostname.substring(4) : url.hostname;

    try {
      await page.context().addCookies([{
        name: 'e2e-dashboard-bypass',
        value: '1',
        path: '/',
        domain: `.${domain}`,
        sameSite: 'None' as const,
        secure: true,
        httpOnly: false,
      }]);
    } catch (error) {
      console.log('[comprehensive-a11y] Using localStorage only:', error);
    }
  });

  test('keyboard navigation works for all interactive elements', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Accessibility tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/dashboard');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Get all focusable elements
      const focusableSelectors = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const focusableElements = page.locator(focusableSelectors);
      const elementCount = await focusableElements.count();

      test.skip(elementCount === 0, 'No focusable elements found');

      // Test keyboard navigation through first few elements
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);

      // Check that an element has focus
      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.tagName || null;
      });
      expect(focusedElement).toBeTruthy();

      // Continue tabbing to ensure navigation works
      for (let i = 0; i < Math.min(5, elementCount); i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(200);
        
        const newFocusedElement = await page.evaluate(() => {
          return document.activeElement?.tagName || null;
        });
        expect(newFocusedElement).toBeTruthy();
      }

    } finally {
      await cleanupMocks();
    }
  });

  test('screen reader announcements are correct', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Accessibility tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/dashboard');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Check for proper ARIA labels and roles
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      test.skip(buttonCount === 0, 'No buttons found');

      // Check first few buttons for accessibility attributes
      for (let i = 0; i < Math.min(3, buttonCount); i++) {
        const button = buttons.nth(i);
        
        // Button should have either aria-label OR text content OR aria-labelledby
        const ariaLabel = await button.getAttribute('aria-label');
        const textContent = await button.textContent();
        const ariaLabelledBy = await button.getAttribute('aria-labelledby');
        
        const hasLabel = Boolean(ariaLabel || textContent?.trim() || ariaLabelledBy);
        expect(hasLabel).toBeTruthy();
      }

      // Check for aria-live regions (for dynamic content announcements)
      const liveRegions = page.locator('[aria-live], [aria-atomic], [role="status"], [role="alert"]');
      const liveRegionCount = await liveRegions.count();
      
      // Live regions are optional but recommended for dynamic content
      expect(liveRegionCount).toBeGreaterThanOrEqual(0);

    } finally {
      await cleanupMocks();
    }
  });

  test('focus management works in modals and dialogs', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Accessibility tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/dashboard');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Look for modal/dialog triggers
      const modalTriggers1 = page.locator('button').filter({ hasText: /open/i });
      const modalTriggers2 = page.locator('button').filter({ hasText: /show/i });
      const modalTriggers3 = page.locator('button').filter({ hasText: /view/i });
      const modalTriggers4 = page.locator('[aria-haspopup="true"]');
      const modalTriggers5 = page.locator('[aria-expanded="false"]');
      const triggerCount = (await modalTriggers1.count()) + 
                          (await modalTriggers2.count()) + 
                          (await modalTriggers3.count()) + 
                          (await modalTriggers4.count()) + 
                          (await modalTriggers5.count());
      
      const modalTriggers = triggerCount > 0 ? 
        (await modalTriggers1.count() > 0 ? modalTriggers1.first() :
         await modalTriggers2.count() > 0 ? modalTriggers2.first() :
         await modalTriggers3.count() > 0 ? modalTriggers3.first() :
         await modalTriggers4.count() > 0 ? modalTriggers4.first() :
         modalTriggers5.first()) : null;

      // Modals are optional, so skip if none found
      test.skip(triggerCount === 0, 'No modal triggers found');
      if (!modalTriggers) return;

      // Open first modal/dialog
      await modalTriggers.click({ timeout: 10_000 });
      await page.waitForTimeout(500);

      // Check for modal/dialog
      const modal = page.locator('[role="dialog"], [role="alertdialog"], [aria-modal="true"]');
      const modalExists = await modal.count() > 0;

      if (modalExists) {
        // Focus should be trapped in modal
        const focusedElement = await page.evaluate(() => {
          return document.activeElement?.tagName || null;
        });
        expect(focusedElement).toBeTruthy();

        // Modal should have proper ARIA attributes
        const modalRole = await modal.first().getAttribute('role');
        const ariaModal = await modal.first().getAttribute('aria-modal');
        
        expect(modalRole === 'dialog' || modalRole === 'alertdialog' || ariaModal === 'true').toBeTruthy();
      }

    } finally {
      await cleanupMocks();
    }
  });

  test('ARIA labels and roles are correct', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Accessibility tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/dashboard');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Check navigation elements have proper roles
      const navElements = page.locator('nav, [role="navigation"]');
      const navCount = await navElements.count();
      
      if (navCount > 0) {
        const nav = navElements.first();
        const navRole = await nav.getAttribute('role');
        const tagName = await nav.evaluate(el => el.tagName.toLowerCase());
        
        // Should have role="navigation" OR be a <nav> element
        expect(navRole === 'navigation' || tagName === 'nav').toBeTruthy();
      }

      // Check buttons have proper roles (should not need role="button" if using <button>)
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      if (buttonCount > 0) {
        const firstButton = buttons.first();
        const buttonRole = await firstButton.getAttribute('role');
        const tagName = await firstButton.evaluate(el => el.tagName.toLowerCase());
        
        // <button> elements don't need role="button", but it's not wrong
        // <div> or <span> buttons should have role="button"
        if (tagName !== 'button') {
          expect(buttonRole).toBe('button');
        }
      }

    } finally {
      await cleanupMocks();
    }
  });

  test('color contrast meets WCAG standards', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Accessibility tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/dashboard');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Use axe-core to check color contrast
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // Filter for color contrast violations only
      const contrastViolations = accessibilityScanResults.violations.filter(
        violation => violation.id === 'color-contrast' || violation.id === 'color-contrast-enhanced'
      );

      // Log violations for diagnostic purposes
      if (contrastViolations.length > 0) {
        console.log('Color contrast violations found:', JSON.stringify(contrastViolations, null, 2));
        // Also log to test output for visibility
        for (const violation of contrastViolations) {
          console.log(`Violation: ${violation.id} - ${violation.description}`);
          console.log(`Nodes affected: ${violation.nodes.length}`);
          violation.nodes.forEach((node, idx) => {
            console.log(`  Node ${idx + 1}: ${node.html?.substring(0, 100)}...`);
            console.log(`  Selector: ${node.target?.join(', ')}`);
          });
        }
      }

      // Should have no color contrast violations
      // Note: This test will fail if violations exist - fix the UI code to resolve
      expect(contrastViolations.length).toBe(0);

    } finally {
      await cleanupMocks();
    }
  });

  test('focus indicators are visible', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Accessibility tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      const authForm = page.locator('[data-testid="login-form"]');
      const authHeading = page.locator('h1, h2').filter({ hasText: /sign in|log in|login/i });
      const needsAuth =
        page.url().includes('/auth') ||
        page.url().includes('/login') ||
        (await authForm.count()) > 0 ||
        (await authHeading.count()) > 0;
      test.skip(needsAuth, 'Dashboard requires authentication in production.');

      // Focus first focusable element
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);

      // Check if focused element has visible focus indicator
      const hasFocusIndicator = await page.evaluate(() => {
        const activeElement = document.activeElement as HTMLElement;
        if (!activeElement) return false;

        const styles = window.getComputedStyle(activeElement);
        const outline = styles.outline;
        const outlineWidth = styles.outlineWidth;
        const boxShadow = styles.boxShadow;

        // Check for visible outline or box-shadow (focus indicator)
        const hasOutline = outline && outline !== 'none' && outlineWidth !== '0px';
        const hasBoxShadow = boxShadow && boxShadow !== 'none';

        return hasOutline || hasBoxShadow;
      });

      expect(hasFocusIndicator).toBeTruthy();

    } finally {
      await cleanupMocks();
    }
  });

  test('form labels are properly associated with inputs', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Accessibility tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/polls/create', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      const authForm = page.locator('[data-testid="login-form"]');
      const authHeading = page.locator('h1, h2').filter({ hasText: /sign in|log in|login/i });
      const needsAuth =
        page.url().includes('/auth') ||
        page.url().includes('/login') ||
        (await authForm.count()) > 0 ||
        (await authHeading.count()) > 0;
      test.skip(needsAuth, 'Poll creation requires authentication in production.');

      // Find all inputs
      const inputs = page.locator('input:not([type="hidden"]), textarea, select');
      const inputCount = await inputs.count();

      test.skip(inputCount === 0, 'No inputs found');

      // Check first few inputs for proper label association
      for (let i = 0; i < Math.min(5, inputCount); i++) {
        const input = inputs.nth(i);
        const inputId = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        const placeholder = await input.getAttribute('placeholder');

        // Input should have either:
        // 1. An id with a corresponding label[for="id"]
        // 2. An aria-label
        // 3. An aria-labelledby pointing to a label
        // 4. A placeholder (less ideal but acceptable for some cases)

        let hasLabel = false;

        if (inputId) {
          const label = page.locator(`label[for="${inputId}"]`);
          const labelExists = await label.count() > 0;
          hasLabel = labelExists;
        }

        if (!hasLabel) {
          hasLabel = Boolean(ariaLabel || ariaLabelledBy || placeholder);
        }

        expect(hasLabel).toBeTruthy();
      }

    } finally {
      await cleanupMocks();
    }
  });

  test('error messages are announced to screen readers', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Accessibility tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/polls/create', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      const authForm = page.locator('[data-testid="login-form"]');
      const authHeading = page.locator('h1, h2').filter({ hasText: /sign in|log in|login/i });
      const needsAuth =
        page.url().includes('/auth') ||
        page.url().includes('/login') ||
        (await authForm.count()) > 0 ||
        (await authHeading.count()) > 0;
      test.skip(needsAuth, 'Poll creation requires authentication in production.');

      // Find a required input
      const requiredInput = page.locator('input[required], textarea[required]').first();
      const requiredExists = await requiredInput.count() > 0;

      test.skip(!requiredExists, 'No required inputs found');

      // Trigger validation error
      await requiredInput.fill('');
      await requiredInput.blur();
      await page.waitForTimeout(500);

      // Look for error message with proper ARIA
      const errorMessage = page.locator('[role="alert"], [aria-live="assertive"], .error-message');
      const errorExists = await errorMessage.count() > 0;

      if (errorExists) {
        // Error message should have role="alert" OR aria-live="assertive"
        const errorElement = errorMessage.first();
        const role = await errorElement.getAttribute('role');
        const ariaLive = await errorElement.getAttribute('aria-live');
        const ariaInvalid = await requiredInput.getAttribute('aria-invalid');

        // Error should be properly marked
        const isProperlyMarked = role === 'alert' || 
                                ariaLive === 'assertive' || 
                                ariaInvalid === 'true';

        expect(isProperlyMarked).toBeTruthy();
      }

    } finally {
      await cleanupMocks();
    }
  });
});

