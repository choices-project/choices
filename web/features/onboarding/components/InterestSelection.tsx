'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Save, RotateCcw } from 'lucide-react';

import type { InterestSelectionProps } from '../types';

/**
 * Interest Selection Component
 * 
 * Allows users to select their interests from a predefined list:
 * - Climate Change, Healthcare, Education, etc.
 * - Save and reset functionality
 * - Visual feedback for selections
 * 
 * Features:
 * - Predefined interest categories
 * - Multi-select functionality
 * - Save and reset options
 * - Responsive design
 * 
 * @param {InterestSelectionProps} props - Component props
 * @returns {JSX.Element} Interest selection interface
 */
const InterestSelection: React.FC<InterestSelectionProps> = ({ 
  initialInterests = [], 
  onSave,
  className = '' 
}) => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>(initialInterests);
  const [hasChanges, setHasChanges] = useState(false);

  const interests = [
    'Climate Change', 'Healthcare', 'Education', 'Economy', 'Immigration',
    'Criminal Justice', 'Voting Rights', 'Technology', 'Foreign Policy', 'Social Security',
    'Gun Control', 'Abortion Rights', 'LGBTQ+ Rights', 'Racial Justice', 'Infrastructure'
  ];

  const toggleInterest = (interest: string) => {
    const newInterests = selectedInterests.includes(interest)
      ? selectedInterests.filter(i => i !== interest)
      : [...selectedInterests, interest];
    
    setSelectedInterests(newInterests);
    setHasChanges(JSON.stringify(newInterests.sort()) !== JSON.stringify(initialInterests.sort()));
  };

  const handleSave = () => {
    onSave?.(selectedInterests);
    setHasChanges(false);
  };

  const handleReset = () => {
    setSelectedInterests(initialInterests);
    setHasChanges(false);
  };

  useEffect(() => {
    setSelectedInterests(initialInterests);
    setHasChanges(false);
  }, [initialInterests]);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Heart className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Your Interests</h3>
            <p className="text-sm text-gray-600">
              Select topics you&apos;d like to see polls about. You can change these anytime.
            </p>
          </div>
        </div>
        
        {hasChanges && (
          <div className="flex space-x-2">
            <button
              onClick={handleReset}
              className="flex items-center space-x-1 px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="text-sm">Reset</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-1 px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span className="text-sm">Save</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {interests.map((interest) => (
          <button
            key={interest}
            onClick={() => toggleInterest(interest)}
            className={`p-3 rounded-lg border-2 transition-all duration-200 ${
              selectedInterests.includes(interest)
                ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{interest}</span>
              {selectedInterests.includes(interest) && (
                <Heart className="h-4 w-4 text-purple-600 fill-current" />
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span>
            {selectedInterests.length} of {interests.length} selected
          </span>
          {selectedInterests.length > 0 && (
            <span className="text-purple-600 font-medium">
              {selectedInterests.length === interests.length ? 'All interests selected' : 'Custom selection'}
            </span>
          )}
        </div>
        
        {selectedInterests.length === 0 && (
          <span className="text-amber-600 font-medium">
            Select at least one interest for better content recommendations
          </span>
        )}
      </div>

      {selectedInterests.length > 0 && (
        <div className="mt-4 p-4 bg-purple-50 rounded-lg">
          <h4 className="font-semibold text-purple-900 mb-2">How this helps you:</h4>
          <ul className="text-purple-800 text-sm space-y-1">
            <li>• See polls about topics you care about</li>
            <li>• Get personalized content recommendations</li>
            <li>• Find representatives who share your interests</li>
            <li>• Track progress on issues that matter to you</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default InterestSelection;
