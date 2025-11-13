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
import React, { useEffect } from 'react';

import { RepresentativeList  } from '@/features/civics/components/representative/RepresentativeList';
import { RepresentativeSearch } from '@/features/civics/components/representative/RepresentativeSearch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useRepresentativeSearchResults,
  useRepresentativeLoading,
  useRepresentativeError,
  useSearchRepresentatives,
  useFindByLocation,
  useLocationRepresentatives,
  useRepresentativeGlobalLoading
} from '@/lib/stores/representativeStore';
import { logger } from '@/lib/utils/logger';
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

  // Load initial data
  useEffect(() => {
    void searchRepresentatives({ limit: 50 });
  }, [searchRepresentatives]);

  const handleSearch = React.useCallback(
    (query: RepresentativeSearchQuery) => {
      void searchRepresentatives(query);
    },
    [searchRepresentatives]
  );

  const handleLocationSearch = React.useCallback(
    (address: string) => {
      void findByLocation({ address });
    },
    [findByLocation]
  );

  const handleRepresentativeClick = (representative: any) => {
    logger.debug('Navigating to representative:', representative.name);
    router.push(`/representatives/${representative.id}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Find Your Representatives
        </h1>
        <p className="text-gray-600">
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
        {/* Search Sidebar */}
        <div className="lg:col-span-1">
          <RepresentativeSearch
            onSearch={handleSearch}
            onLocationSearch={handleLocationSearch}
            loading={loading || allLoading}
          />
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="search" className="w-full">
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
                          <Button variant="outline" size="sm">
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
                      onRepresentativeClick={handleRepresentativeClick}
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {allLoading
                        ? 'Looking up representatives for your location...'
                        : 'Location-based representatives not available'}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Quick Stats */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Representative Database</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {searchResults?.data?.total ?? 0}
              </div>
              <div className="text-sm text-gray-600">Total Representatives</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {searchResults?.data?.representatives?.filter(r => r.data_quality_score >= 90).length ?? 0}
              </div>
              <div className="text-sm text-gray-600">High Quality Records</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {new Set(searchResults?.data?.representatives?.map(r => r.state) ?? []).size}
              </div>
              <div className="text-sm text-gray-600">States Covered</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {new Set(searchResults?.data?.representatives?.map(r => r.party) ?? []).size}
              </div>
              <div className="text-sm text-gray-600">Political Parties</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
