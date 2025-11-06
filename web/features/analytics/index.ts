/**
 * Analytics Feature Exports
 * 
 * Central export point for analytics components, types, and utilities.
 * 
 * Created: November 5, 2025
 * Consolidated: November 5, 2025 - All charts integrated into EnhancedAnalyticsDashboard
 * Status: ✅ Consolidated analytics system
 */

// Main Dashboard (consolidated)
export { EnhancedAnalyticsDashboard } from './components/EnhancedAnalyticsDashboard';
export { default as EnhancedAnalyticsDashboardDefault } from './components/EnhancedAnalyticsDashboard';

// Individual Chart Components (for reuse if needed)
export { default as TrendsChart } from './components/TrendsChart';
export { default as DemographicsChart } from './components/DemographicsChart';
export { default as TemporalAnalysisChart } from './components/TemporalAnalysisChart';
export { default as TrustTierComparisonChart } from './components/TrustTierComparisonChart';
export { default as PollHeatmap } from './components/PollHeatmap';

// Types
export type {
  WidgetType,
  WidgetSize,
  WidgetConfig,
  WidgetProps,
  WidgetComponent,
  WidgetRegistration,
  DashboardConfig,
  WidgetDataResponse,
  QueryBuilderConfig,
  PermissionLevel,
  ExportFormat
} from './types/widget';

// Widget Registry
export { 
  WIDGET_REGISTRY,
  getWidget,
  getWidgetsByCategory,
  getAccessibleWidgets,
  generateWidgetId
} from './lib/widgetRegistry';
