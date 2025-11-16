/**
 * Widget Store
 *
 * Cross-application widget state (analytics dashboard, harnesses, admin tooling).
 * Modernised to match 2025 Zustand standards:
 * - Pure creator export for testing
 * - Optional persistence wrapper
 * - Deterministic cloning helpers
 */

import { enableMapSet } from 'immer';
import type { ReactNode } from 'react';
import { createElement, createContext, useContext, useMemo } from 'react';
import { create } from 'zustand';
import type { StateCreator, StoreApi } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useStoreWithEqualityFn } from 'zustand/traditional';

import type {
  DashboardLayout,
  WidgetConfig,
  WidgetPosition,
  WidgetSize,
  WidgetState,
} from '@/features/analytics/types/widget';
import { logger } from '@/lib/utils/logger';

import { createSafeStorage } from './storage';

enableMapSet();

const GRID_COLUMNS = 12;
const HISTORY_LIMIT = 50;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const coerceDate = (value: Date | string | number | undefined | null): Date => {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value);
  }

  return new Date();
};

const cloneSettings = <T>(value: T | undefined): T | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
};

export const cloneWidgetConfig = (widget: WidgetConfig): WidgetConfig => {
  const cloned: WidgetConfig = {
    id: widget.id,
    type: widget.type,
    title: widget.title,
    enabled: widget.enabled,
    position: { ...widget.position },
    size: { ...widget.size },
    settings: cloneSettings(widget.settings) ?? {},
    createdAt: coerceDate(widget.createdAt),
    updatedAt: coerceDate(widget.updatedAt),
  };

  if (widget.description) {
    cloned.description = widget.description;
  }

  if (widget.icon) {
    cloned.icon = widget.icon;
  }

  if (typeof widget.static === 'boolean') {
    cloned.static = widget.static;
  }

  if (widget.minSize) {
    cloned.minSize = { ...widget.minSize };
  }

  if (widget.maxSize) {
    cloned.maxSize = { ...widget.maxSize };
  }

  return cloned;
};

export const cloneLayout = (layout: DashboardLayout): DashboardLayout => {
  const cloned: DashboardLayout = {
    id: layout.id,
    userId: layout.userId,
    name: layout.name,
    widgets: layout.widgets.map(cloneWidgetConfig),
    isDefault: layout.isDefault,
    isPreset: layout.isPreset,
    createdAt: coerceDate(layout.createdAt),
    updatedAt: coerceDate(layout.updatedAt),
  };

  if (layout.description) {
    cloned.description = layout.description;
  }

  if (layout.breakpoints) {
    cloned.breakpoints = { ...layout.breakpoints };
  }

  return cloned;
};

const createLayoutChecksum = (layout: DashboardLayout): string =>
  JSON.stringify({
    id: layout.id,
    updatedAt: coerceDate(layout.updatedAt).getTime(),
    widgets: layout.widgets.map((widget) => ({
      id: widget.id,
      position: widget.position,
      size: widget.size,
      updatedAt: coerceDate(widget.updatedAt).getTime(),
    })),
  });

const applyWidgetUpdates = (base: WidgetConfig, updates: Partial<WidgetConfig>): WidgetConfig => {
  const next = cloneWidgetConfig(base);

  if (updates.id !== undefined) {
    next.id = updates.id;
  }

  if (updates.type !== undefined) {
    next.type = updates.type;
  }

  if (updates.title !== undefined) {
    next.title = updates.title;
  }

  if (updates.enabled !== undefined) {
    next.enabled = updates.enabled;
  }

  if (updates.position) {
    next.position = { ...next.position, ...updates.position };
    if (process.env.NODE_ENV !== 'production') {
          logger.debug(
        '[widgetStore] applyWidgetUpdates position',
        JSON.stringify(
          {
            base: { x: base.position.x, y: base.position.y },
            updates: updates.position,
            next: next.position,
          },
          null,
          2,
        ),
      );
    }
  }

  if (updates.size) {
    next.size = { ...next.size, ...updates.size };
  }

  if ('minSize' in updates) {
    if (updates.minSize) {
      next.minSize = { ...updates.minSize };
    } else {
      delete next.minSize;
    }
  }

  if ('maxSize' in updates) {
    if (updates.maxSize) {
      next.maxSize = { ...updates.maxSize };
    } else {
      delete next.maxSize;
    }
  }

  if ('static' in updates) {
    if (updates.static === undefined) {
      delete next.static;
    } else {
      next.static = updates.static;
    }
  }

  if ('description' in updates) {
    if (updates.description === undefined) {
      delete next.description;
    } else {
      next.description = updates.description;
    }
  }

  if ('icon' in updates) {
    if (updates.icon === undefined) {
      delete next.icon;
    } else {
      next.icon = updates.icon;
    }
  }

  if (updates.settings) {
    next.settings = { ...next.settings, ...updates.settings };
  } else if ('settings' in updates && updates.settings === undefined) {
    next.settings = {};
  }

  if (updates.createdAt !== undefined) {
    next.createdAt = coerceDate(updates.createdAt);
  }

  if (updates.updatedAt !== undefined) {
    next.updatedAt = coerceDate(updates.updatedAt);
  }

  return next;
};

