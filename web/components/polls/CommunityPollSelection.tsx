'use client';

import React, { useState } from 'react';
import { FEATURE_FLAGS } from '@/lib/core/feature-flags';
import { 
  TrendingUp, 
  Users, 
  CheckCircle, 
  Heart,
  Award,
  Zap
} from 'lucide-react';

type PollSuggestion = {
  id: string;
  title: string;
  description: string;
  category: string;
  suggestedBy: string;
  votes: number;
  status: 'trending' | 'approved' | 'featured' | 'rejected';
  createdAt: string;
  trendingScore: number;
  estimatedCost: 'low' | 'medium' | 'high';
  expectedEngagement: 'low' | 'medium' | 'high';
}

type WeeklySelection = {
  week: string;
  selectedPolls: PollSuggestion[];
  totalVotes: number;
  selectionCriteria: string[];
}

export default function CommunityPollSelection() {
  if (!FEATURE_FLAGS.EXPERIMENTAL_COMPONENTS) {
    return null;
  }
  
  const [selectedWeek, setSelectedWeek] = useState('current');
  const [viewMode, setViewMode] = useState<'trending' | 'selected' | 'analytics'>('trending');

  // Mock data - in real app this would come from API
  const pollSuggestions: PollSuggestion[] = [
    {
      id: 'suggestion-1',
      title: 'RuPaul\'s Drag Race All Stars 9 - Who Should Win?',
      description: 'The queens are back! Who do you think deserves the crown this season?',
      category: 'drag-race',
      suggestedBy: 'DragRaceFan2024',
      votes: 1247,
      status: 'trending',
      createdAt: '2024-01-15',
      trendingScore: 95,
      estimatedCost: 'low',
      expectedEngagement: 'high'
    },
    {
      id: 'suggestion-2',
      title: 'Oscars 2024 - Best Picture Predictions',
      description: 'Who do you think will take home the big prize at the Academy Awards?',
      category: 'awards',
      suggestedBy: 'MovieBuff',
      votes: 892,
      status: 'trending',
      createdAt: '2024-01-14',
      trendingScore: 87,
      estimatedCost: 'low',
      expectedEngagement: 'high'
    },
    {
      id: 'suggestion-3',
      title: 'Super Bowl LVIII MVP Predictions',
      description: 'The big game is coming up! Who will be the MVP?',
      category: 'sports',
      suggestedBy: 'SportsGuru',
      votes: 1567,
      status: 'trending',
      createdAt: '2024-01-13',
      trendingScore: 92,
      estimatedCost: 'medium',
      expectedEngagement: 'high'
    },
    {
      id: 'suggestion-4',
      title: 'Best Reality TV Show of 2024',
      description: 'What\'s your favorite reality show airing right now?',
      category: 'reality-tv',
      suggestedBy: 'RealityLover',
      votes: 456,
      status: 'trending',
      createdAt: '2024-01-12',
      trendingScore: 73,
      estimatedCost: 'low',
      expectedEngagement: 'medium'
    },
    {
      id: 'suggestion-5',
      title: 'Local Election Predictions - Your City',
      description: 'Who do you think will win the upcoming local elections?',
      category: 'politics',
      suggestedBy: 'CivicEngaged',
      votes: 234,
      status: 'trending',
      createdAt: '2024-01-11',
      trendingScore: 68,
      estimatedCost: 'high',
      expectedEngagement: 'medium'
    }
  ];

  const weeklySelections: WeeklySelection[] = [
    {
      week: '2024-01-15',
      selectedPolls: pollSuggestions.slice(0, 3),
      totalVotes: 3706,
      selectionCriteria: [
        'High community engagement (1000+ votes)',
        'Low to medium cost estimation',
        'Broad appeal across demographics',
        'Timely and relevant content'
      ]
    }
  ];

  const categories = [
    { id: 'drag-race', name: 'Drag Race', icon: '👑', color: 'bg-pink-100 text-pink-700' },
    { id: 'reality-tv', name: 'Reality TV', icon: '📺', color: 'bg-blue-100 text-blue-700' },
    { id: 'sports', name: 'Sports', icon: '🏈', color: 'bg-green-100 text-green-700' },
    { id: 'awards', name: 'Awards', icon: '🏆', color: 'bg-yellow-100 text-yellow-700' },
    { id: 'politics', name: 'Politics', icon: '🗳️', color: 'bg-purple-100 text-purple-700' }
  ];

  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getEngagementColor = (engagement: string) => {
    switch (engagement) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderTrendingView = () => (
    <div className="space-y-6">
      {/* Selection Criteria */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">How We Select Featured Polls</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-1">Community Engagement</h4>
            <ul className="space-y-1">
              <li>• High vote count (500+ votes)</li>
              <li>• Strong trending score (70+)</li>
              <li>• Active discussion and sharing</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-1">Platform Considerations</h4>
            <ul className="space-y-1">
              <li>• Cost-effective to implement</li>
              <li>• Broad demographic appeal</li>
              <li>• Timely and relevant content</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Trending Suggestions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Trending Poll Suggestions</h3>
        {pollSuggestions
          .sort((a, b) => b.trendingScore - a.trendingScore)
          .map((suggestion) => (
            <div key={suggestion.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-semibold text-gray-900">{suggestion.title}</h4>
                    <div className="flex items-center space-x-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                      <TrendingUp className="w-3 h-3" />
                      <span>#{suggestion.trendingScore}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                    <span>Suggested by {suggestion.suggestedBy}</span>
                    <span>•</span>
                    <span>{suggestion.votes} votes</span>
                    <span>•</span>
                    <span>{suggestion.createdAt}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      categories.find(c => c.id === suggestion.category)?.color
                    }`}>
                      {categories.find(c => c.id === suggestion.category)?.icon} {categories.find(c => c.id === suggestion.category)?.name}
                    </span>
                    
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getCostColor(suggestion.estimatedCost)}`}>
                      {suggestion.estimatedCost} cost
                    </span>
                    
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getEngagementColor(suggestion.expectedEngagement)}`}>
                      {suggestion.expectedEngagement} engagement
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <button className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                    <Heart className="w-4 h-4" />
                    <span>Vote</span>
                  </button>
                  <button className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  const renderSelectedView = () => (
    <div className="space-y-6">
      {weeklySelections.map((selection) => (
        <div key={selection.week} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Week of {selection.week}
            </h3>
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span>{selection.totalVotes} total votes</span>
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Selection Criteria</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {selection.selectionCriteria.map((criteria, index) => (
                <li key={index}>• {criteria}</li>
              ))}
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Selected Polls</h4>
            {selection.selectedPolls.map((poll) => (
              <div key={poll.id} className="flex items-center space-x-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">{poll.title}</h5>
                  <p className="text-sm text-gray-600">{poll.votes} votes</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600">Featured</div>
                  <div className="text-xs text-gray-500">Live Now</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderAnalyticsView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">Total Suggestions</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">47</div>
          <div className="text-sm text-gray-500">This month</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-gray-900">Community Votes</span>
          </div>
          <div className="text-2xl font-bold text-green-600">3,706</div>
          <div className="text-sm text-gray-500">This week</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Award className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-gray-900">Featured Polls</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">3</div>
          <div className="text-sm text-gray-500">This week</div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
        <div className="space-y-3">
          {categories.map((category) => {
            const count = pollSuggestions.filter(p => p.category === category.id).length;
            const percentage = (count / pollSuggestions.length) * 100;
            
            return (
              <div key={category.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{category.icon}</span>
                  <span className="font-medium text-gray-900">{category.name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Community Poll Selection
        </h1>
        <p className="text-gray-600">
          See what polls the community wants and how we select featured polls
        </p>
      </div>

      {/* View Mode Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setViewMode('trending')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'trending'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Trending Suggestions
        </button>
        <button
          onClick={() => setViewMode('selected')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'selected'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <CheckCircle className="w-4 h-4 inline mr-2" />
          Selected Polls
        </button>
        <button
          onClick={() => setViewMode('analytics')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'analytics'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Zap className="w-4 h-4 inline mr-2" />
          Analytics
        </button>
      </div>

      {/* Content */}
      {viewMode === 'trending' && renderTrendingView()}
      {viewMode === 'selected' && renderSelectedView()}
      {viewMode === 'analytics' && renderAnalyticsView()}
    </div>
  );
}
