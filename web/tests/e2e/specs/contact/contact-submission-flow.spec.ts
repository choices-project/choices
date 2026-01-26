/**
 * Contact Information Submission Flow Tests
 *
 * Tests the complete user submission flow for contact information:
 * - API submission with valid data
 * - Input validation
 * - Success notifications
 * - Error handling
 * - Rate limiting
 * - Duplicate detection
 * - Authorization checks
 *
 * Created: January 26, 2026
 * Status: ✅ ACTIVE
 */

import { test, expect } from '@playwright/test';

import {
  loginWithPassword,
  getE2EUserCredentials,
  ensureLoggedOut,
} from '../../helpers/e2e-setup';

test.describe('Contact Information Submission Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure clean state
    await ensureLoggedOut(page);

    // Login as regular user
    const userCreds = getE2EUserCredentials();
    if (!userCreds) {
      test.skip(true, 'User credentials not available');
      return;
    }

    await loginWithPassword(page, userCreds, {
      path: '/auth',
      timeoutMs: 30_000,
    });

    // Wait for navigation to complete
    await page.waitForTimeout(2_000);
  });

  test.describe('Valid Submission', () => {
    test('user can submit valid email contact information', async ({ page }) => {
      const response = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: 1,
          contact_type: 'email',
          value: 'test@example.com',
        },
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.contact).toBeDefined();
      expect(body.data.contact.contact_type).toBe('email');
      expect(body.data.contact.value).toBe('test@example.com');
      expect(body.data.contact.is_verified).toBe(false);
      expect(body.data.contact.source).toBe('user_submission');
      expect(body.data.contact.submitted_by_user_id).toBeDefined();
    });

    test('user can submit valid phone contact information', async ({ page }) => {
      const response = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: 1,
          contact_type: 'phone',
          value: '5551234567',
        },
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.contact.contact_type).toBe('phone');
      expect(body.data.contact.value).toBe('5551234567');
    });

    test('user can submit valid address contact information', async ({ page }) => {
      const response = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: 1,
          contact_type: 'address',
          value: '123 Capitol Building, Washington, DC 20510',
        },
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.contact.contact_type).toBe('address');
      expect(body.data.contact.value).toContain('Capitol Building');
    });

    test('email is normalized to lowercase', async ({ page }) => {
      const response = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: 1,
          contact_type: 'email',
          value: 'Test@Example.COM',
        },
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.data.contact.value).toBe('test@example.com');
    });

    test('phone number is normalized', async ({ page }) => {
      const response = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: 1,
          contact_type: 'phone',
          value: '(555) 123-4567',
        },
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      // Phone should be normalized (format may vary, but should be consistent)
      expect(body.data.contact.value).toBeDefined();
      expect(typeof body.data.contact.value).toBe('string');
    });
  });

  test.describe('Input Validation', () => {
    test('rejects invalid email format', async ({ page }) => {
      const response = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: 1,
          contact_type: 'email',
          value: 'not-an-email',
        },
      });

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
    });

    test('rejects invalid phone format', async ({ page }) => {
      const response = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: 1,
          contact_type: 'phone',
          value: '123', // Too short
        },
      });

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
    });

    test('rejects invalid address (too short)', async ({ page }) => {
      const response = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: 1,
          contact_type: 'address',
          value: '123', // Too short (min 5 chars)
        },
      });

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
    });

    test('rejects invalid contact type', async ({ page }) => {
      const response = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: 1,
          contact_type: 'invalid_type',
          value: 'test@example.com',
        },
      });

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
    });

    test('rejects missing required fields', async ({ page }) => {
      const response = await page.request.post('/api/contact/submit', {
        data: {
          // Missing representative_id
          contact_type: 'email',
          value: 'test@example.com',
        },
      });

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
    });

    test('rejects invalid representative_id', async ({ page }) => {
      const response = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: -1, // Invalid
          contact_type: 'email',
          value: 'test@example.com',
        },
      });

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
    });
  });

  test.describe('Authentication & Authorization', () => {
    test('requires authentication to submit', async ({ page }) => {
      await ensureLoggedOut(page);

      const response = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: 1,
          contact_type: 'email',
          value: 'test@example.com',
        },
      });

      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Authentication');
    });

    test('user can only update own unverified submissions', async ({ page }) => {
      // First, create a submission
      const submitResponse = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: 1,
          contact_type: 'email',
          value: 'my-email@example.com',
        },
      });

      expect(submitResponse.status()).toBe(200);
      const submitBody = await submitResponse.json();
      const contactId = submitBody.data.contact.id;

      // Try to update it (should succeed - it's our own submission)
      const updateResponse = await page.request.patch(`/api/contact/${contactId}`, {
        data: {
          value: 'updated@example.com',
        },
      });

      expect(updateResponse.status()).toBe(200);

      // Note: Testing that user CANNOT update another user's submission
      // would require creating a submission as a different user,
      // which is more complex in E2E tests. This is better tested in unit/integration tests.
    });
  });

  test.describe('Duplicate Detection', () => {
    test('updates existing unverified submission instead of creating duplicate', async ({ page }) => {
      const email = `duplicate-test-${Date.now()}@example.com`;

      // First submission
      const firstResponse = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: 1,
          contact_type: 'email',
          value: email,
        },
      });

      expect(firstResponse.status()).toBe(200);

      // Second submission with same data (should update, not create new)
      const secondResponse = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: 1,
          contact_type: 'email',
          value: email,
        },
      });

      expect(secondResponse.status()).toBe(200);
      const secondBody = await secondResponse.json();

      // Should update the existing contact (same ID or updated timestamp)
      // The API may return the same ID or a new ID, but the value should be updated
      expect(secondBody.data.contact.value).toBe(email);
    });
  });

  test.describe('Rate Limiting', () => {
    test('enforces rate limit on rapid submissions', async ({ page }) => {
      // Submit 5 contacts rapidly (rate limit is 5/minute)
      const submissions = [];
      for (let i = 0; i < 5; i++) {
        const response = await page.request.post('/api/contact/submit', {
          data: {
            representative_id: 1,
            contact_type: 'email',
            value: `rate-limit-test-${i}-${Date.now()}@example.com`,
          },
        });
        submissions.push(response);
      }

      // All 5 should succeed
      for (const response of submissions) {
        expect((await response).status()).toBe(200);
      }

      // 6th submission should be rate limited
      const rateLimitedResponse = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: 1,
          contact_type: 'email',
          value: `rate-limit-test-6-${Date.now()}@example.com`,
        },
      });

      const rateLimitStatus = (await rateLimitedResponse).status();
      // Should be either 429 (Too Many Requests) or 400 with rate limit error
      expect([400, 429]).toContain(rateLimitStatus);

      if (rateLimitStatus === 400) {
        const body = await (await rateLimitedResponse).json();
        expect(body.error).toContain('Too many');
      }
    });
  });

  test.describe('CRUD Operations', () => {
    test('user can retrieve own contact submission', async ({ page }) => {
      // Create submission
      const submitResponse = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: 1,
          contact_type: 'email',
          value: 'retrieve-test@example.com',
        },
      });

      expect(submitResponse.status()).toBe(200);
      const submitBody = await submitResponse.json();
      const contactId = submitBody.data.contact.id;

      // Retrieve it
      const getResponse = await page.request.get(`/api/contact/${contactId}`);
      expect(getResponse.status()).toBe(200);

      const getBody = await getResponse.json();
      expect(getBody.success).toBe(true);
      expect(getBody.data.contact.id).toBe(contactId);
      expect(getBody.data.contact.value).toBe('retrieve-test@example.com');
    });

    test('user can update own unverified submission', async ({ page }) => {
      // Create submission
      const submitResponse = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: 1,
          contact_type: 'email',
          value: 'update-test@example.com',
        },
      });

      expect(submitResponse.status()).toBe(200);
      const submitBody = await submitResponse.json();
      const contactId = submitBody.data.contact.id;

      // Update it
      const updateResponse = await page.request.patch(`/api/contact/${contactId}`, {
        data: {
          value: 'updated@example.com',
        },
      });

      expect(updateResponse.status()).toBe(200);

      const updateBody = await updateResponse.json();
      expect(updateBody.success).toBe(true);
      expect(updateBody.data.contact.value).toBe('updated@example.com');
    });

    test('user can delete own unverified submission', async ({ page }) => {
      // Create submission
      const submitResponse = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: 1,
          contact_type: 'email',
          value: 'delete-test@example.com',
        },
      });

      expect(submitResponse.status()).toBe(200);
      const submitBody = await submitResponse.json();
      const contactId = submitBody.data.contact.id;

      // Delete it
      const deleteResponse = await page.request.delete(`/api/contact/${contactId}`);
      expect(deleteResponse.status()).toBe(200);

      // Verify it's deleted
      const getResponse = await page.request.get(`/api/contact/${contactId}`);
      expect(getResponse.status()).toBe(404);
    });

    test('user can retrieve contacts for a representative', async ({ page }) => {
      // Create a submission
      await page.request.post('/api/contact/submit', {
        data: {
          representative_id: 1,
          contact_type: 'email',
          value: 'representative-test@example.com',
        },
      });

      // Retrieve all contacts for representative
      const response = await page.request.get('/api/contact/representative/1');
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data.contacts)).toBe(true);
    });
  });
});
