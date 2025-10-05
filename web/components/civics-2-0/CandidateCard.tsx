/**
 * Civics 2.0 Candidate Card Component
 * 
 * Beautiful, mobile-first candidate cards with rich data and photos
 * Features:
 * - Touch-optimized interactions
 * - Progressive disclosure
 * - High-quality photos
 * - Social media integration
 * - Contact actions
 * - Accessibility support
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { 
  PhoneIcon, 
  EnvelopeIcon, 
  GlobeAltIcon,
  ShareIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  UserPlusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartSolidIcon,
  ShareIcon as ShareSolidIcon
} from '@heroicons/react/24/solid';

interface RepresentativeData {
  id: string;
  name: string;
  party: string;
  office: string;
  level: 'federal' | 'state' | 'local';
  state: string;
  district?: string;
  contacts: ContactInfo[];
  socialMedia: SocialMediaInfo[];
  photos: PhotoInfo[];
  activity: ActivityInfo[];
  campaignFinance?: CampaignFinanceInfo;
  qualityScore: number;
  lastUpdated: Date;
}

interface ContactInfo {
  type: 'email' | 'phone' | 'website' | 'fax' | 'address';
  value: string;
  label?: string;
  isPrimary: boolean;
  isVerified: boolean;
  source: string;
}

interface SocialMediaInfo {
  platform: 'twitter' | 'facebook' | 'instagram' | 'youtube' | 'linkedin';
  handle: string;
  url: string;
  followersCount: number;
  isVerified: boolean;
  source: string;
}

interface PhotoInfo {
  url: string;
  source: 'congress-gov' | 'wikipedia' | 'google-civic' | 'openstates';
  quality: 'high' | 'medium' | 'low';
  isPrimary: boolean;
  license?: string;
  attribution?: string;
  width?: number;
  height?: number;
}

interface ActivityInfo {
  type: 'vote' | 'bill' | 'statement' | 'social_media' | 'photo_update';
  title: string;
  description?: string;
  url?: string;
  date: Date;
  metadata: Record<string, any>;
  source: string;
}

interface CampaignFinanceInfo {
  electionCycle: string;
  totalReceipts: number;
  totalDisbursements: number;
  cashOnHand: number;
  debt: number;
  individualContributions: number;
  pacContributions: number;
  partyContributions: number;
  selfFinancing: number;
}

interface CandidateCardProps {
  representative: RepresentativeData;
  onLike?: (id: string) => void;
  onShare?: (id: string) => void;
  onFollow?: (id: string) => void;
  onContact?: (id: string, type: string) => void;
  isLiked?: boolean;
  isFollowing?: boolean;
  className?: string;
}

export default function CandidateCard({
  representative,
  onLike,
  onShare,
  onFollow,
  onContact,
  isLiked = false,
  isFollowing = false,
  className = ''
}: CandidateCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isLikedState, setIsLikedState] = useState(isLiked);
  const [isFollowingState, setIsFollowingState] = useState(isFollowing);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);

  // Touch gesture handling
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  // Get primary photo
  const primaryPhoto = representative.photos.find(photo => photo.isPrimary) || representative.photos[0];
  
  // Get primary contact
  const primaryContact = representative.contacts.find(contact => contact.isPrimary);
  
  // Get social media with most followers
  const topSocialMedia = representative.socialMedia
    .sort((a, b) => b.followersCount - a.followersCount)
    .slice(0, 3);

  // Handle touch gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      setTouchEnd({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;
    const minSwipeDistance = 50;

    // Horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe right - previous photo
        setActivePhotoIndex(prev => 
          prev > 0 ? prev - 1 : representative.photos.length - 1
        );
      } else {
        // Swipe left - next photo
        setActivePhotoIndex(prev => 
          prev < representative.photos.length - 1 ? prev + 1 : 0
        );
      }
    }

    // Vertical swipe
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > minSwipeDistance) {
      if (deltaY < 0) {
        // Swipe up - expand details
        setIsExpanded(true);
      } else {
        // Swipe down - collapse details
        setIsExpanded(false);
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // Handle interactions
  const handleLike = () => {
    setIsLikedState(!isLikedState);
    onLike?.(representative.id);
  };

  const handleShare = () => {
    onShare?.(representative.id);
    // Native sharing if available
    if (navigator.share) {
      navigator.share({
        title: `${representative.name} - ${representative.office}`,
        text: `Learn more about ${representative.name}, ${representative.office} from ${representative.state}`,
        url: window.location.href
      });
    }
  };

  const handleFollow = () => {
    setIsFollowingState(!isFollowingState);
    onFollow?.(representative.id);
  };

  const handleContact = (type: string) => {
    onContact?.(representative.id, type);
  };

  const handlePhotoClick = () => {
    setShowPhotoModal(true);
  };

  const handlePhotoModalClose = () => {
    setShowPhotoModal(false);
  };

  // Get party color
  const getPartyColor = (party: string) => {
    const partyColors: Record<string, string> = {
      'Republican': 'text-red-600 bg-red-50 border-red-200',
      'Democrat': 'text-blue-600 bg-blue-50 border-blue-200',
      'Independent': 'text-gray-600 bg-gray-50 border-gray-200',
      'Green': 'text-green-600 bg-green-50 border-green-200',
      'Libertarian': 'text-yellow-600 bg-yellow-50 border-yellow-200'
    };
    
    return partyColors[party] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  // Get quality score color
  const getQualityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div 
      ref={cardRef}
      className={`bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header with photo and basic info */}
      <div className="relative">
        {/* Photo */}
        <div 
          ref={photoRef}
          className="relative h-64 w-full bg-gray-100 cursor-pointer"
          onClick={handlePhotoClick}
        >
          {primaryPhoto ? (
            <Image
              src={primaryPhoto.url}
              alt={`${representative.name} official photo`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-500 to-purple-600">
              <span className="text-6xl font-bold text-white">
                {representative.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
          )}
          
          {/* Photo indicators */}
          {representative.photos.length > 1 && (
            <div className="absolute bottom-4 left-4 flex space-x-2">
              {representative.photos.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === activePhotoIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePhotoIndex(index);
                  }}
                />
              ))}
            </div>
          )}

          {/* Quality score badge */}
          <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-medium ${getQualityScoreColor(representative.qualityScore)}`}>
            {representative.qualityScore}% Complete
          </div>
        </div>

        {/* Basic info */}
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {representative.name}
              </h2>
              <p className="text-lg text-gray-600 mb-2">
                {representative.office}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                {representative.state}
                {representative.district && ` • District ${representative.district}`}
              </p>
              
              {/* Party badge */}
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPartyColor(representative.party)}`}>
                {representative.party}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col space-y-2 ml-4">
              <button
                onClick={handleLike}
                className={`p-2 rounded-full transition-colors ${
                  isLikedState 
                    ? 'text-red-500 bg-red-50' 
                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                }`}
                aria-label={isLikedState ? 'Unlike' : 'Like'}
              >
                {isLikedState ? (
                  <HeartSolidIcon className="w-6 h-6" />
                ) : (
                  <HeartIcon className="w-6 h-6" />
                )}
              </button>
              
              <button
                onClick={handleShare}
                className="p-2 rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                aria-label="Share"
              >
                <ShareIcon className="w-6 h-6" />
              </button>
              
              <button
                onClick={handleFollow}
                className={`p-2 rounded-full transition-colors ${
                  isFollowingState 
                    ? 'text-blue-500 bg-blue-50' 
                    : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
                }`}
                aria-label={isFollowingState ? 'Unfollow' : 'Follow'}
              >
                <UserPlusIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable sections */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {/* Contact information */}
          {representative.contacts.length > 0 && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                {representative.contacts.map((contact, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {contact.type === 'email' && <EnvelopeIcon className="w-5 h-5 text-gray-400" />}
                      {contact.type === 'phone' && <PhoneIcon className="w-5 h-5 text-gray-400" />}
                      {contact.type === 'website' && <GlobeAltIcon className="w-5 h-5 text-gray-400" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{contact.value}</p>
                      {contact.label && (
                        <p className="text-xs text-gray-500">{contact.label}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleContact(contact.type)}
                      className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                    >
                      {contact.type === 'email' && 'Email'}
                      {contact.type === 'phone' && 'Call'}
                      {contact.type === 'website' && 'Visit'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social media */}
          {topSocialMedia.length > 0 && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media</h3>
              <div className="grid grid-cols-1 gap-3">
                {topSocialMedia.map((social, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {social.platform?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">@{social.handle}</p>
                      <p className="text-xs text-gray-500">
                        {social.followersCount.toLocaleString()} followers
                      </p>
                    </div>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                    >
                      Follow
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent activity */}
          {representative.activity.length > 0 && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {representative.activity.slice(0, 3).map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      {activity.description && (
                        <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expand/collapse button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <span className="text-sm font-medium">
            {isExpanded ? 'Show Less' : 'Show More'}
          </span>
          {isExpanded ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : (
            <ChevronDownIcon className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Photo modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={handlePhotoModalClose}
              className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600" />
            </button>
            
            {primaryPhoto && (
              <Image
                src={primaryPhoto.url}
                alt={`${representative.name} official photo`}
                width={800}
                height={600}
                className="rounded-lg"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