const applyLayoutUpdates = (
  base: DashboardLayout,
  updates: Partial<DashboardLayout>,
): DashboardLayout => {
  const next = cloneLayout(base);

  if (updates.id !== undefined) {
    next.id = updates.id;
  }

  if (updates.userId !== undefined) {
    next.userId = updates.userId;
  }

  if (updates.name !== undefined) {
    next.name = updates.name;
  }

  if ('description' in updates) {
    if (updates.description === undefined) {
      delete next.description;
    } else {
      next.description = updates.description;
    }
  }

  if (updates.widgets) {
    next.widgets = updates.widgets.map(cloneWidgetConfig);
  } else if ('widgets' in updates && updates.widgets === undefined) {
    next.widgets = [];
  }

  if ('breakpoints' in updates) {
    if (updates.breakpoints) {
      next.breakpoints = { ...updates.breakpoints };
    } else {
      delete next.breakpoints;
    }
  }

  if (updates.isDefault !== undefined) {
    next.isDefault = updates.isDefault;
  }

  if (updates.isPreset !== undefined) {
    next.isPreset = updates.isPreset;
  }

  if (updates.createdAt !== undefined) {
    next.createdAt = coerceDate(updates.createdAt);
  }

  if (updates.updatedAt !== undefined) {
    next.updatedAt = coerceDate(updates.updatedAt);
  }

  return next;
};

export type WidgetStoreBootstrapOptions = {
  layout?: DashboardLayout;
  selectedWidgetId?: string | null;
  startInEditMode?: boolean;
  keyboardMode?: WidgetState['keyboardMode'];
  pushToHistory?: boolean;
};

