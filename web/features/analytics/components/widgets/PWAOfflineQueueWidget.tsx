'use client';

import { useCallback, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePWAActions, usePWAStats } from '@/lib/stores/pwaStore';

import type { WidgetProps } from '../../types/widget';

const QUEUE_WARN_THRESHOLD = 5;

const formatRelativeTime = (value: string | null | undefined) => {
  if (!value) {
    return 'Never';
  }

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return 'Unknown';
  }

  const diffMs = Date.now() - timestamp;
  if (diffMs < 0) {
    return 'Just now';
  }

  const diffSeconds = Math.floor(diffMs / 1000);
  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const getQueueStatus = (size: number, isOffline: boolean, isSyncing: boolean) => {
  if (isSyncing) {
    return {
      label: 'Syncing…',
      tone: 'info' as const,
      icon: RefreshCw,
      description: 'Background sync in progress',
    };
  }

  if (size === 0) {
    const description = isOffline
      ? 'Offline; queue will sync when connection returns'
      : 'Background sync is healthy';
    return {
      label: 'Healthy',
      tone: 'success' as const,
      icon: CheckCircle2,
      description,
    };
  }

  if (size <= QUEUE_WARN_THRESHOLD) {
    return {
      label: 'Monitor',
      tone: 'warn' as const,
      icon: AlertTriangle,
      description: 'Queued actions will sync soon',
    };
  }

  return {
    label: 'Attention',
    tone: 'danger' as const,
    icon: AlertTriangle,
    description: 'Queue is growing; consider manual sync',
  };
};

const toneStyles: Record<'success' | 'warn' | 'danger' | 'info', string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warn: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-red-200 bg-red-50 text-red-700',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
};

const metricLabelStyles = 'text-xs uppercase tracking-wide text-slate-500';
const metricValueStyles = 'text-2xl font-semibold text-slate-900';

export default function PWAOfflineQueueWidget({}: WidgetProps) {
  const stats = usePWAStats();
  const { processOfflineActions } = usePWAActions();
  const [isProcessing, setIsProcessing] = useState(false);

  const queueSize = stats.offlineQueueSize ?? stats.queuedActions;
  const status = useMemo(
    () => getQueueStatus(queueSize, stats.isOffline, stats.isSyncing),
    [queueSize, stats.isOffline, stats.isSyncing]
  );

  const lastUpdatedLabel = useMemo(
    () => formatRelativeTime(stats.offlineQueueUpdatedAt),
    [stats.offlineQueueUpdatedAt]
  );

  const handleProcessOffline = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await processOfflineActions();
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, processOfflineActions]);

  const StatusIcon = status.icon;

  return (
    <div
      data-testid="pwa-offline-queue-widget"
      className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            data-testid="pwa-offline-queue-status"
            className={cn('rounded-lg border px-3 py-1 text-sm font-semibold', toneStyles[status.tone])}
          >
            <StatusIcon className="mr-2 inline-block h-4 w-4 align-middle" />
            <span className="align-middle">{status.label}</span>
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Offline Queue Health</h3>
            <p className="text-sm text-slate-500">Monitor pending PWA actions awaiting background sync.</p>
            <p className="mt-1 text-xs text-slate-400">{status.description}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <p className={metricLabelStyles}>Queued Actions</p>
          <p data-testid="pwa-offline-queue-count" className={metricValueStyles}>
            {queueSize}
          </p>
        </div>
        <div>
          <p className={metricLabelStyles}>Last Update</p>
          <p className="text-lg font-medium text-slate-900">{lastUpdatedLabel}</p>
        </div>
        <div>
          <p className={metricLabelStyles}>Cached Pages</p>
          <p className="text-lg font-medium text-slate-900">{stats.cachedPages}</p>
        </div>
        <div>
          <p className={metricLabelStyles}>Cached Resources</p>
          <p className="text-lg font-medium text-slate-900">{stats.cachedResources}</p>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between pt-6">
        <div className="text-xs text-slate-500">
          {stats.isOffline
            ? 'Device offline — queued actions will process once reconnected.'
            : 'Connected — background sync will process queued actions automatically.'}
        </div>
        <Button
          data-testid="pwa-offline-queue-process"
          variant="outline"
          size="sm"
          onClick={handleProcessOffline}
          disabled={isProcessing || queueSize === 0}
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Process now
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
