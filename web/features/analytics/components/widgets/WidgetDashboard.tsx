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
  Settings,
  Info,
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useRef, useId, useMemo } from 'react';
import type { Layout as GridLayout } from 'react-grid-layout';
import type { StoreApi } from 'zustand';
import { shallow } from 'zustand/shallow';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/useI18n';
import ScreenReaderSupport from '@/lib/accessibility/screen-reader';
import type { WidgetStore } from '@/lib/stores/widgetStore';
import {
  widgetStore,
  WidgetStoreProvider,
  useWidgetStoreApi,
  useWidgetStoreScoped,
  selectIsEditing,
  selectAllWidgets,
  useWidgetStoreActions,
} from '@/lib/stores/widgetStore';
import { logger } from '@/lib/utils/logger';

import { useWidgetKeyboardShortcuts } from '../../hooks/useWidgetKeyboardShortcuts';
import { getPreset, getAllPresets } from '../../lib/widgetPresets';
import { getWidget } from '../../lib/widgetRegistry';
import type { DashboardLayout, WidgetConfig, WidgetState } from '../../types/widget';

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
  initialLayout?: DashboardLayout;
  startInEditMode?: boolean;
  initialSelectedWidgetId?: string | null;
  initialKeyboardMode?: 'idle' | 'move' | 'resize';
  store?: StoreApi<WidgetStore>;
};

// ============================================================================
// WIDGET DASHBOARD COMPONENT
// ============================================================================

const cloneLayout = (layout: DashboardLayout): DashboardLayout =>
  JSON.parse(JSON.stringify(layout)) as DashboardLayout;

type WidgetDashboardInnerProps = Omit<WidgetDashboardProps, 'store'>;

export const WidgetDashboard: React.FC<WidgetDashboardProps> = ({ store, ...rest }) => {
  const storeApi = useMemo(() => store ?? widgetStore, [store]);

  return (
    <WidgetStoreProvider store={storeApi}>
      <WidgetDashboardInner {...rest} />
    </WidgetStoreProvider>
  );
};

