/**
 * Representative Detail Page
 *
 * Displays detailed information about a specific elected representative.
 * Shows contact info, bio, social media, voting record, and allows following.
 *
 * Features:
 * - Representative profile and contact information
 * - Social media links
 * - Follow/unfollow functionality
 * - Back navigation
 *
 * Created: November 7, 2025
 * Status: Production-ready
 */

'use client';

import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  User,
  CalendarClock,
} from 'lucide-react';
import dynamicImport from 'next/dynamic';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo } from 'react';

import {
  trackCivicsRepresentativeEvent,
  type CivicsRepresentativeEventBase
} from '@/features/civics/analytics/civicsAnalyticsEvents';

import { Badge } from '@/components/ui/badge';

import {
  useElectionsForDivisions,
  useFetchElectionsForDivisions,
  useAnalyticsActions,
} from '@/lib/stores';
import {
  useRepresentativeById,
  useGetRepresentativeById,
  useRepresentativeDetailLoading,
  useRepresentativeGlobalLoading,
  useRepresentativeError,
  useFollowedRepresentatives,
  useFollowRepresentative,
  useUnfollowRepresentative,
  useRepresentativeFollowLoading,
  useGetUserRepresentatives
} from '@/lib/stores/representativeStore';
import { logger } from '@/lib/utils/logger';

// Format election date - only format on client to prevent hydration mismatch
// toLocaleDateString() can produce different results on server vs client
// Use a stable format that doesn't rely on locale during SSR
const formatElectionDate = (isoDate: string | undefined, isClient: boolean = false) => {
  if (!isoDate) {
    return '';
  }
  // During SSR, return a stable format that doesn't use locale-dependent functions
  if (!isClient) {
    try {
      const date = new Date(isoDate);
      const year = date.getFullYear();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const day = date.getDate();
      return `${month} ${day}, ${year}`;
    } catch {
      return isoDate;
    }
  }
  try {
    return new Date(isoDate).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoDate;
  }
};

// getElectionCountdown will be defined inside component to use isClient guard

