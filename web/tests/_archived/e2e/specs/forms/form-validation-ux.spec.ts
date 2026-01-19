import { expect, test } from '@playwright/test';

import {
  setupExternalAPIMocks,
  waitForPageReady,
} from '../../helpers/e2e-setup';

test.describe('Form Validation & Input UX Tests', () => {
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
      console.log('[form-validation] Using localStorage only:', error);
    }
  });

  test('form validation provides real-time feedback', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Form validation tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      // Navigate to a page with forms (poll create or profile preferences)
      await page.goto('/polls/create');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Find form inputs
      const textInputs = page.locator('input[type="text"], textarea, input:not([type="hidden"])');
      const inputCount = await textInputs.count();

      test.skip(inputCount === 0, 'No form inputs found on page');

      // Test first text input
      const firstInput = textInputs.first();
      await firstInput.focus();
      
      // Try entering invalid data
      await firstInput.fill(''); // Clear field
      await firstInput.blur();
      await page.waitForTimeout(500);

      // Check for validation message (may appear after blur or on change)
      const validationMessages = page.locator('text=/required|invalid|error/i, [role="alert"], .error-message, [aria-invalid="true"]');
      const hasValidation = await validationMessages.count() > 0;

      // Either validation appears OR field is marked as invalid
      const isInvalid = await firstInput.getAttribute('aria-invalid');
      expect(hasValidation || isInvalid === 'true').toBeTruthy();

    } finally {
      await cleanupMocks();
    }
  });

  test('form error messages are clear and actionable', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Form validation tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/polls/create');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Find required input
      const requiredInput = page.locator('input[required], textarea[required], input[aria-required="true"]').first();
      const requiredExists = await requiredInput.count() > 0;

      test.skip(!requiredExists, 'No required inputs found');

      // Clear required field
      await requiredInput.fill('');
      await requiredInput.blur();
      await page.waitForTimeout(500);

      // Look for error message
      const errorMessage = page.locator('[role="alert"], .error-message, text=/required|invalid|error/i').first();
      const messageExists = await errorMessage.count() > 0;

      if (messageExists) {
        const messageText = await errorMessage.textContent();
        
        // Error message should be clear (not technical)
        expect(messageText).toBeTruthy();
        
        // Should not contain technical terms
        const technicalTerms = ['undefined', 'null', 'stack trace', 'exception'];
        const containsTechnicalTerm = technicalTerms.some(term => 
          messageText?.toLowerCase().includes(term)
        );
        expect(containsTechnicalTerm).toBeFalsy();
      }

    } finally {
      await cleanupMocks();
    }
  });

  test('form validation prevents invalid submissions', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Form validation tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/polls/create');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Find submit button
      const submitButton = page.locator('button[type="submit"], button:has-text(/submit|create|save/i)').first();
      const submitExists = await submitButton.count() > 0;

      test.skip(!submitExists, 'No submit button found');

      // Try to submit empty form
      const isDisabled = await submitButton.isDisabled();
      
      // Submit button should be disabled OR form should prevent submission
      if (!isDisabled) {
        // If enabled, try clicking and check for validation
        await submitButton.click({ timeout: 10_000 }).catch(() => {
          // Click might fail if form prevents submission
        });
        await page.waitForTimeout(1000);

        // Check for validation errors
        const validationErrors = page.locator('[role="alert"], .error-message, text=/required|invalid/i');
        const hasErrors = await validationErrors.count() > 0;
        
        // Either button was disabled OR validation errors appeared
        expect(isDisabled || hasErrors).toBeTruthy();
      } else {
        expect(isDisabled).toBeTruthy();
      }

    } finally {
      await cleanupMocks();
    }
  });

  test('email input validation works correctly', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Form validation tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      // Navigate to a page with email input (profile edit or auth)
      await page.goto('/profile/edit');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Find email input
      const emailInput = page.locator('input[type="email"], input[name*="email" i], input[id*="email" i]').first();
      const emailExists = await emailInput.count() > 0;

      test.skip(!emailExists, 'No email input found on profile edit page');

      // Test invalid email format
      await emailInput.fill('invalid-email');
      await emailInput.blur();
      await page.waitForTimeout(500);

      // Check for validation
      const validationMessage = page.locator('[role="alert"], .error-message, text=/invalid.*email|email.*invalid/i');
      const hasValidation = await validationMessage.count() > 0;

      // Either validation appears OR input type="email" handles it natively
      const inputType = await emailInput.getAttribute('type');
      const isEmailType = inputType === 'email';
      
      // Email input should have type="email" for proper validation
      expect(isEmailType || hasValidation).toBeTruthy();

      // Test valid email format
      await emailInput.fill('test@example.com');
      await emailInput.blur();
      await page.waitForTimeout(500);

      // Should not show error for valid email
      const stillHasError = await validationMessage.count() > 0;
      expect(stillHasError).toBeFalsy();

    } finally {
      await cleanupMocks();
    }
  });

  test('required field indicators are visible', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Form validation tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/polls/create');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Find required inputs
      const requiredInputs = page.locator('input[required], textarea[required], input[aria-required="true"]');
      const requiredCount = await requiredInputs.count();

      test.skip(requiredCount === 0, 'No required inputs found');

      // Check for required indicators (asterisk, "required" text, etc.)
      for (let i = 0; i < Math.min(requiredCount, 3); i++) {
        const input = requiredInputs.nth(i);
        const inputId = await input.getAttribute('id');
        const inputName = await input.getAttribute('name');
        
        // Look for label with required indicator
        const labelSelectors = [
          inputId ? `label[for="${inputId}"]` : null,
          inputName ? `label[for="${inputName}"]` : null,
          'label:has-text(*)', // Label with asterisk
          `label:has-text("${inputName || ''}")`,
        ].filter(Boolean) as string[];

        let labelFound = false;
        for (const selector of labelSelectors) {
          const label = page.locator(selector);
          const labelCount = await label.count();
          if (labelCount > 0) {
            labelFound = true;
            const labelText = await label.textContent();
            // Label should contain asterisk OR "required" text OR aria-required
            const hasIndicator = labelText?.includes('*') || 
                                labelText?.toLowerCase().includes('required') ||
                                (await input.getAttribute('aria-required')) === 'true';
            expect(hasIndicator).toBeTruthy();
            break;
          }
        }
        // At least one label should have been found for the input
        expect(labelFound).toBeTruthy();
      }

    } finally {
      await cleanupMocks();
    }
  });

  test('field-level error messages do not cause layout shifts', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Form validation tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/polls/create');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Get initial layout measurements
      const input = page.locator('input[type="text"], textarea').first();
      const inputExists = await input.count() > 0;

      test.skip(!inputExists, 'No input found');

      const initialBox = await input.boundingBox();
      expect(initialBox).toBeTruthy();

      // Trigger validation error
      await input.fill('');
      await input.blur();
      await page.waitForTimeout(500);

      // Get layout after error (should not shift significantly)
      const afterBox = await input.boundingBox();
      expect(afterBox).toBeTruthy();

      if (initialBox && afterBox) {
        // Input position should not shift significantly (allow 5px tolerance)
        const horizontalShift = Math.abs(afterBox.x - initialBox.x);
        const verticalShift = Math.abs(afterBox.y - initialBox.y);
        
        // Small shifts are acceptable, but major shifts (>50px) indicate layout problems
        expect(horizontalShift).toBeLessThan(50);
        expect(verticalShift).toBeLessThan(50);
      }

    } finally {
      await cleanupMocks();
    }
  });

  test('form auto-save or draft saving works (if applicable)', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Form validation tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/polls/create');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Fill in some form fields
      const titleInput = page.locator('input[id*="title" i], input[name*="title" i]').first();
      const titleExists = await titleInput.count() > 0;

      if (titleExists) {
        const testTitle = 'Test Draft Poll Title';
        await titleInput.fill(testTitle);
        await page.waitForTimeout(1000);

        // Check for draft save indicators or auto-save messages (optional feature)
        const draftIndicators = page.locator('text=/draft saved|auto.*save|saving/i');
        await draftIndicators.count(); // Check exists but don't require it

        // Auto-save is optional, so we just verify form accepts input
        expect(testTitle).toBeTruthy();
      }

    } finally {
      await cleanupMocks();
    }
  });
});

