/**
 * E2E Test Helpers
 * 
 * Comprehensive helpers for E2E testing
 * 
 * Created: October 26, 2025
 * Status: ACTIVE
 */

import { Page, expect } from '@playwright/test';

export class E2ETestHelpers {
  constructor(private page: Page) {}

  /**
   * Navigate to a page and wait for it to load
   */
  async navigateToPage(path: string, waitForSelector?: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
    
    if (waitForSelector) {
      await this.page.waitForSelector(waitForSelector, { state: 'visible' });
    }
  }

  /**
   * Login as a test user
   */
  async loginAsTestUser(email: string = 'test@example.com', password: string = 'testpassword') {
    await this.navigateToPage('/auth/login');
    
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
    
    await this.page.waitForURL('/dashboard');
  }

  /**
   * Login as admin user
   */
  async loginAsAdmin() {
    await this.loginAsTestUser('admin@example.com', 'adminpassword');
  }

  /**
   * Create a test poll
   */
  async createTestPoll(title: string, description: string) {
    await this.navigateToPage('/polls/create');
    
    await this.page.fill('[data-testid="poll-title"]', title);
    await this.page.fill('[data-testid="poll-description"]', description);
    await this.page.click('[data-testid="create-poll-button"]');
    
    await this.page.waitForURL(/\/polls\/[a-f0-9-]+/);
  }

  /**
   * Vote on a poll
   */
  async voteOnPoll(pollId: string, optionIndex: number) {
    await this.navigateToPage(`/polls/${pollId}`);
    
    await this.page.click(`[data-testid="poll-option-${optionIndex}"]`);
    await this.page.click('[data-testid="submit-vote-button"]');
    
    await this.page.waitForSelector('[data-testid="vote-success"]');
  }

  /**
   * Check if element is visible and accessible
   */
  async isElementAccessible(selector: string) {
    const element = this.page.locator(selector);
    const isVisible = await element.isVisible();
    const isEnabled = await element.isEnabled();
    
    return isVisible && isEnabled;
  }

  /**
   * Wait for API response
   */
  async waitForAPIResponse(url: string, timeout = 10000) {
    return await this.page.waitForResponse(
      response => response.url().includes(url) && response.status() === 200,
      { timeout }
    );
  }

  /**
   * Take screenshot for debugging
   */
  async takeDebugScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `test-results/debug/${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }
}

export default E2ETestHelpers;