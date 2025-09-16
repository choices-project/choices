'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Heart,
  Star,
  MessageCircle,
  Share2
} from 'lucide-react';

interface UserPoll {
  id: string;
  title: string;
  description: string;
  category: string;
  options: string[];
  votes: number;
  createdAt: string;
  status: 'active' | 'completed' | 'draft';
}

interface PollSuggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  suggestedBy: string;
  votes: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function PollCreationSystem() {
  const [activeTab, setActiveTab] = useState<'create' | 'suggest' | 'my-polls'>('create');
  const [userPolls, setUserPolls] = useState<UserPoll[]>([
    {
      id: 'poll-1',
      title: 'Best Drag Race Season 15 Queen?',
      description: 'Who was your favorite queen from the latest season?',
      category: 'drag-race',
      options: ['Sasha Colby', 'Anetra', 'Luxx Noir London', 'Mistress Isabelle Brooks'],
      votes: 234,
      createdAt: '2024-01-10',
      status: 'active'
    }
  ]);
  
  const [pollSuggestions, setPollSuggestions] = useState<PollSuggestion[]>([
    {
      id: 'suggestion-1',
      title: 'Oscars 2024 Best Picture Predictions',
      description: 'Who do you think will win Best Picture at the Oscars this year?',
      category: 'awards',
      suggestedBy: 'MovieFan123',
      votes: 89,
      status: 'pending',
      createdAt: '2024-01-12'
    },
    {
      id: 'suggestion-2',
      title: 'Super Bowl MVP Predictions',
      description: 'Who will be the MVP of Super Bowl LVIII?',
      category: 'sports',
      suggestedBy: 'SportsGuru',
      votes: 156,
      status: 'pending',
      createdAt: '2024-01-11'
    },
    {
      id: 'suggestion-3',
      title: 'Best Reality TV Show of 2024',
      description: 'What\'s your favorite reality show airing right now?',
      category: 'reality-tv',
      suggestedBy: 'RealityLover',
      votes: 67,
      status: 'pending',
      createdAt: '2024-01-13'
    }
  ]);

  const MAX_USER_POLLS = 3;
  const canCreatePoll = userPolls.length < MAX_USER_POLLS;

  const categories = [
    { id: 'drag-race', name: 'Drag Race', icon: '👑' },
    { id: 'reality-tv', name: 'Reality TV', icon: '📺' },
    { id: 'sports', name: 'Sports', icon: '🏈' },
    { id: 'awards', name: 'Awards', icon: '🏆' },
    { id: 'politics', name: 'Politics', icon: '🗳️' },
    { id: 'other', name: 'Other', icon: '💭' }
  ];

  const handleVoteSuggestion = (suggestionId: string) => {
    setPollSuggestions(prev => prev.map(suggestion => {
      if (suggestion.id === suggestionId) {
        return { ...suggestion, votes: suggestion.votes + 1 };
      }
      return suggestion;
    }));
  };

  const renderCreatePoll = () => (
    <div className="space-y-6">
      {/* Poll Limit Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Users className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Poll Creation Limits</h3>
            <p className="text-sm text-blue-800 mb-2">
              To keep costs manageable and ensure quality, you can create up to <strong>{MAX_USER_POLLS} polls</strong> at a time.
            </p>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <span className="font-medium">Your polls:</span>
                <span className="font-bold text-blue-600">{userPolls.length}/{MAX_USER_POLLS}</span>
              </div>
              {canCreatePoll && (
                <div className="flex items-center space-x-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Can create {MAX_USER_POLLS - userPolls.length} more</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Poll Form */}
      {canCreatePoll ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Poll</h3>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poll Title
              </label>
              <input
                type="text"
                placeholder="e.g., Best Drag Race Season 15 Queen?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                placeholder="Add more context about your poll..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Options (2-6 options)
              </label>
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <input
                    key={i}
                    type="text"
                    placeholder={`Option ${i}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ))}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Poll
              </button>
              <button
                type="button"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Save Draft
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            Poll Limit Reached
          </h3>
          <p className="text-yellow-800 mb-4">
            You've reached your limit of {MAX_USER_POLLS} polls. Complete or delete an existing poll to create a new one.
          </p>
          <button
            onClick={() => setActiveTab('my-polls')}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Manage My Polls
          </button>
        </div>
      )}
    </div>
  );

  const renderSuggestPoll = () => (
    <div className="space-y-6">
      {/* How it works */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-2">How Poll Suggestions Work</h3>
        <div className="text-sm text-green-800 space-y-1">
          <div>• Suggest polls you'd like to see on the platform</div>
          <div>• Community votes on the best suggestions</div>
          <div>• Most popular suggestions become featured polls</div>
          <div>• We conduct thorough analysis on selected polls</div>
        </div>
      </div>

      {/* Current Suggestions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Community Poll Suggestions</h3>
        {pollSuggestions.map((suggestion) => (
          <div key={suggestion.id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">{suggestion.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>Suggested by {suggestion.suggestedBy}</span>
                  <span>•</span>
                  <span>{suggestion.votes} votes</span>
                  <span>•</span>
                  <span>{suggestion.createdAt}</span>
                </div>
              </div>
              <button
                onClick={() => handleVoteSuggestion(suggestion.id)}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <Heart className="w-4 h-4" />
                <span>Vote</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                {categories.find(c => c.id === suggestion.category)?.icon} {categories.find(c => c.id === suggestion.category)?.name}
              </span>
              <span className={`px-2 py-1 text-xs rounded ${
                suggestion.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                suggestion.status === 'approved' ? 'bg-green-100 text-green-700' :
                'bg-red-100 text-red-700'
              }`}>
                {suggestion.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Suggest New Poll */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggest a Poll</h3>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What poll would you like to see?
            </label>
            <input
              type="text"
              placeholder="e.g., Best Reality TV Show of 2024"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Why should we create this poll?
            </label>
            <textarea
              placeholder="Explain why this poll would be interesting and relevant..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Submit Suggestion
          </button>
        </form>
      </div>
    </div>
  );

  const renderMyPolls = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">My Polls</h3>
      {userPolls.map((poll) => (
        <div key={poll.id} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">{poll.title}</h4>
              <p className="text-sm text-gray-600 mb-2">{poll.description}</p>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span>{poll.votes} votes</span>
                <span>•</span>
                <span>Created {poll.createdAt}</span>
                <span>•</span>
                <span className={`px-2 py-1 rounded ${
                  poll.status === 'active' ? 'bg-green-100 text-green-700' :
                  poll.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {poll.status}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Share2 className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
              {categories.find(c => c.id === poll.category)?.icon} {categories.find(c => c.id === poll.category)?.name}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create & Suggest Polls
        </h1>
        <p className="text-gray-600">
          Create your own polls or suggest what the community should vote on next
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'create'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Create Poll
        </button>
        <button
          onClick={() => setActiveTab('suggest')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'suggest'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Suggest Poll
        </button>
        <button
          onClick={() => setActiveTab('my-polls')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'my-polls'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          My Polls
        </button>
      </div>

      {/* Content */}
      {activeTab === 'create' && renderCreatePoll()}
      {activeTab === 'suggest' && renderSuggestPoll()}
      {activeTab === 'my-polls' && renderMyPolls()}
    </div>
  );
}
