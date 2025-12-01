/**
 * Widget Registry
 *
 * Central registry of all available analytics widgets.
 * Provides strongly typed metadata, default configuration factories,
 *and access helpers for the widget dashboard.
 *
 * Created: November 5, 2025
 * Updated: November 8, 2025 - Post-zustand audit type overhaul
 */

import { lazy, type ComponentType, type FC } from 'react';

import type {
  WidgetCategory,
  WidgetConfig,
  WidgetConfigOverrides,
  WidgetMetadata,
  WidgetProps,
  WidgetRegistry,
  WidgetRegistryEntry,
  WidgetSettings,
  WidgetType,
} from '../types/widget';

// Lazy load widget components for better performance
const PollHeatmap = lazy(() => import('../components/PollHeatmap'));
const TrendsChart = lazy(() => import('../components/TrendsChart'));
const DemographicsChart = lazy(() => import('../components/DemographicsChart'));
const TemporalAnalysisChart = lazy(() => import('../components/TemporalAnalysisChart'));
const TrustTierComparisonChart = lazy(() => import('../components/TrustTierComparisonChart'));
const PWAOfflineQueueWidget = lazy(() => import('../components/widgets/PWAOfflineQueueWidget'));
const ElectionNotificationWidget = lazy(() => import('../components/widgets/ElectionNotificationWidget'));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type WidgetDefaults = {
  position: WidgetConfig['position'];
  size: WidgetConfig['size'];
  minSize?: WidgetConfig['minSize'];
  maxSize?: WidgetConfig['maxSize'];
  settings?: WidgetSettings;
};

const mergeWidgetSettings = (
  base?: WidgetSettings,
  overrides?: Partial<WidgetSettings>
): WidgetSettings => {
  const merged: WidgetSettings = {
    ...(base ?? {}),
    ...(overrides ?? {}),
  };

  if (base?.filters || overrides?.filters) {
    merged.filters = {
      ...(base?.filters ?? {}),
      ...(overrides?.filters ?? {}),
    };
  }

  if (base?.displayOptions || overrides?.displayOptions) {
    merged.displayOptions = {
      ...(base?.displayOptions ?? {}),
      ...(overrides?.displayOptions ?? {}),
    };
  }

  if (base?.customizations || overrides?.customizations) {
    merged.customizations = {
      ...(base?.customizations ?? {}),
      ...(overrides?.customizations ?? {}),
    };
  }

  const nextDateRange = overrides?.dateRange ?? base?.dateRange;
  if (nextDateRange) {
    merged.dateRange = nextDateRange;
  } else {
    delete merged.dateRange;
  }

  return merged;
};

const createPlaceholderWidget = (message: string): FC<WidgetProps> => {
  const Placeholder: FC<WidgetProps> = ({ config }) => (
    <div className="flex h-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border/60 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
      <span className="text-base font-semibold">{config.title}</span>
      <span>{message}</span>
    </div>
  );

  Placeholder.displayName = `PlaceholderWidget(${message})`;
  return Placeholder;
};

const createWidgetEntry = (
  metadata: WidgetMetadata,
  component: ComponentType<WidgetProps>,
  defaults: WidgetDefaults
): WidgetRegistryEntry => {
  const createConfig = (overrides: WidgetConfigOverrides = {}) => {
    const now = new Date();
    const settings = mergeWidgetSettings(defaults.settings, overrides.settings);
    const minSize = overrides.minSize ?? defaults.minSize;
    const maxSize = overrides.maxSize ?? defaults.maxSize;

    const config: WidgetConfig = {
      id: overrides.id ?? generateWidgetId(metadata.type),
      type: metadata.type,
      title: overrides.title ?? metadata.name,
      description: overrides.description ?? metadata.description,
      icon: overrides.icon ?? metadata.icon,
      enabled: overrides.enabled ?? true,
      position: {
        x: overrides.position?.x ?? defaults.position.x,
        y: overrides.position?.y ?? defaults.position.y,
      },
      size: {
        w: overrides.size?.w ?? defaults.size.w,
        h: overrides.size?.h ?? defaults.size.h,
      },
      static: overrides.static ?? false,
      settings,
      createdAt: overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
    };

    if (minSize) {
      config.minSize = minSize;
    }
    if (maxSize) {
      config.maxSize = maxSize;
    }

    return config;
  };

  return {
    metadata,
    component,
    createConfig,
  };
};

// ---------------------------------------------------------------------------
// Concrete widget components
// ---------------------------------------------------------------------------

