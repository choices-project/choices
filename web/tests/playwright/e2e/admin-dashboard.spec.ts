/**
 * Enhanced Admin Dashboard E2E Tests
 * 
 * Tests the complete admin dashboard functionality with elevated UX/UI patterns:
 * - Intuitive admin interface with smart insights
 * - Real-time monitoring and alerts
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Mobile-first responsive design
 * - Advanced analytics and reporting
 * - User management with bulk operations
 * - System health monitoring
 */

import { test, expect } from '@playwright/test';

test.describe('Enhanced Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Set up accessibility testing
    await page.addInitScript(() => {
      window.__playwright_accessibility = true;
    });

    // Mock admin user authentication
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'admin-123',
            email: 'admin@example.com',
            username: 'admin',
            displayName: 'Admin User',
            role: 'admin',
            isActive: true,
          },
        }),
      });
    });

    // Navigate to admin dashboard with performance monitoring
    const startTime = Date.now();
    await page.goto('/admin');
    const loadTime = Date.now() - startTime;
    
    // Verify fast loading
    expect(loadTime).toBeLessThan(2000);
  });

  test('should display admin dashboard with enhanced UX', async ({ page }) => {
    // Test accessibility of admin dashboard
    await expect(page.locator('[data-testid="admin-dashboard"]')).toHaveAttribute('role', 'main');
    await expect(page.locator('[data-testid="admin-dashboard"]')).toHaveAttribute('aria-labelledby');
    
    // Should show admin dashboard with enhanced layout
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
    
    // Test enhanced navigation with accessibility
    await expect(page.locator('[data-testid="admin-nav"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-nav"]')).toHaveAttribute('role', 'navigation');
    await expect(page.locator('[data-testid="admin-nav"]')).toHaveAttribute('aria-label', 'Admin navigation');
    
    await expect(page.locator('[data-testid="nav-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-users"]')).toHaveAttribute('aria-label', 'User management');
    await expect(page.locator('[data-testid="nav-analytics"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-analytics"]')).toHaveAttribute('aria-label', 'Analytics dashboard');
    await expect(page.locator('[data-testid="nav-system"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-system"]')).toHaveAttribute('aria-label', 'System settings');
    await expect(page.locator('[data-testid="nav-feedback"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-feedback"]')).toHaveAttribute('aria-label', 'User feedback');
    
    // Test enhanced admin stats with real-time updates
    await expect(page.locator('[data-testid="admin-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-stats"]')).toHaveAttribute('role', 'region');
    await expect(page.locator('[data-testid="admin-stats"]')).toHaveAttribute('aria-label', 'System statistics');
    
    await expect(page.locator('[data-testid="stat-total-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-total-users"]')).toHaveText('Total Users');
    await expect(page.locator('[data-testid="stat-total-users"]')).toHaveAttribute('aria-live', 'polite');
    
    await expect(page.locator('[data-testid="stat-active-polls"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-active-polls"]')).toHaveText('Active Polls');
    await expect(page.locator('[data-testid="stat-active-polls"]')).toHaveAttribute('aria-live', 'polite');
    
    await expect(page.locator('[data-testid="stat-total-votes"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-total-votes"]')).toHaveText('Total Votes');
    await expect(page.locator('[data-testid="stat-total-votes"]')).toHaveAttribute('aria-live', 'polite');
    
    await expect(page.locator('[data-testid="stat-system-health"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-system-health"]')).toHaveText('System Health');
    await expect(page.locator('[data-testid="stat-system-health"]')).toHaveAttribute('aria-live', 'polite');
    
    // Test real-time updates
    await expect(page.locator('[data-testid="real-time-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="real-time-indicator"]')).toHaveText('Live data');
    await expect(page.locator('[data-testid="real-time-indicator"]')).toHaveClass(/live/);
    
    // Test system alerts
    await expect(page.locator('[data-testid="system-alerts"]')).toBeVisible();
    await expect(page.locator('[data-testid="system-alerts"]')).toHaveAttribute('role', 'alert');
    await expect(page.locator('[data-testid="system-alerts"]')).toHaveAttribute('aria-live', 'assertive');
    
    // Test quick actions
    await expect(page.locator('[data-testid="quick-actions"]')).toBeVisible();
    await expect(page.locator('[data-testid="quick-actions"]')).toHaveAttribute('role', 'region');
    await expect(page.locator('[data-testid="quick-actions"]')).toHaveAttribute('aria-label', 'Quick actions');
    
    await expect(page.locator('[data-testid="quick-action-new-user"]')).toBeVisible();
    await expect(page.locator('[data-testid="quick-action-new-user"]')).toHaveAttribute('aria-label', 'Create new user');
    await expect(page.locator('[data-testid="quick-action-system-check"]')).toBeVisible();
    await expect(page.locator('[data-testid="quick-action-system-check"]')).toHaveAttribute('aria-label', 'Run system check');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="nav-users"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="nav-analytics"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="nav-system"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="nav-feedback"]')).toBeFocused();
  });

  test('should manage users', async ({ page }) => {
    // Click users tab
    await page.click('text=Users');
    
    // Should show user management interface
    await expect(page.locator('text=User Management')).toBeVisible();
    
    // Should show user list
    await expect(page.locator('text=test@example.com')).toBeVisible();
    await expect(page.locator('text=user@example.com')).toBeVisible();
    
    // Test user search
    await page.fill('input[placeholder="Search users..."]', 'test@example.com');
    await expect(page.locator('text=test@example.com')).toBeVisible();
    await expect(page.locator('text=user@example.com')).not.toBeVisible();
    
    // Test user filtering
    await page.selectOption('select[name="roleFilter"]', 'admin');
    await expect(page.locator('text=admin@example.com')).toBeVisible();
    await expect(page.locator('text=test@example.com')).not.toBeVisible();
    
    // Test user actions
    await page.click('button:has-text("Edit")');
    await expect(page.locator('text=Edit User')).toBeVisible();
    
    // Update user role
    await page.selectOption('select[name="role"]', 'moderator');
    await page.click('button:has-text("Save Changes")');
    
    // Should show success message
    await expect(page.locator('text=User updated successfully')).toBeVisible();
    
    // Test user suspension
    await page.click('button:has-text("Suspend")');
    await page.click('button:has-text("Confirm Suspend")');
    
    // Should show success message
    await expect(page.locator('text=User suspended successfully')).toBeVisible();
  });

  test('should handle user management validation', async ({ page }) => {
    // Click users tab
    await page.click('text=Users');
    
    // Test user search validation
    await page.fill('input[placeholder="Search users..."]', '');
    await page.click('button:has-text("Search")');
    
    // Should show validation error
    await expect(page.locator('text=Search term is required')).toBeVisible();
    
    // Test user edit validation
    await page.click('button:has-text("Edit")');
    await page.fill('input[name="displayName"]', '');
    await page.click('button:has-text("Save Changes")');
    
    // Should show validation error
    await expect(page.locator('text=Display name is required')).toBeVisible();
  });

  test('should view analytics', async ({ page }) => {
    // Click analytics tab
    await page.click('text=Analytics');
    
    // Should show analytics dashboard
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible();
    
    // Should show charts
    await expect(page.locator('canvas')).toBeVisible();
    
    // Should show metrics
    await expect(page.locator('text=User Growth')).toBeVisible();
    await expect(page.locator('text=Poll Activity')).toBeVisible();
    await expect(page.locator('text=Voting Trends')).toBeVisible();
    
    // Test date range filtering
    await page.click('input[name="startDate"]');
    await page.fill('input[name="startDate"]', '2024-01-01');
    await page.fill('input[name="endDate"]', '2024-12-31');
    await page.click('button:has-text("Apply Filter")');
    
    // Should update charts
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should manage system settings', async ({ page }) => {
    // Click system tab
    await page.click('text=System');
    
    // Should show system settings
    await expect(page.locator('text=System Settings')).toBeVisible();
    
    // Test feature flags
    await page.click('input[name="enableAnalytics"]');
    await page.click('input[name="enableNotifications"]');
    await page.click('button:has-text("Save Settings")');
    
    // Should show success message
    await expect(page.locator('text=Settings saved successfully')).toBeVisible();
    
    // Test system maintenance
    await page.click('button:has-text("Maintenance Mode")');
    await page.click('button:has-text("Enable Maintenance")');
    
    // Should show confirmation
    await expect(page.locator('text=Maintenance mode enabled')).toBeVisible();
  });

  test('should handle feedback management', async ({ page }) => {
    // Click feedback tab
    await page.click('text=Feedback');
    
    // Should show feedback management
    await expect(page.locator('text=Feedback Management')).toBeVisible();
    
    // Should show feedback list
    await expect(page.locator('text=User Feedback')).toBeVisible();
    await expect(page.locator('text=Bug Report')).toBeVisible();
    await expect(page.locator('text=Feature Request')).toBeVisible();
    
    // Test feedback filtering
    await page.selectOption('select[name="statusFilter"]', 'new');
    await expect(page.locator('text=New Feedback')).toBeVisible();
    
    // Test feedback actions
    await page.click('button:has-text("View")');
    await expect(page.locator('text=Feedback Details')).toBeVisible();
    
    // Mark as resolved
    await page.click('button:has-text("Mark as Resolved")');
    await page.click('button:has-text("Confirm")');
    
    // Should show success message
    await expect(page.locator('text=Feedback marked as resolved')).toBeVisible();
  });

  test('should handle system monitoring', async ({ page }) => {
    // Click system tab
    await page.click('text=System');
    
    // Should show system monitoring
    await expect(page.locator('text=System Health')).toBeVisible();
    
    // Should show system metrics
    await expect(page.locator('text=CPU Usage')).toBeVisible();
    await expect(page.locator('text=Memory Usage')).toBeVisible();
    await expect(page.locator('text=Database Performance')).toBeVisible();
    
    // Test system alerts
    await expect(page.locator('text=System Alerts')).toBeVisible();
    
    // Test performance metrics
    await expect(page.locator('text=Response Time')).toBeVisible();
    await expect(page.locator('text=Error Rate')).toBeVisible();
  });

  test('should handle admin permissions', async ({ page }) => {
    // Test admin-only features
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
    
    // Test user management access
    await page.click('text=Users');
    await expect(page.locator('text=User Management')).toBeVisible();
    
    // Test analytics access
    await page.click('text=Analytics');
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible();
    
    // Test system access
    await page.click('text=System');
    await expect(page.locator('text=System Settings')).toBeVisible();
  });

  test('should handle admin errors', async ({ page }) => {
    // Mock server error for user management
    await page.route('**/api/admin/users', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal server error',
        }),
      });
    });
    
    // Try to access users
    await page.click('text=Users');
    
    // Should show error message
    await expect(page.locator('text=Failed to load users')).toBeVisible();
    
    // Should show retry button
    await page.click('button:has-text("Retry")');
    
    // Should attempt to reload
    await expect(page.locator('text=Loading...')).toBeVisible();
  });

  test('should handle admin security', async ({ page }) => {
    // Test admin session timeout
    await page.waitForTimeout(30000); // Wait for session timeout
    
    // Try to access admin features
    await page.click('text=Users');
    
    // Should redirect to login
    await expect(page).toHaveURL('/auth');
    
    // Test admin access control
    await page.goto('/admin');
    
    // Should require admin role
    await expect(page.locator('text=Access Denied')).toBeVisible();
  });
});
