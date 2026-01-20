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
  Phone,
  Globe,
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
import { useGetRepresentativeById, useRepresentativeById } from '@/lib/stores/representativeStore';

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
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [detailsLoading, setDetailsLoading] = React.useState(false);
  const detailedRepresentative = useRepresentativeById(representative.id);
  const getRepresentativeById = useGetRepresentativeById();
  const [photoError, setPhotoError] = React.useState(false);
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

  React.useEffect(() => {
    setPhotoError(false);
  }, [representative.id, representative.primary_photo_url]);

  React.useEffect(() => {
    if (!detailsOpen) {
      return;
    }
    if (detailedRepresentative) {
      return;
    }
    let cancelled = false;
    setDetailsLoading(true);
    getRepresentativeById(representative.id, { forceRefresh: true })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setDetailsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [detailsOpen, detailedRepresentative, getRepresentativeById, representative.id]);

  const displayRepresentative = detailedRepresentative ?? representative;
  const formatDate = (value?: string | null) => {
    if (!value) return null;
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return value;
    }
  };

  const socialChannels = [
    displayRepresentative.twitter_handle
      ? {
          label: 'Twitter',
          value: `@${displayRepresentative.twitter_handle.replace(/^@/, '')}`,
          url: `https://twitter.com/${displayRepresentative.twitter_handle.replace(/^@/, '')}`,
        }
      : null,
    displayRepresentative.facebook_url
      ? {
          label: 'Facebook',
          value: 'Facebook',
          url: displayRepresentative.facebook_url,
        }
      : null,
    displayRepresentative.instagram_handle
      ? {
          label: 'Instagram',
          value: `@${displayRepresentative.instagram_handle.replace(/^@/, '')}`,
          url: `https://instagram.com/${displayRepresentative.instagram_handle.replace(/^@/, '')}`,
        }
      : null,
    displayRepresentative.youtube_channel
      ? {
          label: 'YouTube',
          value: 'YouTube',
          url: displayRepresentative.youtube_channel,
        }
      : null,
    displayRepresentative.linkedin_url
      ? {
          label: 'LinkedIn',
          value: 'LinkedIn',
          url: displayRepresentative.linkedin_url,
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string; url: string }>;

  const extraSocial = (displayRepresentative.social_media ?? [])
    .map((entry) => ({
      label: entry.platform,
      value: entry.handle,
      url: entry.url ?? null,
    }))
    .filter((entry) => entry.value);

  const contactItems = [
    displayRepresentative.primary_email
      ? { label: 'Email', value: displayRepresentative.primary_email, href: `mailto:${displayRepresentative.primary_email}` }
      : null,
    displayRepresentative.primary_phone
      ? { label: 'Phone', value: displayRepresentative.primary_phone, href: `tel:${displayRepresentative.primary_phone}` }
      : null,
    displayRepresentative.primary_website
      ? { label: 'Website', value: displayRepresentative.primary_website, href: displayRepresentative.primary_website }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string; href: string }>;

  const extraContacts = (displayRepresentative.contacts ?? []).map((contact) => ({
    label: contact.contact_type,
    value: contact.value,
    href: contact.contact_type === 'email'
      ? `mailto:${contact.value}`
      : contact.contact_type === 'phone'
      ? `tel:${contact.value}`
      : contact.value.startsWith('http')
      ? contact.value
      : undefined,
  }));

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
            {displayRepresentative.primary_photo_url && !photoError ? (
              <Image
                src={displayRepresentative.primary_photo_url}
                alt={displayRepresentative.name}
                fill
                className="object-cover"
                sizes="64px"
                onError={() => setPhotoError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-medium">
                {displayRepresentative.name.split(' ').map(n => n[0]).join('')}
              </div>
            )}
          </div>

          {/* Representative Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {displayRepresentative.name}
            </h3>
            <div className="flex flex-wrap gap-2 mt-1">
              <Badge className={`text-xs ${getPartyColor(displayRepresentative.party)}`}>
                {displayRepresentative.party}
              </Badge>
              <Badge className={`text-xs ${getOfficeColor(displayRepresentative.office)}`}>
                {displayRepresentative.office}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {displayRepresentative.state}
              {displayRepresentative.district &&
                ` • ${t('civics.representatives.card.district', {
                  district: displayRepresentative.district,
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
          <div className="flex items-center justify-between mb-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                setDetailsOpen((prev) => !prev);
              }}
            >
              {detailsOpen ? 'Hide details' : 'Show details'}
            </Button>
            {detailsLoading && (
              <span className="text-xs text-gray-500 flex items-center">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Loading details
              </span>
            )}
          </div>

          {/* Committees */}
          {detailsOpen && displayRepresentative.committees && displayRepresentative.committees.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                {t('civics.representatives.card.committees.heading')}
              </h4>
              <div className="space-y-1">
                {displayRepresentative.committees.slice(0, 3).map((committee, index) => (
                  <div key={index} className="text-xs text-gray-600">
                    {t('civics.representatives.card.committees.item', {
                      role: committee.role,
                      name: committee.committee_name,
                    })}
                  </div>
                ))}
                {displayRepresentative.committees.length > 3 && (
                  <div className="text-xs text-gray-500">
                    {t('civics.representatives.card.committees.more', {
                      count: displayRepresentative.committees.length - 3,
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="space-y-2">
            {contactItems.map((item) => (
              <div key={item.label} className="flex items-center space-x-2 text-sm text-gray-600">
                {item.label === 'Email' ? <Mail className="w-4 h-4" /> : item.label === 'Phone' ? <Phone className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                <a
                  href={item.href}
                  className="hover:text-blue-600 truncate"
                  onClick={(event) => event.stopPropagation()}
                >
                  {item.value}
                </a>
              </div>
            ))}

            {detailsOpen && extraContacts.length > 0 && (
              <div className="space-y-1">
                {extraContacts.slice(0, 3).map((contact, index) => (
                  <div key={`${contact.label}-${index}`} className="flex items-center space-x-2 text-xs text-gray-500">
                    <ExternalLink className="w-3 h-3" />
                    {contact.href ? (
                      <a
                        href={contact.href}
                        className="hover:text-blue-600 truncate"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {contact.label}: {contact.value}
                      </a>
                    ) : (
                      <span className="truncate">{contact.label}: {contact.value}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {detailsOpen && (
              <div className="text-xs text-gray-500">
                {displayRepresentative.term_start_date && (
                  <div>Term start: {formatDate(displayRepresentative.term_start_date)}</div>
                )}
                {displayRepresentative.term_end_date && (
                  <div>Term end: {formatDate(displayRepresentative.term_end_date)}</div>
                )}
                {displayRepresentative.next_election_date && (
                  <div>Next election: {formatDate(displayRepresentative.next_election_date)}</div>
                )}
              </div>
            )}
          </div>

          {detailsOpen && (
            <div className="mt-4 space-y-2 text-xs text-gray-600">
              <div>
                Data quality: {Math.round(displayRepresentative.data_quality_score ?? 0)}%
                {displayRepresentative.verification_status ? ` • ${displayRepresentative.verification_status}` : ''}
              </div>
              {Array.isArray(displayRepresentative.data_sources) && displayRepresentative.data_sources.length > 0 && (
                <div>Sources: {displayRepresentative.data_sources.slice(0, 3).join(', ')}</div>
              )}
            </div>
          )}

          {detailsOpen && (socialChannels.length > 0 || extraSocial.length > 0) && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Social</h4>
              <div className="space-y-1">
                {socialChannels.map((channel) => (
                  <a
                    key={`${channel.label}-${channel.url}`}
                    href={channel.url}
                    className="flex items-center text-xs text-gray-600 hover:text-blue-600"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <ExternalLink className="w-3 h-3 mr-2" />
                    {channel.label}: {channel.value}
                  </a>
                ))}
                {extraSocial.slice(0, 3).map((channel, index) => (
                  <span key={`${channel.label}-${index}`} className="flex items-center text-xs text-gray-600">
                    <ExternalLink className="w-3 h-3 mr-2" />
                    {channel.label}: {channel.value}
                  </span>
                ))}
              </div>
            </div>
          )}

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
