/**
 * Enhanced Candidate Card Component
 * 
 * Displays detailed information about a political representative
 * with contact options and social sharing capabilities.
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { 
  PhoneIcon, 
  EnvelopeIcon, 
  GlobeAltIcon,
  ShareIcon,
  UserIcon,
  BuildingOfficeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
// import type { Candidate } from '@/features/civics/lib/civics/types'; // Unused import

type _Representative = {
  id: string;
  name: string;
  title: string;
  party: string;
  district: string;
  state: string;
  photo?: string;
  website?: string;
  email?: string;
  phone?: string;
  office?: string;
  bio?: string;
  committees?: string[];
  social_media?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
}

type EnhancedCandidateCardProps = {
  representative: _Representative;
  onContact?: (representative: _Representative) => void;
  onShare?: (representative: _Representative) => void;
  onViewProfile?: (representative: _Representative) => void;
}

export default function EnhancedCandidateCard({ 
  representative, 
  onContact, 
  onShare, 
  onViewProfile 
}: EnhancedCandidateCardProps) {
  const handleContact = () => {
    if (onContact) {
      onContact(representative);
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(representative);
    }
  };

  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile(representative);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
        <div className="flex items-center space-x-4">
          {representative.photo ? (
            <Image
              src={representative.photo}
              alt={representative.name}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover border-2 border-white"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-white" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-xl font-bold">{representative.name}</h3>
            <p className="text-blue-100">{representative.office}</p>
            <p className="text-blue-200 text-sm">{representative.party} • {representative.district}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Basic Info */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center text-gray-600">
            <BuildingOfficeIcon className="w-5 h-5 mr-2" />
            <span>{representative.state}</span>
          </div>
          
          {representative.office && (
            <div className="flex items-center text-gray-600">
              <MapPinIcon className="w-5 h-5 mr-2" />
              <span>{representative.office}</span>
            </div>
          )}

        </div>

        {/* Committees - Not available in current Candidate type */}

        {/* Contact Information */}
        <div className="space-y-3 mb-6">
          <h4 className="font-semibold text-gray-900">Contact Information</h4>
          
          {representative.phone && (
            <div className="flex items-center text-gray-600">
              <PhoneIcon className="w-5 h-5 mr-2" />
              <span>{representative.phone}</span>
            </div>
          )}
          
          {representative.email && (
            <div className="flex items-center text-gray-600">
              <EnvelopeIcon className="w-5 h-5 mr-2" />
              <span>{representative.email}</span>
            </div>
          )}
          
          {representative.website && (
            <div className="flex items-center text-blue-600">
              <GlobeAltIcon className="w-5 h-5 mr-2" />
              <a 
                href={representative.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Official Website
              </a>
            </div>
          )}
        </div>

        {/* Social Media */}
        {representative.social_media && (
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">Social Media</h4>
            <div className="flex space-x-4">
              {representative.social_media.twitter && (
                <a
                  href={`https://twitter.com/${representative.social_media.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-600"
                >
                  Twitter
                </a>
              )}
              {representative.social_media.facebook && (
                <a
                  href={representative.social_media.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Facebook
                </a>
              )}
              {representative.social_media.instagram && (
                <a
                  href={`https://instagram.com/${representative.social_media.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-600 hover:text-pink-800"
                >
                  Instagram
                </a>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleContact}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <PhoneIcon className="w-4 h-4 mr-2" />
            Contact
          </button>
          
          <button
            onClick={handleShare}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
          >
            <ShareIcon className="w-4 h-4 mr-2" />
            Share
          </button>
          
          <button
            onClick={handleViewProfile}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
}
