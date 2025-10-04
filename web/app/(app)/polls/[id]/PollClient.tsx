'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Share2, CheckCircle, AlertCircle } from 'lucide-react';
import VotingInterface from '../../../../features/voting/components/VotingInterface';
import PostCloseBanner from '@/components/PostCloseBanner';
import ModeSwitch from '@/components/ModeSwitch';
import type { ResultsMode } from '@/components/ModeSwitch';

type VoteResponse = { ok: boolean; id?: string; error?: string };

type Poll = {
  id: string;
  title: string;
  description: string;
  options: string[];
  votingMethod: string;
  totalvotes: number;
  endtime: string;
  status: string;
  category: string;
  privacyLevel: string;
  createdAt: string;
  baselineAt?: string;
  lockedAt?: string;
  allowPostClose?: boolean;
};

type PollResults = {
  totalVotes: number;
  results: Record<string, number>;
  participation: number;
  demographics?: {
    ageGroups: Record<string, number>;
    locations: Record<string, number>;
  };
};

type PollClientProps = {
  poll: Poll;
};

export default function PollClient({ poll }: PollClientProps) {
  const router = useRouter();
  const params = useParams();
  const pollId = params.id as string;

  const [results, setResults] = useState<PollResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [showVotingInterface, setShowVotingInterface] = useState(false);
  const [resultsMode, setResultsMode] = useState<ResultsMode>('live');
  const [copied, setCopied] = useState(false);

  // Client-side vote status check
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/polls/${poll.id}/vote`, { 
          method: 'HEAD', 
          cache: 'no-store'
        });
        if (!cancelled) setHasVoted(res.status === 200);
      } catch {
        // Swallow — treat as not voted
      }
    })();
    return () => { cancelled = true; };
  }, [poll.id]);

  const fetchPollData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch results data
      const resultsResponse = await fetch(`/api/polls/${pollId}/results`);
      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json();
        setResults(resultsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load poll data');
    } finally {
      setLoading(false);
    }
  }, [pollId]);

  useEffect(() => {
    if (pollId) {
      fetchPollData();
    }
  }, [pollId, fetchPollData]);

  const handleVote = async (choice: number): Promise<VoteResponse> => {
    if (!poll) {
      return {
        ok: false,
        error: 'No poll found'
      };
    }

    console.log('Submitting vote for poll:', poll.id, 'choice:', choice);
    setIsVoting(true);
    try {
      // Submit vote to API
      const response = await fetch(`/api/polls/${poll.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ choice }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit vote');
      }

      const result = await response.json();
      
      // Update UI state
      setHasVoted(true);
      // Refresh results
      void fetchPollData();
      
      return {
        ok: true,
        id: result.voteId || 'vote-id'
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit vote';
      setError(errorMessage);
      return {
        ok: false,
        error: errorMessage
      };
    } finally {
      setIsVoting(false);
    }
  };

  const handleShare = async () => {
    // Use SSR-safe browser API access
    const { safeWindow, safeNavigator } = await import('../../../../shared/utils/lib/ssr-safe');
    const origin = safeWindow(w => w.location?.origin, '');
    const url = `${origin}/polls/${pollId}`;
    try {
      const clipboard = safeNavigator(n => n.clipboard);
      if (clipboard?.writeText) {
        await clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleStartVoting = () => {
    setShowVotingInterface(true);
  };

  const formatVotingMethod = (method: string) => {
    switch (method) {
      case 'single':
        return 'Single Choice';
      case 'approval':
        return 'Approval Voting';
      case 'ranked':
        return 'Ranked Choice';
      case 'range':
        return 'Range Voting';
      case 'quadratic':
        return 'Quadratic Voting';
      default:
        return method;
    }
  };

  const handleBack = () => {
    router.push('/polls');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };


  const isPollActive = poll.status === 'active';
  const isPollClosed = poll.status === 'closed';
  const isPollLocked = poll.status === 'locked';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8" data-testid="poll-details">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Polls</span>
          </Button>
        </div>

        {/* Poll Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="poll-title">
                {poll.title}
              </h1>
              {poll.description && (
                <p className="text-gray-600 text-lg" data-testid="poll-description">{poll.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <Badge 
                variant={isPollActive ? "default" : isPollClosed ? "secondary" : "destructive"}
                className="text-sm"
              >
                {isPollActive ? 'Active' : isPollClosed ? 'Closed' : isPollLocked ? 'Locked' : 'Unknown'}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex items-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span>{copied ? 'Copied!' : 'Share'}</span>
              </Button>
            </div>
          </div>

          {/* Poll Metadata */}
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {poll.privacyLevel}
            </span>
            <span>•</span>
            <span data-testid="voting-method">{formatVotingMethod(poll.votingMethod)}</span>
            <span>•</span>
            <span>Ends {formatDate(poll.endtime)}</span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Voting Interface */}
        {isPollActive && !hasVoted && (
          <Card className="mb-8">
            {!showVotingInterface ? (
              <>
                <CardHeader>
                  <CardTitle data-testid="voting-section-title">Ready to Vote?</CardTitle>
                  <CardDescription>Click the button below to start voting</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button
                    onClick={handleStartVoting}
                    size="lg"
                    className="px-8 py-3"
                    data-testid="start-voting-button"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Start Voting
                  </Button>
                </CardContent>
              </>
            ) : (
              <>
                <CardHeader>
                  <CardTitle>Cast Your Vote</CardTitle>
                  <CardDescription>Select your preferred option below</CardDescription>
                </CardHeader>
                <CardContent data-testid="voting-form">
                  <VotingInterface
                    poll={{
                      id: poll.id,
                      title: poll.title,
                      description: poll.description,
                      options: poll.options.map((option: string, index: number) => ({
                        id: index.toString(),
                        text: option
                      })),
                      votingMethod: poll.votingMethod,
                      totalVotes: poll.totalvotes,
                      endtime: poll.endtime
                    }}
                    onVote={handleVote}
                    isVoting={isVoting}
                    hasVoted={hasVoted}
                  />
                </CardContent>
              </>
            )}
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="text-center py-8">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Loading results...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {results && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Results</CardTitle>
                <ModeSwitch
                  mode={resultsMode}
                  onModeChange={setResultsMode}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {results.totalVotes}
                    </div>
                    <div className="text-sm text-gray-600">Total Votes</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {results.participation}%
                    </div>
                    <div className="text-sm text-gray-600">Participation</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {poll.options.length}
                    </div>
                    <div className="text-sm text-gray-600">Options</div>
                  </div>
                </div>

                {/* Results by option */}
                <div className="space-y-3">
                  {poll.options.map((option: string, index: number) => {
                    const votes = results.results[`option_${index + 1}`] || 0;
                    const percentage = results.totalVotes > 0 
                      ? Math.round((votes / results.totalVotes) * 100) 
                      : 0;
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{option}</span>
                          <span className="text-gray-600">
                            {votes} votes ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Post-Close Banner */}
        {isPollClosed && poll.allowPostClose && (
          <PostCloseBanner pollStatus={poll.status as 'closed' | 'locked' | 'post-close'} />
        )}
      </div>
    </div>
  );
}
