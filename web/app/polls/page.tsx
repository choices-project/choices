'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Vote, Clock, Users, Calendar, ArrowRight, Loader2, Filter, Search, TrendingUp, Award, Globe, Zap } from 'lucide-react';

interface Poll {
  id: string;
  title: string;
  description: string;
  status: string;
  total_votes?: number;
  participation?: number;
  created_at: string;
  start_time: string;
  end_time: string;
  options: string[];
  sponsors: string[];
}

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPoll, setSelectedPoll] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/polls');
        if (!response.ok) {
          throw new Error('Failed to fetch polls');
        }
        const data = await response.json();
        setPolls(Array.isArray(data) ? data : data.polls || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching polls:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPolls();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200';
      case 'ended':
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Zap className="h-4 w-4" />;
      case 'draft':
        return <Clock className="h-4 w-4" />;
      case 'ended':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const filteredPolls = polls.filter(poll => {
    if (filter === 'all') return true;
    return poll.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-spin mx-auto" style={{ animationDelay: '0.5s' }}></div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">Loading Polls</div>
          <div className="text-gray-600">Fetching the latest polls and results</div>
          <div className="mt-4 text-sm text-gray-400">This may take a few moments...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Vote className="h-8 w-8 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">Error Loading Polls</div>
          <div className="text-gray-600 mb-6">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">All Polls</h1>
            <p className="text-xl text-gray-600">Browse and participate in active polls</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Filter Buttons */}
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-1 shadow-lg">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === 'all' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === 'active' 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md' 
                    : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('ended')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === 'ended' 
                    ? 'bg-gradient-to-r from-gray-600 to-slate-600 text-white shadow-md' 
                    : 'text-gray-600 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                Ended
              </button>
            </div>
            
            {/* Poll Count */}
            <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg">
              <span className="text-sm font-semibold text-gray-700">
                {filteredPolls.length} poll{filteredPolls.length !== 1 ? 's' : ''} found
              </span>
            </div>
          </div>
        </div>

        {filteredPolls.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-16 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Vote className="h-10 w-10 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">No Polls Available</div>
              <div className="text-gray-600 mb-6">
                {filter === 'all' 
                  ? 'Check back later for new polls or create one to get started.'
                  : `No ${filter} polls found. Try selecting a different filter.`
                }
              </div>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200"
                >
                  View All Polls
                </button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredPolls.map((poll) => (
              <Card 
                key={poll.id} 
                className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer group"
                onClick={() => setSelectedPoll(selectedPoll === poll.id ? null : poll.id)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl pr-4 text-gray-900 group-hover:text-blue-600 transition-colors">
                      {poll.title}
                    </CardTitle>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${getStatusColor(poll.status)}`}>
                      {getStatusIcon(poll.status)}
                      {poll.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mt-3 leading-relaxed">{poll.description}</p>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Poll Options */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Vote className="h-4 w-4 text-blue-600" />
                      Voting Options:
                    </h4>
                    <div className="space-y-2">
                      {poll.options.map((option, index) => (
                        <div key={index} className="flex items-center p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:from-blue-50 hover:to-blue-100 transition-all duration-200 border border-gray-200 hover:border-blue-200">
                          <span className="text-sm text-gray-700 font-medium">{option}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Poll Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <div>
                        <span className="text-xs text-gray-500 block">Created</span>
                        <span className="text-sm font-semibold text-gray-900">{formatDate(poll.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <Clock className="h-5 w-5 text-green-600" />
                      <div>
                        <span className="text-xs text-gray-500 block">Ends</span>
                        <span className="text-sm font-semibold text-gray-900">{formatDate(poll.end_time)}</span>
                      </div>
                    </div>
                    {poll.total_votes && (
                      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                        <Users className="h-5 w-5 text-purple-600" />
                        <div>
                          <span className="text-xs text-gray-500 block">Total Votes</span>
                          <span className="text-sm font-semibold text-gray-900">{poll.total_votes.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                    {poll.participation && (
                      <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-orange-600" />
                        <div>
                          <span className="text-xs text-gray-500 block">Participation</span>
                          <span className="text-sm font-semibold text-gray-900">{poll.participation}%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sponsors */}
                  {poll.sponsors && poll.sponsors.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Award className="h-4 w-4 text-yellow-600" />
                        Sponsored by:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {poll.sponsors.map((sponsor, index) => (
                          <span key={index} className="px-3 py-1 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 text-xs rounded-full font-medium border border-yellow-200">
                            {sponsor}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-4">
                    <button 
                      className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-3 ${
                        poll.status === 'active' 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1' 
                          : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={poll.status !== 'active'}
                    >
                      {poll.status === 'active' ? (
                        <>
                          <Vote className="h-5 w-5" />
                          Vote Now
                          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      ) : (
                        <>
                          <Calendar className="h-5 w-5" />
                          Voting Closed
                        </>
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
