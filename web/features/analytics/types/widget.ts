/**
 * Widget System Types
 *
 * Comprehensive type definitions for the analytics widget system.
 * Supports drag-and-drop, customization, and persistence.
 *
 * Created: November 5, 2025
 * Status: PRODUCTION
 */

import type { Layout as GridLayout } from 'react-grid-layout';

// ============================================================================
// WIDGET TYPES
// ============================================================================

export type WidgetType =
  | 'trends'
  | 'demographics'
  | 'temporal'
  | 'trust-tiers'
  | 'poll-heatmap'
  | 'district-heatmap'
  | 'custom'
  // Registry-backed widget types
  | 'trends-chart'
  | 'demographics-chart'
  | 'temporal-analysis'
  | 'trust-tier-comparison'
  | 'kpi-card'
  | 'funnel'
  | 'custom-table'
  | 'custom-query'
  | 'pwa-offline-queue'
  | 'election-notifications';

export type WidgetSize = {
  w: number; // Width in grid units (12-column grid)
  h: number; // Height in grid units (1 unit = ~100px)
};

export type WidgetPosition = {
  x: number; // X position in grid units
  y: number; // Y position in grid units
};

// ============================================================================
// WIDGET CONFIGURATION
// ============================================================================

export type BaseWidgetConfig = {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  icon?: string;
  enabled: boolean;
};

export type WidgetLayoutConfig = BaseWidgetConfig & {
  position: WidgetPosition;
  size: WidgetSize;
  minSize?: WidgetSize;
  maxSize?: WidgetSize;
  static?: boolean; // Cannot be moved/resized
};

export type WidgetSettings = {
  // Common settings
  refreshInterval?: number; // Auto-refresh in seconds
  dateRange?: {
    start: Date;
    end: Date;
  };

  // Widget-specific settings
  filters?: Record<string, unknown>;
  displayOptions?: Record<string, unknown>;
  customizations?: Record<string, unknown>;
};

export type WidgetConfig = WidgetLayoutConfig & {
  settings: WidgetSettings;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================================================
// DASHBOARD LAYOUT
// ============================================================================

export type Breakpoint = 'lg' | 'md' | 'sm' | 'xs';

export type DashboardLayout = {
  id: string;
  userId: string;
  name: string;
  description?: string;
  widgets: WidgetConfig[];

  // Responsive layouts for different breakpoints
  breakpoints?: {
    lg?: GridLayout[];
    md?: GridLayout[];
    sm?: GridLayout[];
    xs?: GridLayout[];
  };

  isDefault: boolean;
  isPreset: boolean; // System preset vs user-created
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// WIDGET METADATA
// ============================================================================

export type WidgetCategory =
  | 'overview'
  | 'detailed'
  | 'engagement'
  | 'geographic'
  | 'polls'
  | 'users'
  | 'districts'
  | 'general';

export type WidgetMetadata = {
  type: WidgetType;
  name: string;
  description: string;
  icon: string;
  category: WidgetCategory;

  // Default configuration
  defaultSize: WidgetSize;
  minSize: WidgetSize;
  maxSize?: WidgetSize;

  // Capabilities
  capabilities: {
    resizable: boolean;
    draggable: boolean;
    configurable: boolean;
    exportable: boolean;
  };

  // Optional metadata for registry integrations
  dataSource?: string;
  supportedExports?: string[];
  requiredPermission?: string;
  tags?: string[];

  // Data requirements
  dataRequirements?: {
    adminOnly?: boolean;
    permissions?: string[];
    features?: string[];
  };
};

// ============================================================================
// WIDGET REGISTRY
// ============================================================================

export type WidgetConfigOverrides = Partial<
  Omit<WidgetConfig, 'type' | 'position' | 'size' | 'settings'>
> & {
  position?: Partial<WidgetPosition>;
  size?: Partial<WidgetSize>;
  settings?: Partial<WidgetSettings>;
};

export type WidgetRegistryEntry = {
  metadata: WidgetMetadata;
  component: React.ComponentType<WidgetProps>;
  configComponent?: React.ComponentType<WidgetConfigProps>;
  createConfig: (overrides?: WidgetConfigOverrides) => WidgetConfig;
};

export type WidgetRegistry = Map<WidgetType, WidgetRegistryEntry>;

// ============================================================================
// WIDGET COMPONENT PROPS
// ============================================================================

export type WidgetProps = {
  id: string;
  config: WidgetConfig;
  onConfigChange?: (config: Partial<WidgetConfig>) => void;
  onRemove?: () => void;
  isLoading?: boolean;
  error?: Error;
}

export type WidgetConfigProps = {
  config: WidgetConfig;
  onChange: (settings: Partial<WidgetSettings>) => void;
  onSave: () => void;
  onCancel: () => void;
}

// ============================================================================
// WIDGET ACTIONS
// ============================================================================

export type WidgetAction =
  | { type: 'ADD_WIDGET'; payload: WidgetConfig }
  | { type: 'REMOVE_WIDGET'; payload: { id: string } }
  | { type: 'UPDATE_WIDGET'; payload: { id: string; changes: Partial<WidgetConfig> } }
  | { type: 'MOVE_WIDGET'; payload: { id: string; position: WidgetPosition } }
  | { type: 'RESIZE_WIDGET'; payload: { id: string; size: WidgetSize } }
  | { type: 'LOAD_LAYOUT'; payload: DashboardLayout }
  | { type: 'SAVE_LAYOUT'; payload: Partial<DashboardLayout> }
  | { type: 'RESET_LAYOUT' }
  | { type: 'APPLY_PRESET'; payload: { presetId: string } };

// ============================================================================
// WIDGET STATE
// ============================================================================

export type WidgetState = {
  layouts: DashboardLayout[];
  currentLayout: DashboardLayout | null;
  currentLayoutChecksum: string | null;
  widgets: Map<string, WidgetConfig>;

  // UI state
  isEditing: boolean;
  selectedWidgetId: string | null;
  isDragging: boolean;
  keyboardMode: 'idle' | 'move' | 'resize';

  // History for undo/redo
  history: DashboardLayout[];
  historyIndex: number;
}

// ============================================================================
// LAYOUT PRESETS
// ============================================================================

export type LayoutPreset = {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  layout: Omit<DashboardLayout, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
  category: 'executive' | 'detailed' | 'mobile' | 'custom';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type WidgetError = {
  widgetId: string;
  error: Error;
  timestamp: Date;
};

export type WidgetLoadingState = {
  widgetId: string;
  isLoading: boolean;
};

// ============================================================================
// BACKWARD COMPATIBILITY TYPES
// ============================================================================

export type WidgetComponent = React.ComponentType<WidgetProps>;
export type DashboardConfig = DashboardLayout;
export type WidgetDataResponse<Data = unknown> = {
  ok: boolean;
  data: Data;
  cached?: boolean;
  error?: string;
};

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type {
  GridLayout // Re-export from react-grid-layout
};
