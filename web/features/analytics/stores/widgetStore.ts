/**
 * Widget Store
 * 
 * Global state management for the widget system using Zustand.
 * Handles:
 * - Widget layouts and configurations
 * - Drag and drop state
 * - Undo/redo history
 * - Persistence to database
 * 
 * Created: November 5, 2025
 * Status: PRODUCTION
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { logger } from '@/lib/utils/logger';

import type { 
  WidgetConfig, 
  DashboardLayout, 
  WidgetState,
  WidgetPosition,
  WidgetSize
} from '../types/widget';

// ============================================================================
// INITIAL STATE
// ============================================================================

const INITIAL_STATE: WidgetState = {
  layouts: [],
  currentLayout: null,
  widgets: new Map(),
  isEditing: false,
  selectedWidgetId: null,
  isDragging: false,
  history: [],
  historyIndex: -1,
};

// ============================================================================
// STORE ACTIONS
// ============================================================================

type WidgetStoreActions = {
  // Layout management
  loadLayout: (layout: DashboardLayout) => void;
  saveLayout: (layout: Partial<DashboardLayout>) => Promise<void>;
  resetLayout: () => void;
  setCurrentLayout: (layout: DashboardLayout | null) => void;
  
  // Widget management
  addWidget: (widget: WidgetConfig) => void;
  removeWidget: (widgetId: string) => void;
  updateWidget: (widgetId: string, changes: Partial<WidgetConfig>) => void;
  moveWidget: (widgetId: string, position: WidgetPosition) => void;
  resizeWidget: (widgetId: string, size: WidgetSize) => void;
  
  // UI state
  setEditing: (isEditing: boolean) => void;
  setSelectedWidget: (widgetId: string | null) => void;
  setDragging: (isDragging: boolean) => void;
  
  // History (undo/redo)
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Utility
  getWidget: (widgetId: string) => WidgetConfig | undefined;
  getAllWidgets: () => WidgetConfig[];
}

// ============================================================================
// WIDGET STORE
// ============================================================================

export const useWidgetStore = create<WidgetState & WidgetStoreActions>()(
  immer(
    persist(
      (set, get) => ({
        ...INITIAL_STATE,

        // ====================================================================
        // LAYOUT MANAGEMENT
        // ====================================================================

        loadLayout: (layout: DashboardLayout) => {
          set((state) => {
            state.currentLayout = layout;
            state.widgets = new Map(layout.widgets.map(w => [w.id, w]));
            
            // Add to history
            state.history.push(layout);
            state.historyIndex = state.history.length - 1;
            
            logger.info('Layout loaded', { layoutId: layout.id, widgetCount: layout.widgets.length });
          });
        },

        saveLayout: async (layoutUpdates: Partial<DashboardLayout>) => {
          const currentLayout = get().currentLayout;
          if (!currentLayout) {
            logger.warn('No current layout to save');
            return;
          }

          const updatedLayout: DashboardLayout = {
            ...currentLayout,
            ...layoutUpdates,
            updatedAt: new Date(),
          };

          try {
            // Save to database
            const response = await fetch('/api/analytics/dashboard/layout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedLayout),
            });

            if (!response.ok) {
              throw new Error('Failed to save layout');
            }

            set((state) => {
              state.currentLayout = updatedLayout;
              logger.info('Layout saved', { layoutId: updatedLayout.id });
            });
          } catch (error) {
            logger.error('Failed to save layout', { error });
            throw error;
          }
        },

        resetLayout: () => {
          set((state) => {
            state.currentLayout = null;
            state.widgets = new Map();
            state.history = [];
            state.historyIndex = -1;
            logger.info('Layout reset');
          });
        },

        setCurrentLayout: (layout: DashboardLayout | null) => {
          set((state) => {
            state.currentLayout = layout;
          });
        },

        // ====================================================================
        // WIDGET MANAGEMENT
        // ====================================================================

        addWidget: (widget: WidgetConfig) => {
          set((state) => {
            state.widgets.set(widget.id, widget);
            
            if (state.currentLayout) {
              state.currentLayout.widgets.push(widget);
              
              // Add to history
              state.history = state.history.slice(0, state.historyIndex + 1);
              state.history.push({ ...state.currentLayout });
              state.historyIndex++;
            }
            
            logger.info('Widget added', { widgetId: widget.id, type: widget.type });
          });
        },

        removeWidget: (widgetId: string) => {
          set((state) => {
            state.widgets.delete(widgetId);
            
            if (state.currentLayout) {
              state.currentLayout.widgets = state.currentLayout.widgets.filter(
                w => w.id !== widgetId
              );
              
              // Add to history
              state.history = state.history.slice(0, state.historyIndex + 1);
              state.history.push({ ...state.currentLayout });
              state.historyIndex++;
            }
            
            if (state.selectedWidgetId === widgetId) {
              state.selectedWidgetId = null;
            }
            
            logger.info('Widget removed', { widgetId });
          });
        },

        updateWidget: (widgetId: string, changes: Partial<WidgetConfig>) => {
          set((state) => {
            const widget = state.widgets.get(widgetId);
            if (!widget) {
              logger.warn('Widget not found', { widgetId });
              return;
            }

            const updatedWidget = { ...widget, ...changes, updatedAt: new Date() };
            state.widgets.set(widgetId, updatedWidget);
            
            if (state.currentLayout) {
              const index = state.currentLayout.widgets.findIndex(w => w.id === widgetId);
              if (index !== -1) {
                state.currentLayout.widgets[index] = updatedWidget;
              }
            }
            
            logger.debug('Widget updated', { widgetId, changes: Object.keys(changes) });
          });
        },

        moveWidget: (widgetId: string, position: WidgetPosition) => {
          get().updateWidget(widgetId, { position });
        },

        resizeWidget: (widgetId: string, size: WidgetSize) => {
          get().updateWidget(widgetId, { size });
        },

        // ====================================================================
        // UI STATE
        // ====================================================================

        setEditing: (isEditing: boolean) => {
          set((state) => {
            state.isEditing = isEditing;
            if (!isEditing) {
              state.selectedWidgetId = null;
            }
            logger.debug('Edit mode changed', { isEditing });
          });
        },

        setSelectedWidget: (widgetId: string | null) => {
          set((state) => {
            state.selectedWidgetId = widgetId;
          });
        },

        setDragging: (isDragging: boolean) => {
          set((state) => {
            state.isDragging = isDragging;
          });
        },

        // ====================================================================
        // HISTORY (UNDO/REDO)
        // ====================================================================

        undo: () => {
          const { historyIndex } = get();
          if (historyIndex > 0) {
            set((state) => {
              state.historyIndex--;
              const previousLayout = state.history[state.historyIndex];
              if (previousLayout) {
                state.currentLayout = previousLayout;
                state.widgets = new Map(previousLayout.widgets.map(w => [w.id, w]));
                logger.debug('Undo', { historyIndex: state.historyIndex });
              } else {
                state.currentLayout = null;
              }
            });
          }
        },

        redo: () => {
          const { history, historyIndex } = get();
          if (historyIndex < history.length - 1) {
            set((state) => {
              state.historyIndex++;
              const nextLayout = state.history[state.historyIndex];
              if (nextLayout) {
                state.currentLayout = nextLayout;
                state.widgets = new Map(nextLayout.widgets.map(w => [w.id, w]));
                logger.debug('Redo', { historyIndex: state.historyIndex });
              } else {
                state.currentLayout = null;
              }
            });
          }
        },

        canUndo: () => {
          return get().historyIndex > 0;
        },

        canRedo: () => {
          const { history, historyIndex } = get();
          return historyIndex < history.length - 1;
        },

        // ====================================================================
        // UTILITY
        // ====================================================================

        getWidget: (widgetId: string) => {
          return get().widgets.get(widgetId);
        },

        getAllWidgets: () => {
          return Array.from(get().widgets.values());
        },
      }),
      {
        name: 'widget-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Only persist essential state
          currentLayout: state.currentLayout,
          history: state.history.slice(-10), // Keep last 10 for undo/redo
          historyIndex: Math.min(state.historyIndex, 9),
        }),
      }
    )
  )
);

// ============================================================================
// SELECTORS (for better performance)
// ============================================================================

export const selectIsEditing = (state: WidgetState) => state.isEditing;
export const selectCurrentLayout = (state: WidgetState) => state.currentLayout;
export const selectAllWidgets = (state: WidgetState) => Array.from(state.widgets.values());
export const selectSelectedWidget = (state: WidgetState & WidgetStoreActions) =>
  state.selectedWidgetId ? state.getWidget(state.selectedWidgetId) : null;

// ============================================================================
// EXPORT
// ============================================================================

export default useWidgetStore;

