'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

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
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'ended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading polls...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">All Polls</h1>
        <div className="text-sm text-gray-600">
          {polls.length} poll{polls.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {polls.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500 text-lg">No polls available</div>
            <div className="text-gray-400 text-sm mt-2">
              Check back later for new polls or create one to get started.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {polls.map((poll) => (
            <Card key={poll.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{poll.title}</CardTitle>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(poll.status)}`}>
                    {poll.status}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mt-2">{poll.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Poll Options */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Options:</h4>
                  <div className="space-y-2">
                    {poll.options.map((option, index) => (
                      <div key={index} className="flex items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">{option}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Poll Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <div className="font-medium">{formatDate(poll.created_at)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Ends:</span>
                    <div className="font-medium">{formatDate(poll.end_time)}</div>
                  </div>
                  {poll.total_votes && (
                    <div>
                      <span className="text-gray-500">Total Votes:</span>
                      <div className="font-medium">{poll.total_votes.toLocaleString()}</div>
                    </div>
                  )}
                  {poll.participation && (
                    <div>
                      <span className="text-gray-500">Participation:</span>
                      <div className="font-medium">{poll.participation}%</div>
                    </div>
                  )}
                </div>

                {/* Sponsors */}
                {poll.sponsors && poll.sponsors.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Sponsored by:</h4>
                    <div className="flex flex-wrap gap-2">
                      {poll.sponsors.map((sponsor, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {sponsor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="pt-4">
                  <button 
                    className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                      poll.status === 'active' 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={poll.status !== 'active'}
                  >
                    {poll.status === 'active' ? 'Vote Now' : 'Voting Closed'}
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
