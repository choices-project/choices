/**
 * Civics 2.0 Main Page
 * 
 * Beautiful, mobile-first civics platform with:
 * - Rich representative data
 * - Beautiful candidate cards
 * - Instagram-like social feed
 * - FREE APIs integration
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  MapPinIcon, 
  UserGroupIcon,
  ChartBarIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import CandidateCard from '@/components/civics-2-0/CandidateCard';
import SocialFeed from '@/components/civics-2-0/SocialFeed';

type RepresentativeData = {
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
};

type ContactInfo = {
  type: 'email' | 'phone' | 'website' | 'fax' | 'address';
  value: string;
  label?: string;
  isPrimary: boolean;
  isVerified: boolean;
  source: string;
};

type SocialMediaInfo = {
  platform: 'twitter' | 'facebook' | 'instagram' | 'youtube' | 'linkedin';
  handle: string;
  url: string;
  followersCount: number;
  isVerified: boolean;
  source: string;
};

type PhotoInfo = {
  url: string;
  source: 'congress-gov' | 'wikipedia' | 'google-civic' | 'openstates';
  quality: 'high' | 'medium' | 'low';
  isPrimary: boolean;
  license?: string;
  attribution?: string;
  width?: number;
  height?: number;
};

type ActivityInfo = {
  type: 'vote' | 'bill' | 'statement' | 'social_media' | 'photo_update';
  title: string;
  description?: string;
  url?: string;
  date: Date;
  metadata: Record<string, any>;
  source: string;
};

type CampaignFinanceInfo = {
  electionCycle: string;
  totalReceipts: number;
  totalDisbursements: number;
  cashOnHand: number;
  debt: number;
  individualContributions: number;
  pacContributions: number;
  partyContributions: number;
  selfFinancing: number;
};

export default function Civics2Page() {
  const [activeTab, setActiveTab] = useState<'representatives' | 'feed'>('representatives');
  const [representatives, setRepresentatives] = useState<RepresentativeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('CA');
  const [selectedLevel, setSelectedLevel] = useState<'all' | 'federal' | 'state' | 'local'>('all');
  const [likedRepresentatives, setLikedRepresentatives] = useState<Set<string>>(new Set());
  const [followedRepresentatives, setFollowedRepresentatives] = useState<Set<string>>(new Set());

  // Load representatives on component mount
  useEffect(() => {
    loadRepresentatives();
  }, [selectedState, selectedLevel]);

  const loadRepresentatives = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/v1/civics/by-state?state=${selectedState}&level=${selectedLevel}&limit=20`);
      
      if (!response.ok) {
        throw new Error('Failed to load representatives');
      }

      const data = await response.json();
      setRepresentatives(data.data || []);
    } catch (error) {
      console.error('Error loading representatives:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = (id: string) => {
    setLikedRepresentatives(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleShare = (id: string) => {
    const rep = representatives.find(r => r.id === id);
    if (rep && navigator.share) {
      navigator.share({
        title: `${rep.name} - ${rep.office}`,
        text: `Learn more about ${rep.name}, ${rep.office} from ${rep.state}`,
        url: window.location.href
      });
    }
  };

  const handleFollow = (id: string) => {
    setFollowedRepresentatives(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleContact = (id: string, type: string) => {
    const rep = representatives.find(r => r.id === id);
    if (rep) {
      const contact = rep.contacts.find(c => c.type === type);
      if (contact) {
        if (type === 'email') {
          window.location.href = `mailto:${contact.value}`;
        } else if (type === 'phone') {
          window.location.href = `tel:${contact.value}`;
        } else if (type === 'website') {
          window.open(contact.value, '_blank');
        }
      }
    }
  };

  const filteredRepresentatives = representatives.filter(rep => {
    if (!searchQuery) return true;
    return rep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           rep.office.toLowerCase().includes(searchQuery.toLowerCase()) ||
           rep.party.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Civics 2.0</h1>
              <div className="hidden sm:block">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  FREE APIs
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
                <MapPinIcon className="w-4 h-4" />
                <span>{selectedState}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('representatives')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'representatives'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <UserGroupIcon className="w-5 h-5" />
                <span>Representatives</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('feed')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'feed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <HeartIcon className="w-5 h-5" />
                <span>Feed</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'representatives' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search representatives..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                {/* State Filter */}
                <div className="sm:w-32">
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="CA">California</option>
                    <option value="NY">New York</option>
                    <option value="TX">Texas</option>
                    <option value="FL">Florida</option>
                    <option value="IL">Illinois</option>
                  </select>
                </div>
                
                {/* Level Filter */}
                <div className="sm:w-32">
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Levels</option>
                    <option value="federal">Federal</option>
                    <option value="state">State</option>
                    <option value="local">Local</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Representatives Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-500">Loading representatives...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRepresentatives.map((representative) => (
                  <CandidateCard
                    key={representative.id}
                    representative={representative}
                    onLike={handleLike}
                    onShare={handleShare}
                    onFollow={handleFollow}
                    onContact={handleContact}
                    isLiked={likedRepresentatives.has(representative.id)}
                    isFollowing={followedRepresentatives.has(representative.id)}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredRepresentatives.length === 0 && (
              <div className="text-center py-12">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No representatives found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'feed' && (
          <div className="space-y-6">
            {/* Feed Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Civic Feed</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Stay updated with your representatives&apos; latest activity
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <ChartBarIcon className="w-4 h-4" />
                  <span>Real-time updates</span>
                </div>
              </div>
            </div>

            {/* Social Feed */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <SocialFeed
                userId="current-user" // This would come from auth
                preferences={{
                  state: selectedState,
                  interests: ['civics', 'politics', 'democracy'],
                  followedRepresentatives: Array.from(followedRepresentatives)
                }}
                onLike={(itemId) => console.log('Like:', itemId)}
                onShare={(itemId) => console.log('Share:', itemId)}
                onBookmark={(itemId) => console.log('Bookmark:', itemId)}
                onComment={(itemId) => console.log('Comment:', itemId)}
                className="h-96"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Powered by FREE APIs: Google Civic, OpenStates, Congress.gov, FEC, Wikipedia
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Data updated in real-time • Zero API costs • Open source
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

