import { test, expect } from '@playwright/test';
import { T } from '@/lib/testing/testIds';

test.describe('Security Challenges', () => {
  test('should prevent XSS attacks in poll creation', async ({ page }) => {
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // Challenge: Try to inject malicious scripts
    const maliciousTitle = '<script>alert("XSS")</script>Malicious Poll';
    const maliciousDescription = '<img src="x" onerror="alert(\'XSS\')">';
    const maliciousOption = '<script>document.location="http://evil.com"</script>';
    
    // Use proper data-testid attributes
    await page.fill('[data-testid="poll-title-input"]', maliciousTitle);
    await page.fill('[data-testid="poll-description-input"]', maliciousDescription);
    
    // Fill option inputs using proper data-testid
    const optionInput = page.locator('[data-testid="option-input-0"]');
    if (await optionInput.isVisible()) {
      await optionInput.fill(maliciousOption);
    }
    
    // Use proper data-testid for submit button
    await page.click('[data-testid="create-poll-btn"]');
    
    // Challenge: Should sanitize input and not execute scripts
    const pageContent = await page.content();
    expect(pageContent).not.toContain('<script>');
    expect(pageContent).not.toContain('onerror=');
  });

  test('should handle SQL injection attempts', async ({ page }) => {
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // Challenge: Try SQL injection in form fields
    const sqlInjection = "'; DROP TABLE polls; --";
    const sqlInjection2 = "1' OR '1'='1";
    
    await page.fill('[data-testid="poll-title-input"]', sqlInjection);
    await page.fill('[data-testid="poll-description-input"]', sqlInjection2);
    await page.fill('[data-testid="option-input-0"]', "'; DELETE FROM users; --");
    
    await page.click('[data-testid="create-poll-btn"]');
    
    // Challenge: Should handle gracefully without breaking
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(polls\/create|polls\/\d+|error)/);
  });

  test('should prevent CSRF attacks', async ({ page }) => {
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // Challenge: Try to submit form without proper CSRF protection
    await page.fill('[data-testid="poll-title-input"]', 'CSRF Test Poll');
    await page.fill('[data-testid="poll-description-input"]', 'Testing CSRF protection');
    await page.fill('[data-testid="option-input-0"]', 'Option 1');
    
    // Challenge: Intercept and modify request to remove CSRF token
    await page.route('**/api/polls', route => {
      const request = route.request();
      const postData = request.postData();
      if (postData) {
        const modifiedData = JSON.parse(postData);
        delete modifiedData.csrfToken;
        route.continue({
          postData: JSON.stringify(modifiedData)
        });
      } else {
        route.continue();
      }
    });
    
    await page.click('[data-testid="create-poll-btn"]');
    
    // Challenge: Should reject request without proper CSRF token
    const hasError = await page.locator('[data-testid*="error"]').isVisible();
    expect(hasError).toBeTruthy();
  });

  test('should handle rate limiting', async ({ page }) => {
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // Challenge: Rapidly submit multiple polls
    const pollData = {
      title: 'Rate Limit Test',
      description: 'Testing rate limiting',
      options: ['Option 1', 'Option 2']
    };
    
    for (let i = 0; i < 10; i++) {
      await page.fill('[data-testid="poll-title-input"]', `${pollData.title} ${i}`);
      await page.fill('[data-testid="poll-description-input"]', pollData.description);
      await page.fill('[data-testid="option-input-0"]', pollData.options[0]);
      await page.fill('[data-testid="option-input-1"]', pollData.options[1]);
      
      await page.click('[data-testid="create-poll-btn"]');
      await page.waitForTimeout(100); // Small delay
    }
    
    // Challenge: Should eventually rate limit
    const hasRateLimit = await page.locator('text=rate limit').isVisible();
    const hasError = await page.locator('[data-testid*="error"]').isVisible();
    
    expect(hasRateLimit || hasError).toBeTruthy();
  });
});
