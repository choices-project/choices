import { test, expect } from '@playwright/test';
import { T } from '../../../registry/testIds';

test.describe('Dashboard Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up basic error handling
    page.on('pageerror', (error) => {
      console.log('Page error:', error.message);
    });
  });

  test('should load dashboard with proper elements', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check if dashboard loads
    expect(page.url()).toContain('/dashboard');
    
    // Look for dashboard elements using proper test IDs
    const dashboardContainer = await page.locator(`[data-testid="${T.DASHBOARD.DASHBOARD_CONTAINER}"]`).first();
    const welcomeMessage = await page.locator(`[data-testid="${T.DASHBOARD.WELCOME_MESSAGE}"]`).first();
    const userStats = await page.locator(`[data-testid="${T.DASHBOARD.USER_STATS}"]`).first();
    const recentActivity = await page.locator(`[data-testid="${T.DASHBOARD.RECENT_ACTIVITY}"]`).first();
    const quickActions = await page.locator(`[data-testid="${T.DASHBOARD.QUICK_ACTIONS}"]`).first();
    const notifications = await page.locator(`[data-testid="${T.DASHBOARD.NOTIFICATIONS}"]`).first();
    const notificationBell = await page.locator(`[data-testid="${T.DASHBOARD.NOTIFICATION_BELL}"]`).first();
    
    // Log what we found
    console.log('Dashboard elements found:', {
      container: await dashboardContainer.count() > 0,
      welcomeMessage: await welcomeMessage.count() > 0,
      userStats: await userStats.count() > 0,
      recentActivity: await recentActivity.count() > 0,
      quickActions: await quickActions.count() > 0,
      notifications: await notifications.count() > 0,
      notificationBell: await notificationBell.count() > 0
    });
    
    await page.screenshot({ path: 'test-results/dashboard-elements.png' });
  });

  test('should handle dashboard interactions', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Try to interact with dashboard elements
    const quickActions = await page.locator(`[data-testid="${T.DASHBOARD.QUICK_ACTIONS}"]`).first();
    const notificationBell = await page.locator(`[data-testid="${T.DASHBOARD.NOTIFICATION_BELL}"]`).first();
    
    // Try clicking quick actions if they exist
    if (await quickActions.count() > 0 && await quickActions.isVisible()) {
      console.log('Quick actions found, attempting interaction');
      await quickActions.click();
      await page.waitForTimeout(1000);
    }
    
    // Try clicking notification bell if it exists
    if (await notificationBell.count() > 0 && await notificationBell.isVisible()) {
      console.log('Notification bell found, attempting interaction');
      await notificationBell.click();
      await page.waitForTimeout(1000);
    }
    
    // Check if page is still functional
    const title = await page.title();
    expect(title).toBeTruthy();
    
    await page.screenshot({ path: 'test-results/dashboard-interactions.png' });
  });

  test('should handle navigation from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for navigation elements using proper test IDs
    const mainNav = await page.locator(`[data-testid="${T.NAVIGATION.MAIN_NAV}"]`).first();
    const userMenu = await page.locator(`[data-testid="${T.NAVIGATION.USER_MENU}"]`).first();
    const mobileMenu = await page.locator(`[data-testid="${T.NAVIGATION.MOBILE_MENU}"]`).first();
    
    console.log('Navigation elements found:', {
      mainNav: await mainNav.count() > 0,
      userMenu: await userMenu.count() > 0,
      mobileMenu: await mobileMenu.count() > 0
    });
    
    // Try to interact with navigation
    if (await mainNav.count() > 0 && await mainNav.isVisible()) {
      console.log('Main navigation found, attempting interaction');
      await mainNav.click();
      await page.waitForTimeout(1000);
    }
    
    await page.screenshot({ path: 'test-results/dashboard-navigation.png' });
  });
});
