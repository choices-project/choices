/**
 * Widget Selector Component
 * 
 * UI for selecting and adding widgets to the dashboard.
 * Features:
 * - Browse available widgets
 * - Filter by category
 * - Preview widget info
 * - Add to dashboard
 * 
 * Created: November 5, 2025
 * Status: PRODUCTION
 */

'use client';

import { Plus, Info } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { WIDGET_REGISTRY, generateWidgetId } from '../../lib/widgetRegistry';
import { useWidgetStore } from '../../stores/widgetStore';
import type { WidgetType } from '../../types/widget';

// ============================================================================
// WIDGET SELECTOR PROPS
// ============================================================================

export type WidgetSelectorProps = {
  trigger?: React.ReactNode;
  onWidgetAdd?: (widgetType: WidgetType) => void;
}

// ============================================================================
// WIDGET SELECTOR COMPONENT
// ============================================================================

export const WidgetSelector: React.FC<WidgetSelectorProps> = ({
  trigger,
  onWidgetAdd,
}) => {
  const [open, setOpen] = useState(false);
  const { addWidget } = useWidgetStore();

  const handleAddWidget = (widgetType: WidgetType) => {
    const widgetMeta = WIDGET_REGISTRY[widgetType];
    
    if (!widgetMeta) {
      return;
    }

    // Create new widget config from metadata
    const newWidget = {
      ...widgetMeta.defaultConfig,
      id: generateWidgetId(widgetType),
      type: widgetType,
      title: widgetMeta.name,
      description: widgetMeta.description,
      icon: widgetMeta.icon,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Adjust position to avoid overlaps (simple stacking for now)
      position: {
        x: 0,
        y: 999, // Will be auto-placed by grid
      },
      size: {
        w: widgetMeta.defaultConfig.position?.w ?? 4,
        h: widgetMeta.defaultConfig.position?.h ?? 3,
      },
      settings: {
        refreshInterval: widgetMeta.defaultConfig.refreshInterval,
        filters: widgetMeta.defaultConfig.filters,
      },
    };

    addWidget(newWidget);
    onWidgetAdd?.(widgetType);
    setOpen(false);
  };

  const widgets = Object.values(WIDGET_REGISTRY);
  const categories = Array.from(new Set(widgets.map((w: any) => w.category)));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Widget
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Add Widget to Dashboard</DialogTitle>
          <DialogDescription>
            Choose a widget to add to your analytics dashboard
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="polls">Polls</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="districts">Districts</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>

          {/* All Widgets */}
          <TabsContent value="all" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              {widgets.map((widget: any) => (
                <Card key={widget.type} className="hover:border-primary transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{widget.icon}</span>
                        <CardTitle className="text-base">{widget.name}</CardTitle>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddWidget(widget.type)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <CardDescription className="text-xs">
                      {widget.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Permission: {widget.requiredPermission}</span>
                      <span className="capitalize">{widget.category}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Category Tabs */}
          {categories.map((category) => (
            <TabsContent key={category} value={category} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                {widgets
                  .filter((w: any) => w.category === category)
                  .map((widget: any) => (
                    <Card key={widget.type} className="hover:border-primary transition-colors">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">{widget.icon}</span>
                            <CardTitle className="text-base">{widget.name}</CardTitle>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAddWidget(widget.type)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <CardDescription className="text-xs">
                          {widget.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Permission: {widget.requiredPermission}</span>
                          <div className="flex items-center space-x-1">
                            {widget.supportedExports.length > 0 && (
                              <span title="Exportable">📥</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex items-center space-x-2 pt-4 border-t text-sm text-muted-foreground">
          <Info className="w-4 h-4" />
          <p>
            Added widgets can be moved, resized, and configured in edit mode
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
// EXPORT
// ============================================================================

export default WidgetSelector;