export const createInitialWidgetState = (
  bootstrap?: WidgetStoreBootstrapOptions,
): WidgetState => {
  const base: WidgetState = {
    layouts: [],
    currentLayout: null,
    currentLayoutChecksum: null,
    widgets: new Map<string, WidgetConfig>(),
    isEditing: false,
    selectedWidgetId: null,
    isDragging: false,
    keyboardMode: 'idle',
    history: [],
    historyIndex: -1,
  };

  if (!bootstrap) {
    return base;
  }

  const {
    layout,
    selectedWidgetId,
    startInEditMode,
    keyboardMode,
    pushToHistory = true,
  } = bootstrap;

  if (layout) {
    const layoutClone = cloneLayout(layout);
    base.currentLayout = layoutClone;
    base.currentLayoutChecksum = createLayoutChecksum(layoutClone);
    base.widgets = new Map(layoutClone.widgets.map((widget) => [widget.id, widget]));

    if (pushToHistory) {
      base.history = [cloneLayout(layoutClone)];
      base.historyIndex = 0;
    }

    if (selectedWidgetId !== undefined) {
      base.selectedWidgetId = selectedWidgetId;
    } else {
      base.selectedWidgetId = layoutClone.widgets[0]?.id ?? null;
    }
  } else if (selectedWidgetId !== undefined) {
    base.selectedWidgetId = selectedWidgetId;
  }

  if (typeof startInEditMode === 'boolean') {
    base.isEditing = startInEditMode;
  }

  if (keyboardMode) {
    base.keyboardMode = keyboardMode;
  }

  return base;
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WidgetStoreActions = {
  loadLayout: (layout: DashboardLayout) => void;
  saveLayout: (layout: Partial<DashboardLayout>) => Promise<void>;
  resetLayout: () => void;
  setCurrentLayout: (layout: DashboardLayout | null) => void;
  initializeLayout: (
    layout: DashboardLayout | null,
    options?: {
      pushToHistory?: boolean;
      selectedWidgetId?: string | null;
      startInEditMode?: boolean;
      keyboardMode?: WidgetState['keyboardMode'];
    },
  ) => void;

  addWidget: (widget: WidgetConfig) => void;
  removeWidget: (widgetId: string) => void;
  updateWidget: (widgetId: string, changes: Partial<WidgetConfig>) => void;
  moveWidget: (widgetId: string, position: WidgetPosition) => void;
  resizeWidget: (widgetId: string, size: WidgetSize) => void;

  setEditing: (isEditing: boolean) => void;
  setSelectedWidget: (widgetId: string | null) => void;
  setDragging: (isDragging: boolean) => void;
  setKeyboardMode: (mode: WidgetState['keyboardMode']) => void;
  nudgeWidgetPosition: (widgetId: string, deltaX: number, deltaY: number) => WidgetPosition | null;
  nudgeWidgetSize: (widgetId: string, deltaW: number, deltaH: number) => WidgetSize | null;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  getWidget: (widgetId: string) => WidgetConfig | undefined;
  getAllWidgets: () => WidgetConfig[];
};

export type WidgetStore = WidgetState & WidgetStoreActions;

type WidgetStoreCreator = StateCreator<
  WidgetStore,
  [['zustand/immer', never]],
  [],
  WidgetStore
>;

const applyLayoutToState = (draft: WidgetStore, layout: DashboardLayout): void => {
  const layoutClone = cloneLayout(layout);
  draft.currentLayout = layoutClone;
  draft.currentLayoutChecksum = createLayoutChecksum(layoutClone);
  draft.widgets = new Map(layoutClone.widgets.map((widget) => [widget.id, widget]));

  if (draft.selectedWidgetId && draft.widgets.has(draft.selectedWidgetId)) {
    return;
  }

  draft.selectedWidgetId = draft.currentLayout.widgets[0]?.id ?? null;
};

const pushLayoutToHistory = (draft: WidgetStore, layout: DashboardLayout): void => {
  const snapshot = cloneLayout(layout);
  draft.history = draft.history.slice(0, draft.historyIndex + 1);
  draft.history.push(snapshot);
  if (draft.history.length > HISTORY_LIMIT) {
    draft.history.shift();
  }
  draft.historyIndex = draft.history.length - 1;
};

export const widgetStoreCreator = (
  bootstrap?: WidgetStoreBootstrapOptions,
): WidgetStoreCreator => (set, get) => ({
  ...createInitialWidgetState(bootstrap),

  loadLayout: (layout: DashboardLayout) => {
    set((draft) => {
      if (process.env.NODE_ENV !== 'production') {
        logger.debug('[widgetStore] loadLayout', {
          layoutId: layout.id,
          widgetCount: layout.widgets.length,
        });
      }
      applyLayoutToState(draft, layout);
      pushLayoutToHistory(draft, layout);
      logger.info('Layout loaded', { layoutId: layout.id, widgetCount: layout.widgets.length });
    });
  },

  saveLayout: async (layoutUpdates: Partial<DashboardLayout>) => {
    const currentLayout = get().currentLayout;
    if (!currentLayout) {
      logger.warn('No current layout to save');
      return;
    }

    const updatedLayout = applyLayoutUpdates(currentLayout, layoutUpdates);
    updatedLayout.updatedAt =
      layoutUpdates.updatedAt !== undefined ? coerceDate(layoutUpdates.updatedAt) : new Date();

    try {
      const response = await fetch('/api/analytics/dashboard/layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLayout),
      });

      if (!response.ok) {
        throw new Error('Failed to save layout');
      }

      set((draft) => {
        applyLayoutToState(draft, updatedLayout);
        pushLayoutToHistory(draft, updatedLayout);
        logger.info('Layout saved', { layoutId: updatedLayout.id });
      });
    } catch (error) {
      logger.error('Failed to save layout', { error });
      throw error;
    }
  },

  resetLayout: () => {
    set(() => createInitialWidgetState());
    logger.info('Layout reset');
  },

  initializeLayout: (layout, options = {}) => {
    const {
      pushToHistory = true,
      selectedWidgetId,
      startInEditMode,
      keyboardMode,
    } = options;

    const currentState = get();
    const layoutChecksum = layout ? createLayoutChecksum(layout) : null;
    const shouldApplyLayout =
      layoutChecksum !== null &&
      (currentState.currentLayoutChecksum === null ||
        currentState.currentLayoutChecksum !== layoutChecksum);

    if (process.env.NODE_ENV !== 'production') {
      logger.debug('[widgetStore] initializeLayout call', {
        layoutId: layout?.id ?? null,
        shouldApplyLayout,
        prevChecksum: currentState.currentLayoutChecksum,
        nextChecksum: layoutChecksum,
      });
    }

    set((draft) => {
      if (layout) {
        if (shouldApplyLayout) {
          applyLayoutToState(draft, layout);
          if (pushToHistory) {
            pushLayoutToHistory(draft, layout);
          }
          if (process.env.NODE_ENV !== 'production') {
            logger.debug('[widgetStore] initializeLayout applied layout', {
              layoutId: layout.id,
              historyLength: draft.history.length,
              historyIndex: draft.historyIndex,
            });
          }
        } else if (process.env.NODE_ENV !== 'production') {
          logger.debug('[widgetStore] initializeLayout skipped layout apply', {
            layoutId: layout.id,
          });
        }
      } else if (
        draft.currentLayout !== null ||
        draft.currentLayoutChecksum !== null ||
        draft.widgets.size > 0
      ) {
        draft.currentLayout = null;
        draft.currentLayoutChecksum = null;
        draft.widgets = new Map();
        draft.history = [];
        draft.historyIndex = -1;
        if (process.env.NODE_ENV !== 'production') {
          logger.debug('[widgetStore] initializeLayout cleared layout');
        }
      }

      if (selectedWidgetId !== undefined) {
        const resolved =
          selectedWidgetId && draft.widgets.has(selectedWidgetId)
            ? selectedWidgetId
            : selectedWidgetId ?? null;
        if (draft.selectedWidgetId !== resolved) {
          draft.selectedWidgetId = resolved;
        }
      } else if (!draft.selectedWidgetId && draft.currentLayout) {
        const fallback = draft.currentLayout.widgets[0]?.id ?? null;
        if (draft.selectedWidgetId !== fallback) {
          draft.selectedWidgetId = fallback;
        }
      }

      if (typeof startInEditMode === 'boolean' && draft.isEditing !== startInEditMode) {
        draft.isEditing = startInEditMode;
        if (!startInEditMode && draft.keyboardMode !== 'idle') {
          draft.keyboardMode = 'idle';
        }
      }

      if (keyboardMode && draft.keyboardMode !== keyboardMode) {
        draft.keyboardMode = keyboardMode;
      }

      logger.info('Layout initialised', {
        layoutId: layout?.id ?? null,
        startInEditMode,
        selectedWidgetId: draft.selectedWidgetId,
        keyboardMode: draft.keyboardMode,
      });
    });
  },

  setCurrentLayout: (layout: DashboardLayout | null) => {
    set((draft) => {
      if (layout) {
        applyLayoutToState(draft, layout);
      } else {
        draft.currentLayout = null;
        draft.currentLayoutChecksum = null;
        draft.widgets = new Map();
        draft.selectedWidgetId = null;
      }
    });
  },

  addWidget: (widget: WidgetConfig) => {
    const widgetClone = cloneWidgetConfig(widget);
    set((draft) => {
      draft.widgets.set(widgetClone.id, widgetClone);

      if (draft.currentLayout) {
        draft.currentLayout.widgets.push(widgetClone);
        pushLayoutToHistory(draft, draft.currentLayout);
      }

      logger.info('Widget added', { widgetId: widgetClone.id, type: widgetClone.type });
    });
  },

  removeWidget: (widgetId: string) => {
    set((draft) => {
      if (!draft.widgets.has(widgetId)) {
        logger.warn('Widget not found', { widgetId });
        return;
      }

      draft.widgets.delete(widgetId);

      if (draft.currentLayout) {
        draft.currentLayout.widgets = draft.currentLayout.widgets.filter((widget) => widget.id !== widgetId);
        pushLayoutToHistory(draft, draft.currentLayout);
      }

      if (draft.selectedWidgetId === widgetId) {
        draft.selectedWidgetId = draft.currentLayout?.widgets[0]?.id ?? null;
      }

      logger.info('Widget removed', { widgetId });
    });
  },

  updateWidget: (widgetId: string, changes: Partial<WidgetConfig>) => {
    set((draft) => {
      const widget = draft.widgets.get(widgetId);
      if (!widget) {
        logger.warn('Widget not found', { widgetId });
        if (process.env.NODE_ENV !== 'production') {
          logger.debug('[widgetStore] updateWidget missing widget', { widgetId, hasKeys: Array.from(draft.widgets.keys()) });
        }
        return;
      }

      const updatedWidget = applyWidgetUpdates(widget, changes);
      updatedWidget.updatedAt =
        changes.updatedAt !== undefined ? coerceDate(changes.updatedAt) : new Date();

      draft.widgets.set(widgetId, updatedWidget);
      if (process.env.NODE_ENV !== 'production') {
        logger.debug('[widgetStore] updateWidget applied', {
          widgetId,
          position: 'position' in changes ? updatedWidget.position : undefined,
          size: 'size' in changes ? updatedWidget.size : undefined,
        });
      }

      if (draft.currentLayout) {
        const index = draft.currentLayout.widgets.findIndex((entry) => entry.id === widgetId);
        if (index !== -1) {
          draft.currentLayout.widgets[index] = updatedWidget;
        }
      }

      logger.debug('Widget updated', { widgetId, changes: Object.keys(changes) });
    });
  },

  moveWidget: (widgetId: string, position: WidgetPosition) => {
    set((draft) => {
      const widget = draft.widgets.get(widgetId);
      if (!widget) {
        logger.warn('Widget not found for move', { widgetId });
        return;
      }

      if (process.env.NODE_ENV !== 'production') {
        logger.debug('[widgetStore] moveWidget draft snapshot', {
          widgetId,
          currentPosition: { ...widget.position },
          nextPosition: position,
        });
      }

      widget.position = { ...widget.position, ...position };
      widget.updatedAt = new Date();

      if (draft.currentLayout) {
        const layoutWidget = draft.currentLayout.widgets.find((entry) => entry.id === widgetId);
        if (layoutWidget) {
          layoutWidget.position = { ...widget.position };
          layoutWidget.updatedAt = widget.updatedAt;
        }
      }

      logger.debug('Widget moved', {
        widgetId,
        position: widget.position,
      });
    });
  },

  resizeWidget: (widgetId: string, size: WidgetSize) => {
    set((draft) => {
      const widget = draft.widgets.get(widgetId);
      if (!widget) {
        logger.warn('Widget not found for resize', { widgetId });
        return;
      }

      widget.size = { ...widget.size, ...size };
      widget.updatedAt = new Date();

      if (draft.currentLayout) {
        const layoutWidget = draft.currentLayout.widgets.find((entry) => entry.id === widgetId);
        if (layoutWidget) {
          layoutWidget.size = { ...widget.size };
          layoutWidget.updatedAt = widget.updatedAt;
        }
      }

      logger.debug('Widget resized', {
        widgetId,
        size: widget.size,
      });
    });
  },

  setEditing: (isEditing: boolean) => {
    set((draft) => {
      draft.isEditing = isEditing;
      if (!isEditing) {
        draft.selectedWidgetId = null;
        draft.keyboardMode = 'idle';
      }
      logger.debug('Edit mode changed', { isEditing });
    });
  },

  setSelectedWidget: (widgetId: string | null) => {
    set((draft) => {
      if (widgetId && !draft.widgets.has(widgetId)) {
        logger.warn('Attempted to select unknown widget', { widgetId });
        draft.selectedWidgetId = null;
        return;
      }
      draft.selectedWidgetId = widgetId;
      if (process.env.NODE_ENV !== 'production') {
        logger.debug('[widgetStore] setSelectedWidget', widgetId);
      }
    });
  },

  setDragging: (isDragging: boolean) => {
    set((draft) => {
      draft.isDragging = isDragging;
    });
  },

  setKeyboardMode: (mode: WidgetState['keyboardMode']) => {
    set((draft) => {
      draft.keyboardMode = mode;
      if (process.env.NODE_ENV !== 'production') {
        logger.debug('[widgetStore] setKeyboardMode', mode);
      }
    });
  },

  nudgeWidgetPosition: (widgetId: string, deltaX: number, deltaY: number) => {
    const widget = get().getWidget(widgetId);
    if (!widget) {
      logger.warn('Widget not found for nudge', { widgetId });
      return null;
    }

    const maxX = Math.max(0, GRID_COLUMNS - widget.size.w);
    const nextX = Math.max(0, Math.min(maxX, widget.position.x + deltaX));
    const nextY = Math.max(0, widget.position.y + deltaY);

    if (process.env.NODE_ENV !== 'production') {
      logger.debug(
        '[widgetStore] nudgeWidgetPosition',
        JSON.stringify(
          {
            widgetId,
            deltaX,
            deltaY,
            current: { x: widget.position.x, y: widget.position.y },
            next: { x: nextX, y: nextY },
          },
          null,
          2,
        ),
      );
    }

    if (nextX === widget.position.x && nextY === widget.position.y) {
      return widget.position;
    }

    get().moveWidget(widgetId, { x: nextX, y: nextY });
    logger.debug('Widget nudged', { widgetId, x: nextX, y: nextY });
    return { x: nextX, y: nextY };
  },

  nudgeWidgetSize: (widgetId: string, deltaW: number, deltaH: number) => {
    const widget = get().getWidget(widgetId);
    if (!widget) {
      logger.warn('Widget not found for resize nudge', { widgetId });
      return null;
    }

    const minW = widget.minSize?.w ?? 1;
    const minH = widget.minSize?.h ?? 1;
    const maxW = widget.maxSize?.w ?? GRID_COLUMNS;
    const maxH = widget.maxSize?.h ?? Number.MAX_SAFE_INTEGER;

    const proposedWidth = widget.size.w + deltaW;
    const proposedHeight = widget.size.h + deltaH;

    const nextWidth = Math.max(
      minW,
      Math.min(Math.min(maxW, GRID_COLUMNS - widget.position.x), proposedWidth),
    );
    const nextHeight = Math.max(minH, Math.min(maxH, proposedHeight));

    if (process.env.NODE_ENV !== 'production') {
      logger.debug('[widgetStore] nudgeWidgetSize', {
        widgetId,
        deltaW,
        deltaH,
        current: { w: widget.size.w, h: widget.size.h },
        next: { w: nextWidth, h: nextHeight },
      });
    }

    if (nextWidth === widget.size.w && nextHeight === widget.size.h) {
      return widget.size;
    }

    get().resizeWidget(widgetId, { w: nextWidth, h: nextHeight });
    logger.debug('Widget resized via nudge', { widgetId, width: nextWidth, height: nextHeight });
    return { w: nextWidth, h: nextHeight };
  },

  undo: () => {
    const { historyIndex } = get();
    if (historyIndex <= 0) {
      return;
    }

    set((draft) => {
      draft.historyIndex--;
      const previousLayout = draft.history[draft.historyIndex];
      if (previousLayout) {
        applyLayoutToState(draft, previousLayout);
      } else {
        draft.currentLayout = null;
        draft.widgets = new Map();
      }
      logger.debug('Undo', { historyIndex: draft.historyIndex });
    });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) {
      return;
    }

    set((draft) => {
      draft.historyIndex++;
      const nextLayout = draft.history[draft.historyIndex];
      if (nextLayout) {
        applyLayoutToState(draft, nextLayout);
      } else {
        draft.currentLayout = null;
        draft.widgets = new Map();
      }
      logger.debug('Redo', { historyIndex: draft.historyIndex });
    });
  },

  canUndo: () => get().historyIndex > 0,

  canRedo: () => {
    const { history, historyIndex } = get();
    return historyIndex >= 0 && historyIndex < history.length - 1;
  },

  getWidget: (widgetId: string) => get().widgets.get(widgetId),

  getAllWidgets: () => Array.from(get().widgets.values()),
});

