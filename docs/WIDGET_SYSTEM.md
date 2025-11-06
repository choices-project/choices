# Widget System Documentation

**Created**: November 6, 2025  
**Status**: ✅ Production Ready

---

## Overview

The Choices platform includes a fully customizable widget-based analytics dashboard that allows admins to create personalized data visualization layouts.

---

## Features

### Core Capabilities
- ✅ **Drag-and-drop widgets** - Smooth 60fps repositioning
- ✅ **Resize widgets** - Adjustable sizes with min/max constraints
- ✅ **Add/remove widgets** - Widget catalog with category filtering
- ✅ **Save/load layouts** - Persistent per-user configurations
- ✅ **Undo/redo** - 10-state history with keyboard shortcuts
- ✅ **Layout presets** - 5 pre-configured dashboard layouts
- ✅ **Responsive design** - Breakpoints for desktop, tablet, mobile
- ✅ **Touch support** - Mobile-friendly interactions
- ✅ **Error boundaries** - Graceful widget failure handling
- ✅ **Dual-mode toggle** - Switch between Classic and Widget views

### Available Widgets
1. **Trends Chart** - Activity trends over time
2. **Demographics Chart** - User demographics breakdown
3. **Temporal Analysis** - Hour/day engagement patterns
4. **Trust Tier Comparison** - Trust tier analytics
5. **Poll Heatmap** - Poll engagement visualization
6. **District Heatmap** - Geographic engagement

---

## Usage

### For Admins

**Access Widget Dashboard**:
1. Navigate to `/admin/analytics`
2. Click the **"Widgets"** button (top-right)
3. Click **"Edit Layout"** to customize
4. Drag, resize, add/remove widgets
5. Click **"Save"** to persist your layout

**Apply Layout Presets**:
- Click **"Presets"** button
- Choose: Default, Executive, Detailed, Mobile, or Engagement
- Layout applies instantly

**Keyboard Shortcuts**:
- `Cmd/Ctrl + Z` - Undo
- `Cmd/Ctrl + Shift + Z` - Redo
- `Cmd/Ctrl + S` - Save layout
- `Esc` - Cancel editing

---

## Technical Details

### Architecture

**Components**:
- `WidgetDashboard.tsx` - Main container
- `WidgetGrid.tsx` - react-grid-layout integration
- `WidgetRenderer.tsx` - Widget wrapper with error boundaries
- `WidgetSelector.tsx` - Widget catalog

**State Management**:
- Zustand store with Immer middleware
- LocalStorage persistence
- Database sync

**Database**:
- Table: `user_preferences`
- Columns: `dashboard_layout` (JSONB), `analytics_dashboard_mode` (TEXT)

**API**:
- `/api/analytics/dashboard/layout` - GET/POST/DELETE

### Layout Presets

1. **Default** - Balanced view (3 widgets)
2. **Executive** - High-level metrics (4 widgets)
3. **Detailed** - Comprehensive analytics (6 widgets)
4. **Mobile** - Vertically stacked (4 widgets)
5. **Engagement** - Focus on engagement patterns (4 widgets)

### Performance

- Initial load: < 2s (with caching)
- Drag response: < 16ms (60fps)
- Save layout: < 500ms
- Load layout: < 200ms

---

## Development

### Adding New Widgets

1. Create widget component in `features/analytics/components/`
2. Add to widget registry in `lib/widgetRegistry.ts`
3. Widget automatically appears in selector

### Creating Custom Presets

Edit `features/analytics/lib/widgetPresets.ts` to add new layout configurations.

---

## Testing

**E2E Test Suite**: `tests/e2e/widget-dashboard.spec.ts`

Covers:
- Mode toggle
- Drag-and-drop
- Resize
- Add/remove widgets
- Save/load persistence
- Preset application
- Keyboard shortcuts
- Responsive behavior
- Session persistence

---

## Dependencies

```json
{
  "react-grid-layout": "^1.4.4",
  "@types/react-grid-layout": "^1.3.5",
  "zustand": "^5.0.8",
  "immer": "^10.1.3"
}
```

---

## See Also

- `FEATURES.md` - Complete feature list
- `ARCHITECTURE.md` - System architecture
- `DEVELOPMENT.md` - Development guide

