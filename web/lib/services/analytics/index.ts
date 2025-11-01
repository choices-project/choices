/**
 * Analytics Feature Module
 * 
 * This module provides a graceful wrapper for analytics functionality,
 * allowing it to be disabled via feature flags while maintaining
 * a clean API for components that depend on it.
 */

import { isFeatureEnabled } from '@/lib/core/feature-flags';

// Export the main AnalyticsService class
export { AnalyticsService } from '@/features/analytics/lib/analytics-service';

// Re-export analytics utilities conditionally
export const getAnalyticsUtils = () => {
  if (!isFeatureEnabled('analytics')) {
    return {
      trackEvent: () => {},
      trackPageView: () => {},
      trackUserAction: () => {},
      getAnalyticsData: () => Promise.resolve(null),
    };
  }
  
  // Dynamically import analytics utilities only when feature is enabled
  return import('@/features/analytics/lib/auth-analytics').then(module => module);
};

// Re-export analytics types conditionally
export const getAnalyticsTypes = () => {
  if (!isFeatureEnabled('analytics')) {
    return {
      AnalyticsEvent: {},
      AnalyticsData: {},
      UserAnalytics: {},
    };
  }
  
  // Dynamically import analytics types only when feature is enabled
  return import('@/features/analytics/types/analytics').then(module => module);
};

// Feature status
export const isAnalyticsEnabled = () => isFeatureEnabled('analytics');

// Graceful fallbacks for disabled features
export const ANALYTICS_FALLBACKS = {
  trackEvent: () => {},
  trackPageView: () => {},
  trackUserAction: () => {},
  getAnalyticsData: () => Promise.resolve(null),
  isEnabled: false,
};
