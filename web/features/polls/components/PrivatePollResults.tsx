'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react';

import { EnhancedEmptyState } from '@/components/shared/EnhancedEmptyState';
import { EnhancedErrorDisplay } from '@/components/shared/EnhancedErrorDisplay';

import { logger } from '@/lib/utils/logger';

import { DifferentialPrivacyManager } from '../../../lib/privacy/dp';

// Create instance of differential privacy manager
const differentialPrivacy = new DifferentialPrivacyManager();

// Define the PrivateQueryResult type based on what the component expects
type PrivateQueryResult<T> = {
  data: T;
  kAnonymitySatisfied: boolean;
  privacyGuarantee?: string;
  epsilonUsed?: number;
  noiseAdded?: number;
  confidenceInterval?: [number, number];
}

type PollOption = {
  id: string
  label: string
  description?: string
}

type Poll = {
  id: string
  title: string
  description?: string
  type: 'single' | 'approval' | 'ranked' | 'quadratic'
  allowMultipleVotes: boolean
  endDate?: string
  options: PollOption[]
}

type PrivatePollResultsProps = {
  poll: Poll
  userId: string
  onPrivacyBudgetExceeded?: () => void
}

export default function PrivatePollResults({ poll, userId, onPrivacyBudgetExceeded }: PrivatePollResultsProps) {
  const [results, setResults] = useState<PrivateQueryResult<Array<{ optionId: string; count: number; percentage: number }>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [privacyBudget, setPrivacyBudget] = useState<number | null>(null)

  // Use ref for stable callback prop to prevent unnecessary re-renders
  const onPrivacyBudgetExceededRef = useRef(onPrivacyBudgetExceeded);
  useEffect(() => { onPrivacyBudgetExceededRef.current = onPrivacyBudgetExceeded; }, [onPrivacyBudgetExceeded]);

  const loadResults = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Check if we can allocate epsilon for this operation
      const epsilon = 0.8
      if (!differentialPrivacy.canAllocateEpsilon(poll.id, epsilon)) {
        throw new Error('Privacy budget exceeded')
      }

      // Fetch actual poll results from the database
      const response = await fetch(`/api/polls/${poll.id}/results`)
      if (!response.ok) {
        throw new Error('Failed to fetch poll results')
      }

      const pollResults = await response.json()
      const rawResults = pollResults.options.map((option: any) => ({
        optionId: option.id,
        count: option.voteCount || 0,
        percentage: 0 // Will be calculated
      }))

      // Apply differential privacy to the results
      const counts = rawResults.map((r: { count: number }) => r.count)
      const dpResults = differentialPrivacy.dpCounts(counts, epsilon)

      // Check k-anonymity for each result
      const totalVotes = counts.reduce((sum: number, count: number) => sum + count, 0)
      const kAnonymityResult = differentialPrivacy.shouldShowBreakdown(
        totalVotes,
        'public',
        totalVotes
      )

      // Calculate percentages with privacy protection
      const privacyProtectedResults = rawResults.map((result: { optionId: string; count: number }, index: number) => {
        const dpResult = dpResults[index]
        if (!dpResult) {
          throw new Error(`Missing differential privacy result for index ${index}`)
        }

        const percentage = totalVotes > 0 ? (dpResult.noisyCount / totalVotes) * 100 : 0

        return {
          optionId: result.optionId,
          count: dpResult.noisyCount,
          percentage: Math.round(percentage * 100) / 100
        }
      })

      // Track epsilon usage
      differentialPrivacy.trackEpsilonUsage(poll.id, epsilon, 'poll-results-query', `user-${userId}`)

      const privateResults: PrivateQueryResult<Array<{ optionId: string; count: number; percentage: number }>> = {
        data: privacyProtectedResults,
        kAnonymitySatisfied: kAnonymityResult.shouldShow,
        privacyGuarantee: `(ε=${epsilon}, δ=1e-5)`,
        epsilonUsed: epsilon,
        noiseAdded: dpResults.reduce((sum: any, result: any) => sum + Math.abs(result.noisyCount - result.originalCount), 0),
        confidenceInterval: [Math.min(...dpResults.map((r: any) => r.noisyCount)), Math.max(...dpResults.map((r: any) => r.noisyCount))]
      }

      setResults(privateResults)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to load private results:', err)

      if (error instanceof Error && error.message.includes('Privacy budget exceeded')) {
        setError('Privacy budget exceeded. Please try again later.')
        onPrivacyBudgetExceededRef.current?.()
      } else {
        setError('Failed to load poll results')
      }
    } finally {
      setLoading(false)
    }
  }, [poll.id, userId])

  const loadPrivacyBudget = useCallback(async () => {
    try {
      // Get the actual privacy budget status for this poll
      const budgetStatus = differentialPrivacy.getBudgetStatus(poll.id)
      setPrivacyBudget(budgetStatus.remaining)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to load privacy budget:', err)
    }
  }, [poll.id])

  useEffect(() => {
    void loadResults()
    void loadPrivacyBudget()
  }, [loadResults, loadPrivacyBudget])

  const formatPrivacyGuarantee = (guarantee: string) => {
    return guarantee.replace(/\(ε=([^,]+), δ=([^)]+)\)/, (_, epsilon, delta) => {
      return `(ε=${parseFloat(epsilon).toFixed(2)}, δ=${parseFloat(delta).toExponential(2)})`
    })
  }

  const getConfidenceLevel = (epsilon: number) => {
    if (epsilon <= 0.5) return 'Very High'
    if (epsilon <= 1.0) return 'High'
    if (epsilon <= 2.0) return 'Medium'
    return 'Low'
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-gray-600">Loading private results...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <EnhancedErrorDisplay
        title="Error Loading Results"
        message={error}
        details="We encountered an issue while loading private poll results. This might be a temporary network problem or a privacy budget issue."
        tip="If this is a privacy budget error, the poll may have reached its privacy limit. Try again later or contact support."
        canRetry={true}
        onRetry={() => {
          // Retry logic would be handled by the parent component
          if (onPrivacyBudgetExceeded && error && typeof error === 'string' && error.includes('Privacy budget exceeded')) {
            onPrivacyBudgetExceeded?.();
          }
        }}
        severity={error && typeof error === 'string' && error.includes('Privacy budget exceeded') ? 'warning' : 'error'}
      />
    )
  }

  if (!results) {
    return (
      <EnhancedEmptyState
        icon={
          <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
        title="No Results Available"
        description="Poll results are not yet available. Results may be processing or the poll may not have received any votes yet."
        tip="Private poll results are computed with differential privacy. Check back later if votes have been cast."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Privacy Status Banner */}
      <div className={`border rounded-lg p-4 ${
        results.kAnonymitySatisfied
          ? 'bg-green-50 border-green-200'
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <svg className={`w-5 h-5 ${
              results.kAnonymitySatisfied ? 'text-green-500' : 'text-yellow-500'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div>
              <h3 className={`font-semibold ${
                results.kAnonymitySatisfied ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {results.kAnonymitySatisfied ? 'Privacy Protected Results' : 'Privacy Protection Active'}
              </h3>
              <p className={`text-sm ${
                results.kAnonymitySatisfied ? 'text-green-700' : 'text-yellow-700'
              }`}>
                {results.kAnonymitySatisfied
                  ? 'Results are protected with differential privacy'
                  : 'Results hidden until minimum participant threshold is met'
                }
              </p>
            </div>
          </div>

          {/* Privacy Budget Indicator */}
          {privacyBudget !== null && (
            <div className="text-right">
              <div className="text-sm text-gray-600">Privacy Budget</div>
              <div className={`font-semibold ${
                privacyBudget > 5 ? 'text-green-600' :
                privacyBudget > 2 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {privacyBudget.toFixed(2)} ε
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Display */}
      {results.kAnonymitySatisfied && results.data.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Poll Results</h3>

          <div className="space-y-4">
            {results.data.map((result: { optionId: string; count: number; percentage: number }, index: number) => {
              const option = poll.options.find(opt => opt.id === result.optionId)
              if (!option) return null

              return (
                <div key={result.optionId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{option.label}</div>
                        {option.description && (
                          <div className="text-sm text-gray-600">{option.description}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{result.count} votes</div>
                      <div className="text-sm text-gray-600">{result.percentage}%</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(result.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-yellow-500 mb-2">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Results Hidden for Privacy</h3>
          <p className="text-yellow-700">
            Results will be shown when at least 20 people have voted to ensure your privacy.
          </p>
        </div>
      )}

      {/* Privacy Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">Privacy Protection Details</h4>
        <div className="space-y-2 text-sm text-blue-700">
          <div className="flex justify-between">
            <span>Privacy Guarantee:</span>
            <span className="font-mono">{formatPrivacyGuarantee(results.privacyGuarantee?.toString() ?? '0.95')}</span>
          </div>
          <div className="flex justify-between">
            <span>Confidence Level:</span>
            <span>{getConfidenceLevel(results.epsilonUsed ?? 0.1)}</span>
          </div>
          <div className="flex justify-between">
            <span>Noise Added:</span>
            <span>{(results.noiseAdded ?? 0).toFixed(2)} ± votes</span>
          </div>
          <div className="flex justify-between">
            <span>Epsilon Used:</span>
            <span>{(results.epsilonUsed ?? 0.1).toFixed(2)}</span>
          </div>
          {results.confidenceInterval && results.confidenceInterval[0] !== results.confidenceInterval[1] && (
            <div className="flex justify-between">
              <span>Confidence Interval:</span>
              <span>[{results.confidenceInterval[0].toFixed(0)}, {results.confidenceInterval[1].toFixed(0)}] votes</span>
            </div>
          )}
        </div>
      </div>

      {/* Privacy Explanation */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-2">How Privacy Protection Works</h4>
        <div className="text-sm text-gray-600 space-y-2">
          <p>
            <strong>Differential Privacy:</strong> We add carefully calibrated noise to protect individual votes while preserving accurate aggregate results.
          </p>
          <p>
            <strong>K-Anonymity:</strong> Results are only shown when enough people have participated to prevent individual identification.
          </p>
          <p>
            <strong>Privacy Budget:</strong> Each user has a daily limit on how much privacy they can consume, preventing overuse.
          </p>
        </div>
      </div>
    </div>
  )
}
