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
  Loader2,
  Search,
  Users,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import React, { Suspense, useMemo, useState, useEffect, useCallback } from 'react';

import type { SuperiorRepresentativeData } from '@/features/civics/lib/types/superior-types';

import { AnimatedCard } from '@/components/shared/AnimatedCard';
import { EnhancedEmptyState } from '@/components/shared/EnhancedEmptyState';
import { EnhancedErrorDisplay } from '@/components/shared/EnhancedErrorDisplay';
import { useLiveAnnouncer } from '@/components/shared/LiveAnnouncer';
import { RepresentativeCardSkeleton, RepresentativeListSkeleton } from '@/components/shared/Skeletons';

import { haptic } from '@/lib/haptics';
import { useIsMobile, useAppActions } from '@/lib/stores/appStore';
import { logger } from '@/lib/utils/logger';

import { useDebounce } from '@/hooks/useDebounce';
import { useUrlFilters } from '@/hooks/useUrlFilters';

import type { Representative } from '@/types/representative';

const CIVICS_URL_FILTER_DEFAULTS = {
  state: 'CA' as string,
  level: 'all' as string,
};

// Lazy load heavy components to reduce initial bundle size
const RepresentativeCard = dynamic(
  () =>
    import('@/features/civics/components/representative/RepresentativeCard').then((mod) => ({
      default: mod.RepresentativeCard,
    })),
  {
    loading: () => <RepresentativeCardSkeleton />,
    ssr: false,
  }
);

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

