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
  // OLD widget registry types (for backward compatibility)
  | 'trends-chart'
  | 'demographics-chart'
  | 'temporal-analysis'
  | 'trust-tier-comparison'
  | 'kpi-card'
  | 'custom-table'
  | 'custom-query';

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
}

export type WidgetLayoutConfig = {
  position: WidgetPosition;
  size: WidgetSize;
  minSize?: WidgetSize;
  maxSize?: WidgetSize;
  static?: boolean; // Cannot be moved/resized
} & BaseWidgetConfig

export type WidgetSettings = {
  // Common settings
  refreshInterval?: number; // Auto-refresh in seconds
  dateRange?: {
    start: Date;
    end: Date;
  };
  
  // Widget-specific settings
  filters?: Record<string, any>;
  displayOptions?: Record<string, any>;
  customizations?: Record<string, any>;
}

export type WidgetConfig = {
  settings: WidgetSettings;
  createdAt: Date;
  updatedAt: Date;
} & WidgetLayoutConfig

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

export type WidgetMetadata = {
  type: WidgetType;
  name: string;
  description: string;
  icon: string;
  category: 'overview' | 'detailed' | 'engagement' | 'geographic';
  
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
  
  // Data requirements
  dataRequirements?: {
    adminOnly?: boolean;
    permissions?: string[];
    features?: string[];
  };
}

// ============================================================================
// WIDGET REGISTRY
// ============================================================================

export type WidgetRegistryEntry = {
  metadata: WidgetMetadata;
  component: React.ComponentType<WidgetProps>;
  configComponent?: React.ComponentType<WidgetConfigProps>;
}

export type WidgetRegistry = Map<WidgetType, WidgetRegistryEntry>;

// For the OLD widget registry system that uses a plain object (Record)
export type WidgetRegistration = {
  type: WidgetType;
  name: string;
  description: string;
  component: any;
  icon: string;
  defaultConfig: any;
  dataSource: string;
  supportedExports: string[];
  requiredPermission: string;
  category: string;
};

export type WidgetRegistryType = Partial<Record<WidgetType, WidgetRegistration>>;

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
  widgets: Map<string, WidgetConfig>;
  
  // UI state
  isEditing: boolean;
  selectedWidgetId: string | null;
  isDragging: boolean;
  
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

export type WidgetComponent<TData = any> = React.ComponentType<WidgetProps>;
export type DashboardConfig = DashboardLayout;
export type WidgetDataResponse<TData = any> = {
  ok: boolean;
  data: TData;
  cached?: boolean;
  error?: string;
};

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type {
  GridLayout // Re-export from react-grid-layout
};
