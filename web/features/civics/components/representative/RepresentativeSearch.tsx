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
import { useI18n } from '@/hooks/useI18n';
import type { RepresentativeSearchProps, RepresentativeSearchQuery } from '@/types/representative';

export function RepresentativeSearch({
  onSearch,
  onLocationSearch,
  loading = false,
  className = ''
}: RepresentativeSearchProps) {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [filters, setFilters] = useState<Partial<RepresentativeSearchQuery>>({
    state: '',
    party: '',
    office: ''
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
      office: ''
    });
  };

  const hasActiveFilters = searchQuery || locationQuery || Object.values(filters).some(value => value);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="w-5 h-5" />
          <span>{t('civics.representatives.search.title')}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Basic Search */}
        <div className="space-y-3">
          <div className="flex space-x-2">
            <Input
              placeholder={t('civics.representatives.search.inputs.query')}
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
              {loading
                ? t('civics.representatives.search.buttons.searching')
                : t('civics.representatives.search.buttons.search')}
            </Button>
          </div>

          {/* Location Search */}
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={t('civics.representatives.search.inputs.location')}
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
              {t('civics.representatives.search.buttons.find')}
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
            <span>{t('civics.representatives.search.advanced.toggle')}</span>
          </Button>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="flex items-center space-x-1 text-gray-500"
            >
              <X className="w-4 h-4" />
              <span>{t('civics.representatives.search.advanced.clearAll')}</span>
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-gray-200">
            {/* State Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('civics.representatives.search.advanced.state.label')}
              </label>
              <Select
                value={filters.state ?? ''}
                onValueChange={(value) => setFilters(prev => ({ ...prev, state: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('civics.representatives.search.advanced.state.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('civics.representatives.search.advanced.common.all')}</SelectItem>
                  <SelectItem value="CA">{t('civics.representatives.search.states.CA')}</SelectItem>
                  <SelectItem value="NY">{t('civics.representatives.search.states.NY')}</SelectItem>
                  <SelectItem value="TX">{t('civics.representatives.search.states.TX')}</SelectItem>
                  <SelectItem value="FL">{t('civics.representatives.search.states.FL')}</SelectItem>
                  <SelectItem value="IL">{t('civics.representatives.search.states.IL')}</SelectItem>
                  {/* Add more states as needed */}
                </SelectContent>
              </Select>
            </div>

            {/* Party Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('civics.representatives.search.advanced.party.label')}
              </label>
              <Select
                value={filters.party ?? ''}
                onValueChange={(value) => setFilters(prev => ({ ...prev, party: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('civics.representatives.search.advanced.party.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('civics.representatives.search.advanced.common.all')}</SelectItem>
                  <SelectItem value="Democratic">{t('civics.representatives.search.advanced.party.democratic')}</SelectItem>
                  <SelectItem value="Republican">{t('civics.representatives.search.advanced.party.republican')}</SelectItem>
                  <SelectItem value="Independent">{t('civics.representatives.search.advanced.party.independent')}</SelectItem>
                  <SelectItem value="Green">{t('civics.representatives.search.advanced.party.green')}</SelectItem>
                  <SelectItem value="Libertarian">{t('civics.representatives.search.advanced.party.libertarian')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Office Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('civics.representatives.search.advanced.office.label')}
              </label>
              <Select
                value={filters.office ?? ''}
                onValueChange={(value) => setFilters(prev => ({ ...prev, office: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('civics.representatives.search.advanced.office.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('civics.representatives.search.advanced.common.all')}</SelectItem>
                  <SelectItem value="Senator">{t('civics.representatives.search.advanced.office.senator')}</SelectItem>
                  <SelectItem value="Representative">{t('civics.representatives.search.advanced.office.representative')}</SelectItem>
                  <SelectItem value="Governor">{t('civics.representatives.search.advanced.office.governor')}</SelectItem>
                  <SelectItem value="State Senator">{t('civics.representatives.search.advanced.office.stateSenator')}</SelectItem>
                  <SelectItem value="State Representative">{t('civics.representatives.search.advanced.office.stateRepresentative')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Level Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('civics.representatives.search.advanced.level.label')}
              </label>
              <Select
                value={filters.level ?? ''}
                onValueChange={(value) => setFilters(prev => ({ ...prev, level: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('civics.representatives.search.advanced.level.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('civics.representatives.search.advanced.common.all')}</SelectItem>
                  <SelectItem value="federal">{t('civics.representatives.search.advanced.level.federal')}</SelectItem>
                  <SelectItem value="state">{t('civics.representatives.search.advanced.level.state')}</SelectItem>
                  <SelectItem value="local">{t('civics.representatives.search.advanced.level.local')}</SelectItem>
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
              {loading
                ? t('civics.representatives.search.buttons.searching')
                : t('civics.representatives.search.buttons.apply')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
