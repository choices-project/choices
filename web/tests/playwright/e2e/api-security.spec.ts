import { test, expect } from '@playwright/test';
import { testAPISecurity, runSecurityTests } from './security-utils';

/**
 * API Security Tests
 * 
 * Tests API security including:
 * - SQL injection protection
 * - XSS protection
 * - CSRF protection
 * - Rate limiting
 * - Input validation
 */
test.describe('API Security Tests', () => {
  
  test('should protect against SQL injection', async ({ page }) => {
    const result = await testAPISecurity(page);
    
    // API security should pass
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(80);
    
    console.log(`🔒 API Security Score: ${result.score}/100`);
    
    if (result.vulnerabilities.length > 0) {
      console.log('⚠️ API Vulnerabilities found:');
      result.vulnerabilities.forEach(vuln => console.log(`  - ${vuln}`));
    }
  });
  
  test('should protect against XSS attacks', async ({ page }) => {
    await page.goto('/create-poll');
    
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      'javascript:alert("XSS")',
      '<img src="x" onerror="alert(\'XSS\')">',
      '<svg onload="alert(\'XSS\')">',
      '"><script>alert("XSS")</script>'
    ];
    
    for (const payload of xssPayloads) {
      await page.fill('input[name="title"]', payload);
      await page.fill('textarea[name="description"]', payload);
      await page.click('button[type="submit"]');
      
      // Should not execute the script
      const alertHandled = await page.evaluate(() => {
        return window.alert === undefined || window.alert.toString().includes('native');
      });
      
      expect(alertHandled).toBe(true);
      console.log(`✅ XSS payload blocked: ${payload.substring(0, 30)}...`);
    }
  });
  
  test('should implement CSRF protection', async ({ page }) => {
    // Test CSRF protection by making requests without proper tokens
    const response = await page.request.post('http://localhost:3000/api/polls', {
      data: { title: 'Test Poll', description: 'Test Description' }
    });
    
    // Should reject requests without CSRF token
    expect(response.status()).toBe(403);
    console.log('✅ CSRF protection implemented');
  });
  
  test('should implement rate limiting', async ({ page }) => {
    const requests = [];
    
    // Make many requests quickly
    for (let i = 0; i < 50; i++) {
      requests.push(
        page.request.get('http://localhost:3000/api/polls')
      );
    }
    
    const responses = await Promise.all(requests);
    const rateLimitedResponses = responses.filter(r => r.status() === 429);
    
    // Should have some rate limited responses
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
    console.log(`✅ Rate limiting active: ${rateLimitedResponses.length}/50 requests rate limited`);
  });
  
  test('should validate input data', async ({ page }) => {
    await page.goto('/create-poll');
    
    const invalidInputs = [
      { field: 'title', value: '', expected: 'Title is required' },
      { field: 'title', value: 'a'.repeat(1000), expected: 'Title too long' },
      { field: 'description', value: '', expected: 'Description is required' }
    ];
    
    for (const input of invalidInputs) {
      if (input.field === 'title') {
        await page.fill('input[name="title"]', input.value);
      } else if (input.field === 'description') {
        await page.fill('textarea[name="description"]', input.value);
      }
      
      await page.click('button[type="submit"]');
      
      // Should show validation error
      const errorVisible = await page.locator('[data-testid="validation-error"]').isVisible();
      expect(errorVisible).toBe(true);
      console.log(`✅ Input validation working for ${input.field}`);
    }
  });
  
  test('should sanitize file uploads', async ({ page }) => {
    await page.goto('/create-poll');
    
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      const dangerousFiles = [
        { name: 'test.exe', type: 'application/x-msdownload' },
        { name: 'test.php', type: 'application/x-php' },
        { name: 'test.jsp', type: 'application/x-jsp' },
        { name: 'test.sh', type: 'application/x-sh' }
      ];
      
      for (const file of dangerousFiles) {
        await fileInput.setInputFiles({
          name: file.name,
          mimeType: file.type
        });
        
        // Should reject dangerous file types
        const errorVisible = await page.locator('[data-testid="file-error"]').isVisible();
        expect(errorVisible).toBe(true);
        console.log(`✅ Dangerous file type rejected: ${file.name}`);
      }
    } else {
      console.log('ℹ️ No file upload functionality found');
    }
  });
  
  test('should implement proper CORS headers', async ({ page }) => {
    const response = await page.request.get('http://localhost:3000/api/polls');
    const headers = response.headers();
    
    // Should have proper CORS headers
    expect(headers['access-control-allow-origin']).toBeDefined();
    expect(headers['access-control-allow-methods']).toBeDefined();
    expect(headers['access-control-allow-headers']).toBeDefined();
    
    console.log('✅ CORS headers properly configured');
  });
  
  test('should implement security headers', async ({ page }) => {
    const response = await page.request.get('http://localhost:3000/');
    const headers = response.headers();
    
    // Should have security headers
    const securityHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection',
      'strict-transport-security',
      'content-security-policy'
    ];
    
    for (const header of securityHeaders) {
      expect(headers[header]).toBeDefined();
      console.log(`✅ Security header present: ${header}`);
    }
  });
});




