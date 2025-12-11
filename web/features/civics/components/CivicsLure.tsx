'use client';

import {
  MapPin,
  Users,
  TrendingUp,
  Heart,
  ArrowRight,
  Star,
  Shield,
  CheckCircle,
  AlertTriangle,
  CalendarClock,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ElectionCountdownBadge } from '@/features/civics/components/countdown/ElectionCountdownBadge';
import { ElectionCountdownCard } from '@/features/civics/components/countdown/ElectionCountdownCard';
import { useElectionCountdown } from '@/features/civics/utils/civicsCountdownUtils';

import ScreenReaderSupport from '@/lib/accessibility/screen-reader';
import {
  useUserCurrentAddress,
  useUserRepresentatives,
  useAnalyticsActions,
} from '@/lib/stores';
import {
  useFindByLocation,
  useLocationRepresentatives,
  useRepresentativeError,
  useRepresentativeGlobalLoading
} from '@/lib/stores/representativeStore';
import logger from '@/lib/utils/logger';

import { useI18n } from '@/hooks/useI18n';

type CivicsLureProps = {
  userLocation?: string;
  onEngage: () => void;
};

type CandidateSummary = {
  id: string;
  name: string;
  office: string;
  party: string;
  dataQualityScore: number;
  verificationStatus: string;
  keyIssues: string[];
  mostRecentActivity: string;
  isIncumbent: boolean;
};

const clampScore = (score: number | null | undefined) => {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
};

const getScoreColor = (score: number) => {
  if (score >= 85) return 'text-green-600 bg-green-100';
  if (score >= 60) return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-100';
};

const getScoreIcon = (score: number) => {
  if (score >= 85) return <CheckCircle className="w-4 h-4" />;
  if (score >= 60) return <AlertTriangle className="w-4 h-4" />;
  return <AlertTriangle className="w-4 h-4" />;
};

const getVerificationBadgeColor = (status: string) => {
  switch (status) {
    case 'verified':
      return 'bg-emerald-100 text-emerald-700';
    case 'failed':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-yellow-100 text-yellow-700';
  }
};

