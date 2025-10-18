import { test, expect } from '@playwright/test';
import { runSecurityTests, generateSecurityReport } from './security-utils';

/**
 * Comprehensive Security Test Suite
 * 
 * Runs all security tests and generates a comprehensive report
 */
test.describe('Comprehensive Security Tests', () => {
  
  test('should pass all security tests', async ({ page }) => {
    console.log('🔒 Starting comprehensive security testing...');
    
    const metrics = await runSecurityTests(page);
    
    // Generate and log security report
    const report = generateSecurityReport(metrics);
    console.log(report);
    
    // Overall security should be acceptable
    expect(metrics.overall.score).toBeGreaterThanOrEqual(70);
    
    // Log individual scores
    console.log(`\n📊 Security Scores:`);
    console.log(`  Authentication: ${metrics.authentication.score}/100`);
    console.log(`  Authorization: ${metrics.authorization.score}/100`);
    console.log(`  Data Privacy: ${metrics.dataPrivacy.score}/100`);
    console.log(`  API Security: ${metrics.apiSecurity.score}/100`);
    console.log(`  Input Validation: ${metrics.inputValidation.score}/100`);
    console.log(`  Overall: ${metrics.overall.score}/100`);
    
    // Check for critical vulnerabilities
    const criticalVulnerabilities = metrics.overall.vulnerabilities.filter(vuln => 
      vuln.toLowerCase().includes('sql injection') ||
      vuln.toLowerCase().includes('xss') ||
      vuln.toLowerCase().includes('csrf') ||
      vuln.toLowerCase().includes('authentication bypass')
    );
    
    if (criticalVulnerabilities.length > 0) {
      console.log('\n🚨 CRITICAL VULNERABILITIES DETECTED:');
      criticalVulnerabilities.forEach(vuln => console.log(`  - ${vuln}`));
    }
    
    // Security status
    if (metrics.overall.passed) {
      console.log('\n🟢 SECURITY STATUS: PASSED');
    } else {
      console.log('\n🔴 SECURITY STATUS: FAILED');
      console.log(`Found ${metrics.overall.vulnerabilities.length} vulnerabilities`);
    }
  });
  
  test('should meet minimum security standards', async ({ page }) => {
    const metrics = await runSecurityTests(page);
    
    // Minimum security standards
    const minScores = {
      authentication: 80,
      authorization: 80,
      dataPrivacy: 70,
      apiSecurity: 85,
      inputValidation: 80
    };
    
    // Check each security area meets minimum standards
    expect(metrics.authentication.score).toBeGreaterThanOrEqual(minScores.authentication);
    expect(metrics.authorization.score).toBeGreaterThanOrEqual(minScores.authorization);
    expect(metrics.dataPrivacy.score).toBeGreaterThanOrEqual(minScores.dataPrivacy);
    expect(metrics.apiSecurity.score).toBeGreaterThanOrEqual(minScores.apiSecurity);
    expect(metrics.inputValidation.score).toBeGreaterThanOrEqual(minScores.inputValidation);
    
    console.log('✅ All security areas meet minimum standards');
  });
  
  test('should have no critical security vulnerabilities', async ({ page }) => {
    const metrics = await runSecurityTests(page);
    
    // Check for critical vulnerabilities
    const criticalVulnerabilities = metrics.overall.vulnerabilities.filter(vuln => 
      vuln.toLowerCase().includes('sql injection') ||
      vuln.toLowerCase().includes('xss') ||
      vuln.toLowerCase().includes('csrf') ||
      vuln.toLowerCase().includes('authentication bypass') ||
      vuln.toLowerCase().includes('privilege escalation')
    );
    
    expect(criticalVulnerabilities.length).toBe(0);
    
    if (criticalVulnerabilities.length === 0) {
      console.log('✅ No critical security vulnerabilities found');
    } else {
      console.log('🚨 Critical vulnerabilities found:');
      criticalVulnerabilities.forEach(vuln => console.log(`  - ${vuln}`));
    }
  });
  
  test('should implement proper security headers', async ({ page }) => {
    await page.goto('/');
    
    const response = await page.request.get('http://localhost:3000/');
    const headers = response.headers();
    
    // Required security headers
    const requiredHeaders = {
      'x-frame-options': 'SAMEORIGIN',
      'x-content-type-options': 'nosniff',
      'x-xss-protection': '1; mode=block',
      'strict-transport-security': 'max-age=31536000; includeSubDomains',
      'content-security-policy': 'default-src \'self\''
    };
    
    for (const [header, expectedValue] of Object.entries(requiredHeaders)) {
      const actualValue = headers[header];
      expect(actualValue).toBeDefined();
      
      if (expectedValue) {
        expect(actualValue).toContain(expectedValue);
      }
      
      console.log(`✅ Security header ${header}: ${actualValue}`);
    }
  });
  
  test('should implement proper authentication flow', async ({ page }) => {
    // Test login flow
    await page.goto('/login');
    
    // Check for proper form security
    const form = page.locator('form');
    expect(await form.count()).toBeGreaterThan(0);
    
    // Check for CSRF token
    const csrfToken = await page.locator('input[name="_token"]').isVisible();
    if (csrfToken) {
      console.log('✅ CSRF token present in login form');
    }
    
    // Test password field security
    const passwordField = page.locator('input[type="password"]');
    expect(await passwordField.count()).toBeGreaterThan(0);
    
    // Password field should have autocomplete="off"
    const autocomplete = await passwordField.getAttribute('autocomplete');
    expect(autocomplete).toBe('off');
    console.log('✅ Password field has autocomplete="off"');
  });
  
  test('should implement proper session management', async ({ page }) => {
    await page.goto('/');
    
    const cookies = await page.context().cookies();
    const sessionCookies = cookies.filter(cookie => 
      cookie.name.includes('session') || 
      cookie.name.includes('auth') || 
      cookie.name.includes('token')
    );
    
    for (const cookie of sessionCookies) {
      // Session cookies should be secure
      expect(cookie.secure).toBe(true);
      
      // Session cookies should be HTTPOnly
      expect(cookie.httpOnly).toBe(true);
      
      // Session cookies should have proper SameSite policy
      expect(cookie.sameSite).toBe('Strict');
      
      console.log(`✅ Session cookie ${cookie.name} properly configured`);
    }
  });
});




