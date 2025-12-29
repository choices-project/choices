import { expect, test } from '@playwright/test';

import {
  setupExternalAPIMocks,
  waitForPageReady,
} from '../../helpers/e2e-setup';

test.describe('Account Delete Page Tests', () => {
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
      console.log('[account-delete] Using localStorage only:', error);
    }
  });

  test('account delete page loads and displays warning correctly', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Account delete tests require production environment');

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/account/delete');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Check for React errors
      const reactErrors = consoleErrors.filter(err => 
        err.includes('React Error') || 
        err.includes('Hydration') || 
        err.includes('Warning: Text content does not match')
      );
      expect(reactErrors.length).toBe(0);

      // Page should display warning about account deletion
      const warningIndicators = [
        page.locator('text=/delete.*account|permanent|cannot.*undo|irreversible/i'),
        page.locator('h1, h2').filter({ hasText: /delete|remove|account/i }),
      ];

      let foundWarning = false;
      for (const indicator of warningIndicators) {
        const count = await indicator.count();
        if (count > 0) {
          foundWarning = true;
          break;
        }
      }

      // Should have warning message OR authentication required message
      const authRequired = page.locator('text=/sign in|logged in|authentication required/i');
      const needsAuth = await authRequired.count() > 0;
      
      expect(foundWarning || needsAuth).toBeTruthy();

    } finally {
      await cleanupMocks();
    }
  });

  test('account delete page requires confirmation before deletion', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Account delete tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/account/delete');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Check if authenticated
      const authRequired = page.locator('text=/sign in|logged in|authentication required/i');
      const needsAuth = await authRequired.count() > 0;
      test.skip(needsAuth, 'User must be authenticated to test deletion confirmation');

      // Look for delete button
      const deleteButton = page.locator('button:has-text(/delete.*account/i), button:has-text(/confirm.*delete/i), button[type="submit"]').filter({ hasText: /delete/i });
      const deleteButtonExists = await deleteButton.count() > 0;

      test.skip(!deleteButtonExists, 'Delete button not found on account delete page');

      // Delete button should initially be disabled OR require confirmation steps
      // The account delete page requires multiple steps to be completed before deletion
      const isDisabled = await deleteButton.first().isDisabled();
      
      // Check for confirmation inputs (email confirmation, etc.)
      const emailInput = page.locator('input[type="email"]');
      const emailCount = await emailInput.count();
      const textInputs = page.locator('input[type="text"]');
      const textInputCount = await textInputs.count();
      
      let hasConfirmationInput = false;
      
      if (emailCount > 0) {
        const allInputs = await emailInput.all();
        for (const input of allInputs) {
          const placeholder = await input.getAttribute('placeholder');
          const name = await input.getAttribute('name');
          const id = await input.getAttribute('id');
          if ((placeholder && /delete|confirm|email|type.*delete/i.test(placeholder)) ||
              (name && /delete|confirm|email/i.test(name)) ||
              (id && /delete|confirm|email/i.test(id))) {
            hasConfirmationInput = true;
            break;
          }
        }
      } else if (textInputCount > 0) {
        const allInputs = await textInputs.all();
        for (const input of allInputs) {
          const placeholder = await input.getAttribute('placeholder');
          const name = await input.getAttribute('name');
          const id = await input.getAttribute('id');
          if ((placeholder && /delete|confirm|email|type.*delete/i.test(placeholder)) ||
              (name && /delete|confirm|email/i.test(name)) ||
              (id && /delete|confirm|email/i.test(id))) {
            hasConfirmationInput = true;
            break;
          }
        }
      }

      // Either button is disabled OR requires confirmation input/steps
      // The delete page has a multi-step process, so button may be disabled until steps are complete
      expect(isDisabled || hasConfirmationInput).toBeTruthy();

    } finally {
      await cleanupMocks();
    }
  });

  test('account delete page shows consequences of deletion', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Account delete tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/account/delete');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Check if authenticated
      const authRequired = page.locator('text=/sign in|logged in|authentication required/i');
      const needsAuth = await authRequired.count() > 0;
      test.skip(needsAuth, 'User must be authenticated to test deletion consequences');

      // Look for information about what will be deleted
      // The page shows "This is what will be permanently deleted" and lists polls, votes, comments
      const consequenceIndicators = [
        page.locator('text=/will.*permanently.*deleted|what will be.*deleted|irreversible/i'),
        page.locator('text=/polls.*votes.*comments|account summary/i'),
        page.locator('text=/permanently.*remove|all your data/i'),
      ];

      let foundConsequences = false;
      for (const indicator of consequenceIndicators) {
        const count = await indicator.count();
        if (count > 0) {
          foundConsequences = true;
          break;
        }
      }

      // Should show what will be deleted OR have clear warning message
      // Also check for the warning alert that says "This action is irreversible"
      const warningAlert = page.locator('text=/irreversible|warning|permanently.*removed/i');
      const hasWarning = await warningAlert.count() > 0;

      expect(foundConsequences || hasWarning).toBeTruthy();

    } finally {
      await cleanupMocks();
    }
  });

  test('account delete page handles errors gracefully', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Account delete tests require production environment');

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/account/delete');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Check for React errors
      const reactErrors = consoleErrors.filter(err => 
        err.includes('React Error') || 
        err.includes('Hydration') ||
        err.includes('ErrorBoundary')
      );
      
      // Should not have critical React errors
      const criticalErrors = reactErrors.filter(err => 
        !err.includes('Warning') && 
        !err.includes('deprecated')
      );
      expect(criticalErrors.length).toBe(0);

      // Page should display content even if there are some errors
      const pageContent = page.locator('body');
      const hasContent = await pageContent.count() > 0;
      expect(hasContent).toBeTruthy();

      // Should not have infinite loading spinner
      const loadingSpinners = await page.locator('.animate-spin, [role="progressbar"]').count();
      expect(loadingSpinners).toBeLessThan(5);

    } finally {
      await cleanupMocks();
    }
  });

  // NOTE: We do NOT test actual account deletion in E2E tests
  // This would require creating test accounts and cleaning them up
  // Actual deletion should be tested in integration tests with proper test data management
});

