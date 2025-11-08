/**
 * Widget Dashboard Component
 * 
 * Main container for the customizable widget-based analytics dashboard.
 * Features:
 * - Drag and drop widgets
 * - Resizable widgets
 * - Saveable layouts
 * - Preset layouts
 * - Widget configuration
 * - Responsive design
 * 
 * Created: November 5, 2025
 * Status: PRODUCTION
 */

'use client';

import { 
  Edit, 
  Save, 
  X, 
  Layout, 
  Plus,
  Undo,
  Redo,
  Settings
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import type { Layout as GridLayout } from 'react-grid-layout';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/utils/logger';

import { useWidgetKeyboardShortcuts } from '../../hooks/useWidgetKeyboardShortcuts';
import { getWidget } from '../../lib/widgetRegistry';
import { getPreset, getAllPresets } from '../../lib/widgetPresets';
import { useWidgetStore, selectIsEditing, selectAllWidgets } from '../../stores/widgetStore';
import type { WidgetConfig } from '../../types/widget';

import { WidgetGrid } from './WidgetGrid';
import { WidgetRenderer } from './WidgetRenderer';
import { WidgetSelector } from './WidgetSelector';
// ============================================================================
// WIDGET DASHBOARD PROPS
// ============================================================================

export type WidgetDashboardProps = {
  userId: string;
  isAdmin?: boolean;
  className?: string;
}

// ============================================================================
// WIDGET DASHBOARD COMPONENT
// ============================================================================

export const WidgetDashboard: React.FC<WidgetDashboardProps> = ({
  userId,
  isAdmin = false,
  className = '',
}) => {
  // Store state
  const isEditing = useWidgetStore(selectIsEditing);
  const widgets = useWidgetStore(selectAllWidgets);
  const setEditing = useWidgetStore((state) => state.setEditing);
  const loadLayout = useWidgetStore((state) => state.loadLayout);
  const saveLayout = useWidgetStore((state) => state.saveLayout);
  const undo = useWidgetStore((state) => state.undo);
  const redo = useWidgetStore((state) => state.redo);
  const canUndo = useWidgetStore((state) => state.canUndo);
  const canRedo = useWidgetStore((state) => state.canRedo);

  // Local state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    // Load user's saved layout or default preset
    const loadUserLayout = async () => {
      try {
        const response = await fetch(`/api/analytics/dashboard/layout?userId=${userId}`);
        
        if (response.ok) {
          const layout = await response.json();
          loadLayout(layout);
          logger.info('User layout loaded', { userId, widgetCount: layout.widgets?.length });
        } else {
          // No saved layout, load default preset
          const defaultPreset = getPreset('default');
          if (defaultPreset) {
            const layout = {
              ...defaultPreset.layout,
              id: `user-${userId}-default`,
              userId,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            loadLayout(layout);
            logger.info('Default preset loaded', { userId });
          }
        }
      } catch (error) {
        logger.error('Failed to load user layout', { error, userId });
        // Load default preset as fallback
        const defaultPreset = getPreset('default');
        if (defaultPreset) {
          const layout = {
            ...defaultPreset.layout,
            id: `user-${userId}-default`,
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          loadLayout(layout);
        }
      }
    };

    loadUserLayout();
  }, [userId, loadLayout]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleSaveLayout = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      await saveLayout({ userId });
      logger.info('Layout saved successfully', { userId });
      
      // Exit edit mode after saving
      setEditing(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save layout';
      setSaveError(errorMessage);
      logger.error('Failed to save layout', { error, userId });
    } finally {
      setIsSaving(false);
    }
  }, [userId, saveLayout, setEditing]);

  const handleCancelEdit = useCallback(() => {
    setEditing(false);
    setSaveError(null);
  }, [setEditing]);

  // Keyboard shortcuts (after handlers are defined)
  useWidgetKeyboardShortcuts(isEditing, handleSaveLayout, handleCancelEdit);

  const handleApplyPreset = useCallback((presetId: string) => {
    const preset = getPreset(presetId);
    if (preset) {
      const layout = {
        ...preset.layout,
        id: `user-${userId}-${presetId}`,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      loadLayout(layout);
      setShowPresets(false);
      logger.info('Preset applied', { presetId, userId });
    }
  }, [userId, loadLayout]);

  const handleLayoutChange = useCallback((
    layout: GridLayout[],
    _layouts: Record<string, GridLayout[]>
  ) => {
    // Update widget positions and sizes based on grid layout changes
    logger.debug('Layout changed', { layoutCount: layout.length });
  }, []);

  const renderWidget = useCallback((widget: WidgetConfig) => {
    const registryEntry = getWidget(widget.type);

    if (!registryEntry) {
      logger.warn('Unknown widget type', { type: widget.type });
      return null;
    }

    const WidgetComponent = registryEntry.component;

    return (
      <div
        key={widget.id}
        data-grid={{
          i: widget.id,
          x: widget.position.x,
          y: widget.position.y,
          w: widget.size.w,
          h: widget.size.h,
          minW: widget.minSize?.w ?? registryEntry.metadata.minSize.w,
          minH: widget.minSize?.h ?? registryEntry.metadata.minSize.h,
          maxW: widget.maxSize?.w ?? registryEntry.metadata.maxSize?.w,
          maxH: widget.maxSize?.h ?? registryEntry.metadata.maxSize?.h,
        }}
      >
        <WidgetRenderer config={widget} isEditing={isEditing}>
          <WidgetComponent id={widget.id} config={widget} />
        </WidgetRenderer>
      </div>
    );
  }, [isEditing]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`widget-dashboard ${className}`}>
      {/* Toolbar */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
            {isEditing && (
              <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">
                Editing
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                {/* Undo/Redo */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={undo}
                  disabled={!canUndo()}
                  title="Undo (Cmd+Z)"
                >
                  <Undo className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={redo}
                  disabled={!canRedo()}
                  title="Redo (Cmd+Shift+Z)"
                >
                  <Redo className="w-4 h-4" />
                </Button>

                {/* Presets */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPresets(!showPresets)}
                >
                  <Layout className="w-4 h-4 mr-2" />
                  Presets
                </Button>

                {/* Add Widget */}
                <WidgetSelector
                  trigger={
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Widget
                    </Button>
                  }
                />

                {/* Save */}
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveLayout}
                  disabled={isSaving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>

                {/* Cancel */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <>
                {/* Settings */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {/* TODO: Open settings */}}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>

                {/* Edit */}
                {isAdmin && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setEditing(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Layout
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Preset Selector */}
        {showPresets && isEditing && (
          <div className="p-4 border-t bg-muted/50">
            <div className="flex flex-wrap gap-2">
              {getAllPresets().map((preset) => (
                <Button
                  key={preset.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyPreset(preset.id)}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {saveError && (
          <Alert variant="destructive" className="mx-4 my-2">
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Widget Grid */}
      <div className="p-4">
        {widgets.length > 0 ? (
          <WidgetGrid
            widgets={widgets}
            isEditing={isEditing}
            onLayoutChange={handleLayoutChange}
          >
            {widgets.map(renderWidget)}
          </WidgetGrid>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg">
            <Layout className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Widgets Added</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add widgets to create your custom analytics dashboard
            </p>
            {isAdmin && (
              <Button onClick={() => setEditing(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Start Editing
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts (when editing) */}
      {isEditing && (
        <div className="fixed bottom-4 left-4 p-3 bg-background/95 border rounded-lg shadow-lg text-xs space-y-1 max-w-xs">
          <div className="font-semibold mb-2">Keyboard Shortcuts</div>
          <div><kbd>Cmd/Ctrl + Z</kbd> - Undo</div>
          <div><kbd>Cmd/Ctrl + Shift + Z</kbd> - Redo</div>
          <div><kbd>Cmd/Ctrl + S</kbd> - Save layout</div>
          <div><kbd>Esc</kbd> - Cancel editing</div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXPORT
// ============================================================================

export default WidgetDashboard;

