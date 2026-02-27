/**
 * Contact System Edge Cases and Security Tests
 *
 * Tests edge cases, error scenarios, and security:
 * - Authorization failures
 * - Invalid data handling
 * - Concurrent operations
 * - Network errors
 * - XSS/SQL injection attempts
 * - Boundary conditions
 *
 * Created: January 26, 2026
 * Status: ✅ ACTIVE
 */

import { test, expect } from '@playwright/test';

import {
  getE2EUserCredentials,
  getE2EAdminCredentials,
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

async function getRepresentativeId(page: any): Promise<number | null> {
  const res = await page.request.get('/api/civics/representatives?limit=1');
  if (res.status() !== 200) return null;
  const body = await res.json();
  const reps = body.data?.representatives;
  return reps?.length ? reps[0].id : null;
}

test.describe('Contact System Edge Cases', () => {
  test.describe('Security', () => {
    test('unauthenticated requests are rejected', async ({ page }) => {
      await ensureLoggedOut(page);

      const endpoints = [
        { method: 'POST', url: '/api/contact/submit', data: { representative_id: 1, contact_type: 'email', value: 'test@example.com' } },
        { method: 'GET', url: '/api/contact/1' },
        { method: 'PATCH', url: '/api/contact/1', data: { value: 'test@example.com' } },
        { method: 'DELETE', url: '/api/contact/1' },
        { method: 'GET', url: '/api/contact/representative/1' },
        { method: 'GET', url: '/api/admin/contact/pending' },
        { method: 'POST', url: '/api/admin/contact/1/approve' },
        { method: 'POST', url: '/api/admin/contact/1/reject' },
      ];

      for (const endpoint of endpoints) {
        let response;
        if (endpoint.method === 'GET') {
          response = await page.request.get(endpoint.url);
        } else if (endpoint.method === 'POST') {
          response = await page.request.post(endpoint.url, { data: endpoint.data || {} });
        } else if (endpoint.method === 'PATCH') {
          response = await page.request.patch(endpoint.url, { data: endpoint.data || {} });
        } else if (endpoint.method === 'DELETE') {
          response = await page.request.delete(endpoint.url);
        }

        expect(response).toBeDefined();
        if (response) {
          expect([401, 403]).toContain(response.status());
        }
      }
    });

    test('regular users cannot access admin endpoints', async ({ page }) => {
      const userCreds = getE2EUserCredentials();
      if (!userCreds) {
        test.skip(true, 'User credentials not available');
        return;
      }

      await authenticateViaAPI(page, userCreds.email, userCreds.password);

      const adminEndpoints = [
        { method: 'GET', url: '/api/admin/contact/pending' },
        { method: 'POST', url: '/api/admin/contact/1/approve' },
        { method: 'POST', url: '/api/admin/contact/1/reject' },
      ];

      for (const endpoint of adminEndpoints) {
        let response: Awaited<ReturnType<typeof page.request.get>> | undefined;
        if (endpoint.method === 'GET') {
          response = await page.request.get(endpoint.url);
        } else if (endpoint.method === 'POST') {
          response = await page.request.post(endpoint.url);
        }

        expect(response).toBeDefined();
        if (response) {
          expect([401, 403]).toContain(response.status());
        }
      }
    });

    test('XSS attempts in contact values are sanitized', async ({ page }) => {
      const userCreds = getE2EUserCredentials();
      if (!userCreds) {
        test.skip(true, 'User credentials not available');
        return;
      }

      await authenticateViaAPI(page, userCreds.email, userCreds.password);

      const xssAttempts = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src=x onerror=alert("xss")>',
        '"><script>alert("xss")</script>',
      ];

      for (const xssAttempt of xssAttempts) {
        const response = await page.request.post('/api/contact/submit', {
          data: {
            representative_id: 1,
            contact_type: 'email',
            value: xssAttempt,
          },
        });

        // Should either reject (400) or sanitize (200 with sanitized value)
        expect([200, 400]).toContain(response.status());

        if (response.status() === 200) {
          const body = await response.json();
          // If accepted, value should not contain script tags
          expect(body.data.contact.value).not.toContain('<script>');
          expect(body.data.contact.value).not.toContain('javascript:');
        }
      }
    });

    test('SQL injection attempts are rejected', async ({ page }) => {
      const userCreds = getE2EUserCredentials();
      if (!userCreds) {
        test.skip(true, 'User credentials not available');
        return;
      }

      await authenticateViaAPI(page, userCreds.email, userCreds.password);

      const sqlInjectionAttempts = [
        "'; DROP TABLE representative_contacts; --",
        "1' OR '1'='1",
        "admin'--",
        "1'; DELETE FROM representative_contacts; --",
      ];

      for (const sqlAttempt of sqlInjectionAttempts) {
        const response = await page.request.post('/api/contact/submit', {
          data: {
            representative_id: 1,
            contact_type: 'email',
            value: sqlAttempt,
          },
        });

        // Should reject invalid email format
        expect(response.status()).toBe(400);

        const body = await response.json();
        expect(body.success).toBe(false);
      }
    });
  });

  test.describe('Input Validation Edge Cases', () => {
    test.beforeEach(async ({ page }) => {
      const userCreds = getE2EUserCredentials();
      if (!userCreds) {
        test.skip(true, 'User credentials not available');
        return;
      }

      await authenticateViaAPI(page, userCreds.email, userCreds.password);
    });

    test('rejects extremely long email addresses', async ({ page }) => {
      const longEmail = 'a'.repeat(300) + '@example.com';

      const response = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: 1,
          contact_type: 'email',
          value: longEmail,
        },
      });

      expect(response.status()).toBe(400);
    });

    test('rejects extremely long phone numbers', async ({ page }) => {
      const longPhone = '1'.repeat(100);

      const response = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: 1,
          contact_type: 'phone',
          value: longPhone,
        },
      });

      expect(response.status()).toBe(400);
    });

    test('rejects extremely long addresses', async ({ page }) => {
      const longAddress = 'A'.repeat(1000); // Max is 500 chars

      const response = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: 1,
          contact_type: 'address',
          value: longAddress,
        },
      });

      expect(response.status()).toBe(400);
    });

    test('handles unicode characters correctly', async ({ page }) => {
      const repId = await getRepresentativeId(page);
      if (!repId) {
        test.skip(true, 'No representative found');
        return;
      }

      const response = await page.request.post('/api/contact/submit', {
        data: { representative_id: repId, contact_type: 'email', value: 'tëst@éxämple.com' },
      });
      expect([200, 400]).toContain(response.status());
    });

    test('handles special characters in addresses', async ({ page }) => {
      const repId = await getRepresentativeId(page);
      if (!repId) {
        test.skip(true, 'No representative found');
        return;
      }

      const response = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: repId,
          contact_type: 'address',
          value: '123 Main St., Suite #4, Apt. 5-B, New York, NY 10001',
        },
      });
      expect(response.status()).toBe(200);
    });

    test('rejects empty strings', async ({ page }) => {
      const response = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: 1,
          contact_type: 'email',
          value: '',
        },
      });

      expect(response.status()).toBe(400);
    });

    test('rejects whitespace-only values', async ({ page }) => {
      const response = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: 1,
          contact_type: 'email',
          value: '   ',
        },
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('Authorization Edge Cases', () => {
    test('user cannot update verified contact', async ({ page }) => {
      const userCreds = getE2EUserCredentials();
      if (!userCreds) {
        test.skip(true, 'User credentials not available');
        return;
      }

      await authenticateViaAPI(page, userCreds.email, userCreds.password);

      const repId = await getRepresentativeId(page);
      if (!repId) {
        test.skip(true, 'No representative found');
        return;
      }

      const submitResponse = await page.request.post('/api/contact/submit', {
        data: { representative_id: repId, contact_type: 'email', value: 'auth-test@example.com' },
      });

      if (submitResponse.status() !== 200) {
        test.skip(true, 'Could not create test submission');
        return;
      }

      const submitBody = await submitResponse.json();
      const contactId = submitBody.data.contact.id;

      // Approve it as admin (simulate admin approval)
      const adminCreds = getE2EAdminCredentials();
      if (adminCreds) {
        const adminContext = await page.context().browser()?.newContext();
        if (adminContext) {
          const adminPage = await adminContext.newPage();
          await authenticateViaAPI(adminPage, adminCreds.email, adminCreds.password);

          await adminPage.request.post(`/api/admin/contact/${contactId}/approve`);
          await adminPage.close();
        }
      }

      // Try to update as user (should fail - it's now verified)
      const updateResponse = await page.request.patch(`/api/contact/${contactId}`, {
        data: {
          value: 'updated@example.com',
        },
      });

      expect(updateResponse.status()).toBe(403);
    });

    test('user cannot delete verified contact', async ({ page }) => {
      const userCreds = getE2EUserCredentials();
      if (!userCreds) {
        test.skip(true, 'User credentials not available');
        return;
      }

      await authenticateViaAPI(page, userCreds.email, userCreds.password);

      // Create and approve submission (similar to above)
      const submitResponse = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: 1,
          contact_type: 'email',
          value: 'delete-auth-test@example.com',
        },
      });

      if (submitResponse.status() !== 200) {
        test.skip(true, 'Could not create test submission');
        return;
      }

      const submitBody = await submitResponse.json();
      const contactId = submitBody.data.contact.id;

      // Approve it as admin
      const adminCreds = getE2EAdminCredentials();
      if (adminCreds) {
        const adminContext = await page.context().browser()?.newContext();
        if (adminContext) {
          const adminPage = await adminContext.newPage();
          await authenticateViaAPI(adminPage, adminCreds.email, adminCreds.password);

          await adminPage.request.post(`/api/admin/contact/${contactId}/approve`);
          await adminPage.close();
        }
      }

      // Try to delete as user (should fail)
      const deleteResponse = await page.request.delete(`/api/contact/${contactId}`);
      expect(deleteResponse.status()).toBe(403);
    });
  });

  test.describe('Error Handling', () => {
    test('handles non-existent contact ID gracefully', async ({ page }) => {
      const userCreds = getE2EUserCredentials();
      if (!userCreds) {
        test.skip(true, 'User credentials not available');
        return;
      }

      await authenticateViaAPI(page, userCreds.email, userCreds.password);

      const nonExistentId = 999999;

      const getResponse = await page.request.get(`/api/contact/${nonExistentId}`);
      expect(getResponse.status()).toBe(404);

      const updateResponse = await page.request.patch(`/api/contact/${nonExistentId}`, {
        data: { value: 'test@example.com' },
      });
      expect(updateResponse.status()).toBe(404);

      const deleteResponse = await page.request.delete(`/api/contact/${nonExistentId}`);
      expect(deleteResponse.status()).toBe(404);
    });

    test('handles invalid contact ID format', async ({ page }) => {
      const userCreds = getE2EUserCredentials();
      if (!userCreds) {
        test.skip(true, 'User credentials not available');
        return;
      }

      await authenticateViaAPI(page, userCreds.email, userCreds.password);

      const invalidIds = ['not-a-number', 'abc', '-1', '0'];

      for (const invalidId of invalidIds) {
        const getResponse = await page.request.get(`/api/contact/${invalidId}`);
        expect([400, 404]).toContain(getResponse.status());
      }
    });

    test('handles invalid representative ID', async ({ page }) => {
      const userCreds = getE2EUserCredentials();
      if (!userCreds) {
        test.skip(true, 'User credentials not available');
        return;
      }

      await authenticateViaAPI(page, userCreds.email, userCreds.password);

      // Format validation: -1, 0, 'not-a-number' → 400
      const invalidFormatIds = [-1, 0, 'not-a-number'];
      for (const invalidRepId of invalidFormatIds) {
        const response = await page.request.post('/api/contact/submit', {
          data: {
            representative_id: invalidRepId,
            contact_type: 'email',
            value: 'test@example.com',
          },
        });
        expect(response.status()).toBe(400);
      }

      // Non-existent rep (999999): API returns 404 "Representative not found"
      const nonExistentResponse = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: 999999,
          contact_type: 'email',
          value: 'test@example.com',
        },
      });
      expect([400, 404]).toContain(nonExistentResponse.status());
    });
  });

  test.describe('Boundary Conditions', () => {
    test.beforeEach(async ({ page }) => {
      const userCreds = getE2EUserCredentials();
      if (!userCreds) {
        test.skip(true, 'User credentials not available');
        return;
      }

      await authenticateViaAPI(page, userCreds.email, userCreds.password);
    });

    test('handles minimum valid email length', async ({ page }) => {
      const repId = await getRepresentativeId(page);
      if (!repId) {
        test.skip(true, 'No representative found');
        return;
      }

      const response = await page.request.post('/api/contact/submit', {
        data: { representative_id: repId, contact_type: 'email', value: 'a@b.co' },
      });
      expect(response.status()).toBe(200);
    });

    test('handles minimum valid address length', async ({ page }) => {
      const repId = await getRepresentativeId(page);
      if (!repId) {
        test.skip(true, 'No representative found');
        return;
      }

      const response = await page.request.post('/api/contact/submit', {
        data: { representative_id: repId, contact_type: 'address', value: '12345' },
      });
      expect(response.status()).toBe(200);
    });

    test('handles maximum valid address length', async ({ page }) => {
      const repId = await getRepresentativeId(page);
      if (!repId) {
        test.skip(true, 'No representative found');
        return;
      }

      const response = await page.request.post('/api/contact/submit', {
        data: { representative_id: repId, contact_type: 'address', value: 'A'.repeat(500) },
      });
      expect(response.status()).toBe(200);
    });

    test('rejects address exceeding maximum length', async ({ page }) => {
      const tooLongAddress = 'A'.repeat(501); // Exceeds 500 characters

      const response = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: 1,
          contact_type: 'address',
          value: tooLongAddress,
        },
      });

      expect(response.status()).toBe(400);
    });
  });
});
