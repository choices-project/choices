'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { motion } from 'framer-motion'
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Shield, 
  Zap, 
  Download, 
  RefreshCw,
  Vote,
  Users,
  BarChart3,
  Lock,
  Globe,
  CheckCircle,
  AlertCircle,
  Settings,
  Bell,
  Fingerprint,
  Database,
  Network,
  Cpu,
  HardDrive,
  Smartphone as Mobile,
  Star,
  Award,
  Target,
  TrendingUp
} from 'lucide-react'
import { useFeatureFlag } from '../../hooks/useFeatureFlags'
import { usePWAUtils } from '../../hooks/usePWAUtils'
import { PWAFeaturesShowcase, PWAStatus } from '../../components/PWAComponents'

export default function PWAFeaturesPage() {
  const { enabled: pwaEnabled, flag: pwaFlag } = useFeatureFlag('pwa')
  const { utils: pwaUtils, loading: utilsLoading, error: utilsError } = usePWAUtils()
  
  const [deviceFingerprint, setDeviceFingerprint] = useState<any>(null)
  const [pwaStatus, setPwaStatus] = useState<any>(null)
  const [metrics, setMetrics] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (pwaUtils && !utilsLoading) {
      // Get device fingerprint
      pwaUtils.pwaManager.getDeviceFingerprint().then(setDeviceFingerprint)
      
      // Get PWA status
      setPwaStatus(pwaUtils.pwaManager.getPWAStatus())
      
      // Get metrics
      setMetrics(pwaUtils.pwaAnalytics.getMetrics())
    }
  }, [pwaUtils, utilsLoading])

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Star },
    { id: 'features', label: 'Features', icon: Smartphone },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'privacy', label: 'Privacy', icon: Lock },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'testing', label: 'Testing', icon: Target }
  ]

  const featureCards = [
    {
      title: 'Offline Voting',
      description: 'Vote without internet connection. Votes are stored locally and synced when online.',
      icon: WifiOff,
      enabled: pwaEnabled,
      status: pwaStatus?.offlineVotes > 0 ? 'active' : 'available'
    },
    {
      title: 'WebAuthn Authentication',
      description: 'Biometric and hardware-based authentication for enhanced security.',
      icon: Fingerprint,
      enabled: pwaEnabled && deviceFingerprint?.webAuthn,
      status: 'available'
    },
    {
      title: 'Push Notifications',
      description: 'Real-time updates for new polls, results, and important announcements.',
      icon: Bell,
      enabled: pwaEnabled && deviceFingerprint?.pushNotifications,
      status: 'available'
    },
    {
      title: 'Background Sync',
      description: 'Automatic data synchronization when connection is restored.',
      icon: RefreshCw,
      enabled: pwaEnabled && deviceFingerprint?.backgroundSync,
      status: 'available'
    },
    {
      title: 'Encrypted Storage',
      description: 'Local data encryption for maximum privacy protection.',
      icon: Lock,
      enabled: pwaEnabled && deviceFingerprint?.encryptedStorage,
      status: 'available'
    },
    {
      title: 'App Installation',
      description: 'Install on home screen for native app-like experience.',
      icon: Download,
      enabled: pwaEnabled && deviceFingerprint?.installPrompt,
      status: pwaStatus?.installed ? 'active' : 'available'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600'
      case 'available': return 'text-blue-600'
      case 'unavailable': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle
      case 'available': return AlertCircle
      case 'unavailable': return AlertCircle
      default: return AlertCircle
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-xl">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">PWA Features</h1>
            </div>
            <div className="flex items-center space-x-2">
              {pwaEnabled ? (
                <div className="flex items-center space-x-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Enabled</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-gray-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Disabled</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Feature Flag Status */}
        <div className="mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Feature Flag Status</h2>
                <p className="text-sm text-gray-600 mt-1">
                  PWA features are controlled by the feature flags system
                </p>
              </div>
              <div className="text-right">
                <div className={`text-lg font-semibold ${pwaEnabled ? 'text-green-600' : 'text-gray-600'}`}>
                  {pwaEnabled ? 'Enabled' : 'Disabled'}
                </div>
                <div className="text-sm text-gray-500">
                  {pwaFlag?.category} feature
                </div>
              </div>
            </div>
            {pwaFlag && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">{pwaFlag.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-white rounded-lg border border-gray-200 p-1">
            {tabs.map((tab) => {
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

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Hero Section */}
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                  Progressive Web App
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                  Experience the future of web applications with our privacy-first PWA. 
                  Install it on your device and enjoy native app features with enhanced security.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Privacy-First</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
                    <Shield className="w-5 h-5" />
                    <span className="font-medium">Secure</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full">
                    <Zap className="w-5 h-5" />
                    <span className="font-medium">Fast</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featureCards.map((feature, index) => {
                const Icon = feature.icon
                const StatusIcon = getStatusIcon(feature.status)
                
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Icon className="w-6 h-6 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                      </div>
                      <StatusIcon className={`w-5 h-5 ${getStatusColor(feature.status)}`} />
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{feature.description}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${getStatusColor(feature.status)}`}>
                        {feature.status === 'active' ? 'Active' : 
                         feature.status === 'available' ? 'Available' : 'Unavailable'}
                      </span>
                      {!feature.enabled && (
                        <span className="text-xs text-gray-500">Feature flag disabled</span>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* PWA Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <PWAStatus />
              
              {/* Device Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Device Information
                </h3>
                {deviceFingerprint ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Platform:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {deviceFingerprint.platform}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Screen:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {deviceFingerprint.screenResolution}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Language:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {deviceFingerprint.language}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Timezone:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {deviceFingerprint.timezone}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">WebAuthn:</span>
                      <span className={`text-sm font-medium ${
                        deviceFingerprint.webAuthn ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {deviceFingerprint.webAuthn ? 'Supported' : 'Not Supported'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Loading device information...</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className="space-y-6">
            <PWAFeaturesShowcase />
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
              {metrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Core Web Vitals</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">First Contentful Paint</span>
                        <span className="text-sm font-medium text-gray-900">
                          {Math.round(metrics.firstContentfulPaint)}ms
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Largest Contentful Paint</span>
                        <span className="text-sm font-medium text-gray-900">
                          {Math.round(metrics.largestContentfulPaint)}ms
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Cumulative Layout Shift</span>
                        <span className="text-sm font-medium text-gray-900">
                          {metrics.cumulativeLayoutShift.toFixed(3)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">PWA Performance</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Load Time</span>
                        <span className="text-sm font-medium text-gray-900">
                          {Math.round(metrics.loadTime)}ms
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Service Worker</span>
                        <span className={`text-sm font-medium ${metrics.serviceWorkerRegistered ? 'text-green-600' : 'text-red-600'}`}>
                          {metrics.serviceWorkerRegistered ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Background Sync</span>
                        <span className="text-sm font-medium text-gray-900">
                          {metrics.backgroundSyncCount} times
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-6 h-6 text-green-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">WebAuthn Authentication</h4>
                      <p className="text-sm text-gray-600">Biometric and hardware-based security</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Lock className="w-6 h-6 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Encrypted Storage</h4>
                      <p className="text-sm text-gray-600">Local data encryption</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Fingerprint className="w-6 h-6 text-purple-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Device Fingerprinting</h4>
                      <p className="text-sm text-gray-600">Advanced bot detection</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Network className="w-6 h-6 text-orange-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">HTTPS Only</h4>
                      <p className="text-sm text-gray-600">Secure data transmission</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Database className="w-6 h-6 text-indigo-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Local Storage</h4>
                      <p className="text-sm text-gray-600">Client-side data management</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Cpu className="w-6 h-6 text-teal-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Trust Tiers</h4>
                      <p className="text-sm text-gray-600">Progressive verification system</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Lock className="w-6 h-6 text-green-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Data Minimization</h4>
                      <p className="text-sm text-gray-600">Only collect necessary data</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="w-6 h-6 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Pseudonymization</h4>
                      <p className="text-sm text-gray-600">Anonymous user identities</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="w-6 h-6 text-purple-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Differential Privacy</h4>
                      <p className="text-sm text-gray-600">Statistical privacy protection</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Settings className="w-6 h-6 text-orange-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">User Control</h4>
                      <p className="text-sm text-gray-600">Full data control and export</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Globe className="w-6 h-6 text-indigo-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Transparency</h4>
                      <p className="text-sm text-gray-600">Clear data usage disclosure</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <HardDrive className="w-6 h-6 text-teal-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Local Processing</h4>
                      <p className="text-sm text-gray-600">Client-side data processing</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics & Metrics</h3>
              {metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <div>
                    <label className="text-sm font-medium text-gray-700">Data Collected</label>
                    <p className="text-sm text-gray-900">{metrics.dataCollected} fields</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Testing Tab */}
        {activeTab === 'testing' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Testing & Validation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">PWA Testing</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Lighthouse PWA Audit</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Cross-browser Testing</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Mobile Compatibility</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Offline Functionality</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Feature Testing</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">WebAuthn Integration</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">Push Notifications</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">Background Sync</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">Encrypted Storage</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
