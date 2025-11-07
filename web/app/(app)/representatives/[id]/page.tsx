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
import { useEffect, useState } from 'react';

import { logger } from '@/lib/utils/logger';

type Representative = {
  id: string;
  name: string;
  office: string;
  level: string;
  party?: string;
  district?: string;
  state?: string;
  email?: string;
  phone?: string;
  address?: string;
  photo_url?: string;
  urls?: string[];
  channels?: Array<{ type: string; id: string }>;
};

export default function RepresentativeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const representativeId = params?.id as string;

  const [representative, setRepresentative] = useState<Representative | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    const loadRepresentative = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/v1/civics/representative/${representativeId}`);

        if (!response.ok) {
          throw new Error('Failed to load representative');
        }

        const data = await response.json();
        setRepresentative(data.representative);

        logger.info('Loaded representative details', {
          representativeId,
          name: data.representative?.name,
        });
      } catch (err) {
        logger.error('Error loading representative', { error: err, representativeId });
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (representativeId) {
      loadRepresentative();
    }
  }, [representativeId]);

  const handleFollow = async () => {
    try {
      const endpoint = following
        ? `/api/representatives/${representativeId}/unfollow`
        : `/api/representatives/${representativeId}/follow`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        setFollowing(!following);
        logger.info(`${following ? 'Unfollowed' : 'Followed'} representative`, {
          representativeId,
          name: representative?.name,
        });
      }
    } catch (err) {
      logger.error('Error toggling follow', { error: err, representativeId });
    }
  };

  const handleBack = () => {
    router.back();
  };

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

  if (error || !representative) {
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
          <p className="text-red-600">{error || 'The representative you are looking for does not exist.'}</p>
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
            {representative.photo_url ? (
              <img
                src={representative.photo_url}
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
                following
                  ? 'bg-white text-blue-600 hover:bg-blue-50'
                  : 'bg-blue-500 text-white hover:bg-blue-400'
              }`}
            >
              {following ? 'Following' : 'Follow'}
            </button>
          </div>
        </div>

        {/* Contact Information */}
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {representative.email && (
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-semibold text-gray-700 mb-1">Email</p>
                  <a
                    href={`mailto:${representative.email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {representative.email}
                  </a>
                </div>
              </div>
            )}

            {representative.phone && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-semibold text-gray-700 mb-1">Phone</p>
                  <a
                    href={`tel:${representative.phone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {representative.phone}
                  </a>
                </div>
              </div>
            )}

            {representative.address && (
              <div className="flex items-start gap-3 md:col-span-2">
                <MapPin className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-semibold text-gray-700 mb-1">Address</p>
                  <p className="text-gray-600">{representative.address}</p>
                </div>
              </div>
            )}
          </div>

          {/* District Information */}
          {(representative.district || representative.state) && (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Represents</h3>
              <p className="text-gray-700">
                {representative.district && `${representative.district}, `}
                {representative.state}
              </p>
            </div>
          )}

          {/* Social Media & Links */}
          {(representative.urls && representative.urls.length > 0) && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Official Links</h3>
              <div className="flex flex-wrap gap-3">
                {representative.urls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Website
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Social Media Channels */}
          {(representative.channels && representative.channels.length > 0) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media</h3>
              <div className="flex flex-wrap gap-3">
                {representative.channels.map((channel, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg capitalize"
                  >
                    {channel.type}: {channel.id}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
