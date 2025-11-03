'use client';

import { Hash, TrendingUp, X } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';


import { getHashtagSuggestions, validateHashtagName } from '../lib/hashtag-service';
import type { HashtagSuggestion } from '../types';

type HashtagInputProps = {
  value: string[];
  onChange: (hashtags: string[]) => void;
  placeholder?: string;
  maxHashtags?: number;
  showSuggestions?: boolean;
  className?: string;
  maxTags?: number;
  allowCustom?: boolean;
}

export function HashtagInput({
  value = [],
  onChange,
  placeholder = "Add hashtags...",
  maxHashtags = 10,
  showSuggestions = true,
  className = "",
  maxTags: _maxTags = 10,
  allowCustom: _allowCustom = true
}: HashtagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<HashtagSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounced search for suggestions
  useEffect(() => {
    if (!showSuggestions || inputValue.length < 2) {
      setSuggestions([]);
      setShowSuggestionsList(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const result = await getHashtagSuggestions(inputValue, undefined, 5);
        if (result.success && result.data) {
          setSuggestions(result.data);
          setShowSuggestionsList(true);
        }
      } catch (error) {
        console.error('Failed to fetch hashtag suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue, showSuggestions]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setValidationError(null);
    
    // Auto-format hashtag input
    if (newValue && !newValue.startsWith('#')) {
      setInputValue(`#${  newValue}`);
    }
  };

  // Handle hashtag validation and addition
  const handleAddHashtag = async (hashtagText: string) => {
    const normalizedHashtag = hashtagText.startsWith('#') 
      ? hashtagText.slice(1) 
      : hashtagText;

    if (!normalizedHashtag.trim()) return;

    // Validate hashtag
    const validation = await validateHashtagName(normalizedHashtag);
    if (!validation.success || !validation.data?.is_valid) {
      setValidationError(validation.data?.errors?.[0] || 'Invalid hashtag');
      return;
    }

    // Check if already exists
    if (value.includes(normalizedHashtag)) {
      setValidationError('Hashtag already added');
      return;
    }

    // Check max hashtags
    if (value.length >= maxHashtags) {
      setValidationError(`Maximum ${maxHashtags} hashtags allowed`);
      return;
    }

    // Add hashtag
    const newHashtags = [...value, normalizedHashtag];
    onChange(newHashtags);
    setInputValue('');
    setShowSuggestionsList(false);
    setValidationError(null);
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: HashtagSuggestion) => {
    handleAddHashtag(suggestion.hashtag.name);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0 && suggestions[0]) {
        handleSuggestionClick(suggestions[0]);
      } else {
        handleAddHashtag(inputValue);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestionsList(false);
    }
  };

  // Remove hashtag
  const handleRemoveHashtag = (hashtagToRemove: string) => {
    const newHashtags = value.filter(hashtag => hashtag !== hashtagToRemove);
    onChange(newHashtags);
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestionsList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Input Field */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Hash className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onFocus={() => setShowSuggestionsList(true)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={value.length >= maxHashtags}
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
          </div>
        )}
      </div>

      {/* Validation Error */}
      {validationError && (
        <p className="mt-1 text-sm text-red-600">{validationError}</p>
      )}

      {/* Hashtag Tags */}
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {value.map((hashtag) => (
            <span
              key={hashtag}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
            >
              #{hashtag}
              <button
                onClick={() => handleRemoveHashtag(hashtag)}
                className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestionsList && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none"
        >
          {suggestions.map((suggestion, _index) => (
            <div
              key={suggestion.hashtag.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100"
            >
              <div className="flex items-center">
                <Hash className="h-4 w-4 text-gray-400 mr-2" />
                <span className="font-medium text-gray-900">
                  {suggestion.hashtag.name}
                </span>
                {suggestion.hashtag.is_trending && (
                  <TrendingUp className="h-4 w-4 text-orange-500 ml-2" />
                )}
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-gray-500">
                  {suggestion.reason} • {suggestion.hashtag.usage_count} uses
                </span>
                <span className="text-xs text-gray-400">
                  {Math.round((suggestion.confidence_score || 0) * 100)}% match
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Helper Text */}
      <p className="mt-1 text-sm text-gray-500">
        {value.length}/{maxHashtags} hashtags • Press Enter to add
      </p>
    </div>
  );
}
