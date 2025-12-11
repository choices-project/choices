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
import React, { useRef, useState } from 'react';

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

import { useAccessibleDialog } from '@/lib/accessibility/useAccessibleDialog';
import { useWidgetStoreScoped } from '@/lib/stores/widgetStore';

import { createWidgetConfig, getWidget, listWidgets } from '../../lib/widgetRegistry';

import type { WidgetCategory, WidgetType } from '../../types/widget';

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
  const addWidget = useWidgetStoreScoped((state) => state.addWidget);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstTabRef = useRef<HTMLButtonElement>(null);

  const handleAddWidget = (widgetType: WidgetType) => {
    const registryEntry = getWidget(widgetType);

    if (!registryEntry) {
      return;
    }

    const newWidget = createWidgetConfig(widgetType, {
      position: {
        x: 0,
        y: 999, // Allow grid to auto-place
      },
    });

    addWidget(newWidget);
    onWidgetAdd?.(widgetType);
    setOpen(false);
  };

  const widgets = listWidgets();
  const categories = Array.from(
    new Set(
      widgets
        .map((entry) => entry.metadata.category)
        .filter((category): category is WidgetCategory => Boolean(category))
    )
  );

  useAccessibleDialog({
    isOpen: open,
    dialogRef,
    initialFocusRef: firstTabRef,
    onClose: () => setOpen(false),
    liveMessage: 'Widget selector dialog opened.',
    ariaLabelId: 'widget-selector-title',
  });

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

      <DialogContent
        ref={dialogRef}
        className="max-w-4xl max-h-[80vh] overflow-auto"
      >
        <DialogHeader>
          <DialogTitle id="widget-selector-title">Add Widget to Dashboard</DialogTitle>
          <DialogDescription>
            Choose a widget to add to your analytics dashboard
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger ref={firstTabRef} value="all">All</TabsTrigger>
            <TabsTrigger value="polls">Polls</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="districts">Districts</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>

          {/* All Widgets */}
          <TabsContent value="all" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              {widgets.map((entry) => {
                const { metadata } = entry;
                return (
                  <Card key={metadata.type} className="hover:border-primary transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{metadata.icon}</span>
                          <CardTitle className="text-base">{metadata.name}</CardTitle>
                        </div>
                        <Button size="sm" onClick={() => handleAddWidget(metadata.type)}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <CardDescription className="text-xs">
                        {metadata.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Permission: {metadata.requiredPermission ?? 'n/a'}</span>
                        <span className="capitalize">{metadata.category}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Category Tabs */}
          {categories.map((category) => (
            <TabsContent key={category} value={category} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                {widgets
                  .filter((entry) => entry.metadata.category === category)
                  .map((entry) => {
                    const { metadata } = entry;
                    return (
                      <Card key={metadata.type} className="hover:border-primary transition-colors">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl">{metadata.icon}</span>
                              <CardTitle className="text-base">{metadata.name}</CardTitle>
                            </div>
                            <Button size="sm" onClick={() => handleAddWidget(metadata.type)}>
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <CardDescription className="text-xs">
                            {metadata.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Permission: {metadata.requiredPermission ?? 'n/a'}</span>
                            <div className="flex items-center space-x-1">
                              {(metadata.supportedExports?.length ?? 0) > 0 && (
                                <span title="Exportable">📥</span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
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

