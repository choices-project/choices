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
  Loader2,
  Plus
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React from 'react';

import { ElectionCountdownBadge } from '@/features/civics/components/countdown/ElectionCountdownBadge';
import { useRepresentativeCtaAnalytics } from '@/features/civics/hooks/useRepresentativeCtaAnalytics';
import { formatElectionDateStable } from '@/features/civics/utils/civicsCountdownUtils';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { useGetRepresentativeById, useRepresentativeById } from '@/lib/stores/representativeStore';

import { useFollowRepresentative } from '@/hooks/useFollowRepresentative';
import { useI18n } from '@/hooks/useI18n';

import type { RepresentativeCardProps } from '@/types/representative';

export function RepresentativeCard({
  representative,
  showDetails = true,
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
    repNextElectionDate,
    trackCtaEvent,
  } = useRepresentativeCtaAnalytics(detailedRepresentative ?? representative, { source: 'representative_card' });

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

  const handleCreatePoll = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    trackCtaEvent('civics_representative_create_poll_click', {
      ctaLocation: 'card',
      representativeId: representative.id,
    });
    
    if (onCreatePoll) {
      onCreatePoll(representative);
    } else {
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
      setDetailsLoading(false);
      return;
    }
    let cancelled = false;
    setDetailsLoading(true);

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        setDetailsLoading(false);
      }
    }, 10000); // 10 second timeout

    const fetchDetails = async () => {
      try {
        await getRepresentativeById(representative.id, { forceRefresh: true });
      } catch (error) {
        // Silently handle errors - user can retry by toggling details
        console.error('Failed to load representative details:', error);
      } finally {
        clearTimeout(timeoutId);
        if (!cancelled) {
          setDetailsLoading(false);
        }
      }
    };

    void fetchDetails();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [detailsOpen, detailedRepresentative, getRepresentativeById, representative.id]);

  const displayRepresentative = detailedRepresentative ?? representative;

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
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
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
              <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 text-sm font-medium">
                {displayRepresentative.name.split(' ').map(n => n[0]).join('')}
              </div>
            )}
          </div>

          {/* Representative Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {displayRepresentative.name}
            </h3>
            <div className="flex flex-wrap gap-2 mt-1">
              <Badge className={`text-xs ${getPartyColor(displayRepresentative.party)} dark:opacity-90`}>
                {displayRepresentative.party}
              </Badge>
              <Badge className={`text-xs ${getOfficeColor(displayRepresentative.office)} dark:opacity-90`}>
                {displayRepresentative.office}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {displayRepresentative.state}
              {displayRepresentative.district &&
                ` • ${t('civics.representatives.card.district', {
                  district: displayRepresentative.district,
                })}`}
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

          {detailsOpen && (
            <div className="space-y-4">
              {/* Social Media */}
              {(socialChannels.length > 0 || extraSocial.length > 0) && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Social Media</h4>
                  <div className="flex flex-wrap gap-2">
                    {socialChannels.map((channel) => (
                      <a
                        key={`${channel.label}-${channel.url}`}
                        href={channel.url}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="font-medium">{channel.label}</span>
                        <span className="text-gray-500 dark:text-gray-400">{channel.value}</span>
                      </a>
                    ))}
                    {extraSocial.map((channel, index) => (
                      channel.url ? (
                        <a
                          key={`${channel.label}-${index}`}
                          href={channel.url}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="font-medium">{channel.label}</span>
                          <span className="text-gray-500 dark:text-gray-400">{channel.value}</span>
                        </a>
                      ) : (
                        <span
                          key={`${channel.label}-${index}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300"
                        >
                          <span className="font-medium">{channel.label}</span>
                          <span className="text-gray-500 dark:text-gray-400">{channel.value}</span>
                        </span>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Committees */}
              {displayRepresentative.committees && displayRepresentative.committees.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Committees {displayRepresentative.committees.length > 0 && `(${displayRepresentative.committees.length})`}
                  </h4>
                  <div className="space-y-2">
                    {displayRepresentative.committees.map((committee, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{committee.committee_name}</div>
                          {committee.role && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{committee.role}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              {contactItems.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Contact</h4>
                  <div className="space-y-2">
                    {contactItems.map((item) => (
                      <div key={item.label} className="flex items-center space-x-2 text-sm">
                        {item.label === 'Email' ? <Mail className="w-4 h-4 text-gray-500" /> : item.label === 'Phone' ? <Phone className="w-4 h-4 text-gray-500" /> : <Globe className="w-4 h-4 text-gray-500" />}
                        <a
                          href={item.href}
                          className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {item.value}
                        </a>
                      </div>
                    ))}
                    {extraContacts.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {extraContacts.map((contact, index) => (
                          <div key={`${contact.label}-${index}`} className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                            <ExternalLink className="w-3 h-3" />
                            {contact.href ? (
                              <a
                                href={contact.href}
                                className="text-blue-600 dark:text-blue-400 hover:underline truncate"
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
                  </div>
                </div>
              )}

              {/* Recent Activity: bills only. Upcoming Elections are a separate section. */}
              {(() => {
                const billActivities = (displayRepresentative.activities ?? []).filter((a) => a.type === 'bill');
                return billActivities.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Recent Activity ({billActivities.length})
                    </h4>
                    <div className="space-y-2">
                      {billActivities.slice(0, 5).map((activity, index) => (
                        <div key={index} className="text-sm">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{activity.title}</div>
                          {activity.description && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{activity.description}</div>
                          )}
                          {activity.type && (
                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 capitalize">{activity.type}</div>
                          )}
                          {activity.date && (
                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                              Activity date: {formatElectionDateStable(activity.date)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Campaign Finance */}
              {displayRepresentative.campaign_finance && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Campaign Finance</h4>
                  <div className="space-y-1.5 text-sm">
                    {displayRepresentative.campaign_finance.total_raised && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Raised:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          ${Number(displayRepresentative.campaign_finance.total_raised).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {displayRepresentative.campaign_finance.total_spent && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Spent:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          ${Number(displayRepresentative.campaign_finance.total_spent).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {displayRepresentative.campaign_finance.cash_on_hand && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Cash on Hand:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          ${Number(displayRepresentative.campaign_finance.cash_on_hand).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Term Information */}
              {(displayRepresentative.term_start_date || displayRepresentative.term_end_date || displayRepresentative.next_election_date) && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Term Information</h4>
                  <div className="space-y-1 text-sm">
                    {displayRepresentative.term_start_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Term Start:</span>
                        <span className="text-gray-900 dark:text-gray-100">{formatElectionDateStable(displayRepresentative.term_start_date)}</span>
                      </div>
                    )}
                    {displayRepresentative.term_end_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Term End:</span>
                        <span className="text-gray-900 dark:text-gray-100">{formatElectionDateStable(displayRepresentative.term_end_date)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Next Election:</span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {displayRepresentative.next_election_date
                          ? formatElectionDateStable(displayRepresentative.next_election_date)
                          : 'No upcoming election on file'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
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
