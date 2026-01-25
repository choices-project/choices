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

import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import type { SuperiorRepresentativeData } from '@/features/civics/lib/types/superior-types';

import { useIsMobile, useAppActions } from '@/lib/stores/appStore';
import { logger } from '@/lib/utils/logger';

import { useDebounce } from '@/hooks/useDebounce';

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

const CIVICS_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

export default function Civics2Page() {
  // UI state (local)
  const [activeTab, setActiveTab] = useState<'representatives' | 'feed'>('representatives');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedState, setSelectedState] = useState<string>('CA');
  const [selectedLevel, setSelectedLevel] = useState<'all' | 'federal' | 'state' | 'local'>('all');
  const [_followedRepresentatives, setFollowedRepresentatives] = useState<Set<string>>(new Set());
  const [cardVariant, setCardVariant] = useState<'default' | 'compact' | 'detailed'>('default');

  // Data state (local for now due to type mismatch)
  const [representatives, setRepresentatives] = useState<SuperiorRepresentativeData[]>([]);
  const isMobile = useIsMobile();
  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadRepresentatives = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    logger.info('🔄 Loading representatives...', { state: selectedState, level: selectedLevel });

    try {
      const params = new URLSearchParams({
        state: selectedState,
        limit: '20',
        include: 'photos,divisions',
        fields: [
          'id',
          'name',
          'office',
          'level',
          'state',
          'district',
          'party',
          'primary_email',
          'primary_phone',
          'primary_website',
          'primary_photo_url',
          'photos',
          'division_ids',
          'data_quality_score',
          'data_sources',
          'last_verified',
          'verification_status',
        ].join(','),
      });
      if (selectedLevel !== 'all') {
        params.set('level', selectedLevel);
      }
      const response = await fetch(`/api/representatives?${params.toString()}`);
      logger.info('📡 Response status', { status: response.status });

      if (!response.ok) {
        throw new Error(`Failed to load representatives: ${response.status}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        logger.error('Failed to parse API response', { 
          status: response.status,
          statusText: response.statusText,
          error: parseError 
        });
        throw new Error(`Invalid response from server: ${response.status}`);
      }
      
      // Enhanced error logging
      if (!data || !data.success) {
        logger.error('API returned error response', { 
          data, 
          status: response.status,
          statusText: response.statusText 
        });
        const errorMessage = data?.error || data?.message || `API error: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      const apiRepresentatives: Representative[] = Array.isArray(data?.data?.representatives)
        ? data.data.representatives
        : [];
      
      logger.info('📊 Received representatives from API', { 
        count: apiRepresentatives.length,
        hasData: data?.data != null,
        hasRepresentatives: Array.isArray(data?.data?.representatives)
      });
      
      const mapped = apiRepresentatives.map((rep) => {
        const photoUrl =
          rep.primary_photo_url ??
          rep.photos?.find((photo) => photo.is_primary)?.url ??
          rep.photos?.[0]?.url ??
          undefined;
        const enhancedContacts = [
          rep.primary_email
            ? {
                type: 'email',
                value: rep.primary_email,
                source: 'primary',
                isPrimary: true,
                isVerified: true,
              }
            : null,
          rep.primary_phone
            ? {
                type: 'phone',
                value: rep.primary_phone,
                source: 'primary',
                isPrimary: true,
                isVerified: true,
              }
            : null,
          rep.primary_website
            ? {
                type: 'website',
                value: rep.primary_website,
                source: 'primary',
                isPrimary: true,
                isVerified: true,
              }
            : null,
        ].filter(Boolean) as SuperiorRepresentativeData['enhancedContacts'];

        const verificationStatus: SuperiorRepresentativeData['verificationStatus'] =
          rep.verification_status === 'failed'
            ? 'unverified'
            : rep.verification_status ?? 'unverified';

        const mapped: SuperiorRepresentativeData = {
          id: String(rep.id),
          name: rep.name,
          office: rep.office,
          level: rep.level,
          state: rep.state,
          party: rep.party ?? 'Independent',
          dataQualityScore: rep.data_quality_score,
          dataSource: rep.data_sources ?? [],
          verificationStatus,
          metadata: {
            division_ids: rep.division_ids ?? [],
          },
        };

        if (enhancedContacts?.length) {
          mapped.enhancedContacts = enhancedContacts;
        }

        if (rep.district) {
          mapped.district = rep.district;
        }

        if (photoUrl) {
          mapped.photoUrl = photoUrl;
        }

        if (rep.last_verified) {
          mapped.lastVerified = rep.last_verified;
        }

        return mapped;
      });
      logger.info('📊 Setting representatives:', mapped.length);
      setRepresentatives(mapped);
      logger.info('🎯 Representatives state updated');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('❌ Error loading representatives:', { 
        error: errorMessage,
        state: selectedState,
        level: selectedLevel,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Provide more specific error messages
      if (errorMessage.includes('Failed to load representatives')) {
        setErrorMessage('We could not load representatives right now. Please try again.');
      } else if (errorMessage.includes('API error')) {
        setErrorMessage('Service temporarily unavailable. Please try again in a moment.');
      } else {
        setErrorMessage('We could not load representatives right now. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedState, selectedLevel]);

  // Load representatives on component mount
  useEffect(() => {
    loadRepresentatives();
  }, [loadRepresentatives]);

  useEffect(() => {
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
  }, [setBreadcrumbs, setCurrentRoute, setSidebarActiveSection]);

  // Initialize client-side state
  useEffect(() => {
    // Mobile detection
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
    if (!debouncedSearchQuery) return true;
    return rep.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
           (rep.office ?? '').toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
           (rep.party ?? '').toLowerCase().includes(debouncedSearchQuery.toLowerCase());
  });


  const selectedStateName = useMemo(() => {
    return CIVICS_STATES.find((state) => state.code === selectedState)?.name ?? selectedState;
  }, [selectedState]);


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3 text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium">{selectedStateName}</p>
                  <p className="text-xs text-blue-200">Your State</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Beautiful Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8" role="tablist" aria-label="Civics sections">
            <button
              onClick={() => setActiveTab('representatives')}
              data-testid="civics-tab-representatives"
              role="tab"
              aria-selected={activeTab === 'representatives'}
              aria-controls="civics-representatives-panel"
              className={`py-4 px-1 border-b-3 font-semibold text-sm transition-all duration-200 ${
                activeTab === 'representatives'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
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
              data-testid="civics-tab-feed"
              role="tab"
              aria-selected={activeTab === 'feed'}
              aria-controls="civics-feed-panel"
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
        <h2 className="sr-only">Civics content</h2>
        {activeTab === 'representatives' && (
          <div id="civics-representatives-panel" role="tabpanel" className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="sr-only" htmlFor="civics-search">
                    Search representatives
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      id="civics-search"
                      type="text"
                      placeholder="Search representatives..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="sm:w-32">
                  <label className="sr-only" htmlFor="civics-state-filter">
                    Filter by state
                  </label>
                  <select
                    id="civics-state-filter"
                    data-testid="state-filter"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                    value={selectedState}
                    onChange={(e) => {
                      setSelectedState(e.target.value);
                      setIsLoading(true);
                    }}
                    disabled={isLoading}
                  >
                    {CIVICS_STATES.map((state) => (
                      <option key={state.code} value={state.code}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:w-32">
                  <label className="sr-only" htmlFor="civics-level-filter">
                    Filter by level
                  </label>
                  <select
                    id="civics-level-filter"
                    data-testid="level-filter"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                    value={selectedLevel}
                    onChange={(e) => {
                      setSelectedLevel(e.target.value as 'all' | 'federal' | 'state' | 'local');
                      // Trigger reload when level changes
                    }}
                  >
                    <option value="all">All Levels</option>
                    <option value="federal">Federal</option>
                    <option value="state">State</option>
                    <option value="local">Local</option>
                  </select>
                </div>
                <div className="sm:w-32">
                  <label className="sr-only" htmlFor="civics-card-variant">
                    Card display density
                  </label>
                  <select
                    id="civics-card-variant"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
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
              <div className="flex items-center justify-center py-16" role="status" aria-live="polite" aria-busy="true">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mx-auto mb-4" />
                  <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">Loading your representatives...</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Gathering the most current information</p>
                </div>
              </div>
            ) : errorMessage ? (
              <div className="flex items-center justify-center py-12" role="alert" aria-live="assertive">
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-200 dark:border-red-800 p-6 max-w-lg text-center">
                  <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">We hit a snag</h2>
                  <p className="text-sm text-red-600 dark:text-red-400 mb-4">{errorMessage}</p>
                  <button
                    type="button"
                    onClick={() => void loadRepresentatives()}
                    className="bg-red-600 dark:bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : filteredRepresentatives.length === 0 ? (
              <div className="flex items-center justify-center py-16" role="status" aria-live="polite">
                <div className="text-center max-w-md">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 0 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm6 3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm-13.5 0a2 2 0 1 1-4.5 0 2 2 0 0 1 4.5 0Z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">No representatives found</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">Try adjusting your search criteria or check back later for updated information.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Clear search
                    </button>
                    <button
                      type="button"
                      onClick={() => void loadRepresentatives()}
                      className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Results Header */}
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Your {selectedStateName} Representatives
                  </h2>
                  <p className="text-gray-600">
                    Current elected officials serving your community
                  </p>
                </div>

                {/* Superior Representative Feed */}
                <div data-testid="representative-feed" className="space-y-6">

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
                    division_ids: representative.metadata?.division_ids ?? [],
                    ocdDivisionIds: representative.metadata?.division_ids ?? [],
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
                      className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700"
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
          <div id="civics-feed-panel" role="tabpanel" data-testid="mobile-feed">
            <UnifiedFeed userId="test-user" />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Powered by FREE APIs: Google Civic, OpenStates, Congress.gov, FEC, Wikipedia</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Data updated in real-time • Zero API costs • Open source</p>
          </div>
        </div>
      </div>
    </div>
  );
}
