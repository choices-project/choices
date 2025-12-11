/**
 * Location Search Component
 * 
 * Provides geographic search functionality for finding representatives by location
 * Integrates with the location service for geocoding and representative discovery
 * 
 * Created: October 28, 2025
 * Status: ✅ FOUNDATION
 */

import { MapPin, Search, Loader2, AlertCircle, Users } from 'lucide-react';
import React, { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { locationService, type LocationQuery, type RepresentativesByLocation } from '@/lib/services/location-service';
import logger from '@/lib/utils/logger';

export type LocationSearchProps = {
  onLocationFound?: (result: RepresentativesByLocation) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function LocationSearch({ 
  onLocationFound, 
  onError, 
  className = '' 
}: LocationSearchProps) {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RepresentativesByLocation | null>(null);

  const handleSearch = async () => {
    if (!address.trim()) {
      setError('Please enter an address');
      return;
    }

    if (!locationService.validateAddress(address)) {
      setError('Please enter a valid address with street number and name');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      logger.info('🔍 LocationSearch: Searching for representatives at:', address);
      
      const query: LocationQuery = {
        address: address.trim(),
        radius: 10 // 10 mile radius
      };

      const locationResult = await locationService.findRepresentativesByLocation(query);
      
      if (locationResult) {
        setResult(locationResult);
        onLocationFound?.(locationResult);
        logger.info('✅ LocationSearch: Found representatives:', locationResult);
      } else {
        setError('No representatives found for this location');
        onError?.('No representatives found for this location');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to find representatives for this location';
      setError(errorMessage);
      onError?.(errorMessage);
      logger.error('❌ LocationSearch: Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearResults = () => {
    setResult(null);
    setError(null);
    setAddress('');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Find Representatives by Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="address" className="text-sm font-medium">
              Enter your address
            </label>
            <div className="flex gap-2">
              <Input
                id="address"
                type="text"
                placeholder="e.g., 123 Main St, San Francisco, CA"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="flex-1"
              />
              <Button 
                onClick={handleSearch} 
                disabled={loading || !address.trim()}
                className="px-6"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Enter your full address to find your federal, state, and local representatives
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Your Representatives
              </span>
              <Button variant="outline" size="sm" onClick={clearResults}>
                Clear Results
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <strong>Location:</strong> {locationService.formatAddress(result.location)}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-blue-600">Federal ({result.federal.length})</h3>
                  {result.federal.length > 0 ? (
                    <div className="space-y-1">
                      {result.federal.map((rep) => (
                        <div key={rep.id} className="text-sm p-2 bg-blue-50 rounded">
                          <div className="font-medium">{rep.name}</div>
                          <div className="text-gray-600">{rep.office} - {rep.party}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No federal representatives found</p>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-green-600">State ({result.state.length})</h3>
                  {result.state.length > 0 ? (
                    <div className="space-y-1">
                      {result.state.map((rep) => (
                        <div key={rep.id} className="text-sm p-2 bg-green-50 rounded">
                          <div className="font-medium">{rep.name}</div>
                          <div className="text-gray-600">{rep.office} - {rep.party}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No state representatives found</p>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-purple-600">Local ({result.local.length})</h3>
                  {result.local.length > 0 ? (
                    <div className="space-y-1">
                      {result.local.map((rep) => (
                        <div key={rep.id} className="text-sm p-2 bg-purple-50 rounded">
                          <div className="font-medium">{rep.name}</div>
                          <div className="text-gray-600">{rep.office} - {rep.party}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No local representatives found</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


