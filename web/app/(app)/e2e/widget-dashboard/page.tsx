'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';

import WidgetDashboard from '@/features/analytics/components/widgets/WidgetDashboard';
import type {
  DashboardLayout,
  WidgetConfig,
  WidgetPosition,
  WidgetSize,
  WidgetState,
} from '@/features/analytics/types/widget';

import { createWidgetStore } from '@/lib/stores/widgetStore';

type WidgetSnapshot = {
  position: WidgetPosition;
  size: WidgetSize;
  keyboardMode: WidgetState['keyboardMode'];
};

export type WidgetDashboardHarness = {
  reset: () => void;
  getWidgetSnapshot: (id: string) => WidgetSnapshot | null;
  dumpState: () => {
    isEditing: boolean;
    keyboardMode: WidgetState['keyboardMode'];
    widgets: Array<{
      id: string;
      title: string;
      position: WidgetPosition;
      size: WidgetSize;
    }>;
  };
};

const DEFAULT_WIDGET_ID = 'widget-dashboard-default';
const DEFAULT_LAYOUT_ID = 'widget-dashboard-layout';
const HARNESS_USER_ID = '00000000-0000-0000-0000-000000000042';

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    __widgetDashboardHarness?: WidgetDashboardHarness;
  }
}

const createDefaultWidget = (): WidgetConfig => {
  const now = new Date();
  return {
    id: DEFAULT_WIDGET_ID,
    type: 'poll-heatmap',
    title: 'Poll Engagement Heatmap',
    description: 'Harness widget for keyboard interaction tests',
    icon: '🔥',
    enabled: true,
    position: { x: 0, y: 0 },
    size: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    maxSize: { w: 8, h: 6 },
    static: false,
    settings: {
      refreshInterval: 300_000,
      filters: {
        category: 'All Categories',
        limit: 10,
      },
    },
    createdAt: now,
    updatedAt: now,
  };
};

const createDefaultLayout = (widget: WidgetConfig): DashboardLayout => {
  const now = new Date();
  return {
    id: DEFAULT_LAYOUT_ID,
    userId: HARNESS_USER_ID,
    name: 'Widget Dashboard Harness Layout',
    description: 'Baseline layout for widget dashboard keyboard tests.',
    widgets: [widget],
    isDefault: true,
    isPreset: false,
    createdAt: now,
    updatedAt: now,
  };
};

const cloneLayout = (layout: DashboardLayout): DashboardLayout =>
  JSON.parse(JSON.stringify(layout)) as DashboardLayout;

export default function WidgetDashboardHarnessPage() {
  const baseLayout = useMemo(() => {
    const widget = createDefaultWidget();
    return createDefaultLayout(widget);
  }, []);

  const storeRef = useRef(
    createWidgetStore({
      bootstrap: {
        layout: baseLayout,
        selectedWidgetId: DEFAULT_WIDGET_ID,
        startInEditMode: true,
        keyboardMode: 'idle',
      },
    }),
  );
  const store = storeRef.current;

  const seedDashboard = useCallback(() => {
    const layoutClone = cloneLayout(baseLayout);
    store.getState().initializeLayout(layoutClone, {
      selectedWidgetId: DEFAULT_WIDGET_ID,
      startInEditMode: true,
      keyboardMode: 'idle',
    });

    if (process.env.NODE_ENV !== 'production') {
      console.warn('[WidgetDashboardHarness] seeded layout', {
        widgetCount: layoutClone.widgets.length,
      });
    }
  }, [baseLayout, store]);

  useEffect(() => {
    const harness: WidgetDashboardHarness = {
      reset: () => {
        seedDashboard();
      },
      getWidgetSnapshot: (id: string) => {
        const storeState = storeRef.current.getState();
        const widget = storeState.getWidget(id);
        if (!widget) {
          return null;
        }

        return {
          position: { ...widget.position },
          size: { ...widget.size },
          keyboardMode: storeState.keyboardMode,
        };
      },
      dumpState: () => {
        const state = storeRef.current.getState();
        const widgets = Array.from(state.widgets.values()).map((widget) => ({
          id: widget.id,
          title: widget.title,
          position: { ...widget.position },
          size: { ...widget.size },
        }));
        return {
          isEditing: state.isEditing,
          keyboardMode: state.keyboardMode,
          widgets,
        };
      },
    };

    window.__widgetDashboardHarness = harness;
    return () => {
      if (window.__widgetDashboardHarness === harness) {
        delete window.__widgetDashboardHarness;
      }
    };
  }, [seedDashboard]);

  return (
    <main
      data-testid="widget-dashboard-harness"
      className="min-h-screen bg-slate-50 p-6"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-2 rounded-lg border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Widget Dashboard Keyboard Harness</h1>
          <p className="text-sm text-muted-foreground">
            This page renders the analytics widget dashboard in editing mode so automated tests can
            exercise keyboard-only controls for moving and resizing widgets.
          </p>
          <p className="text-xs text-muted-foreground">
            Access the harness with <code>window.__widgetDashboardHarness</code> to reset state or
            inspect widget positions and sizes.
          </p>
        </header>

        <section className="rounded-lg border bg-white p-6 shadow-sm">
          <WidgetDashboard
            userId={HARNESS_USER_ID}
            isAdmin
            initialLayout={baseLayout}
            startInEditMode
            initialSelectedWidgetId={DEFAULT_WIDGET_ID}
            initialKeyboardMode="idle"
            store={store}
          />
        </section>
      </div>
    </main>
  );
}

