'use client'

import React, { useState, useEffect, useCallback, useMemo, useId, useRef } from 'react';

import { useI18n } from '@/hooks/useI18n';
import ScreenReaderSupport from '@/lib/accessibility/screen-reader';
import { optimizedPollService, type OptimizedPollResult } from '@/features/polls/lib/poll-service'
import { logger } from '@/lib/utils/logger';

type OptimizedPollResultsProps = {
  pollId: string
  userId?: string
  includePrivate?: boolean
  onResultsLoaded?: () => void
  onError?: () => void
  showPerformanceMetrics?: boolean
}

export default function OptimizedPollResults({
  pollId,
  userId,
  includePrivate = false,
  onResultsLoaded,
  onError,
  showPerformanceMetrics = false
}: OptimizedPollResultsProps) {
  const { t } = useI18n();
  const resultsRegionId = useId();
  const resultsHeadingId = useId();
  const previousRefreshRef = useRef<number | null>(null);
  const [results, setResults] = useState<OptimizedPollResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null)
  const [cacheStats, setCacheStats] = useState<any>(null)

  // Memoized poll results loading function
  const loadPollResults = useCallback(async () => {
    if (!pollId) return

    setLoading(true)
    setError(null)

    try {
      const startTime = performance.now()
      
      const pollResults = await optimizedPollService.getOptimizedPollResults(
        pollId,
        userId,
        includePrivate
      )
      
      const endTime = performance.now()
      const loadTime = endTime - startTime

      setResults(pollResults)
      setPerformanceMetrics({
        loadTime,
        cacheHit: false, // Will be updated by the service
        timestamp: new Date().toISOString()
      })

      onResultsLoaded?.()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load poll results'
      setError(errorMessage)
      onError?.()
    } finally {
      setLoading(false)
    }
  }, [pollId, userId, includePrivate, onResultsLoaded, onError])

  // Load cache statistics
  const loadCacheStats = useCallback(async () => {
    try {
      const stats = optimizedPollService.getCacheStats()
      setCacheStats(stats)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      logger.warn('Failed to load cache stats:', error)
    }
  }, [])

  // Load results on mount and when dependencies change
  useEffect(() => {
    loadPollResults()
    loadCacheStats()
  }, [loadPollResults, loadCacheStats])

  // Memoized sorted options for performance
  const sortedOptions = useMemo(() => {
    if (!results?.results) return []
    
    return [...results.results].sort((a, b) => (b.voteCount ?? b.votes ?? 0) - (a.voteCount ?? a.votes ?? 0))
  }, [results?.results])

  // Memoized total votes for performance
  const totalVotes = useMemo(() => {
    return results?.totalVotes ?? 0
  }, [results?.totalVotes])

  // Memoized poll status display
  const pollStatusDisplay = useMemo(() => {
    if (!results) return null
    
    const statusConfig = {
      ended: { label: 'Poll Ended', color: 'text-red-600', bgColor: 'bg-red-50' },
      active: { label: 'Active', color: 'text-green-600', bgColor: 'bg-green-50' },
      ongoing: { label: 'Ongoing', color: 'text-blue-600', bgColor: 'bg-blue-50' }
    }
    
    const config = statusConfig[results.pollStatus as keyof typeof statusConfig]
    return config
  }, [results])

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    const refreshTime = Date.now();
    ScreenReaderSupport.announce(t('polls.results.refreshing'), 'polite');
    await loadPollResults()
    await loadCacheStats()
    previousRefreshRef.current = refreshTime;
  }, [loadPollResults, loadCacheStats, t])

  // Announce results updates
  useEffect(() => {
    if (!results || loading) return;
    
    const totalVotes = results.totalVotes ?? 0;
    const topOption = sortedOptions[0];
    if (!topOption) return;

    const summary = t('polls.results.summary', {
      totalVotes,
      topOption: topOption.label ?? topOption.option,
      topVotes: topOption.voteCount ?? topOption.votes,
      topPercentage: (topOption.votePercentage ?? topOption.percentage ?? 0).toFixed(1),
    });

    ScreenReaderSupport.announce(summary, 'polite');
  }, [results, sortedOptions, loading, t]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading poll results</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleRefresh}
            className="bg-red-100 text-red-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No poll results available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Performance Metrics (if enabled) */}
      {showPerformanceMetrics && performanceMetrics && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Performance Metrics</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-600">Load Time:</span>
              <span className="ml-2 font-mono">{performanceMetrics.loadTime.toFixed(2)}ms</span>
            </div>
            <div>
              <span className="text-blue-600">Cache Hit:</span>
              <span className="ml-2">{performanceMetrics.cacheHit ? 'Yes' : 'No'}</span>
            </div>
            {cacheStats && (
              <>
                <div>
                  <span className="text-blue-600">Cache Size:</span>
                  <span className="ml-2">{cacheStats.size} items</span>
                </div>
                <div>
                  <span className="text-blue-600">Cache Keys:</span>
                  <span className="ml-2">{cacheStats.keys.length}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Poll Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">{results.pollTitle}</h2>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>Type: {results.pollType}</span>
          {pollStatusDisplay && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${pollStatusDisplay.bgColor} ${pollStatusDisplay.color}`}>
              {pollStatusDisplay.label}
            </span>
          )}
          <span>{totalVotes} total votes</span>
          <span>{results.uniqueVoters} unique voters</span>
        </div>
      </div>

      {/* Privacy Status */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Privacy Protection</span>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <span className={`px-2 py-1 rounded-full ${results.kAnonymitySatisfied ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              K-Anonymity: {results.kAnonymitySatisfied ? 'Satisfied' : 'Not Met'}
            </span>
            {userId && (
              <span className="text-gray-600">
                Budget: {results.privacyBudgetRemaining?.toFixed(2) ?? '0.00'} ε
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Voting Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-blue-700">Voting Status</span>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <span className={`px-2 py-1 rounded-full ${results.canVote ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {results.canVote ? 'Can Vote' : 'Cannot Vote'}
            </span>
            <span className={`px-2 py-1 rounded-full ${results.hasVoted ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
              {results.hasVoted ? 'Has Voted' : 'Not Voted'}
            </span>
          </div>
        </div>
      </div>

      {/* Results */}
      <section
        aria-labelledby={resultsHeadingId}
        className="space-y-4"
      >
        <h2 id={resultsHeadingId} className="text-lg font-semibold text-gray-900">
          {t('polls.results.heading')}
        </h2>
        <div className="space-y-3">
          {sortedOptions.map((option, index) => {
            const optionId = option.optionId ?? option.option;
            const votes = option.voteCount ?? option.votes ?? 0;
            const percentage = ((option.votePercentage ?? option.percentage) ?? 0).toFixed(1);
            const uniqueVoters = option.uniqueVoters ?? 0;
            const optionLabel = option.label ?? option.option;
            const optionSummaryId = `${resultsRegionId}-option-${index}-summary`;
            
            return (
              <article
                key={optionId}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{optionLabel}</h3>
                  <span className="text-sm text-gray-600">
                    {t('polls.results.optionVotes', { votes, percentage })}
                  </span>
                </div>
                <div
                  className="w-full bg-gray-200 rounded-full h-2"
                  role="progressbar"
                  aria-labelledby={`${resultsRegionId}-option-${index}-label`}
                  aria-valuenow={parseFloat(percentage)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-describedby={optionSummaryId}
                >
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p id={optionSummaryId} className="sr-only">
                  {t('polls.results.optionSummary', {
                    option: optionLabel,
                    votes,
                    percentage,
                    uniqueVoters,
                  })}
                </p>
                <p id={`${resultsRegionId}-option-${index}-label`} className="sr-only">
                  {optionLabel}
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  {t('polls.results.uniqueVoters', { count: uniqueVoters })}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={handleRefresh}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          aria-label={t('polls.results.refreshLabel')}
        >
          {t('polls.results.refresh')}
        </button>
      </div>
    </div>
  )
}