function CivicsPageContent() {
  const { announce } = useLiveAnnouncer();
  const prevIsLoadingRef = React.useRef(true);
  const urlFilters = useUrlFilters(CIVICS_URL_FILTER_DEFAULTS);
  const selectedState = urlFilters.filters.state ?? 'CA';
  const selectedLevel = (urlFilters.filters.level ?? 'all') as 'all' | 'federal' | 'state' | 'local';

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedZip, setSelectedZip] = useState<string>('');
  const debouncedCity = useDebounce(selectedCity, 400);
  const debouncedZip = useDebounce(selectedZip, 400);
  const [_followedRepresentatives, setFollowedRepresentatives] = useState<Set<string>>(new Set());
  const [cardVariant, setCardVariant] = useState<'default' | 'compact' | 'detailed'>('default');

  const PAGE_SIZE = 20;

  // Data state (local for now due to type mismatch)
  const [representatives, setRepresentatives] = useState<SuperiorRepresentativeData[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const isMobile = useIsMobile();
  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const representativesLengthRef = React.useRef(0);
  representativesLengthRef.current = representatives.length;

  const loadRepresentatives = useCallback(async (append: boolean) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setErrorMessage(null);
      setRepresentatives([]);
    }
    logger.info('🔄 Loading representatives...', {
      state: selectedState,
      level: selectedLevel,
      city: debouncedCity || undefined,
      zip: debouncedZip || undefined,
      append
    });

    try {
      const offset = append ? representativesLengthRef.current : 0;
      const params = new URLSearchParams({
        state: selectedState,
        limit: String(PAGE_SIZE),
        offset: String(offset),
        include: 'photos,divisions',
        fields: [
          'id',
          'name',
          'office',
          'level',
          'state',
          'district',
          'office_city',
          'office_zip',
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
      if (debouncedCity.trim()) {
        params.set('city', debouncedCity.trim());
      }
      if (debouncedZip.trim()) {
        params.set('zip', debouncedZip.trim().replace(/\D/g, '').slice(0, 5));
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
      const resTotal = typeof data?.data?.total === 'number' ? data.data.total : apiRepresentatives.length;
      const resHasMore = Boolean(data?.data?.hasMore);

      logger.info('📊 Received representatives from API', {
        count: apiRepresentatives.length,
        total: resTotal,
        hasMore: resHasMore,
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
        if (rep.office_city) {
          mapped.office_city = rep.office_city;
        }
        if (rep.office_zip) {
          mapped.office_zip = rep.office_zip;
        }

        if (photoUrl) {
          mapped.photoUrl = photoUrl;
        }

        if (rep.last_verified) {
          mapped.lastVerified = rep.last_verified;
        }

        return mapped;
      });

      setTotal(resTotal);
      setHasMore(resHasMore);
      if (append) {
        setRepresentatives((prev) => [...prev, ...mapped]);
      } else {
        setRepresentatives(mapped);
      }
      logger.info('📊 Representatives updated', { count: mapped.length, append, total: resTotal, hasMore: resHasMore });
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
      if (append) {
        setIsLoadingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [selectedState, selectedLevel, debouncedCity, debouncedZip]);

  // Load representatives on mount and when filters change
  useEffect(() => {
    loadRepresentatives(false);
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
        import('sonner').then(({ toast }) => toast.info('Unfollowed representative'));
      } else {
        newSet.add(id);
        import('sonner').then(({ toast }) => toast.success('Following representative'));
      }
      return newSet;
    });
    haptic('light');
  };

  const handleContact = (id: string, type: string) => {
    logger.info('Contacting representative', { id, type });
    import('sonner').then(({ toast }) => toast.info('Contact feature coming soon'));
  };

  // Filter representatives - API already filters by state/level/city/zip, so only filter by search query client-side
  const filteredRepresentatives = useMemo(() => {
    return representatives.filter(rep => {
      if (!debouncedSearchQuery) return true;
      const query = debouncedSearchQuery.toLowerCase();
      return rep.name.toLowerCase().includes(query) ||
             (rep.office ?? '').toLowerCase().includes(query) ||
             (rep.party ?? '').toLowerCase().includes(query) ||
             (rep.district ?? '').toLowerCase().includes(query) ||
             (rep.office_city ?? '').toLowerCase().includes(query);
    });
  }, [representatives, debouncedSearchQuery]);

  // Announce result count when filter/load completes
  useEffect(() => {
    const wasLoading = prevIsLoadingRef.current;
    prevIsLoadingRef.current = isLoading;
    if (wasLoading && !isLoading) {
      const count = filteredRepresentatives.length;
      announce(
        count === 0
          ? 'No representatives found'
          : `Showing ${count} of ${total} representatives`
      );
    }
  }, [isLoading, filteredRepresentatives.length, total, announce]);

  const selectedStateName = useMemo(() => {
    return CIVICS_STATES.find((state) => state.code === selectedState)?.name ?? selectedState;
  }, [selectedState]);


  return (
    <div className="min-h-screen bg-muted">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Civics</h1>
            <p className="text-muted-foreground">Your democratic voice &mdash; find and follow your representatives</p>
          </div>
          {selectedStateName && selectedState !== 'all' && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{selectedStateName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="sr-only">Representatives</h2>
        <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void loadRepresentatives(false);
                }}
                className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4"
              >
                <div className="flex-1">
                  <label className="sr-only" htmlFor="civics-search">
                    Search representatives
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      id="civics-search"
                      type="text"
                      placeholder="Search representatives..."
                      className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background focus:border-transparent"
                    value={selectedState}
                    onChange={(e) => {
                      const newState = e.target.value;
                      urlFilters.setFilter('state', newState);
                      setSelectedCity('');
                      setSelectedZip('');
                      setIsLoading(true);
                    }}
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
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background focus:border-transparent"
                    value={selectedLevel}
                    onChange={(e) => {
                      const newLevel = e.target.value as 'all' | 'federal' | 'state' | 'local';
                      urlFilters.setFilter('level', newLevel);
                      setIsLoading(true);
                    }}
                  >
                    <option value="all">All Levels</option>
                    <option value="federal">Federal</option>
                    <option value="state">State</option>
                    <option value="local">Local</option>
                  </select>
                </div>
                <div className="sm:w-36">
                  <label className="sr-only" htmlFor="civics-city-filter">
                    Filter by office city
                  </label>
                  <input
                    id="civics-city-filter"
                    type="text"
                    placeholder="City"
                    aria-label="Filter by office city"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background focus:border-transparent"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                  />
                </div>
                <div className="sm:w-28">
                  <label className="sr-only" htmlFor="civics-zip-filter">
                    Filter by ZIP
                  </label>
                  <input
                    id="civics-zip-filter"
                    type="text"
                    inputMode="numeric"
                    placeholder="ZIP"
                    aria-label="Filter by ZIP code"
                    maxLength={5}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background focus:border-transparent"
                    value={selectedZip}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 5);
                      setSelectedZip(v);
                    }}
                  />
                </div>
                <div className="sm:w-32">
                  <label className="sr-only" htmlFor="civics-card-variant">
                    Card display density
                  </label>
                  <select
                    id="civics-card-variant"
                    data-testid="civics-card-variant"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background focus:border-transparent"
                    value={cardVariant}
                    onChange={(e) => setCardVariant(e.target.value as 'default' | 'compact' | 'detailed')}
                  >
                    <option value="default">Default</option>
                    <option value="compact">Compact</option>
                    <option value="detailed">Detailed</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shrink-0 flex items-center gap-2"
                    data-testid="civics-search-button"
                  >
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    {isLoading ? 'Loading…' : 'Search'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCity('');
                      setSelectedZip('');
                    }}
                    className="px-4 py-2 rounded-lg border border-border text-foreground/80 font-medium hover:bg-muted disabled:opacity-60 transition-colors shrink-0"
                  >
                    Clear
                  </button>
                </div>
              </form>
            </div>

            {/* Representatives Grid */}
            {isLoading ? (
              <div className="py-8" role="status" aria-live="polite" aria-busy="true">
                <RepresentativeListSkeleton count={8} />
              </div>
            ) : errorMessage ? (
              <div className="flex items-center justify-center py-12">
                <EnhancedErrorDisplay
                  title="We hit a snag"
                  message={errorMessage}
                  canRetry
                  onRetry={() => void loadRepresentatives(false)}
                  primaryAction={{
                    label: 'Try again',
                    onClick: () => void loadRepresentatives(false),
                  }}
                />
              </div>
            ) : filteredRepresentatives.length === 0 ? (
              <EnhancedEmptyState
                icon={<Users className="h-12 w-12 text-primary" />}
                title="No representatives found"
                description="Try adjusting your search criteria or check back later for updated information."
                primaryAction={{
                  label: 'Try again',
                  onClick: () => void loadRepresentatives(false),
                }}
                secondaryAction={{
                  label: 'Clear search',
                  onClick: () => setSearchQuery(''),
                }}
              />
            ) : (
              <div className="space-y-8">
                {/* Results Header */}
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Your {selectedStateName} Representatives
                  </h2>
                  <p className="text-muted-foreground">
                    Current elected officials serving your community
                  </p>
                  {total > 0 && (
                    <p className="text-sm text-muted-foreground mt-1" role="status">
                      Showing {representatives.length} of {total} representatives
                    </p>
                  )}
                </div>

                {/* Superior Representative Feed */}
                <div data-testid="representative-feed" className="space-y-6">

                  {/* Comprehensive Candidate Cards */}
                  <div className={`grid gap-8 ${
                    isMobile === true
                        ? 'grid-cols-1 max-w-lg mx-auto'
                        : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
              }`}>
                {filteredRepresentatives.map((representative, index) => {
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
                    ...(representative.office_city ? { office_city: representative.office_city } : {}),
                    ...(representative.office_zip ? { office_zip: representative.office_zip } : {}),
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
                    <AnimatedCard key={representative.id} index={index}>
                      <RepresentativeCard
                        representative={transformedRep}
                        variant={cardVariant === 'default' ? 'default' : cardVariant}
                        onFollow={(rep: Representative) => handleFollow(rep.id.toString())}
                        onContact={(rep: Representative) => handleContact(rep.id.toString(), 'email')}
                        className="group bg-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-border"
                      />
                    </AnimatedCard>
                  );
                })}
              </div>

                  {/* Load more */}
                  {hasMore && !isLoading && (
                    <div className="flex justify-center pt-4">
                      <button
                        type="button"
                        onClick={() => void loadRepresentatives(true)}
                        disabled={isLoadingMore}
                        className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                        data-testid="civics-load-more"
                      >
                        {isLoadingMore ? 'Loading...' : 'Load more'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-card border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Powered by FREE APIs: Google Civic, OpenStates, Congress.gov, FEC, Wikipedia</p>
            <p className="text-xs text-muted-foreground mt-2">Data updated periodically from official sources • Open source</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CivicsPage() {
  return (
    <Suspense fallback={<RepresentativeListSkeleton count={8} />}>
      <CivicsPageContent />
    </Suspense>
  );
}
