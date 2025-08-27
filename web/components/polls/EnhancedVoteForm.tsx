'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger';
import { vote } from '@/app/actions/vote'
import { offlineOutbox } from '@/lib/pwa/offline-outbox'

interface PollOption {
  id: string
  label: string
  description?: string
}

interface Poll {
  id: string
  title: string
  description?: string
  type: 'single' | 'approval' | 'ranked' | 'quadratic'
  allowMultipleVotes: boolean
  endDate?: string
  options: PollOption[]
}

interface EnhancedVoteFormProps {
  poll: Poll
  onVoteSubmitted?: (result: any) => void
  onVoteError?: (error: string) => void
}

export default function EnhancedVoteForm({ poll, onVoteSubmitted, onVoteError }: EnhancedVoteFormProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [hasPendingVotes, setHasPendingVotes] = useState(false)
  const [showOfflineMessage, setShowOfflineMessage] = useState(false)

  useEffect(() => {
    // Check if user has pending votes for this poll
    const checkPendingVotes = async () => {
      try {
        const pending = await offlineOutbox.hasPendingVotes(poll.id)
        setHasPendingVotes(pending)
      } catch (error) {
        logger.error('Failed to check pending votes:', error)
      }
    }

    checkPendingVotes()

    // Listen for online/offline events
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [poll.id])

  const handleOptionToggle = (optionId: string) => {
    if (poll.type === 'single') {
      setSelectedOptions([optionId])
    } else if (poll.allowMultipleVotes || poll.type === 'approval') {
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      )
    } else {
      // For ranked voting, we'll implement a different UI
      setSelectedOptions([optionId])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedOptions.length === 0) {
      onVoteError?.('Please select at least one option')
      return
    }

    setIsSubmitting(true)

    try {
      if (isOffline) {
        // Store vote offline
        await offlineOutbox.addVote(poll.id, selectedOptions, isAnonymous)
        setShowOfflineMessage(true)
        onVoteSubmitted?.({ 
          success: true, 
          message: 'Vote stored offline and will be submitted when you\'re back online',
          offline: true 
        })
      } else {
        // Submit vote online
        const formData = new FormData()
        formData.append('pollId', poll.id)
        formData.append('optionIds', JSON.stringify(selectedOptions))
        formData.append('anonymous', isAnonymous.toString())

        const result = await vote(formData)
        onVoteSubmitted?.(result)
      }
    } catch (error) {
      logger.error('Vote submission failed:', error)
      onVoteError?.(error instanceof Error ? error.message : 'Failed to submit vote')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isPollEnded = poll.endDate && new Date(poll.endDate) < new Date()

  if (isPollEnded) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <div className="text-gray-500 mb-2">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Poll has ended</h3>
        <p className="text-gray-600">This poll is no longer accepting votes.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Offline Status */}
      {showOfflineMessage && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-semibold text-blue-800">Vote stored offline</h4>
              <p className="text-sm text-blue-700">Your vote will be submitted automatically when you're back online.</p>
            </div>
          </div>
        </div>
      )}

      {/* Pending Votes Warning */}
      {hasPendingVotes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="font-semibold text-yellow-800">You have pending votes</h4>
              <p className="text-sm text-yellow-700">You've already voted on this poll. Your vote will be submitted when online.</p>
            </div>
          </div>
        </div>
      )}

      {/* Connection Status */}
      {isOffline && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
            </svg>
            <div>
              <h4 className="font-semibold text-orange-800">You're offline</h4>
              <p className="text-sm text-orange-700">Votes will be stored locally and submitted when you're back online.</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Poll Options */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Select your choice{poll.allowMultipleVotes ? 's' : ''}:</h3>
          
          {poll.options.map((option) => (
            <label
              key={option.id}
              className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedOptions.includes(option.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type={poll.type === 'single' ? 'radio' : 'checkbox'}
                name={poll.type === 'single' ? 'vote' : `vote-${option.id}`}
                value={option.id}
                checked={selectedOptions.includes(option.id)}
                onChange={() => handleOptionToggle(option.id)}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">{option.label}</div>
                {option.description && (
                  <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                )}
              </div>
            </label>
          ))}
        </div>

        {/* Anonymous Voting Option */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="anonymous"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="anonymous" className="text-sm text-gray-700">
            Vote anonymously (your vote will not be linked to your account)
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || selectedOptions.length === 0}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            isSubmitting || selectedOptions.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : isOffline
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center space-x-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Submitting...</span>
            </div>
          ) : isOffline ? (
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Store Vote Offline</span>
            </div>
          ) : (
            'Submit Vote'
          )}
        </button>
      </form>

      {/* Poll Info */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Poll Type:</span>
          <span className="font-medium capitalize">{poll.type}</span>
        </div>
        {poll.allowMultipleVotes && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Multiple Votes:</span>
            <span className="font-medium">Allowed</span>
          </div>
        )}
        {poll.endDate && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Ends:</span>
            <span className="font-medium">{new Date(poll.endDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  )
}
