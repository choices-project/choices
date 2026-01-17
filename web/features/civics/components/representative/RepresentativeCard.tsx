/**
 * Representative Card Component
 *
 * Displays a single representative with their key information
 * Includes follow/unfollow functionality and contact options
 *
 * Created: October 28, 2025
 * Status: ✅ FOUNDATION
 */

import {
  Mail,
  Phone,
  Globe,
  Twitter,
  Facebook,
  Instagram,
  Heart,
  HeartOff,
  ExternalLink,
  Loader2
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React from 'react';

import { ElectionCountdownBadge } from '@/features/civics/components/countdown/ElectionCountdownBadge';
import { useRepresentativeCtaAnalytics } from '@/features/civics/hooks/useRepresentativeCtaAnalytics';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { useFollowRepresentative } from '@/hooks/useFollowRepresentative';
import { useI18n } from '@/hooks/useI18n';

import type { RepresentativeCardProps } from '@/types/representative';

export function RepresentativeCard({
  representative,
  showDetails = true,
  showActions = true,
  onFollow,
  onContact,
  onClick,
  className = ''
}: RepresentativeCardProps) {
  const router = useRouter();
  const { t } = useI18n();
  const { following, loading, error, toggle } = useFollowRepresentative(representative.id);
  const {
    divisionIds,
    elections: upcomingElections,
    nextElection,
    daysUntilNextElection,
    loading: electionLoading,
    error: electionError,
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

  const handleContact = () => {
    onContact?.(representative);
    trackCtaEvent('civics_representative_contact_click', {
      ctaLocation: 'card',
    });
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

  const getPartyColor = (party: string) => {
    switch (party.toLowerCase()) {
      case 'democratic':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'republican':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'independent':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getOfficeColor = (office: string) => {
    if (office.toLowerCase().includes('senator')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    } else if (office.toLowerCase().includes('representative')) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (office.toLowerCase().includes('governor')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

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
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200">
            {representative.primary_photo_url ? (
              <Image
                src={representative.primary_photo_url}
                alt={representative.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-medium">
                {representative.name.split(' ').map(n => n[0]).join('')}
              </div>
            )}
          </div>

          {/* Representative Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
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
            <p className="text-sm text-gray-600 mt-1">
              {representative.state}
              {representative.district &&
                ` • ${t('civics.representatives.card.district', {
                  district: representative.district,
                })}`}
            </p>

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

      {showDetails && (
        <CardContent className="pt-0">
          {/* Committees */}
          {representative.committees && representative.committees.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                {t('civics.representatives.card.committees.heading')}
              </h4>
              <div className="space-y-1">
                {representative.committees.slice(0, 3).map((committee, index) => (
                  <div key={index} className="text-xs text-gray-600">
                    {t('civics.representatives.card.committees.item', {
                      role: committee.role,
                      name: committee.committee_name,
                    })}
                  </div>
                ))}
                {representative.committees.length > 3 && (
                  <div className="text-xs text-gray-500">
                    {t('civics.representatives.card.committees.more', {
                      count: representative.committees.length - 3,
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="space-y-2">
            {representative.primary_email && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <a
                  href={`mailto:${representative.primary_email}`}
                  className="hover:text-blue-600 truncate"
                >
                  {representative.primary_email}
                </a>
              </div>
            )}

            {representative.primary_phone && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <a
                  href={`tel:${representative.primary_phone}`}
                  className="hover:text-blue-600"
                >
                  {representative.primary_phone}
                </a>
              </div>
            )}

            {representative.primary_website && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Globe className="w-4 h-4" />
                <a
                  href={representative.primary_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 truncate flex items-center space-x-1"
                >
                  <span>{t('civics.representatives.card.contact.website')}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Social Media */}
          <div className="flex space-x-3 mt-3">
            {representative.twitter_handle && (
              <a
                href={`https://twitter.com/${representative.twitter_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
            )}
            {representative.facebook_url && (
              <a
                href={representative.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-600 transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
            )}
            {representative.instagram_handle && (
              <a
                href={`https://instagram.com/${representative.instagram_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-pink-500 transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* Data Quality Indicator */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{t('civics.representatives.card.dataQuality.label')}</span>
              <div className="flex items-center space-x-1">
                <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      representative.data_quality_score >= 90 ? 'bg-green-500' :
                      representative.data_quality_score >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${representative.data_quality_score}%` }}
                  />
                </div>
                <span>{representative.data_quality_score}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      )}

      {showActions && (
        <div className="px-6 pb-4">
          <div className="flex space-x-2">
            <Button
              variant={following ? "outline" : "default"}
              size="sm"
              onClick={handleFollow}
              disabled={loading}
              className="flex-1"
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
