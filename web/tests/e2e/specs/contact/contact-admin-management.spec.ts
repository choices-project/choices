/**
 * Contact Admin Management Tests
 *
 * Tests admin approval/rejection flow for contact information:
 * - Admin UI loading and display
 * - Filtering and search functionality
 * - Approve functionality
 * - Reject functionality
 * - Pagination
 * - Empty states
 * - Authorization checks
 *
 * Created: January 26, 2026
 * Status: ✅ ACTIVE
 */

import { test, expect } from '@playwright/test';

import {
  getE2EAdminCredentials,
  getE2EUserCredentials,
  waitForPageReady,
  ensureLoggedOut,
} from '../../helpers/e2e-setup';

/**
 * Authenticate via API and set cookies for API tests
 */
async function authenticateViaAPI(page: any, email: string, password: string): Promise<void> {
  const response = await page.request.post('/api/auth/login', {
    data: {
      email,
      password,
    },
  });

  if (response.status() !== 200) {
    throw new Error(`Login failed with status ${response.status()}`);
  }

  await page.waitForTimeout(500);
}

test.describe('Contact Admin Management', () => {
  test.describe('Admin UI', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin via API
      const adminCreds = getE2EAdminCredentials();
      if (!adminCreds) {
        test.skip(true, 'Admin credentials not available');
        return;
      }

      await authenticateViaAPI(page, adminCreds.email, adminCreds.password);
    });

    test('admin contact page loads without errors', async ({ page }) => {
      await page.goto('/admin/contact', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      // Check for React errors
      const reactError = page.locator('text=/Minified React error #185/i');
      const reactErrorCount = await reactError.count();
      expect(reactErrorCount).toBe(0);

      // Check that page content loads
      // The page should show either loading, content, or empty state
      const pageTitle = page.locator('h1, h2').filter({ hasText: /contact/i });
      const loadingState = page.locator('text=/loading/i');
      const emptyState = page.locator('text=/no.*pending|no.*submissions/i');
      const contactList = page.locator('[data-testid*="contact"], .contact-card, .card');

      const hasContent =
        (await pageTitle.count()) > 0 ||
        (await loadingState.count()) > 0 ||
        (await emptyState.count()) > 0 ||
        (await contactList.count()) > 0;

      expect(hasContent).toBe(true);
    });

    test('admin contact page shows pending submissions', async ({ page }) => {
        // First, create a submission as a regular user
        const userCreds = getE2EUserCredentials();
        if (userCreds) {
          // Create submission via API (simulating user submission)
          await ensureLoggedOut(page);
          await authenticateViaAPI(page, userCreds.email, userCreds.password);

          await page.request.post('/api/contact/submit', {
            data: {
              representative_id: 1,
              contact_type: 'email',
              value: `admin-test-${Date.now()}@example.com`,
            },
          });

          // Switch back to admin
          await ensureLoggedOut(page);
          const adminCreds = getE2EAdminCredentials();
          if (adminCreds) {
            await authenticateViaAPI(page, adminCreds.email, adminCreds.password);
          }
        }

      await page.goto('/admin/contact', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      // Wait for data to load
      await page.waitForTimeout(3_000);

      // Page should show either submissions or empty state
      const hasContent = await page
        .locator('text=/pending|submission|no.*pending|loading/i')
        .count()
        .then((count) => count > 0);

      expect(hasContent).toBe(true);
    });

    test('admin contact page has filtering controls', async ({ page }) => {
      await page.goto('/admin/contact', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      // Look for filter controls (search, select dropdowns, etc.)
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
      const filterButton = page.locator('button:has-text("filter"), button:has-text("Filter")');
      const selectDropdowns = page.locator('select, [role="combobox"]');

      // At least one filter control should be present
      const hasFilters =
        (await searchInput.count()) > 0 ||
        (await filterButton.count()) > 0 ||
        (await selectDropdowns.count()) > 0;

      expect(hasFilters).toBe(true);
    });
  });

  test.describe('Admin API Endpoints', () => {
    let adminPage: any;
    let userPage: any;
    let testContactId: number | null = null;

    test.beforeEach(async ({ browser }) => {
      // Create separate contexts for admin and user
      const adminContext = await browser.newContext();
      adminPage = await adminContext.newPage();

      const userContext = await browser.newContext();
      userPage = await userContext.newPage();

      // Login as admin via API
      const adminCreds = getE2EAdminCredentials();
      if (!adminCreds) {
        test.skip(true, 'Admin credentials not available');
        return;
      }

      await authenticateViaAPI(adminPage, adminCreds.email, adminCreds.password);

      // Login as user and create a submission via API
      const userCreds = getE2EUserCredentials();
      if (userCreds) {
        await authenticateViaAPI(userPage, userCreds.email, userCreds.password);

        const response = await userPage.request.post('/api/contact/submit', {
          data: {
            representative_id: 1,
            contact_type: 'email',
            value: `admin-api-test-${Date.now()}@example.com`,
          },
        });

        if (response.status() === 200) {
          const body = await response.json();
          testContactId = body.data.contact.id;
        }
      }
    });

    test.afterEach(async () => {
      await adminPage?.close();
      await userPage?.close();
    });

    test('admin can retrieve pending submissions', async () => {
      const response = await adminPage.request.get('/api/admin/contact/pending');

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data.contacts)).toBe(true);
      expect(body.data.pagination).toBeDefined();
    });

    test('admin can filter pending submissions by representative', async () => {
      const response = await adminPage.request.get(
        '/api/admin/contact/pending?representative_id=1'
      );

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      // All returned contacts should be for representative_id 1
      if (body.data.contacts.length > 0) {
        body.data.contacts.forEach((contact: any) => {
          expect(contact.representative_id).toBe(1);
        });
      }
    });

    test('admin can filter pending submissions by contact type', async () => {
      const response = await adminPage.request.get('/api/admin/contact/pending?contact_type=email');

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      // All returned contacts should be email type
      if (body.data.contacts.length > 0) {
        body.data.contacts.forEach((contact: any) => {
          expect(contact.contact_type).toBe('email');
        });
      }
    });

    test('admin can approve a contact submission', async () => {
      if (!testContactId) {
        test.skip(true, 'No test contact created');
        return;
      }

      const response = await adminPage.request.post(`/api/admin/contact/${testContactId}/approve`);

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.contact.is_verified).toBe(true);

      // Verify it's no longer in pending list
      const pendingResponse = await adminPage.request.get('/api/admin/contact/pending');
      const pendingBody = await pendingResponse.json();
      const stillPending = pendingBody.data.contacts.find(
        (c: any) => c.id === testContactId && !c.is_verified
      );
      expect(stillPending).toBeUndefined();
    });

    test('admin can reject a contact submission with reason', async () => {
      // Create a new submission for rejection test
      if (!userPage) {
        test.skip(true, 'User page not available');
        return;
      }

      const submitResponse = await userPage.request.post('/api/contact/submit', {
        data: {
          representative_id: 1,
          contact_type: 'email',
          value: `reject-test-${Date.now()}@example.com`,
        },
      });

      if (submitResponse.status() !== 200) {
        test.skip(true, 'Could not create test submission');
        return;
      }

      const submitBody = await submitResponse.json();
      const contactId = submitBody.data.contact.id;

      const rejectResponse = await adminPage.request.post(`/api/admin/contact/${contactId}/reject`, {
        data: {
          reason: 'Test rejection reason',
        },
      });

      expect(rejectResponse.status()).toBe(200);

      const rejectBody = await rejectResponse.json();
      expect(rejectBody.success).toBe(true);

      // Verify it's no longer in pending (rejected contacts are stored, not deleted)
      const pendingAfter = await adminPage.request.get('/api/admin/contact/pending');
      const pendingBody = await pendingAfter.json();
      const stillPending = pendingBody.data?.contacts?.find(
        (c: any) => c.id === contactId
      );
      expect(stillPending).toBeUndefined();
    });

    test('admin can reject a contact submission without reason', async () => {
      // Create a new submission
      if (!userPage) {
        test.skip(true, 'User page not available');
        return;
      }

      const submitResponse = await userPage.request.post('/api/contact/submit', {
        data: {
          representative_id: 1,
          contact_type: 'email',
          value: `reject-no-reason-${Date.now()}@example.com`,
        },
      });

      if (submitResponse.status() !== 200) {
        test.skip(true, 'Could not create test submission');
        return;
      }

      const submitBody = await submitResponse.json();
      const contactId = submitBody.data.contact.id;

      const rejectResponse = await adminPage.request.post(`/api/admin/contact/${contactId}/reject`);

      expect(rejectResponse.status()).toBe(200);

      // Verify it's no longer in pending (rejected contacts are stored, not deleted)
      const pendingAfter = await adminPage.request.get('/api/admin/contact/pending');
      const pendingBody = await pendingAfter.json();
      const stillPending = pendingBody.data?.contacts?.find(
        (c: any) => c.id === contactId
      );
      expect(stillPending).toBeUndefined();
    });

    test('admin endpoints require admin authentication', async ({ page }) => {
      // Try to access admin endpoint as regular user
      const userCreds = getE2EUserCredentials();
      if (!userCreds) {
        test.skip(true, 'User credentials not available');
        return;
      }

      await authenticateViaAPI(page, userCreds.email, userCreds.password);

      const response = await page.request.get('/api/admin/contact/pending');

      // Should be 401 (unauthorized) or 403 (forbidden)
      expect([401, 403]).toContain(response.status());
    });

    test('pagination works correctly', async () => {
      const firstPage = await adminPage.request.get('/api/admin/contact/pending?limit=10&offset=0');
      expect(firstPage.status()).toBe(200);

      const firstPageBody = await firstPage.json();
      expect(firstPageBody.data.pagination).toBeDefined();
      expect(firstPageBody.data.pagination.limit).toBe(10);
      expect(firstPageBody.data.pagination.offset).toBe(0);

      const secondPage = await adminPage.request.get('/api/admin/contact/pending?limit=10&offset=10');
      expect(secondPage.status()).toBe(200);

      const secondPageBody = await secondPage.json();
      expect(secondPageBody.data.pagination.offset).toBe(10);
    });
  });
});
