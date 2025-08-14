'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Vote, 
  CheckCircle, 
  AlertCircle, 
  Wifi, 
  WifiOff, 
  Shield, 
  Lock,
  Clock,
  Users,
  BarChart3,
  Fingerprint,
  Zap,
  RefreshCw,
  Download,
  Upload,
  Eye,
  EyeOff,
  Smartphone,
  Globe
} from 'lucide-react'
import { pwaAuth, PWAUser } from '../lib/pwa-auth-integration'
import { pwaManager } from '../lib/pwa-utils'
import { pwaAnalytics } from '../lib/pwa-analytics'

interface Poll {
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

interface PWAVotingInterfaceProps {
  poll: Poll
  onVote?: (choice: number) => void
  showResults?: boolean
  offlineMode?: boolean
}

export function PWAVotingInterface({ 
  poll, 
  onVote, 
  showResults = false, 
  offlineMode = false 
}: PWAVotingInterfaceProps) {
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null)
  const [isVoting, setIsVoting] = useState(false)
  const [voteSubmitted, setVoteSubmitted] = useState(false)
  const [currentUser, setCurrentUser] = useState<PWAUser | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false)
  const [voteHistory, setVoteHistory] = useState<any[]>([])
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'failed'>('synced')

  useEffect(() => {
    // Get current user
    const user = pwaAuth.getCurrentUser()
    setCurrentUser(user)

    // Check online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Load vote history
    loadVoteHistory()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const loadVoteHistory = async () => {
    try {
      // Load from encrypted storage
      const history = await pwaManager.getDeviceFingerprint()
      // This would be loaded from encrypted storage in a real implementation
      setVoteHistory([])
    } catch (error) {
      console.error('Failed to load vote history:', error)
    }
  }

  const handleVote = async (choice: number) => {
    if (!currentUser) {
      // Create anonymous user if none exists
      try {
        const newUser = await pwaAuth.createUser()
        setCurrentUser(newUser)
      } catch (error) {
        console.error('Failed to create user:', error)
        return
      }
    }

    setIsVoting(true)
    setSelectedChoice(choice)

    try {
      // Vote with PWA enhancements
      const success = await pwaAuth.vote(poll.id, choice, !isOnline)
      
      if (success) {
        setVoteSubmitted(true)
        
        // Track analytics
        pwaAnalytics.trackFeatureUsage(isOnline ? 'online_vote_success' : 'offline_vote_success')
        
        // Update sync status
        if (!isOnline) {
          setSyncStatus('pending')
        }
        
        // Call parent callback
        if (onVote) {
          onVote(choice)
        }
      } else {
        throw new Error('Vote failed')
      }
    } catch (error) {
      console.error('Vote failed:', error)
      pwaAnalytics.trackFeatureUsage('vote_failed')
    } finally {
      setIsVoting(false)
    }
  }

  const syncOfflineVotes = async () => {
    if (syncStatus === 'pending' && isOnline) {
      setSyncStatus('synced')
      pwaAnalytics.trackFeatureUsage('offline_votes_synced')
    }
  }

  const getVotePercentage = (choice: number) => {
    if (!poll.results || poll.totalVotes === 0) return 0
    return Math.round((poll.results[choice] / poll.totalVotes) * 100)
  }

  const getTrustTierColor = (tier: string) => {
    const colors = {
      T0: 'text-gray-600 bg-gray-100',
      T1: 'text-blue-600 bg-blue-100',
      T2: 'text-green-600 bg-green-100',
      T3: 'text-purple-600 bg-purple-100'
    }
    return colors[tier as keyof typeof colors] || colors.T0
  }

  const getTrustTierName = (tier: string) => {
    const names = {
      T0: 'Anonymous',
      T1: 'Verified',
      T2: 'Trusted',
      T3: 'Validator'
    }
    return names[tier as keyof typeof names] || 'Unknown'
  }

  return (
    <div className="space-y-6">
      {/* Poll Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{poll.question}</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{poll.totalVotes} votes</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Expires {new Date(poll.expiresAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Globe className="w-4 h-4" />
                <span>{poll.category}</span>
              </div>
            </div>
          </div>
          
          {/* Online/Offline Status */}
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <div className="flex items-center space-x-1 text-green-600">
                <Wifi className="w-4 h-4" />
                <span className="text-sm">Online</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-orange-600">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm">Offline</span>
              </div>
            )}
          </div>
        </div>

        {/* User Trust Tier */}
        {currentUser && (
          <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200">
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getTrustTierColor(currentUser.trustTier)}`}>
              {getTrustTierName(currentUser.trustTier)}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Shield className="w-4 h-4" />
              <span>Trust Score: {currentUser.verificationScore}%</span>
            </div>
            {currentUser.pwaFeatures?.webAuthnEnabled && (
              <div className="flex items-center space-x-1 text-blue-600">
                <Fingerprint className="w-4 h-4" />
                <span className="text-sm">WebAuthn</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Voting Options */}
      {!voteSubmitted && poll.isActive && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cast Your Vote</h3>
          
          <div className="space-y-3">
            {poll.options.map((option, index) => (
              <motion.button
                key={index}
                onClick={() => handleVote(index)}
                disabled={isVoting}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedChoice === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                } ${isVoting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                whileHover={!isVoting ? { scale: 1.02 } : {}}
                whileTap={!isVoting ? { scale: 0.98 } : {}}
              >
                <div className="flex items-center justify-between">
                  <span className="text-left font-medium text-gray-900">{option}</span>
                  {selectedChoice === index && isVoting && (
                    <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                  )}
                </div>
              </motion.button>
            ))}
          </div>

          {/* Privacy Notice */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <Lock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Privacy-First Voting</p>
                <p>Your vote is encrypted and anonymized. No personal data is shared with the server.</p>
              </div>
            </div>
          </div>

          {/* Offline Notice */}
          {!isOnline && (
            <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-start space-x-2">
                <WifiOff className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-orange-800">
                  <p className="font-medium">Offline Mode</p>
                  <p>Your vote will be stored locally and synced when you're back online.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vote Confirmation */}
      {voteSubmitted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 rounded-lg border border-green-200 p-6"
        >
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-green-800">Vote Submitted!</h3>
              <p className="text-green-700">
                {isOnline 
                  ? 'Your vote has been recorded successfully.'
                  : 'Your vote has been stored locally and will sync when online.'
                }
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Results */}
      {showResults && poll.results && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Results</h3>
          
          <div className="space-y-4">
            {poll.options.map((option, index) => {
              const percentage = getVotePercentage(index)
              const votes = poll.results?.[index] || 0
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-900">{option}</span>
                    <span className="text-gray-600">{votes} votes ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-blue-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Sync Status */}
      {syncStatus === 'pending' && isOnline && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 rounded-lg border border-blue-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Upload className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800">Syncing offline votes...</span>
            </div>
            <button
              onClick={syncOfflineVotes}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Sync Now
            </button>
          </div>
        </motion.div>
      )}

      {/* PWA Features */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">PWA Features</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200">
            <Smartphone className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">Offline Voting</p>
              <p className="text-sm text-gray-600">Vote without internet connection</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200">
            <Shield className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">Secure Authentication</p>
              <p className="text-sm text-gray-600">WebAuthn biometric verification</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200">
            <Lock className="w-5 h-5 text-purple-600" />
            <div>
              <p className="font-medium text-gray-900">Encrypted Storage</p>
              <p className="text-sm text-gray-600">Local data protection</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200">
            <Zap className="w-5 h-5 text-orange-600" />
            <div>
              <p className="font-medium text-gray-900">Background Sync</p>
              <p className="text-sm text-gray-600">Automatic data synchronization</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vote History */}
      {voteHistory.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Votes</h3>
          
          <div className="space-y-2">
            {voteHistory.slice(0, 5).map((vote, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <span className="text-sm text-gray-700">{vote.pollQuestion}</span>
                <span className="text-sm font-medium text-gray-900">{vote.choice}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
