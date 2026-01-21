'use client'

import { CheckCircle, AlertCircle, Info, CheckSquare } from 'lucide-react'
import React, { useState, useEffect } from 'react';

import { useVotingIsVoting } from '@/features/voting/lib/store'

import type { PollOption } from '../types'

type ApprovalVotingProps = {
  pollId: string
  title: string
  description?: string
  options: PollOption[]
  onVote: (pollId: string, approvals: string[]) => Promise<void>
  isVoting: boolean
  hasVoted?: boolean
  userVote?: string[]
}

export default function ApprovalVoting({
  pollId,
  title,
  description,
  options,
  onVote,
  isVoting,
  hasVoted = false,
  userVote
}: ApprovalVotingProps) {
  const storeIsVoting = useVotingIsVoting()
  const [approvedOptions, setApprovedOptions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const effectiveIsVoting = storeIsVoting || isVoting

  // Initialize from user's previous vote
  useEffect(() => {
    if (userVote) {
      setApprovedOptions(userVote)
    }
  }, [userVote])

  const handleOptionToggle = (optionId: string) => {
    if (hasVoted || effectiveIsVoting) return

    setError(null)
    setApprovedOptions(prev =>
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId].filter(id => id !== undefined)
    )
  }

  const handleSubmit = async () => {
    if (hasVoted || effectiveIsVoting) return

    if (approvedOptions.length === 0) {
      setError('Please approve at least one option')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Validate approvals before submission
      const validApprovals = approvedOptions.filter(approval =>
        options.some(option => String(option.id) === approval)
      )

      if (validApprovals.length !== approvedOptions.length) {
        throw new Error('Some approved options are invalid')
      }

      // Track analytics with poll ID using SSR-safe access
      const { safeWindow } = await import('@/lib/utils/ssr-safe');
      const gtag = safeWindow(w => w.gtag);
      if (gtag) {
        gtag('event', 'vote_submitted', {
          poll_id: pollId,
          choices: approvedOptions,
          voting_method: 'approval',
          approval_count: approvedOptions.length
        })
      }

      if (hasVoted || effectiveIsVoting) {
        return
      }
      await onVote(pollId, validApprovals)
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

        {/* Approval Voting Explanation */}
        {showExplanation && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-foreground mb-2">How Approval Voting Works</h3>
            <div className="text-sm text-foreground/90 space-y-2">
              <p>• <strong>Approve multiple options:</strong> Check all options you find acceptable</p>
              <p>• <strong>Most approvals wins:</strong> The option with the most approvals becomes the winner</p>
              <p>• <strong>Prevents vote splitting:</strong> No penalty for approving similar options</p>
              <p>• <strong>Encourages consensus:</strong> Helps find broadly acceptable solutions</p>
            </div>
          </div>
        )}

        {/* Voting Method Badge */}
        <div className="flex items-center space-x-2">
          <div className="bg-green-500/20 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-sm font-medium">
            ✅ Approval Voting
          </div>
          <span className="text-sm text-muted-foreground">
            Check all options you find acceptable
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
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <div className="space-y-3">
          {options.map((option: PollOption) => {
            const optionId = String(option.id)
            return (
              <div
                key={optionId}
                onClick={() => handleOptionToggle(optionId)}
                data-testid={`option-${parseInt(optionId) + 1}-checkbox`}
                className={`
                  relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                  ${isDisabled
                    ? 'cursor-not-allowed opacity-60'
                    : 'hover:border-green-500/50 hover:bg-green-500/5'
                  }
                  ${approvedOptions.includes(optionId) ? 'border-green-500 bg-green-500/10' : 'border-border'}
                `}
                role="checkbox"
                aria-checked={approvedOptions.includes(optionId)}
                tabIndex={isDisabled ? -1 : 0}
                onKeyDown={(e) => {
                  if (isDisabled) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOptionToggle(optionId);
                  }
                }}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                      approvedOptions.includes(optionId)
                        ? 'border-green-500 bg-green-500'
                        : 'border-border bg-background'
                    }`}>
                      {approvedOptions.includes(optionId) && (
                        <CheckSquare className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{String((option as any).text ?? '')}</h3>
                    {(option as any).option_text && (
                      <p className="text-sm text-muted-foreground">{String((option as any).option_text)}</p>
                    )}
                  </div>
                  {approvedOptions.includes(optionId) && (
                    <div className="flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium text-foreground">Voting Instructions</span>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Click on options to approve or disapprove them</p>
            <p>• You can approve multiple options</p>
            <p>• You must approve at least one option to submit</p>
            <p>• The option with the most approvals will win</p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-6 flex justify-center">
          {hasVoted ? (
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400 mb-2" data-testid="vote-confirmation">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Vote submitted successfully!</span>
              </div>
              <div className="text-sm text-muted-foreground" data-testid="selected-options">
                You approved: {approvedOptions.map(id => options.find(opt => opt.id === id)?.text).join(', ')}
              </div>
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isDisabled || approvedOptions.length === 0}
              data-testid="start-voting-button"
              className={`
                flex items-center space-x-2 px-8 py-3 rounded-lg font-medium transition-colors
                ${isDisabled || approvedOptions.length === 0
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600'
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
            <div className="text-sm text-muted-foreground">
              {approvedOptions.length} of {options.length} options approved
            </div>
            <div className="mt-2 w-full bg-muted rounded-full h-2">
              <div
                className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(approvedOptions.length / options.length) * 100}%`
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Best Practices */}
      <div className="mt-6 bg-card rounded-xl shadow-sm border border-border p-6">
        <h3 className="font-semibold text-foreground mb-3">When to Use Approval Voting</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <h4 className="font-medium text-foreground mb-2">✅ Good For:</h4>
            <ul className="space-y-1">
              <li>• Multi-candidate elections</li>
              <li>• Consensus building</li>
              <li>• Committee selection</li>
              <li>• Preference expression</li>
              <li>• Primary elections</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">⚠️ Consider Alternatives For:</h4>
            <ul className="space-y-1">
              <li>• Binary yes/no decisions</li>
              <li>• Preference intensity matters</li>
              <li>• Complex trade-offs</li>
              <li>• Budget allocation</li>
              <li>• Simple polls</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
