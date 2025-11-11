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

import { ArrowLeft, Mail, Phone, MapPin, ExternalLink, User } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';

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
import type { Representative } from '@/types/representative';

export default function RepresentativeDetailPage() {
  const params = useParams();
  const router = useRouter();
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
    }
  }, [
    numericRepresentativeId,
    isFollowing,
    followRepresentative,
    unfollowRepresentative,
    getUserRepresentatives,
    representative?.name
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
          <div className="h-64 bg-gray-200 rounded mb-4" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if ((error && !representative) || numericRepresentativeId == null) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <button
          onClick={handleBack}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Representatives
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-semibold mb-2">Representative Not Found</p>
          <p className="text-red-600">
            {error || 'The representative you are looking for does not exist.'}
          </p>
        </div>
      </div>
    );
  }

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
              <img
                src={photoUrl}
                alt={representative.name}
                className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
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
          </div>

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
          {socialChannels.length > 0 && (
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
