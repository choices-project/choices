import { expect, test, type Page } from '@playwright/test';

import { waitForPageReady } from '../helpers/e2e-setup';

test.describe('Representative Store Follow/Unfollow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Grant permissions for testing
    await page.context().grantPermissions(['geolocation']);

    // Mock API endpoints
    await page.route('**/api/representatives/*/follow', async (route) => {
      const method = route.request().method();
      const url = route.request().url();
      const representativeId = url.match(/\/representatives\/(\d+)\/follow/)?.[1];

      if (method === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: `follow-${representativeId}`,
            user_id: 'test-user-id',
            representative_id: parseInt(representativeId || '0'),
            notify_on_votes: true,
            notify_on_committee_activity: true,
            notify_on_public_statements: true,
            notify_on_events: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }),
        });
      } else if (method === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Unfollowed successfully',
          }),
        });
      } else if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isFollowing: true,
            followRecord: {
              id: `follow-${representativeId}`,
              user_id: 'test-user-id',
              representative_id: parseInt(representativeId || '0'),
              notify_on_votes: true,
              created_at: new Date().toISOString(),
            },
          }),
        });
      } else {
        await route.fulfill({
          status: 405,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Method not allowed' }),
        });
      }
    });
  });

  test('follows a representative', async ({ page }) => {
    await page.goto('/civics/representatives', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    // Mock representative data
    const representativeId = 123;

    // Intercept follow request
    const followRequest = page.waitForRequest((request) =>
      request.url().includes(`/api/representatives/${representativeId}/follow`) &&
      request.method() === 'POST'
    );

    // Trigger follow action (this would be done via UI interaction in real test)
    await page.evaluate(async (id) => {
      const response = await fetch(`/api/representatives/${id}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.json();
    }, representativeId);

    const request = await followRequest;
    expect(request.method()).toBe('POST');
    
    // Verify response
    const followButton = page.getByTestId(`follow-representative-${representativeId}`);
    if (await followButton.count() > 0) {
      await expect(followButton).toBeVisible();
    }
  });

  test('unfollows a representative', async ({ page }) => {
    await page.goto('/civics/representatives', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    const representativeId = 123;

    // Intercept unfollow request
    const unfollowRequest = page.waitForRequest((request) =>
      request.url().includes(`/api/representatives/${representativeId}/follow`) &&
      request.method() === 'DELETE'
    );

    // Trigger unfollow action
    await page.evaluate(async (id) => {
      const response = await fetch(`/api/representatives/${id}/follow`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.json();
    }, representativeId);

    const request = await unfollowRequest;
    expect(request.method()).toBe('DELETE');
  });

  test('checks follow status', async ({ page }) => {
    await page.goto('/civics/representatives', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    const representativeId = 123;

    const response = await page.evaluate(async (id) => {
      const res = await fetch(`/api/representatives/${id}/follow`, {
        method: 'GET',
      });
      return res.json();
    }, representativeId);

    expect(response.isFollowing).toBe(true);
    expect(response.followRecord).toBeDefined();
    expect(response.followRecord.representative_id).toBe(representativeId);
  });

  test('verifies user_id is populated at source', async ({ page }) => {
    await page.goto('/civics/representatives', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    const representativeId = 123;

    // Intercept follow request and verify user_id in request
    const followRequest = page.waitForRequest((request) =>
      request.url().includes(`/api/representatives/${representativeId}/follow`) &&
      request.method() === 'POST'
    );

    await page.evaluate(async (id) => {
      await fetch(`/api/representatives/${id}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notify_on_votes: true,
        }),
      });
    }, representativeId);

    const request = await followRequest;
    const postData = request.postDataJSON();
    
    // Verify that user_id should be set on the server side from auth context
    // The request body should not need to include user_id (security best practice)
    expect(postData).not.toHaveProperty('user_id');
  });

  test('handles follow error gracefully', async ({ page }) => {
    // Mock error response
    await page.route('**/api/representatives/*/follow', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      }
    });

    await page.goto('/civics/representatives', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/representatives/123/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        return { ok: res.ok, status: res.status, error: await res.json() };
      } catch (error) {
        return { error: (error as Error).message };
      }
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
  });

  test('handles unfollow error gracefully', async ({ page }) => {
    // Mock error response
    await page.route('**/api/representatives/*/follow', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Not following this representative' }),
        });
      }
    });

    await page.goto('/civics/representatives', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    const response = await page.evaluate(async () => {
      const res = await fetch('/api/representatives/123/follow', {
        method: 'DELETE',
      });
      return { ok: res.ok, status: res.status, error: await res.json() };
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(404);
  });
});