const PollHeatmapWidget: FC<WidgetProps> = () => <PollHeatmap />;
const TrendsChartWidget: FC<WidgetProps> = () => <TrendsChart />;
const DemographicsChartWidget: FC<WidgetProps> = () => <DemographicsChart />;
const TemporalAnalysisWidget: FC<WidgetProps> = () => <TemporalAnalysisChart />;
const TrustTierComparisonWidget: FC<WidgetProps> = () => <TrustTierComparisonChart />;
const PWAOfflineQueueAnalyticsWidget: FC<WidgetProps> = (props) => <PWAOfflineQueueWidget {...props} />;
const ElectionNotificationAnalyticsWidget: FC<WidgetProps> = (props) => <ElectionNotificationWidget {...props} />;

// ---------------------------------------------------------------------------
// Widget registry entries
// ---------------------------------------------------------------------------

const registryEntries: WidgetRegistryEntry[] = [
  createWidgetEntry(
    {
      type: 'poll-heatmap',
      name: 'Poll Engagement Heatmap',
      description: 'Visual representation of poll engagement intensity',
      icon: '🔥',
      category: 'polls',
      defaultSize: { w: 6, h: 4 },
      minSize: { w: 4, h: 3 },
      maxSize: { w: 8, h: 6 },
      capabilities: {
        resizable: true,
        draggable: true,
        configurable: true,
        exportable: true,
      },
      dataSource: '/api/analytics/poll-heatmap',
      supportedExports: ['csv', 'png'],
      requiredPermission: 'admin',
      dataRequirements: {
        adminOnly: true,
        permissions: ['admin'],
      },
    },
    PollHeatmapWidget,
    {
      position: { x: 0, y: 0 },
      size: { w: 6, h: 4 },
      minSize: { w: 4, h: 3 },
      settings: {
        refreshInterval: 300_000,
        filters: {
          category: 'All Categories',
          limit: 20,
        },
      },
    }
  ),
  createWidgetEntry(
    {
      type: 'district-heatmap',
      name: 'District Engagement Heatmap',
      description: 'Geographic distribution of user engagement by district',
      icon: '🗺️',
      category: 'districts',
      defaultSize: { w: 6, h: 4 },
      minSize: { w: 4, h: 3 },
      maxSize: { w: 8, h: 6 },
      capabilities: {
        resizable: true,
        draggable: true,
        configurable: true,
        exportable: true,
      },
      dataSource: '/api/v1/civics/heatmap',
      supportedExports: ['csv'],
      requiredPermission: 'admin',
      dataRequirements: {
        adminOnly: true,
        permissions: ['admin'],
      },
    },
    createPlaceholderWidget('District engagement heatmap will be available soon.'),
    {
      position: { x: 0, y: 0 },
      size: { w: 6, h: 4 },
      minSize: { w: 4, h: 3 },
      settings: {
        refreshInterval: 300_000,
        filters: {
          state: 'All States',
          level: 'federal',
          minCount: 5,
        },
      },
    }
  ),
  createWidgetEntry(
    {
      type: 'trends-chart',
      name: 'Activity Trends',
      description: 'Time-series visualization of votes, participation, and engagement',
      icon: '📈',
      category: 'general',
      defaultSize: { w: 6, h: 4 },
      minSize: { w: 4, h: 3 },
      capabilities: {
        resizable: true,
        draggable: true,
        configurable: true,
        exportable: true,
      },
      dataSource: '/api/analytics/trends',
      supportedExports: ['csv', 'png'],
      requiredPermission: 'T3',
      dataRequirements: {
        permissions: ['T3'],
      },
    },
    TrendsChartWidget,
    {
      position: { x: 0, y: 0 },
      size: { w: 6, h: 4 },
      minSize: { w: 4, h: 3 },
      settings: {
        refreshInterval: 60_000,
        filters: {
          dateRange: '7d',
          chartType: 'area',
        },
      },
    }
  ),
  createWidgetEntry(
    {
      type: 'demographics-chart',
      name: 'User Demographics',
      description: 'Breakdown of users by trust tier, age, district, and education',
      icon: '👥',
      category: 'users',
      defaultSize: { w: 6, h: 4 },
      minSize: { w: 4, h: 3 },
      capabilities: {
        resizable: true,
        draggable: true,
        configurable: true,
      exportable: true,
      },
      dataSource: '/api/analytics/demographics',
      supportedExports: ['csv'],
      requiredPermission: 'admin',
      dataRequirements: {
        adminOnly: true,
        permissions: ['admin'],
      },
    },
    DemographicsChartWidget,
    {
      position: { x: 0, y: 0 },
      size: { w: 6, h: 4 },
      minSize: { w: 4, h: 3 },
      settings: {
        refreshInterval: 600_000,
        filters: {
          defaultTab: 'trust',
        },
      },
    }
  ),
  createWidgetEntry(
    {
      type: 'temporal-analysis',
      name: 'Temporal Analysis',
      description: 'Hour-of-day and day-of-week engagement patterns',
      icon: '🕐',
      category: 'general',
      defaultSize: { w: 6, h: 4 },
      minSize: { w: 4, h: 3 },
      capabilities: {
        resizable: true,
        draggable: true,
        configurable: true,
        exportable: true,
      },
      dataSource: '/api/analytics/temporal',
      supportedExports: ['csv', 'png'],
      requiredPermission: 'T3',
      dataRequirements: {
        permissions: ['T3'],
      },
    },
    TemporalAnalysisWidget,
    {
      position: { x: 0, y: 0 },
      size: { w: 6, h: 4 },
      minSize: { w: 4, h: 3 },
      settings: {
        refreshInterval: 300_000,
        filters: {
          dateRange: '30d',
        },
      },
    }
  ),
  createWidgetEntry(
    {
      type: 'trust-tier-comparison',
      name: 'Trust Tier Comparison',
      description: 'Compare behavior and engagement across trust tiers',
      icon: '🏆',
      category: 'users',
      defaultSize: { w: 4, h: 3 },
      minSize: { w: 3, h: 2 },
      capabilities: {
        resizable: true,
        draggable: true,
        configurable: true,
        exportable: true,
      },
      dataSource: '/api/analytics/trust-tiers',
      supportedExports: ['csv'],
      requiredPermission: 'admin',
      dataRequirements: {
        adminOnly: true,
        permissions: ['admin'],
      },
    },
    TrustTierComparisonWidget,
    {
      position: { x: 0, y: 0 },
      size: { w: 4, h: 3 },
      minSize: { w: 3, h: 2 },
      settings: {
        refreshInterval: 600_000,
      },
    }
  ),
  createWidgetEntry(
    {
      type: 'kpi-card',
      name: 'KPI Card',
      description: 'Display a single KPI with trend deltas',
      icon: '📊',
      category: 'general',
      defaultSize: { w: 3, h: 2 },
      minSize: { w: 2, h: 1 },
      capabilities: {
        resizable: true,
        draggable: true,
        configurable: true,
        exportable: false,
      },
      dataSource: '/api/analytics/kpi',
      supportedExports: [],
      requiredPermission: 'admin',
      dataRequirements: {
        adminOnly: true,
        permissions: ['admin'],
      },
    },
    createPlaceholderWidget('KPI cards with trend deltas will be available soon.'),
    {
      position: { x: 0, y: 0 },
      size: { w: 3, h: 2 },
      minSize: { w: 2, h: 1 },
      settings: {
        refreshInterval: 60_000,
        filters: {
          metric: 'dau',
        },
      },
    }
  ),
  createWidgetEntry(
    {
      type: 'custom-table',
      name: 'Custom Data Table',
      description: 'Display raw data in tabular format with sorting and filtering',
      icon: '📋',
      category: 'general',
      defaultSize: { w: 6, h: 4 },
      minSize: { w: 4, h: 3 },
      capabilities: {
        resizable: true,
        draggable: true,
        configurable: true,
        exportable: true,
      },
      dataSource: '/api/analytics/table',
      supportedExports: ['csv', 'json'],
      requiredPermission: 'admin',
      dataRequirements: {
        adminOnly: true,
        permissions: ['admin'],
      },
    },
    createPlaceholderWidget('Custom tables will be configurable in an upcoming release.'),
    {
      position: { x: 0, y: 0 },
      size: { w: 6, h: 4 },
      minSize: { w: 4, h: 3 },
      settings: {
        refreshInterval: 300_000,
      },
    }
  ),
  createWidgetEntry(
    {
      type: 'funnel',
      name: 'Conversion Funnel',
      description: 'Track onboarding, poll creation, or civic-action funnels',
      icon: '🪣',
      category: 'engagement',
      defaultSize: { w: 4, h: 4 },
      minSize: { w: 3, h: 3 },
      capabilities: {
        resizable: true,
        draggable: true,
        configurable: true,
        exportable: false,
      },
      dataSource: '/api/analytics/funnels',
      supportedExports: [],
      requiredPermission: 'admin',
      dataRequirements: {
        adminOnly: true,
        permissions: ['admin'],
      },
    },
    createPlaceholderWidget('Conversion funnels will be available in a future release.'),
    {
      position: { x: 0, y: 0 },
      size: { w: 4, h: 4 },
      minSize: { w: 3, h: 3 },
      settings: {
        refreshInterval: 300_000,
        filters: {
          funnel: 'onboarding',
        },
      },
    }
  ),
  createWidgetEntry(
    {
      type: 'pwa-offline-queue',
      name: 'PWA Offline Queue',
      description: 'Real-time insight into pending offline actions and background sync health.',
      icon: '📡',
      category: 'engagement',
      defaultSize: { w: 4, h: 3 },
      minSize: { w: 3, h: 3 },
      capabilities: {
        resizable: true,
        draggable: true,
        configurable: false,
        exportable: false,
      },
      dataRequirements: {
        adminOnly: true,
        permissions: ['admin'],
        features: ['pwa'],
      },
    },
    PWAOfflineQueueAnalyticsWidget,
    {
      position: { x: 0, y: 0 },
      size: { w: 4, h: 3 },
      settings: {
        refreshInterval: 30_000,
      },
    }
  ),
  createWidgetEntry(
    {
      type: 'election-notifications',
      name: 'Election Notification Engagement',
      description: 'Delivered vs opened election alerts across civics surfaces.',
      icon: '🗳️',
      category: 'engagement',
      defaultSize: { w: 6, h: 4 },
      minSize: { w: 4, h: 3 },
      maxSize: { w: 8, h: 6 },
      capabilities: {
        resizable: true,
        draggable: true,
        configurable: true,
        exportable: false,
      },
      dataSource: '/api/analytics/election-notifications',
      tags: ['notifications', 'civics', 'engagement'],
      requiredPermission: 'admin',
      dataRequirements: {
        adminOnly: true,
        permissions: ['admin'],
        features: ['ANALYTICS'],
      },
    },
    ElectionNotificationAnalyticsWidget,
    {
      position: { x: 0, y: 0 },
      size: { w: 6, h: 4 },
      minSize: { w: 4, h: 3 },
      settings: {
        refreshInterval: 300,
      },
    }
  ),
  createWidgetEntry(
    {
      type: 'custom-query',
      name: 'Custom Query Builder',
      description: 'Build custom SQL queries with visual interface',
      icon: '🔍',
      category: 'general',
      defaultSize: { w: 8, h: 4 },
      minSize: { w: 6, h: 3 },
      capabilities: {
        resizable: true,
        draggable: true,
        configurable: true,
        exportable: true,
      },
      dataSource: '/api/analytics/custom-query',
      supportedExports: ['csv', 'json'],
      requiredPermission: 'admin',
      dataRequirements: {
        adminOnly: true,
        permissions: ['admin'],
      },
    },
    createPlaceholderWidget('Custom query builder is under construction.'),
    {
      position: { x: 0, y: 0 },
      size: { w: 8, h: 4 },
      minSize: { w: 6, h: 3 },
      settings: {
        refreshInterval: 0,
      },
    }
  ),
];