// ---------------------------------------------------------------------------
// Store factories
// ---------------------------------------------------------------------------

export type CreateWidgetStoreOptions = {
  persist?: boolean;
  name?: string;
  bootstrap?: WidgetStoreBootstrapOptions;
};

export const createWidgetStore = (
  options: CreateWidgetStoreOptions = {},
): StoreApi<WidgetStore> & ((selector?: unknown) => unknown) => {
  const { persist: enablePersist = false, name = 'widget-store' } = options;
  const base = immer(widgetStoreCreator(options.bootstrap));

  if (!enablePersist) {
    return create<WidgetStore>()(base);
  }

  const storage = createSafeStorage();

  return create<WidgetStore>()(
    persist(base, {
      name,
      storage,
      partialize: (state) => {
        const result: Record<string, unknown> = {
          historyIndex: state.historyIndex,
        };

        if (state.currentLayout) {
          result.currentLayout = cloneLayout(state.currentLayout);
        }

        if (state.history.length) {
          result.history = state.history.map(cloneLayout);
        }

        return result;
      },
      onRehydrateStorage: () => (state) => {
        if (state?.currentLayout) {
          applyLayoutToState(state as unknown as WidgetStore, state.currentLayout);
        }
      },
    }),
  );
};

type WidgetStoreHook = StoreApi<WidgetStore> & {
  (): WidgetStore;
  <T>(selector: (state: WidgetStore) => T, equalityFn?: (a: T, b: T) => boolean): T;
};

