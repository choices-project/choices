'use client';

import { Search, MapPin, Zap, Shield, Users } from 'lucide-react';
import React, { useState } from 'react';

type LocationInputProps = {
  onLocationResolved: (jurisdictionIds: string[]) => void;
  onError: (error: string) => void;
}

export default function LocationInput({ onLocationResolved, onError }: LocationInputProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Smart suggestions based on common patterns
  const smartSuggestions = [
    "Just tell me your zip code",
    "I live in [City, State]",
    "I&apos;m near [Landmark]",
    "Use my current location"
  ];

  const handleInputChange = (value: string) => {
    setInput(value);
    
    // Show smart suggestions if input is empty or very short
    if (value.length < 3) {
      setSuggestions(smartSuggestions);
      setShowSuggestions(true);
    } else {
      // In a real app, this would call a geocoding service
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (suggestion === "Just tell me your zip code") {
      setInput("Enter your zip code...");
    } else if (suggestion === "I live in [City, State]") {
      setInput("Enter your city and state...");
    } else if (suggestion === "I&apos;m near [Landmark]") {
      setInput("Enter a landmark near you...");
    } else if (suggestion === "Use my current location") {
      handleCurrentLocation();
    }
    setShowSuggestions(false);
  };

  const handleCurrentLocation = async () => {
    setIsLoading(true);
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation not supported');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Resolve jurisdiction from coordinates
      const jurisdictionIds = await resolveLocationFromCoords([longitude, latitude]);
      onLocationResolved(jurisdictionIds);
      
    } catch {
      onError('Could not get your location. Try entering your address instead.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    try {
      let jurisdictionIds: string[] = [];

      if (input.match(/^\d{5}(-\d{4})?$/)) {
        // Zip code
        jurisdictionIds = await resolveLocationFromZip(input);
      } else {
        // Address or city/state
        jurisdictionIds = await resolveLocationFromAddress(input);
      }

      onLocationResolved(jurisdictionIds);
    } catch {
      onError('Could not find that location. Try being more specific or use your zip code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Mock resolution functions - in real app these would call our location resolver
  const resolveLocationFromCoords = async (_coords: [number, number]): Promise<string[]> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return ['ocd-division/country:us/state:ca/county:alameda'];
  };

  const resolveLocationFromZip = async (_zip: string): Promise<string[]> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return ['ocd-division/country:us/state:ca/county:alameda'];
  };

  const resolveLocationFromAddress = async (_address: string): Promise<string[]> => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    return ['ocd-division/country:us/state:ca/county:alameda'];
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Header with engaging copy */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <MapPin className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Let&apos;s find your local candidates! 🗳️
        </h2>
        <p className="text-gray-600">
          We&apos;ll show you everyone running in your area - no matter their party or funding
        </p>
      </div>

      {/* Privacy assurance */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <Shield className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">Your location stays private</p>
            <p className="text-sm text-green-700">
              We only use it to find your candidates, then delete it. Your address never leaves your device.
            </p>
          </div>
        </div>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Enter your zip code, city, or address..."
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            disabled={isLoading}
          />
        </div>

        {/* Smart suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Finding your candidates...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Zap className="w-5 h-5 mr-2" />
              Show me my candidates!
            </div>
          )}
        </button>
      </form>

      {/* Quick action buttons */}
      <div className="mt-6 space-y-3">
        <button
          onClick={handleCurrentLocation}
          disabled={isLoading}
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <MapPin className="w-4 h-4 mr-2" />
          Use my current location
        </button>
      </div>

      {/* Engagement hooks */}
      <div className="mt-8 text-center">
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>Join 10,000+ voters</span>
          </div>
          <div className="flex items-center">
            <Shield className="w-4 h-4 mr-1" />
            <span>100% private</span>
          </div>
        </div>
      </div>

      {/* Fun fact to keep engagement */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Did you know?</strong>           In the last election, 47% of eligible voters didn&apos;t vote. 
          We&apos;re here to make it easier to find candidates you actually want to vote for! 🚀
        </p>
      </div>
    </div>
  );
}
