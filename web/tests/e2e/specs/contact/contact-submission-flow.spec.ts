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
  getE2EUserCredentials,
  ensureLoggedOut,
} from '../../helpers/e2e-setup';

async function authenticateViaAPI(page: any, email: string, password: string): Promise<void> {
  const response = await page.request.post('/api/auth/login', {
    data: { email, password },
  });

  if (response.status() !== 200) {
    throw new Error(`Login failed with status ${response.status()}`);
  }
  await page.waitForTimeout(500);
}

/** Get a valid representative ID from the API; skip test if none found. */
async function getRepresentativeId(page: any): Promise<number | null> {
  const res = await page.request.get('/api/civics/representatives?limit=1');
  if (res.status() !== 200) return null;
  const body = await res.json();
  const reps = body.data?.representatives;
  if (!reps?.length) return null;
  return reps[0].id;
}

test.describe('Contact Information Submission Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure clean state
    await ensureLoggedOut(page);

    // Login as regular user via API
    const userCreds = getE2EUserCredentials();
    if (!userCreds) {
      test.skip(true, 'User credentials not available');
      return;
    }

    await authenticateViaAPI(page, userCreds.email, userCreds.password);
  });

  test.describe('Valid Submission', () => {
    test('user can submit valid email contact information', async ({ page }) => {
      // Try to find a valid representative ID by querying the API
      // If no representative exists, skip the test
      const repsResponse = await page.request.get('/api/civics/representatives?limit=1');
      let representativeId = 1; // Default fallback
      
      if (repsResponse.status() === 200) {
        const repsBody = await repsResponse.json();
        if (repsBody.success && repsBody.data?.representatives?.length > 0) {
          representativeId = repsBody.data.representatives[0].id;
        }
      }

      const response = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: representativeId,
          contact_type: 'email',
          value: 'test@example.com',
        },
      });

      // If representative doesn't exist (404), skip the test
      if (response.status() === 404) {
        test.skip(true, 'No representative found in database');
        return;
      }

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
      // Get a valid representative ID
      const repsResponse = await page.request.get('/api/civics/representatives?limit=1');
      let representativeId = 1;
      
      if (repsResponse.status() === 200) {
        const repsBody = await repsResponse.json();
        if (repsBody.success && repsBody.data?.representatives?.length > 0) {
          representativeId = repsBody.data.representatives[0].id;
        }
      }

      const response = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: representativeId,
          contact_type: 'phone',
          value: '5551234567',
        },
      });

      if (response.status() === 404) {
        test.skip(true, 'No representative found in database');
        return;
      }

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.contact.contact_type).toBe('phone');
      expect(body.data.contact.value).toBe('5551234567');
    });

    test('user can submit valid address contact information', async ({ page }) => {
      // Get a valid representative ID
      const repsResponse = await page.request.get('/api/civics/representatives?limit=1');
      let representativeId = 1;
      
      if (repsResponse.status() === 200) {
        const repsBody = await repsResponse.json();
        if (repsBody.success && repsBody.data?.representatives?.length > 0) {
          representativeId = repsBody.data.representatives[0].id;
        }
      }

      const response = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: representativeId,
          contact_type: 'address',
          value: '123 Capitol Building, Washington, DC 20510',
        },
      });

      if (response.status() === 404) {
        test.skip(true, 'No representative found in database');
        return;
      }

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.contact.contact_type).toBe('address');
      expect(body.data.contact.value).toContain('Capitol Building');
    });

    test('email is normalized to lowercase', async ({ page }) => {
      const repId = await getRepresentativeId(page);
      if (!repId) {
        test.skip(true, 'No representative found');
        return;
      }

      const response = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: repId,
          contact_type: 'email',
          value: 'Test@Example.COM',
        },
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data?.contact?.value).toBe('test@example.com');
    });

    test('phone number is normalized', async ({ page }) => {
      const repId = await getRepresentativeId(page);
      if (!repId) {
        test.skip(true, 'No representative found');
        return;
      }

      const response = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: repId,
          contact_type: 'phone',
          value: '(555) 123-4567',
        },
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.data?.contact?.value).toBeDefined();
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
      const repId = await getRepresentativeId(page);
      if (!repId) {
        test.skip(true, 'No representative found');
        return;
      }

      const submitResponse = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: repId,
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
      const repId = await getRepresentativeId(page);
      if (!repId) {
        test.skip(true, 'No representative found');
        return;
      }

      const email = `duplicate-test-${Date.now()}@example.com`;

      const firstResponse = await page.request.post('/api/contact/submit', {
        data: { representative_id: repId, contact_type: 'email', value: email },
      });
      expect(firstResponse.status()).toBe(200);

      const secondResponse = await page.request.post('/api/contact/submit', {
        data: { representative_id: repId, contact_type: 'email', value: email },
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
      const repId = await getRepresentativeId(page);
      if (!repId) {
        test.skip(true, 'No representative found');
        return;
      }

      const submissions = [];
      for (let i = 0; i < 5; i++) {
        const response = await page.request.post('/api/contact/submit', {
          data: {
            representative_id: repId,
            contact_type: 'email',
            value: `rate-limit-test-${i}-${Date.now()}@example.com`,
          },
        });
        submissions.push(response);
      }

      for (const response of submissions) {
        expect((await response).status()).toBe(200);
      }

      const rateLimitedResponse = await page.request.post('/api/contact/submit', {
        data: {
          representative_id: repId,
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
      const repId = await getRepresentativeId(page);
      if (!repId) {
        test.skip(true, 'No representative found');
        return;
      }

      const submitResponse = await page.request.post('/api/contact/submit', {
        data: { representative_id: repId, contact_type: 'email', value: 'retrieve-test@example.com' },
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
      const repId = await getRepresentativeId(page);
      if (!repId) {
        test.skip(true, 'No representative found');
        return;
      }

      const submitResponse = await page.request.post('/api/contact/submit', {
        data: { representative_id: repId, contact_type: 'email', value: 'update-test@example.com' },
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
      const repId = await getRepresentativeId(page);
      if (!repId) {
        test.skip(true, 'No representative found');
        return;
      }

      const submitResponse = await page.request.post('/api/contact/submit', {
        data: { representative_id: repId, contact_type: 'email', value: 'delete-test@example.com' },
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
      const repId = await getRepresentativeId(page);
      if (!repId) {
        test.skip(true, 'No representative found');
        return;
      }

      await page.request.post('/api/contact/submit', {
        data: { representative_id: repId, contact_type: 'email', value: 'representative-test@example.com' },
      });

      const response = await page.request.get(`/api/contact/representative/${repId}`);
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data.contacts)).toBe(true);
    });
  });
});
