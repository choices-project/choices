'use client';

import React, { useState } from 'react';
import { 
  CheckCircle,
  ArrowRight,
  TrendingUp
} from 'lucide-react';


type InterestSelectionStepProps = {
  onNext: () => void;
  onBack: () => void;
}

export default function InterestSelectionStep({ onNext, onBack }: InterestSelectionStepProps) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState('');
  const [trendingInterests, setTrendingInterests] = useState<string[]>([]);
  const [recentInterests, setRecentInterests] = useState<string[]>([]);

  // Core interests that make logistic sense for demographics
  const coreInterests = [
    'drag-race', 'sports', 'movies', 'music', 'gaming', 'cooking', 'fitness', 'travel',
    'local-business', 'community-events', 'education', 'healthcare', 'environment',
    'jobs', 'housing', 'transportation', 'safety', 'seniors', 'families'
  ];

  // Mock trending interests (in real app, this would come from API)
  const mockTrendingInterests = [
    'rupauls-drag-race', 'oscars-2024', 'super-bowl', 'taylor-swift', 'barbie-movie',
    'local-farmers-market', 'community-garden', 'small-business-saturday', 'mental-health-awareness',
    'climate-action', 'affordable-housing', 'public-transit', 'neighborhood-watch'
  ];

  // Mock recent interests (in real app, this would come from user's recent activity)
  const mockRecentInterests = [
    'drag-race', 'local-events', 'fitness', 'cooking'
  ];

  const handleInterestToggle = (interestId: string) => {
    setSelectedInterests(prev => 
      prev.includes(interestId) 
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleAddCustomInterest = () => {
    const interest = customInterest.trim().toLowerCase().replace(/\s+/g, '-');
    if (interest && !selectedInterests.includes(interest)) {
      setSelectedInterests(prev => [...prev, interest]);
      setCustomInterest('');
      
      // Track this interest for trending (in real app, send to API)
      console.log('New interest added:', interest);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomInterest();
    }
  };

  const removeInterest = (interestId: string) => {
    setSelectedInterests(prev => prev.filter(id => id !== interestId));
  };



  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          What Interests You?
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Add hashtag-style interests to personalize your feed. 
          <strong> Add as many as you want!</strong> We'll track what's trending.
        </p>
      </div>

      {/* Selected Interests */}
      {selectedInterests.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Interests</h3>
          <div className="flex flex-wrap gap-2">
            {selectedInterests.map(interest => (
              <div
                key={interest}
                className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium"
              >
                <span>#{interest}</span>
                <button
                  onClick={() => removeInterest(interest)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Custom Interest */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Your Own Interest</h3>
        <div className="flex space-x-3">
          <input
            type="text"
            value={customInterest}
            onChange={(e) => setCustomInterest(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., 'crypto', 'vegan-cooking', 'local-music'"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleAddCustomInterest}
            disabled={!customInterest.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Use hashtag-style names (e.g., 'drag-race', 'local-business', 'mental-health')
        </p>
      </div>

      {/* Core Interests */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Categories</h3>
        <div className="flex flex-wrap gap-2">
          {coreInterests.map(interest => (
            <button
              key={interest}
              onClick={() => handleInterestToggle(interest)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedInterests.includes(interest)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              #{interest}
            </button>
          ))}
        </div>
      </div>

      {/* Trending Interests */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-orange-500" />
          Trending Now
        </h3>
        <div className="flex flex-wrap gap-2">
          {mockTrendingInterests.map(interest => (
            <button
              key={interest}
              onClick={() => handleInterestToggle(interest)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedInterests.includes(interest)
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
              }`}
            >
              #{interest}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      {selectedInterests.length > 0 && (
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <h4 className="font-semibold text-green-900 mb-1">
                Awesome! You've added {selectedInterests.length} interests
              </h4>
              <p className="text-sm text-green-800">
                We'll personalize your feed and track what's trending. 
                <strong> You're helping us discover viral content!</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            {selectedInterests.length} interests selected
          </span>
          <button
            onClick={onNext}
            disabled={selectedInterests.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
