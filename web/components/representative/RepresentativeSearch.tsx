/**
 * Representative Search Component
 * 
 * Search interface for finding representatives by name, location, or criteria
 * Includes location-based search and advanced filtering options
 * 
 * Created: October 28, 2025
 * Status: ✅ FOUNDATION
 */

import { Search, MapPin, Filter, X } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { RepresentativeSearchProps, RepresentativeSearchQuery } from '@/types/representative';

export function RepresentativeSearch({
  onSearch,
  onLocationSearch,
  loading = false,
  className = ''
}: RepresentativeSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [filters, setFilters] = useState<Partial<RepresentativeSearchQuery>>({
    state: '',
    party: '',
    office: '',
    level: undefined
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearch = () => {
    const query: RepresentativeSearchQuery = {
      query: searchQuery ?? undefined,
      ...filters
    };
    
    // Remove empty values
    Object.keys(query).forEach(key => {
      if (!query[key as keyof RepresentativeSearchQuery]) {
        delete query[key as keyof RepresentativeSearchQuery];
      }
    });
    
    onSearch(query);
  };

  const handleLocationSearch = () => {
    if (locationQuery.trim()) {
      onLocationSearch?.(locationQuery);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setLocationQuery('');
    setFilters({
      state: '',
      party: '',
      office: '',
      level: undefined
    });
  };

  const hasActiveFilters = searchQuery || locationQuery || Object.values(filters).some(value => value);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="w-5 h-5" />
          <span>Find Representatives</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Basic Search */}
        <div className="space-y-3">
          <div className="flex space-x-2">
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch}
              disabled={loading}
              className="px-6"
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {/* Location Search */}
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Enter your address..."
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
                className="pl-10"
              />
            </div>
            <Button 
              variant="outline"
              onClick={handleLocationSearch}
              disabled={loading || !locationQuery.trim()}
            >
              Find My Reps
            </Button>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-1"
          >
            <Filter className="w-4 h-4" />
            <span>Advanced Filters</span>
          </Button>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="flex items-center space-x-1 text-gray-500"
            >
              <X className="w-4 h-4" />
              <span>Clear All</span>
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-gray-200">
            {/* State Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <Select
                value={filters.state ?? ''}
                onValueChange={(value) => setFilters(prev => ({ ...prev, state: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All States</SelectItem>
                  <SelectItem value="CA">California</SelectItem>
                  <SelectItem value="NY">New York</SelectItem>
                  <SelectItem value="TX">Texas</SelectItem>
                  <SelectItem value="FL">Florida</SelectItem>
                  <SelectItem value="IL">Illinois</SelectItem>
                  {/* Add more states as needed */}
                </SelectContent>
              </Select>
            </div>

            {/* Party Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Party
              </label>
              <Select
                value={filters.party ?? ''}
                onValueChange={(value) => setFilters(prev => ({ ...prev, party: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Parties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Parties</SelectItem>
                  <SelectItem value="Democratic">Democratic</SelectItem>
                  <SelectItem value="Republican">Republican</SelectItem>
                  <SelectItem value="Independent">Independent</SelectItem>
                  <SelectItem value="Green">Green</SelectItem>
                  <SelectItem value="Libertarian">Libertarian</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Office Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Office
              </label>
              <Select
                value={filters.office ?? ''}
                onValueChange={(value) => setFilters(prev => ({ ...prev, office: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Offices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Offices</SelectItem>
                  <SelectItem value="Senator">Senator</SelectItem>
                  <SelectItem value="Representative">Representative</SelectItem>
                  <SelectItem value="Governor">Governor</SelectItem>
                  <SelectItem value="State Senator">State Senator</SelectItem>
                  <SelectItem value="State Representative">State Representative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Level Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level
              </label>
              <Select
                value={filters.level ?? ''}
                onValueChange={(value) => setFilters(prev => ({ ...prev, level: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Levels</SelectItem>
                  <SelectItem value="federal">Federal</SelectItem>
                  <SelectItem value="state">State</SelectItem>
                  <SelectItem value="local">Local</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Search Button for Advanced Filters */}
        {showAdvanced && (
          <div className="pt-3">
            <Button 
              onClick={handleSearch}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Searching...' : 'Apply Filters'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
