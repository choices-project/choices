'use client';

import React, { useState } from 'react';
import { 
  Newspaper, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Search,
  Filter,
  Plus,
  RefreshCw,
  Zap,
  Eye,
  MessageSquare,
  ExternalLink,
  Calendar,
  MapPin,
  Users
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query'
import { ChartWrapper, ChartSkeleton } from '../charts/BasicCharts';
import { useBreakingNews, useGeneratePollContext } from '../../../lib/admin-hooks';
import { devLog } from '@/lib/logger';

// Mock data for development
const mockBreakingNews = [
  {
    id: 'newsom-trump-1',
    headline: "Gavin Newsom Challenges Trump to Presidential Debate",
    summary: "California Governor Gavin Newsom has publicly challenged former President Donald Trump to a one-on-one presidential debate, escalating their ongoing political feud ahead of the 2024 election cycle.",
    sourceName: "Political Analysis",
    sourceReliability: 0.92,
    category: ["politics", "election", "presidential", "debate"],
    urgency: "high",
    sentiment: "mixed",
    entities: [
      { name: "Gavin Newsom", type: "person", confidence: 0.98, role: "California Governor" },
      { name: "Donald Trump", type: "person", confidence: 0.98, role: "Former President" },
      { name: "2024 Election", type: "event", confidence: 0.95 }
    ],
    metadata: {
      keywords: ["newsom", "trump", "debate", "election", "presidential"],
      controversy: 0.85,
      timeSensitivity: "high",
      geographicScope: "national",
      politicalImpact: 0.90,
      publicInterest: 0.88
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: "newsom-trump-2",
    headline: "Newsom's California Policies Face Trump's 'America First' Criticism",
    summary: "Former President Trump has intensified his criticism of Governor Newsom's California policies, calling them 'failed experiments' while Newsom defends his progressive governance approach.",
    sourceName: "Policy Analysis",
    sourceReliability: 0.89,
    category: ["politics", "policy", "governance", "california"],
    urgency: "medium",
    sentiment: "negative",
    entities: [
      { name: "Gavin Newsom", type: "person", confidence: 0.95, role: "California Governor" },
      { name: "Donald Trump", type: "person", confidence: 0.95, role: "Former President" },
      { name: "California", type: "location", confidence: 0.92 }
    ],
    metadata: {
      keywords: ["california", "policies", "progressive", "conservative", "governance"],
      controversy: 0.75,
      timeSensitivity: "medium",
      geographicScope: "national",
      politicalImpact: 0.80,
      publicInterest: 0.75
    },
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
  },
  {
    id: "newsom-trump-3",
    headline: "Social Media Explodes Over Newsom-Trump Political Exchanges",
    summary: "Viral clips and heated exchanges between Gavin Newsom and Donald Trump have dominated social media platforms, generating millions of views and sparking intense online debates.",
    sourceName: "Social Media Analysis",
    sourceReliability: 0.82,
    category: ["social_media", "viral", "politics", "election"],
    urgency: "high",
    sentiment: "mixed",
    entities: [
      { name: "Social Media", type: "concept", confidence: 0.90 },
      { name: "Viral Content", type: "concept", confidence: 0.85 },
      { name: "Gavin Newsom", type: "person", confidence: 0.88, role: "California Governor" },
      { name: "Donald Trump", type: "person", confidence: 0.88, role: "Former President" }
    ],
    metadata: {
      keywords: ["viral", "social media", "politics", "debate", "trending", "engagement"],
      controversy: 0.80,
      timeSensitivity: "high",
      geographicScope: "national",
      politicalImpact: 0.75,
      publicInterest: 0.90
    },
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
  }
];

export const BreakingNewsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'breaking' | 'high' | 'medium' | 'low'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [showPollContext, setShowPollContext] = useState(false);

  const queryClient = useQueryClient();

  // Real API query for breaking news
  const { data: stories = [], isLoading } = useBreakingNews();

  // Real API mutation for generating poll context
  const generatePollContext = useGeneratePollContext();

  // Filter stories based on search and filters
  const filteredStories = stories.filter((story: any) => {
    const matchesSearch = story.headline.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUrgency = urgencyFilter === 'all' || story.urgency === urgencyFilter;
    const matchesCategory = categoryFilter === 'all' || story.category.includes(categoryFilter);
    
    return matchesSearch && matchesUrgency && matchesCategory;
  });

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'breaking':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
            <AlertTriangle className="h-3 w-3 mr-1" />
            BREAKING
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <TrendingUp className="h-3 w-3 mr-1" />
            High Priority
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Medium Priority
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock className="h-3 w-3 mr-1" />
            Low Priority
          </span>
        );
      default:
        return null;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      case 'mixed': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getReliabilityColor = (reliability: number) => {
    if (reliability >= 0.9) return 'text-green-600';
    if (reliability >= 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleGeneratePoll = (story: any) => {
    setSelectedStory(story);
    generatePollContext.mutate(story.id, {
      onSuccess: (data) => {
        devLog('Poll context generated successfully:', data);
        setShowPollContext(true);
      },
      onError: (error) => {
        devLog('Failed to generate poll context:', error);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Breaking News</h1>
          <p className="text-gray-600 mt-1">
            Real-time news stories and poll generation for trending topics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['breaking-news'] })}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Story
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <ChartWrapper title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search stories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Urgency Filter */}
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Urgency</option>
            <option value="breaking">Breaking</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="politics">Politics</option>
            <option value="election">Election</option>
            <option value="social_media">Social Media</option>
            <option value="policy">Policy</option>
          </select>

          {/* Export Button */}
          <button className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
            <ExternalLink className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </ChartWrapper>

      {/* Stories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_: any, i: any) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4"></div>
              <div className="h-20 bg-gray-200 rounded mb-4"></div>
              <div className="flex justify-between">
                <div className="h-3 bg-gray-200 rounded w-20"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))
        ) : filteredStories.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Newspaper className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No breaking news found</h3>
            <p className="text-gray-600">
              {searchTerm || urgencyFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : stories.length === 0 
                  ? 'No breaking news stories available. The system is ready to display stories as they are discovered.'
                  : 'No stories match your current filters.'}
            </p>
            {stories.length === 0 && (
              <div className="mt-4">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2 inline" />
                  Add First Story
                </button>
              </div>
            )}
          </div>
        ) : (
          filteredStories.map((story: any) => (
            <div key={story.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Story Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  {getUrgencyBadge(story.urgency)}
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${getReliabilityColor(story.sourceReliability)}`}>
                      {Math.round(story.sourceReliability * 100)}% Reliable
                    </span>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {story.headline}
                </h3>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {story.summary}
                </p>

                {/* Story Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(story.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {story.metadata.geographicScope}
                  </div>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {story.category.slice(0, 3).map((cat: string) => (
                    <span
                      key={cat}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {cat}
                    </span>
                  ))}
                  {story.category.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{story.category.length - 3}
                    </span>
                  )}
                </div>

                {/* Sentiment and Impact */}
                <div className="flex items-center justify-between text-sm">
                  <span className={`font-medium ${getSentimentColor(story.sentiment)}`}>
                    {story.sentiment.charAt(0).toUpperCase() + story.sentiment.slice(1)} Sentiment
                  </span>
                  <div className="flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    <span className="text-gray-600">
                      {Math.round(story.metadata.publicInterest * 100)}% Interest
                    </span>
                  </div>
                </div>
              </div>

              {/* Story Actions */}
              <div className="p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedStory(story)}
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </button>
                    <button className="flex items-center text-sm text-gray-600 hover:text-gray-800">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Source
                    </button>
                  </div>
                  
                  <button
                    onClick={() => handleGeneratePoll(story)}
                    disabled={generatePollContext.isPending}
                    className="flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    {generatePollContext.isPending ? 'Generating...' : 'Generate Poll'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Story Detail Modal */}
      {selectedStory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Story Details</h2>
                <button
                  onClick={() => setSelectedStory(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedStory.headline}</h3>
                  <p className="text-gray-600">{selectedStory.summary}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Key Entities</h4>
                    <div className="space-y-1">
                      {selectedStory.entities.map((entity: any, index: number) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">{entity.name}</span>
                          {entity.role && <span className="text-gray-500"> - {entity.role}</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Impact Metrics</h4>
                    <div className="space-y-1 text-sm">
                      <div>Political Impact: {Math.round(selectedStory.metadata.politicalImpact * 100)}%</div>
                      <div>Public Interest: {Math.round(selectedStory.metadata.publicInterest * 100)}%</div>
                      <div>Controversy Level: {Math.round(selectedStory.metadata.controversy * 100)}%</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setSelectedStory(null)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleGeneratePoll(selectedStory)}
                    disabled={generatePollContext.isPending}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Generate Poll
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Poll Context Modal */}
      {showPollContext && selectedStory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Generated Poll Context</h2>
                <button
                  onClick={() => setShowPollContext(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Poll Question</h3>
                  <p className="text-gray-600">
                    Should Gavin Newsom and Donald Trump participate in a presidential debate?
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Context</h3>
                  <p className="text-gray-600">
                    This breaking news story involves national implications and has generated significant public interest. 
                    The situation is high priority and could have lasting political impact.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Why This Matters</h3>
                  <p className="text-gray-600">
                    This story matters because it involves high-stakes political decisions that could affect millions of Americans. 
                    The controversial nature of this issue makes it crucial to understand public opinion.
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowPollContext(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Create Poll
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
