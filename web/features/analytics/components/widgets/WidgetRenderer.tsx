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

import { 
  Settings, 
  X, 
  RefreshCw, 
  Maximize2, 
  AlertCircle,
  GripVertical,
  Move,
  Expand,
} from 'lucide-react';
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import ScreenReaderSupport from '@/lib/accessibility/screen-reader';
import { useWidgetStoreScoped, selectKeyboardMode } from '@/lib/stores/widgetStore';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

import { useI18n } from '@/hooks/useI18n';

import type { WidgetConfig } from '../../types/widget';


// ============================================================================
// ERROR BOUNDARY
// ============================================================================

type WidgetErrorBoundaryProps = {
  children: React.ReactNode;
  widgetId: string;
  onError?: (error: Error) => void;
};

type WidgetErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

class WidgetErrorBoundary extends React.Component<WidgetErrorBoundaryProps, WidgetErrorBoundaryState> {
  override state: WidgetErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Widget error:', { widgetId: this.props.widgetId, error, errorInfo });
    this.props.onError?.(error);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h3 className="font-semibold text-lg mb-2">Widget Error</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {this.state.error?.message ?? 'Something went wrong loading this widget'}
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
    <div className="h-4 bg-muted rounded w-1/3" />
    <div className="h-64 bg-muted rounded" />
    <div className="grid grid-cols-3 gap-4">
      <div className="h-8 bg-muted rounded" />
      <div className="h-8 bg-muted rounded" />
      <div className="h-8 bg-muted rounded" />
    </div>
  </div>
);

// ============================================================================
// WIDGET RENDERER PROPS
// ============================================================================

