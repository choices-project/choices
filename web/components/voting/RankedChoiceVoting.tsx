'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { CheckCircle, AlertCircle, Info, Vote } from 'lucide-react'

interface PollOption {
  id: string
  text: string
  description?: string
}

interface RankedChoiceVotingProps {
  pollId: string
  title: string
  description?: string
  options: PollOption[]
  onVote: (rankings: { [optionId: string]: number }) => Promise<void>
  isVoting: boolean
  hasVoted?: boolean
  userVote?: { [optionId: string]: number }
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
  const [rankings, setRankings] = useState<{ [optionId: string]: number }>({})
  const [error, setError] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize rankings from user's previous vote or empty
  useEffect(() => {
    if (userVote) {
      setRankings(userVote)
    } else {
      const initialRankings: { [optionId: string]: number } = {}
      options.forEach(option => {
        initialRankings[option.id] = 0 // 0 means unranked
      })
      setRankings(initialRankings)
    }
  }, [userVote, options])

  const handleRankClick = (optionId: string) => {
    if (hasVoted || isVoting) return

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
    
    const newRankings = { ...rankings, [optionId]: newRank }
    setRankings(newRankings)
  }

  const handleSubmit = async () => {
    if (hasVoted || isVoting) return

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
      await onVote(rankings)
    } catch (err: any) {
      setError(err.message || 'Failed to submit vote')
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

  const isDisabled = hasVoted || isVoting || isSubmitting

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
          {options.map((option, index: any) => (
            <div
              key={option.id}
              onClick={() => handleRankClick(option.id)}
              className={`
                relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                ${isDisabled 
                  ? 'cursor-not-allowed opacity-60' 
                  : 'hover:border-blue-300 hover:shadow-md'
                }
                ${rankings[option.id] > 0 ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}
              `}
            >
              {/* Rank Display */}
              <div className={`
                absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                ${getRankClass(option.id)}
                transition-all duration-200
              `}>
                {getRankDisplay(option.id)}
              </div>

              {/* Option Content */}
              <div className="pr-8">
                <h3 className="font-semibold text-gray-900 mb-1">{option.text}</h3>
                {option.description && (
                  <p className="text-sm text-gray-600">{option.description}</p>
                )}
              </div>

              {/* Rank Label */}
              {rankings[option.id] > 0 && (
                <div className="mt-2 text-xs font-medium text-blue-600">
                  {getRankLabel(rankings[option.id])} choice
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Vote className="w-5 h-5 text-gray-600" />
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
              className={`
                flex items-center space-x-2 px-8 py-3 rounded-lg font-medium transition-colors
                ${isDisabled || Object.values(rankings).filter(r => r > 0).length !== options.length
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                }
              `}
            >
              <Vote className="w-5 h-5" />
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
              .filter(option => rankings[option.id] > 0)
              .sort((a, b) => rankings[a.id] - rankings[b.id])
              .map(option => (
                <div key={option.id} className="flex items-center space-x-3">
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white
                    ${getRankClass(option.id)}
                  `}>
                    {rankings[option.id]}
                  </div>
                  <span className="text-gray-900">{option.text}</span>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  )
}
