/**
 * Representatives Page
 *
 * Main representatives page with search, filtering, and display
 * Replaces the demo page with production-ready functionality
 *
 * Created: October 28, 2025
 * Status: ✅ PRODUCTION
 */

'use client';

import { MapPin, Users, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect } from 'react';

import { RepresentativeList  } from '@/features/civics/components/representative/RepresentativeList';
import { RepresentativeSearch } from '@/features/civics/components/representative/RepresentativeSearch';

import { BackToTop } from '@/components/shared/BackToTop';
import { EnhancedErrorDisplay } from '@/components/shared/EnhancedErrorDisplay';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { haptic } from '@/lib/haptics';
import {
  useRepresentativeSearchResults,
  useRepresentativeLoading,
  useRepresentativeError,
  useSearchRepresentatives,
  useFindByLocation,
  useLocationRepresentatives,
  useRepresentativeGlobalLoading,
  useRepresentativeFilters
} from '@/lib/stores/representativeStore';
import { logger } from '@/lib/utils/logger';

import { usePullToRefresh } from '@/hooks/usePullToRefresh';

import type { RepresentativeSearchQuery } from '@/types/representative';

export default function RepresentativesPage() {
  const router = useRouter();
  const searchResults = useRepresentativeSearchResults();
  const loading = useRepresentativeLoading();
  const error = useRepresentativeError();
  const allLoading = useRepresentativeGlobalLoading();
  const locationRepresentatives = useLocationRepresentatives();
  const searchRepresentatives = useSearchRepresentatives();
  const findByLocation = useFindByLocation();
  const { query: lastSearchQuery } = useRepresentativeFilters();
  const [hasAttemptedLocationLookup, setHasAttemptedLocationLookup] = React.useState(false);
  const errorMessage = React.useMemo(() => {
    if (!error) return '';
    if (typeof error === 'string') return error;
    if (typeof error === 'object' && 'message' in error) {
      return String((error as { message?: string }).message ?? '');
    }
    return '';
  }, [error]);

  // Load initial data
  useEffect(() => {
    void searchRepresentatives({ limit: 50 });
  }, [searchRepresentatives]);

  const handleSearch = React.useCallback(
    (query: RepresentativeSearchQuery) => {
      haptic('light');
      void searchRepresentatives(query);
    },
    [searchRepresentatives]
  );

  const handleLocationSearch = React.useCallback(
    (address: string) => {
      haptic('light');
      setHasAttemptedLocationLookup(true);
      void findByLocation({ address });
    },
    [findByLocation]
  );

  const handleLoadMore = React.useCallback(async () => {
    if (!searchResults?.data?.hasMore) return;
    haptic('light');
    const currentCount = searchResults?.data?.representatives?.length ?? 0;
    const limit = searchResults?.data?.limit ?? lastSearchQuery?.limit ?? 50;
    const baseQuery = lastSearchQuery ?? {};
    await searchRepresentatives({
      ...baseQuery,
      limit,
      offset: currentCount,
    });
  }, [lastSearchQuery, searchRepresentatives, searchResults]);

  const handleRepresentativeClick = (representative: any) => {
    logger.debug('Navigating to representative:', representative.name);
    router.push(`/representatives/${representative.id}`);
  };

  const handleRefresh = useCallback(async () => {
    await searchRepresentatives({ limit: 50 });
  }, [searchRepresentatives]);

  const { containerRef: pullToRefreshRef, indicator: pullToRefreshIndicator } = usePullToRefresh({
    onRefresh: handleRefresh,
    disabled: loading,
  });

  return (
    <div ref={pullToRefreshRef} className="container mx-auto px-4 py-8 max-w-7xl">
      {pullToRefreshIndicator}
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Find Your Representatives
        </h1>
        <h2 className="sr-only">Representative search and results</h2>
        <p className="text-muted-foreground">
          Search and connect with your federal, state, and local representatives.
        </p>
        <div className="mt-4 flex space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Users className="w-3 h-3" />
            <span>{searchResults?.data?.total ?? 0} Representatives</span>
          </Badge>
          <Badge variant="outline" className="flex items-center space-x-1">
            <MapPin className="w-3 h-3" />
            <span>All States</span>
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Search Sidebar - sticky on desktop */}
        <div className="lg:col-span-1 lg:sticky lg:top-4 lg:self-start">
          <RepresentativeSearch
            onSearch={handleSearch}
            onLocationSearch={handleLocationSearch}
            loading={loading || allLoading}
          />
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3">
          {error && (
            <EnhancedErrorDisplay
              title="Unable to load representatives"
              message={errorMessage || 'We could not load representatives right now.'}
              {...(errorMessage.includes('Security challenge') && {
                details: 'Please refresh the page and try again. If the issue persists, check your network or security settings.',
              })}
              canRetry
              onRetry={() => searchRepresentatives({ limit: 50 })}
              primaryAction={{ label: 'Retry', onClick: () => searchRepresentatives({ limit: 50 }) }}
              className="mb-6"
            />
          )}
          <Tabs defaultValue="search" className="w-full" onValueChange={() => haptic('light')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search" className="flex items-center space-x-2">
                <Search className="w-4 h-4" />
                <span>Search Results</span>
                {searchResults && (
                  <Badge variant="secondary" className="ml-1">
                    {searchResults?.data?.total}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="location" className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>My Representatives</span>
                <Badge variant="secondary" className="ml-1">
                  {locationRepresentatives.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Representatives</span>
                    {searchResults && (
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {searchResults?.data?.total} total
                        </Badge>
                        {searchResults?.data?.hasMore && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLoadMore}
                            disabled={loading}
                          >
                            Load More
                          </Button>
                        )}
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RepresentativeList
                    representatives={searchResults?.data?.representatives ?? []}
                    loading={loading}
                    {...(error && { error })}
                    onRetry={() => searchRepresentatives({ limit: 50 })}
                    onRepresentativeClick={handleRepresentativeClick}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="location" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Your Local Representatives</span>
                    <Badge variant="outline">
                      {locationRepresentatives.length} found
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {locationRepresentatives.length > 0 ? (
                    <RepresentativeList
                      representatives={locationRepresentatives}
                      loading={allLoading}
                      {...(error && { error })}
                      onRetry={() => searchRepresentatives({ limit: 50 })}
                      onRepresentativeClick={handleRepresentativeClick}
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 space-y-3">
                      <p>
                        {allLoading
                          ? 'Looking up representatives for your location...'
                          : hasAttemptedLocationLookup
                            ? 'No representatives found for that address.'
                            : 'Enter your address on the left to find local representatives.'}
                      </p>
                      {!allLoading && (
                        <Button variant="outline" size="sm" onClick={() => setHasAttemptedLocationLookup(false)}>
                          Clear location search
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <BackToTop />

      {/* Quick Stats */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Representative Database</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                {searchResults?.data?.total ?? 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Representatives</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {searchResults?.data?.representatives?.filter(r => r.data_quality_score >= 90).length ?? 0}
              </div>
              <div className="text-sm text-muted-foreground">High Quality Records</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {new Set(searchResults?.data?.representatives?.map(r => r.state) ?? []).size}
              </div>
              <div className="text-sm text-muted-foreground">States Covered</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {new Set(searchResults?.data?.representatives?.map(r => r.party) ?? []).size}
              </div>
              <div className="text-sm text-muted-foreground">Political Parties</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
