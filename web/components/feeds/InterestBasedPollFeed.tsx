// Interest-Based Poll Feed Component
// Displays personalized poll recommendations based on user interests
// Created: October 2, 2025

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

type PollRecommendation = {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  totalVotes: number;
  createdAt: string;
  relevanceScore: number;
  interestMatches: string[];
};

type InterestBasedFeedProps = {
  limit?: number;
  includeTrending?: boolean;
  className?: string;
};

export default function InterestBasedPollFeed({ 
  limit = 10, 
  includeTrending = false,
  className = ''
}: InterestBasedFeedProps) {
  const [recommendations, setRecommendations] = useState<PollRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInterests, setUserInterests] = useState<string[]>([]);

  useEffect(() => {
    fetchRecommendations();
  }, [limit, includeTrending]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: limit.toString(),
        trending: includeTrending.toString()
      });

      const response = await fetch(`/api/feeds/interest-based?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch recommendations');
      }

      setRecommendations(data.data.recommendations);
      setUserInterests(data.data.userInterests);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  // Future: Implement interest updating functionality
  // const updateInterests = async (newInterests: string[]) => {
  //   // Implementation for updating user interests
  // };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center">
          <div className="text-red-600 mr-3">⚠️</div>
          <div>
            <h3 className="text-red-800 font-semibold">Error Loading Recommendations</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button
              onClick={fetchRecommendations}
              className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recommended for You</h2>
          <p className="text-gray-600 text-sm mt-1">
            Based on your interests: {userInterests.length > 0 ? userInterests.join(', ') : 'None selected'}
          </p>
        </div>
        <button
          onClick={fetchRecommendations}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {recommendations.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recommendations Yet</h3>
          <p className="text-gray-600 mb-4">
            {userInterests.length === 0 
              ? "Add some interests to get personalized poll recommendations."
              : "We're working on finding polls that match your interests."
            }
          </p>
          <Link
            href="/profile"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Update Your Interests
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((poll) => (
            <div key={poll.id} className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    <Link 
                      href={`/polls/${poll.id}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {poll.title}
                    </Link>
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">{poll.description}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRelevanceColor(poll.relevanceScore)}`}>
                  {Math.round(poll.relevanceScore * 100)}% match
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>{poll.totalVotes} votes</span>
                  <span>•</span>
                  <span>{formatDate(poll.createdAt)}</span>
                  <span>•</span>
                  <span className="capitalize">{poll.category}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {poll.interestMatches.slice(0, 2).map((interest) => (
                    <span
                      key={interest}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                    >
                      {interest}
                    </span>
                  ))}
                  {poll.interestMatches.length > 2 && (
                    <span className="text-gray-500 text-xs">
                      +{poll.interestMatches.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="mt-6 text-center">
          <Link
            href="/polls"
            className="inline-block bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            View All Polls
          </Link>
        </div>
      )}
    </div>
  );
}
