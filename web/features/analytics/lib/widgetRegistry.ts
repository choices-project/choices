/**
 * Widget Registry
 * 
 * Central registry of all available analytics widgets.
 * Add new widgets here to make them available in the dashboard builder.
 * 
 * Created: November 5, 2025
 * Status: ✅ Extensible widget system
 */

import { lazy } from 'react';

import type { WidgetRegistryType, WidgetType } from '../types/widget';

// Lazy load widget components for better performance
const PollHeatmap = lazy(() => import('../components/PollHeatmap'));
const TrendsChart = lazy(() => import('../components/TrendsChart'));
const DemographicsChart = lazy(() => import('../components/DemographicsChart'));
// Add more widgets as you create them

/**
 * Widget Registry
 * 
 * To add a new widget:
 * 1. Create your widget component in /components/
 * 2. Import it above (lazy load)
 * 3. Add entry to this registry
 * 4. Done! It's now available in dashboard builder
 */
export const WIDGET_REGISTRY: WidgetRegistryType = {
  'poll-heatmap': {
    type: 'poll-heatmap',
    name: 'Poll Engagement Heatmap',
    description: 'Visual representation of poll engagement intensity',
    component: PollHeatmap as any,
    icon: '🔥',
    defaultConfig: {
      id: '',
      type: 'poll-heatmap',
      title: 'Poll Engagement Heatmap',
      size: 'large',
      position: { x: 0, y: 0, w: 2, h: 2 },
      filters: {
        category: 'All Categories',
        limit: 20
      },
      refreshInterval: 300000, // 5 minutes
      exportFormats: ['csv', 'png'],
      requiresPermission: 'admin'
    },
    dataSource: '/api/analytics/poll-heatmap',
    supportedExports: ['csv', 'png'],
    requiredPermission: 'admin',
    category: 'polls'
  },

  'district-heatmap': {
    type: 'district-heatmap',
    name: 'District Engagement Heatmap',
    description: 'Geographic distribution of user engagement by congressional district',
    component: null as any, // TODO: Wrap DistrictHeatmap component
    icon: '🗺️',
    defaultConfig: {
      id: '',
      type: 'district-heatmap',
      title: 'District Engagement',
      size: 'large',
      position: { x: 0, y: 0, w: 2, h: 2 },
      filters: {
        state: 'All States',
        level: 'federal',
        minCount: 5
      },
      refreshInterval: 300000,
      exportFormats: ['csv'],
      requiresPermission: 'admin'
    },
    dataSource: '/api/v1/civics/heatmap',
    supportedExports: ['csv'],
    requiredPermission: 'admin',
    category: 'districts'
  },

  'trends-chart': {
    type: 'trends-chart',
    name: 'Activity Trends',
    description: 'Time-series visualization of votes, participation, and engagement over time',
    component: TrendsChart as any,
    icon: '📈',
    defaultConfig: {
      id: '',
      type: 'trends-chart',
      title: 'Activity Trends',
      size: 'large',
      position: { x: 0, y: 0, w: 2, h: 2 },
      filters: {
        dateRange: '7d',
        chartType: 'area'
      },
      refreshInterval: 60000, // 1 minute
      exportFormats: ['csv', 'png'],
      requiresPermission: 'T3'
    },
    dataSource: '/api/analytics/trends',
    supportedExports: ['csv', 'png'],
    requiredPermission: 'T3',
    category: 'general'
  },

  'demographics-chart': {
    type: 'demographics-chart',
    name: 'User Demographics',
    description: 'Breakdown of users by trust tier, age, district, and education',
    component: DemographicsChart as any,
    icon: '👥',
    defaultConfig: {
      id: '',
      type: 'demographics-chart',
      title: 'User Demographics',
      size: 'large',
      position: { x: 0, y: 0, w: 2, h: 2 },
      filters: {
        defaultTab: 'trust'
      },
      refreshInterval: 600000, // 10 minutes
      exportFormats: ['csv'],
      requiresPermission: 'admin'
    },
    dataSource: '/api/analytics/demographics',
    supportedExports: ['csv'],
    requiredPermission: 'admin',
    category: 'users'
  },

  'temporal-analysis': {
    type: 'temporal-analysis',
    name: 'Temporal Analysis',
    description: 'Hour-of-day and day-of-week engagement patterns',
    component: null as any, // TODO: Create component
    icon: '🕐',
    defaultConfig: {
      id: '',
      type: 'temporal-analysis',
      title: 'Temporal Patterns',
      size: 'large',
      position: { x: 0, y: 0, w: 2, h: 2 },
      filters: {
        dateRange: '30d'
      },
      refreshInterval: 300000,
      exportFormats: ['csv', 'png'],
      requiresPermission: 'T3'
    },
    dataSource: '/api/analytics/temporal',
    supportedExports: ['csv', 'png'],
    requiredPermission: 'T3',
    category: 'general'
  },

  'trust-tier-comparison': {
    type: 'trust-tier-comparison',
    name: 'Trust Tier Comparison',
    description: 'Compare behavior and engagement across trust tiers',
    component: null as any, // TODO: Create component
    icon: '🏆',
    defaultConfig: {
      id: '',
      type: 'trust-tier-comparison',
      title: 'Trust Tier Analysis',
      size: 'medium',
      position: { x: 0, y: 0, w: 1, h: 2 },
      filters: {},
      refreshInterval: 600000,
      exportFormats: ['csv'],
      requiresPermission: 'admin'
    },
    dataSource: '/api/analytics/trust-tiers',
    supportedExports: ['csv'],
    requiredPermission: 'admin',
    category: 'users'
  },

  'kpi-card': {
    type: 'kpi-card',
    name: 'KPI Card',
    description: 'Single key performance indicator display',
    component: null as any, // TODO: Create component
    icon: '📊',
    defaultConfig: {
      id: '',
      type: 'kpi-card',
      title: 'KPI',
      size: 'small',
      position: { x: 0, y: 0, w: 1, h: 1 },
      filters: {
        metric: 'total_users'
      },
      refreshInterval: 60000,
      exportFormats: [],
      requiresPermission: 'T2'
    },
    dataSource: '/api/analytics/kpi',
    supportedExports: [],
    requiredPermission: 'T2',
    category: 'general'
  },

  'custom-table': {
    type: 'custom-table',
    name: 'Custom Data Table',
    description: 'Display raw data in tabular format with sorting and filtering',
    component: null as any, // TODO: Create component
    icon: '📋',
    defaultConfig: {
      id: '',
      type: 'custom-table',
      title: 'Data Table',
      size: 'large',
      position: { x: 0, y: 0, w: 2, h: 2 },
      filters: {},
      refreshInterval: 300000,
      exportFormats: ['csv', 'json'],
      requiresPermission: 'admin'
    },
    dataSource: '/api/analytics/table',
    supportedExports: ['csv', 'json'],
    requiredPermission: 'admin',
    category: 'general'
  },

  'custom-query': {
    type: 'custom-query',
    name: 'Custom Query Builder',
    description: 'Build custom SQL queries with visual interface',
    component: null as any, // TODO: Create component
    icon: '🔍',
    defaultConfig: {
      id: '',
      type: 'custom-query',
      title: 'Custom Query',
      size: 'full',
      position: { x: 0, y: 0, w: 3, h: 2 },
      filters: {},
      refreshInterval: 0, // Manual refresh only
      exportFormats: ['csv', 'json'],
      requiresPermission: 'admin'
    },
    dataSource: '/api/analytics/custom-query',
    supportedExports: ['csv', 'json'],
    requiredPermission: 'admin',
    category: 'general'
  }
};

/**
 * Get widget registration by type
 */
export function getWidget(type: WidgetType) {
  return WIDGET_REGISTRY[type];
}

/**
 * Get all widgets by category
 */
export function getWidgetsByCategory(category: 'polls' | 'users' | 'districts' | 'general') {
  return Object.values(WIDGET_REGISTRY).filter(w => w.category === category);
}

/**
 * Get widgets accessible to user
 */
export function getAccessibleWidgets(userLevel: 'admin' | 'T3' | 'T2' | 'T1') {
  const levelHierarchy = { admin: 4, T3: 3, T2: 2, T1: 1 };
  const userLevelNum = levelHierarchy[userLevel];
  
  return Object.values(WIDGET_REGISTRY).filter(widget => {
    const requiredLevelNum = levelHierarchy[widget.requiredPermission as keyof typeof levelHierarchy];
    return userLevelNum >= requiredLevelNum;
  });
}

/**
 * Generate unique widget ID
 */
export function generateWidgetId(type: WidgetType): string {
  return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

