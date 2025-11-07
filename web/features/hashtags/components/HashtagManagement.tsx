'use client';

import { Hash, Plus, Search, Filter } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import { withOptional } from '@/lib/util/objects';
import logger from '@/lib/utils/logger';

import { searchHashtags, createHashtag, deleteHashtag } from '../lib/hashtag-service';
import type { Hashtag, HashtagCategory } from '../types';

type HashtagManagementProps = {
  className?: string;
  onHashtagSelect?: (hashtag: Hashtag) => void;
  userHashtags?: any[];
  onFollow?: (hashtag: Hashtag) => Promise<void>;
  onUnfollow?: (hashtag: Hashtag) => Promise<void>;
  onReorder?: (reorderedHashtags: any[]) => void;
  showSuggestions?: boolean;
}

export function HashtagManagement({
  className = '',
  onHashtagSelect,
  userHashtags = [],
  onFollow,
  onUnfollow,
  onReorder: _onReorder,
  showSuggestions: _showSuggestions = false
}: HashtagManagementProps) {
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HashtagCategory | 'all'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newHashtag, setNewHashtag] = useState({
    name: '',
    display_name: '',
    category: 'politics' as HashtagCategory,
    description: ''
  });

  const categories: HashtagCategory[] = ['politics', 'civics', 'social', 'environment', 'economy', 'health', 'education', 'technology', 'culture', 'sports', 'entertainment', 'news'];

  const loadHashtags = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // If userHashtags are provided, use them; otherwise search for hashtags
      if (userHashtags && userHashtags.length > 0) {
        setHashtags(userHashtags.map(uh => uh.hashtag ?? uh));
      } else {
        const result = await searchHashtags({ 
          query: '',
          limit: 100,
          ...(selectedCategory !== 'all' ? { category: selectedCategory } : {})
        });
        
        if (result.success && result.data) {
          setHashtags(result.data.hashtags);
        } else {
          setError(result.error ?? 'Failed to load hashtags');
        }
      }
    } catch {
      setError('An error occurred while loading hashtags');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, userHashtags]);

  useEffect(() => {
    void loadHashtags();
  }, [loadHashtags]);

  const handleCreateHashtag = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await createHashtag(
        newHashtag.name,
        newHashtag.description,
        newHashtag.category
      );
      
      if (result.success && result.data) {
        const { data } = result;
        setHashtags(prev => [data, ...prev]);
        setNewHashtag({
          name: '',
          display_name: '',
          category: 'politics',
          description: ''
        });
        setShowCreateForm(false);
      } else {
        setError(result.error ?? 'Failed to create hashtag');
      }
    } catch {
      setError('An error occurred while creating hashtag');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHashtag = async (hashtagId: string) => {
    if (!confirm('Are you sure you want to delete this hashtag?')) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await deleteHashtag(hashtagId);
      
      if (result.success) {
        setHashtags(prev => prev.filter(h => h.id !== hashtagId));
      } else {
        setError(result.error ?? 'Failed to delete hashtag');
      }
    } catch {
      setError('An error occurred while deleting hashtag');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHashtags = hashtags.filter(hashtag =>
    hashtag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (hashtag.display_name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={`hashtag-management ${className}`}>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Hash className="h-6 w-6 text-blue-600" />
              </div>
        <div>
                <h2 className="text-xl font-semibold text-gray-900">Hashtag Management</h2>
                <p className="text-sm text-gray-600">Manage and organize hashtags</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Hashtag</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
              placeholder="Search hashtags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as HashtagCategory | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
          </div>
        </div>
      </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Hashtag</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newHashtag.name}
                  onChange={(e) => setNewHashtag(prev => withOptional(prev, { name: e.target.value }))}
                  placeholder="e.g., #climatechange"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={newHashtag.display_name}
                  onChange={(e) => setNewHashtag(prev => withOptional(prev, { display_name: e.target.value }))}
                  placeholder="e.g., Climate Change"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newHashtag.category}
                  onChange={(e) =>
                    setNewHashtag(prev =>
                      withOptional(prev, { category: e.target.value as HashtagCategory })
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newHashtag.description}
                  onChange={(e) => setNewHashtag(prev => withOptional(prev, { description: e.target.value }))}
                  placeholder="Brief description..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
                      </div>
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateHashtag}
                disabled={!newHashtag.name || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Hashtag
              </button>
                      </div>
                    </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mx-6 mt-4">
            <p className="text-red-600 text-sm">{error}</p>
                  </div>
        )}

        {/* Hashtags List */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filteredHashtags.length === 0 ? (
            <div className="text-center py-8">
              <Hash className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No hashtags found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHashtags.map(hashtag => (
                <div key={hashtag.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Hash className="h-4 w-4 text-blue-600" />
                    </div>
                        <div>
                      <p className="font-medium text-gray-900">{hashtag.name}</p>
                      <p className="text-sm text-gray-600">{hashtag.display_name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          {hashtag.category}
                          </span>
                        <span className="text-xs text-gray-500">
                          {hashtag.usage_count} uses
                          </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Follow/Unfollow functionality */}
                    {onFollow && onUnfollow && (
                      <button
                        onClick={async () => {
                          try {
                            // Check if user is following this hashtag
                            const isFollowing = userHashtags?.some(uh => uh.hashtag?.id === hashtag.id);
                            if (isFollowing) {
                              await onUnfollow(hashtag);
                            } else {
                              await onFollow(hashtag);
                            }
                          } catch (error) {
                            logger.error('Error toggling hashtag follow:', error);
                          }
                        }}
                        className={`px-3 py-1 text-sm transition-colors rounded ${
                          userHashtags?.some(uh => uh.hashtag?.id === hashtag.id)
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                        }`}
                      >
                        {userHashtags?.some(uh => uh.hashtag?.id === hashtag.id) ? 'Unfollow' : 'Follow'}
                      </button>
                    )}
                    
                    <button
                      onClick={() => onHashtagSelect?.(hashtag)}
                      className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteHashtag(hashtag.id)}
                      className="px-3 py-1 text-red-600 hover:text-red-800 text-sm transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
                </div>
              )}
        </div>
          </div>
    </div>
  );
}
