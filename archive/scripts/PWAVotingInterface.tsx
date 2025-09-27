'use client'

import { useState, useEffect } from 'react'
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
import { useFeatureFlags } from '../hooks/useFeatureFlags'
import { usePWAUtils } from '../hooks/usePWAUtils'
import { devLog } from '@/lib/logger';

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
  
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [showPWAFeatures, setShowPWAFeatures] = useState(false)

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

  const handleVote = async (choice: number) => {
    if (hasVoted || isVoting) return

    // Validate choice is within valid range
    if (choice < 0 || choice >= poll.options.length) {
      devLog('Invalid choice:', choice)
      return
    }

    setIsVoting(true)
    setSelectedChoice(choice)

    try {
      if (pwaFeatureEnabled && pwaUtils && !isOnline) {
        // Store offline vote
        await pwaUtils.pwaManager.storeOfflineVote({
          pollId: poll.id,
          choice
        })
        
        // Track offline action (PWA analytics is archived)
        // if (pwaUtils.pwaAnalytics) {
        //   pwaUtils.pwaAnalytics.trackOfflineAction()
        //   pwaUtils.pwaAnalytics.trackFeatureUsage('offlinevote')
        // }
        
        devLog('PWA: Vote stored offline')
      }

      // Call the parent vote handler with validated choice
      await onVote(choice)
      setHasVoted(true)
      
      // Track analytics (PWA analytics is archived)
      // if (pwaUtils && pwaUtils.pwaAnalytics) {
      //   pwaUtils.pwaAnalytics.trackFeatureUsage('votecast')
      //   pwaUtils.pwaAnalytics.trackDataCollection(1)
      // }
    } catch (error) {
      devLog('Vote failed:', error)
    } finally {
      setIsVoting(false)
    }
  }

  const calculatePercentage = (votes: number) => {
    return poll.totalVotes > 0 ? Math.round((votes / poll.totalVotes) * 100) : 0
  }

  const getTimeRemaining = () => {
    const now = new Date()
    const expires = new Date(poll.expiresAt)
    const diff = expires.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h`
    return 'Less than 1h'
  }

  const isExpired = () => {
    return new Date() > new Date(poll.expiresAt)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                <span>{getTimeRemaining()}</span>
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
            {poll.options.map((option: any, index: any) => (
              <motion.button
                key={index}
                onClick={() => handleVote(index)}
                disabled={isVoting}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  selectedChoice === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                } ${isVoting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                whileHover={!isVoting ? { scale: 1.02 } : {}}
                whileTap={!isVoting ? { scale: 0.98 } : {}}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{option}</span>
                  {isVoting && selectedChoice === index && (
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
                Your vote will be stored locally and synced when you're back online.
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
            {poll.options.map((option: any, index: any) => {
              const votes = poll.results?.[index] || 0
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
              Your vote has been stored offline and will sync when you're back online.
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
                      <div className={`w-2 h-2 rounded-full ${(JSON.parse(localStorage.getItem('offlineVotes') || '[]').length) > 0 ? 'bg-orange-500' : 'bg-gray-300'}`} />
                      <span className="text-gray-600">
                        {JSON.parse(localStorage.getItem('offlineVotes') || '[]').length} offline votes
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
