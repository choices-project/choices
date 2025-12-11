/**
 * Widget Layout Presets
 * 
 * Pre-configured dashboard layouts for quick setup.
 * Users can apply these presets or create custom layouts.
 * 
 * Created: November 5, 2025
 * Status: PRODUCTION
 */

import { generateWidgetId } from './widgetRegistry';

import type { LayoutPreset, WidgetConfig } from '../types/widget';


// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const createWidget = (
  type: WidgetConfig['type'],
  title: string,
  x: number,
  y: number,
  w: number,
  h: number,
  settings: WidgetConfig['settings'] = {}
): WidgetConfig => ({
  id: generateWidgetId(type),
  type,
  title,
  description: '',
  icon: '',
  enabled: true,
  position: { x, y },
  size: { w, h },
  settings: {
    refreshInterval: 300, // 5 minutes default
    ...settings,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
});

// ============================================================================
// EXECUTIVE DASHBOARD PRESET
// ============================================================================

const executiveDashboard: LayoutPreset = {
  id: 'executive',
  name: 'Executive Dashboard',
  description: 'High-level overview with key metrics and trends',
  category: 'executive',
  layout: {
    name: 'Executive Dashboard',
    description: 'Focus on trends and high-level metrics',
    widgets: [
      // Large trends chart at top
      createWidget('trends', 'Activity Trends', 0, 0, 8, 4, {
        filters: { dateRange: '30d', chartType: 'area' },
      }),
      
      // Demographics chart on right
      createWidget('demographics', 'User Demographics', 8, 0, 4, 4, {
        filters: { defaultTab: 'trust' },
      }),
      
      // Poll heatmap in middle
      createWidget('poll-heatmap', 'Poll Engagement Heatmap', 0, 4, 6, 4, {
        filters: { category: 'All Categories', limit: 20 },
      }),
      
      // Trust tiers comparison
      createWidget('trust-tiers', 'Trust Tier Analysis', 6, 4, 6, 4, {
        filters: {},
      }),
      
      // PWA offline queue health
      createWidget('pwa-offline-queue', 'Offline Queue Health', 0, 8, 4, 3, {
        refreshInterval: 30,
      }),
    ],
    isDefault: false,
    isPreset: true,
  },
};

// ============================================================================
// DETAILED ANALYTICS PRESET
// ============================================================================

const detailedAnalytics: LayoutPreset = {
  id: 'detailed',
  name: 'Detailed Analytics',
  description: 'Comprehensive view with all analytics widgets',
  category: 'detailed',
  layout: {
    name: 'Detailed Analytics',
    description: 'Complete analytics suite with all available widgets',
    widgets: [
      // Top row: Trends, Demographics, Temporal
      createWidget('trends', 'Activity Trends', 0, 0, 4, 3),
      createWidget('demographics', 'User Demographics', 4, 0, 4, 3),
      createWidget('temporal', 'Temporal Patterns', 8, 0, 4, 3),
      
      // Middle row: Large poll heatmap
      createWidget('poll-heatmap', 'Poll Engagement', 0, 3, 12, 4, {
        filters: { category: 'All Categories', limit: 30 },
      }),
      
      // Bottom row: Trust Tiers, District Heatmap, PWA Queue Health
      createWidget('trust-tiers', 'Trust Tier Comparison', 0, 7, 4, 4),
      createWidget('district-heatmap', 'District Engagement', 4, 7, 4, 4, {
        filters: { state: 'All States', level: 'federal' },
      }),
      createWidget('pwa-offline-queue', 'Offline Queue Health', 8, 7, 4, 3, {
        refreshInterval: 30,
      }),

      createWidget('election-notifications', 'Election Notifications', 0, 10, 6, 4, {
        refreshInterval: 300,
      }),
    ],
    isDefault: false,
    isPreset: true,
  },
};

// ============================================================================
// MOBILE DASHBOARD PRESET
// ============================================================================

const mobileDashboard: LayoutPreset = {
  id: 'mobile',
  name: 'Mobile Dashboard',
  description: 'Optimized for mobile devices with stacked layout',
  category: 'mobile',
  layout: {
    name: 'Mobile Dashboard',
    description: 'Vertically stacked widgets for mobile screens',
    widgets: [
      // Stacked vertically, full width
      createWidget('trends', 'Activity Trends', 0, 0, 12, 4, {
        filters: { dateRange: '7d' },
      }),
      
      createWidget('demographics', 'User Demographics', 0, 4, 12, 4, {
        filters: { defaultTab: 'trust' },
      }),
      
      createWidget('trust-tiers', 'Trust Tiers', 0, 8, 12, 3),
      
      createWidget('poll-heatmap', 'Poll Engagement', 0, 11, 12, 4, {
        filters: { limit: 10 },
      }),
      
      createWidget('pwa-offline-queue', 'Offline Queue Health', 0, 15, 12, 3, {
        refreshInterval: 30,
      }),
    ],
    isDefault: false,
    isPreset: true,
  },
};

// ============================================================================
// ENGAGEMENT FOCUS PRESET
// ============================================================================

const engagementFocus: LayoutPreset = {
  id: 'engagement',
  name: 'Engagement Focus',
  description: 'Focus on user engagement and participation metrics',
  category: 'custom',
  layout: {
    name: 'Engagement Dashboard',
    description: 'Emphasis on engagement patterns and temporal analysis',
    widgets: [
      // Temporal analysis at top
      createWidget('temporal', 'Temporal Patterns', 0, 0, 12, 4, {
        filters: { dateRange: '30d' },
      }),
      
      // Poll heatmap
      createWidget('poll-heatmap', 'Poll Engagement', 0, 4, 6, 4, {
        filters: { category: 'All Categories', limit: 25 },
      }),
      
      // District heatmap
      createWidget('district-heatmap', 'Geographic Engagement', 6, 4, 6, 4, {
        filters: { state: 'All States' },
      }),
      
      // Trends at bottom
      createWidget('trends', 'Engagement Trends', 0, 8, 12, 3, {
        filters: { chartType: 'line', dateRange: '14d' },
      }),

      createWidget('election-notifications', 'Election Notifications', 0, 11, 12, 3, {
        refreshInterval: 300,
      }),
    ],
    isDefault: false,
    isPreset: true,
  },
};

// ============================================================================
// DEFAULT DASHBOARD PRESET
// ============================================================================

const defaultDashboard: LayoutPreset = {
  id: 'default',
  name: 'Default Dashboard',
  description: 'Balanced view with core analytics',
  category: 'executive',
  layout: {
    name: 'Default Dashboard',
    description: 'Standard analytics dashboard',
    widgets: [
      createWidget('trends', 'Activity Trends', 0, 0, 6, 4),
      createWidget('demographics', 'User Demographics', 6, 0, 6, 4),
      createWidget('poll-heatmap', 'Poll Engagement', 0, 4, 8, 4),
      createWidget('pwa-offline-queue', 'Offline Queue Health', 8, 4, 4, 3, {
        refreshInterval: 30,
      }),
    ],
    isDefault: true,
    isPreset: true,
  },
};

// ============================================================================
// PRESET REGISTRY
// ============================================================================

export const LAYOUT_PRESETS: Record<string, LayoutPreset> = {
  default: defaultDashboard,
  executive: executiveDashboard,
  detailed: detailedAnalytics,
  mobile: mobileDashboard,
  engagement: engagementFocus,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all available presets
 */
export function getAllPresets(): LayoutPreset[] {
  return Object.values(LAYOUT_PRESETS);
}

/**
 * Get preset by ID
 */
export function getPreset(id: string): LayoutPreset | undefined {
  return LAYOUT_PRESETS[id];
}

/**
 * Get presets by category
 */
export function getPresetsByCategory(
  category: 'executive' | 'detailed' | 'mobile' | 'custom'
): LayoutPreset[] {
  return Object.values(LAYOUT_PRESETS).filter(p => p.category === category);
}

/**
 * Get default preset
 */
export function getDefaultPreset(): LayoutPreset {
  return defaultDashboard;
}

// ============================================================================
// EXPORT
// ============================================================================

export default LAYOUT_PRESETS;

