'use client'

import { CheckCircle, AlertCircle, Info, CheckSquare } from 'lucide-react'
import { useState, useEffect } from 'react'

interface PollOption {
  id: string
  text: string
  description?: string
}

interface ApprovalVotingProps {
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
  const [approvedOptions, setApprovedOptions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize from user's previous vote
  useEffect(() => {
    if (userVote) {
      setApprovedOptions(userVote)
    }
  }, [userVote])

  const handleOptionToggle = (optionId: string) => {
    if (hasVoted || isVoting) return

    setError(null)
    setApprovedOptions(prev => 
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId].filter(id => id !== undefined)
    )
  }

  const handleSubmit = async () => {
    if (hasVoted || isVoting) return

    if (approvedOptions.length === 0) {
      setError('Please approve at least one option')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Validate approvals before submission
      const validApprovals = approvedOptions.filter(approval => 
        options.some(option => option.id === approval)
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
      
      await onVote(pollId, validApprovals)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit vote')
    } finally {
      setIsSubmitting(false)
    }
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
            className="flex items-center space-x-2 text-green-600 hover:text-green-700 transition-colors"
          >
            <Info className="w-5 h-5" />
            <span className="text-sm font-medium">How it works</span>
          </button>
        </div>

        {/* Approval Voting Explanation */}
        {showExplanation && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-green-900 mb-2">How Approval Voting Works</h3>
            <div className="text-sm text-green-800 space-y-2">
              <p>• <strong>Approve multiple options:</strong> Check all options you find acceptable</p>
              <p>• <strong>Most approvals wins:</strong> The option with the most approvals becomes the winner</p>
              <p>• <strong>Prevents vote splitting:</strong> No penalty for approving similar options</p>
              <p>• <strong>Encourages consensus:</strong> Helps find broadly acceptable solutions</p>
            </div>
          </div>
        )}

        {/* Voting Method Badge */}
        <div className="flex items-center space-x-2">
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            ✅ Approval Voting
          </div>
          <span className="text-sm text-gray-500">
            Check all options you find acceptable
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
        <div className="space-y-3">
          {options.map((option: PollOption) => (
            <div
              key={option.id}
              onClick={() => handleOptionToggle(option.id)}
              data-testid={`option-${parseInt(option.id) + 1}-checkbox`}
              className={`
                relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                ${isDisabled 
                  ? 'cursor-not-allowed opacity-60' 
                  : 'hover:border-green-300 hover:bg-green-50'
                }
                ${approvedOptions.includes(option.id) ? 'border-green-500 bg-green-50' : 'border-gray-200'}
              `}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                    approvedOptions.includes(option.id) 
                      ? 'border-green-500 bg-green-500' 
                      : 'border-gray-300 bg-white'
                  }`}>
                    {approvedOptions.includes(option.id) && (
                      <CheckSquare className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{option.text}</h3>
                  {option.description && (
                    <p className="text-sm text-gray-600">{option.description}</p>
                  )}
                </div>
                {approvedOptions.includes(option.id) && (
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
              <div className="flex items-center justify-center space-x-2 text-green-600 mb-2" data-testid="vote-confirmation">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Vote submitted successfully!</span>
              </div>
              <div className="text-sm text-gray-600" data-testid="selected-options">
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
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
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
              {approvedOptions.length} of {options.length} options approved
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(approvedOptions.length / options.length) * 100}%` 
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Best Practices */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">When to Use Approval Voting</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">✅ Good For:</h4>
            <ul className="space-y-1">
              <li>• Multi-candidate elections</li>
              <li>• Consensus building</li>
              <li>• Committee selection</li>
              <li>• Preference expression</li>
              <li>• Primary elections</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">⚠️ Consider Alternatives For:</h4>
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
