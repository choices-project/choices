'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Share2, CheckCircle, AlertCircle } from 'lucide-react';
import VotingInterface from '@/components/VotingInterface';
import PostCloseBanner from '@/components/PostCloseBanner';
import ModeSwitch from '@/components/ModeSwitch';
import type { ResultsMode } from '@/components/ModeSwitch';
import type { VoteResponse } from '@/lib/vote/types';

interface Poll {
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
}

interface PollResults {
  totalVotes: number;
  uniqueVoters: number;
  options: Array<{
    id: string;
    option: string;
    votes: number;
    percentage: number;
    baselineVotes?: number;
    baselinePercentage?: number;
    drift?: number;
  }>;
  baseline?: {
    totalVotes: number;
    options: Array<{
      id: string;
      option: string;
      votes: number;
      percentage: number;
    }>;
  };
  lastUpdated: string;
}

export default function PollPage() {
  const params = useParams();
  const router = useRouter();
  const pollId = params.id as string;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<PollResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [resultsMode, setResultsMode] = useState<ResultsMode>('live');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (pollId) {
      fetchPollData();
    }
  }, [pollId]);

  const fetchPollData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch poll data
      const pollResponse = await fetch(`/api/polls/${pollId}`);
      if (!pollResponse.ok) {
        throw new Error('Poll not found');
      }
      const pollData = await pollResponse.json();
      setPoll(pollData);

      // Fetch results data
      const resultsResponse = await fetch(`/api/polls/${pollId}/results`);
      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json();
        setResults(resultsData);
      }

      // Check if user has voted
      const voteResponse = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'HEAD'
      });
      setHasVoted(voteResponse.ok);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load poll');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (choice: number): Promise<VoteResponse> => {
    if (!poll) {
      return {
        success: false,
        message: 'No poll found',
        pollId: pollId || ''
      };
    }

    setIsVoting(true);
    try {
      const response = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ choice }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit vote');
      }

      const result = await response.json();
      setHasVoted(true);
      // Refresh results
      await fetchPollData();
      
      return {
        success: true,
        message: 'Vote submitted successfully',
        pollId: pollId,
        voteId: result.voteId,
        ...result
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit vote';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
        pollId: pollId
      };
    } finally {
      setIsVoting(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusBadge = () => {
    if (!poll) return null;

    switch (poll.status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>;
      case 'locked':
        return <Badge variant="destructive">Locked</Badge>;
      default:
        return <Badge variant="outline">{poll.status}</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      politics: 'bg-red-100 text-red-800 border-red-200',
      social: 'bg-blue-100 text-blue-800 border-blue-200',
      technology: 'bg-purple-100 text-purple-800 border-purple-200',
      entertainment: 'bg-pink-100 text-pink-800 border-pink-200',
      sports: 'bg-green-100 text-green-800 border-green-200',
      education: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      health: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      environment: 'bg-teal-100 text-teal-800 border-teal-200',
      business: 'bg-gray-100 text-gray-800 border-gray-200',
      general: 'bg-slate-100 text-slate-800 border-slate-200'
    };
    return colors[category] || colors.general;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Loading Poll...</h2>
        </div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Poll Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The poll you are looking for does not exist.'}</p>
          <Button onClick={() => router.push('/polls')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Polls
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/polls')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Polls
          </Button>

          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{poll.title}</h1>
              <p className="text-gray-600 text-lg">{poll.description}</p>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              {getStatusBadge()}
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex items-center space-x-1"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                <span>{copied ? 'Copied!' : 'Share'}</span>
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <Badge variant="outline" className={getCategoryColor(poll.category)}>
              {poll.category}
            </Badge>
            <span className="capitalize">{poll.privacyLevel}</span>
            <span>•</span>
            <span>{poll.votingMethod} voting</span>
            <span>•</span>
            <span>Ends {new Date(poll.endtime).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Post-Close Banner */}
        {(poll.status === 'closed' || poll.status === 'locked' || poll.status === 'post-close') && (
          <PostCloseBanner
            pollStatus={poll.status as 'closed' | 'locked' | 'post-close'}
            baselineAt={poll.baselineAt ? new Date(poll.baselineAt) : new Date()}
            lockedAt={poll.lockedAt ? new Date(poll.lockedAt) : new Date()}
            allowPostClose={poll.allowPostClose ?? false}
            className="mb-6"
          />
        )}

        {/* Mode Switch */}
        {results && (poll.status === 'closed' || poll.status === 'locked' || poll.status === 'post-close') && (
          <ModeSwitch
            mode={resultsMode}
            onModeChange={setResultsMode}
            hasBaseline={!!results.baseline}
            isLocked={poll.status === 'locked'}
            className="mb-6"
          />
        )}

        {/* Voting Interface */}
        {poll.status === 'active' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Cast Your Vote</CardTitle>
              <CardDescription>
                Select your preferred option below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VotingInterface
                poll={{
                  id: poll.id,
                  title: poll.title,
                  description: poll.description,
                  options: poll.options,
                  votingMethod: poll.votingMethod,
                  totalvotes: poll.totalvotes,
                  endtime: poll.endtime,
                  status: poll.status
                }}
                onVote={handleVote}
                isVoting={isVoting}
                hasVoted={hasVoted}
                showResults={false}
              />
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Poll Results</CardTitle>
              <CardDescription>
                {resultsMode === 'live' && 'Real-time results as votes are cast'}
                {resultsMode === 'baseline' && 'Results at the time the poll was closed'}
                {resultsMode === 'drift' && 'Changes since the poll was closed'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{results.totalVotes} total votes</span>
                  <span>{results.uniqueVoters} unique voters</span>
                  <span>Updated {new Date(results.lastUpdated).toLocaleTimeString()}</span>
                </div>

                <div className="space-y-3">
                  {results.options.map((option, index) => {
                    const displayVotes = resultsMode === 'baseline' && results.baseline 
                      ? results.baseline.options[index]?.votes || 0
                      : option.votes;
                    const displayPercentage = resultsMode === 'baseline' && results.baseline
                      ? results.baseline.options[index]?.percentage || 0
                      : option.percentage;

                    return (
                      <div key={option.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{option.option}</span>
                          <span className="text-gray-600">
                            {displayVotes} votes ({displayPercentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${displayPercentage}%` }}
                          />
                        </div>
                        {resultsMode === 'drift' && option.drift !== undefined && (
                          <div className="text-xs text-gray-500">
                            Drift: {option.drift > 0 ? '+' : ''}{(option.drift * 100).toFixed(1)}%
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