export type WidgetRendererProps = {
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
  const { t } = useI18n();
  const [showConfig, setShowConfig] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const selectedWidgetId = useWidgetStoreScoped((state) => state.selectedWidgetId);
  const keyboardMode = useWidgetStoreScoped(selectKeyboardMode);
  const setSelectedWidget = useWidgetStoreScoped((state) => state.setSelectedWidget);
  const setKeyboardMode = useWidgetStoreScoped((state) => state.setKeyboardMode);
  const nudgeWidgetPosition = useWidgetStoreScoped((state) => state.nudgeWidgetPosition);
  const nudgeWidgetSize = useWidgetStoreScoped((state) => state.nudgeWidgetSize);
  const widgetState = useWidgetStoreScoped((state) => state.widgets.get(config.id));

  const activeWidget = widgetState ?? config;
  const isSelected = selectedWidgetId === config.id;
  const isMoveMode = isSelected && keyboardMode === 'move';
  const isResizeMode = isSelected && keyboardMode === 'resize';
  const instructionsId = `${config.id}-keyboard-instructions`;
  const moveButtonAriaLabel = t('analytics.widgets.moveButtonAria' as never);
  const resizeButtonAriaLabel = t('analytics.widgets.resizeButtonAria' as never);

  const handleError = (widgetError: Error) => {
    logger.error('Widget rendering error:', { widgetId: config.id, error: widgetError });
  };

  const focusCard = useCallback(() => {
    requestAnimationFrame(() => {
      cardRef.current?.focus();
    });
  }, []);

  const announce = useCallback(
    (
      key: string,
      params?: Record<string, string | number>,
      priority: 'polite' | 'assertive' = 'polite',
    ) => {
      const message = t(key as never, params as never);
      if (process.env.NODE_ENV !== 'production') {
        logger.debug('[WidgetRenderer][announce]', {
          key,
          message,
          priority,
        });
      }
      ScreenReaderSupport.announce(message, priority);
    },
    [t],
  );

  const exitKeyboardMode = useCallback(
    (messageKey?: string) => {
      setKeyboardMode('idle');
      if (messageKey) {
        announce(messageKey);
      }
    },
    [announce, setKeyboardMode],
  );

  const handleToggleMove = useCallback(() => {
    if (!isEditing) {
      return;
    }

    if (isMoveMode) {
      exitKeyboardMode('analytics.widgets.moveModeOff');
      return;
    }

    setSelectedWidget(config.id);
    setKeyboardMode('move');
    focusCard();
    announce('analytics.widgets.moveModeOn', { title: activeWidget.title }, 'assertive');
  }, [
    activeWidget.title,
    announce,
    config.id,
    exitKeyboardMode,
    focusCard,
    isEditing,
    isMoveMode,
    setKeyboardMode,
    setSelectedWidget,
  ]);

  const handleToggleResize = useCallback(() => {
    if (!isEditing) {
      return;
    }

    if (isResizeMode) {
      exitKeyboardMode('analytics.widgets.resizeModeOff');
      return;
    }

    setSelectedWidget(config.id);
    setKeyboardMode('resize');
    focusCard();
    announce('analytics.widgets.resizeModeOn', { title: activeWidget.title }, 'assertive');
  }, [
    activeWidget.title,
    announce,
    config.id,
    exitKeyboardMode,
    focusCard,
    isEditing,
    isResizeMode,
    setKeyboardMode,
    setSelectedWidget,
  ]);

  useEffect(() => {
    if (!isEditing) {
      if (keyboardMode !== 'idle') {
        setKeyboardMode('idle');
      }
      return;
    }

    if ((isMoveMode || isResizeMode) && cardRef.current) {
      focusCard();
    }
  }, [focusCard, isEditing, isMoveMode, isResizeMode, keyboardMode, setKeyboardMode]);

  const handleFocus = useCallback(() => {
    if (!isEditing) {
      return;
    }
    if (!isSelected) {
      setSelectedWidget(config.id);
    }
  }, [config.id, isEditing, isSelected, setSelectedWidget]);

  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      if (!cardRef.current) {
        return;
      }

      const related = event.relatedTarget as Node | null;
      if (!related || !cardRef.current.contains(related)) {
        setKeyboardMode('idle');
        setSelectedWidget(null);
      }
    },
    [setKeyboardMode, setSelectedWidget],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!isEditing || !isSelected) {
        return;
      }

      if (keyboardMode === 'idle') {
        if (event.key.toLowerCase() === 'm') {
          event.preventDefault();
          handleToggleMove();
        }
        if (event.key.toLowerCase() === 'r') {
          event.preventDefault();
          handleToggleResize();
        }
        return;
      }

      const step = event.shiftKey ? 2 : 1;

      const handlePositionAnnouncement = (position: { x: number; y: number }) => {
        announce('analytics.widgets.positionUpdate', {
          column: position.x + 1,
          row: position.y + 1,
        });
      };

      const handleSizeAnnouncement = (size: { w: number; h: number }) => {
        announce('analytics.widgets.sizeUpdate', {
          width: size.w,
          height: size.h,
        });
      };

      if (keyboardMode === 'move') {
        switch (event.key) {
          case 'ArrowUp': {
            event.preventDefault();
            const next = nudgeWidgetPosition(config.id, 0, -step);
            if (next) handlePositionAnnouncement(next);
            return;
          }
          case 'ArrowDown': {
            event.preventDefault();
            const next = nudgeWidgetPosition(config.id, 0, step);
            if (next) handlePositionAnnouncement(next);
            return;
          }
          case 'ArrowLeft': {
            event.preventDefault();
            const next = nudgeWidgetPosition(config.id, -step, 0);
            if (next) handlePositionAnnouncement(next);
            return;
          }
          case 'ArrowRight': {
            event.preventDefault();
            const next = nudgeWidgetPosition(config.id, step, 0);
            if (next) handlePositionAnnouncement(next);
            return;
          }
          default:
            break;
        }
      }

      if (keyboardMode === 'resize') {
        switch (event.key) {
          case 'ArrowUp': {
            event.preventDefault();
            const next = nudgeWidgetSize(config.id, 0, -step);
            if (next) handleSizeAnnouncement(next);
            return;
          }
          case 'ArrowDown': {
            event.preventDefault();
            const next = nudgeWidgetSize(config.id, 0, step);
            if (next) handleSizeAnnouncement(next);
            return;
          }
          case 'ArrowLeft': {
            event.preventDefault();
            const next = nudgeWidgetSize(config.id, -step, 0);
            if (next) handleSizeAnnouncement(next);
            return;
          }
          case 'ArrowRight': {
            event.preventDefault();
            const next = nudgeWidgetSize(config.id, step, 0);
            if (next) handleSizeAnnouncement(next);
            return;
          }
          default:
            break;
        }
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        exitKeyboardMode(
          keyboardMode === 'move'
            ? 'analytics.widgets.moveModeOff'
            : 'analytics.widgets.resizeModeOff',
        );
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        exitKeyboardMode(
          keyboardMode === 'move'
            ? 'analytics.widgets.moveModeOff'
            : 'analytics.widgets.resizeModeOff',
        );
        return;
      }

      if (event.key === 'Tab') {
        setKeyboardMode('idle');
      }
    },
    [
      announce,
      config.id,
      exitKeyboardMode,
      handleToggleMove,
      handleToggleResize,
      isEditing,
      isSelected,
      keyboardMode,
      nudgeWidgetPosition,
      nudgeWidgetSize,
      setKeyboardMode,
    ],
  );

  const cardClassName = useMemo(
    () =>
      cn(
        'h-full flex flex-col relative group focus:outline-none',
        isSelected ? 'ring-2 ring-offset-2 ring-primary' : '',
        className,
      ),
    [className, isSelected],
  );

  return (
    <Card
      ref={cardRef}
      className={cardClassName}
      tabIndex={isEditing ? 0 : undefined}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      aria-describedby={isEditing ? instructionsId : undefined}
      data-widget-id={config.id}
    >
      {isEditing && (
        <p id={instructionsId} className="sr-only">
          {isMoveMode || isResizeMode
            ? t(
                isMoveMode
                  ? ('analytics.widgets.moveModeInstructions' as never)
                  : ('analytics.widgets.resizeModeInstructions' as never),
              )
            : t('analytics.widgets.defaultInstructions' as never)}
        </p>
      )}
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
          {isEditing && (
            <>
              <Button
                variant={isMoveMode ? 'default' : 'outline'}
                size="icon"
                onClick={handleToggleMove}
                aria-pressed={isMoveMode}
                aria-label={moveButtonAriaLabel}
                aria-describedby={instructionsId}
                aria-controls={instructionsId}
                aria-keyshortcuts="m"
                className="h-8 w-8"
                title={t('analytics.widgets.moveButton' as never)}
              >
                <Move className="w-4 h-4" />
              </Button>
              <Button
                variant={isResizeMode ? 'default' : 'outline'}
                size="icon"
                onClick={handleToggleResize}
                aria-pressed={isResizeMode}
                aria-label={resizeButtonAriaLabel}
                aria-describedby={instructionsId}
                aria-controls={instructionsId}
                aria-keyshortcuts="r"
                className="h-8 w-8"
                title={t('analytics.widgets.resizeButton' as never)}
              >
                <Expand className="w-4 h-4" />
              </Button>
            </>
          )}

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
            <div className="grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor={`${config.id}-title`}>
                  Title
                </label>
                <input
                  id={`${config.id}-title`}
                  className="w-full rounded border bg-background p-2 text-sm"
                  defaultValue={config.title}
                  onBlur={(e) => onConfigChange?.({ title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor={`${config.id}-description`}>
                  Description
                </label>
                <textarea
                  id={`${config.id}-description`}
                  className="w-full rounded border bg-background p-2 text-sm"
                  rows={3}
                  defaultValue={config.description ?? ''}
                  onBlur={(e) => onConfigChange?.({ description: e.target.value })}
                />
              </div>
            </div>
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

