/**
 * @fileoverview Offline Voting Component
 * 
 * Displays offline votes for a specific poll.
 * Shows votes queued while offline with timestamps.
 * 
 * @author Choices Platform Team
 * @migrated Zustand migration complete - November 4, 2025
 */

'use client'

import { WifiOff, CheckCircle, AlertCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react';

import { isOfflineVoteAction, usePWAStore, type OfflineVoteActionData } from '@/lib/stores/pwaStore'
import { logger } from '@/lib/utils/logger'
import type { OfflineVoteRecord } from '@/types/pwa';

type OfflineVotingProps = {
  /** Poll ID to filter votes for */
  pollId: string
  /** Additional CSS classes */
  className?: string
}

/**
 * Offline Voting Component
 * 
 * Displays votes queued for a specific poll while offline.
 * Filters store's queued actions to show only votes for this poll.
 * Falls back to demo votes if no real votes exist.
 * 
 * @param props - Component props
 * @returns Offline voting UI or null if no votes
 */
type OfflineVoteDisplay = OfflineVoteRecord & {
  id: string;
};

export default function OfflineVoting({ pollId, className = '' }: OfflineVotingProps) {
  const { offline } = usePWAStore()
  const [offlineVotes, setOfflineVotes] = useState<OfflineVoteDisplay[]>([])
  const [_isVoting, setIsVoting] = useState(false)
  
  // Get real offline votes for this poll from store
  const pollVotes = useMemo(
    () =>
      offline.offlineData.queuedActions
        .filter(isOfflineVoteAction)
        .filter((action) => action.data.pollId === pollId),
    [offline.offlineData.queuedActions, pollId]
  )

  useEffect(() => {
    // Use real votes from store, fallback to mock if none exist
    if (pollVotes.length > 0) {
      setOfflineVotes(
        pollVotes.map((action) => {
          const metadata = action.data.metadata;
          return {
            id: action.id,
            pollId,
            choice: action.data.choice,
            timestamp: new Date(action.timestamp).getTime(),
            ...(metadata ? { metadata } : {}),
          };
        })
      )
    } else {
      // Keep mock votes for demo purposes if no real votes
      const mockVotes: OfflineVoteDisplay[] = [
        { id: '1', pollId, choice: 0, timestamp: Date.now() - 300000 },
        { id: '2', pollId, choice: 1, timestamp: Date.now() - 180000 }
      ]
      setOfflineVotes(mockVotes)
    }
  }, [pollId, pollVotes])

  const _handleVote = (choice: number) => {
    setIsVoting(true)
    try {
      // Simulate storing offline vote
      const newVote = {
        id: Date.now().toString(),
        pollId,
        choice,
        timestamp: Date.now()
      }
      setOfflineVotes(prev => [...prev, newVote])
    } catch (error) {
      logger.error('Vote failed:', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setIsVoting(false)
    }
  }

  if (offlineVotes.length === 0) {
    return null
  }

  return (
    <div className={`bg-orange-50 border border-orange-200 rounded-lg p-4 ${className}`} data-testid="offline-voting">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <WifiOff className="w-5 h-5 text-orange-600" />
          <h3 className="text-sm font-medium text-orange-800">Offline Voting</h3>
        </div>
        <span className="text-sm text-orange-700">{offlineVotes.length} votes</span>
      </div>

      <div className="space-y-2">
        {offlineVotes.map((vote) => (
          <div key={vote.id} className="flex items-center justify-between p-2 bg-white rounded border">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-700">
                Vote for Option {vote.choice + 1}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {new Date(vote.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 p-3 bg-orange-100 rounded border">
        <div className="flex items-center space-x-2 text-orange-800">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Votes will sync when online</span>
        </div>
      </div>
    </div>
  )
}