const WidgetDashboardInner: React.FC<WidgetDashboardInnerProps> = ({
  userId,
  isAdmin = false,
  className = '',
  initialLayout,
  startInEditMode = false,
  initialSelectedWidgetId,
  initialKeyboardMode,
}) => {
  const { t } = useI18n();
  const storeApi = useWidgetStoreApi();
  const isEditing = useWidgetStoreScoped(selectIsEditing);
  const widgets = useWidgetStoreScoped(selectAllWidgets, shallow);
  const canUndo = useWidgetStoreScoped((state) => state.canUndo);
  const canRedo = useWidgetStoreScoped((state) => state.canRedo);
  const {
    setEditing,
    setSelectedWidget,
    setKeyboardMode,
    loadLayout,
    initializeLayout,
    saveLayout,
    undo,
    redo,
  } = useWidgetStoreActions(storeApi);
  const hasBootstrappedRef = useRef(false);

  const setSelectedWidgetIfChanged = useCallback(
    (widgetId: string | null) => {
      if (storeApi.getState().selectedWidgetId !== widgetId) {
        logger.debug('[WidgetDashboard] setSelectedWidgetIfChanged', {
          from: storeApi.getState().selectedWidgetId,
          to: widgetId,
        });
        setSelectedWidget(widgetId);
      }
    },
    [setSelectedWidget, storeApi],
  );

  const setKeyboardModeIfChanged = useCallback(
    (mode: WidgetState['keyboardMode']) => {
      if (storeApi.getState().keyboardMode !== mode) {
        logger.debug('[WidgetDashboard] setKeyboardModeIfChanged', {
          from: storeApi.getState().keyboardMode,
          to: mode,
        });
        setKeyboardMode(mode);
      }
    },
    [setKeyboardMode, storeApi],
  );

  const setEditingIfChanged = useCallback(
    (value: boolean) => {
      if (storeApi.getState().isEditing !== value) {
        logger.debug('[WidgetDashboard] setEditingIfChanged', {
          from: storeApi.getState().isEditing,
          to: value,
        });
        setEditing(value);
      }
    },
    [setEditing, storeApi],
  );

  // Local state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<{ gridDensity: 'comfortable' | 'compact'; autoRefreshSeconds: number }>({
    gridDensity: 'comfortable',
    autoRefreshSeconds: 0
  });
  const shortcutHelpId = useId();

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    logger.debug('[WidgetDashboard] bootstrap effect start', {
      hasBootstrapped: hasBootstrappedRef.current,
      currentLayoutChecksum: storeApi.getState().currentLayoutChecksum,
      widgetsSize: storeApi.getState().widgets.size,
    });

    if (hasBootstrappedRef.current) {
      return;
    }

    hasBootstrappedRef.current = true;
    let isActive = true;

    const schedule = (fn: () => void) => {
      Promise.resolve().then(() => {
        if (isActive) {
          fn();
        }
      });
    };

    const existingLayout = storeApi.getState().currentLayout;
    if (existingLayout) {
      const defaultWidgetId =
        initialSelectedWidgetId ?? existingLayout.widgets[0]?.id ?? null;
      schedule(() => {
        logger.debug('[WidgetDashboard] bootstrap using existing layout', {
          layoutId: existingLayout.id,
          selectedWidgetId: defaultWidgetId,
        });
        setSelectedWidgetIfChanged(defaultWidgetId);
        setKeyboardModeIfChanged(initialKeyboardMode ?? 'idle');
        if (startInEditMode) {
          setEditingIfChanged(true);
        }
      });
      return () => {
        isActive = false;
      };
    }

    if (initialLayout) {
      const clonedLayout = cloneLayout(initialLayout);
      schedule(() => {
        logger.debug('[WidgetDashboard] bootstrap applying initialLayout prop', {
          layoutId: clonedLayout.id,
        });
        initializeLayout(clonedLayout, {
          selectedWidgetId: initialSelectedWidgetId ?? clonedLayout.widgets[0]?.id ?? null,
          startInEditMode,
          keyboardMode: initialKeyboardMode ?? 'idle',
        });
      });
      return;
    }

    const loadUserLayout = async () => {
      try {
        const response = await fetch(`/api/analytics/dashboard/layout?userId=${userId}`);

        if (response.ok) {
          const layout = await response.json();
          schedule(() => {
            logger.debug('[WidgetDashboard] bootstrap fetched user layout', {
              layoutId: layout.id,
            });
            initializeLayout(layout, {
              selectedWidgetId: initialSelectedWidgetId ?? layout.widgets?.[0]?.id ?? null,
              startInEditMode,
              keyboardMode: initialKeyboardMode ?? 'idle',
            });
          });
          logger.info('User layout loaded', { userId, widgetCount: layout.widgets?.length });
          return;
        }

          const defaultPreset = getPreset('default');
          if (defaultPreset) {
            const layout = {
              ...defaultPreset.layout,
              id: `user-${userId}-default`,
              userId,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          schedule(() => {
            logger.debug('[WidgetDashboard] bootstrap applying default preset layout', {
              layoutId: layout.id,
            });
            initializeLayout(layout, {
              selectedWidgetId: layout.widgets?.[0]?.id ?? null,
              startInEditMode,
              keyboardMode: initialKeyboardMode ?? 'idle',
            });
          });
            logger.info('Default preset loaded', { userId });
        } else {
          schedule(() => {
            logger.debug('[WidgetDashboard] bootstrap falling back to empty layout');
            initializeLayout(null, {
              startInEditMode,
              keyboardMode: initialKeyboardMode ?? 'idle',
            });
          });
        }
      } catch (error) {
        logger.error('Failed to load user layout', { error, userId });
        const defaultPreset = getPreset('default');
        if (defaultPreset) {
          const layout = {
            ...defaultPreset.layout,
            id: `user-${userId}-default`,
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          schedule(() => {
            logger.debug('[WidgetDashboard] bootstrap applying preset after error', {
              layoutId: layout.id,
            });
            initializeLayout(layout, {
              selectedWidgetId: layout.widgets?.[0]?.id ?? null,
              startInEditMode,
              keyboardMode: initialKeyboardMode ?? 'idle',
            });
          });
        } else {
          schedule(() => {
            logger.debug('[WidgetDashboard] bootstrap clearing layout after error');
            initializeLayout(null, {
              startInEditMode,
              keyboardMode: initialKeyboardMode ?? 'idle',
            });
          });
        }
      }
    };

    void loadUserLayout();

    return () => {
      isActive = false;
      logger.debug('[WidgetDashboard] bootstrap cleanup');
    };
  }, [
    initialKeyboardMode,
    initialLayout,
    initialSelectedWidgetId,
    initializeLayout,
    startInEditMode,
    userId,
    setSelectedWidgetIfChanged,
    setKeyboardModeIfChanged,
    setEditingIfChanged,
    storeApi,
  ]);

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
      setEditingIfChanged(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save layout';
      setSaveError(errorMessage);
      logger.error('Failed to save layout', { error, userId });
    } finally {
      setIsSaving(false);
    }
  }, [userId, saveLayout, setEditingIfChanged]);

  const handleCancelEdit = useCallback(() => {
    setEditingIfChanged(false);
    setSaveError(null);
  }, [setEditingIfChanged]);

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

  useEffect(() => {
    if (isEditing) {
      ScreenReaderSupport.announce(
        t('analytics.widgets.editModeOn' as never),
        'assertive',
      );
    } else {
      ScreenReaderSupport.announce(t('analytics.widgets.editModeOff' as never));
    }
  }, [isEditing, t]);

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
                      {t('analytics.widgets.addWidget')}
                    </Button>
                  }
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowShortcutHelp((prev) => !prev)}
                  aria-expanded={showShortcutHelp}
                  aria-controls={shortcutHelpId}
                >
                  <Info className="w-4 h-4 mr-2" />
                  {t('analytics.widgets.shortcutDialog.button')}
                </Button>

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
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>

                {/* Edit */}
                {isAdmin && (
                  <Button
                    variant="default"
                    size="sm"
                  onClick={() => setEditingIfChanged(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Layout
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

      {showShortcutHelp && (
        <section
          id={shortcutHelpId}
          aria-live="polite"
          className="mx-4 mt-4 rounded-md border border-dashed border-muted-foreground/20 bg-muted/30 p-4 text-sm md:mx-6"
        >
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Info className="h-4 w-4" />
            {t('analytics.widgets.shortcutDialog.title')}
          </h3>
          <p className="mt-2 text-muted-foreground">
            {t('analytics.widgets.shortcutDialog.intro')}
          </p>
          <dl className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              'toggleEdit',
              'toggleMove',
              'toggleResize',
              'arrowMove',
              'arrowResize',
              'undo',
              'redo',
              'save',
              'cancel',
            ].map((key) => (
              <div
                key={key}
                className="rounded border border-muted-foreground/10 bg-background/80 p-3 shadow-sm"
              >
                <dt className="font-medium">
                  {t(`analytics.widgets.shortcutDialog.items.${key}.shortcut` as const)}
                </dt>
                <dd className="mt-1 text-muted-foreground">
                  {t(`analytics.widgets.shortcutDialog.items.${key}.description` as const)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

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
              <Button onClick={() => setEditingIfChanged(true)}>
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
          <div>{t('analytics.widgets.overlayMoveHint' as never)}</div>
          <div>{t('analytics.widgets.overlayResizeHint' as never)}</div>
        </div>
      )}
      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 z-40 bg-background/90 backdrop-blur">
          <div className="absolute right-0 top-0 h-full w-full max-w-md border-l bg-background shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="font-semibold">Dashboard Settings</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Grid Density</label>
                <div className="flex gap-2">
                  <Button
                    variant={settings.gridDensity === 'comfortable' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSettings({ ...settings, gridDensity: 'comfortable' })}
                  >
                    Comfortable
                  </Button>
                  <Button
                    variant={settings.gridDensity === 'compact' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSettings({ ...settings, gridDensity: 'compact' })}
                  >
                    Compact
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Auto-refresh (seconds)</label>
                <input
                  type="number"
                  min={0}
                  className="w-32 rounded border bg-background p-2 text-sm"
                  value={settings.autoRefreshSeconds}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      autoRefreshSeconds: Math.max(0, Number.parseInt(e.target.value || '0', 10))
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  0 disables auto-refresh.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    // Persist later when a settings store is available
                    logger.info('Dashboard settings updated', settings as unknown as Record<string, unknown>);
                    setShowSettings(false);
                  }}
                >
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowSettings(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXPORT
// ============================================================================

export default WidgetDashboard;

