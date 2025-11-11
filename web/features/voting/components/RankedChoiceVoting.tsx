'use client'

import { CheckCircle, AlertCircle, Info } from 'lucide-react'
import React, { useState, useEffect } from 'react';

import { useVotingIsVoting } from '@/features/voting/lib/store'

import type { PollOption } from '../types'

type RankedChoiceVotingProps = {
  pollId: string
  title: string
  description?: string
  options: PollOption[]
  onVote: (pollId: string, rankings: number[]) => Promise<void>
  isVoting: boolean
  hasVoted?: boolean
  userVote?: string[]
}

export default function RankedChoiceVoting({
  pollId,
  title,
  description,
  options,
  onVote,
  isVoting,
  hasVoted = false,
  userVote
}: RankedChoiceVotingProps) {
  const storeIsVoting = useVotingIsVoting()
  const [rankings, setRankings] = useState<{ [optionId: string]: number }>({})
  const [error, setError] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const effectiveIsVoting = storeIsVoting || isVoting

  // Initialize rankings from user's previous vote or empty
  useEffect(() => {
    if (userVote && userVote.length > 0) {
      // Convert string array to rankings object
      const rankingsFromVote: { [optionId: string]: number } = {}
      userVote.forEach((optionId, index) => {
        rankingsFromVote[optionId] = index + 1
      })
      setRankings(rankingsFromVote)
    } else {
      const initialRankings: { [optionId: string]: number } = {}
      options.forEach(option => {
        initialRankings[String(option.id)] = 0 // 0 means unranked
      })
      setRankings(initialRankings)
    }
  }, [userVote, options])

  const handleRankClick = (optionId: string) => {
    if (hasVoted || effectiveIsVoting) return

    setError(null)
    const currentRank = rankings[optionId] || 0
    const maxRank = Math.max(...Object.values(rankings).filter(r => r > 0), 0)
    
    let newRank: number
    
    if (currentRank === 0) {
      // First time selecting this option - assign next available rank
      newRank = maxRank + 1
    } else {
      // Option already ranked - cycle through ranks
      newRank = currentRank >= maxRank ? 0 : currentRank + 1
    }
    
    const newRankings = { 
      ...rankings, 
      [optionId]: newRank 
    }
    setRankings(newRankings)
  }

  const handleSubmit = async () => {
    if (hasVoted || effectiveIsVoting) return

    // Validate that all options are ranked
    const rankedOptions = Object.values(rankings).filter(r => r > 0)
    const expectedRanks = options.length
    
    if (rankedOptions.length !== expectedRanks) {
      setError(`Please rank all ${expectedRanks} options`)
      return
    }

    // Check for duplicate ranks
    const uniqueRanks = new Set(rankedOptions)
    if (uniqueRanks.size !== rankedOptions.length) {
      setError('Each option must have a unique rank')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Validate rankings before submission
      const validRankings: { [optionId: string]: number } = {}
      const usedRanks = new Set<number>()
      
      for (const [optionId, rank] of Object.entries(rankings)) {
        if (options.some(option => option.id === optionId) && rank > 0) {
          if (usedRanks.has(rank)) {
            throw new Error('Duplicate ranks detected')
          }
          validRankings[optionId] = rank
          usedRanks.add(rank)
        }
      }
      
      if (Object.keys(validRankings).length === 0) {
        throw new Error('Please rank at least one option')
      }
      
      const orderedRankings = Object.entries(validRankings)
        .sort(([, rankA], [, rankB]) => rankA - rankB)
        .map(([optionId]) => optionId)

      // Track analytics with poll ID using SSR-safe access
      const { safeWindow } = await import('@/lib/utils/ssr-safe');
      const gtag = safeWindow(w => w.gtag);
      if (gtag) {
        gtag('event', 'vote_submitted', {
          poll_id: pollId,
          rankings: orderedRankings,
          voting_method: 'ranked_choice',
          ranked_options_count: orderedRankings.length
        })
      }
      
      const numericRankings = orderedRankings
        .map((optionId) => Number(optionId))
        .filter((value) => Number.isInteger(value))
      
      if (hasVoted || effectiveIsVoting) {
        return
      }
      await onVote(pollId, numericRankings)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit vote')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRankDisplay = (optionId: string) => {
    const rank = rankings[optionId] || 0
    if (rank === 0) return ''
    return rank.toString()
  }

  const getRankClass = (optionId: string) => {
    const rank = rankings[optionId] || 0
    if (rank === 0) return 'bg-gray-100 text-gray-400'
    if (rank === 1) return 'bg-blue-500 text-white'
    if (rank === 2) return 'bg-green-500 text-white'
    if (rank === 3) return 'bg-yellow-500 text-white'
    if (rank === 4) return 'bg-purple-500 text-white'
    if (rank === 5) return 'bg-pink-500 text-white'
    return 'bg-gray-500 text-white'
  }

  const getRankLabel = (rank: number) => {
    const labels = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th']
    return labels[rank] || `${rank}th`
  }

  const isDisabled = hasVoted || effectiveIsVoting || isSubmitting

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
            {description && (
              <p className="text-gray-600">{description}</p>
            )}
          </div>
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Info className="w-5 h-5" />
            <span className="text-sm font-medium">How it works</span>
          </button>
        </div>

        {/* Ranked Choice Explanation */}
        {showExplanation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-900 mb-2">How Ranked Choice Voting Works</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• <strong>Rank all options</strong> from 1st (most preferred) to last (least preferred)</p>
              <p>• <strong>No spoiler effect:</strong> Vote for your favorite without helping your least favorite win</p>
              <p>• <strong>Majority support:</strong> Winner always has majority support (eventually)</p>
              <p>• <strong>Instant runoff:</strong> If no option gets 50%+ of 1st choice votes, the lowest option is eliminated and their votes transfer to 2nd choices</p>
            </div>
          </div>
        )}

        {/* Voting Method Badge */}
        <div className="flex items-center space-x-2">
          <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
            🏆 Ranked Choice Voting
          </div>
          <span className="text-sm text-gray-500">
            Click to rank your preferences (1 = most preferred)
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Voting Interface */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {options.map((option: PollOption, index: number) => (
            <div
              key={`${String(option.id)}-${index}`}
              onClick={() => handleRankClick(String(option.id))}
              className={`
                relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                ${isDisabled 
                  ? 'cursor-not-allowed opacity-60' 
                  : 'hover:border-blue-300 hover:shadow-md'
                }
                ${(rankings[String(option.id)] ?? 0) > 0 ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}
              `}
            >
              {/* Rank Display */}
              <div className={`
                absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                ${getRankClass(String(option.id))}
                transition-all duration-200
              `}>
                {getRankDisplay(String(option.id))}
              </div>

              {/* Option Content */}
              <div className="pr-8">
                <h3 className="font-semibold text-gray-900 mb-1">{String((option as any).text ?? '')}</h3>
                {(option as any).option_text && (
                  <p className="text-sm text-gray-600">{String((option as any).option_text)}</p>
                )}
              </div>

              {/* Rank Label */}
              {(rankings[String(option.id)] ?? 0) > 0 && (
                <div className="mt-2 text-xs font-medium text-blue-600">
                  {getRankLabel(rankings[String(option.id)] ?? 0)} choice
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">Voting Instructions</span>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Click on an option to assign it a rank (1st, 2nd, 3rd, etc.)</p>
            <p>• Click again to change the rank or remove it</p>
            <p>• You must rank all options to submit your vote</p>
            <p>• 1st choice = most preferred, last choice = least preferred</p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-6 flex justify-center">
          {hasVoted ? (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Vote submitted successfully!</span>
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isDisabled || Object.values(rankings).filter(r => r > 0).length !== options.length}
              data-testid="start-voting-button"
              className={`
                flex items-center space-x-2 px-8 py-3 rounded-lg font-medium transition-colors
                ${isDisabled || Object.values(rankings).filter(r => r > 0).length !== options.length
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                }
              `}
            >
              <CheckCircle className="w-5 h-5" />
              <span>{isSubmitting ? 'Submitting Vote...' : 'Submit Vote'}</span>
            </button>
          )}
        </div>

        {/* Progress Indicator */}
        {!hasVoted && (
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-600">
              {Object.values(rankings).filter(r => r > 0).length} of {options.length} options ranked
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(Object.values(rankings).filter(r => r > 0).length / options.length) * 100}%` 
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Current Rankings Summary */}
      {Object.values(rankings).filter(r => r > 0).length > 0 && !hasVoted && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Your Current Rankings</h3>
          <div className="space-y-2">
            {options
              .filter(option => (rankings[String(option.id)] ?? 0) > 0)
              .sort((a, b) => (rankings[String(a.id)] ?? 0) - (rankings[String(b.id)] ?? 0))
              .map(option => {
                const optionId = String(option.id)
                return (
                <div key={optionId} className="flex items-center space-x-3">
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white
                    ${getRankClass(optionId)}
                  `}>
                    {rankings[optionId] ?? 0}
                  </div>
                  <span className="text-gray-900">{String((option as any).text ?? '')}</span>
                </div>
                )
              })
            }
          </div>
        </div>
      )}
    </div>
  )
}