// Internal component - will be dynamically imported with ssr: false
function RepresentativeDetailPageContent() {
  const { trackEvent } = useAnalyticsActions();
  const params = useParams();
  const router = useRouter();

  // Track if component is mounted on client to prevent hydration mismatches
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    // #region agent log
    if (process.env.DEBUG_DASHBOARD === '1') {
      logger.debug('Representative page: isClient set to true', { hasDocument: typeof document !== 'undefined' });
    }
    // #endregion
    setIsClient(true);
  }, []);

  // getElectionCountdown - only calculate on client to prevent hydration mismatch
  const getElectionCountdown = React.useCallback((isoDate: string | undefined) => {
    if (!isoDate || !isClient) {
      return null;
    }
    const now = new Date();
    const target = new Date(isoDate);
    if (Number.isNaN(target.getTime())) {
      return null;
    }
    const diffMs = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return null;
    }
    return diffDays;
  }, [isClient]);

  // useParams() is safe here because component only renders on client (ssr: false)
  // With ssr: false, this component never renders on the server, so useParams() is safe
  const representativeIdParam = params?.id as string | undefined;
  const numericRepresentativeId = useMemo(() => {
    if (!representativeIdParam) return null;
    const parsed = Number.parseInt(representativeIdParam, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }, [representativeIdParam]);

  const representative = useRepresentativeById(numericRepresentativeId);
  const detailLoading = useRepresentativeDetailLoading();
  const globalLoading = useRepresentativeGlobalLoading();
  const followLoading = useRepresentativeFollowLoading();
  const error = useRepresentativeError();
  const followedRepresentatives = useFollowedRepresentatives();
  const getRepresentativeById = useGetRepresentativeById();
  const getUserRepresentatives = useGetUserRepresentatives();
  const followRepresentative = useFollowRepresentative();
  const unfollowRepresentative = useUnfollowRepresentative();
  const fetchElections = useFetchElectionsForDivisions();
  const divisionIds = useMemo(() => {
    const ocd = representative?.ocdDivisionIds;
    const fallback = representative?.division_ids;
    const source = Array.isArray(ocd)
      ? ocd
      : Array.isArray(fallback)
      ? fallback
      : [];
    return source
      .map((value) => (typeof value === 'string' ? value.trim() : null))
      .filter((value): value is string => Boolean(value));
  }, [representative?.ocdDivisionIds, representative?.division_ids]);

  const elections = useElectionsForDivisions(divisionIds);
  const upcomingElections = useMemo(() => {
    if (!Array.isArray(elections) || elections.length === 0) {
      return [];
    }
    // Sort elections - this is safe as it only uses date strings, not locale-dependent formatting
    return [...elections].sort(
      (a, b) => new Date(a.election_day).getTime() - new Date(b.election_day).getTime(),
    );
  }, [elections]);

  const nextElection = upcomingElections[0];
  // CRITICAL: Calculate countdown but use null initially to match server render
  // After mount, update to actual value - but render structure must remain consistent
  const [daysUntilNextElection, setDaysUntilNextElection] = React.useState<number | null>(null);

  // CRITICAL: Use state for formatted date to prevent hydration mismatch
  // formatElectionDate with isClient=false uses stable format, isClient=true uses locale format
  // This causes hydration mismatch, so we use state to keep it stable initially
  const [formattedNextElectionDate, setFormattedNextElectionDate] = React.useState<string>('');

  React.useEffect(() => {
    if (isClient && nextElection?.election_day) {
      const countdown = getElectionCountdown(nextElection.election_day);
      setDaysUntilNextElection(countdown);
      // Update formatted date after mount to use locale format
      setFormattedNextElectionDate(formatElectionDate(nextElection.election_day, true));
    } else if (nextElection?.election_day) {
      // Initial render: use stable format
      setFormattedNextElectionDate(formatElectionDate(nextElection.election_day, false));
    }
  }, [isClient, nextElection?.election_day, getElectionCountdown]);

  const loading = detailLoading || globalLoading;
  const isFollowing =
    numericRepresentativeId != null &&
    followedRepresentatives.includes(numericRepresentativeId);

  useEffect(() => {
    if (numericRepresentativeId != null) {
      void getRepresentativeById(numericRepresentativeId);
    }
  }, [numericRepresentativeId, getRepresentativeById]);

  useEffect(() => {
    void getUserRepresentatives();
  }, [getUserRepresentatives]);

  useEffect(() => {
    if (divisionIds.length === 0) {
      return;
    }
    if (upcomingElections.length > 0) {
      return;
    }
    void fetchElections(divisionIds);
  }, [divisionIds, fetchElections, upcomingElections.length]);

  const handleFollow = useCallback(async () => {
    if (numericRepresentativeId == null) {
      return;
    }

    const toggled = isFollowing
      ? await unfollowRepresentative(numericRepresentativeId)
      : await followRepresentative(numericRepresentativeId);

    if (toggled) {
      void getUserRepresentatives();
      logger.info(`${isFollowing ? 'Unfollowed' : 'Followed'} representative`, {
        representativeId: numericRepresentativeId,
        name: representative?.name ?? 'Unknown representative'
      });

      const eventBase: CivicsRepresentativeEventBase = {
        representativeId: numericRepresentativeId,
        representativeName: representative?.name ?? null,
        divisionIds,
        nextElectionId: nextElection?.election_id ?? null,
        nextElectionDay: nextElection?.election_day ?? null,
        electionCountdownDays: daysUntilNextElection,
        source: 'representative_detail',
      };

      trackCivicsRepresentativeEvent(trackEvent, {
        type: 'civics_representative_follow_toggle',
        value: isFollowing ? 0 : 1,
        data: {
          ...eventBase,
          action: isFollowing ? 'unfollow' : 'follow',
          previousFollowState: isFollowing ? 'following' : 'not_following',
        },
      });
    }
  }, [
    numericRepresentativeId,
    isFollowing,
    followRepresentative,
    unfollowRepresentative,
    getUserRepresentatives,
    representative?.name,
    divisionIds,
    nextElection?.election_day,
    nextElection?.election_id,
    daysUntilNextElection,
    trackEvent
  ]);

  const handleBack = () => {
    router.back();
  };

  const contactEmail = representative?.primary_email ?? null;
  const contactPhone = representative?.primary_phone ?? null;
  const website = representative?.primary_website ?? null;
  const photoUrl =
    representative?.primary_photo_url ??
    representative?.photos?.find((photo) => photo.is_primary)?.url ??
    representative?.photos?.[0]?.url ??
    null;

  const socialChannels = useMemo(
    () =>
      [
        representative?.twitter_handle
          ? {
              label: 'Twitter',
              value: `@${representative.twitter_handle.replace(/^@/, '')}`,
              url: `https://twitter.com/${representative.twitter_handle.replace(/^@/, '')}`
            }
          : null,
        representative?.facebook_url
          ? {
              label: 'Facebook',
              value: 'Facebook',
              url: representative.facebook_url
            }
          : null,
        representative?.instagram_handle
          ? {
              label: 'Instagram',
              value: `@${representative.instagram_handle.replace(/^@/, '')}`,
              url: `https://instagram.com/${representative.instagram_handle.replace(/^@/, '')}`
            }
          : null,
        representative?.youtube_channel
          ? {
              label: 'YouTube',
              value: 'YouTube',
              url: representative.youtube_channel
            }
          : null,
        representative?.linkedin_url
          ? {
              label: 'LinkedIn',
              value: 'LinkedIn',
              url: representative.linkedin_url
            }
          : null
      ].filter(Boolean) as Array<{ label: string; value: string; url: string }>,
    [
      representative?.twitter_handle,
      representative?.facebook_url,
      representative?.instagram_handle,
      representative?.youtube_channel,
      representative?.linkedin_url
    ]
  );

  const extraSocialChannels = useMemo(
    () =>
      (representative?.social_media ?? [])
        .map((channel) => ({
          label: channel.platform,
          value: channel.handle,
          url: channel.url ?? null,
          followers: channel.followers_count ?? null,
          verified: channel.is_verified ?? null,
        }))
        .filter((channel) => channel.value),
    [representative?.social_media]
  );

  const extraContacts = useMemo(
    () =>
      (representative?.contacts ?? [])
        .map((contact) => ({
          label: contact.contact_type,
          value: contact.value,
          href: contact.contact_type === 'email'
            ? `mailto:${contact.value}`
            : contact.contact_type === 'phone'
            ? `tel:${contact.value}`
            : contact.value.startsWith('http')
            ? contact.value
            : null,
          source: contact.source ?? null,
        })),
    [representative?.contacts]
  );

  const campaignFinance = representative?.campaign_finance ?? null;
  const dataSources = Array.isArray(representative?.data_sources) ? representative?.data_sources : [];
  const dataQualityScore = representative?.data_quality_score ?? 0;
  const verificationStatus = representative?.verification_status ?? null;

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse" role="status" aria-live="polite" aria-busy="true">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  // Error state
  if (!representative || numericRepresentativeId == null) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <button
          onClick={handleBack}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
          data-testid="representative-detail-back-button"
          aria-label="Back to Representatives"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Representatives
        </button>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-800 dark:text-red-200 font-semibold mb-2">Representative Not Found</p>
          <p className="text-red-600 dark:text-red-300">
            {error ?? 'The representative you are looking for does not exist.'}
          </p>
          {error?.includes('Security challenge') && (
            <p className="text-red-600 dark:text-red-300 text-sm mt-2">
              Please refresh the page. If the issue continues, your network or security settings may be blocking access.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Representatives
      </button>

      {/* Representative Card */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header with Photo */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-white">
          <div className="flex items-start gap-6">
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt={`${representative.name} - ${representative.office}`}
                width={128}
                height={128}
                className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                priority
              />
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-blue-500 flex items-center justify-center">
                <User className="w-16 h-16" />
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{representative.name}</h1>
              <p className="text-xl text-blue-100 mb-1">{representative.office}</p>
              <div className="flex items-center gap-4 text-blue-100">
                {representative.party && (
                  <span className="px-3 py-1 bg-blue-700 rounded-full text-sm">
                    {representative.party}
                  </span>
                )}
                {representative.level && (
                  <span className="text-sm capitalize">{representative.level} Level</span>
                )}
              </div>

              {divisionIds.length > 0 && nextElection && (
                <div className="mt-4">
                  <Badge className="flex items-center gap-2 bg-white/15 text-white border-white/40 text-xs rounded-full shadow-sm">
                    <CalendarClock className="w-3 h-3" />
                    <span className="truncate max-w-[220px]">{nextElection.name}</span>
                    <span className="text-blue-100">
                      · {formattedNextElectionDate || formatElectionDate(nextElection.election_day, false)}
                    </span>
                    {upcomingElections.length > 1 && (
                      <span className="text-blue-100/80">
                        (+{upcomingElections.length - 1})
                      </span>
                    )}
                  </Badge>
                </div>
              )}
              {/* Always render the container to maintain consistent DOM structure */}
              <div className="mt-2 text-xs text-blue-100">
                {daysUntilNextElection != null && daysUntilNextElection <= 90 && (
                  daysUntilNextElection === 0
                    ? 'Election is today'
                    : `Election in ${daysUntilNextElection} day${daysUntilNextElection === 1 ? '' : 's'}`
                )}
              </div>
            </div>

            <button
              onClick={handleFollow}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                isFollowing
                  ? 'bg-white text-blue-600 hover:bg-blue-50'
                  : 'bg-blue-500 text-white hover:bg-blue-400'
              }`}
              disabled={followLoading}
            >
              {followLoading ? 'Updating...' : isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
        </div>

        {/* Contact Information */}
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {contactEmail && (
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-semibold text-gray-700 mb-1">Email</p>
                  <a
                    href={`mailto:${contactEmail}`}
                    className="text-blue-600 hover:underline"
                  >
                    {contactEmail}
                  </a>
                </div>
              </div>
            )}

            {contactPhone && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-semibold text-gray-700 mb-1">Phone</p>
                  <a
                    href={`tel:${contactPhone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {contactPhone}
                  </a>
                </div>
              </div>
            )}

            {(representative.state || representative.district) && (
              <div className="flex items-start gap-3 md:col-span-2">
                <MapPin className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-semibold text-gray-700 mb-1">Represents</p>
                  <p className="text-gray-600">
                    {[representative.district, representative.state].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            )}

            {extraContacts.length > 0 && (
              <div className="md:col-span-2">
                <p className="font-semibold text-gray-700 mb-2">Additional Contacts</p>
                <div className="grid gap-2">
                  {extraContacts.slice(0, 6).map((contact, index) => (
                    <div key={`${contact.label}-${index}`} className="flex items-center gap-2 text-sm text-gray-600">
                      <ExternalLink className="w-4 h-4 text-blue-600" />
                      {contact.href ? (
                        <a href={contact.href} className="text-blue-600 hover:underline">
                          {contact.label}: {contact.value}
                        </a>
                      ) : (
                        <span>{contact.label}: {contact.value}</span>
                      )}
                      {contact.source && (
                        <span className="text-xs text-gray-400">({contact.source})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Term Details</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Term start: {representative.term_start_date ?? 'Unknown'}</div>
                <div>Term end: {representative.term_end_date ?? 'Unknown'}</div>
                <div>Next election: {representative.next_election_date ?? 'Unknown'}</div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Quality</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Score: {Math.round(dataQualityScore)}%</div>
                {verificationStatus && <div>Status: {verificationStatus}</div>}
                {representative.last_verified && <div>Last verified: {representative.last_verified}</div>}
                {dataSources.length > 0 && (
                  <div>Sources: {dataSources.slice(0, 4).join(', ')}</div>
                )}
              </div>
            </div>
          </div>

          {representative.committees && representative.committees.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Committees</h3>
              <div className="grid gap-2">
                {representative.committees.slice(0, 8).map((committee) => (
                  <div key={committee.id} className="text-sm text-gray-600">
                    {committee.committee_name} {committee.role ? `• ${committee.role}` : ''}
                    {committee.is_current ? ' • Current' : ''}
                  </div>
                ))}
              </div>
            </div>
          )}

          {representative.activities && representative.activities.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</h3>
              <div className="space-y-3">
                {representative.activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="text-sm font-semibold text-gray-900">{activity.title}</div>
                    {activity.description && (
                      <div className="text-sm text-gray-600">{activity.description}</div>
                    )}
                    <div className="text-xs text-gray-500">
                      {activity.type} {activity.date ? `• ${activity.date}` : ''} {activity.source ? `• ${activity.source}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {divisionIds.length > 0 && upcomingElections.length > 0 && (
          <div className="mb-8 rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Upcoming Elections</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">{upcomingElections.length} listed</span>
            </div>
            <div className="space-y-3 px-5 py-4">
              {upcomingElections.slice(0, 5).map((election) => (
                <div
                  key={election.election_id}
                  className="flex items-start justify-between bg-blue-50 border border-blue-100 rounded-lg p-3 dark:bg-blue-900/30 dark:border-blue-900/40"
                >
                  <div>
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">{election.name}</p>
                    <p className="text-xs text-blue-700 dark:text-blue-200/80">
                      {/* Use stable format initially, update after mount to prevent hydration mismatch */}
                      {isClient
                        ? formatElectionDate(election.election_day, true)
                        : formatElectionDate(election.election_day, false)
                      }
                      {/* Calculate countdown only after mount to prevent hydration mismatch */}
                      {isClient && (() => {
                        const countdown = getElectionCountdown(election.election_day);
                        if (countdown == null || countdown > 90) {
                          return null;
                        }
                        return ` · ${countdown === 0 ? 'Today' : `In ${countdown} day${countdown === 1 ? '' : 's'}`}`;
                      })()}
                    </p>
                  </div>
                  <Badge className="bg-blue-600 text-white text-xs dark:bg-blue-700">
                    {election.ocd_division_id}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

          {/* Official Website */}
          {website && (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Official Website</h3>
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-500"
              >
                <ExternalLink className="w-4 h-4" />
                {website}
              </a>
            </div>
          )}

          {/* Social Media & Links */}
          {(socialChannels.length > 0 || extraSocialChannels.length > 0) && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media</h3>
              <div className="flex flex-wrap gap-3">
                {socialChannels.map((channel) => (
                  <a
                    key={channel.label}
                    href={channel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>{channel.value}</span>
                  </a>
                ))}
                {extraSocialChannels.map((channel, index) => (
                  <div
                    key={`${channel.label}-${index}`}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>{channel.label}: {channel.value}</span>
                    {channel.followers ? (
                      <span className="text-xs text-gray-500">({channel.followers.toLocaleString()} followers)</span>
                    ) : null}
                    {channel.verified ? <span className="text-xs text-green-600">Verified</span> : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">External IDs</h3>
            <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
              {representative.bioguide_id && <div>Bioguide: {representative.bioguide_id}</div>}
              {representative.fec_id && <div>FEC: {representative.fec_id}</div>}
              {representative.google_civic_id && <div>Google Civic: {representative.google_civic_id}</div>}
              {representative.congress_gov_id && <div>Congress.gov: {representative.congress_gov_id}</div>}
              {representative.legiscan_id && <div>LegiScan: {representative.legiscan_id}</div>}
              {representative.govinfo_id && <div>GovInfo: {representative.govinfo_id}</div>}
              {representative.openstates_id && <div>OpenStates: {representative.openstates_id}</div>}
              {representative.ballotpedia_url && (
                <a
                  href={representative.ballotpedia_url}
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ballotpedia profile
                </a>
              )}
            </div>
          </div>

          {campaignFinance && (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Campaign Finance</h3>
              <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
                {campaignFinance.cycle && <div>Cycle: {campaignFinance.cycle}</div>}
                {campaignFinance.total_raised != null && <div>Total raised: ${campaignFinance.total_raised.toLocaleString()}</div>}
                {campaignFinance.total_spent != null && <div>Total spent: ${campaignFinance.total_spent.toLocaleString()}</div>}
                {campaignFinance.cash_on_hand != null && <div>Cash on hand: ${campaignFinance.cash_on_hand.toLocaleString()}</div>}
                {campaignFinance.last_filing_date && <div>Last filing: {campaignFinance.last_filing_date}</div>}
                {campaignFinance.source && <div>Source: {campaignFinance.source}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// CRITICAL: Load RepresentativeDetailPageContent only on client to prevent SSR hydration mismatch
// This component uses useParams() and other client-only hooks that cause React Error #185 when rendered during SSR
// IMPORTANT: The loading state must match the component's initial loading state exactly to prevent hydration mismatch
const RepresentativeDetailPage = dynamicImport(
  () => Promise.resolve({ default: RepresentativeDetailPageContent }),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="animate-pulse" role="status" aria-live="polite" aria-busy="true">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6" />
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    ),
  }
);

export default RepresentativeDetailPage;
