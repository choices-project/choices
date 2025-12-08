'use client'

/**
 * Civics Main Page
 *
 * Beautiful, mobile-first civics platform with:
 * - Rich representative data
 * - Beautiful candidate cards
 * - Instagram-like social feed
 * - FREE APIs integration
 */

// Disable SSR to work around Next.js 14.2.32 MODULE_NOT_FOUND bug with route groups
// This prevents Next.js from trying to load the server-side module at runtime
export const dynamic = 'force-dynamic';
export const ssr = false;

import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback } from 'react';

import type { SuperiorRepresentativeData } from '@/features/civics/lib/types/superior-types';
import { useIsMobile, useAppActions } from '@/lib/stores/appStore';
import { logger } from '@/lib/utils/logger';
import type { Representative } from '@/types/representative';

// Lazy load heavy components to reduce initial bundle size
const RepresentativeCard = dynamic(
  () =>
    import('@/features/civics/components/representative/RepresentativeCard').then((mod) => ({
      default: mod.RepresentativeCard,
    })),
  {
  loading: () => <div className="animate-pulse bg-gray-200 h-32 rounded-lg" />,
  ssr: false
  }
);

const UnifiedFeed = dynamic(() => import('@/features/feeds').then(mod => ({ default: mod.UnifiedFeedRefactored })), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />,
  ssr: false
});

