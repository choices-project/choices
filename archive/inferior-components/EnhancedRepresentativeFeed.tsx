/**
 * Enhanced Representative Feed Component
 * 
 * Displays a feed of representatives with advanced features:
 * - Filtering by state, party, office level
 * - Search functionality
 * - Quality indicators
 * - Mobile-optimized layout
 * - Interactive elements
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { 
  MagnifyingGlassIcon, 
  MapPinIcon, 
  UserGroupIcon,
  ChartBarIcon,
  HeartIcon,
  ShareIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import type { SuperiorRepresentativeData } from '@/lib/civics-2-0/superior-data-pipeline';

type EnhancedRepresentativeFeedProps = {
  userId?: string;
  showHeader?: boolean;
  maxItems?: number;
  onRepresentativeClick?: (representative: RepresentativeData) => void;
  className?: string;
}

export default function EnhancedRepresentativeFeed({
  userId,
  showHeader = true,
  maxItems = 20,
  onRepresentativeClick,
  className = ''
}: EnhancedRepresentativeFeedProps) {
  console.log('EnhancedRepresentativeFeed initialized for user:', userId || 'anonymous');
  const [representatives, setRepresentatives] = useState<RepresentativeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<string>('CA');
  const [selectedLevel, setSelectedLevel] = useState<'all' | 'federal' | 'state' | 'local'>('federal');
  const [selectedParty, setSelectedParty] = useState<'all' | 'Democratic' | 'Republican' | 'Independent'>('all');
  const [likedRepresentatives, setLikedRepresentatives] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRepresentatives = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        state: selectedState,
        level: selectedLevel,
        limit: maxItems.toString()
      });

      const response = await fetch(`/api/civics/by-state?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load representatives: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Representatives loaded:', data);
      
      if (data.representatives) {
        setRepresentatives(data.representatives);
      } else {
        setRepresentatives([]);
      }
    } catch (err) {
      console.error('❌ Error loading representatives:', err);
      setError(err instanceof Error ? err.message : 'Failed to load representatives');
      setRepresentatives([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedState, selectedLevel, maxItems]);

  useEffect(() => {
    loadRepresentatives();
  }, [loadRepresentatives]);

  const handleLike = useCallback((representativeId: string) => {
    setLikedRepresentatives(prev => {
      const newSet = new Set(prev);
      if (newSet.has(representativeId)) {
        newSet.delete(representativeId);
      } else {
        newSet.add(representativeId);
      }
      return newSet;
    });
  }, []);

  const handleContact = useCallback((type: string, value: string) => {
    console.log('Contact representative:', type, value);
    // Implement contact functionality
  }, []);

  const handleShare = useCallback((representative: RepresentativeData) => {
    console.log('Share representative:', representative.name);
    // Implement share functionality
  }, []);

  const filteredRepresentatives = representatives.filter(rep => {
    // Search filter
    if (searchQuery && !rep.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !rep.office.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Party filter
    if (selectedParty !== 'all' && rep.party !== selectedParty) {
      return false;
    }

    return true;
  });

  const getPartyColor = (party: string) => {
    switch (party) {
      case 'Democratic':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Republican':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Independent':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {showHeader && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        )}
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        {showHeader && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900">Representatives</h2>
          </div>
        )}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Representatives</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={loadRepresentatives}
                className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {showHeader && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <UserGroupIcon className="w-5 h-5 mr-2 text-blue-500" />
                Representatives
              </h2>
              <p className="text-sm text-gray-600">
                {filteredRepresentatives.length} representative{filteredRepresentatives.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <AdjustmentsHorizontalIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search representatives..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              {/* State Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPinIcon className="w-4 h-4 inline mr-1" />
                  State
                </label>
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
                  <option value="PA">Pennsylvania</option>
                  <option value="OH">Ohio</option>
                  <option value="GA">Georgia</option>
                  <option value="NC">North Carolina</option>
                  <option value="MI">Michigan</option>
                </select>
              </div>

              {/* Level Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ChartBarIcon className="w-4 h-4 inline mr-1" />
                  Office Level
                </label>
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

              {/* Party Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FunnelIcon className="w-4 h-4 inline mr-1" />
                  Party
                </label>
                <select
                  value={selectedParty}
                  onChange={(e) => setSelectedParty(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Parties</option>
                  <option value="Democratic">Democratic</option>
                  <option value="Republican">Republican</option>
                  <option value="Independent">Independent</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Representatives List */}
      {filteredRepresentatives.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Representatives Found</h3>
          <p className="text-gray-600">
            {searchQuery 
              ? `No representatives match "${searchQuery}"`
              : 'No representatives available for the selected criteria'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRepresentatives.map((representative) => (
            <div
              key={representative.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onRepresentativeClick?.(representative)}
            >
              <div className="p-4">
                <div className="flex items-center space-x-3">
                  {/* Photo */}
                  <div className="flex-shrink-0">
                    {representative.photos?.[0] ? (
                      <Image
                        src={representative.photos[0].url}
                        alt={representative.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {representative.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{representative.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPartyColor(representative.party || '')}`}>
                        {representative.party || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{representative.office}</p>
                    {representative.qualityScore && (
                      <div className="flex items-center mt-1">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-1 ${
                            representative.qualityScore > 0.8 ? 'bg-green-400' :
                            representative.qualityScore > 0.6 ? 'bg-yellow-400' : 'bg-red-400'
                          }`}></div>
                          <span className="text-xs text-gray-500">
                            Quality: {Math.round(representative.qualityScore * 100)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(representative.id || '');
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      {likedRepresentatives.has(representative.id || '') ? (
                        <HeartSolidIcon className="w-5 h-5 text-red-500" />
                      ) : (
                        <HeartIcon className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(representative);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      <ShareIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContact('general', '');
                      }}
                      className="p-2 text-gray-400 hover:text-green-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