export const widgetStore = createWidgetStore();

const WidgetStoreContext = createContext<StoreApi<WidgetStore> | null>(null);

export const WidgetStoreProvider = ({
  store,
  children,
}: {
  store: StoreApi<WidgetStore>;
  children: ReactNode;
}) => createElement(WidgetStoreContext.Provider, { value: store }, children);

export const useWidgetStoreApi = (override?: StoreApi<WidgetStore>) => {
  const contextStore = useContext(WidgetStoreContext);
  return override ?? contextStore ?? widgetStore;
};

export const useWidgetStoreScoped = <T,>(
  selector: (state: WidgetStore) => T,
  equalityFn?: (a: T, b: T) => boolean,
  override?: StoreApi<WidgetStore>,
) => {
  const storeApi = useWidgetStoreApi(override);
  // Always call a single hook to satisfy Rule of Hooks; provide a stable default equality function.
  const stableEquality: (a: T, b: T) => boolean =
    equalityFn ?? ((a, b) => Object.is(a, b));
  return useStoreWithEqualityFn(storeApi, selector, stableEquality);
};

export const useWidgetStore = widgetStore as WidgetStoreHook;

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectIsEditing = (state: WidgetStore) => state.isEditing;
export const selectCurrentLayout = (state: WidgetStore) => state.currentLayout;
export const selectAllWidgets = (state: WidgetStore) => Array.from(state.widgets.values());
export const selectSelectedWidget = (state: WidgetStore) =>
  state.selectedWidgetId ? state.getWidget(state.selectedWidgetId) ?? null : null;
export const selectKeyboardMode = (state: WidgetStore) => state.keyboardMode;

export default useWidgetStore;

export const useWidgetStoreActions = (override?: StoreApi<WidgetStore>) => {
  const storeApi = useWidgetStoreApi(override);

  return useMemo(() => {
    const state = storeApi.getState();

    return {
      setEditing: state.setEditing,
      setSelectedWidget: state.setSelectedWidget,
      setKeyboardMode: state.setKeyboardMode,
      loadLayout: state.loadLayout,
      saveLayout: state.saveLayout,
      initializeLayout: state.initializeLayout,
      undo: state.undo,
      redo: state.redo,
    };
  }, [storeApi]);
};

