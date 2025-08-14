'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Vote, Clock, Users, Calendar, ArrowRight, Loader2 } from 'lucide-react';

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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ended':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Vote className="h-4 w-4" />;
      case 'draft':
        return <Clock className="h-4 w-4" />;
      case 'ended':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <div className="text-lg text-gray-600">Loading polls...</div>
          <div className="text-sm text-gray-400 mt-2">Fetching the latest polls and results</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">Error loading polls</div>
          <div className="text-gray-600">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Polls</h1>
          <p className="text-gray-600 mt-2">Browse and participate in active polls</p>
        </div>
        <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
          {polls.length} poll{polls.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {polls.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Vote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500 text-lg mb-2">No polls available</div>
            <div className="text-gray-400 text-sm">
              Check back later for new polls or create one to get started.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {polls.map((poll) => (
            <Card 
              key={poll.id} 
              className="hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 hover:border-gray-300"
              onClick={() => setSelectedPoll(selectedPoll === poll.id ? null : poll.id)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl pr-4">{poll.title}</CardTitle>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(poll.status)}`}>
                    {getStatusIcon(poll.status)}
                    {poll.status}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mt-2 line-clamp-2">{poll.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Poll Options */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Vote className="h-4 w-4" />
                    Options:
                  </h4>
                  <div className="space-y-2">
                    {poll.options.map((option, index) => (
                      <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <span className="text-sm text-gray-700">{option}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Poll Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <div className="font-medium">{formatDate(poll.created_at)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="text-gray-500">Ends:</span>
                      <div className="font-medium">{formatDate(poll.end_time)}</div>
                    </div>
                  </div>
                  {poll.total_votes && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <div>
                        <span className="text-gray-500">Total Votes:</span>
                        <div className="font-medium">{poll.total_votes.toLocaleString()}</div>
                      </div>
                    </div>
                  )}
                  {poll.participation && (
                    <div className="flex items-center gap-2">
                      <Vote className="h-4 w-4 text-gray-400" />
                      <div>
                        <span className="text-gray-500">Participation:</span>
                        <div className="font-medium">{poll.participation}%</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sponsors */}
                {poll.sponsors && poll.sponsors.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Sponsored by:</h4>
                    <div className="flex flex-wrap gap-2">
                      {poll.sponsors.map((sponsor, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {sponsor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="pt-4">
                  <button 
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                      poll.status === 'active' 
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md' 
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={poll.status !== 'active'}
                  >
                    {poll.status === 'active' ? (
                      <>
                        <Vote className="h-4 w-4" />
                        Vote Now
                        <ArrowRight className="h-4 w-4" />
                      </>
                    ) : (
                      'Voting Closed'
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
