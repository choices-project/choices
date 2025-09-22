/**
 * PWA Offline Functionality E2E Tests
 * 
 * Tests PWA offline capabilities including:
 * - Offline detection
 * - Offline voting
 * - Data synchronization
 * - Offline indicators
 * - Background sync
 */

import { test, expect, type Page } from '@playwright/test';

test.describe('PWA Offline Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    
    // Navigate to dashboard to trigger PWA initialization
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should detect offline status', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);
    
    // Wait for offline indicator to appear
    await page.waitForSelector('[data-testid="offline-indicator"]', { timeout: 5000 });
    
    // Check if offline indicator is visible
    const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
    await expect(offlineIndicator).toBeVisible();
    
    // Check offline message
    await expect(offlineIndicator).toContainText('You\'re offline');
  });

  test('should detect online status', async ({ page }) => {
    // Go offline first
    await page.context().setOffline(true);
    await page.waitForSelector('[data-testid="offline-indicator"]');
    
    // Go back online
    await page.context().setOffline(false);
    
    // Wait for offline indicator to disappear
    await page.waitForSelector('[data-testid="offline-indicator"]', { state: 'hidden', timeout: 5000 });
  });

  test('should show offline page when navigating offline', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);
    
    // Try to navigate to a new page
    await page.goto('/dashboard');
    
    // Should show offline page or cached content
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Check if offline functionality is available
    const offlineMessage = page.locator('text=offline', { hasText: /offline/i });
    await expect(offlineMessage).toBeVisible();
  });

  test('should store offline votes', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);
    
    // Navigate to a poll page (mock)
    await page.goto('/poll/test-poll');
    
    // Simulate voting offline
    await page.evaluate(() => {
      // Mock offline vote storage
      const offlineVote = {
        id: 'test-vote-1',
        pollId: 'test-poll',
        optionIds: ['option-1'],
        timestamp: new Date().toISOString(),
        status: 'pending'
      };
      
      const offlineVotes = JSON.parse(localStorage.getItem('choices_offline_outbox') || '[]');
      offlineVotes.push(offlineVote);
      localStorage.setItem('choices_offline_outbox', JSON.stringify(offlineVotes));
      
      // Trigger offline vote event
      window.dispatchEvent(new CustomEvent('offlineVotesSynced', {
        detail: { syncedCount: 0, pendingCount: 1 }
      }));
    });

    // Check if offline vote indicator appears
    await page.waitForSelector('[data-testid="offline-votes-indicator"]', { timeout: 5000 });
    
    const offlineVotesIndicator = page.locator('[data-testid="offline-votes-indicator"]');
    await expect(offlineVotesIndicator).toBeVisible();
    await expect(offlineVotesIndicator).toContainText('1 vote');
  });

  test('should sync offline votes when back online', async ({ page }) => {
    // Go offline and create offline vote
    await page.context().setOffline(true);
    
    await page.evaluate(() => {
      const offlineVote = {
        id: 'test-vote-2',
        pollId: 'test-poll',
        optionIds: ['option-2'],
        timestamp: new Date().toISOString(),
        status: 'pending'
      };
      
      const offlineVotes = JSON.parse(localStorage.getItem('choices_offline_outbox') || '[]');
      offlineVotes.push(offlineVote);
      localStorage.setItem('choices_offline_outbox', JSON.stringify(offlineVotes));
    });

    // Go back online
    await page.context().setOffline(false);
    
    // Mock successful sync
    await page.evaluate(() => {
      // Clear offline votes (simulate successful sync)
      localStorage.removeItem('choices_offline_outbox');
      
      // Trigger sync success event
      window.dispatchEvent(new CustomEvent('offlineVotesSynced', {
        detail: { syncedCount: 1, pendingCount: 0 }
      }));
    });

    // Check if sync success message appears
    await page.waitForSelector('[data-testid="sync-success-message"]', { timeout: 5000 });
    
    const syncMessage = page.locator('[data-testid="sync-success-message"]');
    await expect(syncMessage).toBeVisible();
    await expect(syncMessage).toContainText('synced');
  });

  test('should handle sync errors gracefully', async ({ page }) => {
    // Go offline and create offline vote
    await page.context().setOffline(true);
    
    await page.evaluate(() => {
      const offlineVote = {
        id: 'test-vote-3',
        pollId: 'test-poll',
        optionIds: ['option-3'],
        timestamp: new Date().toISOString(),
        status: 'pending'
      };
      
      const offlineVotes = JSON.parse(localStorage.getItem('choices_offline_outbox') || '[]');
      offlineVotes.push(offlineVote);
      localStorage.setItem('choices_offline_outbox', JSON.stringify(offlineVotes));
    });

    // Go back online
    await page.context().setOffline(false);
    
    // Mock sync error
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('offlineVotesSynced', {
        detail: { 
          syncedCount: 0, 
          pendingCount: 1,
          errors: ['Sync failed: Network error']
        }
      }));
    });

    // Check if error message appears
    await page.waitForSelector('[data-testid="sync-error-message"]', { timeout: 5000 });
    
    const errorMessage = page.locator('[data-testid="sync-error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('failed');
  });

  test('should show offline data status in dashboard', async ({ page }) => {
    // Create offline data
    await page.evaluate(() => {
      const offlineVotes = [
        {
          id: 'test-vote-4',
          pollId: 'test-poll',
          optionIds: ['option-4'],
          timestamp: new Date().toISOString(),
          status: 'pending'
        }
      ];
      localStorage.setItem('choices_offline_outbox', JSON.stringify(offlineVotes));
    });

    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check if PWA status shows offline data
    const pwaStatus = page.locator('[data-testid="pwa-status"]');
    await expect(pwaStatus).toBeVisible();
    
    const offlineDataStatus = page.locator('[data-testid="offline-data-status"]');
    await expect(offlineDataStatus).toBeVisible();
    await expect(offlineDataStatus).toContainText('1 vote');
  });

  test('should allow manual sync of offline data', async ({ page }) => {
    // Create offline data
    await page.evaluate(() => {
      const offlineVotes = [
        {
          id: 'test-vote-5',
          pollId: 'test-poll',
          optionIds: ['option-5'],
          timestamp: new Date().toISOString(),
          status: 'pending'
        }
      ];
      localStorage.setItem('choices_offline_outbox', JSON.stringify(offlineVotes));
    });

    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Click sync button
    const syncButton = page.locator('[data-testid="sync-offline-data-button"]');
    await expect(syncButton).toBeVisible();
    await syncButton.click();

    // Mock successful sync
    await page.evaluate(() => {
      localStorage.removeItem('choices_offline_outbox');
      window.dispatchEvent(new CustomEvent('offlineVotesSynced', {
        detail: { syncedCount: 1, pendingCount: 0 }
      }));
    });

    // Check if sync success message appears
    await page.waitForSelector('[data-testid="sync-success-message"]', { timeout: 5000 });
  });

  test('should cache essential resources for offline use', async ({ page }) => {
    // Wait for service worker to cache resources
    await page.waitForTimeout(2000);
    
    // Go offline
    await page.context().setOffline(true);
    
    // Try to access cached resources
    const response = await page.goto('/');
    
    // Should still load (from cache)
    expect(response?.status()).toBe(200);
    
    // Check if essential elements are visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle offline navigation gracefully', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);
    
    // Try to navigate to different pages
    const pages = ['/dashboard', '/polls', '/profile'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      
      // Should not crash and should show some content
      await expect(page.locator('body')).toBeVisible();
      
      // Should show offline indicator
      const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
      await expect(offlineIndicator).toBeVisible();
    }
  });
});
