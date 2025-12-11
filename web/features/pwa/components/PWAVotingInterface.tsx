'use client'


import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle, 
  AlertCircle, 
  Wifi, 
  WifiOff, 
  Shield, 
  Clock,
  Users,
  TrendingUp,
  Smartphone,
  Download
} from 'lucide-react'
import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { useRecordPollEvent } from '@/features/polls/hooks/usePollAnalytics';
import { useFeatureFlags } from "@/features/pwa/hooks/useFeatureFlags"
import { useVotingCountdown } from '@/features/voting/hooks/useVotingCountdown';
import {
  createBallotFromPoll,
  createVotingRecordFromPollSubmission,
  type PollBallotContext,
} from '@/features/voting/lib/pollAdapters';
import { useVotingActions, useVotingIsVoting } from '@/features/voting/lib/store';

import { useNotificationActions, useNotificationSettings } from '@/lib/stores/notificationStore';
import { devLog } from '@/lib/utils/logger';

import { usePWAUtils } from '../hooks/usePWAUtils'


type Poll = {
  id: string
  question: string
  options: string[]
  totalVotes: number
  results?: {
    [key: number]: number
  }
  expiresAt: string
  category: string
  isActive: boolean
}

type OnVote = (choice: number) => Promise<void> | void;

type PWAVotingInterfaceProps = {
  poll: Poll
  onVote: OnVote
  showResults?: boolean
  offlineMode?: boolean
}

