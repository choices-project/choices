'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  X, 
  Tag,
  MessageSquare,
  Search,
  RefreshCw
} from 'lucide-react';

type UserSuggestion = {
  id: string;
  user_id: string;
  type: 'interest_suggestion' | 'demographic_suggestion' | 'poll_suggestion' | 'general_feedback';
  title: string;
  description: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  created_at: string;
  metadata: {
    source: string;
    userId?: string;
    timestamp: string;
    originalText: string;
  };
  ai_analysis?: {
    extractedKeywords: string[];
    suggestedCategory?: string;
    confidence: number;
    relatedInterests?: string[];
  };
}

export default function UserSuggestionsManager() {
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    type: '',
    status: 'pending',
    sentiment: '',
    search: ''
  });

  useEffect(() => {
    loadSuggestions();
  }, [filter]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.type) params.append('type', filter.type);
      if (filter.status) params.append('status', filter.status);
      if (filter.sentiment) params.append('sentiment', filter.sentiment);
      
      const response = await fetch(`/api/feedback/suggestions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSuggestionStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/feedback/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setSuggestions(prev => 
          prev.map(suggestion => 
            suggestion.id === id 
              ? { ...suggestion, status: status as any }
              : suggestion
          )
        );
      }
    } catch (error) {
      console.error('Error updating suggestion status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'implemented': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      case 'neutral': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSuggestions = suggestions.filter(suggestion => {
    if (filter.search && !suggestion.title.toLowerCase().includes(filter.search.toLowerCase()) && 
        !suggestion.description.toLowerCase().includes(filter.search.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">User Suggestions</h2>
        <button
          onClick={loadSuggestions}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filter.type}
              onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="interest_suggestion">Interest Suggestions</option>
              <option value="demographic_suggestion">Demographic Suggestions</option>
              <option value="poll_suggestion">Poll Suggestions</option>
              <option value="general_feedback">General Feedback</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="implemented">Implemented</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sentiment</label>
            <select
              value={filter.sentiment}
              onChange={(e) => setFilter(prev => ({ ...prev, sentiment: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search suggestions..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="space-y-4">
        {filteredSuggestions.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No suggestions found</h3>
            <p className="text-gray-500">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          filteredSuggestions.map((suggestion) => (
            <div key={suggestion.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{suggestion.title}</h3>
                  <p className="text-gray-600 mb-3">{suggestion.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <span>User: {suggestion.user_id}</span>
                    <span>•</span>
                    <span>{new Date(suggestion.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Source: {suggestion.metadata.source}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(suggestion.status)}`}>
                      {suggestion.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(suggestion.priority)}`}>
                      {suggestion.priority} priority
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(suggestion.sentiment)}`}>
                      {suggestion.sentiment}
                    </span>
                  </div>
                  
                  {suggestion.tags.length > 0 && (
                    <div className="flex items-center space-x-2 mb-3">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <div className="flex flex-wrap gap-1">
                        {suggestion.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {suggestion.ai_analysis && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h4 className="font-medium text-blue-900 mb-2">AI Analysis</h4>
                      <div className="text-sm text-blue-800">
                        <p>Confidence: {(suggestion.ai_analysis.confidence * 100).toFixed(1)}%</p>
                        {suggestion.ai_analysis.extractedKeywords.length > 0 && (
                          <p>Keywords: {suggestion.ai_analysis.extractedKeywords.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col space-y-2 ml-4">
                  {suggestion.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateSuggestionStatus(suggestion.id, 'approved')}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => updateSuggestionStatus(suggestion.id, 'rejected')}
                        className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                  {suggestion.status === 'approved' && (
                    <button
                      onClick={() => updateSuggestionStatus(suggestion.id, 'implemented')}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Mark Implemented</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
