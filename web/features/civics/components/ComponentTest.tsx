/**
 * Component Test Suite
 * 
 * Test the enhanced candidate card components
 * This file demonstrates usage and integration
 */

'use client';

import React, { useState } from 'react';

import { devLog } from '@/lib/utils/logger';

import type { SuperiorRepresentativeData } from '../lib/civics-superior/superior-data-pipeline';

import EnhancedCandidateCard from './EnhancedCandidateCard';
import MobileCandidateCard from './MobileCandidateCard';
import ProgressiveDisclosure from './ProgressiveDisclosure';
import TouchInteractions from './TouchInteractions';

// Import types from the pipeline

// Mock data for testing
const mockRepresentative: SuperiorRepresentativeData = {
  id: 'test-1',
  name: 'John Smith',
  party: 'Democrat',
  office: 'U.S. Senator',
  level: 'federal',
  state: 'California',
  district: 'CA-12',
  enhancedContacts: [
    {
      type: 'email',
      value: 'john.smith@senate.gov',
      isPrimary: true,
      isVerified: true,
      source: 'congress.gov'
    },
    {
      type: 'phone',
      value: '(202) 224-3841',
      isPrimary: false,
      isVerified: true,
      source: 'congress.gov'
    }
  ],
  enhancedSocialMedia: [
    {
      platform: 'twitter',
      handle: 'SenJohnSmith',
      url: 'https://twitter.com/SenJohnSmith',
      followersCount: 125000,
      verified: true,
    },
    {
      platform: 'facebook',
      handle: 'SenatorJohnSmith',
      url: 'https://facebook.com/SenatorJohnSmith',
      followersCount: 89000,
      verified: true,
    }
  ],
  enhancedPhotos: [
    {
      url: 'https://example.com/photo1.jpg',
      source: 'congress-gov',
      altText: 'Official Senate Photo',
      attribution: 'Official Senate Photo',
      width: 400,
      height: 500
    }
  ],
  enhancedActivity: [
    {
      type: 'vote',
      title: 'Voted on Infrastructure Bill',
      description: 'Supported the bipartisan infrastructure investment bill',
      url: 'https://congress.gov/vote/123',
      date: new Date('2024-01-15').toISOString(),
      metadata: { vote: 'yea', bill: 'S.1234' },
      source: 'congress.gov'
    },
    {
      type: 'statement',
      title: 'Floor Speech on Climate Change',
      description: 'Delivered remarks on the importance of climate action',
      url: 'https://congress.gov/statement/456',
      date: new Date('2024-01-10').toISOString(),
      metadata: { topic: 'climate', duration: '15min' },
      source: 'congress.gov'
    }
  ],
  campaignFinance: {
    totalRaised: 2500000,
    totalSpent: 1800000,
    cashOnHand: 700000,
    lastFilingDate: new Date().toISOString(),
    source: 'fec.gov'
  },
  primaryData: {
    congressGov: { id: 'S001234', name: 'John Smith' },
    googleCivic: { name: 'John Smith', party: 'Democratic' },
    fec: { candidateId: 'S6CA00123' },
    confidence: 'high' as const,
    lastUpdated: new Date().toISOString(),
    source: 'live-api' as const
  },
  verificationStatus: 'verified' as const,
  dataSources: ['congress.gov', 'fec.gov', 'openstates.org'],
  dataQuality: {
    primarySourceScore: 85,
    secondarySourceScore: 80,
    overallConfidence: 85,
    lastValidated: new Date().toISOString(),
    validationMethod: 'api-verification' as const,
    dataCompleteness: 90,
    sourceReliability: 85
  },
  lastUpdated: new Date().toISOString()
};

