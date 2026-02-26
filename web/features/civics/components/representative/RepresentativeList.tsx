/**
 * Representative List Component
 *
 * Displays a list of representatives with loading states and error handling
 * Supports different display modes and interactions
 *
 * Created: October 28, 2025
 * Status: ✅ FOUNDATION
 */

import { Users } from 'lucide-react';
import React, { Suspense, lazy } from 'react';

import { EnhancedEmptyState } from '@/components/shared/EnhancedEmptyState';
import { EnhancedErrorDisplay } from '@/components/shared/EnhancedErrorDisplay';
import { Skeleton } from '@/components/ui/skeleton';

import logger from '@/lib/utils/logger';

import { useI18n } from '@/hooks/useI18n';

import type { Representative, RepresentativeListProps } from '@/types/representative';

// Lazy load RepresentativeCard for better initial bundle size and performance
// RepresentativeCard is a named export, so we wrap it as default for lazy()
const RepresentativeCard = lazy(() => 
  import('./RepresentativeCard').then(mod => ({ default: mod.RepresentativeCard }))
);


export function RepresentativeList({
  representatives,
  loading = false,
  error,
  showActions = true,
  variant = 'default',
  onRepresentativeContact,
  onRepresentativeFollow,
  onRepresentativeClick,
  onRetry,
  className = ''
}: RepresentativeListProps) {
  const { t } = useI18n();
  const handleContact = onRepresentativeContact ?? ((rep: Representative) => {
    logger.info('Contact:', rep.name);
  });

  const handleFollow = onRepresentativeFollow ?? ((rep: Representative) => {
    logger.info('Followed:', rep.name);
  });

  if (loading) {
    return (
      <div className={className}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="status" aria-live="polite" aria-busy="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
              <div className="flex items-start space-x-4 mb-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex gap-2 mt-4">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400" aria-hidden="true">
          {t('civics.representatives.list.loading') || 'Loading representatives...'}
        </p>
      </div>
    );
  }

  if (error) {
    const errorMessage = typeof error === 'string'
      ? error
      : (error as any)?.message || (error as any)?.error || t('civics.representatives.list.error', { error: 'Unknown error' }) || 'Unable to load representatives';
    const suggestion = (error as any)?.details?.suggestion || (error as any)?.suggestion;

    return (
      <div className={className}>
        <EnhancedErrorDisplay
          title={t('civics.representatives.list.errorTitle') || 'Unable to load representatives'}
          message={errorMessage}
          {...(suggestion && { details: suggestion })}
          canRetry={!!onRetry}
          onRetry={onRetry}
          {...(onRetry && { primaryAction: { label: 'Try again', onClick: onRetry } })}
        />
      </div>
    );
  }

  if (!representatives || representatives.length === 0) {
    return (
      <div className={className}>
        <EnhancedEmptyState
          icon={<Users className="h-12 w-12 text-gray-400 dark:text-gray-500" />}
          title={t('civics.representatives.list.empty.title') || 'No representatives found'}
          description={t('civics.representatives.list.empty.subtitle') || 'Try adjusting your search or filters to find representatives.'}
          {...(onRetry && { primaryAction: { label: 'Try again', onClick: onRetry } })}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {representatives.map((representative) => (
          <Suspense
            key={representative.id}
            fallback={
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900 animate-pulse">
                <div className="flex items-start space-x-4 mb-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full" />
              </div>
            }
          >
            <RepresentativeCard
              representative={representative}
              variant={variant}
              showActions={showActions}
              onFollow={handleFollow}
              onContact={handleContact}
              onClick={() => {
                if (onRepresentativeClick) {
                  onRepresentativeClick(representative);
                }
              }}
            />
          </Suspense>
        ))}
      </div>
    </div>
  );
}

/**
 * Representative Grid Component
 *
 * Alternative grid layout for representatives
 */
export function RepresentativeGrid({
  representatives,
  loading = false,
  error,
  showActions = false,
  variant = 'compact',
  onRepresentativeContact,
  onRepresentativeFollow,
  onRepresentativeClick,
  onRetry,
  className = ''
}: RepresentativeListProps) {
  const { t } = useI18n();
  const handleContact = onRepresentativeContact ?? ((rep: Representative) => {
    logger.info('Contact:', rep.name);
  });

  const handleFollow = onRepresentativeFollow ?? ((rep: Representative) => {
    logger.info('Followed:', rep.name);
  });

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-64 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    const errorMessage = typeof error === 'string'
      ? error
      : (error as any)?.message || (error as any)?.error || t('civics.representatives.list.error', { error: 'Unknown error' }) || 'Unable to load representatives';
    const suggestion = (error as any)?.details?.suggestion || (error as any)?.suggestion;

    return (
      <div className={className}>
        <EnhancedErrorDisplay
          title={t('civics.representatives.list.errorTitle') || 'Unable to load representatives'}
          message={errorMessage}
          {...(suggestion && { details: suggestion })}
          canRetry={!!onRetry}
          onRetry={onRetry}
          {...(onRetry && { primaryAction: { label: 'Try again', onClick: onRetry } })}
        />
      </div>
    );
  }

  if (!representatives || representatives.length === 0) {
    return (
      <div className={className}>
        <EnhancedEmptyState
          icon={<Users className="h-12 w-12 text-gray-400 dark:text-gray-500" />}
          title={t('civics.representatives.list.empty.title') || 'No representatives found'}
          description={t('civics.representatives.list.empty.subtitle') || 'Try adjusting your search or filters to find representatives.'}
          {...(onRetry && { primaryAction: { label: 'Try again', onClick: onRetry } })}
        />
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {representatives.map((representative) => (
        <Suspense
          key={representative.id}
          fallback={
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900 animate-pulse">
              <Skeleton className="h-32 w-full" />
            </div>
          }
        >
          <RepresentativeCard
            representative={representative}
            variant={variant}
            showActions={showActions}
            onFollow={handleFollow}
            onContact={handleContact}
            {...(onRepresentativeClick && { onClick: () => onRepresentativeClick(representative) })}
          />
        </Suspense>
      ))}
    </div>
  );
}
