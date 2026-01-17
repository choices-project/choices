/**
 * Representative List Component
 *
 * Displays a list of representatives with loading states and error handling
 * Supports different display modes and interactions
 *
 * Created: October 28, 2025
 * Status: ✅ FOUNDATION
 */

import { AlertCircle, Users } from 'lucide-react';
import React, { Suspense, lazy } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
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
  showDetails = true,
  onRepresentativeContact,
  onRepresentativeFollow,
  onRepresentativeClick,
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
    // Extract user-friendly error message from API response if available
    const errorMessage = typeof error === 'string' 
      ? error 
      : (error as any)?.message || (error as any)?.error || t('civics.representatives.list.error', { error: 'Unknown error' }) || 'Unable to load representatives';
    
    // Check if API response includes actionable suggestions
    const suggestion = (error as any)?.details?.suggestion || (error as any)?.suggestion;
    const retryAfter = (error as any)?.details?.retryAfter || (error as any)?.retryAfter;

    return (
      <div className={className} role="alert" aria-live="assertive">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            <p className="font-medium mb-1">{errorMessage}</p>
            {suggestion && (
              <p className="text-sm mt-2 opacity-90">{suggestion}</p>
            )}
            {retryAfter && (
              <p className="text-xs mt-2 opacity-75">
                {t('civics.representatives.list.retry', { seconds: retryAfter }) || `Please try again in ${retryAfter} seconds.`}
              </p>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!representatives || representatives.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`} role="status" aria-live="polite">
        <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" aria-hidden="true" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {t('civics.representatives.list.empty.title') || 'No representatives found'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center">
          {t('civics.representatives.list.empty.subtitle') || 'Try adjusting your search or filters to find representatives.'}
        </p>
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
            showActions={showActions}
            showDetails={showDetails}
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
  showDetails = false,
  onRepresentativeContact,
  onRepresentativeFollow,
  onRepresentativeClick,
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
    // Extract user-friendly error message from API response if available
    const errorMessage = typeof error === 'string' 
      ? error 
      : (error as any)?.message || (error as any)?.error || t('civics.representatives.list.error', { error: 'Unknown error' }) || 'Unable to load representatives';
    
    // Check if API response includes actionable suggestions
    const suggestion = (error as any)?.details?.suggestion || (error as any)?.suggestion;
    const retryAfter = (error as any)?.details?.retryAfter || (error as any)?.retryAfter;

    return (
      <div className={className} role="alert" aria-live="assertive">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            <p className="font-medium mb-1">{errorMessage}</p>
            {suggestion && (
              <p className="text-sm mt-2 opacity-90">{suggestion}</p>
            )}
            {retryAfter && (
              <p className="text-xs mt-2 opacity-75">
                {t('civics.representatives.list.retry', { seconds: retryAfter }) || `Please try again in ${retryAfter} seconds.`}
              </p>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!representatives || representatives.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`} role="status" aria-live="polite">
        <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" aria-hidden="true" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {t('civics.representatives.list.empty.title') || 'No representatives found'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center">
          {t('civics.representatives.list.empty.subtitle') || 'Try adjusting your search or filters to find representatives.'}
        </p>
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
          showDetails={showDetails}
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
