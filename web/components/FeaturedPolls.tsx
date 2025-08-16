'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Clock, 
  Users, 
  BarChart3,
  Eye,
  Vote,
  Calendar,
  MapPin
} from 'lucide-react';
import PollCard from './PollCard';

interface Poll {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'closed' | 'draft';
  options: string[];
  total_votes: number;
  participation: number;
  sponsors: string[];
  created_at: string;
  end_time: string;
  results?: PollResults;
  category?: string;
  tags?: string[];
}

interface PollResults {
  [key: number]: number;
  total: number;
}

interface FeaturedPollsProps {
  polls: Poll[];
  onVote?: (pollId: string, choice: number) => Promise<any>;
  onViewDetails?: (pollId: string) => void;
  userVotes?: Record<string, number>;
  title?: string;
  subtitle?: string;
  showFilters?: boolean;
  maxPolls?: number;
}

export const FeaturedPolls: React.FC<FeaturedPollsProps> = ({
  polls,
  onVote,
  onViewDetails,
  userVotes = {},
  title = 'Featured Polls',
  subtitle = 'Participate in important decisions that shape our future',
  showFilters = true,
  maxPolls = 6
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'ending'>('recent');

  // Get unique categories
  const categories = useMemo(() => {
    const cats = polls
      .map(poll => poll.category)
      .filter(Boolean) as string[];
    return ['all', ...Array.from(new Set(cats))];
  }, [polls]);

  // Filter and sort polls
  const filteredPolls = useMemo(() => {
    let filtered = polls.filter(poll => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        poll.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        poll.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        poll.sponsors.some(sponsor => 
          sponsor.toLowerCase().includes(searchQuery.toLowerCase())
        );

      // Status filter
      const matchesStatus = statusFilter === 'all' || poll.status === statusFilter;

      // Category filter
      const matchesCategory = categoryFilter === 'all' || poll.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });

    // Sort polls
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'popular':
          return b.total_votes - a.total_votes;
        case 'ending':
          return new Date(a.end_time).getTime() - new Date(b.end_time).getTime();
        default:
          return 0;
      }
    });

    return filtered.slice(0, maxPolls);
  }, [polls, searchQuery, statusFilter, categoryFilter, sortBy, maxPolls]);

  const getStatusCount = (status: string) => {
    return polls.filter(poll => poll.status === status).length;
  };

  const getCategoryCount = (category: string) => {
    if (category === 'all') return polls.length;
    return polls.filter(poll => poll.category === category).length;
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{subtitle}</p>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-8 space-y-4">
            {/* Search and Sort */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search polls..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="ending">Ending Soon</option>
              </select>
            </div>

            {/* Status and Category Filters */}
            <div className="flex flex-wrap gap-4">
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <div className="flex gap-2">
                  {[
                    { value: 'all', label: 'All', count: polls.length },
                    { value: 'active', label: 'Active', count: getStatusCount('active') },
                    { value: 'closed', label: 'Closed', count: getStatusCount('closed') }
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setStatusFilter(filter.value as any)}
                      className={`
                        px-3 py-1 rounded-full text-sm font-medium transition-colors
                        ${statusFilter === filter.value
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }
                      `}
                    >
                      {filter.label} ({filter.count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              {categories.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Category:</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category} ({getCategoryCount(category)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600">
            Showing {filteredPolls.length} of {polls.length} polls
          </p>
          
          {filteredPolls.length > 0 && (
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{polls.reduce((sum, poll) => sum + poll.total_votes, 0).toLocaleString()} total votes</span>
              </div>
              <div className="flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                <span>{polls.filter(poll => poll.status === 'active').length} active polls</span>
              </div>
            </div>
          )}
        </div>

        {/* Polls Grid */}
        {filteredPolls.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPolls.map((poll) => (
              <PollCard
                key={poll.id}
                poll={poll}
                onVote={onVote}
                onViewDetails={onViewDetails}
                isVoted={userVotes[poll.id] !== undefined}
                userVote={userVotes[poll.id]}
                variant="default"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No polls found</h3>
            <p className="text-gray-600">
              Try adjusting your search criteria or filters
            </p>
          </div>
        )}

        {/* View All Button */}
        {polls.length > maxPolls && (
          <div className="text-center mt-8">
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200">
              <Eye className="w-4 h-4" />
              View All Polls
            </button>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {polls.filter(poll => poll.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Active Polls</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {polls.reduce((sum, poll) => sum + poll.total_votes, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Votes</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {Math.round(polls.reduce((sum, poll) => sum + poll.participation, 0) / polls.length)}%
            </div>
            <div className="text-sm text-gray-600">Avg Participation</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {polls.filter(poll => new Date(poll.end_time) > new Date()).length}
            </div>
            <div className="text-sm text-gray-600">Ending Soon</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedPolls;
