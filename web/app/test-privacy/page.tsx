'use client';

import React, { useState } from 'react';
import { CreatePollForm, CreatePollData } from '@/components/polls/CreatePollForm';
import { PrivacyLevelIndicator } from '@/components/privacy/PrivacyLevelIndicator';
import { PrivacyLevel, HybridPrivacyManager } from '@/lib/hybrid-privacy';
import { devLog } from '@/lib/logger';

interface TestPoll {
  id: string;
  title: string;
  description: string;
  options: string[];
  privacy_level: PrivacyLevel;
  category?: string;
  tags: string[];
  total_votes: number;
  created_at: string;
}

export default function TestPrivacyPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [polls, setPolls] = useState<TestPoll[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<TestPoll | null>(null);
  const [voteChoice, setVoteChoice] = useState<number>(0);
  const [votePrivacyLevel, setVotePrivacyLevel] = useState<PrivacyLevel>('public');

  const handleCreatePoll = async (pollData: CreatePollData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pollData)
      });

      if (!response.ok) {
        throw new Error('Failed to create poll');
      }

      const result = await response.json();
      
      // Add the new poll to our list
      const newPoll: TestPoll = {
        id: result.poll.poll_id,
        title: result.poll.title,
        description: result.poll.description,
        options: result.poll.options,
        privacy_level: result.poll.privacy_level,
        category: result.poll.category,
        tags: result.poll.tags,
        total_votes: 0,
        created_at: new Date().toISOString()
      };

      setPolls(prev => [newPoll, ...prev]);
      setShowCreateForm(false);
      
      devLog('Poll created successfully:', result);
    } catch (error) {
      console.error('Error creating poll:', error);
      alert('Failed to create poll. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (pollId: string) => {
    if (!voteChoice || voteChoice < 1) {
      alert('Please select an option to vote for.');
      return;
    }

    try {
      const response = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          choice: voteChoice,
          privacy_level: votePrivacyLevel
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit vote');
      }

      const result = await response.json();
      
      // Update poll vote count
      setPolls(prev => prev.map(poll => 
        poll.id === pollId 
          ? { ...poll, total_votes: poll.total_votes + 1 }
          : poll
      ));

      setSelectedPoll(null);
      setVoteChoice(0);
      setVotePrivacyLevel('public');
      
      devLog('Vote submitted successfully:', result);
      alert(`Vote submitted successfully! Response time: ${result.response_time}ms`);
    } catch (error) {
      console.error('Error submitting vote:', error);
      alert(`Failed to submit vote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getRecommendedPrivacyLevel = (pollData: CreatePollData) => {
    return HybridPrivacyManager.getRecommendedPrivacyLevel({
      title: pollData.title,
      description: pollData.description,
      category: pollData.category
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🔐 Hybrid Privacy System Test
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Test the new hybrid privacy system with different privacy levels, 
            smart recommendations, and privacy-aware voting.
          </p>
        </div>

        {/* Create Poll Button */}
        <div className="text-center mb-8">
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New Poll
          </button>
        </div>

        {/* Create Poll Form */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CreatePollForm
                onSubmit={handleCreatePoll}
                onCancel={() => setShowCreateForm(false)}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}

        {/* Polls List */}
        <div className="grid gap-6">
          {polls.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No polls yet</h3>
              <p className="text-gray-600">Create your first poll to test the privacy system!</p>
            </div>
          ) : (
            polls.map((poll) => (
              <div key={poll.id} className="bg-white rounded-lg shadow-md p-6">
                {/* Poll Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {poll.title}
                    </h3>
                    {poll.description && (
                      <p className="text-gray-600 mb-2">{poll.description}</p>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <PrivacyLevelIndicator level={poll.privacy_level} size="sm" />
                      {poll.category && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                          {poll.category}
                        </span>
                      )}
                      <span className="text-sm text-gray-500">
                        {poll.total_votes} votes
                      </span>
                    </div>
                    {poll.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {poll.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Poll Options */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Options:</h4>
                  <div className="space-y-2">
                    {poll.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
                        <span className="text-gray-700">{option}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vote Section */}
                <div className="border-t pt-4">
                  <button
                    onClick={() => setSelectedPoll(selectedPoll?.id === poll.id ? null : poll)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    {selectedPoll?.id === poll.id ? 'Cancel Vote' : 'Vote on this Poll'}
                  </button>
                </div>

                {/* Vote Form */}
                {selectedPoll?.id === poll.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Cast Your Vote</h4>
                    
                    {/* Vote Choice */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select your choice:
                      </label>
                      <div className="space-y-2">
                        {poll.options.map((option, index) => (
                          <label key={index} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="voteChoice"
                              value={index + 1}
                              checked={voteChoice === index + 1}
                              onChange={(e) => setVoteChoice(Number(e.target.value))}
                              className="text-blue-600"
                            />
                            <span className="text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Privacy Level for Vote */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vote Privacy Level:
                      </label>
                      <select
                        value={votePrivacyLevel}
                        onChange={(e) => setVotePrivacyLevel(e.target.value as PrivacyLevel)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="public">Public Vote</option>
                        <option value="private">Private Vote</option>
                        <option value="high-privacy">High Privacy Vote</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {votePrivacyLevel === 'public' && 'Fast voting with basic privacy'}
                        {votePrivacyLevel === 'private' && 'Enhanced privacy with authentication'}
                        {votePrivacyLevel === 'high-privacy' && 'Maximum privacy with cryptographic guarantees'}
                      </p>
                    </div>

                    {/* Submit Vote */}
                    <button
                      onClick={() => handleVote(poll.id)}
                      disabled={!voteChoice}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Submit Vote
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Privacy System Info */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🔐 Privacy System Overview</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl mb-2">🌐</div>
              <h3 className="font-semibold text-gray-900 mb-2">Public Polls</h3>
              <p className="text-sm text-gray-600 mb-2">Fast voting with basic privacy protection</p>
              <div className="text-xs text-gray-500">
                Response: ~200ms | Cost: 1.0x
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl mb-2">🔒</div>
              <h3 className="font-semibold text-gray-900 mb-2">Private Polls</h3>
              <p className="text-sm text-gray-600 mb-2">Enhanced privacy with user authentication</p>
              <div className="text-xs text-gray-500">
                Response: ~250ms | Cost: 1.2x
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl mb-2">🛡️</div>
              <h3 className="font-semibold text-gray-900 mb-2">High Privacy Polls</h3>
              <p className="text-sm text-gray-600 mb-2">Maximum privacy with cryptographic guarantees</p>
              <div className="text-xs text-gray-500">
                Response: ~400ms | Cost: 3.0x
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
