import { enableMapSet } from 'immer';
import { act } from 'react-dom/test-utils';

import type {
  DashboardLayout,
  WidgetConfig,
  WidgetPosition,
  WidgetSize,
} from '@/features/analytics/types/widget';
import useWidgetStore from '@/lib/stores/widgetStore';

function createWidget(overrides: Partial<WidgetConfig> = {}): WidgetConfig {
  const now = new Date();
  const widget: WidgetConfig = {
    id: 'widget-1',
    type: 'custom',
    title: 'Keyboard Widget',
    description: 'Synthetic widget for keyboard tests',
    icon: '🧪',
    enabled: true,
    position: { x: 0, y: 0 },
    size: { w: 4, h: 3 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 8, h: 6 },
    static: false,
    settings: {},
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };

  const cloned: WidgetConfig = {
    ...widget,
    position: { ...widget.position },
    size: { ...widget.size },
    settings: { ...(widget.settings ?? {}) },
  };

  if (widget.minSize) {
    cloned.minSize = { ...widget.minSize };
  } else {
    delete cloned.minSize;
  }

  if (widget.maxSize) {
    cloned.maxSize = { ...widget.maxSize };
  } else {
    delete cloned.maxSize;
  }

  if (typeof widget.static === 'boolean') {
    cloned.static = widget.static;
  } else {
    delete cloned.static;
  }

  if (!widget.description) {
    delete cloned.description;
  }

  if (!widget.icon) {
    delete cloned.icon;
  }

  return cloned;
}

function createLayout(widget: WidgetConfig): DashboardLayout {
  const now = new Date();
  return {
    id: 'layout-1',
    userId: 'test-user',
    name: 'Test Layout',
    description: 'Synthetic layout',
    widgets: [widget],
    isDefault: false,
    isPreset: false,
    createdAt: now,
    updatedAt: now,
  };
}

function resetStore(widgetOverrides: Partial<WidgetConfig> = {}) {
  const widget = createWidget(widgetOverrides);
  const layout = createLayout(widget);

  useWidgetStore.persist?.clearStorage();

  act(() => {
    useWidgetStore.setState((state) => {
      state.layouts = [];
      state.currentLayout = layout;
      state.widgets = new Map([[widget.id, widget]]);
      state.isEditing = true;
      state.selectedWidgetId = widget.id;
      state.isDragging = false;
      state.keyboardMode = 'idle';
      state.history = [];
      state.historyIndex = -1;
    });
  });

  return { widget, layout };
}

enableMapSet();

describe('widgetStore keyboard helpers', () => {
  afterEach(() => {
    useWidgetStore.persist?.clearStorage();
    act(() => {
      useWidgetStore.setState((state) => {
        state.layouts = [];
        state.currentLayout = null;
        state.widgets = new Map();
        state.isEditing = false;
        state.selectedWidgetId = null;
        state.isDragging = false;
        state.keyboardMode = 'idle';
        state.history = [];
        state.historyIndex = -1;
      });
    });
  });

  it('updates keyboard mode when toggled', () => {
    resetStore();
    const { setKeyboardMode } = useWidgetStore.getState();

    act(() => setKeyboardMode('move'));
    expect(useWidgetStore.getState().keyboardMode).toBe('move');

    act(() => setKeyboardMode('resize'));
    expect(useWidgetStore.getState().keyboardMode).toBe('resize');
  });

  it('resets keyboard mode when edit mode exits', () => {
    resetStore();
    const { setKeyboardMode, setEditing } = useWidgetStore.getState();

    act(() => setKeyboardMode('move'));
    expect(useWidgetStore.getState().keyboardMode).toBe('move');

    act(() => setEditing(false));
    expect(useWidgetStore.getState().keyboardMode).toBe('idle');
  });

  it('nudges widget position within grid bounds', () => {
    const { widget } = resetStore();
    const { nudgeWidgetPosition, getWidget } = useWidgetStore.getState();

    let result: WidgetPosition | null = null;
    act(() => {
      result = nudgeWidgetPosition(widget.id, 3, 2);
    });

    expect(result).toEqual({ x: 3, y: 2 });
    expect(getWidget(widget.id)?.position).toEqual({ x: 3, y: 2 });

    act(() => {
      result = nudgeWidgetPosition(widget.id, -10, -10);
    });

    expect(result).toEqual({ x: 0, y: 0 });
    expect(getWidget(widget.id)?.position).toEqual({ x: 0, y: 0 });

    // Attempt to move beyond right boundary (12 columns).
    act(() => {
      result = nudgeWidgetPosition(widget.id, 50, 0);
    });

    const expectedMaxX = 12 - widget.size.w;
    expect(result).toEqual({ x: expectedMaxX, y: 0 });
    expect(getWidget(widget.id)?.position).toEqual({ x: expectedMaxX, y: 0 });
  });

  it('nudges widget size while respecting constraints', () => {
    const { widget } = resetStore();
    const initialSize = { ...widget.size };
    const { nudgeWidgetSize, getWidget } = useWidgetStore.getState();

    let result: WidgetSize | null = null;
    act(() => {
      result = nudgeWidgetSize(widget.id, 2, 1);
    });

    expect(result).toEqual({ w: initialSize.w + 2, h: initialSize.h + 1 });
    expect(getWidget(widget.id)?.size).toEqual({ w: initialSize.w + 2, h: initialSize.h + 1 });

    act(() => {
      result = nudgeWidgetSize(widget.id, -10, -10);
    });

    expect(result).toEqual({ w: widget.minSize!.w, h: widget.minSize!.h });
    expect(getWidget(widget.id)?.size).toEqual({
      w: widget.minSize!.w,
      h: widget.minSize!.h,
    });

    // Attempt to exceed maximum width.
    act(() => {
      result = nudgeWidgetSize(widget.id, 50, 0);
    });

    const expectedWidth = widget.maxSize!.w!;
    expect(result).toEqual({ w: expectedWidth, h: widget.minSize!.h });
    expect(getWidget(widget.id)?.size).toEqual({
      w: expectedWidth,
      h: widget.minSize!.h,
    });
  });
});