export default function CivicsLure({ userLocation, onEngage }: CivicsLureProps) {
  const { t, currentLanguage } = useI18n();
  const storedAddress = useUserCurrentAddress();
  const locationRepresentatives = useLocationRepresentatives();
  const representativeError = useRepresentativeError();
  const isLoading = useRepresentativeGlobalLoading();
  const findByLocation = useFindByLocation();
  const followedRepresentatives = useUserRepresentatives();
  const { trackEvent } = useAnalyticsActions();

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(currentLanguage ?? undefined),
    [currentLanguage],
  );
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(currentLanguage ?? undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    [currentLanguage],
  );
  const formatVerificationStatus = useCallback(
    (status: string) => {
      switch (status) {
        case 'verified':
          return t('civics.lure.candidates.verification.verified');
        case 'failed':
          return t('civics.lure.candidates.verification.failed');
        case 'pending':
        default:
          return t('civics.lure.candidates.verification.pending');
      }
    },
    [t],
  );
  const formatDataQuality = useCallback(
    (score: number) =>
      t('civics.lure.candidates.dataQualityBadge', {
        value: numberFormatter.format(score),
      }),
    [numberFormatter, t],
  );

  const locationLabel = userLocation ?? storedAddress;
  const [liveMessage, setLiveMessage] = useState('');
  const announce = useCallback(
    (message: string, politeness: 'polite' | 'assertive' = 'polite') => {
      setLiveMessage(message);
      ScreenReaderSupport.announce(message, politeness);
    },
    [],
  );
  const previousLocationRef = useRef<string | null>(null);
  const previousRepresentativesRef = useRef<number>(0);
  const previousElectionIdRef = useRef<string | null>(null);
  const previousElectionDaysRef = useRef<number | null>(null);
  const previousErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (!locationLabel || locationRepresentatives.length > 0) {
      return;
    }

    void (async () => {
      const response = await findByLocation({ address: locationLabel });
      if (!response?.success && response?.error) {
        logger.warn('CivicsLure failed to hydrate representatives', {
          address: locationLabel,
          error: response.error
        });
      }
    })();
  }, [findByLocation, locationLabel, locationRepresentatives.length]);

  useEffect(() => {
    if (!locationLabel) {
      return;
    }
    if (previousLocationRef.current === locationLabel) {
      return;
    }
    previousLocationRef.current = locationLabel;
    announce(t('civics.lure.live.locationUpdated', { location: locationLabel }));
  }, [announce, locationLabel, t]);

  useEffect(() => {
    if (locationRepresentatives.length === 0) {
      previousRepresentativesRef.current = 0;
      return;
    }
    if (previousRepresentativesRef.current === locationRepresentatives.length) {
      return;
    }
    previousRepresentativesRef.current = locationRepresentatives.length;
    announce(
      t('civics.lure.live.representativesLoaded', {
        count: locationRepresentatives.length,
      }),
    );
  }, [announce, locationRepresentatives.length, t]);

  const divisionIds = useMemo(() => {
    const divisions = new Set<string>();
    for (const representative of locationRepresentatives) {
      const source = representative.ocdDivisionIds ?? representative.division_ids ?? [];
      if (!Array.isArray(source)) continue;
      source
        .map((value) => (typeof value === 'string' ? value.trim() : null))
        .filter((value): value is string => Boolean(value))
        .forEach((value) => divisions.add(value));
    }
    return Array.from(divisions);
  }, [locationRepresentatives]);

  const {
    elections: upcomingElections,
    nextElection,
    daysUntilNextElection,
    loading: electionLoading,
    error: electionError,
  } = useElectionCountdown(divisionIds, {
    analytics: {
      surface: 'civics_lure',
      metadata: {
        representativeCount: locationRepresentatives.length,
        hasLocation: Boolean(locationLabel),
      },
    },
  });

  useEffect(() => {
    if (!nextElection?.election_id) {
      previousElectionIdRef.current = null;
      previousElectionDaysRef.current = null;
      return;
    }
    const currentDays = daysUntilNextElection ?? null;
    if (
      previousElectionIdRef.current === nextElection.election_id &&
      previousElectionDaysRef.current === currentDays
    ) {
      return;
    }
    previousElectionIdRef.current = nextElection.election_id;
    previousElectionDaysRef.current = currentDays;

    if (daysUntilNextElection != null && daysUntilNextElection <= 0) {
      announce(
        t('civics.lure.live.nextElectionToday', {
          name: nextElection.name ?? t('civics.lure.live.unnamedElection'),
        }),
      );
    } else if (daysUntilNextElection != null) {
      announce(
        t('civics.lure.live.nextElection', {
          name: nextElection.name ?? t('civics.lure.live.unnamedElection'),
          count: daysUntilNextElection,
        }),
      );
    }
  }, [announce, daysUntilNextElection, nextElection, t]);

  useEffect(() => {
    const activeError = representativeError ?? electionError ?? null;
    if (!activeError) {
      previousErrorRef.current = null;
      return;
    }
    if (previousErrorRef.current === activeError) {
      return;
    }
    previousErrorRef.current = activeError;
    announce(t('civics.lure.live.error', { message: activeError }), 'assertive');
  }, [announce, electionError, representativeError, t]);

  const candidateSummaries = useMemo<CandidateSummary[]>(() => {
    if (!locationRepresentatives.length) {
      return [];
    }

    return locationRepresentatives.slice(0, 3).map((representative) => {
      const activities = representative.activities ?? [];
      const keyIssues = activities
        .map((activity) => activity.title ?? activity.type ?? '')
        .filter((value): value is string => value.trim().length > 0)
        .slice(0, 3);

      const firstActivity = activities[0];
      let formattedActivityDate: string | null = null;
      if (firstActivity?.date) {
        const parsed = new Date(firstActivity.date);
        if (!Number.isNaN(parsed.getTime())) {
          formattedActivityDate = dateFormatter.format(parsed);
        }
      }

      const levelName = representative.level
        ? `${representative.level.charAt(0).toUpperCase()}${representative.level.slice(1)}`
        : t('civics.lure.candidates.level.unknown');

      return {
        id: String(representative.id),
        name: representative.name,
        office:
          representative.office ??
          t('civics.lure.candidates.officeFallback', { level: levelName }),
        party: representative.party ?? t('civics.lure.candidates.partyIndependent'),
        dataQualityScore: clampScore(representative.data_quality_score),
        verificationStatus: representative.verification_status ?? 'pending',
        keyIssues,
        mostRecentActivity:
          firstActivity?.title ??
          firstActivity?.description ??
          (formattedActivityDate
            ? t('civics.lure.candidates.activity.lastUpdate', { date: formattedActivityDate })
            : t('civics.lure.candidates.activity.none')),
        isIncumbent: representative.verification_status === 'verified',
      };
    });
  }, [dateFormatter, locationRepresentatives, t]);

  const dashPlaceholder = t('common.placeholders.emDash');
  const totalLocalRepresentatives = locationRepresentatives.length;
  const totalActivities = useMemo(
    () =>
      locationRepresentatives.reduce(
        (sum, representative) => sum + (representative.activities?.length ?? 0),
        0
      ),
    [locationRepresentatives]
  );
  const followedCount = followedRepresentatives.length;

  const highQualityCandidate = useMemo(
    () => candidateSummaries.find((candidate) => candidate.dataQualityScore >= 85),
    [candidateSummaries]
  );
  const lowQualityCandidate = useMemo(
    () => candidateSummaries.find((candidate) => candidate.dataQualityScore < 60),
    [candidateSummaries]
  );
  const didYouKnowMessage = useMemo(() => {
    if (!highQualityCandidate) {
      return t('civics.lure.engagement.didYouKnow.fallback');
    }

    return t('civics.lure.engagement.didYouKnow.highlight', {
      name: highQualityCandidate.name,
      score: numberFormatter.format(highQualityCandidate.dataQualityScore),
    });
  }, [highQualityCandidate, numberFormatter, t]);
  const dataQualityWatchMessage = useMemo(() => {
    if (!lowQualityCandidate) {
      return t('civics.lure.engagement.dataQualityWatch.fallback');
    }

    return t('civics.lure.engagement.dataQualityWatch.highlight', {
      name: lowQualityCandidate.name,
      score: numberFormatter.format(lowQualityCandidate.dataQualityScore),
    });
  }, [lowQualityCandidate, numberFormatter, t]);

  const handleEngage = () => {
    trackEvent?.({
      event_type: 'civics_lure_engage',
      type: 'civics',
      category: 'civics',
      action: 'engage',
      label: locationLabel ?? undefined,
      session_id: '',
      event_data: {
        hasLocation: Boolean(locationLabel),
        representativeCount: locationRepresentatives.length,
        upcomingElectionId: nextElection?.election_id ?? null,
        upcomingElectionDay: nextElection?.election_day ?? null,
        electionCountdownDays: daysUntilNextElection,
      },
      created_at: new Date().toISOString(),
    });
    onEngage();
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 border border-blue-200 rounded-2xl p-6 mb-8">
      <div aria-live="polite" role="status" className="sr-only" data-testid="civics-lure-live-message">
        {liveMessage}
      </div>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <MapPin className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t('civics.lure.header.title')}
        </h2>
        <p className="text-gray-600">
          {t('civics.lure.header.subtitle')}
        </p>
      </div>

      {/* Location Display */}
      {locationLabel && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 text-sm">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900">
              {t('civics.lure.location.label')}
            </span>
            <span className="text-gray-600">{locationLabel}</span>
            {isLoading && (
              <span className="ml-auto text-xs text-gray-400">
                {t('civics.lure.location.updating')}
              </span>
            )}
          </div>
        </div>
      )}

      {representativeError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {t('civics.lure.errors.representatives', { message: representativeError })}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">
              {t('civics.lure.stats.candidates.title')}
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {isLoading ? dashPlaceholder : numberFormatter.format(totalLocalRepresentatives)}
          </div>
          <div className="text-sm text-gray-500">
            {t('civics.lure.stats.candidates.caption', {
              count: String(totalLocalRepresentatives),
              formattedCount: numberFormatter.format(totalLocalRepresentatives),
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-gray-900">
              {t('civics.lure.stats.activities.title')}
            </span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {isLoading ? dashPlaceholder : numberFormatter.format(totalActivities)}
          </div>
          <div className="text-sm text-gray-500">
            {t('civics.lure.stats.activities.caption')}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <Heart className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-gray-900">
              {t('civics.lure.stats.following.title')}
            </span>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {numberFormatter.format(followedCount)}
          </div>
          <div className="text-sm text-gray-500">
            {t('civics.lure.stats.following.caption')}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <CalendarClock className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-gray-900">
              {t('civics.lure.stats.election.title')}
            </span>
          </div>
          {divisionIds.length === 0 ? (
            <div className="text-sm text-gray-500">
              {t('civics.lure.stats.election.addAddress')}
            </div>
          ) : (
            <div className="space-y-2">
              <ElectionCountdownBadge
                className="justify-start"
                loading={electionLoading}
                error={electionError}
                nextElection={nextElection ?? null}
                daysUntil={daysUntilNextElection}
                totalUpcoming={upcomingElections.length}
                emptyMessage={t('civics.lure.stats.election.badge.empty')}
                loadingMessage={t('civics.lure.stats.election.badge.loading')}
                errorMessage={t('civics.lure.stats.election.badge.error')}
              />
              {daysUntilNextElection != null && daysUntilNextElection > 90 && (
                <p className="text-xs text-gray-500">
                  {t('civics.lure.stats.election.future', {
                    count: String(daysUntilNextElection),
                    formattedCount: numberFormatter.format(daysUntilNextElection),
                  })}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {divisionIds.length > 0 && (
        <ElectionCountdownCard
          className="mb-6"
          title={t('civics.lure.electionCard.title')}
          description={t('civics.lure.electionCard.description')}
          loading={electionLoading}
          error={electionError}
          elections={upcomingElections}
          nextElection={nextElection}
          daysUntilNextElection={daysUntilNextElection}
          totalUpcoming={upcomingElections.length}
          ariaLabel={t('civics.lure.electionCard.ariaLabel')}
        />
      )}

      {/* Candidate Preview */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-2">
            {t('civics.lure.candidates.section.title')}
          </h3>
          <p className="text-sm text-gray-600">
            {t('civics.lure.candidates.section.subtitle')}
          </p>
        </div>

        <div className="p-4 space-y-4">
          {isLoading && candidateSummaries.length === 0 && (
            <div className="py-6 text-center text-sm text-gray-500">
              {t('civics.lure.candidates.loading')}
            </div>
          )}
          {!isLoading && candidateSummaries.length === 0 && (
            <div className="py-6 text-center text-sm text-gray-500">
              {t('civics.lure.candidates.empty')}
            </div>
          )}
          {candidateSummaries.map((candidate) => (
            <div key={candidate.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-gray-600">
                  {candidate.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>

              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{candidate.name}</h4>
                  {!candidate.isIncumbent && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {t('civics.lure.candidates.challengerBadge')}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{candidate.office}</p>

                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">{candidate.party}</p>

                <div className="flex flex-wrap items-center gap-3">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(candidate.dataQualityScore)}`}>
                    {getScoreIcon(candidate.dataQualityScore)}
                    <span className="ml-1">
                      {formatDataQuality(candidate.dataQualityScore)}
                    </span>
                  </div>

                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getVerificationBadgeColor(candidate.verificationStatus)}`}>
                    <Shield className="w-3 h-3" />
                    <span className="ml-1">
                      {formatVerificationStatus(candidate.verificationStatus)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm text-gray-500 mb-1">
                  {t('civics.lure.candidates.keyIssues')}
                </div>
                <div className="flex flex-wrap gap-1">
                  {candidate.keyIssues.length > 0 ? (
                    candidate.keyIssues.map((issue) => (
                      <span key={issue} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                        {issue}
                      </span>
                    ))
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {t('civics.lure.candidates.keyIssuesFallback')}
                    </span>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500 max-w-xs">
                  {candidate.mostRecentActivity}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Engagement Hooks */}
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Star className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-yellow-900 mb-1">
                {t('civics.lure.engagement.didYouKnow.title')}
              </h4>
              <p className="text-sm text-yellow-800">{didYouKnowMessage}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-red-900 mb-1">
                {t('civics.lure.engagement.dataQualityWatch.title')}
              </h4>
              <p className="text-sm text-red-800">{dataQualityWatchMessage}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center mt-6">
        <button
          onClick={handleEngage}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center mx-auto"
          type="button"
          aria-label={t('civics.lure.cta.button')}
        >
          <span>{t('civics.lure.cta.button')}</span>
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
        <p className="text-sm text-gray-500 mt-2">
          {t('civics.lure.cta.caption')}
        </p>
      </div>

      {/* Social Proof */}
      <div className="mt-6 text-center">
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>{t('civics.lure.social.voters')}</span>
          </div>
          <div className="flex items-center">
            <Shield className="w-4 h-4 mr-1" />
            <span>{t('civics.lure.social.privacy')}</span>
          </div>
          <div className="flex items-center">
            <Heart className="w-4 h-4 mr-1" />
            <span>{t('civics.lure.social.access')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
