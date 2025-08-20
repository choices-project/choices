'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { devLog } from '@/lib/logger';
import { motion } from 'framer-motion'
import { 
  Vote, 
  Users, 
  BarChart3, 
  Shield, 
  Smartphone, 
  Wifi, 
  WifiOff,
  Zap,
  Lock,
  Fingerprint,
  RefreshCw,
  Download,
  Settings,
  User,
  Bell,
  Globe,
  TrendingUp,
  Activity,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { usePWAUtils } from '../../hooks/usePWAUtils'
import { PWAVotingInterface } from '../../components/PWAVotingInterface'
import { PWAUserProfile } from '../../components/PWAUserProfile'
import { PWAFeaturesShowcase } from '../../components/PWAComponents'

// Import PWAUser type separately to avoid SSR issues
import type { PWAUser } from '../../lib/pwa-auth-integration'

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

export default function PWAAppPage() {
  const { utils: pwaUtils, loading: utilsLoading, error: utilsError } = usePWAUtils()
  const [currentUser, setCurrentUser] = useState<PWAUser | null>(null)
  const [isOnline, setIsOnline] = useState(false)
  const [activeTab, setActiveTab] = useState('polls')
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<any>(null)
  const [showProfile, setShowProfile] = useState(false)

  const initializeApp = useCallback(async () => {
    if (!pwaUtils) return
    
    try {
      // Check for existing user
      const user = pwaUtils.pwaAuth.getCurrentUser()
      setCurrentUser(user)

      // Load polls
      await loadPolls()

      // Get metrics
      setMetrics(pwaUtils.pwaAnalytics.getMetrics())

      // Check online status
      setIsOnline(navigator.onLine)

      // Set up event listeners
      window.addEventListener('online', () => setIsOnline(true))
      window.addEventListener('offline', () => setIsOnline(false))

      setLoading(false)
    } catch (error) {
      devLog('App initialization failed:', error)
      setLoading(false)
    }
  }, [pwaUtils])

  useEffect(() => {
    if (pwaUtils && !utilsLoading) {
      initializeApp()
    }
  }, [pwaUtils, utilsLoading, initializeApp])

  const loadPolls = async () => {
    try {
      // Mock polls data - in real app this would come from API
      const mockPolls: Poll[] = [
        {
          id: '1',
          question: 'What is the most important issue facing our community?',
          options: ['Healthcare', 'Education', 'Environment', 'Economy'],
          totalVotes: 1247,
          results: { 0: 456, 1: 234, 2: 345, 3: 212 },
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'Community',
          isActive: true
        },
        {
          id: '2',
          question: 'How should we prioritize local infrastructure projects?',
          options: ['Roads & Bridges', 'Public Transit', 'Parks & Recreation', 'Utilities'],
          totalVotes: 892,
          results: { 0: 234, 1: 345, 2: 178, 3: 135 },
          expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'Infrastructure',
          isActive: true
        },
        {
          id: '3',
          question: 'Which environmental initiative should receive funding?',
          options: ['Renewable Energy', 'Waste Reduction', 'Green Spaces', 'Clean Water'],
          totalVotes: 1567,
          results: { 0: 567, 1: 234, 2: 456, 3: 310 },
          expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'Environment',
          isActive: true
        }
      ]

      setPolls(mockPolls)
    } catch (error) {
      devLog('Failed to load polls:', error)
    }
  }

  const handleCreateUser = async () => {
    if (!pwaUtils) return
    
    try {
      const user = await pwaUtils.pwaAuth.createUser()
      setCurrentUser(user)
    } catch (error) {
      devLog('Failed to create user:', error)
    }
  }

  const handleEnableWebAuthn = async () => {
    if (!currentUser) return
    
    if (!pwaUtils) return
    
    try {
      const success = await pwaUtils.pwaAuth.enableWebAuthn(currentUser.stableId)
      if (success) {
        setCurrentUser(pwaUtils.pwaAuth.getCurrentUser())
      }
    } catch (error) {
      devLog('Failed to enable WebAuthn:', error)
    }
  }

  const handleEnableNotifications = async () => {
    if (!currentUser || !pwaUtils) return
    
    try {
      const success = await pwaUtils.pwaAuth.enablePushNotifications(currentUser.stableId)
      if (success) {
        setCurrentUser(pwaUtils.pwaAuth.getCurrentUser())
      }
    } catch (error) {
      devLog('Failed to enable notifications:', error)
    }
  }

  const handleVote = (pollId: string, choice: number) => {
    // Update poll results locally
    setPolls(prevPolls => 
      prevPolls.map(poll => 
        poll.id === pollId 
          ? {
              ...poll,
              totalVotes: poll.totalVotes + 1,
              results: {
                ...poll.results,
                [choice]: (poll.results?.[choice] || 0) + 1
              }
            }
          : poll
      )
    )
  }

  const tabs = [
    { id: 'polls', label: 'Polls', icon: Vote },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'features', label: 'PWA Features', icon: Smartphone },
    { id: 'profile', label: 'Profile', icon: User }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading PWA App...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-xl">
                <Vote className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Choices PWA</h1>
            </div>
            
            <div className="flex items-center space-x-4">
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

              {/* User Status */}
              {currentUser ? (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Shield className="w-4 h-4" />
                    <span>{currentUser.trustTier}</span>
                  </div>
                  <button
                    onClick={() => setShowProfile(!showProfile)}
                    className="p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <User className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleCreateUser}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Get Started
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-white rounded-lg border border-gray-200 p-1">
            {tabs.map((tab: any) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Polls Tab */}
        {activeTab === 'polls' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <Vote className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Active Polls</p>
                    <p className="text-2xl font-bold text-gray-900">{polls.filter(p => p.isActive).length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <Users className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Votes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {polls.reduce((sum: any, poll: any) => sum + poll.totalVotes, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Your Trust Score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {currentUser?.verificationScore || 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Polls List */}
            <div className="space-y-6">
              {polls.map((poll: any) => (
                <div key={poll.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <PWAVotingInterface
                    poll={poll}
                    onVote={(choice) => handleVote(poll.id, choice)}
                    showResults={true}
                    offlineMode={!isOnline}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {metrics && (
              <>
                {/* Performance Metrics */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Load Time</label>
                      <p className="text-sm text-gray-900">{Math.round(metrics.loadTime)}ms</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Session Duration</label>
                      <p className="text-sm text-gray-900">{Math.round(metrics.sessionDuration / 1000)}s</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Features Used</label>
                      <p className="text-sm text-gray-900">{metrics.featuresUsed.length}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Offline Actions</label>
                      <p className="text-sm text-gray-900">{metrics.offlineActions}</p>
                    </div>
                  </div>
                </div>

                {/* PWA Metrics */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">PWA Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${metrics.serviceWorkerRegistered ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-sm text-gray-600">
                        Service Worker {metrics.serviceWorkerRegistered ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${metrics.webAuthnUsed ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm text-gray-600">
                        WebAuthn {metrics.webAuthnUsed ? 'Used' : 'Not Used'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${metrics.offlineUsage > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm text-gray-600">
                        Offline Usage {metrics.offlineUsage} times
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* PWA Features Tab */}
        {activeTab === 'features' && (
          <div className="space-y-6">
            <PWAFeaturesShowcase />
            
            {/* Feature Controls */}
            {currentUser && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Enable PWA Features</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Fingerprint className="w-5 h-5 text-blue-600" />
                        <h4 className="font-medium text-gray-900">WebAuthn Authentication</h4>
                      </div>
                      {currentUser.pwaFeatures?.webAuthnEnabled ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Enable biometric authentication for enhanced security
                    </p>
                    {!currentUser.pwaFeatures?.webAuthnEnabled && (
                      <button
                        onClick={handleEnableWebAuthn}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm transition-colors"
                      >
                        Enable WebAuthn
                      </button>
                    )}
                  </div>

                  <div className="p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Bell className="w-5 h-5 text-orange-600" />
                        <h4 className="font-medium text-gray-900">Push Notifications</h4>
                      </div>
                      {currentUser.pwaFeatures?.pushNotificationsEnabled ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Get notified about new polls and results
                    </p>
                    {!currentUser.pwaFeatures?.pushNotificationsEnabled && (
                      <button
                        onClick={handleEnableNotifications}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-md text-sm transition-colors"
                      >
                        Enable Notifications
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div>
            {currentUser ? (
              <PWAUserProfile user={currentUser} />
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Profile Found</h3>
                <p className="text-gray-600 mb-4">Create a profile to get started with PWA features</p>
                <button
                  onClick={handleCreateUser}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Create Profile
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
