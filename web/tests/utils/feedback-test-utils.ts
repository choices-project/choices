import { Page } from '@playwright/test';

export class FeedbackTestUtils {
  constructor(private page: Page) {}

  /**
   * Open the feedback widget
   */
  async openFeedbackWidget(): Promise<void> {
    const feedbackButton = this.page.locator('button:has-text("Feedback")').or(
      this.page.locator('button[aria-label*="feedback" i]')
    ).or(
      this.page.locator('button:has(svg)').filter({ hasText: /message|feedback/i })
    );
    
    if (await feedbackButton.count() > 0) {
      await feedbackButton.first().click();
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Select feedback type
   */
  async selectFeedbackType(type: 'bug' | 'feature' | 'general' | 'performance' | 'accessibility' | 'security'): Promise<void> {
    const typeButton = this.page.locator(`button:has-text("${type}")`).or(
      this.page.locator(`button:has-text("${type} Report")`)
    );
    
    if (await typeButton.count() > 0) {
      await typeButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Fill feedback details
   */
  async fillFeedbackDetails(title: string, description: string): Promise<void> {
    const titleInput = this.page.locator('input[placeholder*="title" i]');
    const descriptionInput = this.page.locator('textarea[placeholder*="description" i]');
    
    if (await titleInput.count() > 0) {
      await titleInput.fill(title);
    }
    
    if (await descriptionInput.count() > 0) {
      await descriptionInput.fill(description);
    }
  }

  /**
   * Select feedback sentiment
   */
  async selectSentiment(sentiment: 'positive' | 'negative' | 'neutral' | 'mixed'): Promise<void> {
    const sentimentButton = this.page.locator(`button:has-text("${sentiment}")`);
    
    if (await sentimentButton.count() > 0) {
      await sentimentButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Submit feedback
   */
  async submitFeedback(): Promise<void> {
    const submitButton = this.page.locator('button:has-text("Submit")').or(
      this.page.locator('button:has-text("Submit Feedback")')
    );
    
    if (await submitButton.count() > 0) {
      await submitButton.click();
      await this.page.waitForTimeout(2000);
    }
  }

  /**
   * Complete feedback submission flow
   */
  async completeFeedbackSubmission(
    type: 'bug' | 'feature' | 'general' | 'performance' | 'accessibility' | 'security',
    title: string,
    description: string,
    sentiment: 'positive' | 'negative' | 'neutral' | 'mixed' = 'neutral'
  ): Promise<void> {
    await this.openFeedbackWidget();
    await this.selectFeedbackType(type);
    await this.fillFeedbackDetails(title, description);
    await this.selectSentiment(sentiment);
    await this.submitFeedback();
  }

  /**
   * Check if feedback widget is visible
   */
  async isFeedbackWidgetVisible(): Promise<boolean> {
    const feedbackButton = this.page.locator('button:has-text("Feedback")').or(
      this.page.locator('button[aria-label*="feedback" i]')
    );
    
    return await feedbackButton.count() > 0;
  }

  /**
   * Check if feedback was submitted successfully
   */
  async isFeedbackSubmitted(): Promise<boolean> {
    const successMessage = this.page.locator('text=Thank You').or(
      this.page.locator('text=successfully')
    );
    
    return await successMessage.count() > 0;
  }

  /**
   * Navigate to admin feedback page
   */
  async navigateToAdminFeedback(): Promise<void> {
    await this.page.goto('/admin/feedback');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check if feedback list is displayed
   */
  async isFeedbackListVisible(): Promise<boolean> {
    const feedbackList = this.page.locator('[data-testid="feedback-list"]');
    return await feedbackList.count() > 0;
  }

  /**
   * Get feedback count from admin page
   */
  async getFeedbackCount(): Promise<number> {
    const feedbackItems = this.page.locator('[data-testid="feedback-item"]');
    return await feedbackItems.count();
  }

  /**
   * Test feedback widget accessibility
   */
  async testAccessibility(): Promise<{ hasAriaLabel: boolean; isKeyboardAccessible: boolean }> {
    const feedbackButton = this.page.locator('button:has-text("Feedback")').or(
      this.page.locator('button[aria-label*="feedback" i]')
    );
    
    const hasAriaLabel = await feedbackButton.count() > 0 && 
      (await feedbackButton.getAttribute('aria-label')) !== null;
    
    let isKeyboardAccessible = false;
    if (await feedbackButton.count() > 0) {
      await feedbackButton.focus();
      isKeyboardAccessible = await feedbackButton.evaluate(el => el === document.activeElement);
    }
    
    return { hasAriaLabel, isKeyboardAccessible };
  }

  /**
   * Navigate to admin site messages page
   */
  async navigateToAdminSiteMessages(): Promise<void> {
    await this.page.goto('/admin/site-messages');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check if admin site messages interface is displayed
   */
  async isAdminSiteMessagesVisible(): Promise<boolean> {
    const adminHeader = this.page.locator('h2:has-text("Site Messages")');
    const newMessageButton = this.page.locator('button:has-text("New Message")');
    
    return (await adminHeader.count() > 0) && (await newMessageButton.count() > 0);
  }

  /**
   * Create a new site message
   */
  async createSiteMessage(
    title: string,
    message: string,
    type: 'info' | 'warning' | 'success' | 'error' | 'feedback' = 'info',
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    isActive: boolean = true
  ): Promise<void> {
    // Click new message button
    const newMessageButton = this.page.locator('button:has-text("New Message")');
    await newMessageButton.click();
    await this.page.waitForTimeout(500);

    // Fill form
    const titleInput = this.page.locator('input[placeholder*="title" i]');
    const messageInput = this.page.locator('textarea[placeholder*="content" i]');
    const typeSelect = this.page.locator('select').first();
    const prioritySelect = this.page.locator('select').nth(1);
    const activeCheckbox = this.page.locator('input[type="checkbox"]');
    
    if (await titleInput.count() > 0) {
      await titleInput.fill(title);
    }
    
    if (await messageInput.count() > 0) {
      await messageInput.fill(message);
    }
    
    if (await typeSelect.count() > 0) {
      await typeSelect.selectOption(type);
    }
    
    if (await prioritySelect.count() > 0) {
      await prioritySelect.selectOption(priority);
    }
    
    if (await activeCheckbox.count() > 0) {
      const isChecked = await activeCheckbox.isChecked();
      if (isChecked !== isActive) {
        await activeCheckbox.click();
      }
    }

    // Submit form
    const createButton = this.page.locator('button:has-text("Create Message")');
    if (await createButton.count() > 0) {
      await createButton.click();
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Get site messages count
   */
  async getSiteMessagesCount(): Promise<number> {
    const messageItems = this.page.locator('[data-testid="site-message-item"]').or(
      this.page.locator('div:has-text("Site Messages")').locator('..').locator('div').filter({ hasText: /test|message|welcome/i })
    );
    return await messageItems.count();
  }

  /**
   * Edit a site message
   */
  async editSiteMessage(messageIndex: number = 0): Promise<void> {
    const editButton = this.page.locator('button[title*="Edit" i]').nth(messageIndex);
    if (await editButton.count() > 0) {
      await editButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Toggle site message active status
   */
  async toggleSiteMessageActive(messageIndex: number = 0): Promise<void> {
    const toggleButton = this.page.locator('button[title*="Activate" i], button[title*="Deactivate" i]').nth(messageIndex);
    if (await toggleButton.count() > 0) {
      await toggleButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Delete a site message
   */
  async deleteSiteMessage(messageIndex: number = 0): Promise<void> {
    const deleteButton = this.page.locator('button[title*="Delete" i]').nth(messageIndex);
    if (await deleteButton.count() > 0) {
      await deleteButton.click();
      await this.page.waitForTimeout(500);
      
      // Confirm deletion if dialog appears
      const confirmButton = this.page.locator('button:has-text("Delete")').or(
        this.page.locator('button:has-text("Confirm")')
      );
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
        await this.page.waitForTimeout(500);
      }
    }
  }

  /**
   * Filter site messages by type
   */
  async filterByType(type: 'info' | 'warning' | 'success' | 'error' | 'feedback'): Promise<void> {
    const typeFilter = this.page.locator('select').first();
    if (await typeFilter.count() > 0) {
      await typeFilter.selectOption(type);
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Filter site messages by priority
   */
  async filterByPriority(priority: 'low' | 'medium' | 'high' | 'critical'): Promise<void> {
    const priorityFilter = this.page.locator('select').nth(1);
    if (await priorityFilter.count() > 0) {
      await priorityFilter.selectOption(priority);
      await this.page.waitForTimeout(500);
    }
  }
}