export function PWAVotingInterface({ 
  poll, 
  onVote, 
  showResults = false, 
  offlineMode = false 
}: PWAVotingInterfaceProps) {
  const { isEnabled: pwaEnabled } = useFeatureFlags()
  const pwaFeatureEnabled = pwaEnabled('PWA')
  const { utils: pwaUtils } = usePWAUtils()
  const {
    setBallots,
    setSelectedBallot,
    setCurrentBallot,
    setVoting,
    setError: setVotingError,
    clearError: clearVotingError,
    addVotingRecord,
  } = useVotingActions();
  const storeIsVoting = useVotingIsVoting();
  const timeRemaining = useVotingCountdown(poll.expiresAt);
  const notificationSettings = useNotificationSettings();
  const { addNotification } = useNotificationActions();
  const recordPollEvent = useRecordPollEvent(() => ({
    pollId: poll.id,
    category: poll.category,
  }));
  
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [showPWAFeatures, setShowPWAFeatures] = useState(false)

  const pollDetailsForBallot = useMemo(
    () => ({
      id: poll.id,
      title: poll.question,
      description: null,
      options: [...poll.options],
      votingMethod: 'single',
      totalVotes: poll.totalVotes,
      endtime: poll.expiresAt,
      status: poll.isActive ? 'active' : 'closed',
      category: poll.category,
      createdAt: null,
    }),
    [poll]
  );

  useEffect(() => {
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const optionVoteCounts = poll.results
      ? Object.entries(poll.results).reduce<Record<string, number>>((acc, [index, value]) => {
          acc[String(index)] = Number(value ?? 0)
          return acc
        }, {})
      : undefined

    const ballotContext: PollBallotContext = {
      ...(typeof poll.totalVotes === 'number' ? { totalVotes: poll.totalVotes } : {}),
      ...(optionVoteCounts && Object.keys(optionVoteCounts).length > 0 ? { optionVoteCounts } : {}),
    }

    const ballot = createBallotFromPoll(pollDetailsForBallot, ballotContext)

    setBallots([ballot])
    setSelectedBallot(ballot)
    setCurrentBallot(ballot)
  }, [
    poll.results,
    poll.totalVotes,
    pollDetailsForBallot,
    setBallots,
    setCurrentBallot,
    setSelectedBallot,
  ])

  const notifySuccess = useCallback(
    (message: string, title = 'Vote submitted') => {
      addNotification({
        type: 'success',
        title,
        message,
        duration: notificationSettings.duration,
      });
    },
    [addNotification, notificationSettings.duration],
  );

  const notifyError = useCallback(
    (message: string, title = 'Vote failed') => {
      addNotification({
        type: 'error',
        title,
        message,
        duration: notificationSettings.duration,
      });
    },
    [addNotification, notificationSettings.duration],
  );

  const handleVote = async (choice: number) => {
    if (hasVoted || storeIsVoting) return

    if (choice < 0 || choice >= poll.options.length) {
      const message = 'Invalid choice selected.'
      devLog(message, { choice })
      setVotingError(message)
      notifyError(message, 'Invalid choice')
      recordPollEvent('vote_failed', {
        metadata: { reason: 'invalid_choice', choice },
      });
      return
    }

    setVoting(true)
    clearVotingError()
    setSelectedChoice(choice)

    try {
      if (pwaFeatureEnabled && pwaUtils && !isOnline) {
        await pwaUtils.pwaManager.storeOfflineVote({
          pollId: poll.id,
          choice,
        })

        devLog('PWA: Vote stored offline')
        recordPollEvent('vote_stored_offline', {
          metadata: { choice },
        });
      }

      await onVote(choice)
      setHasVoted(true)

      addVotingRecord(
        createVotingRecordFromPollSubmission({
          poll: pollDetailsForBallot,
          submission: { method: 'single', choice },
          voteId: `${poll.id}-pwa-${Date.now().toString(36)}`,
        })
      )

      recordPollEvent('vote_cast', {
        metadata: {
          choice,
          mode: isOnline ? 'online' : 'offline',
        },
      });
      notifySuccess(
        isOnline
          ? 'Your vote has been recorded.'
          : 'Your vote has been stored offline and will sync when you\'re back online.',
        isOnline ? 'Vote recorded' : 'Vote stored offline',
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to record vote'
      devLog('Vote failed:', { error: message })
      setVotingError(message)
      notifyError(message)
      recordPollEvent('vote_failed', {
        metadata: { choice, error: message },
      });
    } finally {
      setVoting(false)
    }
  }

  const calculatePercentage = (votes: number) => {
    return poll.totalVotes > 0 ? Math.round((votes / poll.totalVotes) * 100) : 0
  }

  const isExpired = () => {
    return new Date() > new Date(poll.expiresAt)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden" data-testid="pwa-voting-interface">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {poll.question}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{poll.totalVotes.toLocaleString()} votes</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{timeRemaining || 'Expired'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span>{poll.category}</span>
              </div>
            </div>
          </div>
          
          {/* PWA Status Indicators */}
          {pwaFeatureEnabled && (
            <div className="flex items-center space-x-2">
              {offlineMode ? (
                <div className="flex items-center space-x-1 text-orange-600">
                  <WifiOff className="w-4 h-4" />
                  <span className="text-xs">Offline</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-green-600">
                  <Wifi className="w-4 h-4" />
                  <span className="text-xs">Online</span>
                </div>
              )}
              
              {pwaUtils?.pwaManager.isInstalled() && (
                <div className="flex items-center space-x-1 text-blue-600">
                  <Smartphone className="w-4 h-4" />
                  <span className="text-xs">PWA</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Voting Options */}
      {!hasVoted && !isExpired() && (
        <div className="p-6">
          <div className="space-y-3">
            {poll.options.map((option, index) => (
              <motion.button
                key={index}
                onClick={() => handleVote(index)}
                disabled={storeIsVoting}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  selectedChoice === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                } ${storeIsVoting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                whileHover={!storeIsVoting ? { scale: 1.02 } : {}}
                whileTap={!storeIsVoting ? { scale: 0.98 } : {}}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{option}</span>
                  {storeIsVoting && selectedChoice === index && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                  )}
                </div>
              </motion.button>
            ))}
          </div>

          {/* PWA Features Info */}
          {pwaFeatureEnabled && offlineMode && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 text-blue-800">
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Offline Vote</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Your vote will be stored locally and synced when you&apos;re back online.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {showResults && poll.results && (
        <div className="p-6 bg-gray-50">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Results</h4>
          <div className="space-y-3">
            {poll.options.map((option, index) => {
              const votes = poll.results?.[index] ?? 0
              const percentage = calculatePercentage(votes)
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{option}</span>
                    <span className="text-sm text-gray-600">
                      {votes} votes ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-blue-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Vote Confirmation */}
      {hasVoted && (
        <div className="p-6 bg-green-50 border-t border-green-200">
          <div className="flex items-center space-x-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Vote recorded successfully!</span>
          </div>
          {offlineMode && (
            <p className="text-sm text-green-700 mt-1">
              Your vote has been stored offline and will sync when you&apos;re back online.
            </p>
          )}
        </div>
      )}

      {/* Expired Poll */}
      {isExpired() && (
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-gray-600">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">This poll has expired</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Voting is no longer available for this poll.
          </p>
        </div>
      )}

      {/* PWA Features Toggle */}
      {pwaFeatureEnabled && (
        <div className="border-t border-gray-200">
          <button
            onClick={() => setShowPWAFeatures(!showPWAFeatures)}
            className="w-full p-3 text-left text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span>PWA Features</span>
              <Shield className="w-4 h-4" />
            </div>
          </button>
          
          <AnimatePresence>
            {showPWAFeatures && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500'}`} />
                      <span className="text-gray-600">
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${pwaUtils?.pwaManager.isInstalled() ? 'bg-blue-500' : 'bg-gray-300'}`} />
                      <span className="text-gray-600">
                        {pwaUtils?.pwaManager.isInstalled() ? 'Installed' : 'Browser'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${'serviceWorker' in navigator ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-gray-600">
                        Service Worker
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${(JSON.parse(localStorage.getItem('offlineVotes') ?? '[]').length) > 0 ? 'bg-orange-500' : 'bg-gray-300'}`} />
                      <span className="text-gray-600">
                        {JSON.parse(localStorage.getItem('offlineVotes') ?? '[]').length} offline votes
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
