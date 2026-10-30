'use client'

import { CheckCircle, AlertCircle } from 'lucide-react'
import React, { useState, useEffect } from 'react';

import { useVotingIsVoting } from '@/features/voting/lib/store'

import { VoteSubmitButton } from './VoteSubmitButton'

import type { PollOption, SingleChoiceVotingProps } from '../types'

export default function SingleChoiceVoting({
  pollId,
  title,
  options,
  onVote,
  isVoting,
  hasVoted = false,
  userVote
}: SingleChoiceVotingProps) {
  const storeIsVoting = useVotingIsVoting()
  const [selectedOption, setSelectedOption] = useState<number | null>(userVote ?? null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const effectiveIsVoting = storeIsVoting || isVoting

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
      const { safeWindow } = await import('@/lib/utils/ssr-safe');
      const gtag = safeWindow(w => w.gtag);
      if (gtag) {
        gtag('event', 'vote_submitted', {
          poll_id: pollId,
          choice: selectedOption,
          voting_method: 'single_choice'
        })
      }

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
  const selectedLabel = selectedOption === null
    ? ''
    : String((options.find((_: PollOption, idx: number) => idx === selectedOption) as { text?: string } | undefined)?.text ?? '')

  return (
    <div>
      {error ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-destructive mr-2" />
            <p className="text-destructive">{error}</p>
          </div>
        </div>
      ) : null}

      <div className="space-y-3" role="radiogroup" aria-label={title || 'Poll options'}>
        {options.map((option: PollOption, index: number) => {
          const optionId = `option-${String(option.id ?? index)}`;
          const optionText = String((option as { text?: string }).text ?? `Option ${index + 1}`);
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

                <div className="flex-1">
                  <h3 id={`${optionId}-label`} className="font-semibold text-foreground">{optionText}</h3>
                </div>

                {selectedOption === index ? (
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-center">
        {hasVoted ? (
          <div className="flex items-center space-x-2 text-green-600 dark:text-green-400" data-testid="vote-confirmation">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium" data-testid="vote-receipt">Vote submitted successfully!</span>
          </div>
        ) : (
          <VoteSubmitButton
            isSubmitting={isSubmitting}
            disabled={hasVoted || effectiveIsVoting || selectedOption === null}
            onClick={handleSubmit}
            icon={CheckCircle}
            data-testid="submit-vote-button"
          />
        )}
      </div>

      {selectedOption !== null && !hasVoted ? (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Selected: <span className="font-medium text-primary">{selectedLabel}</span>
        </p>
      ) : null}
    </div>
  )
}
