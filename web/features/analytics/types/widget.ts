/**
 * Widget System Types
 * 
 * Core type definitions for the modular analytics widget system.
 * Every widget follows these interfaces for consistency and flexibility.
 * 
 * Created: November 5, 2025
 * Status: ✅ Foundation for customizable analytics
 */

import { ReactElement } from 'react';

/**
 * Widget Types - Add new types here as you create new widgets
 */
export type WidgetType =
  | 'poll-heatmap'
  | 'district-heatmap'
  | 'trends-chart'
  | 'demographics-chart'
  | 'temporal-analysis'
  | 'trust-tier-comparison'
  | 'kpi-card'
  | 'custom-table'
  | 'custom-query';

/**
 * Widget Size - Determines grid layout size
 */
export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

/**
 * Permission Level - Who can access this widget
 */
export type PermissionLevel = 'admin' | 'T3' | 'T2' | 'T1' | 'public';

/**
 * Export Formats
 */
export type ExportFormat = 'csv' | 'json' | 'png' | 'pdf';

/**
 * Widget Configuration
 * Stored in database, defines how widget behaves
 */
export type WidgetConfig = {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  size: WidgetSize;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  filters: Record<string, any>;
  refreshInterval?: number; // Auto-refresh in milliseconds
  exportFormats: ExportFormat[];
  requiresPermission: PermissionLevel;
  customSettings?: Record<string, any>; // Widget-specific settings
  created_at?: string;
  updated_at?: string;
};

/**
 * Widget Props Interface
 * Every widget component must accept these props
 */
export interface WidgetProps<TData = any> {
  config: WidgetConfig;
  data?: TData;
  isLoading?: boolean;
  error?: string | null;
  onConfigChange: (config: Partial<WidgetConfig>) => void;
  onExport: (format: ExportFormat) => Promise<void>;
  onRefresh: () => Promise<void>;
  className?: string;
}

/**
 * Widget Component Type
 * Type signature for widget components
 */
export type WidgetComponent<TData = any> = (
  props: WidgetProps<TData>
) => ReactElement;

/**
 * Widget Registration
 * Metadata about each widget type for the registry
 */
export type WidgetRegistration = {
  type: WidgetType;
  name: string;
  description: string;
  component: WidgetComponent;
  icon?: string;
  defaultConfig: Partial<WidgetConfig>;
  dataSource: string; // Which API endpoint
  supportedExports: ExportFormat[];
  requiredPermission: PermissionLevel;
  category: 'polls' | 'users' | 'districts' | 'general';
};

/**
 * Dashboard Configuration
 * Stores complete dashboard layout and widgets
 */
export type DashboardConfig = {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  widgets: WidgetConfig[];
  layout: {
    cols: number;
    rowHeight: number;
    breakpoints: Record<string, number>;
  };
  is_template: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * Widget Data Response
 * Standard API response format for widget data
 */
export type WidgetDataResponse<TData = any> = {
  ok: boolean;
  data: TData;
  cached: boolean;
  cache_expires_at?: string;
  query_time_ms: number;
  error?: string;
};

/**
 * Query Builder Types
 * For custom query widgets
 */
export type QueryBuilderConfig = {
  dataSource: 'polls' | 'votes' | 'users' | 'civic_actions';
  fields: string[];
  filters: QueryFilter[];
  groupBy?: string[];
  aggregations?: Aggregation[];
  orderBy?: OrderBy[];
  limit?: number;
  offset?: number;
};

export type QueryFilter = {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'between' | 'in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
};

export type Aggregation = {
  function: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'distinct';
  field: string;
  alias: string;
};

export type OrderBy = {
  field: string;
  direction: 'asc' | 'desc';
};

/**
 * Widget Registry Entry
 * Maps widget type to its metadata
 */
export type WidgetRegistry = Record<WidgetType, WidgetRegistration>;

