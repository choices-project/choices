/**
 * Mobile-Optimized Candidate Card Component
 * 
 * Specialized mobile-first candidate card with enhanced touch interactions
 * Features:
 * - Mobile-first responsive design
 * - Enhanced touch gestures
 * - Optimized for small screens
 * - Better performance on mobile
 * - Accessibility support
 */

'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { 
  PhoneIcon, 
  EnvelopeIcon, 
  GlobeAltIcon,
  ShareIcon,
  HeartIcon,
  UserPlusIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartSolidIcon,
  UserPlusIcon as UserPlusSolidIcon
} from '@heroicons/react/24/solid';

// Import types from the pipeline
import type { SuperiorRepresentativeData } from '@/lib/civics-2-0/superior-data-pipeline';
import TouchInteractions from './TouchInteractions';
import ProgressiveDisclosure from './ProgressiveDisclosure';

type MobileCandidateCardProps = {
  representative: SuperiorRepresentativeData;
  onLike?: (id: string) => void;
  onShare?: (id: string) => void;
  onFollow?: (id: string) => void;
  onContact?: (id: string, type: string) => void;
  isLiked?: boolean;
  isFollowing?: boolean;
  className?: string;
  showEngagement?: boolean;
  enableHaptics?: boolean;
}

export default function MobileCandidateCard({
  representative,
  onLike,
  onShare,
  onFollow,
  onContact,
  isLiked = false,
  isFollowing = false,
  className = '',
  showEngagement = true,
  enableHaptics = true
}: MobileCandidateCardProps) {
  
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

  // Get primary photo with fallback
  const primaryPhoto = representative.enhancedPhotos?.[0];
  
  
  // Get social media with most followers
  const topSocialMedia = representative.enhancedSocialMedia
    ?.sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0))
    ?.slice(0, 2) || []; // Show fewer on mobile
  
  // Get recent activity
  const recentActivity = representative.enhancedActivity?.slice(0, 2) || []; // Show fewer on mobile

  // Haptic feedback
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (enableHaptics && 'vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      navigator.vibrate(patterns[type]);
    }
  }, [enableHaptics]);

  // Enhanced interaction handlers
  const handleLike = useCallback(async () => {
    try {
      setIsLoading(true);
      triggerHaptic('light');
      setIsLikedState(!isLikedState);
      await onLike?.(representative.id || '');
    } catch (error) {
      console.error('Failed to update like status:', error);
      setError('Failed to update like status');
      setIsLikedState(isLikedState); // Revert on error
    } finally {
      setIsLoading(false);
    }
  }, [isLikedState, onLike, representative.id, triggerHaptic]);

  const handleShare = useCallback(async () => {
    try {
      setIsLoading(true);
      triggerHaptic('medium');
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
  }, [onShare, representative.id, representative.name, representative.office, representative.state, triggerHaptic]);

  const handleFollow = useCallback(async () => {
    try {
      setIsLoading(true);
      triggerHaptic('medium');
      setIsFollowingState(!isFollowingState);
      await onFollow?.(representative.id || '');
    } catch (error) {
      console.error('Failed to update follow status:', error);
      setError('Failed to update follow status');
      setIsFollowingState(isFollowingState); // Revert on error
    } finally {
      setIsLoading(false);
    }
  }, [isFollowingState, onFollow, representative.id, triggerHaptic]);

  const handleContact = useCallback((type: string) => {
    try {
      triggerHaptic('light');
      onContact?.(representative.id || '', type);
    } catch (error) {
      console.error('Failed to initiate contact:', error);
      setError('Failed to initiate contact');
    }
  }, [onContact, representative.id, triggerHaptic]);

  const handlePhotoClick = useCallback(() => {
    if (primaryPhoto) {
      triggerHaptic('light');
      setShowPhotoModal(true);
    }
  }, [primaryPhoto, triggerHaptic]);

  // Touch gesture handlers
  const handleSwipeLeft = useCallback(() => {
    if (representative.enhancedPhotos && representative.enhancedPhotos.length > 1) {
      triggerHaptic('light');
      setActivePhotoIndex(prev => 
        prev < representative.enhancedPhotos.length - 1 ? prev + 1 : 0
      );
    }
  }, [representative.enhancedPhotos, triggerHaptic]);

  const handleSwipeRight = useCallback(() => {
    if (representative.enhancedPhotos && representative.enhancedPhotos.length > 1) {
      triggerHaptic('light');
      setActivePhotoIndex(prev => 
        prev > 0 ? prev - 1 : representative.enhancedPhotos.length - 1
      );
    }
  }, [representative.enhancedPhotos, triggerHaptic]);

  const handleSwipeUp = useCallback(() => {
    triggerHaptic('light');
    setIsExpanded(true);
  }, [triggerHaptic]);

  const handleSwipeDown = useCallback(() => {
    triggerHaptic('light');
    setIsExpanded(false);
  }, [triggerHaptic]);

  const handleLongPress = useCallback(() => {
    triggerHaptic('heavy');
    setShowPhotoModal(true);
  }, [triggerHaptic]);

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

  return (
    <TouchInteractions
      onSwipeLeft={handleSwipeLeft}
      onSwipeRight={handleSwipeRight}
      onSwipeUp={handleSwipeUp}
      onSwipeDown={handleSwipeDown}
      onLongPress={handleLongPress}
      swipeThreshold={30}
      longPressDelay={400}
      className="w-full"
    >
      <div 
        ref={cardRef}
        className={`bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl ${className}`}
        role="article"
        aria-label={`Mobile candidate card for ${representative.name}`}
      >
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-3">
            <div className="flex">
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
            className="relative h-48 w-full bg-gray-100 cursor-pointer group"
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
                <span className="text-4xl font-bold text-white">
                  {representative.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
            )}
            
            {/* Photo indicators - smaller on mobile */}
            {representative.enhancedPhotos && representative.enhancedPhotos.length > 1 && (
              <div className="absolute bottom-3 left-3 flex space-x-1">
                {representative.enhancedPhotos.map((_, index) => (
                  <button
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
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

            {/* Quality score badge - smaller on mobile */}
            <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${getQualityScoreColor(representative.dataQuality.overallConfidence)}`}>
              <div className="flex items-center space-x-1">
                <CheckCircleIcon className="w-3 h-3" />
                <span>{representative.dataQuality.overallConfidence}%</span>
              </div>
            </div>

            {/* Level indicator - smaller on mobile */}
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium text-gray-700">
              <span className="mr-1">{getLevelIcon(representative.level)}</span>
              {representative.level.toUpperCase()}
            </div>
          </div>

          {/* Basic info - compact for mobile */}
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 mb-1 truncate">
                  {representative.name}
                </h2>
                <p className="text-base text-gray-600 mb-1 truncate">
                  {representative.office}
                </p>
                <p className="text-sm text-gray-500 mb-3 truncate">
                  {representative.state}
                  {representative.district && ` • District ${representative.district}`}
                </p>
                
                {/* Party badge - smaller on mobile */}
                {representative.party && (
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPartyColor(representative.party)}`}>
                    {representative.party}
                  </span>
                )}
              </div>

              {/* Action buttons - vertical stack for mobile */}
              {showEngagement && (
                <div className="flex flex-col space-y-2 ml-3">
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
                    <HeartSolidIcon className="w-5 h-5" />
                  ) : (
                    <HeartIcon className="w-5 h-5" />
                  )}
                </button>
                
                <button
                  onClick={handleShare}
                  disabled={isLoading}
                  className="p-2 rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Share"
                >
                  <ShareIcon className="w-5 h-5" />
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
                    <UserPlusSolidIcon className="w-5 h-5" />
                  ) : (
                    <UserPlusIcon className="w-5 h-5" />
                  )}
                </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progressive disclosure for mobile */}
        <ProgressiveDisclosure
          isExpanded={isExpanded}
          onToggle={setIsExpanded}
          trigger={
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                {isExpanded ? 'Show Less' : 'Show More'}
              </span>
              <SparklesIcon className="w-4 h-4 text-gray-400" />
            </div>
          }
          className="border-t border-gray-200"
          contentClassName="p-4"
        >
          {/* Contact information - mobile optimized */}
          {representative.enhancedContacts && representative.enhancedContacts.length > 0 && (
            <div className="mb-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Contact</h3>
              <div className="space-y-2">
                {representative.enhancedContacts.slice(0, 2).map((contact, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {contact.type === 'email' && <EnvelopeIcon className="w-4 h-4 text-gray-400" />}
                      {contact.type === 'phone' && <PhoneIcon className="w-4 h-4 text-gray-400" />}
                      {contact.type === 'website' && <GlobeAltIcon className="w-4 h-4 text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{contact.value}</p>
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

          {/* Social media - mobile optimized */}
          {topSocialMedia.length > 0 && (
            <div className="mb-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Social Media</h3>
              <div className="space-y-2">
                {topSocialMedia.map((social, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {social.platform?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">@{social.handle}</p>
                      <p className="text-xs text-gray-500">
                        {(social.followersCount || 0).toLocaleString()} followers
                        {social.verified && (
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

          {/* Recent activity - mobile optimized */}
          {recentActivity.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">Recent Activity</h3>
              <div className="space-y-2">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      {activity.url ? (
                        <a 
                          href={activity.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline truncate block"
                        >
                          {activity.title}
                        </a>
                      ) : (
                        <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                      )}
                      {activity.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{activity.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        <ClockIcon className="w-3 h-3 inline mr-1" />
                        {new Date(activity.date).toLocaleDateString()}
                        {activity.source && (
                          <span className="ml-2 text-gray-500">• {activity.source}</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ProgressiveDisclosure>

        {/* Photo modal - mobile optimized */}
        {showPhotoModal && primaryPhoto && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPhotoModal(false)}
          >
            <div className="relative max-w-full max-h-full">
              <button
                onClick={() => setShowPhotoModal(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                aria-label="Close photo modal"
              >
                <XMarkIcon className="w-6 h-6 text-gray-600" />
              </button>
              
              <Image
                src={primaryPhoto.url}
                alt={`${representative.name} official photo`}
                width={400}
                height={300}
                className="rounded-lg max-w-full max-h-full object-contain"
                sizes="(max-width: 768px) 100vw, 80vw"
              />
            </div>
          </div>
        )}
      </div>
    </TouchInteractions>
  );
}
