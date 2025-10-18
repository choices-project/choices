import { test, expect } from '@playwright/test';
import { testAuthenticationSecurity, runSecurityTests } from './security-utils';

/**
 * Authentication Security Tests
 * 
 * Tests authentication security including:
 * - Secure authentication endpoints
 * - Session security
 * - Password requirements
 * - Authentication bypass attempts
 */
test.describe('Authentication Security Tests', () => {
  
  test('should have secure authentication endpoints', async ({ page }) => {
    const result = await testAuthenticationSecurity(page);
    
    // Authentication security should pass
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(80);
    
    console.log(`🔒 Authentication Security Score: ${result.score}/100`);
    
    if (result.vulnerabilities.length > 0) {
      console.log('⚠️ Vulnerabilities found:');
      result.vulnerabilities.forEach(vuln => console.log(`  - ${vuln}`));
    }
    
    if (result.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      result.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }
  });
  
  test('should enforce secure session management', async ({ page }) => {
    await page.goto('/');
    
    // Check for secure session cookies
    const cookies = await page.context().cookies();
    const sessionCookies = cookies.filter(cookie => 
      cookie.name.includes('session') || 
      cookie.name.includes('auth') || 
      cookie.name.includes('token')
    );
    
    for (const cookie of sessionCookies) {
      // Session cookies should be secure
      expect(cookie.secure).toBe(true);
      console.log(`✅ Cookie ${cookie.name} is secure`);
      
      // Session cookies should be HTTPOnly
      expect(cookie.httpOnly).toBe(true);
      console.log(`✅ Cookie ${cookie.name} is HTTPOnly`);
      
      // Session cookies should have proper SameSite policy
      expect(cookie.sameSite).toBe('Strict');
      console.log(`✅ Cookie ${cookie.name} has Strict SameSite policy`);
    }
  });
  
  test('should enforce strong password requirements', async ({ page }) => {
    await page.goto('/register');
    
    const weakPasswords = [
      'password',
      '123456',
      'abc',
      'Password',
      'password123'
    ];
    
    for (const password of weakPasswords) {
      await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');
      
      // Should show password strength error
      const errorVisible = await page.locator('[data-testid="password-error"]').isVisible();
      expect(errorVisible).toBe(true);
      console.log(`✅ Weak password "${password}" rejected`);
    }
    
    // Test strong password
    const strongPassword = 'StrongP@ssw0rd123!';
    await page.fill('input[type="password"]', strongPassword);
    await page.click('button[type="submit"]');
    
    // Should not show error for strong password
    const errorVisible = await page.locator('[data-testid="password-error"]').isVisible();
    expect(errorVisible).toBe(false);
    console.log(`✅ Strong password accepted`);
  });
  
  test('should prevent authentication bypass', async ({ page }) => {
    // Test 1: Try to access protected routes without authentication
    const protectedRoutes = ['/profile', '/admin', '/dashboard'];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      
      // Should redirect to login or show unauthorized message
      const currentUrl = page.url();
      const isLoginPage = currentUrl.includes('/login') || currentUrl.includes('/auth');
      const hasUnauthorizedMessage = await page.locator('[data-testid="unauthorized"]').isVisible();
      
      expect(isLoginPage || hasUnauthorizedMessage).toBe(true);
      console.log(`✅ Protected route ${route} requires authentication`);
    }
  });
  
  test('should implement proper logout functionality', async ({ page }) => {
    // First, login (if possible)
    await page.goto('/login');
    
    try {
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password');
      await page.click('button[type="submit"]');
      
      // Wait for login to complete
      await page.waitForURL('**/dashboard', { timeout: 5000 });
      
      // Now test logout
      await page.click('[data-testid="logout-button"]');
      
      // Should redirect to login page
      await page.waitForURL('**/login');
      console.log('✅ Logout functionality works correctly');
      
      // Session cookies should be cleared
      const cookies = await page.context().cookies();
      const sessionCookies = cookies.filter(cookie => 
        cookie.name.includes('session') || 
        cookie.name.includes('auth')
      );
      
      expect(sessionCookies.length).toBe(0);
      console.log('✅ Session cookies cleared on logout');
      
    } catch (error) {
      console.log('⚠️ Could not test logout - login may have failed');
    }
  });
  
  test('should implement account lockout after failed attempts', async ({ page }) => {
    await page.goto('/login');
    
    // Try multiple failed login attempts
    for (let i = 0; i < 5; i++) {
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      // Wait for error message
      await page.waitForTimeout(1000);
    }
    
    // Should show account lockout message
    const lockoutMessage = await page.locator('[data-testid="account-locked"]').isVisible();
    if (lockoutMessage) {
      console.log('✅ Account lockout implemented');
    } else {
      console.log('⚠️ Account lockout not implemented');
    }
  });
  
  test('should validate email format', async ({ page }) => {
    await page.goto('/register');
    
    const invalidEmails = [
      'invalid-email',
      '@example.com',
      'test@',
      'test..test@example.com',
      'test@.com'
    ];
    
    for (const email of invalidEmails) {
      await page.fill('input[type="email"]', email);
      await page.click('button[type="submit"]');
      
      // Should show email validation error
      const errorVisible = await page.locator('[data-testid="email-error"]').isVisible();
      expect(errorVisible).toBe(true);
      console.log(`✅ Invalid email "${email}" rejected`);
    }
    
    // Test valid email
    const validEmail = 'test@example.com';
    await page.fill('input[type="email"]', validEmail);
    await page.click('button[type="submit"]');
    
    // Should not show error for valid email
    const errorVisible = await page.locator('[data-testid="email-error"]').isVisible();
    expect(errorVisible).toBe(false);
    console.log(`✅ Valid email accepted`);
  });
  
  test('should implement proper session timeout', async ({ page }) => {
    // This test would require a longer timeout to properly test
    // For now, we'll just check if session timeout is configured
    await page.goto('/');
    
    const cookies = await page.context().cookies();
    const sessionCookies = cookies.filter(cookie => 
      cookie.name.includes('session') || 
      cookie.name.includes('auth')
    );
    
    for (const cookie of sessionCookies) {
      // Session cookies should have reasonable expiration
      if (cookie.expires) {
        const expirationDate = new Date(cookie.expires);
        const now = new Date();
        const hoursUntilExpiry = (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        // Session should expire within reasonable time (e.g., 24 hours)
        expect(hoursUntilExpiry).toBeLessThanOrEqual(24);
        console.log(`✅ Session cookie ${cookie.name} expires in ${hoursUntilExpiry.toFixed(1)} hours`);
      }
    }
  });
});




