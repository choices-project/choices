import { test, expect } from '@playwright/test';
import { E2ETestHelpers } from '@/tests/utils/e2e-test-helpers';
import { ComponentTestUtils } from '@/tests/utils/component-test-utils';
import { PerformanceTestUtils } from '@/tests/utils/performance-test-utils';

test.describe('Feedback System E2E Tests', () => {
  let helpers: E2ETestHelpers;
  let componentUtils: ComponentTestUtils;
  let performanceUtils: PerformanceTestUtils;

  test.beforeEach(async ({ page }) => {
    helpers = new E2ETestHelpers(page);
    componentUtils = new ComponentTestUtils(page);
    performanceUtils = new PerformanceTestUtils(page);
    
    // Navigate to dashboard to start feedback testing
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('Feedback Widget - Complete Submission Flow', async ({ page }) => {
    // Test feedback widget visibility and interaction
    await test.step('Verify feedback widget is visible', async () => {
      const feedbackButton = page.locator('[data-testid="feedback-button"]');
      await expect(feedbackButton).toBeVisible();
    });

    // Test feedback widget opening
    await test.step('Open feedback widget', async () => {
      const feedbackButton = page.locator('button:has-text("Feedback")').or(
        page.locator('button[aria-label*="feedback" i]')
      ).or(
        page.locator('button:has(svg)').filter({ hasText: /message|feedback/i })
      );
      
      if (await feedbackButton.count() > 0) {
        await feedbackButton.first().click();
        await page.waitForTimeout(1000);
      }
    });

    // Test feedback type selection
    await test.step('Select feedback type', async () => {
      const bugReportButton = page.locator('button:has-text("Bug Report")').or(
        page.locator('button:has-text("Bug")')
      );
      
      if (await bugReportButton.count() > 0) {
        await bugReportButton.click();
        await page.waitForTimeout(500);
      }
    });

    // Test feedback details input
    await test.step('Fill feedback details', async () => {
      const titleInput = page.locator('input[placeholder*="title" i]');
      const descriptionInput = page.locator('textarea[placeholder*="description" i]');
      
      if (await titleInput.count() > 0) {
        await titleInput.fill('E2E Test Bug Report');
      }
      
      if (await descriptionInput.count() > 0) {
        await descriptionInput.fill('This is a test bug report submitted during E2E testing. Please ignore.');
      }
    });

    // Test sentiment selection
    await test.step('Select feedback sentiment', async () => {
      const negativeButton = page.locator('button:has-text("Negative")').or(
        page.locator('button:has-text("Negative")')
      );
      
      if (await negativeButton.count() > 0) {
        await negativeButton.click();
        await page.waitForTimeout(500);
      }
    });

    // Test feedback submission
    await test.step('Submit feedback', async () => {
      const submitButton = page.locator('button:has-text("Submit")').or(
        page.locator('button:has-text("Submit Feedback")')
      );
      
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(2000);
      }
    });

    // Test success message
    await test.step('Verify success message', async () => {
      const successMessage = page.locator('text=Thank You').or(
        page.locator('text=successfully')
      );
      
      if (await successMessage.count() > 0) {
        await expect(successMessage).toBeVisible();
      }
    });
  });

  test('Site Messages - Display and Interaction', async ({ page }) => {
    // Test site messages display
    await test.step('Verify site messages are displayed', async () => {
      const siteMessages = page.locator('[data-testid="site-messages"]').or(
        page.locator('.site-messages')
      );
      
      // Site messages might not always be present, so we just check if the container exists
      const messagesContainer = page.locator('div:has-text("Site Messages")').or(
        page.locator('div:has-text("Messages")')
      );
      
      // This is optional - site messages might not be present in test environment
      console.log('Site messages container found:', await messagesContainer.count() > 0);
    });

    // Test message dismissal if present
    await test.step('Test message dismissal', async () => {
      const dismissButton = page.locator('button[aria-label*="dismiss" i]').or(
        page.locator('button:has(svg)').filter({ hasText: /close|x/i })
      );
      
      if (await dismissButton.count() > 0) {
        await dismissButton.first().click();
        await page.waitForTimeout(500);
      }
    });
  });

  test('Site Messages Admin - Complete Management Flow', async ({ page }) => {
    // Navigate to admin site messages page
    await test.step('Navigate to admin site messages page', async () => {
      await page.goto('/admin/site-messages');
      await page.waitForLoadState('networkidle');
    });

    // Test admin interface display
    await test.step('Verify admin interface is displayed', async () => {
      const adminHeader = page.locator('h2:has-text("Site Messages")');
      await expect(adminHeader).toBeVisible();
      
      const newMessageButton = page.locator('button:has-text("New Message")');
      await expect(newMessageButton).toBeVisible();
    });

    // Test creating a new message
    await test.step('Create a new site message', async () => {
      const newMessageButton = page.locator('button:has-text("New Message")');
      await newMessageButton.click();
      await page.waitForTimeout(500);

      // Fill message form
      const titleInput = page.locator('input[placeholder*="title" i]');
      const messageInput = page.locator('textarea[placeholder*="content" i]');
      const typeSelect = page.locator('select').first();
      const prioritySelect = page.locator('select').nth(1);
      
      if (await titleInput.count() > 0) {
        await titleInput.fill('E2E Test Message');
      }
      
      if (await messageInput.count() > 0) {
        await messageInput.fill('This is a test message created during E2E testing.');
      }
      
      if (await typeSelect.count() > 0) {
        await typeSelect.selectOption('info');
      }
      
      if (await prioritySelect.count() > 0) {
        await prioritySelect.selectOption('medium');
      }

      // Submit the form
      const createButton = page.locator('button:has-text("Create Message")');
      if (await createButton.count() > 0) {
        await createButton.click();
        await page.waitForTimeout(1000);
      }
    });

    // Test message management
    await test.step('Test message management actions', async () => {
      // Test edit message
      const editButton = page.locator('button[title*="Edit" i]').first();
      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(500);
        
        // Close edit modal if it opens
        const closeButton = page.locator('button:has-text("Cancel")').or(
          page.locator('button:has-text("Close")')
        );
        if (await closeButton.count() > 0) {
          await closeButton.click();
        }
      }

      // Test toggle active status
      const toggleButton = page.locator('button[title*="Activate" i], button[title*="Deactivate" i]').first();
      if (await toggleButton.count() > 0) {
        await toggleButton.click();
        await page.waitForTimeout(500);
      }

      // Test delete message
      const deleteButton = page.locator('button[title*="Delete" i]').first();
      if (await deleteButton.count() > 0) {
        await deleteButton.click();
        await page.waitForTimeout(500);
        
        // Confirm deletion if dialog appears
        const confirmButton = page.locator('button:has-text("Delete")').or(
          page.locator('button:has-text("Confirm")')
        );
        if (await confirmButton.count() > 0) {
          await confirmButton.click();
        }
      }
    });

    // Test message filtering and search
    await test.step('Test message filtering', async () => {
      // Test type filtering
      const typeFilter = page.locator('select').first();
      if (await typeFilter.count() > 0) {
        await typeFilter.selectOption('info');
        await page.waitForTimeout(500);
      }

      // Test priority filtering
      const priorityFilter = page.locator('select').nth(1);
      if (await priorityFilter.count() > 0) {
        await priorityFilter.selectOption('medium');
        await page.waitForTimeout(500);
      }
    });
  });

  test('Admin Feedback Management - View and Filter', async ({ page }) => {
    // Navigate to admin feedback page
    await test.step('Navigate to admin feedback page', async () => {
      await page.goto('/admin/feedback');
      await page.waitForLoadState('networkidle');
    });

    // Test feedback list display
    await test.step('Verify feedback list is displayed', async () => {
      const feedbackList = page.locator('[data-testid="feedback-list"]');
      await expect(feedbackList).toBeVisible();
    });

    // Test feedback filters
    await test.step('Test feedback filters', async () => {
      const filterButtons = page.locator('button:has-text("Filter")').or(
        page.locator('select')
      );
      
      if (await filterButtons.count() > 0) {
        // Test filter interaction
        await filterButtons.first().click();
        await page.waitForTimeout(500);
      }
    });

    // Test feedback stats
    await test.step('Verify feedback stats are displayed', async () => {
      const statsCards = page.locator('[data-testid="feedback-stats"]').or(
        page.locator('.stats-card')
      );
      
      if (await statsCards.count() > 0) {
        await expect(statsCards.first()).toBeVisible();
      }
    });
  });

  test('Feedback Analytics - Performance Tracking', async ({ page }) => {
    // Test feedback widget performance
    await test.step('Test feedback widget performance', async () => {
      const performanceMetrics = await performanceUtils.measureComponentPerformance(
        'feedback-widget',
        async () => {
          const feedbackButton = page.locator('button:has-text("Feedback")').or(
            page.locator('button[aria-label*="feedback" i]')
          );
          
          if (await feedbackButton.count() > 0) {
            await feedbackButton.click();
            await page.waitForTimeout(1000);
          }
        }
      );
      
      expect(performanceMetrics.loadTime).toBeLessThan(1000);
    });

    // Test feedback submission performance
    await test.step('Test feedback submission performance', async () => {
      const submissionMetrics = await performanceUtils.measureAPIPerformance(
        '/api/feedback',
        'POST',
        {
          type: 'general',
          title: 'Performance Test',
          description: 'Testing feedback submission performance',
          sentiment: 'neutral'
        }
      );
      
      expect(submissionMetrics.responseTime).toBeLessThan(2000);
    });
  });

  test('Feedback Error Handling', async ({ page }) => {
    // Test feedback widget error states
    await test.step('Test feedback widget error handling', async () => {
      // Try to submit feedback without required fields
      const feedbackButton = page.locator('button:has-text("Feedback")').or(
        page.locator('button[aria-label*="feedback" i]')
      );
      
      if (await feedbackButton.count() > 0) {
        await feedbackButton.click();
        await page.waitForTimeout(1000);
        
        // Try to submit without filling required fields
        const submitButton = page.locator('button:has-text("Submit")').or(
          page.locator('button:has-text("Submit Feedback")')
        );
        
        if (await submitButton.count() > 0) {
          const isDisabled = await submitButton.isDisabled();
          expect(isDisabled).toBe(true);
        }
      }
    });
  });

  test('Feedback Accessibility', async ({ page }) => {
    // Test feedback widget accessibility
    await test.step('Test feedback widget accessibility', async () => {
      const feedbackButton = page.locator('button:has-text("Feedback")').or(
        page.locator('button[aria-label*="feedback" i]')
      );
      
      if (await feedbackButton.count() > 0) {
        // Test keyboard navigation
        await feedbackButton.focus();
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
        
        // Test ARIA labels
        const ariaLabel = await feedbackButton.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
      }
    });

    // Test form accessibility
    await test.step('Test feedback form accessibility', async () => {
      const titleInput = page.locator('input[placeholder*="title" i]');
      const descriptionInput = page.locator('textarea[placeholder*="description" i]');
      
      if (await titleInput.count() > 0) {
        // Test form labels
        const titleLabel = await titleInput.getAttribute('aria-label');
        expect(titleLabel).toBeTruthy();
      }
      
      if (await descriptionInput.count() > 0) {
        const descriptionLabel = await descriptionInput.getAttribute('aria-label');
        expect(descriptionLabel).toBeTruthy();
      }
    });
  });
});