export default function ComponentTest() {
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [variant, setVariant] = useState<'default' | 'compact' | 'detailed'>('default');

  const handleLike = (id: string) => {
    devLog('Liked item:', id);
    setIsLiked(!isLiked);
  };

  const handleShare = (id: string) => {
    devLog('Sharing item:', id);
    // Implement share functionality - could use Web Share API or copy to clipboard
    if (navigator.share) {
      navigator.share({
        title: 'Check this out',
        text: 'Look at this interesting content',
        url: window.location.href
      }).catch((error) => {
        devLog('Share failed:', error);
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Link copied to clipboard!');
      }).catch((error) => {
        devLog('Clipboard write failed:', error);
      });
    }
  };

  const handleFollow = (id: string) => {
    devLog('Following item:', id);
    setIsFollowing(!isFollowing);
  };

  const handleContact = (id: string, type: string) => {
    devLog('Contacting item:', id, 'via', type);
    // Implement contact functionality based on type
    switch (type) {
      case 'email':
        window.location.href = `mailto:contact@example.com?subject=Inquiry about ${id}`;
        break;
      case 'phone':
        window.location.href = 'tel:+1234567890';
        break;
      case 'social':
        // Open social media contact
        window.open('https://twitter.com/example', '_blank');
        break;
      default:
        devLog('Unknown contact type:', type);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Enhanced Candidate Card Components
          </h1>
          <p className="text-gray-600">
            Testing the new mobile-first candidate card implementations
          </p>
        </div>

        {/* Variant Selector */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Test Controls</h2>
          <div className="flex space-x-4">
            <button
              onClick={() => setVariant('default')}
              className={`px-4 py-2 rounded-md ${
                variant === 'default' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Default
            </button>
            <button
              onClick={() => setVariant('compact')}
              className={`px-4 py-2 rounded-md ${
                variant === 'compact' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Compact
            </button>
            <button
              onClick={() => setVariant('detailed')}
              className={`px-4 py-2 rounded-md ${
                variant === 'detailed' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Detailed
            </button>
          </div>
        </div>

        {/* Enhanced Candidate Card */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Enhanced Candidate Card</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <EnhancedCandidateCard
              representative={mockRepresentative}
              onLike={handleLike}
              onShare={handleShare}
              onFollow={handleFollow}
              onContact={handleContact}
              isLiked={isLiked}
              isFollowing={isFollowing}
              variant={variant}
            />
          </div>
        </div>

        {/* Mobile Candidate Card */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Mobile Candidate Card</h2>
          <div className="max-w-sm mx-auto">
            <MobileCandidateCard
              representative={mockRepresentative}
              onLike={handleLike}
              onShare={handleShare}
              onFollow={handleFollow}
              onContact={handleContact}
              isLiked={isLiked}
              isFollowing={isFollowing}
              showEngagement={true}
              enableHaptics={true}
            />
          </div>
        </div>

        {/* Progressive Disclosure Test */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Progressive Disclosure</h2>
          <ProgressiveDisclosure
            trigger={
              <div className="flex items-center justify-between">
                <span className="font-medium">Contact Information</span>
                <span className="text-sm text-gray-500">Tap to expand</span>
              </div>
            }
            className="border border-gray-200 rounded-lg"
          >
            <div className="p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs">📧</span>
                </div>
                <div>
                  <p className="text-sm font-medium">john.smith@senate.gov</p>
                  <p className="text-xs text-gray-500">Official Email</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-xs">📞</span>
                </div>
                <div>
                  <p className="text-sm font-medium">(202) 224-3841</p>
                  <p className="text-xs text-gray-500">Washington Office</p>
                </div>
              </div>
            </div>
          </ProgressiveDisclosure>
        </div>

        {/* Touch Interactions Test */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Touch Interactions</h2>
          <TouchInteractions
            onSwipeLeft={() => {/* Handle swipe left */}}
            onSwipeRight={() => {/* Handle swipe right */}}
            onSwipeUp={() => {/* Handle swipe up */}}
            onSwipeDown={() => {/* Handle swipe down */}}
            onLongPress={() => {/* Handle long press */}}
            onTap={() => {/* Handle tap */}}
            className="h-32 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center"
          >
            <div className="text-center">
              <p className="text-lg font-medium text-gray-700">Touch Test Area</p>
              <p className="text-sm text-gray-500">Try swiping, tapping, or long pressing</p>
            </div>
          </TouchInteractions>
        </div>

        {/* Status Display */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Component Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isLiked ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm">Liked: {isLiked ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isFollowing ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm">Following: {isFollowing ? 'Yes' : 'No'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm">Variant: {variant}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm">Components: Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