// ---------------------------------------------------------------------------
// Registry exports
// ---------------------------------------------------------------------------

export const WIDGET_REGISTRY: WidgetRegistry = new Map(
  registryEntries.map((entry) => [entry.metadata.type, entry])
);

/**
 * Get widget registration by type.
 */
export function getWidget(type: WidgetType): WidgetRegistryEntry | undefined {
  return WIDGET_REGISTRY.get(type);
}

/**
 * Get widgets by metadata category.
 */
export function getWidgetsByCategory(category: WidgetCategory) {
  return registryEntries.filter((entry) => entry.metadata.category === category);
}

/**
 * Get widgets accessible to the given trust / permission level.
 */
export function getAccessibleWidgets(userLevel: 'admin' | 'T3' | 'T2' | 'T1') {
  const levelHierarchy: Record<string, number> = { admin: 4, T3: 3, T2: 2, T1: 1 };
  const userLevelNum = levelHierarchy[userLevel] ?? 1;

  return registryEntries.filter((entry) => {
    const requiredLevel = entry.metadata.requiredPermission;
    if (!requiredLevel) {
      return true;
    }

    const requiredLevelNum = levelHierarchy[requiredLevel] ?? 1;
    return userLevelNum >= requiredLevelNum;
  });
}

/**
 * Create a widget configuration from the registry defaults.
 */
export function createWidgetConfig(type: WidgetType, overrides?: WidgetConfigOverrides): WidgetConfig {
  const entry = getWidget(type);
  if (!entry) {
    throw new Error(`Widget type "${type}" is not registered.`);
  }
  return entry.createConfig(overrides);
}

/**
 * Generate unique widget ID.
 */
export function generateWidgetId(type: WidgetType): string {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Convenience accessor for all entries.
 */
export function listWidgets(): WidgetRegistryEntry[] {
  return registryEntries;
}

