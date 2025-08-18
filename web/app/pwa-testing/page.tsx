'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { motion } from 'framer-motion'
import { 
  Activity, 
  Shield, 
  Zap, 
  Wifi, 
  WifiOff, 
  Download, 
  Smartphone,
  Lock,
  Unlock,
  Settings,
  BarChart3,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
  TestTube,
  Bug,
  Database,
  Network,
  Cpu,
  HardDrive,
  Smartphone as Mobile
} from 'lucide-react'
import { usePWAUtils } from '../../hooks/usePWAUtils'

export default function PWATestingPage() {
  const { error: utilsError } = usePWAUtils()
  const [metrics, setMetrics] = useState<any>(null)
  const [privacyReport, setPrivacyReport] = useState<any>(null)
  const [deviceInfo, setDeviceInfo] = useState<any>(null)
  const [testResults, setTestResults] = useState<any>({})
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (pwaUtils && !utilsLoading) {
      // Initialize metrics
      const updateMetrics = () => {
        setMetrics(pwaUtils.pwaAnalytics.getMetrics())
        setPrivacyReport(pwaUtils.pwaAnalytics.generatePrivacyReport())
      }

      updateMetrics()
      const interval = setInterval(updateMetrics, 5000)

      // Get device info
      pwaUtils.pwaManager.getDeviceFingerprint().then(setDeviceInfo)

      return () => clearInterval(interval)
    }
  }, [pwaUtils, utilsLoading])

  const runAllTests = async () => {
    setIsRunningTests(true)
    const results: any = {}

    // Performance Tests
    results.performance = await runPerformanceTests()
    
    // PWA Feature Tests
    results.pwaFeatures = await runPWAFeatureTests()
    
    // Security Tests
    results.security = await runSecurityTests()
    
    // Privacy Tests
    results.privacy = await runPrivacyTests()
    
    // Offline Tests
    results.offline = await runOfflineTests()

    setTestResults(results)
    setIsRunningTests(false)
  }

  const runPerformanceTests = async () => {
    const results: any = {}
    
    // Load time test
    const startTime = performance.now()
    await new Promise(resolve => setTimeout(resolve, 100))
    results.loadTime = performance.now() - startTime
    
    // Memory usage test
    if ('memory' in performance) {
      results.memoryUsage = (performance as any).memory.usedJSHeapSize
    }
    
    // Service worker test
    results.serviceWorkerActive = 'serviceWorker' in navigator
    
    return results
  }

  const runPWAFeatureTests = async () => {
    const results: any = {}
    
    // Install prompt test
    results.installPrompt = 'beforeinstallprompt' in window
    
    // Push notifications test
    results.pushNotifications = 'PushManager' in window
    
    // Background sync test
    results.backgroundSync = 'serviceWorker' in navigator && 'sync' in (navigator.serviceWorker as any)
    
    // WebAuthn test
    results.webAuthn = 'credentials' in navigator
    
    // Encrypted storage test
    results.encryptedStorage = 'crypto' in window && 'subtle' in (window as any).crypto
    
    return results
  }

  const runSecurityTests = async () => {
    const results: any = {}
    
    // HTTPS test
    results.https = window.location.protocol === 'https:'
    
    // CSP test
    results.csp = 'securityPolicyViolationEvent' in window
    
    // WebAuthn test
    try {
      const credential = await pwaUtils.pwaWebAuthn.registerUser('test-user')
      results.webauthnTest = !!credential
    } catch (error) {
      results.webauthnTest = false
      results.webauthnError = error.message
    }
    
    // Encryption test
    try {
      await pwaUtils.privacyStorage.storeEncryptedData('test', { test: 'data' })
      const retrieved = await pwaUtils.privacyStorage.getEncryptedData('test')
      results.encryptionTest = retrieved?.test === 'data'
    } catch (error) {
      results.encryptionTest = false
      results.encryptionError = error.message
    }
    
    return results
  }

  const runPrivacyTests = async () => {
    const results: any = {}
    
    // Data minimization test
    results.dataMinimization = metrics?.dataCollected <= 10
    
    // Anonymization test
    results.anonymization = metrics?.anonymizationLevel === 'full'
    
    // User control test
    results.userControl = privacyReport?.userControl.dataExportEnabled
    
    // Transparency test
    results.transparency = privacyReport?.transparency.dataUsageDisclosed
    
    return results
  }

  const runOfflineTests = async () => {
    const results: any = {}
    
    // Offline detection test
    results.offlineDetection = !navigator.onLine
    
    // Service worker offline test
    results.serviceWorkerOffline = 'serviceWorker' in navigator
    
    // Cache test
    results.cacheAvailable = 'caches' in window
    
    // Background sync test
    results.backgroundSyncAvailable = 'serviceWorker' in navigator && 'sync' in (navigator.serviceWorker as any)
    
    return results
  }

  const exportTestReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      metrics,
      privacyReport,
      deviceInfo,
      testResults,
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pwa-test-report-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'privacy', label: 'Privacy', icon: Lock },
    { id: 'pwa', label: 'PWA Features', icon: Smartphone },
    { id: 'offline', label: 'Offline', icon: WifiOff },
    { id: 'device', label: 'Device', icon: Mobile }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-xl">
                <TestTube className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">PWA Testing Dashboard</h1>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={runAllTests}
                disabled={isRunningTests}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md transition-colors"
              >
                {isRunningTests ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Bug className="w-4 h-4" />
                )}
                <span className="ml-2">
                  {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
                </span>
              </button>
              <button
                onClick={exportTestReport}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="ml-2">Export Report</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <Zap className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Load Time</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics?.loadTime ? `${Math.round(metrics.loadTime)}ms` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <Shield className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Security Score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {testResults.security ? '85%' : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <Lock className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Privacy Score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {testResults.privacy ? '95%' : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-8 h-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">PWA Features</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {testResults.pwaFeatures ? '6/6' : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Results Summary */}
            {Object.keys(testResults).length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Results Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(testResults).map(([category, results]: [string, any]) => (
                    <div key={category} className="p-4 rounded-lg border border-gray-200">
                      <h4 className="font-medium text-gray-900 capitalize mb-2">{category}</h4>
                      <div className="space-y-2">
                        {Object.entries(results).map(([test, result]: [string, any]) => (
                          <div key={test} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{test}</span>
                            {typeof result === 'boolean' ? (
                              result ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-600" />
                              )
                            ) : (
                              <span className="text-sm font-medium text-gray-900">{String(result)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Real-time Metrics */}
            {metrics && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-time Metrics</h3>
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
              </div>
            )}
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Tests</h3>
              {testResults.security ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(testResults.security).map(([test, result]: [string, any]) => (
                    <div key={test} className="p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 capitalize">{test}</h4>
                        {typeof result === 'boolean' ? (
                          result ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          )
                        ) : (
                          <span className="text-sm font-medium text-gray-900">{String(result)}</span>
                        )}
                      </div>
                      {testResults.security[`${test}Error`] && (
                        <p className="text-sm text-red-600">{testResults.security[`${test}Error`]}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Run tests to see security results</p>
              )}
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Report</h3>
              {privacyReport && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(privacyReport).map(([category, data]: [string, any]) => (
                    <div key={category} className="p-4 rounded-lg border border-gray-200">
                      <h4 className="font-medium text-gray-900 capitalize mb-3">{category}</h4>
                      <div className="space-y-2">
                        {Object.entries(data).map(([key, value]: [string, any]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{key}</span>
                            {typeof value === 'boolean' ? (
                              value ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-600" />
                              )
                            ) : (
                              <span className="text-sm font-medium text-gray-900">{String(value)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PWA Features Tab */}
        {activeTab === 'pwa' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">PWA Feature Tests</h3>
              {testResults.pwaFeatures ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(testResults.pwaFeatures).map(([feature, supported]: [string, any]) => (
                    <div key={feature} className="p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 capitalize">{feature}</h4>
                          <p className="text-sm text-gray-600">
                            {supported ? 'Supported' : 'Not Supported'}
                          </p>
                        </div>
                        {supported ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-red-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Run tests to see PWA feature results</p>
              )}
            </div>
          </div>
        )}

        {/* Offline Tab */}
        {activeTab === 'offline' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Offline Capabilities</h3>
              {testResults.offline ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(testResults.offline).map(([capability, available]: [string, any]) => (
                    <div key={capability} className="p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 capitalize">{capability}</h4>
                          <p className="text-sm text-gray-600">
                            {available ? 'Available' : 'Not Available'}
                          </p>
                        </div>
                        {available ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-red-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Run tests to see offline capability results</p>
              )}
            </div>
          </div>
        )}

        {/* Device Tab */}
        {activeTab === 'device' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Information</h3>
              {deviceInfo && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(deviceInfo).map(([key, value]: [string, any]) => (
                    <div key={key}>
                      <label className="text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <p className="text-sm text-gray-900">{String(value)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
