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

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { 
  MagnifyingGlassIcon, 
  UserGroupIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import type { RepresentativeData } from '@/lib/civics-2-0/free-apis-pipeline';

export default function Civics2Page() {
  const [activeTab, setActiveTab] = useState<'representatives' | 'feed'>('representatives');
  const [representatives, setRepresentatives] = useState<RepresentativeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<string>('CA');
  const [selectedLevel, setSelectedLevel] = useState<'all' | 'federal' | 'state' | 'local'>('federal');
  const [likedRepresentatives, setLikedRepresentatives] = useState<Set<string>>(new Set());
  const [followedRepresentatives, setFollowedRepresentatives] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [cardVariant, setCardVariant] = useState<'default' | 'compact' | 'detailed'>('default');

  const loadRepresentatives = useCallback(async () => {
    setIsLoading(true);
    console.log('🔄 Loading representatives...');
    
    try {
      const response = await fetch(`/api/civics/by-state?state=${selectedState}&level=${selectedLevel}&limit=20`);
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to load representatives: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ API Response:', data);
      setRepresentatives(data.data || []);
    } catch (error) {
      console.error('❌ Error loading representatives:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedState, selectedLevel]);

  // Load representatives on component mount
  useEffect(() => {
    loadRepresentatives();
  }, [loadRepresentatives]);

  // Initialize client-side state
  useEffect(() => {
    // Mobile detection
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    // Share functionality
    console.log('Sharing representative:', id);
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
    // Contact functionality
    console.log('Contacting representative:', id, type);
  };

  const filteredRepresentatives = representatives.filter(rep => {
    if (!searchQuery) return true;
    return rep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           rep.office.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (rep.party || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Beautiful Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Civics 2.0</h1>
                  <p className="text-blue-100 text-sm">Your Democratic Voice</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center space-x-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  LIVE DATA
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  FREE APIs
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3 text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium">{selectedState}</p>
                  <p className="text-xs text-blue-200">Your State</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Beautiful Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('representatives')}
              className={`py-4 px-1 border-b-3 font-semibold text-sm transition-all duration-200 ${
                activeTab === 'representatives'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <UserGroupIcon className="w-5 h-5" />
                <span>Representatives</span>
                {activeTab === 'representatives' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {filteredRepresentatives.length}
                  </span>
                )}
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('feed')}
              className={`py-4 px-1 border-b-3 font-semibold text-sm transition-all duration-200 ${
                activeTab === 'feed'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
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
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search representatives..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="sm:w-32">
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                  >
                    <option value="CA">California</option>
                    <option value="NY">New York</option>
                    <option value="TX">Texas</option>
                    <option value="FL">Florida</option>
                    <option value="IL">Illinois</option>
                  </select>
                </div>
                <div className="sm:w-32">
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value as any)}
                  >
                    <option value="all">All Levels</option>
                    <option value="federal">Federal</option>
                    <option value="state">State</option>
                    <option value="local">Local</option>
                  </select>
                </div>
                <div className="sm:w-32">
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={cardVariant}
                    onChange={(e) => setCardVariant(e.target.value as any)}
                  >
                    <option value="default">Default</option>
                    <option value="compact">Compact</option>
                    <option value="detailed">Detailed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Representatives Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-lg text-gray-600 font-medium">Loading your representatives...</p>
                  <p className="text-sm text-gray-500 mt-2">Gathering the most current information</p>
                </div>
              </div>
            ) : filteredRepresentatives.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center max-w-md">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 0 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm6 3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm-13.5 0a2 2 0 1 1-4.5 0 2 2 0 0 1 4.5 0Z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">No representatives found</h3>
                  <p className="text-gray-600 mb-6">Try adjusting your search criteria or check back later for updated information.</p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Results Header */}
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Your {selectedState} Representatives
                  </h2>
                  <p className="text-gray-600">
                    Current elected officials serving your community
                  </p>
                </div>

                {/* Beautiful Candidate Cards */}
                <div className={`grid gap-8 ${
                  isMobile === true
                    ? 'grid-cols-1 max-w-lg mx-auto' 
                    : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
                }`}>
                  {filteredRepresentatives.map((representative) => (
                    <div key={representative.id} className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
                      {/* Header with Photo */}
                      <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                        <div className="flex items-start space-x-4">
                          {representative.photos?.[0] ? (
                            <div className="relative">
                              <Image 
                                src={representative.photos[0].url} 
                                alt={representative.name}
                                width={80}
                                height={80}
                                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
                              {representative.name.split(' ').map(n => n[0]).join('')}
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                              {representative.name}
                            </h3>
                            <p className="text-lg font-semibold text-gray-700 mb-1">{representative.office}</p>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                representative.party === 'Democratic' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : representative.party === 'Republican'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {representative.party}
                              </span>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500">{representative.state}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Contact Information */}
                      {representative.contacts?.length > 0 && (
                        <div className="p-6 border-t border-gray-100">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            Contact Information
                          </h4>
                          <div className="space-y-2">
                            {representative.contacts.slice(0, 3).map((contact: any, i: number) => (
                              <div key={i} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex-shrink-0">
                                  {contact.type === 'phone' && (
                                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                  )}
                                  {contact.type === 'website' && (
                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                                    </svg>
                                  )}
                                  {contact.type === 'address' && (
                                    <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 capitalize">{contact.type}</p>
                                  <p className="text-sm text-gray-600 truncate">{contact.value}</p>
                                </div>
                                {contact.type === 'website' && (
                                  <a 
                                    href={contact.value} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-700 transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Interactive Actions */}
                      <div className="px-6 py-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={() => handleLike(representative.id || '')}
                              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                                likedRepresentatives.has(representative.id || '')
                                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              <HeartIcon className="w-4 h-4" />
                              <span className="text-sm font-medium">Like</span>
                            </button>
                            <button
                              onClick={() => handleFollow(representative.id || '')}
                              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                                followedRepresentatives.has(representative.id || '')
                                  ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              <UserGroupIcon className="w-4 h-4" />
                              <span className="text-sm font-medium">Follow</span>
                            </button>
                            <button
                              onClick={() => handleShare(representative.id || '')}
                              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                              </svg>
                              <span className="text-sm font-medium">Share</span>
                            </button>
                          </div>
                          <button
                            onClick={() => handleContact(representative.id || '', 'general')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Contact
                          </button>
                        </div>
                      </div>

                      {/* Quality & Sources */}
                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm font-medium text-gray-700">Verified Data</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">Quality:</span>
                              <span className="text-sm font-bold text-blue-600">{representative.qualityScore}/100</span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            Sources: {representative.dataSources?.join(', ')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'feed' && (
          <div className="text-center py-12">
            <HeartIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Social Feed</h3>
            <p className="mt-1 text-sm text-gray-500">Coming soon...</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-500">Powered by FREE APIs: Google Civic, OpenStates, Congress.gov, FEC, Wikipedia</p>
            <p className="text-xs text-gray-400 mt-2">Data updated in real-time • Zero API costs • Open source</p>
          </div>
        </div>
      </div>
    </div>
  );
}