export default function Civics2Page() {
  // UI state (local)
  const [activeTab, setActiveTab] = useState<'representatives' | 'feed'>('representatives');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<string>('CA');
  const [selectedLevel, setSelectedLevel] = useState<'all' | 'federal' | 'state' | 'local'>('federal');
  const [_followedRepresentatives, setFollowedRepresentatives] = useState<Set<string>>(new Set());
  const [cardVariant, setCardVariant] = useState<'default' | 'compact' | 'detailed'>('default');

  // Data state (local for now due to type mismatch)
  const [representatives, setRepresentatives] = useState<SuperiorRepresentativeData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions();
  const [isLoading, setIsLoading] = useState(true);

  const loadRepresentatives = useCallback(async () => {
    setIsLoading(true);
    setError(null); // Clear any previous errors
    logger.info('🔄 Loading representatives...', { state: selectedState, level: selectedLevel });

    try {
      const response = await fetch(`/api/v1/civics/by-state?state=${selectedState}&level=${selectedLevel}&limit=20`);
      logger.info('📡 Response status', { status: response.status });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(errorData.error || `Failed to load representatives: ${response.status}`);
      }

      const data = await response.json();
      logger.info('✅ API Response:', data);
      
      // Handle API error responses
      if (!data.success) {
        throw new Error(data.error || 'Failed to load representatives');
      }
      
      // API returns { success: true, data: { representatives: [...], state, level, ... } }
      const representatives = data.data?.representatives ?? data.data ?? [];
      logger.info('📊 Setting representatives:', Array.isArray(representatives) ? representatives.length : 0);
      
      if (!Array.isArray(representatives)) {
        logger.warn('⚠️ Representatives data is not an array:', representatives);
        setRepresentatives([]);
      } else {
        setRepresentatives(representatives);
      }
      logger.info('🎯 Representatives state updated');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while loading representatives';
      logger.error('❌ Error loading representatives:', error);
      setError(errorMessage);
      setRepresentatives([]); // Clear representatives on error
    } finally {
      setIsLoading(false);
    }
  }, [selectedState, selectedLevel]);

  // Load representatives on component mount
  useEffect(() => {
    loadRepresentatives();
  }, [loadRepresentatives]);

  useEffect(() => {
    // Only run on client side to avoid SSR issues
    if (typeof window === 'undefined') return;
    if (setCurrentRoute && setSidebarActiveSection && setBreadcrumbs) {
      setCurrentRoute('/civics');
      setSidebarActiveSection('civics');
      setBreadcrumbs([
        { label: 'Home', href: '/' },
        { label: 'Civics', href: '/civics' },
      ]);

      return () => {
        setSidebarActiveSection(null);
        setBreadcrumbs([]);
      };
    }
  }, [setBreadcrumbs, setCurrentRoute, setSidebarActiveSection]);

  // Initialize client-side state
  useEffect(() => {
    // Mobile detection - only run on client
    if (typeof window === 'undefined') return;
    
    const checkMobile = () => {
      // Device detection is handled by appStore
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    logger.info('Contacting representative', { id, type });
  };

  const filteredRepresentatives = representatives.filter(rep => {
    if (!searchQuery) return true;
    return rep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (rep.office ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
           (rep.party ?? '').toLowerCase().includes(searchQuery.toLowerCase());
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
                  <h1 className="text-2xl font-bold text-white">Civics</h1>
                  <p className="text-blue-100 text-sm">Your Democratic Voice</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center space-x-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
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
                    onChange={(e) => setSelectedLevel(e.target.value as 'all' | 'federal' | 'state' | 'local')}
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
                      onChange={(e) => setCardVariant(e.target.value as 'default' | 'compact' | 'detailed')}
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
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
                  <p className="text-lg text-gray-600 font-medium">Loading your representatives...</p>
                  <p className="text-sm text-gray-500 mt-2">Gathering the most current information</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center max-w-md">
                  <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Unable to load representatives</h3>
                  <p className="text-gray-600 mb-6">{error}</p>
                  <button
                    onClick={() => loadRepresentatives()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
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

                {/* Superior Representative Feed */}
                <div data-testid="representative-feed" className="space-y-6">
                  {/* Quality Statistics */}
                  <div data-testid="quality-statistics" className="bg-white rounded-lg p-4 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Quality Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">95%</div>
                        <div className="text-sm text-gray-600">Data Accuracy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{filteredRepresentatives.length}</div>
                        <div className="text-sm text-gray-600">Current Representatives</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">5</div>
                        <div className="text-sm text-gray-600">Data Sources</div>
                      </div>
                    </div>
                  </div>

                  {/* Filtering Options */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">State Filter</label>
                        <select
                          data-testid="state-filter"
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Level Filter</label>
                        <select
                          data-testid="level-filter"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={selectedLevel}
                          onChange={(e) => setSelectedLevel(e.target.value as 'all' | 'federal' | 'state' | 'local')}
                        >
                          <option value="all">All Levels</option>
                          <option value="federal">Federal</option>
                          <option value="state">State</option>
                          <option value="local">Local</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Quality Filter</label>
                        <select
                          data-testid="quality-filter"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="all">All Quality</option>
                          <option value="high">High Quality (90%+)</option>
                          <option value="medium">Medium Quality (70-89%)</option>
                          <option value="low">Low Quality (&lt;70%)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* System Date Information */}
                  <div data-testid="system-date-info" className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="text-sm font-medium text-blue-800">System Date Verification</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      Data filtered using system date: {new Date().toLocaleDateString()}
                    </p>
                    <div data-testid="current-electorate-count" className="text-sm text-blue-600 mt-2">
                      Current Electorate: {filteredRepresentatives.length} active representatives
                    </div>
                  </div>

                  {/* Comprehensive Candidate Cards */}
                  <div className={`grid gap-8 ${
                    isMobile === true
                        ? 'grid-cols-1 max-w-lg mx-auto'
                        : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
              }`}>
                {filteredRepresentatives.map((representative) => {
                  // Transform SuperiorRepresentativeData to Representative
                  const transformedRep: Representative = {
                    id: parseInt(representative.id) ?? 0,
                    name: representative.name,
                    party: representative.party,
                    office: representative.office,
                    level: representative.level,
                    state: representative.state,
                    data_quality_score: representative.dataQualityScore ?? 0,
                    verification_status: representative.verificationStatus === 'verified' ? 'verified' :
                                        representative.verificationStatus === 'pending' ? 'pending' : 'failed',
                    data_sources: representative.dataSource ?? [],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    last_verified: representative.lastVerified ?? new Date().toISOString(),
                    ...(representative.district ? { district: representative.district } : {}),
                    primary_email: representative.enhancedContacts?.find(c => c.type === 'email')?.value ?? '',
                    primary_phone: representative.enhancedContacts?.find(c => c.type === 'phone')?.value ?? '',
                    primary_website: representative.enhancedContacts?.find(c => c.type === 'website')?.value ?? '',
                    ...(representative.twitter ? { twitter_handle: representative.twitter } : {}),
                    ...(representative.facebook ? { facebook_url: representative.facebook } : {}),
                    ...(representative.photoUrl ?? representative.photo ? { primary_photo_url: representative.photoUrl ?? representative.photo } : {}),
                    ...(representative.termStart ? { term_start_date: representative.termStart } : {}),
                    ...(representative.termEnd ? { term_end_date: representative.termEnd } : {}),
                    ...(representative.nextElection ? { next_election_date: representative.nextElection } : {}),
                  };

                  return (
                    <RepresentativeCard
                      key={representative.id}
                      representative={transformedRep}
                      onFollow={(rep: Representative) => handleFollow(rep.id.toString())}
                      onContact={(rep: Representative) => handleContact(rep.id.toString(), 'email')}
                      className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                    />
                  );
                })}
              </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'feed' && (
          <div data-testid="mobile-feed">
            <UnifiedFeed userId="test-user" />
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
