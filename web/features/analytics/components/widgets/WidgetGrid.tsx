/**
 * Widget Grid Component
 * 
 * Implements drag-and-drop grid layout using react-grid-layout.
 * Features:
 * - Responsive breakpoints
 * - Drag and drop
 * - Resize widgets
 * - Touch support
 * - Smooth animations
 * 
 * Created: November 5, 2025
 * Status: PRODUCTION
 */

'use client';

import React, { useCallback, useMemo } from 'react';
import GridLayout, { Layout as GridLayoutType, Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import type { WidgetConfig, Breakpoint } from '../../types/widget';

// Wrap GridLayout with WidthProvider for automatic width detection
const ResponsiveGridLayout = WidthProvider(Responsive);

// ============================================================================
// GRID CONFIGURATION
// ============================================================================

const GRID_CONFIG = {
  // Responsive breakpoints (in pixels)
  breakpoints: {
    lg: 1200,
    md: 996,
    sm: 768,
    xs: 480,
  },
  
  // Number of columns for each breakpoint
  cols: {
    lg: 12,
    md: 10,
    sm: 6,
    xs: 4,
  },
  
  // Row height in pixels
  rowHeight: 100,
  
  // Margins between widgets [x, y]
  margin: [16, 16] as [number, number],
  
  // Container padding [x, y]
  containerPadding: [16, 16] as [number, number],
  
  // Compact type (vertical or horizontal)
  compactType: 'vertical' as const,
  
  // Prevent collision
  preventCollision: false,
};

// ============================================================================
// WIDGET GRID PROPS
// ============================================================================

export interface WidgetGridProps {
  widgets: WidgetConfig[];
  children: React.ReactNode;
  isEditing?: boolean;
  onLayoutChange?: (layout: GridLayoutType[], layouts: Record<Breakpoint, GridLayoutType[]>) => void;
  onDragStart?: (layout: GridLayoutType[], oldItem: GridLayoutType, newItem: GridLayoutType) => void;
  onDragStop?: (layout: GridLayoutType[], oldItem: GridLayoutType, newItem: GridLayoutType) => void;
  onResizeStart?: (layout: GridLayoutType[], oldItem: GridLayoutType, newItem: GridLayoutType) => void;
  onResizeStop?: (layout: GridLayoutType[], oldItem: GridLayoutType, newItem: GridLayoutType) => void;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert WidgetConfig to react-grid-layout Layout
 */
const widgetToLayout = (widget: WidgetConfig): GridLayoutType => ({
  i: widget.id,
  x: widget.position.x,
  y: widget.position.y,
  w: widget.size.w,
  h: widget.size.h,
  minW: widget.minSize?.w,
  minH: widget.minSize?.h,
  maxW: widget.maxSize?.w,
  maxH: widget.maxSize?.h,
  static: widget.static || false,
  isDraggable: widget.enabled,
  isResizable: widget.enabled,
});

/**
 * Generate responsive layouts for all breakpoints
 */
const generateResponsiveLayouts = (
  widgets: WidgetConfig[]
): Record<Breakpoint, GridLayoutType[]> => {
  const baseLayout = widgets.map(widgetToLayout);
  
  return {
    lg: baseLayout,
    md: baseLayout.map(item => ({
      ...item,
      // Adjust for medium screens
      w: Math.min(item.w, GRID_CONFIG.cols.md),
      x: item.x % GRID_CONFIG.cols.md,
    })),
    sm: baseLayout.map(item => ({
      ...item,
      // Adjust for small screens - stack widgets
      w: GRID_CONFIG.cols.sm,
      x: 0,
    })),
    xs: baseLayout.map(item => ({
      ...item,
      // Full width on mobile
      w: GRID_CONFIG.cols.xs,
      x: 0,
    })),
  };
};

// ============================================================================
// WIDGET GRID COMPONENT
// ============================================================================

export const WidgetGrid: React.FC<WidgetGridProps> = ({
  widgets,
  children,
  isEditing = false,
  onLayoutChange,
  onDragStart,
  onDragStop,
  onResizeStart,
  onResizeStop,
  className = '',
}) => {
  // Generate layouts from widgets
  const layouts = useMemo(
    () => generateResponsiveLayouts(widgets),
    [widgets]
  );

  // Handle layout changes
  const handleLayoutChange = useCallback(
    (currentLayout: GridLayoutType[], allLayouts: Record<string, GridLayoutType[]>) => {
      if (onLayoutChange) {
        // Type assertion for breakpoints
        const typedLayouts = allLayouts as Record<Breakpoint, GridLayoutType[]>;
        onLayoutChange(currentLayout, typedLayouts);
      }
    },
    [onLayoutChange]
  );

  // Handle drag start
  const handleDragStart = useCallback(
    (layout: GridLayoutType[], oldItem: GridLayoutType, newItem: GridLayoutType, placeholder: GridLayoutType, event: MouseEvent, element: HTMLElement) => {
      onDragStart?.(layout, oldItem, newItem);
    },
    [onDragStart]
  );

  // Handle drag stop
  const handleDragStop = useCallback(
    (layout: GridLayoutType[], oldItem: GridLayoutType, newItem: GridLayoutType, placeholder: GridLayoutType, event: MouseEvent, element: HTMLElement) => {
      onDragStop?.(layout, oldItem, newItem);
    },
    [onDragStop]
  );

  // Handle resize start
  const handleResizeStart = useCallback(
    (layout: GridLayoutType[], oldItem: GridLayoutType, newItem: GridLayoutType, placeholder: GridLayoutType, event: MouseEvent, element: HTMLElement) => {
      onResizeStart?.(layout, oldItem, newItem);
    },
    [onResizeStart]
  );

  // Handle resize stop
  const handleResizeStop = useCallback(
    (layout: GridLayoutType[], oldItem: GridLayoutType, newItem: GridLayoutType, placeholder: GridLayoutType, event: MouseEvent, element: HTMLElement) => {
      onResizeStop?.(layout, oldItem, newItem);
    },
    [onResizeStop]
  );

  return (
    <div className={`widget-grid-container ${className}`}>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={GRID_CONFIG.breakpoints}
        cols={GRID_CONFIG.cols}
        rowHeight={GRID_CONFIG.rowHeight}
        margin={GRID_CONFIG.margin}
        containerPadding={GRID_CONFIG.containerPadding}
        compactType={GRID_CONFIG.compactType}
        preventCollision={GRID_CONFIG.preventCollision}
        
        // Editing controls
        isDraggable={isEditing}
        isResizable={isEditing}
        
        // Event handlers
        onLayoutChange={handleLayoutChange}
        onDragStart={handleDragStart}
        onDragStop={handleDragStop}
        onResizeStart={handleResizeStart}
        onResizeStop={handleResizeStop}
        
        // Touch support
        isBounded={false}
        useCSSTransforms={true}
        
        // Drag handle (use .drag-handle class in child components)
        draggableHandle=".drag-handle"
      >
        {children}
      </ResponsiveGridLayout>

      {/* Custom Styles */}
      <style jsx global>{`
        .widget-grid-container {
          width: 100%;
          min-height: 100vh;
        }

        .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top, width, height;
        }

        .react-grid-item.cssTransforms {
          transition-property: transform, width, height;
        }

        .react-grid-item.resizing {
          transition: none;
          z-index: 100;
        }

        .react-grid-item.react-draggable-dragging {
          transition: none;
          z-index: 100;
          opacity: 0.9;
        }

        .react-grid-item.dropping {
          visibility: hidden;
        }

        .react-grid-item.react-grid-placeholder {
          background: hsl(var(--primary) / 0.2);
          opacity: 0.2;
          transition-duration: 100ms;
          z-index: 2;
          border-radius: 8px;
          border: 2px dashed hsl(var(--primary));
        }

        .react-grid-item > .react-resizable-handle {
          position: absolute;
          width: 20px;
          height: 20px;
        }

        .react-grid-item > .react-resizable-handle::after {
          content: "";
          position: absolute;
          right: 3px;
          bottom: 3px;
          width: 5px;
          height: 5px;
          border-right: 2px solid hsl(var(--border));
          border-bottom: 2px solid hsl(var(--border));
        }

        .react-resizable-hide > .react-resizable-handle {
          display: none;
        }

        /* Resize handle visibility - only show when editing */
        .react-grid-item:not(.react-grid-placeholder) > .react-resizable-handle {
          opacity: 0;
          transition: opacity 200ms ease;
        }

        .react-grid-item:hover > .react-resizable-handle,
        .react-grid-item.resizing > .react-resizable-handle {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// EXPORT
// ============================================================================

export default WidgetGrid;

