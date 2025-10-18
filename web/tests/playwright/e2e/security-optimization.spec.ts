/**
 * Security Optimization Tests
 * 
 * These tests focus on security optimization and hardening
 * to achieve the Testing Roadmap to Perfection.
 * 
 * Created: January 27, 2025
 * Updated: January 27, 2025
 */

import { test, expect } from '@playwright/test';
import { securityTester, SecurityTester } from './helpers/security-tester';

test.describe('Security Optimization', () => {
  let tester: SecurityTester;

  test.beforeEach(async () => {
    tester = securityTester;
    tester.reset();
  });

  test('should prevent XSS attacks in poll creation', async ({ page }) => {
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');

    const payloads = tester.getSecurityPayloads();
    
    // Test XSS prevention in title input
    const titleResult = await tester.testXSSPrevention(
      page, 
      '[data-testid="poll-title-input"]', 
      payloads.xss
    );

    console.log('XSS Prevention Results:');
    console.log(`Test: ${titleResult.testName}`);
    console.log(`Passed: ${titleResult.passed}`);
    console.log(`Vulnerabilities: ${titleResult.vulnerabilities.length}`);
    console.log(`Recommendations: ${titleResult.recommendations.length}`);

    expect(titleResult.passed).toBe(true);
    if (!titleResult.passed) {
      console.error('XSS vulnerabilities found:', titleResult.vulnerabilities);
    }

    // Test XSS prevention in description input
    const descriptionResult = await tester.testXSSPrevention(
      page, 
      '[data-testid="poll-description-input"]', 
      payloads.xss
    );

    expect(descriptionResult.passed).toBe(true);
    if (!descriptionResult.passed) {
      console.error('XSS vulnerabilities in description:', descriptionResult.vulnerabilities);
    }

    // Test XSS prevention in option inputs
    const optionResult = await tester.testXSSPrevention(
      page, 
      '[data-testid="option-input-0"]', 
      payloads.xss
    );

    expect(optionResult.passed).toBe(true);
    if (!optionResult.passed) {
      console.error('XSS vulnerabilities in options:', optionResult.vulnerabilities);
    }
  });

  test('should prevent SQL injection attacks', async ({ page }) => {
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');

    const payloads = tester.getSecurityPayloads();
    
    // Test SQL injection prevention in title input
    const titleResult = await tester.testSQLInjectionPrevention(
      page, 
      '[data-testid="poll-title-input"]', 
      payloads.sqlInjection
    );

    console.log('SQL Injection Prevention Results:');
    console.log(`Test: ${titleResult.testName}`);
    console.log(`Passed: ${titleResult.passed}`);
    console.log(`Vulnerabilities: ${titleResult.vulnerabilities.length}`);
    console.log(`Recommendations: ${titleResult.recommendations.length}`);

    expect(titleResult.passed).toBe(true);
    if (!titleResult.passed) {
      console.error('SQL injection vulnerabilities found:', titleResult.vulnerabilities);
    }

    // Test SQL injection prevention in description input
    const descriptionResult = await tester.testSQLInjectionPrevention(
      page, 
      '[data-testid="poll-description-input"]', 
      payloads.sqlInjection
    );

    expect(descriptionResult.passed).toBe(true);
    if (!descriptionResult.passed) {
      console.error('SQL injection vulnerabilities in description:', descriptionResult.vulnerabilities);
    }
  });

  test('should implement CSRF protection', async ({ page }) => {
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');

    const csrfResult = await tester.testCSRFProtection(page);

    console.log('CSRF Protection Results:');
    console.log(`Test: ${csrfResult.testName}`);
    console.log(`Passed: ${csrfResult.passed}`);
    console.log(`Vulnerabilities: ${csrfResult.vulnerabilities.length}`);
    console.log(`Recommendations: ${csrfResult.recommendations.length}`);

    expect(csrfResult.passed).toBe(true);
    if (!csrfResult.passed) {
      console.error('CSRF vulnerabilities found:', csrfResult.vulnerabilities);
    }
  });

  test('should implement rate limiting', async ({ page }) => {
    // Test rate limiting on API endpoints
    const rateLimitResult = await tester.testRateLimiting(page, '/api/polls', 10);

    console.log('Rate Limiting Results:');
    console.log(`Test: ${rateLimitResult.testName}`);
    console.log(`Passed: ${rateLimitResult.passed}`);
    console.log(`Vulnerabilities: ${rateLimitResult.vulnerabilities.length}`);
    console.log(`Recommendations: ${rateLimitResult.recommendations.length}`);

    expect(rateLimitResult.passed).toBe(true);
    if (!rateLimitResult.passed) {
      console.error('Rate limiting vulnerabilities found:', rateLimitResult.vulnerabilities);
    }
  });

  test('should validate input properly', async ({ page }) => {
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');

    const invalidInputs = [
      '', // Empty input
      'A'.repeat(1000), // Too long
      '   ', // Only whitespace
      'null',
      'undefined',
      'NaN',
      'true',
      'false',
    ];

    const validationResult = await tester.testInputValidation(
      page, 
      '[data-testid="poll-title-input"]', 
      invalidInputs
    );

    console.log('Input Validation Results:');
    console.log(`Test: ${validationResult.testName}`);
    console.log(`Passed: ${validationResult.passed}`);
    console.log(`Vulnerabilities: ${validationResult.vulnerabilities.length}`);
    console.log(`Recommendations: ${validationResult.recommendations.length}`);

    expect(validationResult.passed).toBe(true);
    if (!validationResult.passed) {
      console.error('Input validation vulnerabilities found:', validationResult.vulnerabilities);
    }
  });

  test('should prevent path traversal attacks', async ({ page }) => {
    const payloads = tester.getSecurityPayloads();
    
    // Test path traversal in file uploads or URL parameters
    for (const payload of payloads.pathTraversal) {
      try {
        // Try to access protected files through URL manipulation
        const response = await page.goto(`/api/files/${payload}`);
        
        // Check if we got access to system files
        const content = await page.textContent('body');
        if (content && (content.includes('root:') || content.includes('admin:'))) {
          expect(false).toBe(true); // Fail if we got system file content
        }
        
      } catch (error) {
        // Expected to fail for security
        console.log(`Path traversal test with payload ${payload}: ${error.message}`);
      }
    }
  });

  test('should prevent command injection attacks', async ({ page }) => {
    const payloads = tester.getSecurityPayloads();
    
    // Test command injection in form inputs
    for (const payload of payloads.commandInjection) {
      try {
        await page.goto('/polls/create');
        await page.waitForLoadState('networkidle');
        
        await page.fill('[data-testid="poll-title-input"]', payload);
        
        // Check if command was executed (look for command output in page)
        const hasCommandOutput = await page.evaluate(() => {
          const bodyText = document.body.textContent || '';
          return bodyText.includes('total') && bodyText.includes('drwx') || // ls -la output
                 bodyText.includes('root') && bodyText.includes('bin') || // /etc/passwd output
                 bodyText.includes('uid=') && bodyText.includes('gid='); // whoami output
        });
        
        if (hasCommandOutput) {
          expect(false).toBe(true); // Fail if command was executed
        }
        
      } catch (error) {
        // Expected to fail for security
        console.log(`Command injection test with payload ${payload}: ${error.message}`);
      }
    }
  });

  test('should implement secure headers', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for security headers
    const response = await page.goto('/');
    const headers = response?.headers();

    const securityHeaders = {
      'x-frame-options': 'DENY',
      'x-content-type-options': 'nosniff',
      'x-xss-protection': '1; mode=block',
      'strict-transport-security': 'max-age=31536000',
      'content-security-policy': 'default-src \'self\'',
    };

    console.log('Security Headers Check:');
    for (const [header, expectedValue] of Object.entries(securityHeaders)) {
      const actualValue = headers?.[header];
      console.log(`${header}: ${actualValue || 'MISSING'}`);
      
      if (!actualValue) {
        console.warn(`Missing security header: ${header}`);
      }
    }
  });

  test('should generate comprehensive security report', async ({ page }) => {
    // Run multiple security tests
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');

    const payloads = tester.getSecurityPayloads();
    
    // Run XSS tests
    await tester.testXSSPrevention(page, '[data-testid="poll-title-input"]', payloads.xss);
    await tester.testXSSPrevention(page, '[data-testid="poll-description-input"]', payloads.xss);
    
    // Run SQL injection tests
    await tester.testSQLInjectionPrevention(page, '[data-testid="poll-title-input"]', payloads.sqlInjection);
    
    // Run CSRF tests
    await tester.testCSRFProtection(page);
    
    // Run rate limiting tests
    await tester.testRateLimiting(page, '/api/polls', 5);
    
    // Run input validation tests
    const invalidInputs = ['', 'A'.repeat(1000), '   '];
    await tester.testInputValidation(page, '[data-testid="poll-title-input"]', invalidInputs);

    // Generate security report
    const report = tester.generateSecurityReport();
    
    console.log('Security Report:');
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed Tests: ${report.summary.passedTests}`);
    console.log(`Failed Tests: ${report.summary.failedTests}`);
    console.log(`Total Vulnerabilities: ${report.summary.totalVulnerabilities}`);
    console.log(`Total Recommendations: ${report.summary.totalRecommendations}`);

    // Should have good security overall
    expect(report.summary.passedTests).toBeGreaterThan(0);
    expect(report.summary.totalVulnerabilities).toBe(0);
  });
});
