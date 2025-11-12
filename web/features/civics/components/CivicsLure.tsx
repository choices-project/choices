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
  AlertTriangle
} from 'lucide-react';
import React, { useEffect, useMemo } from 'react';

import { useUserCurrentAddress, useUserRepresentatives } from '@/lib/stores';
import {
  useFindByLocation,
  useLocationRepresentatives,
  useRepresentativeError,
  useRepresentativeGlobalLoading
} from '@/lib/stores/representativeStore';
import logger from '@/lib/utils/logger';

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

const formatVerificationStatus = (status: string) => {
  switch (status) {
    case 'verified':
      return 'Verified record';
    case 'pending':
      return 'Awaiting verification';
    case 'failed':
      return 'Verification issues';
    default:
      return 'Status unknown';
  }
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
  const storedAddress = useUserCurrentAddress();
  const locationRepresentatives = useLocationRepresentatives();
  const representativeError = useRepresentativeError();
  const isLoading = useRepresentativeGlobalLoading();
  const findByLocation = useFindByLocation();
  const followedRepresentatives = useUserRepresentatives();

  const locationLabel = userLocation ?? storedAddress;

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

      return {
        id: String(representative.id),
        name: representative.name,
        office:
          representative.office ??
          `${representative.level?.charAt(0).toUpperCase()}${representative.level?.slice(1)} district`,
        party: representative.party ?? 'Independent',
        dataQualityScore: clampScore(representative.data_quality_score),
        verificationStatus: representative.verification_status ?? 'pending',
        keyIssues,
        mostRecentActivity:
          activities[0]?.title ??
          activities[0]?.description ??
          (activities[0]?.date
            ? `Last update on ${new Date(activities[0].date).toLocaleDateString()}`
            : 'No recent civic activity recorded'),
        isIncumbent: representative.verification_status === 'verified'
      };
    });
  }, [locationRepresentatives]);

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

  const trendingMetric = useMemo(() => {
    if (!locationRepresentatives.length) {
      return null;
    }

    const averageScore =
      locationRepresentatives.reduce(
        (sum, representative) => sum + clampScore(representative.data_quality_score),
        0
      ) / locationRepresentatives.length;

    if (averageScore >= 75) {
      return {
        direction: 'up' as const,
        change: Math.round(Math.min(50, averageScore - 50))
      };
    }

    if (averageScore <= 45) {
      return {
        direction: 'down' as const,
        change: Math.round(Math.min(40, 50 - averageScore))
      };
    }

    return null;
  }, [locationRepresentatives]);

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 border border-blue-200 rounded-2xl p-6 mb-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <MapPin className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Ready to vote on something that actually matters? 🗳️
        </h2>
        <p className="text-gray-600">
          While you&apos;re here voting on Drag Race, check out who&apos;s running in your area and see who&apos;s really representing you!
        </p>
      </div>

      {/* Location Display */}
      {locationLabel && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 text-sm">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900">Your Area:</span>
            <span className="text-gray-600">{locationLabel}</span>
            {isLoading && (
              <span className="ml-auto text-xs text-gray-400">
                Updating…
              </span>
            )}
          </div>
        </div>
      )}

      {representativeError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {representativeError}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">Local Candidates</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {isLoading ? '—' : totalLocalRepresentatives}
          </div>
          <div className="text-sm text-gray-500">
            {totalLocalRepresentatives === 1 ? 'Representative connected' : 'Representatives connected'}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-gray-900">Active Issues</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {isLoading ? '—' : totalActivities}
          </div>
          <div className="text-sm text-gray-500">
            Civic updates logged for your district
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <Heart className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-gray-900">Your Voice</span>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {followedCount}
          </div>
          <div className="text-sm text-gray-500">
            Representatives you’re tracking
          </div>
        </div>
      </div>

      {/* Candidate Preview */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-2">Your Local Candidates</h3>
          <p className="text-sm text-gray-600">
            Explore the people representing you right now. Data quality and verification are refreshed in real-time.
          </p>
        </div>

        <div className="p-4 space-y-4">
          {isLoading && candidateSummaries.length === 0 && (
            <div className="py-6 text-center text-sm text-gray-500">
              Loading your local representatives…
            </div>
          )}
          {!isLoading && candidateSummaries.length === 0 && (
            <div className="py-6 text-center text-sm text-gray-500">
              We&apos;re still syncing your local representative data. Try refreshing in a minute.
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
                      Challenger
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{candidate.office}</p>

                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">{candidate.party}</p>

                <div className="flex flex-wrap items-center gap-3">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(candidate.dataQualityScore)}`}>
                    {getScoreIcon(candidate.dataQualityScore)}
                    <span className="ml-1">{candidate.dataQualityScore}% data quality</span>
                  </div>

                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getVerificationBadgeColor(candidate.verificationStatus)}`}>
                    <Shield className="w-3 h-3" />
                    <span className="ml-1">{formatVerificationStatus(candidate.verificationStatus)}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm text-gray-500 mb-1">Key Issues:</div>
                <div className="flex flex-wrap gap-1">
                  {candidate.keyIssues.length > 0 ? (
                    candidate.keyIssues.map((issue) => (
                      <span key={issue} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                        {issue}
                      </span>
                    ))
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      Awaiting updates
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
              <h4 className="font-semibold text-yellow-900 mb-1">Did you know?</h4>
              <p className="text-sm text-yellow-800">
                {highQualityCandidate
                  ? `${highQualityCandidate.name} has one of the strongest data quality scores locally (${highQualityCandidate.dataQualityScore}%). Verified records mean you get trustworthy updates.`
                  : 'We highlight the most responsive and transparent representatives in your area as soon as verification completes.'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-red-900 mb-1">Data Quality Watch</h4>
              <p className="text-sm text-red-800">
                {lowQualityCandidate
                  ? `${lowQualityCandidate.name} still has limited verification (${lowQualityCandidate.dataQualityScore}% data quality). Tap through to request more information or flag issues.`
                  : 'All of your local representative records look solid. We will alert you if anything needs your attention.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center mt-6">
        <button
          onClick={onEngage}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center mx-auto"
        >
          <span>See All My Local Candidates</span>
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Ask questions, see who&apos;s funding whom, and make your voice heard
        </p>
      </div>

      {/* Social Proof */}
      <div className="mt-6 text-center">
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>10,000+ voters</span>
          </div>
          <div className="flex items-center">
            <Shield className="w-4 h-4 mr-1" />
            <span>100% private</span>
          </div>
          <div className="flex items-center">
            <Heart className="w-4 h-4 mr-1" />
            <span>Equal access</span>
          </div>
        </div>
      </div>
    </div>
  );
}
