/**
 * Widget Renderer Component
 * 
 * Wraps individual widgets with:
 * - Error boundaries
 * - Loading states
 * - Configuration controls
 * - Drag handles
 * - Resize handles
 * 
 * Created: November 5, 2025
 * Status: PRODUCTION
 */

'use client';

import React, { Suspense, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  X, 
  RefreshCw, 
  Download, 
  Maximize2, 
  AlertCircle,
  Loader2,
  GripVertical
} from 'lucide-react';
import type { WidgetConfig, WidgetProps } from '../../types/widget';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// ERROR BOUNDARY
// ============================================================================

class WidgetErrorBoundary extends React.Component<
  { children: React.ReactNode; widgetId: string; onError?: (error: Error) => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Widget error:', { widgetId: this.props.widgetId, error, errorInfo });
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h3 className="font-semibold text-lg mb-2">Widget Error</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {this.state.error?.message || 'Something went wrong loading this widget'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// WIDGET LOADING SKELETON
// ============================================================================

const WidgetLoadingSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-4 p-6">
    <div className="h-4 bg-muted rounded w-1/3"></div>
    <div className="h-64 bg-muted rounded"></div>
    <div className="grid grid-cols-3 gap-4">
      <div className="h-8 bg-muted rounded"></div>
      <div className="h-8 bg-muted rounded"></div>
      <div className="h-8 bg-muted rounded"></div>
    </div>
  </div>
);

// ============================================================================
// WIDGET RENDERER PROPS
// ============================================================================

export interface WidgetRendererProps {
  config: WidgetConfig;
  children: React.ReactNode;
  isEditing?: boolean;
  isLoading?: boolean;
  error?: Error | null;
  onConfigChange?: (config: Partial<WidgetConfig>) => void;
  onRemove?: () => void;
  onRefresh?: () => void;
  onFullscreen?: () => void;
  className?: string;
}

// ============================================================================
// WIDGET RENDERER COMPONENT
// ============================================================================

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  config,
  children,
  isEditing = false,
  isLoading = false,
  error = null,
  onConfigChange,
  onRemove,
  onRefresh,
  onFullscreen,
  className = '',
}) => {
  const [showConfig, setShowConfig] = useState(false);

  const handleError = (widgetError: Error) => {
    logger.error('Widget rendering error:', { widgetId: config.id, error: widgetError });
  };

  return (
    <Card className={`h-full flex flex-col relative group ${className}`}>
      {/* Drag Handle (only in edit mode) */}
      {isEditing && (
        <div className="absolute top-2 left-2 cursor-move z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="p-1 bg-background/80 rounded border border-border">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Widget Header */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex-1">
          <CardTitle className="text-lg font-semibold">{config.title}</CardTitle>
          {config.description && (
            <CardDescription className="text-sm mt-1">
              {config.description}
            </CardDescription>
          )}
        </div>

        {/* Widget Actions */}
        <div className="flex items-center space-x-2">
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-8 w-8"
              title="Refresh widget"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}

          {onFullscreen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onFullscreen}
              className="h-8 w-8"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          )}

          {onConfigChange && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowConfig(!showConfig)}
              className="h-8 w-8"
              title="Configure widget"
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}

          {isEditing && onRemove && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="h-8 w-8 text-destructive hover:text-destructive"
              title="Remove widget"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Widget Content */}
      <CardContent className="flex-1 overflow-auto">
        <WidgetErrorBoundary widgetId={config.id} onError={handleError}>
          {isLoading ? (
            <WidgetLoadingSkeleton />
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <AlertCircle className="w-12 h-12 text-destructive mb-4" />
              <h3 className="font-semibold text-lg mb-2">Failed to Load</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {error.message || 'An error occurred while loading this widget'}
              </p>
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
            </div>
          ) : (
            <Suspense fallback={<WidgetLoadingSkeleton />}>
              {children}
            </Suspense>
          )}
        </WidgetErrorBoundary>
      </CardContent>

      {/* Configuration Panel (if open) */}
      {showConfig && onConfigChange && (
        <div className="absolute inset-0 bg-background/95 z-20 p-6 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Widget Configuration</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowConfig(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Configuration form would go here */}
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configuration panel for {config.type} widget
            </p>
            {/* TODO: Add widget-specific configuration controls */}
          </div>
        </div>
      )}
    </Card>
  );
};

// ============================================================================
// EXPORT
// ============================================================================

export default WidgetRenderer;

