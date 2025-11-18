'use client'

import { CheckCircle, AlertCircle, Info } from 'lucide-react'
import React, { useState, useEffect } from 'react';

import { useVotingIsVoting } from '@/features/voting/lib/store'

import type { PollOption } from '../types'

type MultipleChoiceVotingProps = {
  pollId: string
  title: string
  description?: string
  options: PollOption[]
  onVote: (selections: number[]) => Promise<void>
  isVoting: boolean
  hasVoted?: boolean
  userVote?: number[]
  maxSelections?: number
}

export default function MultipleChoiceVoting({
  pollId,
  title,
  description,
  options,
  onVote,
  isVoting,
  hasVoted = false,
  userVote,
  maxSelections
}: MultipleChoiceVotingProps) {
  const storeIsVoting = useVotingIsVoting()
  const [selectedOptions, setSelectedOptions] = useState<number[]>(userVote ?? [])
  const [error, setError] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const effectiveIsVoting = storeIsVoting || isVoting

  // Initialize from user's previous vote
  useEffect(() => {
    if (userVote !== undefined) {
      setSelectedOptions(userVote)
    }
  }, [userVote])

  const handleOptionToggle = (optionIndex: number) => {
    if (hasVoted || effectiveIsVoting) return
    
    setError(null)
    
    setSelectedOptions(prev => {
      const isSelected = prev.includes(optionIndex)
      if (isSelected) {
        // Remove from selection
        return prev.filter(idx => idx !== optionIndex)
      } else {
        // Add to selection (check max selections limit)
        if (maxSelections && prev.length >= maxSelections) {
          setError(`You can select up to ${maxSelections} options`)
          return prev
        }
        return [...prev, optionIndex]
      }
    })
  }

  const handleSubmit = async () => {
    if (hasVoted || effectiveIsVoting) return

    if (selectedOptions.length === 0) {
      setError('Please select at least one option to vote')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Track analytics with poll ID using SSR-safe access
      const { safeWindow } = await import('@/lib/utils/ssr-safe');
      const gtag = safeWindow(w => w.gtag);
      if (gtag) {
        gtag('event', 'vote_submitted', {
          poll_id: pollId,
          selections: selectedOptions,
          voting_method: 'multiple_choice'
        })
      }
      
      // Use the selections parameter properly
      if (hasVoted || effectiveIsVoting) {
        return
      }
      await onVote(selectedOptions)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit vote')
    } finally {
      setIsSubmitting(false)
    }
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

        {/* Multiple Choice Explanation */}
        {showExplanation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-900 mb-2">How Multiple Choice Voting Works</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• <strong>Select multiple options:</strong> Choose all options you support</p>
              <p>• <strong>Express preferences:</strong> Show support for multiple ideas</p>
              <p>• <strong>Flexible voting:</strong> Perfect when multiple options can coexist</p>
              <p>• <strong>Consensus building:</strong> Great for finding common ground</p>
            </div>
          </div>
        )}

        {/* Voting Method Badge */}
        <div className="flex items-center space-x-2">
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            🎯 Multiple Choice Voting
          </div>
          <span className="text-sm text-gray-500">
            Select all options you support
            {maxSelections && ` (up to ${maxSelections})`}
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" data-testid="voting-form">
        <div className="space-y-3">
          {options.map((option: PollOption, index: number) => (
            <div
              key={String(option.id ?? index)}
              onClick={() => handleOptionToggle(index)}
              className={`
                relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                ${isDisabled 
                  ? 'cursor-not-allowed opacity-60' 
                  : 'hover:border-green-300 hover:bg-green-50'
                }
                ${selectedOptions.includes(index)
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200'
                }
              `}
              data-testid={`option-${index + 1}-checkbox`}
              role="checkbox"
              aria-checked={selectedOptions.includes(index)}
              tabIndex={isDisabled ? -1 : 0}
              onKeyDown={(e) => {
                if (isDisabled) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOptionToggle(index);
                }
              }}
            >
              <div className="flex items-start space-x-3">
                {/* Checkbox */}
                <div className="flex-shrink-0 mt-1">
                  <div className={`
                    w-5 h-5 rounded border-2 flex items-center justify-center
                    ${selectedOptions.includes(index)
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300 bg-white'
                    }
                    transition-all duration-200
                  `}>
                    {selectedOptions.includes(index) && (
                      <CheckCircle className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>

                {/* Option Content */}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{String((option as any).text ?? '')}</h3>
                  {(option as any).option_text && (
                    <p className="text-sm text-gray-600">{String((option as any).option_text)}</p>
                  )}
                </div>

                {/* Selection Indicator */}
                {selectedOptions.includes(index) && (
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                )}
              </div>
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
            <p>• Click on options to select/deselect them</p>
            <p>• You can select multiple options</p>
            <p>• You can change your selections before submitting</p>
            <p>• All selected options will be counted in the results</p>
            {maxSelections && (
              <p>• Maximum {maxSelections} selections allowed</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-6 flex justify-center">
          {hasVoted ? (
            <div className="flex items-center space-x-2 text-green-600" data-testid="vote-confirmation">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium" data-testid="vote-receipt">Vote submitted successfully!</span>
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isDisabled || selectedOptions.length === 0}
              className={`
                flex items-center space-x-2 px-8 py-3 rounded-lg font-medium transition-colors
                ${isDisabled || selectedOptions.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
                }
              `}
              data-testid="submit-vote-button"
            >
              <CheckCircle className="w-5 h-5" />
              <span>{isSubmitting ? 'Submitting Vote...' : 'Submit Vote'}</span>
            </button>
          )}
        </div>

        {/* Selection Summary */}
        {selectedOptions.length > 0 && !hasVoted && (
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-600">
              Selected {selectedOptions.length} option{selectedOptions.length !== 1 ? 's' : ''}: <span className="font-medium text-green-600">
                {selectedOptions.map(idx => options[idx]?.text).join(', ')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Best Practices */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">When to Use Multiple Choice Voting</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">✅ Good For:</h4>
            <ul className="space-y-1">
              <li>• Feature requests</li>
              <li>• Preference surveys</li>
              <li>• Multi-topic polls</li>
              <li>• Consensus building</li>
              <li>• When multiple options can coexist</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">⚠️ Consider Alternatives For:</h4>
            <ul className="space-y-1">
              <li>• Mutually exclusive choices</li>
              <li>• Single winner scenarios</li>
              <li>• When ranking matters</li>
              <li>• Binary decisions</li>
              <li>• When you need a clear winner</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
