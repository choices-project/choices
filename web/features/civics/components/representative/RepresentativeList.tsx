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
import React from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/hooks/useI18n';
import logger from '@/lib/utils/logger';
import type { Representative, RepresentativeListProps } from '@/types/representative';

import { RepresentativeCard } from './RepresentativeCard';

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
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <div className="flex items-center justify-center p-8">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <p className="mt-4 text-gray-600">{t('civics.representatives.list.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('civics.representatives.list.error', { error })}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!representatives || representatives.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <Users className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t('civics.representatives.list.empty.title')}
        </h3>
        <p className="text-gray-600 text-center">
          {t('civics.representatives.list.empty.subtitle')}
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {representatives.map((representative) => (
          <RepresentativeCard
            key={representative.id}
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
    return (
      <div className={className}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('civics.representatives.list.error', { error })}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!representatives || representatives.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <Users className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t('civics.representatives.list.empty.title')}
        </h3>
        <p className="text-gray-600 text-center">
          {t('civics.representatives.list.empty.subtitle')}
        </p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {representatives.map((representative) => (
        <RepresentativeCard
          key={representative.id}
          representative={representative}
          showDetails={showDetails}
          showActions={showActions}
          onFollow={handleFollow}
          onContact={handleContact}
          {...(onRepresentativeClick && { onClick: () => onRepresentativeClick(representative) })}
        />
      ))}
    </div>
  );
}
