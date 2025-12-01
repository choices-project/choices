'use client';

import { Hash, TrendingUp, Users, Search, BarChart3, Settings } from 'lucide-react';
import React, { useState } from 'react';

import logger from '@/lib/utils/logger';

import { HashtagAnalytics } from '../components/HashtagAnalytics';
import { HashtagDisplay, TrendingHashtagDisplay } from '../components/HashtagDisplay';
import { HashtagInput } from '../components/HashtagInput';
import { useHashtags, useHashtagSearch } from '../hooks/useHashtags';
import type { Hashtag } from '../types';

export default function HashtagIntegrationPage() {
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'input' | 'display' | 'trending' | 'analytics'>('input');
  
  const {
    hashtags,
    trendingHashtags,
    userHashtags,
    isLoading,
    error: hashtagError,
    hasError,
    followHashtagAction,
    unfollowHashtagAction,
    isFollowingHashtag: _isFollowingHashtag,
    refresh
  } = useHashtags({ autoLoad: true, refreshInterval: 30000 });

  const {
    query,
    setQuery,
    results,
    suggestions,
    isLoading: isSearchLoading,
    error: searchError,
    clearError: clearSearchError,
  } = useHashtagSearch({ debounceMs: 300, minQueryLength: 2 });

  const errorMessage = hashtagError ?? searchError ?? null;
  const showErrorBanner = (hasError || Boolean(searchError)) && errorMessage;

  const handleHashtagClick = (hashtag: Hashtag) => {
    logger.info('Hashtag clicked:', hashtag);
    // You can implement navigation or other actions here
  };

  const handleFollowHashtag = async (hashtagId: string) => {
    const success = await followHashtagAction(hashtagId);
    if (success) {
      logger.info('Successfully followed hashtag');
      refresh(); // Refresh the list after following
    }
  };

  const handleUnfollowHashtag = async (hashtagId: string) => {
    const success = await unfollowHashtagAction(hashtagId);
    if (success) {
      logger.info('Successfully unfollowed hashtag');
    }
  };

  const tabs = [
    { id: 'input', label: 'Input', icon: Hash },
    { id: 'display', label: 'Display', icon: Users },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Hash className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Hashtag Integration</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={refresh}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Refresh
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {showErrorBanner && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  {errorMessage}
                </div>
                <button
                  type="button"
                  className="mt-3 inline-flex items-center rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  onClick={() => {
                    if (searchError) {
                      clearSearchError();
                    }
                    refresh();
                  }}
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'input' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Hashtag Input Component</h2>
              <p className="text-gray-600 mb-6">
                Add hashtags with intelligent suggestions and validation.
              </p>
              <HashtagInput
                value={selectedHashtags}
                onChange={setSelectedHashtags}
                placeholder="Start typing to add hashtags..."
                maxHashtags={10}
                showSuggestions={true}
                className="max-w-2xl"
              />
              {selectedHashtags.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Hashtags:</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedHashtags.map((hashtag) => (
                      <span
                        key={hashtag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        #{hashtag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Hashtags</h2>
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search hashtags..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {isSearchLoading && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto" />
                  </div>
                )}

                {results && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Search Results ({results.total_count} found)
                    </h3>
                    <HashtagDisplay
                      hashtags={results.hashtags}
                      showStats={true}
                      onHashtagClick={handleHashtagClick}
                      onFollow={async (hashtag) => await handleFollowHashtag(hashtag.id)}
                    />
                  </div>
                )}

                {suggestions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Suggestions</h3>
                    <div className="space-y-2">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion.hashtag.id}
                          type="button"
                          onClick={() => handleHashtagClick(suggestion.hashtag)}
                          className="w-full text-left flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                        >
                          <div className="flex items-center space-x-3">
                            <Hash className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">#{suggestion.hashtag.name}</span>
                            <span className="text-sm text-gray-500">{suggestion.reason}</span>
                          </div>
                          <span className="text-sm text-gray-400">
                            {Math.round((suggestion.confidence_score ?? 0) * 100)}% match
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'display' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Hashtag Display</h2>
              <p className="text-gray-600 mb-6">
                Display hashtags with stats and interactive features.
              </p>
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-20 bg-gray-200 rounded" />
                  <div className="h-20 bg-gray-200 rounded" />
                  <div className="h-20 bg-gray-200 rounded" />
                </div>
              ) : (
                <HashtagDisplay
                  hashtags={hashtags}
                  showStats={true}
                  onHashtagClick={handleHashtagClick}
                />
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Followed Hashtags</h2>
              <p className="text-gray-600 mb-6">
                Hashtags you&apos;re currently following.
              </p>
              {userHashtags.length > 0 ? (
                <div className="space-y-4">
                  {userHashtags.map((userHashtag) => (
                    <div
                      key={`${userHashtag.user_id}-${userHashtag.hashtag_id}`}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Hash className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">#{userHashtag.hashtag.name}</span>
                      </div>
                      <button
                        onClick={() => handleUnfollowHashtag(userHashtag.hashtag_id)}
                        className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-800"
                      >
                        Unfollow
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">You&apos;re not following any hashtags yet.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'trending' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Trending Hashtags</h2>
              <p className="text-gray-600 mb-6">
                Real-time trending hashtags with growth metrics.
              </p>
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-24 bg-gray-200 rounded" />
                  <div className="h-24 bg-gray-200 rounded" />
                  <div className="h-24 bg-gray-200 rounded" />
                </div>
              ) : (
                <TrendingHashtagDisplay
                  trendingHashtags={trendingHashtags}
                  showGrowth={true}
                  onHashtagClick={handleHashtagClick}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <HashtagAnalytics refreshInterval={30000} />
          </div>
        )}
      </div>
    </div>
  );
}
