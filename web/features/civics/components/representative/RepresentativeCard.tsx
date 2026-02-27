/**
 * Representative Card Component
 *
 * Displays a single representative with their key information
 * Includes follow/unfollow functionality and contact options
 *
 * Created: October 28, 2025
 * Status: ✅ FOUNDATION
 */

'use client';

import {
  Mail,
  Globe,
  Heart,
  HeartOff,
  Loader2,
  Plus
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';

import { ElectionCountdownBadge } from '@/features/civics/components/countdown/ElectionCountdownBadge';
import { useRepresentativeCtaAnalytics } from '@/features/civics/hooks/useRepresentativeCtaAnalytics';
import { formatElectionDateStable } from '@/features/civics/utils/civicsCountdownUtils';
import { formatRepresentativeLocation } from '@/features/civics/utils/formatRepresentativeLocation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { useFollowRepresentative } from '@/hooks/useFollowRepresentative';
import { useI18n } from '@/hooks/useI18n';

import type { RepresentativeCardProps } from '@/types/representative';

export function RepresentativeCard({
  representative,
  variant = 'default',
  showActions = true,
  onFollow,
  onContact,
  onCreatePoll,
  onClick,
  className = ''
}: RepresentativeCardProps) {
  const router = useRouter();
  const { t } = useI18n();
  const { following, loading, error, toggle } = useFollowRepresentative(representative.id);
  const [photoError, setPhotoError] = React.useState(false);
  const effectiveVariant = variant === 'default' ? 'compact' : variant;
  const {
    divisionIds,
    elections: upcomingElections,
    nextElection,
    daysUntilNextElection,
    loading: electionLoading,
    error: electionError,
    repNextElectionDate,
    trackCtaEvent,
  } = useRepresentativeCtaAnalytics(representative, { source: 'representative_card' });

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    const success = await toggle();
    if (success) {
      onFollow?.(representative);
      trackCtaEvent(
        'civics_representative_follow_toggle',
        {
          action: following ? 'unfollow' : 'follow',
          previousFollowState: following ? 'following' : 'not_following',
        },
        {
          value: following ? 0 : 1,
        },
      );
    }
  };

  const handleContact = (e?: React.MouseEvent) => {
    e?.stopPropagation?.();
    if (onContact) {
      onContact(representative);
    } else {
      router.push(`/representatives/${representative.id}`);
    }
    trackCtaEvent('civics_representative_contact_click', {
      ctaLocation: 'card',
    });
  };

  const handleCreatePoll = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    e.preventDefault(); // Prevent any default behavior
    trackCtaEvent('civics_representative_create_poll_click', {
      ctaLocation: 'card',
      representativeId: representative.id,
    });

    try {
      if (onCreatePoll) {
        onCreatePoll(representative);
      } else {
        // Use window.location for more reliable navigation
        if (typeof window !== 'undefined') {
          window.location.href = `/polls/create?representative_id=${representative.id}`;
        } else {
          router.push(`/polls/create?representative_id=${representative.id}`);
        }
      }
    } catch (error) {
      console.error('Failed to navigate to create poll:', error);
      // Fallback to router if window.location fails
      router.push(`/polls/create?representative_id=${representative.id}`);
    }
  };

  const handleCardClick = () => {
    trackCtaEvent('civics_representative_view_details', {
      ctaLocation: 'representative_card',
    });

    // If onClick handler is provided, use it; otherwise navigate to detail page
    if (onClick) {
      onClick(representative);
    } else {
      router.push(`/representatives/${representative.id}`);
    }
  };

  // WCAG 2.1 AA: use -900 text on -100 bg for 4.5:1+ contrast
  const getPartyColor = (party: string) => {
    switch (party.toLowerCase()) {
      case 'democratic':
        return 'bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-900/30 dark:text-blue-100 dark:border-blue-700';
      case 'republican':
        return 'bg-red-100 text-red-900 border-red-200 dark:bg-red-900/30 dark:text-red-100 dark:border-red-700';
      case 'independent':
        return 'bg-gray-100 text-gray-900 border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600';
      default:
        return 'bg-gray-100 text-gray-900 border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600';
    }
  };

  const getOfficeColor = (office: string) => {
    if (office.toLowerCase().includes('senator')) {
      return 'bg-purple-100 text-purple-900 border-purple-200 dark:bg-purple-900/30 dark:text-purple-100 dark:border-purple-700';
    } else if (office.toLowerCase().includes('representative')) {
      return 'bg-green-100 text-green-900 border-green-200 dark:bg-green-900/30 dark:text-green-100 dark:border-green-700';
    } else if (office.toLowerCase().includes('governor')) {
      return 'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900/30 dark:text-amber-100 dark:border-amber-700';
    }
    return 'bg-gray-100 text-gray-900 border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600';
  };

  React.useEffect(() => {
    setPhotoError(false);
  }, [representative.id, representative.primary_photo_url]);

  // Sync ref with state to persist across re-renders
  const locationLine = formatRepresentativeLocation({
    state: representative.state,
    office_city: representative.office_city ?? null,
    district: representative.district ?? null,
  });

  return (
    <Card
      className={`w-full max-w-md mx-auto cursor-pointer transition-all duration-200 ease-in-out hover:shadow-lg hover:-translate-y-1 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 ${className}`}
      onClick={handleCardClick}
      role="article"
      aria-label={`Representative ${representative.name}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-4">
          {/* Representative Photo */}
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
            {representative.primary_photo_url && !photoError ? (
              <Image
                src={representative.primary_photo_url}
                alt={representative.name}
                fill
                className="object-cover"
                sizes="64px"
                onError={() => setPhotoError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 text-sm font-medium">
                {representative.name.split(' ').map(n => n[0]).join('')}
              </div>
            )}
          </div>

          {/* Representative Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {representative.name}
            </h3>
            <div className="flex flex-wrap gap-2 mt-1">
              <Badge className={`text-xs ${getPartyColor(representative.party)}`}>
                {representative.party}
              </Badge>
              <Badge className={`text-xs ${getOfficeColor(representative.office)}`}>
                {representative.office}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {locationLine}
            </p>

            {repNextElectionDate && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5" role="status">
                Next election: {formatElectionDateStable(repNextElectionDate)}
              </p>
            )}
            {divisionIds.length > 0 && (
              <div className="mt-2">
                <ElectionCountdownBadge
                  loading={electionLoading}
                  error={electionError ?? null}
                  nextElection={nextElection ?? null}
                  daysUntil={daysUntilNextElection ?? null}
                  totalUpcoming={upcomingElections.length}
                />
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      {effectiveVariant === 'detailed' && (
        <CardContent className="pt-0">
          {(representative.primary_email || representative.primary_website) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
              {representative.primary_email && (
                <a
                  href={`mailto:${representative.primary_email}`}
                  className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="truncate">{representative.primary_email}</span>
                </a>
              )}
              {representative.primary_website && (
                <a
                  href={representative.primary_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Globe className="w-4 h-4 shrink-0" />
                  <span className="truncate">Website</span>
                </a>
              )}
            </div>
          )}
          <Link
            href={`/representatives/${representative.id}`}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            View full profile →
          </Link>
        </CardContent>
      )}

      {showActions && (
        <div className="px-6 pb-4">
          <div className="flex flex-col space-y-2">
            <div className="flex space-x-2">
              <Button
                variant={following ? "outline" : "default"}
                size="sm"
                onClick={handleFollow}
                disabled={loading}
                className={`flex-1 ${following ? 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700' : 'text-white dark:text-gray-100'}`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    {following
                      ? t('civics.representatives.card.actions.unfollowing')
                      : t('civics.representatives.card.actions.following')}
                  </>
                ) : following ? (
                  <>
                    <HeartOff className="w-4 h-4 mr-1" />
                    {t('civics.representatives.card.actions.unfollow')}
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 mr-1" />
                    {t('civics.representatives.card.actions.follow')}
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleContact}
                className="flex-1"
              >
                {t('civics.representatives.card.contact.button')}
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCreatePoll}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create Poll
            </Button>
          </div>
          {error && (
            <p className="text-xs text-red-600 mt-2">
              {t('civics.representatives.card.errors.follow', { message: error })}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
