/**
 * Hashtag Input Component
 * 
 * Advanced hashtag input with smart suggestions, auto-complete, and validation
 * Supports custom hashtag creation and hashtag management
 * 
 * Created: December 19, 2024
 * Status: ✅ ACTIVE
 */

'use client';

import { X, Plus, Hash, TrendingUp, Users, Clock } from 'lucide-react';
import React, { useState, useRef, useEffect, useCallback } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { useHashtagSuggestions, useHashtagValidation, useCreateHashtag } from '../hooks/use-hashtags';
import { 
  useHashtagStore,
  useHashtagActions,
  useHashtagLoading,
  useHashtagError
} from '@/lib/stores/hashtagStore';
import type { HashtagInputProps, Hashtag, HashtagSuggestion } from '../types';

export default function HashtagInput({
  value = [],
  onChange,
  placeholder = "Add hashtags...",
  maxTags = 10,
  allowCustom = true,
  suggestions = [],
  onSuggestionSelect,
  validation: _validation,
  disabled = false,
  className
}: HashtagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Zustand store integration
  const { suggestions: hashtagSuggestions } = useHashtagStore();
  const { getSuggestions, createHashtag } = useHashtagActions();
  const { isLoading: isStoreLoading } = useHashtagLoading();
  const error = useHashtagError();
  
  // Get suggestions based on input using store
  const { data: suggestionData, isLoading: isSuggestionsLoading } = useHashtagSuggestions({
    input: inputValue,
    limit: 8,
    includePersonal: true,
    includeTrending: true
  });

  // Validate hashtag name
  const { data: validationData } = useHashtagValidation(inputValue, {
    enabled: inputValue.length >= 2
  });

  // Create hashtag mutation
  const createHashtagMutation = useCreateHashtag();

  // Combine store suggestions with hook suggestions
  const allSuggestions = hashtagSuggestions.length > 0 ? hashtagSuggestions : (suggestionData?.data || []);
  const isValidInput = validationData?.data?.is_valid || false;
  const hasValidationErrors = (validationData?.data?.errors?.length || 0) > 0;

  // Handle input changes with useEffect
  useEffect(() => {
    if (inputValue.length >= 2) {
      setIsOpen(true);
      setSelectedIndex(0);
      // Get suggestions from store
      getSuggestions(inputValue, 'input');
    } else {
      setIsOpen(false);
    }
  }, [inputValue, getSuggestions]);

  // Helper function to create hashtag objects
  const createHashtagObject = (name: string): Hashtag => ({
    id: `hashtag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    display_name: name,
    description: `User-created hashtag: ${name}`,
    category: 'custom' as const,
    usage_count: 0,
    follower_count: 0,
    is_trending: false,
    trend_score: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_verified: false,
    is_featured: false
  });

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback((suggestion: HashtagSuggestion) => {
    const hashtagName = suggestion.hashtag.name;
    
    if (!value.includes(hashtagName) && value.length < maxTags) {
      onChange([...value, hashtagName]);
      onSuggestionSelect?.(suggestion);
    }
    
    setInputValue('');
    setIsOpen(false);
    setSelectedIndex(0);
    inputRef.current?.focus();
  }, [value, maxTags, onChange, onSuggestionSelect]);

  // Handle adding hashtag
  const handleAddHashtag = useCallback(async (hashtagName: string) => {
    if (!hashtagName || value.includes(hashtagName) || value.length >= maxTags) {
      return;
    }

    // Check if hashtag exists
    const existingSuggestion = allSuggestions.find(s => s.hashtag.name === hashtagName);
    if (existingSuggestion) {
      handleSelectSuggestion(existingSuggestion);
      return;
    }

    // Create new hashtag if allowed
    if (allowCustom) {
      try {
        // Create hashtag using store action
        const result = await createHashtag(hashtagName, `User-created hashtag: ${hashtagName}`, 'custom');
        
        if (result) {
          onChange([...value, hashtagName]);
          setInputValue('');
          setIsOpen(false);
        }
      } catch (error) {
        console.error('Failed to create hashtag:', error);
      }
    }
  }, [value, maxTags, allSuggestions, allowCustom, createHashtag, onChange, handleSelectSuggestion]);

  // Handle removing hashtag
  const handleRemoveHashtag = useCallback((hashtagToRemove: string) => {
    onChange(value.filter(tag => tag !== hashtagToRemove));
  }, [value, onChange]);

  // Handle input blur
  const handleInputBlur = useCallback(() => {
    // Delay closing to allow for suggestion clicks
    setTimeout(() => {
      setIsOpen(false);
      setSelectedIndex(0);
    }, 200);
  }, []);

  // Handle container click
  const handleContainerClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setIsOpen(value.length >= 2);
    setSelectedIndex(0);
  }, []);

  // Handle key down
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || allSuggestions.length === 0) {
      if (e.key === 'Enter' && inputValue.trim()) {
        e.preventDefault();
        handleAddHashtag(inputValue.trim());
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, allSuggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (allSuggestions[selectedIndex]) {
          handleSelectSuggestion(allSuggestions[selectedIndex]);
        } else if (inputValue.trim()) {
          handleAddHashtag(inputValue.trim());
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(0);
        break;
    }
  }, [isOpen, selectedIndex, allSuggestions, inputValue, handleSelectSuggestion, handleAddHashtag]);

  // Get suggestion icon
  const getSuggestionIcon = (reason: string) => {
    switch (reason) {
      case 'trending':
        return <TrendingUp className="h-3 w-3" />;
      case 'popular':
        return <Users className="h-3 w-3" />;
      case 'recent':
        return <Clock className="h-3 w-3" />;
      default:
        return <Hash className="h-3 w-3" />;
    }
  };

  // Get suggestion color
  const getSuggestionColor = (reason: string) => {
    switch (reason) {
      case 'trending':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'popular':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'recent':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full",
        className
      )}
    >
      {/* Input Container */}
      <div
        className={cn(
          "min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          "flex flex-wrap items-center gap-1",
          disabled && "cursor-not-allowed opacity-50",
          hasValidationErrors && "border-destructive"
        )}
        onClick={handleContainerClick}
      >
        {/* Hashtag Tags */}
        {value.map((tag, index) => (
          <Badge
            key={`${tag}-${index}`}
            variant="secondary"
            className="flex items-center gap-1 px-2 py-1 text-xs"
          >
            <Hash className="h-3 w-3" />
            {tag}
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => handleRemoveHashtag(tag)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </Badge>
        ))}

        {/* Input Field */}
        {value.length < maxTags && (
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleInputBlur}
            placeholder={value.length === 0 ? placeholder : ""}
            disabled={disabled}
            className="flex-1 min-w-[120px] border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        )}

        {/* Add Button */}
        {value.length < maxTags && inputValue.trim() && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => handleAddHashtag(inputValue.trim())}
            disabled={disabled || !isValidInput || isStoreLoading}
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Suggestions Popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="hidden" />
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search hashtags..." value={inputValue} onValueChange={setInputValue} />
            <CommandList>
              {isSuggestionsLoading ? (
                <CommandEmpty>
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    <span className="ml-2 text-sm text-gray-600">Loading suggestions...</span>
                  </div>
                </CommandEmpty>
              ) : allSuggestions.length > 0 ? (
                <CommandGroup>
                  {allSuggestions.map((suggestion, index) => (
                    <CommandItem
                      key={suggestion.hashtag.id}
                      value={suggestion.hashtag.name}
                      onSelect={() => handleSelectSuggestion(suggestion)}
                      className={cn(
                        "flex items-center gap-2 cursor-pointer",
                        index === selectedIndex && "bg-accent text-accent-foreground"
                      )}
                    >
                      <div className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border",
                        getSuggestionColor(suggestion.reason)
                      )}>
                        {getSuggestionIcon(suggestion.reason)}
                        <span className="font-medium">{suggestion.reason}</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">#{suggestion.hashtag.name}</div>
                        {suggestion.hashtag.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {suggestion.hashtag.description}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {suggestion.hashtag.usage_count.toLocaleString()}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : (
                <CommandEmpty>No suggestions found</CommandEmpty>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Validation Messages */}
      {hasValidationErrors && (
        <div className="mt-1 text-xs text-destructive">
          {validationData?.data?.errors?.join(', ')}
        </div>
      )}

      {/* Helper Text */}
      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {value.length}/{maxTags} hashtags
        </span>
        {allowCustom && (
          <span>Press Enter to create custom hashtag</span>
        )}
      </div>
    </div>
  );
}
