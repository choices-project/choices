/**
 * Component Test Suite
 * 
 * Comprehensive test suite for all restored components
 * 
 * Created: October 26, 2025
 * Status: ACTIVE
 */

import { test, expect } from '@playwright/test';
import { ComponentTestUtils } from '../../utils/component-test-utils';
import { PerformanceTestUtils } from '../../utils/performance-test-utils';
import { EnhancedDatabaseTracker } from '../../utils/enhanced-database-tracker';

test.describe('Component Test Suite', () => {
  let componentUtils: ComponentTestUtils;
  let performanceUtils: PerformanceTestUtils;
  let dbTracker: EnhancedDatabaseTracker;

  test.beforeEach(async ({ page }) => {
    componentUtils = new ComponentTestUtils(page);
    performanceUtils = new PerformanceTestUtils(page);
    
    // Initialize database tracker
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    dbTracker = new EnhancedDatabaseTracker(supabase, `test-${Date.now()}`);
  });

  test('PerformanceMonitor component works correctly', async ({ page }) => {
    await page.goto('/admin/performance');
    
    // Test component visibility
    await componentUtils.waitForComponent('[data-testid="performance-monitor"]');
    
    // Test performance metrics
    const performance = await performanceUtils.measureComponentRender('[data-testid="performance-monitor"]');
    expect(performance.isFast).toBe(true);
    
    // Test component interactions
    await componentUtils.testComponentInteractions('[data-testid="performance-monitor"]');
    
    // Track database usage
    dbTracker.trackQuery('analytics_events', 'select', 'performance-monitor-load', 100, true, undefined, 'PerformanceMonitor', 'admin-journey');
  });

  test('AIHealthStatus component works correctly', async ({ page }) => {
    await page.goto('/admin/analytics');
    
    // Test component visibility
    await componentUtils.waitForComponent('[data-testid="ai-health-status"]');
    
    // Test health status display
    const healthStatus = await page.locator('[data-testid="ai-health-status"]').textContent();
    expect(healthStatus).toContain('AI Service');
    
    // Test component state
    await componentUtils.testComponentState('[data-testid="ai-health-status"]', 'healthy');
    
    // Track database usage
    dbTracker.trackQuery('analytics_events', 'select', 'ai-health-check', 150, true, undefined, 'AIHealthStatus', 'admin-journey');
  });

  test('TrustTierFilter component works correctly', async ({ page }) => {
    await page.goto('/polls');
    
    // Test component visibility
    await componentUtils.waitForComponent('[data-testid="trust-tier-filter"]');
    
    // Test filter interactions
    await componentUtils.testComponentInteractions('[data-testid="trust-tier-filter"]');
    
    // Test accessibility
    const accessibility = await componentUtils.testComponentAccessibility('[data-testid="trust-tier-filter"]');
    expect(accessibility.role).toBeDefined();
    
    // Track database usage
    dbTracker.trackQuery('trust_tier_progression', 'select', 'trust-tier-filter-load', 200, true, undefined, 'TrustTierFilter', 'user-journey');
  });

  test('SophisticatedAnalytics component works correctly', async ({ page }) => {
    await page.goto('/polls/analytics');
    
    // Test component visibility
    await componentUtils.waitForComponent('[data-testid="sophisticated-analytics"]');
    
    // Test analytics data loading
    const analyticsData = await page.locator('[data-testid="analytics-data"]').textContent();
    expect(analyticsData).toBeDefined();
    
    // Test component performance
    const performance = await performanceUtils.measureComponentRender('[data-testid="sophisticated-analytics"]');
    expect(performance.isAcceptable).toBe(true);
    
    // Track database usage
    dbTracker.trackQuery('analytics_events', 'select', 'sophisticated-analytics-load', 300, true, undefined, 'SophisticatedAnalytics', 'user-journey');
  });

  test('PollResults component works correctly', async ({ page }) => {
    await page.goto('/polls/test-poll-id/results');
    
    // Test component visibility
    await componentUtils.waitForComponent('[data-testid="poll-results"]');
    
    // Test results display
    const results = await page.locator('[data-testid="poll-results"]').textContent();
    expect(results).toContain('Results');
    
    // Test component interactions
    await componentUtils.testComponentInteractions('[data-testid="poll-results"]');
    
    // Track database usage
    dbTracker.trackQuery('polls', 'select', 'poll-results-load', 250, true, undefined, 'PollResults', 'user-journey');
  });

  test.afterEach(async () => {
    // Save test report
    await dbTracker.saveTestReport();
  });
});