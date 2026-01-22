'use client'

import { CheckCircle, AlertCircle, Info } from 'lucide-react'
import React, { useState, useEffect } from 'react';

import { useVotingIsVoting } from '@/features/voting/lib/store'

import type { PollOption, SingleChoiceVotingProps } from '../types'

export default function SingleChoiceVoting({
  pollId,
  title,
  description,
  options,
  onVote,
  isVoting,
  hasVoted = false,
  userVote
}: SingleChoiceVotingProps) {
  const storeIsVoting = useVotingIsVoting()
  const [selectedOption, setSelectedOption] = useState<number | null>(userVote ?? null)
  const [error, setError] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const effectiveIsVoting = storeIsVoting || isVoting

  // Initialize from user's previous vote
  useEffect(() => {
    if (userVote !== undefined) {
      setSelectedOption(userVote)
    }
  }, [userVote])

  const handleOptionSelect = (optionIndex: number) => {
    if (hasVoted || effectiveIsVoting) return

    setError(null)
    setSelectedOption(optionIndex)
  }

  const handleSubmit = async () => {
    if (hasVoted || effectiveIsVoting) return

    if (selectedOption === null) {
      setError('Please select an option to vote')
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
          choice: selectedOption,
          voting_method: 'single_choice'
        })
      }

      // Use the choice parameter properly
      if (hasVoted || effectiveIsVoting) {
        return
      }
      await onVote(selectedOption)
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
      <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors"
          >
            <Info className="w-5 h-5" />
            <span className="text-sm font-medium">How it works</span>
          </button>
        </div>

        {/* Single Choice Explanation */}
        {showExplanation && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-foreground mb-2">How Single Choice Voting Works</h3>
            <div className="text-sm text-foreground/90 space-y-2">
              <p>• <strong>Pick one option:</strong> Select the option you prefer most</p>
              <p>• <strong>Highest vote count wins:</strong> The option with the most votes becomes the winner</p>
              <p>• <strong>Simple and familiar:</strong> This is the most common voting method</p>
              <p>• <strong>Quick decisions:</strong> Perfect for straightforward choices</p>
            </div>
          </div>
        )}

        {/* Voting Method Badge */}
        <div className="flex items-center space-x-2">
          <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">
            🎯 Single Choice Voting
          </div>
          <span className="text-sm text-muted-foreground">
            Select one option that you prefer most
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-destructive mr-2" />
            <p className="text-destructive">{error}</p>
          </div>
        </div>
      )}

      {/* Voting Interface */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6" data-testid="voting-form">
        <div className="space-y-3" role="radiogroup" aria-label="Poll options">
          {options.map((option: PollOption, index: number) => {
            const optionId = `option-${String(option.id ?? index)}`;
            const optionText = String((option as any).text ?? `Option ${index + 1}`);
            return (
            <div
              key={String(option.id ?? index)}
              onClick={() => handleOptionSelect(index)}
              className={`
                relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                ${isDisabled
                  ? 'cursor-not-allowed opacity-60'
                  : 'hover:border-primary/50 hover:bg-primary/5'
                }
                ${selectedOption === index
                  ? 'border-primary bg-primary/10'
                  : 'border-border'
                }
              `}
              data-testid={`option-${index + 1}-radio`}
              role="radio"
              aria-checked={selectedOption === index}
              aria-labelledby={`${optionId}-label`}
              id={optionId}
              tabIndex={isDisabled ? -1 : 0}
              onKeyDown={(e) => {
                if (isDisabled) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOptionSelect(index);
                }
              }}
            >
              <div className="flex items-start space-x-3">
                {/* Radio Button */}
                <div className="flex-shrink-0 mt-1">
                  <div className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center
                    ${selectedOption === index
                      ? 'border-primary bg-primary'
                      : 'border-border bg-background'
                    }
                    transition-all duration-200
                  `}>
                    {selectedOption === index && (
                      <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                    )}
                  </div>
                </div>

                {/* Option Content */}
                <div className="flex-1">
                  <h3 id={`${optionId}-label`} className="font-semibold text-foreground mb-1">{optionText}</h3>
                  {(option as any).option_text && (
                    <p className="text-sm text-muted-foreground">{String((option as any).option_text)}</p>
                  )}
                </div>

                {/* Selection Indicator */}
                {selectedOption === index && (
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium text-foreground">Voting Instructions</span>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Click on an option to select it as your choice</p>
            <p>• You can change your selection before submitting</p>
            <p>• Only one option can be selected at a time</p>
            <p>• The option with the most votes will win</p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-6 flex justify-center">
          {hasVoted ? (
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400" data-testid="vote-confirmation">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium" data-testid="vote-receipt">Vote submitted successfully!</span>
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isDisabled || selectedOption === null}
              className={`
                flex items-center space-x-2 px-8 py-3 rounded-lg font-medium transition-colors
                ${isDisabled || selectedOption === null
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
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
        {selectedOption !== null && !hasVoted && (
          <div className="mt-4 text-center">
            <div className="text-sm text-muted-foreground">
              Selected: <span className="font-medium text-primary">
                {String((options.find((_: PollOption, idx: number) => idx === selectedOption) as any)?.text ?? '')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Best Practices */}
      <div className="mt-6 bg-card rounded-xl shadow-sm border border-border p-6">
        <h3 className="font-semibold text-foreground mb-3">When to Use Single Choice Voting</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <h4 className="font-medium text-foreground mb-2">✅ Good For:</h4>
            <ul className="space-y-1">
              <li>• Quick decisions</li>
              <li>• Binary choices</li>
              <li>• Simple polls</li>
              <li>• Yes/No questions</li>
              <li>• Straightforward options</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">⚠️ Consider Alternatives For:</h4>
            <ul className="space-y-1">
              <li>• Many similar options</li>
              <li>• Preference expression</li>
              <li>• Consensus building</li>
              <li>• Complex decisions</li>
              <li>• Multi-candidate scenarios</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
