'use client';

import {
  TrendingUp,
  Users,
  CheckCircle,
  Heart,
  Award,
  Zap,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import {
  usePolls,
  usePollsActions,
  usePollsAnalytics,
} from '@/lib/stores';

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
};

type WeeklySelection = {
  week: string;
  selectedPolls: PollSuggestion[];
  totalVotes: number;
  selectionCriteria: string[];
};

const SUGGESTION_FALLBACK: PollSuggestion[] = [
  {
    id: 'fallback-1',
    title: 'Community Budget Priorities',
    description: 'Help prioritize the budget focus areas for the next quarter.',
    category: 'civics',
    suggestedBy: 'community-team',
    votes: 0,
    status: 'trending',
    createdAt: new Date().toISOString(),
    trendingScore: 45,
    estimatedCost: 'medium',
    expectedEngagement: 'medium',
  },
];

const estimateCost = (optionsCount: number, totalVotes: number) => {
  if (totalVotes > 1000 || optionsCount > 8) return 'high';
  if (totalVotes > 300 || optionsCount > 5) return 'medium';
  return 'low';
};

const estimateEngagement = (totalVotes: number) => {
  if (totalVotes > 1000) return 'high';
  if (totalVotes > 300) return 'medium';
  return 'low';
};

const formatWeek = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return 'This Week';
  }
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay());
  const isoDate = weekStart.toISOString().split('T')[0];
  return isoDate ?? 'This Week';
};

export default function CommunityPollSelection() {
  const [selectedWeek, setSelectedWeek] = useState('current');
  const [viewMode, setViewMode] = useState<'trending' | 'selected' | 'analytics'>('trending');

  const polls = usePolls();
  const analytics = usePollsAnalytics();
  const { loadPolls } = usePollsActions();

  useEffect(() => {
    void loadPolls();
  }, [loadPolls]);

  const pollSuggestions: PollSuggestion[] = useMemo(() => {
    if (!polls.length) {
      return SUGGESTION_FALLBACK;
    }

    return polls.map((poll) => {
      const options = Array.isArray((poll as Record<string, unknown>).options)
        ? ((poll as Record<string, unknown>).options as string[])
        : [];
      const totalVotes = typeof poll.total_votes === 'number' ? poll.total_votes : 0;
      const participation = typeof poll.participation === 'number' ? poll.participation : 0;
      const trendingScore = Math.min(100, Math.round(totalVotes * 0.08 + participation * 0.12 + options.length * 3));
      const rawSuggestedBy =
        (poll as Record<string, unknown>).created_by ??
        (poll as Record<string, unknown>).owner ??
        (poll as Record<string, unknown>).author;
      const suggestedBy =
        typeof rawSuggestedBy === 'string'
          ? rawSuggestedBy
          : typeof rawSuggestedBy === 'object' && rawSuggestedBy !== null
          ? 'name' in rawSuggestedBy && typeof (rawSuggestedBy as { name?: unknown }).name === 'string'
            ? (rawSuggestedBy as { name: string }).name
            : 'community'
          : 'community';

      return {
        id: poll.id,
        title: poll.title ?? (poll as Record<string, unknown>).question ?? 'Untitled Poll',
        description: poll.description ?? '',
        category: poll.category ?? 'general',
        suggestedBy,
        votes: totalVotes,
        status: 'trending' as const,
        createdAt: poll.created_at ?? new Date().toISOString(),
        trendingScore,
        estimatedCost: estimateCost(options.length, totalVotes),
        expectedEngagement: estimateEngagement(totalVotes),
      };
    });
  }, [polls]);

  const weeklySelections: WeeklySelection[] = useMemo(() => {
    if (!pollSuggestions.length) {
      return [];
    }

    const groups = pollSuggestions.reduce<Record<string, PollSuggestion[]>>((acc, suggestion) => {
      const key: string = formatWeek(suggestion.createdAt);
      const existing = acc[key] ?? [];
      acc[key] = [...existing, suggestion];
      return acc;
    }, {});

    return Object.entries(groups)
      .map(([week, suggestions]) => {
        const topPolls = [...suggestions]
          .sort((a, b) => b.trendingScore - a.trendingScore)
          .slice(0, 3);
        const totalVotes = topPolls.reduce((sum, poll) => sum + poll.votes, 0);

        return {
          week,
          selectedPolls: topPolls,
          totalVotes,
          selectionCriteria: [
            'High community engagement',
            'Strong trending score',
            'Diverse category coverage',
            'Active participation growth',
          ],
        };
      })
      .sort((a, b) => (a.week < b.week ? 1 : -1));
  }, [pollSuggestions]);

  const categories = useMemo(() => {
    const derived = pollSuggestions.reduce<Record<string, { id: string; name: string; icon: string; color: string }>>(
      (acc, suggestion) => {
        if (acc[suggestion.category]) {
          return acc;
        }
        const palette = [
          'bg-blue-100 text-blue-700',
          'bg-green-100 text-green-700',
          'bg-yellow-100 text-yellow-700',
          'bg-purple-100 text-purple-700',
          'bg-pink-100 text-pink-700',
        ];
        const icons = ['🗳️', '📊', '📺', '🌐', '🏆', '🏛️'];
        const index = Object.keys(acc).length % palette.length;
        const icon = icons[index % icons.length] ?? '🗳️';
        const color = palette[index] ?? 'bg-blue-100 text-blue-700';
        acc[suggestion.category] = {
          id: suggestion.category,
          name: suggestion.category.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
          icon,
          color,
        };
        return acc;
      },
      {},
    );

    if (!Object.keys(derived).length) {
      return [
        { id: 'general', name: 'General', icon: '🗳️', color: 'bg-blue-100 text-blue-700' },
      ];
    }

    return Object.values(derived);
  }, [pollSuggestions]);

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
          .slice()
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
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        categories.find((c) => c.id === suggestion.category)?.color ?? 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {categories.find((c) => c.id === suggestion.category)?.icon ?? '🗳️'}{' '}
                      {categories.find((c) => c.id === suggestion.category)?.name ?? suggestion.category}
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
                <li key={`criteria-${criteria}-${index}`}>• {criteria}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Selected Polls</h4>
            {selection.selectedPolls.map((poll) => (
              <div
                key={poll.id}
                className="flex items-center space-x-4 p-3 bg-green-50 border border-green-200 rounded-lg"
              >
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

  const renderAnalyticsView = () => {
    const firstSelection = weeklySelections[0];
    const featuredPollCount = firstSelection
      ? firstSelection.selectedPolls.length
      : Math.min(3, pollSuggestions.length);

    return (
      <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">Total Suggestions</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{analytics.total ?? pollSuggestions.length}</div>
          <div className="text-sm text-gray-500">Currently published</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-gray-900">Community Votes</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {(analytics.totalVotes ?? pollSuggestions.reduce((sum, poll) => sum + poll.votes, 0)).toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Across featured polls</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Award className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-gray-900">Featured Polls</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">{featuredPollCount}</div>
          <div className="text-sm text-gray-500">This week</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
        <div className="space-y-3">
          {categories.map((category) => {
            const count = pollSuggestions.filter((poll) => poll.category === category.id).length;
            const percentage = pollSuggestions.length ? (count / pollSuggestions.length) * 100 : 0;

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
  };

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

      {/* Week Selection */}
      <div className="mb-6">
        <label htmlFor="week-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select Week
        </label>
        <select
          id="week-select"
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="current">Current Week</option>
          <option value="last">Last Week</option>
          <option value="two-weeks-ago">Two Weeks Ago</option>
          <option value="three-weeks-ago">Three Weeks Ago</option>
        </select>
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
