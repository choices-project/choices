/**
 * Civic Action List Component
 * 
 * Displays a list of civic actions with filtering and pagination
 * 
 * Feature Flag: CIVIC_ENGAGEMENT_V2
 */

'use client';

import { AlertCircle, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { logger } from '@/lib/utils/logger';

import { useI18n } from '@/hooks/useI18n';

import { CivicActionCard, type CivicAction } from './CivicActionCard';

type CivicActionListProps = {
  initialActions?: CivicAction[];
  filters?: {
    status?: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
    action_type?: string;
    category?: string;
    urgency_level?: 'low' | 'medium' | 'high' | 'critical';
    is_public?: boolean;
    target_representative_id?: number;
  };
  onSign?: (actionId: string) => Promise<void>;
  onView?: (actionId: string) => void;
  showCreateButton?: boolean;
  className?: string;
};

export function CivicActionList({
  initialActions = [],
  filters: filtersProp,
  onSign,
  onView,
  showCreateButton = true,
  className = '',
}: CivicActionListProps) {
  const { t } = useI18n();
  const featureEnabled = isFeatureEnabled('CIVIC_ENGAGEMENT_V2');
  const filters = useMemo(() => filtersProp ?? {}, [filtersProp]);
  const [actions, setActions] = useState<CivicAction[]>(initialActions);
  const [loading, setLoading] = useState(!initialActions.length);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [signedActions, setSignedActions] = useState<Set<string>>(new Set());
  const offsetRef = useRef(initialActions.length);

  const fetchActions = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

      const resolvedOffset = reset ? 0 : offsetRef.current;
      const params = new URLSearchParams({
        limit: '20',
        offset: resolvedOffset.toString(),
        sort: 'created_at',
        order: 'desc',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== undefined && v !== null)
        ),
      });

      const response = await fetch(`/api/civic-actions?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(t('civics.actions.list.errors.fetch'));
      }

      const data = await response.json();
      
      if (data.success) {
        const newActions = data.data as CivicAction[];
        setActions(prev => (reset ? newActions : [...prev, ...newActions]));
        setHasMore(data.metadata?.pagination?.hasMore ?? false);
        offsetRef.current = reset
          ? newActions.length
          : offsetRef.current + newActions.length;
      } else {
        throw new Error(data.error || t('civics.actions.list.errors.fetch'));
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t('civics.actions.list.errors.generic');
      setError(errorMessage);
      logger.error('Error fetching civic actions', err);
    } finally {
      setLoading(false);
    }
  }, [filters, t]);

  useEffect(() => {
    if (!initialActions.length) {
      fetchActions(true);
    }
  }, [initialActions.length, fetchActions]);

  const handleSign = async (actionId: string) => {
    if (onSign) {
      await onSign(actionId);
    } else {
      // Default sign handler
      try {
        const response = await fetch(`/api/civic-actions/${actionId}/sign`, {
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error(t('civics.actions.list.errors.sign'));
        }

        const data = await response.json();
        if (data.success) {
          setSignedActions(prev => new Set(prev).add(actionId));
          // Update the action in the list
          setActions(prev =>
            prev.map(action =>
              action.id === actionId
                ? { ...action, current_signatures: data.data.signature_count }
                : action
            )
          );
        }
      } catch (err) {
        logger.error('Error signing action', err);
        throw err;
      }
    }
  };

  if (!featureEnabled) {
    return null;
  }

  if (loading && actions.length === 0) {
    return (
      <div
        className={`space-y-4 ${className}`}
        role="status"
        aria-live="polite"
      >
        <p className="text-sm text-muted-foreground">
          {t('civics.actions.list.loading')}
        </p>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border rounded-lg p-6">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('civics.actions.list.errors.display', { error })}
          </AlertDescription>
        </Alert>
        <Button onClick={() => fetchActions(true)} className="mt-4">
          {t('common.actions.retry')}
        </Button>
      </div>
    );
  }

  const createHref = filters.target_representative_id
    ? `/civic-actions/create?representative_id=${filters.target_representative_id}`
    : '/civic-actions/create';

  if (actions.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <p className="text-gray-600 mb-4">
          {t('civics.actions.list.empty')}
        </p>
        {showCreateButton && (
          <Link href={createHref}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {t('civics.actions.list.buttons.create')}
            </Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {showCreateButton && (
        <div className="mb-6 flex justify-end">
          <Link href={createHref}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {t('civics.actions.list.buttons.create')}
            </Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {actions.map((action) => (
          <CivicActionCard
            key={action.id}
            action={action}
            onSign={handleSign}
            {...(onView ? { onView } : {})}
            signed={signedActions.has(action.id)}
          />
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button
            onClick={() => fetchActions()}
            disabled={loading}
            variant="outline"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('civics.actions.list.loadingMore')}
              </>
            ) : (
              t('civics.actions.list.buttons.loadMore')
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

