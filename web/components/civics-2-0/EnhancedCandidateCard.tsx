/**
 * Enhanced Civics 2.0 Candidate Card Component
 * 
 * Beautiful, mobile-first candidate cards with rich data and photos
 * Features:
 * - Enhanced touch-optimized interactions
 * - Improved progressive disclosure
 * - High-quality photos with better management
 * - Enhanced social media integration
 * - Better contact actions
 * - WCAG 2.2 AA accessibility compliance
 * - Performance optimizations
 * - Better error handling
 */

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { 
  PhoneIcon, 
  EnvelopeIcon, 
  GlobeAltIcon,
  ShareIcon,
  HeartIcon,
  UserPlusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartSolidIcon,
  UserPlusIcon as UserPlusSolidIcon
} from '@heroicons/react/24/solid';

// Import types from the pipeline
import type { RepresentativeData } from '@/lib/civics-2-0/free-apis-pipeline';

type CandidateCardProps = {
  representative: RepresentativeData;
  onLike?: (id: string) => void;
  onShare?: (id: string) => void;
  onFollow?: (id: string) => void;
  onContact?: (id: string, type: string) => void;
  isLiked?: boolean;
  isFollowing?: boolean;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
  showEngagement?: boolean;
}

export default function EnhancedCandidateCard({
  representative,
  onLike,
  onShare,
  onFollow,
  onContact,
  isLiked = false,
  isFollowing = false,
  className = '',
  variant = 'default',
  showEngagement: _showEngagement = true,
}: CandidateCardProps) {
  
  // State management
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isLikedState, setIsLikedState] = useState(isLiked);
  const [isFollowingState, setIsFollowingState] = useState(isFollowing);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const cardRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Get primary photo with fallback
  const primaryPhoto = representative.photos?.find(photo => photo.isPrimary) || representative.photos?.[0];
  
  
  // Get social media with most followers
  const topSocialMedia = representative.socialMedia
    ?.sort((a, b) => b.followersCount - a.followersCount)
    ?.slice(0, 3) || [];
  
  // Get recent activity
  const recentActivity = representative.activity?.slice(0, 3) || [];

  // Enhanced touch gesture handling with better performance
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches[0]) {
      touchStartRef.current = { 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY,
        time: Date.now()
      };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches[0] && touchStartRef.current) {
      touchEndRef.current = { 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY,
        time: Date.now()
      };
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStartRef.current || !touchEndRef.current) return;

    const deltaX = touchEndRef.current.x - touchStartRef.current.x;
    const deltaY = touchEndRef.current.y - touchStartRef.current.y;
    const deltaTime = touchEndRef.current.time - touchStartRef.current.time;
    const minSwipeDistance = 50;
    const maxSwipeTime = 300; // ms

    // Only process if swipe was fast enough
    if (deltaTime > maxSwipeTime) {
      touchStartRef.current = null;
      touchEndRef.current = null;
      return;
    }

    // Horizontal swipe for photo navigation
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (representative.photos && representative.photos.length > 1) {
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
    }

    // Vertical swipe for expand/collapse
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > minSwipeDistance) {
      if (deltaY < 0) {
        // Swipe up - expand details
        setIsExpanded(true);
      } else {
        // Swipe down - collapse details
        setIsExpanded(false);
      }
    }

    touchStartRef.current = null;
    touchEndRef.current = null;
  }, [representative.photos]);

  // Enhanced interaction handlers with error handling
  const handleLike = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsLikedState(!isLikedState);
      await onLike?.(representative.id || '');
    } catch (error) {
      console.error('Failed to update like status:', error);
      setError('Failed to update like status');
      setIsLikedState(isLikedState); // Revert on error
    } finally {
      setIsLoading(false);
    }
  }, [isLikedState, onLike, representative.id]);

  const handleShare = useCallback(async () => {
    try {
      setIsLoading(true);
      await onShare?.(representative.id || '');
      
      // Native sharing if available
      if (navigator.share) {
        await navigator.share({
          title: `${representative.name} - ${representative.office}`,
          text: `Learn more about ${representative.name}, ${representative.office} from ${representative.state}`,
          url: window.location.href
        });
      }
    } catch (error) {
      console.error('Failed to share:', error);
      setError('Failed to share');
    } finally {
      setIsLoading(false);
    }
  }, [onShare, representative.id, representative.name, representative.office, representative.state]);

  const handleFollow = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsFollowingState(!isFollowingState);
      await onFollow?.(representative.id || '');
    } catch (error) {
      console.error('Failed to update follow status:', error);
      setError('Failed to update follow status');
      setIsFollowingState(isFollowingState); // Revert on error
    } finally {
      setIsLoading(false);
    }
  }, [isFollowingState, onFollow, representative.id]);

  const handleContact = useCallback((type: string) => {
    try {
      onContact?.(representative.id || '', type);
    } catch (error) {
      console.error('Failed to initiate contact:', error);
      setError('Failed to initiate contact');
    }
  }, [onContact, representative.id]);

  const handlePhotoClick = useCallback(() => {
    if (primaryPhoto) {
      setShowPhotoModal(true);
    }
  }, [primaryPhoto]);

  const handlePhotoModalClose = useCallback(() => {
    setShowPhotoModal(false);
  }, []);

  // Utility functions
  const getPartyColor = useCallback((party?: string) => {
    const partyColors: Record<string, string> = {
      'Republican': 'text-red-600 bg-red-50 border-red-200',
      'Democrat': 'text-blue-600 bg-blue-50 border-blue-200',
      'Democratic': 'text-blue-600 bg-blue-50 border-blue-200',
      'Independent': 'text-gray-600 bg-gray-50 border-gray-200',
      'Green': 'text-green-600 bg-green-50 border-green-200',
      'Libertarian': 'text-yellow-600 bg-yellow-50 border-yellow-200'
    };
    
    return partyColors[party || ''] || 'text-gray-600 bg-gray-50 border-gray-200';
  }, []);

  const getQualityScoreColor = useCallback((score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  }, []);

  const getLevelIcon = useCallback((level: string) => {
    switch (level) {
      case 'federal': return '🏛️';
      case 'state': return '🏛️';
      case 'local': return '🏢';
      default: return '👤';
    }
  }, []);

  // Error boundary effect
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Compact variant
  if (variant === 'compact') {
    return (
      <div 
        ref={cardRef}
        className={`bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-lg ${className}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center p-4">
          {/* Photo */}
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
            {primaryPhoto ? (
              <Image
                src={primaryPhoto.url}
                alt={`${representative.name} photo`}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-500 to-purple-600">
                <span className="text-lg font-bold text-white">
                  {representative.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 ml-4">
            <h3 className="text-lg font-semibold text-gray-900">{representative.name}</h3>
            <p className="text-sm text-gray-600">{representative.office}</p>
            <p className="text-xs text-gray-500">{representative.state}</p>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <button
              onClick={handleLike}
              disabled={isLoading}
              className={`p-2 rounded-full transition-colors ${
                isLikedState 
                  ? 'text-red-500 bg-red-50' 
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
              aria-label={isLikedState ? 'Unlike' : 'Like'}
            >
              {isLikedState ? (
                <HeartSolidIcon className="w-5 h-5" />
              ) : (
                <HeartIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={cardRef}
      className={`bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="article"
      aria-label={`Candidate card for ${representative.name}`}
    >
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header with photo and basic info */}
      <div className="relative">
        {/* Photo */}
        <div 
          ref={photoRef}
          className="relative h-64 w-full bg-gray-100 cursor-pointer group"
          onClick={handlePhotoClick}
          role="button"
          tabIndex={0}
          aria-label="Click to view full size photo"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handlePhotoClick();
            }
          }}
        >
          {primaryPhoto ? (
            <Image
              src={primaryPhoto.url}
              alt={`${representative.name} official photo`}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
              onError={() => setError('Failed to load photo')}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-500 to-purple-600">
              <span className="text-6xl font-bold text-white">
                {representative.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
          )}
          
          {/* Photo indicators */}
          {representative.photos && representative.photos.length > 1 && (
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
                  aria-label={`View photo ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Quality score badge */}
          <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-medium ${getQualityScoreColor(representative.qualityScore)}`}>
            <div className="flex items-center space-x-1">
              <CheckCircleIcon className="w-3 h-3" />
              <span>{representative.qualityScore}% Complete</span>
            </div>
          </div>

          {/* Level indicator */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium text-gray-700">
            <span className="mr-1">{getLevelIcon(representative.level)}</span>
            {representative.level.toUpperCase()}
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
              {representative.party && (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPartyColor(representative.party)}`}>
                  {representative.party}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col space-y-2 ml-4">
              <button
                onClick={handleLike}
                disabled={isLoading}
                className={`p-2 rounded-full transition-colors ${
                  isLikedState 
                    ? 'text-red-500 bg-red-50' 
                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                disabled={isLoading}
                className="p-2 rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Share"
              >
                <ShareIcon className="w-6 h-6" />
              </button>
              
              <button
                onClick={handleFollow}
                disabled={isLoading}
                className={`p-2 rounded-full transition-colors ${
                  isFollowingState 
                    ? 'text-blue-500 bg-blue-50' 
                    : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label={isFollowingState ? 'Unfollow' : 'Follow'}
              >
                {isFollowingState ? (
                  <UserPlusSolidIcon className="w-6 h-6" />
                ) : (
                  <UserPlusIcon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable sections */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {/* Contact information */}
          {representative.contacts && representative.contacts.length > 0 && (
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
                      {contact.isVerified && (
                        <div className="flex items-center space-x-1 mt-1">
                          <CheckCircleIcon className="w-3 h-3 text-green-500" />
                          <span className="text-xs text-green-600">Verified</span>
                        </div>
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
                        {social.isVerified && (
                          <span className="ml-1 text-green-600">✓</span>
                        )}
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
          {recentActivity.length > 0 && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
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
                        <ClockIcon className="w-3 h-3 inline mr-1" />
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
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Show less information' : 'Show more information'}
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
      {showPhotoModal && primaryPhoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handlePhotoModalClose}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={handlePhotoModalClose}
              className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
              aria-label="Close photo modal"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600" />
            </button>
            
            <Image
              src={primaryPhoto.url}
              alt={`${representative.name} official photo`}
              width={800}
              height={600}
              className="rounded-lg"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
            />
          </div>
        </div>
      )}
    </div>
  );
}
