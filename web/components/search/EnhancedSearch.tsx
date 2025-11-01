/**
 * Enhanced Search Component
 * 
 * Advanced search interface with multiple filters and suggestions
 * Includes party, office, state, and committee filtering
 * 
 * Created: October 28, 2025
 * Status: ✅ FOUNDATION
 */

import { Search, Filter, X, Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { RepresentativeSearchQuery } from '@/types/representative';

export type EnhancedSearchProps = {
  onSearch: (query: RepresentativeSearchQuery) => void;
  loading?: boolean;
  className?: string;
}

const PARTIES = [
  'Democratic',
  'Republican', 
  'Independent',
  'Green',
  'Libertarian'
];

const OFFICES = [
  'Representative',
  'Senator',
  'Governor',
  'Lieutenant Governor',
  'Attorney General',
  'Secretary of State',
  'Treasurer',
  'Auditor',
  'Mayor',
  'City Council Member',
  'County Commissioner',
  'School Board Member'
];

const STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC'
];

const LEVELS = [
  { value: 'federal', label: 'Federal' },
  { value: 'state', label: 'State' },
  { value: 'local', label: 'Local' }
];

export function EnhancedSearch({ onSearch, loading = false, className = '' }: EnhancedSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [partyFilter, setPartyFilter] = useState('');
  const [officeFilter, setOfficeFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Update active filters when filters change
  useEffect(() => {
    const filters = [];
    if (partyFilter) filters.push(`Party: ${partyFilter}`);
    if (officeFilter) filters.push(`Office: ${officeFilter}`);
    if (stateFilter) filters.push(`State: ${stateFilter}`);
    if (levelFilter) filters.push(`Level: ${levelFilter}`);
    setActiveFilters(filters);
  }, [partyFilter, officeFilter, stateFilter, levelFilter]);

  const handleSearch = () => {
    const query: RepresentativeSearchQuery = {
      query: searchQuery || undefined,
      party: partyFilter || undefined,
      office: officeFilter || undefined,
      state: stateFilter || undefined,
      level: levelFilter as 'federal' | 'state' | 'local' | undefined,
    };

    // Remove undefined values
    const cleanQuery = Object.fromEntries(
      Object.entries(query).filter(([_, value]) => value !== undefined)
    ) as RepresentativeSearchQuery;

    onSearch(cleanQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setPartyFilter('');
    setOfficeFilter('');
    setStateFilter('');
    setLevelFilter('');
  };

  const removeFilter = (filterToRemove: string) => {
    if (filterToRemove.startsWith('Party:')) {
      setPartyFilter('');
    } else if (filterToRemove.startsWith('Office:')) {
      setOfficeFilter('');
    } else if (filterToRemove.startsWith('State:')) {
      setStateFilter('');
    } else if (filterToRemove.startsWith('Level:')) {
      setLevelFilter('');
    }
  };

  const hasActiveFilters = activeFilters.length > 0 || searchQuery.trim() !== '';

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search Representatives
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="space-y-2">
          <label htmlFor="search" className="text-sm font-medium">
            Search by name
          </label>
          <div className="flex gap-2">
            <Input
              id="search"
              type="text"
              placeholder="e.g., Nancy Pelosi, Alexandria Ocasio-Cortez"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={loading || !hasActiveFilters}
              className="px-6"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {showAdvancedFilters ? 'Hide' : 'Show'} Filters
          </Button>
          
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Active Filters:</label>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <Badge
                  key={filter}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {filter}
                  <button
                    onClick={() => removeFilter(filter)}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            {/* Party Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Party</label>
              <Select value={partyFilter} onValueChange={setPartyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Any party" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any party</SelectItem>
                  {PARTIES.map((party) => (
                    <SelectItem key={party} value={party}>
                      {party}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Office Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Office</label>
              <Select value={officeFilter} onValueChange={setOfficeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Any office" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any office</SelectItem>
                  {OFFICES.map((office) => (
                    <SelectItem key={office} value={office}>
                      {office}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* State Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">State</label>
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Any state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any state</SelectItem>
                  {STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Level Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Level</label>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Any level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any level</SelectItem>
                  {LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Search Tips */}
        <div className="text-xs text-gray-500 space-y-1">
          <div><strong>Search Tips:</strong></div>
          <div>• Use partial names for broader results</div>
          <div>• Combine filters for more specific searches</div>
          <div>• Try searching by last name only</div>
        </div>
      </CardContent>
    </Card>
  );
}


