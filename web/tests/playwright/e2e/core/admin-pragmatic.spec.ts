import { test, expect } from '@playwright/test';
import { T } from '../../../registry/testIds';

test.describe('Admin Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up basic error handling
    page.on('pageerror', (error) => {
      console.log('Page error:', error.message);
    });
  });

  test('should load admin dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check if admin dashboard loads
    expect(page.url()).toContain('/admin/dashboard');
    
    // Look for admin content using proper test IDs
    const adminDashboard = await page.locator(`[data-testid="${T.ADMIN.ADMIN_DASHBOARD}"]`).first();
    const adminSidebar = await page.locator(`[data-testid="${T.ADMIN.ADMIN_SIDEBAR}"]`).first();
    const adminContent = await page.locator(`[data-testid="${T.ADMIN.ADMIN_CONTENT}"]`).first();
    
    // Log what we found
    console.log('Admin dashboard elements found:', {
      dashboard: await adminDashboard.count() > 0,
      sidebar: await adminSidebar.count() > 0,
      content: await adminContent.count() > 0
    });
    
    await page.screenshot({ path: 'test-results/admin-dashboard.png' });
  });

  test('should load admin analytics page', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForLoadState('networkidle');
    
    // Check if admin analytics loads
    expect(page.url()).toContain('/admin/analytics');
    
    // Look for analytics elements using proper test IDs
    const analyticsTab = await page.locator(`[data-testid="${T.ADMIN.ANALYTICS_TAB}"]`).first();
    const analytics = await page.locator(`[data-testid="${T.ADMIN.ANALYTICS}"]`).first();
    
    console.log('Admin analytics elements found:', {
      analyticsTab: await analyticsTab.count() > 0,
      analytics: await analytics.count() > 0
    });
    
    await page.screenshot({ path: 'test-results/admin-analytics.png' });
  });

  test('should load admin users page', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    
    // Check if admin users loads
    expect(page.url()).toContain('/admin/users');
    
    // Look for user management elements using proper test IDs
    const userManagement = await page.locator(`[data-testid="${T.ADMIN.USER_MANAGEMENT}"]`).first();
    const userTable = await page.locator(`[data-testid="${T.ADMIN.USER_TABLE}"]`).first();
    const userList = await page.locator(`[data-testid="${T.ADMIN.USER_LIST}"]`).first();
    
    console.log('Admin users elements found:', {
      userManagement: await userManagement.count() > 0,
      userTable: await userTable.count() > 0,
      userList: await userList.count() > 0
    });
    
    await page.screenshot({ path: 'test-results/admin-users.png' });
  });

  test('should load admin feedback page', async ({ page }) => {
    await page.goto('/admin/feedback');
    await page.waitForLoadState('networkidle');
    
    // Check if admin feedback loads
    expect(page.url()).toContain('/admin/feedback');
    
    await page.screenshot({ path: 'test-results/admin-feedback.png' });
  });

  test('should load admin site messages page', async ({ page }) => {
    await page.goto('/admin/site-messages');
    await page.waitForLoadState('networkidle');
    
    // Check if admin site messages loads
    expect(page.url()).toContain('/admin/site-messages');
    
    await page.screenshot({ path: 'test-results/admin-site-messages.png' });
  });

  test('should load admin system page', async ({ page }) => {
    await page.goto('/admin/system');
    await page.waitForLoadState('networkidle');
    
    // Check if admin system loads
    expect(page.url()).toContain('/admin/system');
    
    await page.screenshot({ path: 'test-results/admin-system.png' });
  });

  test('should load admin performance page', async ({ page }) => {
    await page.goto('/admin/performance');
    await page.waitForLoadState('networkidle');
    
    // Check if admin performance loads
    expect(page.url()).toContain('/admin/performance');
    
    await page.screenshot({ path: 'test-results/admin-performance.png' });
  });

  test('should load admin feature flags page', async ({ page }) => {
    await page.goto('/admin/feature-flags');
    await page.waitForLoadState('networkidle');
    
    // Check if admin feature flags loads
    expect(page.url()).toContain('/admin/feature-flags');
    
    await page.screenshot({ path: 'test-results/admin-feature-flags.png' });
  });
});
